# Research archive index

Cleanup authorized on 2026-10-12. The active checkout retains the method and
ordinary repository maintenance; experiments are not product dependencies.

## Local preservation

A separately stored, byte-verified archive is located at:

`C:\Users\krnese\golden-path-archive-20261012`

This is a local archive, **not a published download or a portable repository
link**. Back it up or publish a reviewed, appropriately redacted copy before
discarding it. Uncommitted investigations and the later standalone cases are
not recoverable from upstream Git history alone.

| Archive file | Preserved material |
| --- | --- |
| `golden-path-history.bundle` | Git refs/history before cleanup, including the two isolated research branches |
| `main-working-tree.zip` | Exact tracked and nonignored uncommitted files before cleanup, including the verifier and brownfield investigation |
| `session-research.zip` | Session research files and isolated decision-validity/distributed-coherence worktrees |
| `dv1.zip`, `dv1-evidence.zip` | Single-case checkout and complete native/evaluation evidence |
| `ab1.zip`, `ab1-evidence.zip` | Both CSV candidate checkouts, prepared snapshots, native sessions, evaluator and results; runtime caches excluded |
| `file-manifest.csv` | Original absolute source path, archive entry, file length and SHA-256 for the 916 retained files |
| `ARCHIVE.sha256` | Checksums for the retained archives and index files |
| `uncommitted-before.patch`, `status-before.txt`, `worktrees-before.txt` | Pre-cleanup working-tree context |

Each archived source file was compared with its extracted-entry bytes before
removal. Preserve archive contents as immutable evidence; add new notes alongside
them instead of overwriting historical results.

The archive also retains relocated scratch checkouts/evidence separately for
convenient inspection. Generated Copilot package caches and obsolete dependency
installs are not retained. Initially 1,370 files were verified; the user's explicit
cache-exclusion instruction then removed 454 generated runtime files from the
archive as well. All remaining entries were reverified against their original
hashes. Tool versions and package inventories remain as small provenance records.

Historical in-run manifests may list those now-excluded caches. The outer
`file-manifest.csv` and `cache-removal.txt` describe the curated archive; no
scientific result, source snapshot, protocol or action transcript was changed.

## Git provenance

- Main baseline: `041c2c2cf3f89c8575a93a78e4b60102cf3282a0`.
- Distributed-coherence branch: `research/distributed-coherence`, commit
  `1f55a5d`; protocol committed before execution.
- Decision-validity branch: `research/decision-validity-feasibility`, commit
  `5acdde4864e9fd00f3526015c331c91c66f1821f`.
- Standalone single-case and CSV starting/ending Git bundles are inside their
  respective evidence archives.

Research branches and registered historical worktrees are retained; this cleanup
does not rewrite their commits or the frozen protocols. They are not part of the
active method-only checkout.

## Reproduction and scope

Extract the corresponding ZIP to a short, isolated path outside the active
repository. Entry names preserve the original relative paths. Consult the
original protocol, source hashes and tool pins before running anything.
Old absolute paths in transcripts identify the historical run; they are not
guaranteed to exist after cleanup. Windows ZIP entries may use backslashes.

Retained Markdown reports are historical copies. Their original relative code
and raw-evidence links are deliberately not rewritten to imply active tooling;
those targets exist in the matching archive. Current adoption instructions link
only to the method, skill and repository guidance.

No model trial, evaluator adjustment or new engineering guarantee was introduced
by archiving the experiments.
