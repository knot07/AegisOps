"""VirusTotal v3 integration for acquired incident evidence only."""
import json
import httpx


async def analyze(cid, eid, submit, actor):
    from . import incident as ir
    if json.loads(ir.case(cid)['alert']).get('_demo'):
        raise ValueError('演示事件不允许调用真实外部分析平台')
    row = ir.evidence(cid, eid)
    if row['kind'] != 'sample':
        raise ValueError('仅支持已取证样本')
    key = ir.secret('virustotal_api_key')
    if not key:
        raise ValueError('请先在工具清单的 VirusTotal 配置中设置 API Key')
    async with httpx.AsyncClient(timeout=120, follow_redirects=False) as client:
        headers = {'x-apikey': key}
        if submit:
            data = ir.verified_bytes(row)
            if len(data) > ir.MAX_FILE:
                raise ValueError('文件超过 20 MB 限制')
            response = await client.post('https://www.virustotal.com/api/v3/files', headers=headers,
                                         files={'file': ('sample.bin', data, 'application/octet-stream')})
        else:
            response = await client.get('https://www.virustotal.com/api/v3/files/' + row['sha256'], headers=headers)
    if response.status_code == 404:
        raise ValueError('VirusTotal 暂无此哈希报告；可稍后重试，或确认外发后提交样本')
    if response.status_code in (401, 403):
        raise ValueError('VirusTotal 密钥无效或权限不足，请检查 API 授权')
    if response.status_code == 429:
        raise ValueError('VirusTotal API 额度已用尽或请求过于频繁，请稍后重试')
    if response.is_error:
        raise ValueError('VirusTotal 请求未成功，请检查服务状态和网络连接')
    body = response.json()
    record = body.get('data', {})
    if not isinstance(record, dict) or not record.get('id'):
        raise ValueError('VirusTotal 返回格式不完整，未记录为成功')
    if submit:
        if record.get('type') != 'analysis':
            raise ValueError('VirusTotal 未返回有效的分析任务回执')
    elif record.get('type') != 'file' or record['id'].lower() != row['sha256'].lower():
        raise ValueError('VirusTotal 报告与当前样本哈希不一致，未归档')
    attrs = record.get('attributes', {})
    stats = attrs.get('last_analysis_stats', {}) if not submit else {}
    metadata = {'provider': 'virustotal', 'sample_sha256': row['sha256'], 'sample_evidence_id': eid,
                'submitted_external': submit, 'analysis_id': record['id'] if submit else None}
    report_id = ir.add_evidence(cid, 'sandbox_report', 'VirusTotal 样本提交回执' if submit else 'VirusTotal 多引擎分析报告',
                               json.dumps(body, ensure_ascii=False, indent=2).encode(), metadata)
    # Provider response text is not logged, to avoid accidentally echoing credentials.
    ir.event(cid, 'sandbox', 'submitted' if submit else 'completed',
             'VirusTotal / ' + ('经人工确认上传样本' if submit else '按哈希查询报告') + ' / SHA-256 ' + row['sha256'], actor)
    return {'ok': True, 'provider': 'virustotal', 'sha256': row['sha256'], 'evidence_id': report_id,
            'stats': stats, 'message': '已提交，分析需等待；请稍后按哈希查询报告' if submit else '多引擎报告已归档至证据库'}
