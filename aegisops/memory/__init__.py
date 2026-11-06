"""
AegisOps Memory System

Provides persistent memory and semantic search capabilities for agents.

Uses filesystem-managed curated Memory plus lifecycle-owned Daily evidence.
"""

# Core manager
from aegisops.memory.manager import MemoryManager

# Filesystem-managed components
from aegisops.memory.bootstrap import MemoryBootstrap
from aegisops.memory.daily import DailyMemory
from aegisops.memory.flush import MemoryFlush, extract_and_save

from aegisops.memory.types import (
    MemoryScope,
    MemorySource,
    MemoryTimeRange,
    MemorySearchResult,
    MemorySyncProgress,
    MemoryProviderStatus,
    MemoryFileEntry,
    MemoryChunk,
    EmbeddingResult,
)

from aegisops.memory.config import (
    MemoryConfig,
    MemoryEmbeddingConfig,
    MemorySearchConfig,
    MemoryChunkingConfig,
    MemorySyncConfig,
    MemoryQueryConfig,
    MemoryCacheConfig,
    MemoryBatchConfig,
    MemoryAutoFlushConfig,
    MemoryDreamConfig,
    resolve_memory_config,
)

from aegisops.memory.utils import (
    compute_hash,
    compute_text_hash,
    truncate_text,
    extract_snippet,
    normalize_path,
)

__all__ = [
    # Core
    "MemoryManager",
    
    # Filesystem-managed components
    "MemoryBootstrap",
    "DailyMemory",
    "MemoryFlush",
    "extract_and_save",
    
    # Types
    "MemoryScope",
    "MemorySource",
    "MemoryTimeRange",
    "MemorySearchResult",
    "MemorySyncProgress",
    "MemoryProviderStatus",
    "MemoryFileEntry",
    "MemoryChunk",
    "EmbeddingResult",
    
    # Config
    "MemoryConfig",
    "MemoryEmbeddingConfig",
    "MemorySearchConfig",
    "MemoryChunkingConfig",
    "MemorySyncConfig",
    "MemoryQueryConfig",
    "MemoryCacheConfig",
    "MemoryBatchConfig",
    "MemoryAutoFlushConfig",
    "MemoryDreamConfig",
    "resolve_memory_config",
    
    # Utils
    "compute_hash",
    "compute_text_hash",
    "truncate_text",
    "extract_snippet",
    "normalize_path",
]

__version__ = "0.2.0"
