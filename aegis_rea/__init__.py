"""REA native reverse engineering plugin for AegisOps incident evidence."""
def register():
 from aegisops.server.route_extensions import registered_route_providers
 # Tool refresh invokes package entry points again; HTTP routes belong to startup.
 if 'aegis-rea' in registered_route_providers():
  return
 from fastapi import APIRouter,Request,HTTPException
 from fastapi.responses import Response
 from aegisops.server.auth import require_admin
 from aegisops.server.route_extensions import register_route_provider
 from . import engine
 from aegis_scenes import incident as ir
 import asyncio,json
 engine.recover();router=APIRouter()
 @router.get('/api/scenes/incident/rea/status')
 async def environment(request:Request):
  require_admin(request);return engine.status()
 @router.get('/api/scenes/incident/cases/{cid}/reverse')
 async def results(cid:str,request:Request):
  require_admin(request)
  try:ir.case(cid);return engine.saved(cid)
  except ValueError as exc:raise HTTPException(404,str(exc))
 @router.post('/api/scenes/incident/cases/{cid}/evidence/{eid}/reverse')
 async def reverse(cid:str,eid:str,request:Request):
  user=require_admin(request)
  try:ir.case(cid);row=ir.evidence(cid,eid)
  except ValueError as exc:raise HTTPException(404,str(exc))
  if row['kind']!='sample':raise HTTPException(422,'仅支持已取证样本')
  if cid in ir.running:raise HTTPException(409,'事件正在处理，请稍后再试')
  data=await request.json()
  if not isinstance(data,dict):raise HTTPException(422,'请求格式无效')
  try:return engine.enqueue(cid,eid,user.username,data.get('force') is True)
  except ValueError as exc:raise HTTPException(422,str(exc))
 @router.get('/api/scenes/incident/cases/{cid}/evidence/{eid}/reverse.md')
 async def export(cid:str,eid:str,request:Request):
  require_admin(request)
  try:ir.case(cid);value=engine.saved(cid).get(eid,{})
  except ValueError as exc:raise HTTPException(404,str(exc))
  if not value.get('markdown'):raise HTTPException(404,'REA 报告尚未生成')
  return Response(value['markdown'],media_type='text/markdown; charset=utf-8',headers={'Content-Disposition':f'attachment; filename="rea-{eid}.md"','Cache-Control':'no-store'})
 register_route_provider(router,name='aegis-rea')
