from aegisops.tool.registry import ToolContext,ToolResult
from aegisops.session.caller import session_caller
from aegisops.auth.service import AuthService
from aegisops.config.config import get_user_plugins_root
from aegis_scenes.intelligence_assessment import lookup

async def run(ctx:ToolContext,action:str='candidates',q:str='',asset_id:int=0,page:int=1,days:int=30)->ToolResult:
    try:
        caller=await session_caller(ctx.session_id)
        if caller.type!='human' or not caller.id.startswith('human:'):raise ValueError('请在已登录用户的原生对话中使用')
        user=await AuthService.get_user_by_id(caller.id[6:])
        if not user or user.status!='active':raise ValueError('当前账号无效或已停用')
        database=get_user_plugins_root().parent/'data/vuln-ops/vulnops.db'
        if not database.is_file():raise ValueError('尚未初始化漏洞运营与情报数据')
        return ToolResult(success=True,output=lookup(database,action,q,asset_id,page,days),title='资产情报核查 · 只读证据')
    except (ValueError,FileNotFoundError) as e:return ToolResult(success=False,error=str(e))
