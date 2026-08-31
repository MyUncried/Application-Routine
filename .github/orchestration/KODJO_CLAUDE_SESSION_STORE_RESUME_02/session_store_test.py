#!/usr/bin/env python3
"""KODJO-CLAUDE-SESSION-STORE-RESUME-02 runner. Never logs the marker."""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import secrets
import sys
import time
import uuid
from typing import Any

import boto3
from botocore.exceptions import ClientError
from claude_agent_sdk import ClaudeAgentOptions, ResultMessage, SessionStore, query

TEST_ID = "KODJO-CLAUDE-SESSION-STORE-RESUME-02"
PROJECT_KEY = "kodjo-claude-session-store-resume-02"
RUN_CWD = "/tmp/kodjo-claude-session-store-resume-02"


class S3SessionStore:
    """Opaque JSONL-part store following Anthropic's published SessionStore contract."""

    def __init__(self, bucket: str, prefix: str):
        self.client = boto3.client("s3")
        self.bucket = bucket
        self.prefix = prefix.strip("/")
        self.append_count = 0
        self.load_count = 0

    def _base(self, key: dict[str, Any]) -> str:
        suffix = key.get("subpath") or "main"
        return f"{self.prefix}/transcripts/{key['project_key']}/{key['session_id']}/{suffix}"

    async def append(self, key: dict[str, Any], entries: list[dict[str, Any]]) -> None:
        if not entries:
            return
        object_key = f"{self._base(key)}/parts/{time.time_ns()}-{uuid.uuid4()}.jsonl"
        body = "".join(json.dumps(entry, separators=(",", ":")) + "\n" for entry in entries)
        await asyncio.to_thread(
            self.client.put_object,
            Bucket=self.bucket,
            Key=object_key,
            Body=body.encode(),
            ContentType="application/x-ndjson",
            ServerSideEncryption="AES256",
        )
        self.append_count += 1

    async def load(self, key: dict[str, Any]) -> list[dict[str, Any]] | None:
        prefix = f"{self._base(key)}/parts/"
        paginator = self.client.get_paginator("list_objects_v2")
        pages = await asyncio.to_thread(lambda: list(paginator.paginate(Bucket=self.bucket, Prefix=prefix)))
        keys = sorted(item["Key"] for page in pages for item in page.get("Contents", []))
        if not keys:
            return None
        entries: list[dict[str, Any]] = []
        for object_key in keys:
            response = await asyncio.to_thread(self.client.get_object, Bucket=self.bucket, Key=object_key)
            raw = await asyncio.to_thread(response["Body"].read)
            entries.extend(json.loads(line) for line in raw.decode().splitlines() if line)
        self.load_count += 1
        return entries

def s3_client():
    return boto3.client("s3")


def bucket() -> str:
    value = os.environ.get("KODJO_SESSION_STORE_BUCKET", "")
    if not value:
        raise RuntimeError("KODJO_SESSION_STORE_BUCKET is required")
    return value


def prefix() -> str:
    value = os.environ.get("KODJO_SESSION_STORE_PREFIX", TEST_ID).strip("/")
    if not value:
        raise RuntimeError("KODJO_SESSION_STORE_PREFIX must not be empty")
    return value


def put_once(key: str, document: dict[str, Any]) -> None:
    try:
        s3_client().put_object(
            Bucket=bucket(), Key=f"{prefix()}/control/{key}",
            Body=json.dumps(document, separators=(",", ":")).encode(),
            ContentType="application/json", ServerSideEncryption="AES256", IfNoneMatch="*",
        )
    except ClientError as error:
        if error.response.get("ResponseMetadata", {}).get("HTTPStatusCode") == 412:
            raise RuntimeError(f"durable lock already exists: {key}") from error
        raise


def get_json(key: str) -> dict[str, Any]:
    response = s3_client().get_object(Bucket=bucket(), Key=f"{prefix()}/control/{key}")
    return json.loads(response["Body"].read())


def store() -> S3SessionStore:
    return S3SessionStore(bucket(), prefix())


def options(session_store: SessionStore, *, resume: str | None = None) -> ClaudeAgentOptions:
    return ClaudeAgentOptions(
        cwd=RUN_CWD,
        tools=[], allowed_tools=[], disallowed_tools=["Bash", "Read", "Write", "Edit", "WebFetch", "WebSearch"],
        setting_sources=[], max_turns=1, fallback_model=None, session_store=session_store,
        session_store_flush="eager", resume=resume, fork_session=False,
        env={"CLAUDE_CODE_OAUTH_TOKEN": os.environ["CLAUDE_CODE_OAUTH_TOKEN"], "CLAUDE_CODE_MAX_RETRIES": "0"},
    )


