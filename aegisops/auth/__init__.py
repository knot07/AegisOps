"""
Local account authentication package.
"""

from aegisops.auth.backend import AuthBackend
from aegisops.auth.context import AuthUser
from aegisops.auth.local import LocalAuthBackend
from aegisops.auth.service import AuthService


def register_backend(backend: type[AuthBackend]) -> None:
    AuthService.register_backend(backend)


def get_backend():
    return AuthService.get_backend()

__all__ = [
    "AuthBackend",
    "AuthUser",
    "AuthService",
    "LocalAuthBackend",
    "register_backend",
    "get_backend",
]
