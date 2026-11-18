"""AegisOps direct public advisory collectors. No GitHub database dependency.
Protocols independently implemented from public provider endpoints; see INTELLIGENCE_SOURCES.md.
"""
import asyncio,gzip,hashlib,io,json,re
from datetime import datetime,timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from urllib.parse import urlsplit,urljoin,quote
from xml.etree import ElementTree as ET
import httpx

SOURCES={'threatbook':'微步在线','aliyun':'阿里云漏洞库','tophant':'斗象漏洞情报','chaitin':'长亭漏洞库','nvd':'NVD','tenable':'Tenable','cisa':'CISA KEV'}
HOSTS={'x.threatbook.com','avd.aliyun.com','vip.tophant.com','stack.chaitin.com','www.cisa.gov','nvd.nist.gov','www.tenable.com'}
MAX_BYTES=32*1024*1024
class Text(HTMLParser):
 def __init__(self):super().__init__();self.parts=[];self.skip=0
 def handle_starttag(self,tag,attrs):
  if tag in {'script','style'}:self.skip+=1
  if tag in {'br','p','div','h3','li'}:self.parts.append('\n')
 def handle_endtag(self,tag):
  if tag in {'script','style'}:self.skip=max(0,self.skip-1)
 def handle_data(self,data):
  if not self.skip:self.parts.append(data)
def plain(v):
 p=Text();p.feed(str(v or '')[:100000]);return '\n'.join(x.strip() for x in ''.join(p.parts).splitlines() if x.strip())[:30000]
def severity(v):
 v=str(v or '').lower()
 for keys,level in [(['critical','serious','严重','超危'],'critical'),(['high','高危','高风险'],'high'),(['medium','中危','中风险'],'medium'),(['low','低危','低风险'],'low')]:
  if any(x in v for x in keys):return level
 return 'unknown'
def row(source,key,title,date,info,url,risk='',cve=''):
 if not key or not title:raise ValueError('来源记录缺少标识或标题')
 ids=sorted(set(re.findall(r'CVE-\d{4}-\d{4,}',str(cve)+' '+str(title),re.I)))
 return {'key':str(key),'source_id':source,'source':SOURCES[source],'cve':', '.join(x.upper() for x in ids),'title':str(title)[:500],'published':str(date or '')[:100],'info':str(info or '')[:30000],'url':url,'severity':severity(risk)}

def parse_json(source,d):
 out=[]
 if source=='threatbook':
  for v in d['data']['items']:
   ids=v.get('id') or [];ids=[ids] if isinstance(ids,str) else ids
   key=next((x for x in ids if x.startswith('CVE-')),v.get('xveId') or (ids[0] if ids else ''))
   times=v.get('timelines') or [];dates=[x['timeline'] for x in times if any(y.get('field')=='VULN_PUBLISH_TIME' for y in x.get('descriptions',[]))]
   date=min(dates or [x.get('timeline','') for x in times] or [''])
   info='\n'.join([v.get('title',''),*v.get('versions',[]),*[x.get('text','') for x in v.get('solutionsList',[])],v.get('ptempSolution','')])
   out.append(row(source,key,v['title'],date,info,'https://x.threatbook.com/v5/vul?id='+quote(key),v.get('riskLevel'),str(ids)))
 elif source=='chaitin':
  for v in d['data']['list']:
   out.append(row(source,v['id'],v['title'],v.get('disclosure_date') or v.get('created_at'),'\n'.join(str(v.get(k) or '') for k in ['summary','impact','fix_steps','references']),'https://stack.chaitin.com/vuldb/detail?id='+quote(v['id']),v.get('severity'),v.get('cve_id')))
 elif source=='tophant':
  if str(d.get('errorCode','00000')) not in {'00000','0'}:raise ValueError('斗象公开接口返回错误')
  for v in d['data']['records']:
   info='\n'.join([v['vulnName'],*[x.get('cweNameCn','') for x in v.get('cwes',[])]])
   out.append(row(source,v['id'],v['vulnName'],v.get('publishTime') or v.get('collectTime'),info,'https://vip.tophant.com/detail/'+quote(str(v['id'])),v.get('riskLevel'),v.get('vulnCveCode')))
 elif source=='cisa':
  for v in sorted(d['vulnerabilities'],key=lambda v:v.get('dateAdded',''),reverse=True):
   info='\n'.join(str(v.get(k) or '') for k in ['vendorProject','product','shortDescription','requiredAction','notes'])+'\nCISA KEV 已知在野利用目录；收录不等于 CVSS 等级。'
   out.append(row(source,v['cveID'],v['vulnerabilityName'],v['dateAdded'],info,'https://nvd.nist.gov/vuln/detail/'+v['cveID'],cve=v['cveID']))
 elif source=='nvd':
  for entry in d['vulnerabilities']:
   v=entry['cve']
   if v.get('vulnStatus','').lower()=='rejected':continue
   ds=v.get('descriptions',[]);description=next((x['value'] for x in ds if x.get('lang')=='en'),ds[0]['value'] if ds else v['id'])
   risk=''
   for m in ['cvssMetricV40','cvssMetricV31','cvssMetricV30','cvssMetricV2']:
    metrics=v.get('metrics',{}).get(m,[])
    if metrics:
     metric=next((x for x in metrics if x.get('type')=='Primary'),metrics[0]);risk=metric.get('cvssData',{}).get('baseSeverity') or metric.get('baseSeverity','');break
   out.append(row(source,v['id'],v['id']+' · '+description.split('\n')[0][:160],v.get('published'),description,'https://nvd.nist.gov/vuln/detail/'+v['id'],risk,v['id']))
 return out

