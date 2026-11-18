"""A logged-in admin may consume a UI grant, never grant itself remote access."""
from aegisops.tool.registry import ToolContext,ToolResult
from aegisops.session.caller import session_caller
from aegisops.auth.service import AuthService
from aegis_scenes import incident_optional as optional

async def run(ctx:ToolContext,action:str,operation:str='rea_install',authorization_id:str='')->ToolResult:
 try:
  caller=await session_caller(ctx.session_id)
  if caller.type!='human' or not caller.id.startswith('human:'):raise ValueError('需要真实管理员对话')
  user=await AuthService.get_user_by_id(caller.id[6:])
  if not user or user.role!='admin' or user.status!='active':raise ValueError('仅有效管理员可执行')
  if action=='jobs':result=optional.jobs(user.username)
  elif action=='run':result=optional.enqueue(user.username,operation,authorization_id)
  elif action=='environment':
   from aegis_rea.engine import status
   result=status()
  else:raise ValueError('不支持的操作')
  return ToolResult(success=True,output=result,title='可选取证与逆向环境')
 except ValueError as e:return ToolResult(success=False,error=str(e))
