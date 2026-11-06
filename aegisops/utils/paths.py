"""
Path utility helpers shared across AegisOps modules.
"""

from pathlib import Path


def find_aegisops_project_root() -> Path | None:
    """Walk upward from cwd and return the first directory that contains ``.aegisops/``.

    Unlike :func:`find_project_root`, this returns ``None`` when none is found—no
    fallback to cwd. Use this for security-sensitive checks (e.g. avoid treating
    the whole filesystem as a project when cwd is ``/``).
    """
    current = Path.cwd().resolve()
    for directory in (current, *current.parents):
        if (directory / ".aegisops").is_dir():
            return directory
    return None


def find_project_root() -> Path:
    """Walk up from cwd to locate the AegisOps project root.

    Mimics how git locates ``.git/`` — searches the current directory and each
    ancestor in turn until it finds a directory that contains ``.aegisops/``, or
    until the filesystem root is reached.

    Falls back to ``Path.cwd()`` when nothing is found (e.g. first-run before
    ``.aegisops/`` has been created). Prefer :func:`find_aegisops_project_root` for
    HTTP file access and other security-sensitive path checks.

    Returns:
        The nearest ancestor directory (inclusive of cwd) that contains a
        ``.aegisops/`` sub-directory, or ``Path.cwd()`` as a fallback.
    """
    found = find_aegisops_project_root()
    return found if found is not None else Path.cwd().resolve()


__all__ = ["find_project_root", "find_aegisops_project_root"]
