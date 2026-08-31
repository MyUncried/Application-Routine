# KODJO-CLAUDE-SESSION-STORE-RESUME-02

Technical micro-test only. `business_write=false`; `implementation_authorized=false`.

## Hypothesis

Python Claude Agent SDK `0.2.148` mirrors the BASE transcript through its public `SessionStore` contract to S3. A distinct RESUME workflow run loads that transcript through the same contract and calls `query(..., resume=session_id)` from the same fixed working directory.

This is not checkpoint reconstruction. RESUME receives neither the marker nor any prompt/context checkpoint. The only durable object containing the marker is the SDK-owned opaque transcript in the SessionStore backend.

## Storage and authentication

- Transcript backend: private S3 bucket, server-side encryption, OIDC-only GitHub role.
- Control records: S3 `control/*.json`; they contain session identity, hashes, counters and verdicts, never the marker.
- Claude authentication: existing `CLAUDE_CODE_OAUTH_TOKEN` GitHub secret passed directly to the Agent SDK/CLI subprocess.
- Required GitHub environment: `kodjo-sessionstore-test`.
- Required variables: `KODJO_SESSION_STORE_AWS_ROLE_ARN`, `KODJO_SESSION_STORE_AWS_REGION`, `KODJO_SESSION_STORE_S3_BUCKET`.

## Gates and calls

`PREFLIGHT` never calls `query()` and must complete first. `BASE.claim.json` and `RESUME.claim.json` use S3 conditional creation (`If-None-Match: *`) before their respective model call. A duplicate stage fails before Claude. There is no retry, fallback or third stage.

Counter states: absent claims = `0/2`; durable BASE claim = `1/2`; durable RESUME claim = `2/2`. A claim is counted even if the following model invocation fails.

## Verdicts

- `DÉMONTRÉ`: store `load()` was used, returned session ID equals BASE session ID, no fork/new session, and the returned marker hash equals BASE's non-reversible SHA-256 evidence.
- `NON_DÉMONTRÉ`: resume fails, store is not loaded, identity changes, or marker mismatch/loss.
- `NON_VÉRIFIABLE`: SDK traces/results cannot establish store load plus technical identity.

The marker itself must never be logged, written to GitHub, placed in a workflow input, manifest, artifact, control record, checkpoint, environment variable, or RESUME prompt. It exists only in BASE process memory and the opaque SDK session transcript stored in S3.