async def base() -> None:
    run_id = os.environ["GITHUB_RUN_ID"]
    put_once("BASE.claim.json", {"test_id": TEST_ID, "stage": "BASE", "status": "CLAIMED", "run_id": run_id, "counter_before": 0, "counter_after_claim": 1, "business_write": False, "implementation_authorized": False})
    marker = secrets.token_urlsafe(32)
    print(f"::add-mask::{marker}")
    marker_hash = hashlib.sha256(marker.encode()).hexdigest()
    active_store = store()
    session_id = None
    prompt = "Memorize this continuity marker exactly. Do not repeat it now: " + marker
    try:
        async for message in query(prompt=prompt, options=options(active_store)):
            if isinstance(message, ResultMessage):
                session_id = message.session_id
    except Exception as error:
        put_once("BASE.result.json", {"test_id": TEST_ID, "stage": "BASE", "status": "ERROR", "run_id": run_id, "error_type": type(error).__name__, "counter_after": 1, "fallback": "NONE", "business_write": False, "implementation_authorized": False})
        raise
    if not session_id or active_store.append_count < 1:
        raise RuntimeError("BASE did not yield a durable mirrored session")
    put_once("BASE.result.json", {"test_id": TEST_ID, "stage": "BASE", "status": "SUCCESS", "run_id": run_id, "session_id": session_id, "marker_sha256": marker_hash, "store_append_count": active_store.append_count, "counter_after": 1, "fallback": "NONE", "business_write": False, "implementation_authorized": False})


async def resume() -> None:
    run_id = os.environ["GITHUB_RUN_ID"]
    base_result = get_json("BASE.result.json")
    session_id = base_result["session_id"]
    put_once("RESUME.claim.json", {"test_id": TEST_ID, "stage": "RESUME", "status": "CLAIMED", "run_id": run_id, "requested_session_id": session_id, "counter_before": 1, "counter_after_claim": 2, "business_write": False, "implementation_authorized": False})
    active_store = store()
    returned_session_id = None
    answer = None
    try:
        async for message in query(prompt="Return only the continuity marker you were asked to remember in the previous run.", options=options(active_store, resume=session_id)):
            if isinstance(message, ResultMessage):
                returned_session_id = message.session_id
                answer = message.result.strip() if message.result else ""
    except Exception as error:
        put_once("RESUME.result.json", {"test_id": TEST_ID, "stage": "RESUME", "status": "ERROR", "run_id": run_id, "requested_session_id": session_id, "store_load_count": active_store.load_count, "error_type": type(error).__name__, "verdict": "NON_DÉMONTRÉ", "counter_after": 2, "fallback": "NONE", "business_write": False, "implementation_authorized": False})
        raise
    marker_match = bool(answer) and hashlib.sha256(answer.encode()).hexdigest() == base_result["marker_sha256"]
    technical_identity = returned_session_id == session_id and active_store.load_count >= 1
    verdict = "NON_VÉRIFIABLE" if active_store.load_count < 1 else ("DÉMONTRÉ" if technical_identity and marker_match else "NON_DÉMONTRÉ")
    put_once("RESUME.result.json", {"test_id": TEST_ID, "stage": "RESUME", "status": "SUCCESS", "run_id": run_id, "requested_session_id": session_id, "returned_session_id": returned_session_id, "store_load_count": active_store.load_count, "technical_identity": technical_identity, "marker_match": marker_match, "verdict": verdict, "counter_after": 2, "fallback": "NONE", "business_write": False, "implementation_authorized": False})


async def preflight() -> None:
    first = store()
    key = {"project_key": PROJECT_KEY, "session_id": str(uuid.uuid4())}
    entries = [{"type": "test", "uuid": str(uuid.uuid4()), "sessionId": key["session_id"]}]
    await first.append(key, entries)
    second = store()
    loaded = await second.load(key)
    if loaded != entries or second.load_count != 1:
        raise RuntimeError("distinct-instance S3 WRITE/READ preflight failed")
    put_once("PREFLIGHT.result.json", {"test_id": TEST_ID, "stage": "PREFLIGHT", "status": "WRITE_READ_PROVEN", "run_id": os.environ["GITHUB_RUN_ID"], "sdk_version": "0.2.148", "distinct_store_instances": True, "claude_called": False, "business_write": False, "implementation_authorized": False})


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("stage", choices=["preflight", "base", "resume"])
    stage = parser.parse_args().stage
    os.makedirs(RUN_CWD, exist_ok=True)
    if stage == "preflight": asyncio.run(preflight())
    elif stage == "base": asyncio.run(base())
    else: asyncio.run(resume())


if __name__ == "__main__":
    main()
