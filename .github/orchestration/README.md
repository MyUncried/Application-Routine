# KODJO orchestration operational state

The active operational checkpoint is persisted as a single mutable Issue comment beginning with `[KODJO_CHECKPOINT_ACTIVE]` on the active tranche Issue. The comment contains one JSON object with schema `kodjo.checkpoint.v1`.

The active checkpoint is replaced in place; it is not accumulated. Historical Issue comments and Git commits remain audit evidence but are not concatenated into the working context.

The event router validates the active checkpoint before materializing any `[KODJO_EVENT] CHATGPT_RESUME_REQUIRED` handoff. Such an event is a resume signal only and never an authorization to write business files.
