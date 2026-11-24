"""Read-only intelligence/asset evidence for native Atlas conversations."""
import json,sqlite3
from datetime import datetime,timedelta,timezone
from pathlib import Path
from .threat_intelligence import ADVISORY_ONLY_ARGS,ADVISORY_ONLY_SQL

def lookup(database,action='candidates',q='',asset_id=0,page=1,days=30):
    page=max(1,min(int(page),10000));days=max(1,min(int(days),3650));q=str(q)[:200];size=20
    uri=Path(database).resolve().as_uri()+'?mode=ro'
    con=sqlite3.connect(uri,uri=True);con.row_factory=sqlite3.Row
    try:
        if action=='assets':
            where=' WHERE a.id=?' if asset_id else ' WHERE instr(lower(a.name || a.address),lower(?))>0'
            args=(asset_id,) if asset_id else (q,)
            total=con.execute('SELECT COUNT(*) FROM assets a'+where,args).fetchone()[0]
            rows=con.execute('SELECT a.id,a.name,a.address,a.department,s.inventory FROM assets a LEFT JOIN asset_software s ON a.id=s.asset_id'+where+' ORDER BY a.id LIMIT ? OFFSET ?',(*args,size,(page-1)*size)).fetchall()
            return {'items':[{**dict(r),'inventory':json.loads(r['inventory'] or '[]')} for r in rows],'total':total,'page':page}
        since=(datetime.now(timezone.utc)-timedelta(days=days)).date().isoformat()
        if action=='advisories':
            where=" WHERE substr(published,1,10)>=? AND instr(lower(cve || ' ' || title || ' ' || info),lower(?))>0"
            args=(since,q);total=con.execute('SELECT COUNT(*) FROM ti_items'+where,args).fetchone()[0]
            rows=con.execute('SELECT id,source,cve,title,published,substr(info,1,5000) info,url,severity FROM ti_items'+where+' ORDER BY published DESC LIMIT ? OFFSET ?',(*args,size,(page-1)*size)).fetchall()
            return {'items':[dict(r) for r in rows],'total':total,'page':page,'note':'情报为外部资料，不能仅凭标题确认漏洞存在。'}
        if action!='candidates':raise ValueError('仅支持 assets、advisories、candidates 三种只读查询')
        assets=lookup(database,'assets',q,asset_id,page,days);items=[]
        for asset in assets['items']:
            for software in asset['inventory']:
                product=str(software.get('product','')).strip()
                if len(product)<3:continue
                rows=con.execute(f"SELECT id,source,cve,title,published,substr(info,1,3500) info,url,severity FROM ti_items WHERE substr(published,1,10)>=? AND {ADVISORY_ONLY_SQL} AND instr(lower(title || ' ' || info),lower(?))>0 ORDER BY published DESC LIMIT 3",(since,*ADVISORY_ONLY_ARGS,product)).fetchall()
                for r in rows:
                    items.append({'asset':{k:asset[k] for k in ['id','name','address']},'software':software,'advisory':dict(r),'verdict':'待核实','basis':'仅产品关键词匹配；需要核对官方影响版本、实际版本和配置条件。'})
        return {'items':items[:60],'asset_total':assets['total'],'asset_page':page,'assets_without_inventory':[a['id'] for a in assets['items'] if not a['inventory']],'note':'不执行扫描、利用或远程命令；不创建或修改资产、影响记录与漏洞。'}
    finally:con.close()