def parse_rss(raw):
 if b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():raise ValueError('RSS 包含不支持的实体声明')
 root=ET.fromstring(raw);out=[]
 for v in root.findall('.//item')[:300]:
  title=v.findtext('title') or '';url=v.findtext('link') or '';p=urlsplit(url)
  if p.scheme!='https' or p.hostname not in {'www.tenable.com','tenable.com'}:continue
  description=plain(v.findtext('description'));match=re.search(r'(Critical|High|Medium|Low)\s+Severity',description,re.I)
  try:date=parsedate_to_datetime(v.findtext('pubDate')).isoformat()
  except (TypeError,ValueError):date=''
  out.append(row('tenable',title,title,date,description,url,match.group(1) if match else '',title))
 if not out:raise ValueError('Tenable RSS 未返回有效情报')
 return out
class AVD(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.cells=None;self.text=None;self.href=''
 def handle_starttag(self,tag,attrs):
  if tag=='tr':self.cells=[];self.href=''
  elif tag=='td' and self.cells is not None:self.text=[]
  elif tag=='a' and self.cells is not None:
   href=dict(attrs).get('href','')
   if href.startswith('/detail?id=AVD-'):self.href=href
 def handle_data(self,v):
  if self.text is not None:self.text.append(v)
 def handle_endtag(self,tag):
  if tag=='td' and self.text is not None:self.cells.append(''.join(self.text).strip());self.text=None
  elif tag=='tr' and self.cells is not None:
   if self.href and len(self.cells)>3:self.rows.append(row('aliyun',self.href,self.cells[1],self.cells[3],self.cells[1],'https://avd.aliyun.com'+self.href,'high',self.cells[0]))
   self.cells=None

def decode_gzip(raw):
 if raw[:2]!=b'\x1f\x8b':return raw
 with gzip.GzipFile(fileobj=io.BytesIO(raw)) as f:
  result=f.read(MAX_BYTES+1)
  if len(result)>MAX_BYTES:raise ValueError('情报解压超出尺寸限制')
  return result

async def fetch(client,url,*,payload=None):
 p=urlsplit(url)
 if p.scheme!='https' or p.hostname not in HOSTS or p.username or p.password:raise ValueError('情报地址不在固定来源内')
 for attempt in range(2):
  try:
   async with client.stream('POST' if payload is not None else 'GET',url,json=payload,headers={'Origin':'https://vip.tophant.com','Referer':'https://vip.tophant.com/intellList'} if payload is not None else {}) as r:
    r.raise_for_status();size=0;chunks=[]
    async for chunk in r.aiter_bytes():
     size+=len(chunk)
     if size>MAX_BYTES:raise ValueError('来源响应超出尺寸限制')
     chunks.append(chunk)
    return b''.join(chunks)
  except (httpx.TimeoutException,httpx.NetworkError,httpx.HTTPStatusError) as e:
   if isinstance(e,httpx.HTTPStatusError) and e.response.status_code not in {429,500,502,503,504}:raise
   if attempt:raise
   await asyncio.sleep(1)

class PartialCollection(Exception):
 def __init__(self,rows,error):self.rows=rows;self.error=error

async def fetch_json(client,url,*,payload=None):
 for attempt in range(2):
  raw=await fetch(client,url,payload=payload)
  try:return json.loads(raw)
  except json.JSONDecodeError:
   if attempt:raise ValueError('来源返回非 JSON 内容，可能暂时限制访问；稍后重试') from None
   await asyncio.sleep(2)

async def collect_one(client,source):
 out=[]
 if source=='threatbook':
  for page in range(1,7):
   try:
    d=await fetch_json(client,f'https://x.threatbook.com/v5/node/vul_module/notice/next?page={page}&pageSize=10');rows=parse_json(source,d);out+=rows
   except Exception as exc:
    if out:raise PartialCollection(list({v['key']:v for v in out}.values()),exc) from exc
    raise
   if len(rows)<10:break
   await asyncio.sleep(1)
 elif source=='chaitin':
  for offset in range(0,60,15):
   try:
    d=await fetch_json(client,f'https://stack.chaitin.com/api/v2/vuln/list/?limit=15&offset={offset}');rows=parse_json(source,d);out+=rows
   except Exception as exc:
    if out:raise PartialCollection(list({v['key']:v for v in out}.values()),exc) from exc
    raise
   if len(rows)<15:break
   await asyncio.sleep(1)
 elif source=='tophant':
  out=parse_json(source,json.loads(await fetch(client,'https://vip.tophant.com/api/data/vuln_list',payload={'page':1,'pageSize':60,'keyword':'CVE-','publishTimeSort':0})))
 elif source=='cisa':out=parse_json(source,json.loads(await fetch(client,'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json')))
 elif source=='nvd':out=parse_json(source,json.loads(decode_gzip(await fetch(client,'https://nvd.nist.gov/feeds/json/cve/2.0/nvdcve-2.0-recent.json.gz'))))
 elif source=='tenable':out=parse_rss(await fetch(client,'https://www.tenable.com/cve/feeds?sort=newest'))
 elif source=='aliyun':
  for page in range(1,3):
   parser=AVD();parser.feed((await fetch(client,f'https://avd.aliyun.com/high-risk/list?page={page}')).decode('utf-8','replace'));out+=parser.rows
   if not parser.rows:raise ValueError('阿里云页面未返回公开漏洞列表（可能受访问限制）')
   await asyncio.sleep(1)
 if not out:raise ValueError('来源未返回有效情报，未覆盖历史记录')
 # Keep provider id stable while discarding duplicate page entries.
 return list({v['key']:v for v in out}.values())[:10000]

def error_message(exc):
 if isinstance(exc,httpx.HTTPStatusError):return f'来源返回 HTTP {exc.response.status_code}；历史情报已保留'
 if isinstance(exc,(httpx.TimeoutException,httpx.NetworkError)):return '来源连接失败或超时；历史情报已保留'
 if isinstance(exc,ValueError):return str(exc)[:180]
 return '来源数据结构变化，需更新解析器；历史情报已保留'

async def collect_all(transport=None):
 semaphore=asyncio.Semaphore(3)
 async with httpx.AsyncClient(timeout=httpx.Timeout(25,connect=10),follow_redirects=False,transport=transport,headers={'User-Agent':'AegisOps-AdvisoryCollector/1.0 (+public security advisories)','Accept':'application/json,application/xml,text/html;q=0.9,*/*;q=0.8'}) as client:
  async def run(source):
   async with semaphore:
    at=datetime.now(timezone.utc).isoformat()
    try:
     async with asyncio.timeout(100):rows=await collect_one(client,source)
     return source,rows,{'ok':True,'count':len(rows),'attempted':at,'last_success':datetime.now(timezone.utc).isoformat(),'error':''}
    except PartialCollection as exc:return source,exc.rows,{'ok':True,'partial':True,'count':len(exc.rows),'attempted':at,'last_success':datetime.now(timezone.utc).isoformat(),'error':'部分分页未更新：'+error_message(exc.error)}
    except Exception as exc:return source,[],{'ok':False,'count':0,'attempted':at,'error':error_message(exc)}
  results=await asyncio.gather(*(run(source) for source in SOURCES))
 return [r for _,rows,_ in results for r in rows],{source:state for source,_,state in results}
