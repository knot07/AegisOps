from pathlib import Path
import hashlib
import importlib.util
import json
import sys
import zipfile
import pytest

spec=importlib.util.spec_from_file_location('package_update',Path(__file__).resolve().parents[1] / 'package_update.py')
u=importlib.util.module_from_spec(spec);spec.loader.exec_module(u)

def package(root,version,extra=None):
    files={'run.py':'launcher '+version,'package_update.py':'updater','aegisops/server/app.py':'application '+version,'webui/dist/index.html':'frontend '+version,'requirements.lock':'a==1','requirements.windows.lock':'a==1','defaults/plugins/skills/demo/SKILL.md':'skill '+version}
    files.update(extra or {})
    for name,text in files.items():
        p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
    manifest={'product':'AegisOps','version':version,'files':{n:u.digest(root/n) for n in files}}
    u.atomic_json(root/'release.json',manifest)
    return manifest

def archive(root,out):
    with zipfile.ZipFile(out,'w') as z:
        for path in root.rglob('*'):
            if path.is_file():z.write(path,'AegisOps/'+path.relative_to(root).as_posix())

@pytest.mark.parametrize('name',['../bad','/etc/passwd','a/../../bad','runtime/auth.db','_runtime/python.exe','.git/config','a\\b','a:C','a//b'])
def test_reject_unsafe_paths(name):
    with pytest.raises(ValueError):u.safe_relative(name)

def test_verified_extract_and_corruption(tmp_path):
    root=tmp_path/'source';package(root,'2026.11.09');z=tmp_path/'release.zip';archive(root,z)
    assert u.extract_verified(z,u.digest(z),tmp_path/'verified','2026.11.09')['version']=='2026.11.09'
    with pytest.raises(ValueError,match='SHA256'):u.extract_verified(z,'0'*64,tmp_path/'bad','2026.11.09')
    with pytest.raises(ValueError,match='不一致'):u.extract_verified(z,u.digest(z),tmp_path/'wrong','2026.11.10')

def test_zip_slip_and_links(tmp_path):
    for index,name in enumerate(['AegisOps/../escape','AegisOps/runtime/private']):
        z=tmp_path/f'{index}.zip'
        with zipfile.ZipFile(z,'w') as bundle:bundle.writestr(name,'bad')
        with pytest.raises(ValueError):u.extract_verified(z,u.digest(z),tmp_path/f'out{index}','2026.11.09')
    assert not (tmp_path/'escape').exists()

def test_transaction_preserves_business_data_and_restores(tmp_path):
    old,new,runtime=tmp_path/'install',tmp_path/'new',tmp_path/'runtime'
    package(old,'2026.11.08');package(new,'2026.11.09',{'new_feature.py':'new'})
    (runtime/'config').mkdir(parents=True);(runtime/'config/secret.json').write_text('private-token')
    (runtime/'data').mkdir();(runtime/'data/accounts.db').write_text('accounts-and-business')
    u.seed_plugins(old,runtime)
    backup=u.install_transaction(old,runtime,new)
    assert json.loads((old/'release.json').read_text())['version']=='2026.11.09'
    assert (runtime/'config/secret.json').read_text()=='private-token'
    assert (runtime/'data/accounts.db').read_text()=='accounts-and-business'
    assert (runtime/'plugins/skills/demo/SKILL.md').read_text()=='skill 2026.11.09'
    (runtime/'data/accounts.db').write_text('failed-migration')
    u.restore_backup(old,runtime,backup)
    assert (runtime/'data/accounts.db').read_text()=='accounts-and-business'
    assert (old/'run.py').read_text()=='launcher 2026.11.08'
    assert not (old/'new_feature.py').exists()

def test_customized_plugin_is_preserved(tmp_path):
    root,runtime=tmp_path/'install',tmp_path/'runtime';package(root,'2026.11.08');u.seed_plugins(root,runtime)
    skill=runtime/'plugins/skills/demo/SKILL.md';skill.write_text('user customization')
    package(root,'2026.11.09');u.seed_plugins(root,runtime)
    assert skill.read_text()=='user customization'

def test_dependency_change_refused(tmp_path):
    old,new=tmp_path/'old',tmp_path/'new';package(old,'2026.11.08');package(new,'2026.11.09',{'requirements.lock':'a==2'})
    assert not u.dependency_compatible(old,new)
    with pytest.raises(ValueError,match='依赖'):u.install_transaction(old,tmp_path/'runtime',new)

def test_downgrade_and_modified_install_refused(tmp_path):
    old,new=tmp_path/'old',tmp_path/'new';package(old,'2026.11.09');package(new,'2026.11.08')
    with pytest.raises(ValueError,match='降级'):u.install_transaction(old,tmp_path/'runtime',new)
    (old/'run.py').write_text('edited locally')
    with pytest.raises(ValueError,match='校验'):u.read_manifest(old)

def test_symlink_target_refused(tmp_path):
    if sys.platform=='win32':pytest.skip('symlink privileges not required for Windows portable')
    old,new=tmp_path/'old',tmp_path/'new';package(old,'2026.11.08');package(new,'2026.11.09')
    target=tmp_path/'elsewhere';target.write_text('do not overwrite');(old/'run.py').unlink();(old/'run.py').symlink_to(target)
    with pytest.raises(ValueError,match='符号链接'):u.install_transaction(old,tmp_path/'runtime',new)
    assert target.read_text()=='do not overwrite'
