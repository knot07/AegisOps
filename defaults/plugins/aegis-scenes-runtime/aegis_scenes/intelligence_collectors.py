"""AegisOps direct public advisory collectors. No GitHub database dependency.
Protocols independently implemented from public provider endpoints; see INTELLIGENCE_SOURCES.md.
"""
import asyncio,gzip,hashlib,io,json,re
from datetime import datetime,timedelta,timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from urllib.parse import urlsplit,urljoin,quote
from xml.etree import ElementTree as ET
import httpx

SOURCES={'threatbook':'微步在线','aliyun':'阿里云漏洞库','tophant':'斗象漏洞情报','chaitin':'长亭漏洞库','nvd':'NVD','tenable':'Tenable','cisa':'CISA KEV'}
HOSTS={'x.threatbook.com','avd.aliyun.com','vip.tophant.com','stack.chaitin.com','www.cisa.gov','nvd.nist.gov','www.tenable.com'}
MAX_BYTES=32*1024*1024
THREATBOOK_ARTICLE_URL='https://x.threatbook.com/v5/article?threatInfoID='
CHINA_TZ=timezone(timedelta(hours=8))
NEWS_FEEDS={
    'antimalware':('Anti-Malware.ru','https://www.anti-malware.ru/news1/feed',('/news/',)),
    'techradar':('TechRadar 安全','https://www.techradar.com/feeds/tag/security',('/pro/security/',)),
    'hookphish':('HookPhish','https://www.hookphish.com/feed/',('/blog/',)),
    'infostealers':('Infostealers','https://www.infostealers.com/feed/',('/article/','/report/')),
}
NEWS_SOURCE_NAMES={source:name for source,(name,url,paths) in NEWS_FEEDS.items()}
SOURCES.update(NEWS_SOURCE_NAMES)
HOSTS.update(urlsplit(url).hostname for _,url,_ in NEWS_FEEDS.values())
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
 def __init__(self,risk):
  super().__init__();self.rows=[];self.cells=None;self.text=None;self.href='';self.risk=risk;self.cves=[]
 def handle_starttag(self,tag,attrs):
  if tag=='tr':self.cells=[];self.href='';self.cves=[]
  elif tag=='td' and self.cells is not None:self.text=[]
  elif tag=='a' and self.cells is not None:
   href=dict(attrs).get('href','')
   if re.fullmatch(r'/detail\?id=AVD-\d{4}-\d+',href):self.href=href
  elif tag=='button' and self.cells is not None:
   self.cves.extend(re.findall(r'\bCVE-\d{4}-\d{4,}\b',dict(attrs).get('title',''),re.I))
 def handle_data(self,v):
  if self.text is not None:self.text.append(v)
 def handle_endtag(self,tag):
  if tag=='td' and self.text is not None:self.cells.append(''.join(self.text).strip());self.text=None
  elif tag=='tr' and self.cells is not None:
   if self.href and len(self.cells)>3 and self.cells[1] and re.fullmatch(r'\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2}:\d{2})?',self.cells[3]):
    self.rows.append(row('aliyun',self.href,self.cells[1],self.cells[3],self.cells[1],'https://avd.aliyun.com'+self.href,self.risk,' '.join(self.cves)))
   self.cells=None

def decode_gzip(raw):
 if raw[:2]!=b'\x1f\x8b':return raw
 with gzip.GzipFile(fileobj=io.BytesIO(raw)) as f:
  result=f.read(MAX_BYTES+1)
  if len(result)>MAX_BYTES:raise ValueError('情报解压超出尺寸限制')
  return result

