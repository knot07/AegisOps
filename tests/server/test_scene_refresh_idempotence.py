"""A package entry point re-run during tool refresh must leave HTTP registration alone."""
from unittest.mock import patch
import pytest

@pytest.mark.parametrize('plugin,package,provider',[
 ('aegis-scenes-runtime','aegis_scenes','aegis-vuln-ops-scene'),
 ('aegis-rea','aegis_rea','aegis-rea'),
])
def test_refresh_skips_routes_and_startup_side_effects(plugin,package,provider):
 module=pytest.importorskip(package)
 with patch('aegisops.server.route_extensions.registered_route_providers',return_value=[provider]),patch('fastapi.APIRouter',side_effect=AssertionError('refresh must not build another HTTP router')):
  for _ in range(3):module.register()
