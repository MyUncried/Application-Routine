# KODJO orchestration operational state

The active operational checkpoint is persisted as a single mutable Issue comment beginning with `[KODJO_CHECKPOINT_ACTIVE]` on the active tranche Issue. The comment contains one JSON object with schema `kodjo.checkpoint.v1`.

The active checkpoint is replaced in place; it is not accumulated. Historical Issue comments and Git commits remain audit evidence but are not concatenated into the working context.

The event router validates the active checkpoint before materializing any `[KODJO_EVENT] CHATGPT_RESUME_REQUIRED` handoff. Such an event is a resume signal only and never an authorization to write business files.

For V1.4 LOCAL option 3, GitHub remains the durable control plane and Claude Code local is the nominal Claude executor. Claude is awakened manually by the user with the single canonical instruction `Reprends le protocole KODJO depuis le dernier checkpoint GitHub.` The Windows self-hosted runner remains validated technical infrastructure and historical evidence, but it is not the nominal Claude wake mechanism. There is no Claude Cloud fallback.

Historical V1.3 OpenAI API test paths and their cost ledger remain audit evidence. They are not a requirement to call the OpenAI API on each V1.4 transition. When OpenAI API calls are actually made and measured, their usage remains distinct from Claude cost; unavailable OpenAI/Work cost is `NON_VÉRIFIABLE`, not zero.

Normative V1.4 LOCAL consolidation: `.github/orchestration/KODJO_ORCHESTRATION_V1_4_LOCAL.md`.

Validated Claude Local continuity evidence: `.github/orchestration/KODJO_CLAUDE_LOCAL_SESSION_RESUME_03_EVIDENCE.md`.

Operational adaptation for manual Claude wake: `.github/orchestration/KODJO_V1_4_LOCAL_WORKFLOW_ADAPTATION.md`.