async def fetch(client,url,*,payload=None,max_bytes=MAX_BYTES):
 p=urlsplit(url)
 if p.scheme!='https' or p.hostname not in HOSTS or p.username or p.password:raise ValueError('情报地址不在固定来源内')
 for attempt in range(2):
  try:
   async with client.stream('POST' if payload is not None else 'GET',url,json=payload,headers={'Origin':'https://vip.tophant.com','Referer':'https://vip.tophant.com/intellList'} if payload is not None else {}) as r:
    r.raise_for_status();size=0;chunks=[]
    async for chunk in r.aiter_bytes():
     size+=len(chunk)
     if size>max_bytes:raise ValueError('来源响应超出尺寸限制')
     chunks.append(chunk)
    return b''.join(chunks)
  except (httpx.TimeoutException,httpx.NetworkError,httpx.HTTPStatusError) as e:
   if isinstance(e,httpx.HTTPStatusError) and e.response.status_code not in {429,500,502,503,504}:raise
   if attempt:raise
   await asyncio.sleep(1)

class PartialCollection(Exception):
 def __init__(self,rows,error,mode='paging'):self.rows=rows;self.error=error;self.mode=mode

async def fetch_json(client,url,*,payload=None):
 for attempt in range(2):
  raw=await fetch(client,url,payload=payload)
  try:return json.loads(raw)
  except json.JSONDecodeError:
   if attempt:raise ValueError('来源返回非 JSON 内容，可能暂时限制访问；稍后重试') from None
   await asyncio.sleep(2)

def threatbook_article_id(url):
    match=re.fullmatch(re.escape(THREATBOOK_ARTICLE_URL)+r'([1-9][0-9]{0,15})',url.strip())
    if not match:
        raise ValueError('请粘贴微步 X 情报中心的完整文章链接（/v5/article?threatInfoID=…）')
    return match[1]


def parse_threatbook_article(html,article_id):
    marker=re.search(r'<script(?:\s[^>]*)?>\s*window\.__INITIAL_STATE__\s*=\s*',html,re.I)
    if not marker:
        raise ValueError('未取得公开文章数据；请确认原文可在未登录的浏览器中打开')
    try:
        state,_=json.JSONDecoder().raw_decode(html,marker.end())
        response=state['data']['resData']
        detail=response['data']['threatDetail']
        if (response['response_code'] not in (0,'0') or str(detail['shortMessageId'])!=article_id
                or detail.get('deleted') or detail.get('deletedStatus') or detail.get('draft')):
            raise ValueError()
        title=plain(detail['title'])
        published=datetime.fromtimestamp(detail['ctime']/1000,CHINA_TZ).strftime('%Y-%m-%d %H:%M:%S')
        if not title:raise ValueError()
        author=response['data'].get('userInfo') or {}
        name=plain(author.get('userName'))[:80]
        summary=plain(detail.get('content'))[:500]
    except (AttributeError,KeyError,TypeError,ValueError,OverflowError,OSError):
        raise ValueError('文章不可用，或微步已调整公开文章格式') from None
    info='\n\n'.join(part for part in (f'作者：{name}' if name else '',summary,'全文请查看微步原文。') if part)
    result=row('threatbook','article:'+article_id,title,published,info,THREATBOOK_ARTICLE_URL+article_id)
    result['cve']=''  # A report can mention multiple CVEs; it does not identify one advisory.
    return result


async def fetch_threatbook_article(article_id,transport=None):
    async with httpx.AsyncClient(timeout=httpx.Timeout(15,connect=8),follow_redirects=False,transport=transport,headers={
        'User-Agent':'AegisOps-AdvisoryCollector/1.0 (+public security advisories)','Accept':'application/json,application/xml,text/html;q=0.9,*/*;q=0.8',
    }) as client:
        raw=await fetch(client,THREATBOOK_ARTICLE_URL+article_id,max_bytes=2*1024*1024)
    return parse_threatbook_article(raw.decode('utf-8','replace'),article_id)


