"""Reserved adapter; the independent aegisopsrag service is not implemented."""

from .errors import KnowledgebaseError


class AegisOpsragAdapter:
    implemented = False

    def __init__(self, *args, **kwargs):
        raise KnowledgebaseError(503, "knowledgebase_not_configured", "aegisopsrag is not implemented.")
