# KODJO Claude Session Resume Micro-Test Manifest

- test_id: KODJO-CLAUDE-SESSION-RESUME-01
- purpose: Test whether a Claude Code session created by claude-code-action can be resumed in a later GitHub Actions workflow run with `--resume`.
- scope: Technical orchestration evidence only.
- mode: CLOUD_READ_ONLY
- writer: NONE
- business_write: false
- implementation_authorized: false
- allowed_read: This manifest only.
- prohibited: Application code, T01-S09 files, functional documentation, normative V1.3 documentation, network access, commits, branches, issues, pull requests, and fallback sessions.
- stages: BASE then RESUME.
- maximum_claude_calls: 2
- fallback: NONE
