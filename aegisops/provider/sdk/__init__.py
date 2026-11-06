"""
Provider SDK implementations

This module contains all provider SDK implementations for different AI platforms.
Each provider implements the BaseProvider interface for consistent API access.

Providers:
- Core Providers (Batch 1+2):
  - OpenAI, Anthropic, Google, Azure
  - OpenAI Compatible, Mistral, Groq, Cohere, Together

- Extended Providers (Batch 3):
  - xAI, DeepInfra, Cerebras, Perplexity, OpenRouter
  - Google Vertex, Local

- Enterprise Providers (Batch 5):
  - Gateway, GitLab

- Additional Providers (Batch 6):
  - GitHub Copilot, GitHub Copilot Enterprise
  - Vercel AI, AegisOps
  - SAP AI Core, Cloudflare AI Gateway
"""

# Core providers
from aegisops.provider.sdk.openai import OpenAIProvider
from aegisops.provider.sdk.anthropic import AnthropicProvider
from aegisops.provider.sdk.google import GoogleProvider
from aegisops.provider.sdk.azure import AzureProvider
from aegisops.provider.sdk.openai_compatible import OpenAICompatibleProvider
from aegisops.provider.sdk.mistral import MistralProvider
from aegisops.provider.sdk.groq import GroqProvider
from aegisops.provider.sdk.cohere import CohereProvider
from aegisops.provider.sdk.together import TogetherProvider

# Extended providers
from aegisops.provider.sdk.xai import XAIProvider
from aegisops.provider.sdk.deepinfra import DeepInfraProvider
from aegisops.provider.sdk.cerebras import CerebrasProvider
from aegisops.provider.sdk.perplexity import PerplexityProvider
from aegisops.provider.sdk.openrouter import OpenRouterProvider
from aegisops.provider.sdk.vertex import VertexProvider
from aegisops.provider.sdk.local import LocalProvider

# Enterprise providers
from aegisops.provider.sdk.gateway import GatewayProvider
from aegisops.provider.sdk.gitlab import GitLabProvider

# Additional providers (Batch 6)
from aegisops.provider.sdk.github_copilot import (
    GitHubCopilotProvider,
    GitHubCopilotEnterpriseProvider,
)
from aegisops.provider.sdk.vercel import VercelProvider
from aegisops.provider.sdk.opencode import OpenCodeProvider as AegisOpsCompatProvider
from aegisops.provider.sdk.sap_ai_core import SAPAICoreProvider
from aegisops.provider.sdk.cloudflare_gateway import CloudflareGatewayProvider

# Final providers (Batch 7)
from aegisops.provider.sdk.vertex_anthropic import VertexAnthropicProvider
from aegisops.provider.sdk.azure_cognitive import AzureCognitiveServicesProvider
from aegisops.provider.sdk.zenmux import ZenMuxProvider


__all__ = [
    # Core providers
    "OpenAIProvider",
    "AnthropicProvider",
    "GoogleProvider",
    "AzureProvider",
    "OpenAICompatibleProvider",
    "MistralProvider",
    "GroqProvider",
    "CohereProvider",
    "TogetherProvider",
    # Extended providers
    "XAIProvider",
    "DeepInfraProvider",
    "CerebrasProvider",
    "PerplexityProvider",
    "OpenRouterProvider",
    "VertexProvider",
    "LocalProvider",
    # Enterprise providers
    "GatewayProvider",
    "GitLabProvider",
    # Additional providers (Batch 6)
    "GitHubCopilotProvider",
    "GitHubCopilotEnterpriseProvider",
    "VercelProvider",
    "AegisOpsCompatProvider",
    "SAPAICoreProvider",
    "CloudflareGatewayProvider",
    # Final providers (Batch 7)
    "VertexAnthropicProvider",
    "AzureCognitiveServicesProvider",
    "ZenMuxProvider",
]
