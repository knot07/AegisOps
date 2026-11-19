from pathlib import Path
from aegisops.hub import catalog
from aegisops.hub.models import HubCatalogEntry
from aegisops.skill.skill import Skill, SkillInfo


def test_active_builtin_skill_is_installed_not_a_failing_update(monkeypatch,tmp_path):
    skill = SkillInfo(name="ndr-alert-analysis",description="test",location=str(tmp_path/"SKILL.md"),source="aegisops")
    monkeypatch.setattr(Skill,"_discover",classmethod(lambda cls:{skill.name:skill}))
    entry = HubCatalogEntry(id=skill.name,type="skill",name="NDR",description="test",version="1.0.0",state="updateAvailable",source="bundled",manifestPath="skills/ndr/manifest.json",category="security",tags=[],useCases=[],trust="official",riskLevel="low")
    actual=catalog._with_readonly_skill_state([entry])[0]
    assert actual.state == "installed" and actual.native
    assert actual.installPath == str(tmp_path)
    assert actual.installedVersion is None
    assert entry.state == "updateAvailable"


def test_writable_skill_keeps_real_update_state(monkeypatch,tmp_path):
    skill=SkillInfo(name="ndr-alert-analysis",description="test",location=str(tmp_path/"SKILL.md"),source="user")
    monkeypatch.setattr(Skill,"_discover",classmethod(lambda cls:{skill.name:skill}))
    entry=HubCatalogEntry(id=skill.name,type="skill",name="NDR",description="test",version="1.0.0",state="updateAvailable",source="bundled",manifestPath="skills/ndr/manifest.json",category="security",tags=[],useCases=[],trust="official",riskLevel="low")
    actual=catalog._with_readonly_skill_state([entry])[0]
    assert actual.state == "updateAvailable" and not actual.native
