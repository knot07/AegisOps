"""
Snapshot module

Provides Git-based snapshot functionality for tracking and reverting file changes.
Based on AegisOps' ported src/snapshot/index.ts
"""

from aegisops.snapshot.snapshot import (
    Snapshot,
    SnapshotPatch,
    FileDiff,
)

__all__ = [
    "Snapshot",
    "SnapshotPatch",
    "FileDiff",
]
