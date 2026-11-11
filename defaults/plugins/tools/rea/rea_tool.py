"""Restricted platform tool. No arbitrary files, commands, or raw REA MCP exposure."""
from aegisops.tool.registry import ToolContext,ToolResult
from aegisops.session.caller import session_caller
from aegisops.auth.service import AuthService
from aegis_rea import engine
from aegis_scenes import incident as ir
import json

async def investigate(ctx:ToolContext,action:str,case_id:str='',sample_evidence_id:str='',evidence_id:str='')->ToolResult:
 try:
  caller=await session_caller(ctx.session_id)
  if caller.type!='human' or not caller.id.startswith('human:'):raise ValueError('此工具需要已登录管理员的真实对话会话')
  user=await AuthService.get_user_by_id(caller.id[6:])
  if not user or user.role!='admin' or user.status!='active':raise ValueError('仅有效管理员会话可访问应急证据')
  if action=='environment':return ToolResult(success=True,output=engine.status())
  ir.case(case_id)
  if action=='analyze':result=engine.enqueue(case_id,sample_evidence_id,user.username)
  elif action=='result':
   result=engine.saved(case_id)
   if sample_evidence_id:result=result.get(sample_evidence_id,{'status':'not_started'})
  elif action=='evidence':
   row=ir.evidence(case_id,evidence_id)
   if row['kind'] not in {'rea_tool','rea_analysis','rea_decision'}:raise ValueError('仅可读取本事件的 REA 工具证据、决策与逆向报告')
   result={'evidence_id':row['id'],'sha256':row['sha256'],'data':json.loads(ir.verified_bytes(row))}
  else:raise ValueError('不支持的操作')
  return ToolResult(success=True,output=result,title='REA 恶意样本逆向')
 except ValueError as exc:return ToolResult(success=False,error=str(exc))