def parse_news_rss(source,raw):
    if b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():
        raise ValueError('RSS 包含不支持的实体声明')
    _,feed,paths=NEWS_FEEDS[source]
    try:root=ET.fromstring(raw)
    except ET.ParseError:raise ValueError('来源未返回有效 RSS') from None
    if root.tag!='rss' or root.find('./channel') is None:
        raise ValueError('来源未返回有效 RSS')
    host=urlsplit(feed).hostname
    rows=[]
    for entry in root.findall('./channel/item')[:100]:
        try:
            link=urlsplit((entry.findtext('link') or '').strip())
            if (link.scheme!='https' or link.netloc.lower()!=host or not link.path.startswith(paths)):
                continue
            stamp=parsedate_to_datetime(entry.findtext('pubDate'))
            if stamp.tzinfo is None:continue
            published=stamp.astimezone(CHINA_TZ).strftime('%Y-%m-%d %H:%M:%S')
            title=plain(entry.findtext('title'))
            if not title:continue
            summary=plain(entry.findtext('description'))[:240].strip()
        except (TypeError,ValueError,AttributeError,OverflowError):
            continue
        url='https://'+host+link.path
        item=row(source,hashlib.sha256(url.encode()).hexdigest(),title,published,summary or '请查看原文了解报道详情。',url)
        item['cve']=''  # News has no verified affected-version scope.
        rows.append(item)
    if not rows and root.findall('./channel/item'):
        raise ValueError('RSS 未返回符合该安全栏目的有效报道')
    return rows


async def fetch_avd_rows(client,path,risk):
    html=(await fetch(client,'https://avd.aliyun.com'+path,max_bytes=2*1024*1024)).decode('utf-8','replace')
    parser=AVD(risk);parser.feed(html)
    if not parser.rows:
        if re.search(r'captcha-|aliyunCaptcha|acw_sc__v2',html,re.I):
            raise ValueError('源站要求浏览器验证')
        raise ValueError('源站未返回可解析的公开漏洞列表')
    return parser.rows


async def collect_avd(client):
    page_rows={}
    for page in range(1,3):
        try:
            rows=await fetch_avd_rows(client,f'/high-risk/list?page={page}','high')
        except (httpx.HTTPError,ValueError) as list_exc:
            # The official landing page independently publishes a shorter "latest" list.
            try:
                latest=await fetch_avd_rows(client,'/','')
            except (httpx.HTTPError,ValueError) as home_exc:
                if page_rows:raise PartialCollection(list(page_rows.values()),list_exc) from list_exc
                raise ValueError('高危列表：'+error_message(list_exc)+'；官网首页：'+error_message(home_exc)) from None
            home_rows={item['key']:{**item,'coverage':'homepage'} for item in latest}
            home_rows.update(page_rows)
            raise PartialCollection(list(home_rows.values()),list_exc,'homepage') from list_exc
        page_rows.update((item['key'],item) for item in rows)
        if page==1:await asyncio.sleep(1)
    return list(page_rows.values())


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
 elif source in NEWS_FEEDS:
  feed=NEWS_FEEDS[source][1]
  out=parse_news_rss(source,await fetch(client,feed,max_bytes=4*1024*1024))
 elif source=='cisa':out=parse_json(source,json.loads(await fetch(client,'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json')))
 elif source=='nvd':out=parse_json(source,json.loads(decode_gzip(await fetch(client,'https://nvd.nist.gov/feeds/json/cve/2.0/nvdcve-2.0-recent.json.gz'))))
 elif source=='tenable':out=parse_rss(await fetch(client,'https://www.tenable.com/cve/feeds?sort=newest'))
 elif source=='aliyun':out=await collect_avd(client)
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
    except PartialCollection as exc:
     note='已采集官网最新漏洞；高危列表尚未完整采集：' if exc.mode=='homepage' else '部分分页未更新：'
     return source,exc.rows,{'ok':True,'partial':True,'mode':exc.mode,'count':len(exc.rows),'attempted':at,'last_success':datetime.now(timezone.utc).isoformat(),'error':note+error_message(exc.error)}
    except Exception as exc:return source,[],{'ok':False,'count':0,'attempted':at,'error':error_message(exc)}
  results=await asyncio.gather(*(run(source) for source in SOURCES))
 return [r for _,rows,_ in results for r in rows],{source:state for source,_,state in results}
