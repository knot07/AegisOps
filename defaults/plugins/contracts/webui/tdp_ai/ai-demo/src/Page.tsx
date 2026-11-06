import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@aegisops/webui-contract-sdk';

const C = {
  bg: 'var(--dt-bg)', pageBg: 'var(--dt-page-bg)', panel: 'var(--dt-panel)', panelSoft: 'var(--dt-panel-soft)', panelHead: 'var(--dt-panel-head)',
  border: 'var(--dt-border)', borderLight: 'var(--dt-border-strong)', text: 'var(--dt-text)',
  textMid: 'var(--dt-text-mid)', textDim: 'var(--dt-text-dim)', textMuted: 'var(--dt-text-muted)',
  blue: 'var(--dt-blue)', blueDark: 'var(--dt-blue-bg)', blueLight: 'var(--dt-blue-text)',
  green: 'var(--dt-green)', greenDark: 'var(--dt-green-bg)', greenLight: 'var(--dt-green-text)',
  red: 'var(--dt-red)', redDark: 'var(--dt-red-bg)', redLight: 'var(--dt-red-text)',
  orange: 'var(--dt-orange)', orangeDark: 'var(--dt-orange-bg)', orangeLight: 'var(--dt-orange-text)',
  cyan: 'var(--dt-cyan)', cyanDark: 'var(--dt-cyan-bg)', cyanLight: 'var(--dt-cyan-text)', line: 'var(--dt-line)', rowAlt: 'var(--dt-row-alt)',
  overlay: 'var(--dt-overlay)', shadow: 'var(--dt-shadow)',
};
const LIGHT_THEME_VARS = {
  '--dt-bg': '#f6f8f7', '--dt-page-bg': '#f6f8f7',
  '--dt-panel': '#ffffff', '--dt-panel-soft': '#f5f7f6', '--dt-panel-head': '#f2f5f3',
  '--dt-border': 'rgba(46,58,62,.085)', '--dt-border-strong': 'rgba(46,58,62,.16)',
  '--dt-text': '#101418', '--dt-text-mid': '#445157', '--dt-text-dim': '#69757a', '--dt-text-muted': '#78848a',
  '--dt-blue': '#236de9', '--dt-blue-bg': 'rgba(35,109,233,.08)', '--dt-blue-text': '#2364cf',
  '--dt-green': '#82dd2d', '--dt-green-bg': '#edf8e3', '--dt-green-text': '#427d1e',
  '--dt-red': '#e96c62', '--dt-red-bg': '#fff0ee', '--dt-red-text': '#bf443c',
  '--dt-orange': '#d5a455', '--dt-orange-bg': '#fcf4e6', '--dt-orange-text': '#91611d',
  '--dt-cyan': '#6d919d', '--dt-cyan-bg': '#eef3f5', '--dt-cyan-text': '#486a77',
  '--dt-line': '#273439', '--dt-row-alt': 'rgba(46,58,62,.018)',
  '--dt-overlay': 'rgba(16,20,24,.32)', '--dt-shadow': '0 1px 2px rgba(46,58,62,.035), 0 5px 16px rgba(46,58,62,.035)',
  '--dt-accent': '#82dd2d', '--dt-accent-soft': '#edf8e3', '--dt-control': '#131619', '--dt-control-text': '#ffffff',
} as const;
const DARK_THEME_VARS = {
  '--dt-bg': '#121517', '--dt-page-bg': '#121517',
  '--dt-panel': '#1b1f21', '--dt-panel-soft': '#222729', '--dt-panel-head': '#252b2d',
  '--dt-border': 'rgba(255,255,255,.08)', '--dt-border-strong': 'rgba(255,255,255,.17)',
  '--dt-text': '#eef2f1', '--dt-text-mid': '#bdc7c9', '--dt-text-dim': '#a0abad', '--dt-text-muted': '#909c9f',
  '--dt-blue': '#4c8dff', '--dt-blue-bg': 'rgba(76,141,255,.14)', '--dt-blue-text': '#9abfff',
  '--dt-green': '#82dd2d', '--dt-green-bg': 'rgba(130,221,45,.12)', '--dt-green-text': '#a6df75',
  '--dt-red': '#ff7a71', '--dt-red-bg': 'rgba(255,90,80,.12)', '--dt-red-text': '#ffaaa3',
  '--dt-orange': '#e0b46c', '--dt-orange-bg': 'rgba(224,180,108,.12)', '--dt-orange-text': '#eac68d',
  '--dt-cyan': '#8eacb8', '--dt-cyan-bg': 'rgba(142,172,184,.12)', '--dt-cyan-text': '#adc7d1',
  '--dt-line': '#ced9d5', '--dt-row-alt': 'rgba(255,255,255,.018)',
  '--dt-overlay': 'rgba(0,0,0,.55)', '--dt-shadow': '0 1px 2px rgba(0,0,0,.2), 0 5px 16px rgba(0,0,0,.12)',
  '--dt-accent': '#82dd2d', '--dt-accent-soft': 'rgba(130,221,45,.10)', '--dt-control': '#82dd2d', '--dt-control-text': '#17200f',
} as const;
const FONT = '"Microsoft YaHei", "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const PAGE_SIZE = 10;
const MAX_AI_CONCURRENCY = 3;
const VALID_DECISIONS = new Set(['建议封禁', '不建议封禁', '人工复核', '主机失陷']);
const TIME_PRESETS = [
  { minutes: 5, label: '最近5分钟' }, { minutes: 15, label: '最近15分钟' },
  { minutes: 30, label: '最近30分钟' }, { minutes: 60, label: '最近1小时' },
  { minutes: 120, label: '最近2小时' }, { minutes: 360, label: '最近6小时' },
  { minutes: 720, label: '最近12小时' }, { minutes: 1440, label: '最近1天' },
];

function useAegisOpsHostState() {
  const readDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const readWidth = () => typeof window !== 'undefined' ? window.innerWidth : 1440;
  const [isDark, setIsDark] = useState(readDark);
  const [viewportWidth, setViewportWidth] = useState(readWidth);
  useEffect(() => {
    const updateTheme = () => setIsDark(readDark());
    const updateWidth = () => setViewportWidth(readWidth());
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    window.addEventListener('resize', updateWidth);
    updateTheme();
    updateWidth();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);
  return { isDark, viewportWidth };
}

function useBrandLogo(storageKey: string) {
  const [logo, setLogo] = useState<string | null>(() => {
    try { return localStorage.getItem(storageKey) || null; } catch { return null; }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const chooseLogo = () => inputRef.current?.click();
  const onLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      if (!value) return;
      try { localStorage.setItem(storageKey, value); } catch { /* 图片过大时保留默认 Logo */ }
      setLogo(value);
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };
  const resetLogo = () => { try { localStorage.removeItem(storageKey); } catch { /* ignore */ } setLogo(null); };
  return { logo, inputRef, chooseLogo, onLogoChange, resetLogo };
}

type AiStatus = 'none' | 'pending' | 'done' | 'failed';
type TrafficDirection = '外到内' | '内到内' | '内到外' | '待确认';
interface TrafficPath {
  source_ip: string;
  destination_ip: string;
  direction: TrafficDirection;
  destination_port?: string;
  protocol?: string;
  sensor_direction?: string;
}
interface HttpEvidence {
  alert_ids?: string[]; time?: number; flow_id?: string; source_ip?: string; destination_ip?: string; destination_port?: string;
  request_line?: string; request_body?: string; response_line?: string; response_body?: string;
  request_status?: string; response_status?: string; bytes_to_server?: number; bytes_to_client?: number; occurrences?: number;
}
interface SourceLocation {
  country?: string; province?: string; city?: string; country_code?: string; area?: string;
  carrier?: string; display?: string; is_foreign?: boolean; known?: boolean; source?: string;
}
interface TdpRow {
  ip: string; count: number; first_time?: number; last_time?: number; is_cdn?: boolean; is_exit?: boolean;
  row_key?: string; aggregation_type?: string; aggregation_key?: string; grouped_row_count?: number;
  grouped_ips?: string[]; grouped_targets?: string[]; grouped_ports?: string[]; sensor_direction?: string;
  geo_data?: Record<string, unknown>; src_ip_geo_data?: Record<string, unknown>;
  threat_type?: string; ioc?: string; threat_name?: string; src_ip?: string; dst_ip?: string; dst_port?: string;
  distributed_scan_campaign?: boolean; scan_campaign_family?: string;
  scan_campaign_source_count?: number; scan_campaign_event_count?: number; scan_campaign_target_count?: number;
  scan_campaign_same_target_source_count?: number; scan_campaign_window_seconds?: number;
  scan_campaign_start_time?: number; scan_campaign_end_time?: number; scan_campaign_source_ips?: string[];
  severity?: string;
  ai_status?: AiStatus; ai_phase?: string; ai_label?: string; ai_verdict?: string;
  ai_ban_decision?: string; ai_confidence?: number; ai_severity?: string;
  ai_attack_outcome?: string; ai_compromise_status?: string; ai_summary?: string;
  ai_action_scope?: string; ai_recommended_action?: string;
  ai_evidence?: unknown[]; ai_supporting_evidence?: unknown[]; ai_contradicting_evidence?: unknown[];
  ai_missing_information?: unknown[]; ai_affected_targets?: unknown[]; ai_key_iocs?: unknown[];
  ai_traffic_paths?: TrafficPath[];
  ai_http_evidence?: HttpEvidence[];
  ai_source_location?: SourceLocation;
  ai_human_checkpoints?: unknown[]; ai_progress?: string; ai_raw_output?: string; ai_error?: string;
  ai_task_key?: string; ai_session_id?: string; ai_workflow_id?: string; ai_execution_id?: string;
}
interface TdpData { rows: TdpRow[]; start_time: number; end_time: number; event_total?: number; }
interface TrendData { labels?: string[]; tdp?: number[]; total?: number[]; summary?: Record<string, number>; }

function rowKey(row: TdpRow) {
  return row.row_key || row.aggregation_key || [row.ip, row.ioc || row.ip, row.threat_type || '', row.threat_name || ''].join('|');
}

function fmtTime(ts?: number) {
  if (!ts) return '--';
  return new Date(ts * 1000).toLocaleString('zh-CN', { hour12: false });
}

function toDatetimeLocal(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function readTimeSetting(now: number) {
  const fallback = { mode: 'preset' as const, minutes: 120, customStart: toDatetimeLocal(new Date(now - 2 * 60 * 60 * 1000)), customEnd: toDatetimeLocal(new Date(now)) };
  try {
    const parsed = JSON.parse(localStorage.getItem('datang-ai-v2-time-filter') || '{}');
    const presetValid = TIME_PRESETS.some(item => item.minutes === Number(parsed.minutes));
    const customValid = parsed.mode === 'custom' && parsed.customStart && parsed.customEnd && new Date(parsed.customEnd).getTime() > new Date(parsed.customStart).getTime();
    if (customValid) return { mode: 'custom' as const, minutes: presetValid ? Number(parsed.minutes) : 120, customStart: String(parsed.customStart), customEnd: String(parsed.customEnd) };
    if (presetValid) return { ...fallback, minutes: Number(parsed.minutes) };
  } catch { /* 使用默认值 */ }
  return fallback;
}

function saveTimeSetting(mode: 'preset' | 'custom', minutes: number, customStart: string, customEnd: string) {
  localStorage.setItem('datang-ai-v2-time-filter', JSON.stringify({ mode, minutes, customStart, customEnd }));
}

function threatTypeLabel(value?: string) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '--';
  if (normalized === 'attack' || normalized.includes('攻击')) return '攻击';
  if (normalized.includes('scan') || normalized.includes('扫描')) return '扫描';
  return value || '--';
}

function severityLabel(value?: string) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '--';
  if (['critical', '严重', '极高', '4', '5'].includes(normalized)) return '严重';
  if (['high', '高', '高危', '3'].includes(normalized)) return '高危';
  if (['medium', 'middle', '中', '中危', '2'].includes(normalized)) return '中危';
  if (['low', '低', '低危', '1'].includes(normalized)) return '低危';
  return value || '--';
}

function safeDecision(value?: string) {
  return value && VALID_DECISIONS.has(value) ? value : value ? '结果异常' : '-';
}

function decisionLabel(row: TdpRow) {
  if (row.ai_status !== 'done') return '-';
  if (row.ai_action_scope === '出站域名IOC' || isOutboundDomainRow(row)) return '出站阻断域名';
  if (row.ai_action_scope === 'IOC域名' || row.ai_summary?.includes('不要封禁可信基础设施 IP')) return '仅阻断域名';
  if (row.ai_action_scope === '目标主机和源IP') return '隔离并封禁';
  return safeDecision(row.ai_ban_decision);
}

function isOutboundDomainRow(row: TdpRow) {
  const domain = String(row.ioc || '').trim();
  const threat = String(row.threat_name || '');
  return /^(?=.{4,253}$)(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,63}$/.test(domain)
    && /银狐|黑产|C2|木马|病毒|远控|后门|恶意域名|僵尸网络/i.test(threat)
    && trafficPathsFor(row).some(path => path.direction === '内到外');
}

function actionScopeLabel(row: TdpRow) {
  if (row.ai_status !== 'done') return '--';
  return isOutboundDomainRow(row) ? '出站域名IOC' : row.ai_action_scope || '--';
}

function evidenceText(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function extractIp(value: unknown) {
  const text = evidenceText(value).trim();
  const ipv4 = text.match(/(?:^|[^\d])((?:\d{1,3}\.){3}\d{1,3})(?:$|[^\d])/);
  if (ipv4) {
    const candidate = ipv4[1];
    if (candidate.split('.').every(part => Number(part) <= 255)) return candidate;
  }
  const direct = text.replace(/^\[|\]$/g, '');
  return direct.includes(':') && /^[0-9a-f:]+$/i.test(direct) ? direct : '';
}

function networkZone(ip: string) {
  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts.every(part => Number.isInteger(part) && part >= 0 && part <= 255)) {
    if (parts[0] === 10 || parts[0] === 127 || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
      (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)) return 'internal';
    return 'external';
  }
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || /^fe[89ab]/.test(normalized)) return 'internal';
  return normalized.includes(':') ? 'external' : 'unknown';
}

function inferTrafficDirection(sourceIp: string, destinationIp: string): TrafficDirection {
  const source = networkZone(sourceIp);
  const destination = networkZone(destinationIp);
  if (source === 'external' && destination === 'internal') return '外到内';
  if (source === 'internal' && destination === 'internal') return '内到内';
  if (source === 'internal' && destination === 'external') return '内到外';
  return '待确认';
}

function trafficPathsFor(row: TdpRow): TrafficPath[] {
  const validDirections = new Set<TrafficDirection>(['外到内', '内到内', '内到外', '待确认']);
  const saved = Array.isArray(row.ai_traffic_paths) ? row.ai_traffic_paths.filter(item =>
    item && item.source_ip && item.destination_ip && validDirections.has(item.direction)
  ).map(item => {
    if (String(item.sensor_direction).toLowerCase() === 'out' && item.direction === '外到内') {
      return { ...item, source_ip: item.destination_ip, destination_ip: item.source_ip, destination_port: '', direction: '内到外' as const };
    }
    return item;
  }) : [];
  if (saved.length) return saved.slice(0, 20);

  const sourceIp = extractIp(row.ip) || row.ip || '待确认';
  const targetIps = [...new Set((row.ai_affected_targets || []).map(extractIp).filter(Boolean))];
  if (!targetIps.length) return [{ source_ip: sourceIp, destination_ip: '待确认', direction: '待确认' }];
  return targetIps.slice(0, 20).map(destinationIp => ({
    source_ip: sourceIp,
    destination_ip: destinationIp,
    direction: inferTrafficDirection(sourceIp, destinationIp),
  }));
}

function mergeAi(row: TdpRow, ai: any): TdpRow {
  if (!ai) return row;
  return {
    ...row,
    ai_status: ai.status || row.ai_status,
    ai_phase: ai.phase || row.ai_phase,
    ai_label: ai.label || row.ai_label,
    ai_verdict: ai.verdict ?? row.ai_verdict,
    ai_ban_decision: ai.ban_decision ?? row.ai_ban_decision,
    ai_confidence: ai.confidence ?? row.ai_confidence,
    ai_severity: ai.severity ?? row.ai_severity,
    ai_attack_outcome: ai.attack_outcome ?? row.ai_attack_outcome,
    ai_compromise_status: ai.compromise_status ?? row.ai_compromise_status,
    ai_action_scope: ai.action_scope ?? row.ai_action_scope,
    ai_recommended_action: ai.recommended_action ?? row.ai_recommended_action,
    ai_summary: ai.summary ?? row.ai_summary,
    ai_evidence: ai.evidence ?? row.ai_evidence,
    ai_supporting_evidence: ai.supporting_evidence ?? row.ai_supporting_evidence,
    ai_contradicting_evidence: ai.contradicting_evidence ?? row.ai_contradicting_evidence,
    ai_missing_information: ai.missing_information ?? row.ai_missing_information,
    ai_affected_targets: ai.affected_targets ?? row.ai_affected_targets,
    ai_traffic_paths: ai.traffic_paths ?? row.ai_traffic_paths,
    ai_http_evidence: ai.http_evidence ?? row.ai_http_evidence,
    ai_source_location: ai.source_location ?? row.ai_source_location,
    ai_key_iocs: ai.key_iocs ?? row.ai_key_iocs,
    ai_human_checkpoints: ai.human_checkpoints ?? row.ai_human_checkpoints,
    ai_progress: ai.progress ?? row.ai_progress,
    ai_raw_output: ai.raw_output ?? row.ai_raw_output,
    ai_error: ai.error ?? row.ai_error,
    ai_task_key: ai.task_key || row.ai_task_key,
    ai_session_id: ai.session_id || row.ai_session_id,
    ai_workflow_id: ai.workflow_id || row.ai_workflow_id,
    ai_execution_id: ai.execution_id || row.ai_execution_id,
  };
}

function mergeDashboardRow(latest: TdpRow, previous?: TdpRow): TdpRow {
  if (!previous) return latest;
  return {
    ...previous,
    ...latest,
    ai_evidence: latest.ai_evidence ?? previous.ai_evidence,
    ai_supporting_evidence: latest.ai_supporting_evidence ?? previous.ai_supporting_evidence,
    ai_contradicting_evidence: latest.ai_contradicting_evidence ?? previous.ai_contradicting_evidence,
    ai_missing_information: latest.ai_missing_information ?? previous.ai_missing_information,
    ai_affected_targets: latest.ai_affected_targets ?? previous.ai_affected_targets,
    ai_traffic_paths: latest.ai_traffic_paths ?? previous.ai_traffic_paths,
    ai_http_evidence: latest.ai_http_evidence ?? previous.ai_http_evidence,
    ai_source_location: latest.ai_source_location ?? previous.ai_source_location,
    ai_key_iocs: latest.ai_key_iocs ?? previous.ai_key_iocs,
    ai_human_checkpoints: latest.ai_human_checkpoints ?? previous.ai_human_checkpoints,
    ai_raw_output: latest.ai_raw_output ?? previous.ai_raw_output,
  };
}

function aiLabel(row: TdpRow) {
  if (row.ai_status === 'done') return '已完成';
  if (row.ai_status === 'failed') return '研判异常';
  if (row.ai_phase === 'queued') return '队列中';
  if (row.ai_phase === 'parsing') return '解析中';
  if (row.ai_phase === 'collecting') return '固定取证中';
  if (row.ai_phase === 'rule_engine') return '规则分析中';
  if (row.ai_phase === 'model_analysis') return '模型分析中';
  if (row.ai_phase === 'finalizing') return '结果校验中';
  if (row.ai_status === 'pending') return '研判中';
  return 'AI研判';
}

function AIResultBadge({ row, onStart }: { row: TdpRow; onStart: (row: TdpRow) => void }) {
  const status = row.ai_status || 'none';
  const palette = status === 'done'
    ? { background: C.greenDark, color: C.greenLight }
    : status === 'failed'
      ? { background: C.redDark, color: C.redLight }
      : status === 'pending'
        ? { background: C.orangeDark, color: C.orangeLight }
        : { background: C.blueDark, color: C.blueLight };
  if (status === 'none' || status === 'failed') {
    return <button type="button" aria-label={`开始研判 ${row.ip}`} title="点击开始AI研判" onClick={() => onStart(row)} style={{ ...aiResultBadgeStyle, ...palette, cursor: 'pointer' }}>{status === 'failed' ? '重新研判' : aiLabel(row)}</button>;
  }
  return <span style={{ ...aiResultBadgeStyle, ...palette }}>{aiLabel(row)}</span>;
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, any> = {
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    bot: <><rect x="5" y="7" width="14" height="11" rx="3" /><path d="M12 3v4M9 12h.01M15 12h.01M8 18l-2 3M16 18l2 3" /></>,
    chart: <><path d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-7" /></>,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    check: <><path d="M5 12l4 4L19 6" /></>,
    'chevron-down': <><path d="M6 9l6 6 6-6" /></>,
    'chevron-left': <><path d="M15 18l-6-6 6-6" /></>,
    'chevron-right': <><path d="M9 18l6-6-6-6" /></>,
    refresh: <><path d="M20 12a8 8 0 0 1-14 5M4 12a8 8 0 0 1 14-5" /><path d="M18 3v4h-4M6 21v-4h4" /></>,
    shield: <><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" /><path d="M9 12l2 2 4-5" /></>,
    spark: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" /></>,
    x: <><path d="M6 6l12 12M18 6L6 18" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block' }}>
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.activity}</g>
  </svg>;
}

function TrendChart({ trend }: { trend: TrendData }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const labels = trend.labels || [];
  const values = (trend.tdp || []).map(value => Math.max(0, Number(value) || 0));
  const sum = values.reduce((a, b) => a + b, 0);
  const peak = Math.max(0, ...values);
  const W = 720, H = 250, L = 32, R = 24, T = 28, B = 34;
  const chartH = H - T - B;
  const limit = Math.max(4, Math.ceil(peak / 4) * 4);
  const step = (W - L - R) / Math.max(1, labels.length);
  const x = (index: number) => L + step * (index + .5);
  const y = (value: number) => T + chartH * (1 - value / limit);
  const active = hovered !== null && hovered < values.length ? hovered : null;
  const points = values.map((value,index) => ({x:x(index),y:y(value)}));
  const smoothPath = points.map((point,index) => {
    if (!index) return 'M '+point.x+' '+point.y;
    const previous = points[index-1];
    const before = points[Math.max(0,index-2)];
    const after = points[Math.min(points.length-1,index+1)];
    const clampY = (value:number) => Math.max(T,Math.min(T+chartH,value));
    return 'C '+(previous.x+(point.x-before.x)/6)+' '+clampY(previous.y+(point.y-before.y)/6)+' '+(point.x-(after.x-previous.x)/6)+' '+clampY(point.y-(after.y-previous.y)/6)+' '+point.x+' '+point.y;
  }).join(' ');
  return <div className="dt-trend-body">
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
      <div><div style={{ color: C.textDim, fontSize: 12 }}>告警总量</div><div style={{ display: 'flex', gap: 5, alignItems: 'baseline', marginTop: 8 }}><strong style={{ color: C.text, fontSize: 42, lineHeight: 1, fontWeight: 720 }}>{sum.toLocaleString()}</strong><span style={{ color: C.textMuted, fontSize: 14 }}>次</span></div></div>
      <div style={{ display: 'flex', gap: 18, paddingTop: 14, borderTop: '1px solid '+C.border }}>
        <div><div style={{ color: C.textMuted, fontSize: 11 }}>峰值</div><strong style={{ display: 'block', marginTop: 5, fontSize: 16 }}>{peak}</strong></div>
        <div><div style={{ color: C.textMuted, fontSize: 11 }}>均值</div><strong style={{ display: 'block', marginTop: 5, fontSize: 16 }}>{values.length ? (sum / values.length).toFixed(1) : '0'}</strong></div>
      </div>
      <span style={{ alignSelf: 'start', display: 'inline-flex', gap: 6, alignItems: 'center', padding: '5px 8px', borderRadius: 4, fontSize: 11, color: C.textMid, background: C.panel }}><span style={{ width: 5, height: 5, background: C.green, borderRadius: '50%' }} />当前时间范围</span>
    </div>
    {labels.length && values.length ? <svg role="img" aria-label="告警趋势柱状图" viewBox={'0 0 '+W+' '+H} width="100%" height="250" onPointerLeave={() => setHovered(null)} style={{ display: 'block', minWidth: 0 }}>
      <defs><pattern id="tdpHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="7" height="7" fill={C.green} opacity=".68" /><line x1="0" y1="0" x2="0" y2="7" stroke={C.greenLight} strokeWidth="1.4" opacity=".38" /></pattern></defs>
      {[0, .5, 1].map(ratio => <g key={ratio}><line x1={L} x2={W-R} y1={y(limit*ratio)} y2={y(limit*ratio)} stroke={C.borderLight} strokeDasharray="2 5" /><text x={L-8} y={y(limit*ratio)+4} textAnchor="end" fill={C.textMuted} fontSize="10">{limit*ratio}</text></g>)}
      {values.map((value, index) => <g key={index}>
        <rect className="dt-trend-bar" style={{ animationDelay: Math.min(index*18,220)+'ms' }} x={x(index)-Math.min(14, step*.27)} y={y(value)} width={Math.min(28, step*.54)} height={Math.max(2,y(0)-y(value))} rx="4" fill={value ? 'url(#tdpHatch)' : C.borderLight} />
        {value === peak && value > 0 && <><line x1={x(index)} x2={x(index)} y1={y(0)} y2={y(value)} stroke={C.line} strokeWidth="1.5" /><circle cx={x(index)} cy={y(value)} r="4" stroke={C.line} strokeWidth="2" fill={C.panel} /></>}
        {(index % Math.max(1, Math.ceil(labels.length/6)) === 0 || index === labels.length-1) && <text x={x(index)} y={H-9} textAnchor="middle" fontSize="10" fill={C.textMuted}>{labels[index]}</text>}
        <rect x={L+step*index} y={T} width={step} height={chartH} fill="transparent" onPointerEnter={() => setHovered(index)} onPointerMove={() => setHovered(index)} />
      </g>)}
      <path className="dt-trend-curve" pathLength="1" data-trend-curve d={smoothPath} fill="none" stroke={C.line} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" pointerEvents="none" />
      {points.map((point,index) => <circle key={'curve-point-'+index} cx={point.x} cy={point.y} r="2.8" fill={C.panel} stroke={C.line} strokeWidth="1.5" pointerEvents="none" />)}
      {active !== null && <g pointerEvents="none">
        <line x1={x(active)} x2={x(active)} y1={T} y2={y(0)} stroke={C.textMuted} strokeDasharray="3 4" />
        <circle cx={x(active)} cy={y(values[active])} r="5" fill={C.panel} stroke={C.line} strokeWidth="2" />
        <rect x={Math.max(L,Math.min(W-154,x(active)-70))} y={Math.max(5,y(values[active])-62)} width="138" height="49" rx="6" fill={C.panel} stroke={C.borderLight} />
        <text x={Math.max(L,Math.min(W-154,x(active)-70))+12} y={Math.max(5,y(values[active])-62)+18} fill={C.textDim} fontSize="11">{labels[active]}</text>
        <text x={Math.max(L,Math.min(W-154,x(active)-70))+12} y={Math.max(5,y(values[active])-62)+36} fill={C.text} fontSize="12" fontWeight="650">告警　{values[active]} 次</text>
      </g>}
    </svg> : <div style={{ minHeight: 250, display: 'grid', placeItems: 'center', color: C.textMuted }}>暂无趋势数据</div>}
  </div>;
}

function AttackTypePie({ rows }: { rows: TdpRow[] }) {
  const [active, setActive] = useState<string | null>(null);
  const counts = rows.reduce<Record<string,number>>((result,row) => {
    const label = threatTypeLabel(row.threat_type) || '其他';
    result[label] = (result[label] || 0) + Math.max(0, Number(row.count) || 0);
    return result;
  }, {});
  const entries = Object.entries(counts).filter(([,value]) => value > 0).sort((a,b) => b[1]-a[1]);
  const sum = entries.reduce((total,[,value]) => total+value,0);
  const palette = [C.green,C.blue,C.orange,C.cyan,C.red,C.line];
  const selected = entries.find(([label]) => label === active);
  const ticks = Array.from({length:72},(_,index) => {
    const position = (index+.5)/72 * sum;
    let accumulated = 0;
    const category = entries.findIndex(([,value]) => { accumulated += value; return position < accumulated; });
    const angle = index * Math.PI * 2 / 72 - Math.PI / 2;
    return {index,category,angle};
  });
  return <div className="dt-ring-body">
    <svg role="img" aria-label="攻击类型占比刻度环" viewBox="0 0 240 240" width="100%" height="156" onPointerLeave={() => setActive(null)} style={{ minWidth: 0, display: 'block' }}>
      {ticks.map(({index,category,angle}) => <line key={index}
        x1={120+Math.cos(angle)*87} y1={120+Math.sin(angle)*87} x2={120+Math.cos(angle)*(index%6===0?105:101)} y2={120+Math.sin(angle)*(index%6===0?105:101)}
        stroke={category < 0 ? C.borderLight : palette[category%palette.length]} strokeWidth="2.5" strokeLinecap="round"
        opacity={active && entries[category]?.[0] !== active ? .22 : 1} onPointerEnter={() => setActive(entries[category]?.[0] || null)} />)}
      <text x="120" y="118" textAnchor="middle" fill={C.text} fontSize="29" fontWeight="720">{(selected ? selected[1] : sum).toLocaleString()}</text>
      <text x="120" y="141" textAnchor="middle" fill={C.textMuted} fontSize="11">{selected ? selected[0] : '告警总量'}</text>
    </svg>
    <div style={{ display: 'grid', gap: 9, minWidth: 0, padding: '0 3px' }}>
      {entries.length ? entries.map(([label,value],index) => <div key={label} onPointerEnter={() => setActive(label)} onPointerLeave={() => setActive(null)} style={{ display: 'grid', gridTemplateColumns: '48px minmax(40px,1fr) 83px', gap: 9, alignItems: 'center', fontSize: 12, minWidth: 0 }}>
        <span style={{ color: C.textDim, overflowWrap: 'anywhere' }}>{label}</span>
        <div role="progressbar" aria-label={label+'告警占比'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number((value/sum*100).toFixed(1))} style={{ height: 7, borderRadius: 4, background: C.panelSoft, overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: (value/sum*100)+'%', borderRadius: 4, background: palette[index%palette.length], opacity: active && active !== label ? .4 : .78, transition: 'width .2s ease, opacity .15s ease' }} /></div>
        <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><strong style={{ color: C.text, fontWeight: 650 }}>{value}</strong><small style={{ color: C.textMuted, fontSize: 10 }}> · {(value/sum*100).toFixed(1)}%</small></span>
      </div>) : <span style={{ color: C.textMuted, fontSize: 12 }}>暂无类型数据</span>}
    </div>
  </div>;
}

function downloadCsv(rows: TdpRow[]) {
  const quote = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const columns: Array<[string, (row: TdpRow, index: number) => unknown]> = [
    ['#', (_r, i) => i + 1], ['最近发现时间', r => fmtTime(r.last_time || r.first_time)],
    ['类型', r => threatTypeLabel(r.threat_type)], ['攻击者IP/IOC', r => r.ioc || r.ip],
    ['威胁名称', r => r.threat_name || ''], ['AI研判建议', r => decisionLabel(r)],
    ['AI研判结果', r => aiLabel(r)], ['严重级别', r => severityLabel(r.severity)], ['检出次数', r => r.count],
    ['AI结论', r => r.ai_verdict || ''],
  ];
  const csv = '\ufeff' + [columns.map(([h]) => quote(h)).join(','), ...rows.map((r, i) => columns.map(([, g]) => quote(g(r, i))).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `TDP_AI_${Date.now()}.csv`; link.click();
  URL.revokeObjectURL(url);
}

function pageTokens(current: number, total: number): Array<number | string> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  let start = Math.max(2, current - 2);
  let end = Math.min(total - 1, current + 2);
  if (current <= 4) end = 5;
  if (current >= total - 3) start = total - 4;
  const result: Array<number | string> = [1];
  if (start > 2) result.push('left-ellipsis');
  for (let value = start; value <= end; value += 1) result.push(value);
  if (end < total - 1) result.push('right-ellipsis');
  result.push(total);
  return result;
}

interface SelectOption { value: number; label: string; }

function StyledSelect({ value, options, onChange, ariaLabel, placement = 'bottom', buttonStyle }: { value: number; options: SelectOption[]; onChange: (value: number) => void; ariaLabel: string; placement?: 'top' | 'bottom'; buttonStyle?: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find(option => option.value === value) || options[0];
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  return <div ref={rootRef} style={{ position: 'relative', minWidth: 0 }}>
    <button type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(value => !value)} style={{ width: '100%', minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 11px', color: C.text, background: C.panelSoft, border: `1px solid ${C.border}`, borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, ...buttonStyle }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected?.label || '--'}</span><span style={{ color: C.textDim, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .16s ease' }}><Icon name="chevron-down" size={15} /></span>
    </button>
    {open && <div role="listbox" aria-label={ariaLabel} style={{ position: 'absolute', left: 0, right: 0, ...(placement === 'top' ? { bottom: 'calc(100% + 7px)' } : { top: 'calc(100% + 7px)' }), zIndex: 160, minWidth: 132, maxHeight: 224, overflowY: 'auto', padding: 5, background: C.panel, border: `1px solid ${C.borderLight}`, borderRadius: 6, boxShadow: C.shadow, scrollbarGutter: 'stable' }}>
      {options.map(option => <button type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }} style={{ width: '100%', minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 10px', border: 'none', borderRadius: 4, background: option.value === value ? C.blueDark : 'transparent', color: option.value === value ? C.blueLight : C.textMid, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: option.value === value ? 750 : 550, textAlign: 'left' }}><span>{option.label}</span>{option.value === value && <Icon name="check" size={14} />}</button>)}
    </div>}
  </div>;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, value) => ({ value, label: String(value).padStart(2, '0') }));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, value) => ({ value, label: String(value).padStart(2, '0') }));

function DateTimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const parsed = new Date(value);
  const selected = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset);
  const days = Array.from({ length: 42 }, (_, index) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index));
  const updateDate = (day: Date) => {
    const next = new Date(selected);
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    onChange(toDatetimeLocal(next));
  };
  const updateTime = (hour: number, minute: number) => {
    const next = new Date(selected);
    next.setHours(hour, minute, 0, 0);
    onChange(toDatetimeLocal(next));
  };
  const sameDay = (left: Date, right: Date) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  return <div ref={rootRef} style={{ position: 'relative' }}>
    <span style={{ display: 'block', marginBottom: 6, color: C.textDim, fontSize: 11, fontWeight: 650 }}>{label}</span>
    <button type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => { setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1)); setOpen(value => !value); }} style={{ width: '100%', minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 10px', color: C.text, background: C.panelSoft, border: `1px solid ${open ? C.blue : C.border}`, borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 650 }}><span>{value ? value.replace('T', ' ') : '--'}</span><span style={{ color: C.blueLight }}><Icon name="calendar" size={16} /></span></button>
    {open && <div role="dialog" aria-label={`${label}日期时间选择`} style={{ position: 'absolute', right: 0, top: 'calc(100% + 7px)', zIndex: 150, width: 'min(318px, calc(100vw - 64px))', boxSizing: 'border-box', padding: 12, background: C.panel, border: `1px solid ${C.borderLight}`, borderRadius: 7, boxShadow: C.shadow }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}><button type="button" aria-label="上个月" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} style={calendarNavButtonStyle}><Icon name="chevron-left" size={17} /></button><strong style={{ color: C.text, fontSize: 14 }}>{viewMonth.getFullYear()}年{viewMonth.getMonth() + 1}月</strong><button type="button" aria-label="下个月" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} style={calendarNavButtonStyle}><Icon name="chevron-right" size={17} /></button></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>{['一', '二', '三', '四', '五', '六', '日'].map(day => <div key={day} style={{ height: 26, display: 'grid', placeItems: 'center', color: C.textMuted, fontSize: 11, fontWeight: 700 }}>{day}</div>)}{days.map(day => {
        const currentMonth = day.getMonth() === viewMonth.getMonth();
        const active = sameDay(day, selected);
        const today = sameDay(day, new Date());
        return <button type="button" key={toDatetimeLocal(day).slice(0, 10)} onClick={() => updateDate(day)} style={{ height: 32, display: 'grid', placeItems: 'center', padding: 0, border: `1px solid ${active ? C.blue : today ? C.borderLight : 'transparent'}`, borderRadius: 4, background: active ? C.blue : 'transparent', color: active ? '#fff' : currentMonth ? C.textMid : C.textMuted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: active || today ? 750 : 500 }}>{day.getDate()}</button>;
      })}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 14px 1fr', alignItems: 'center', gap: 7, marginTop: 11, paddingTop: 11, borderTop: `1px solid ${C.border}` }}><StyledSelect ariaLabel={`${label}小时`} value={selected.getHours()} options={HOUR_OPTIONS} onChange={hour => updateTime(hour, selected.getMinutes())} placement="top" /><span style={{ color: C.textDim, textAlign: 'center', fontWeight: 800 }}>:</span><StyledSelect ariaLabel={`${label}分钟`} value={selected.getMinutes()} options={MINUTE_OPTIONS} onChange={minute => updateTime(selected.getHours(), minute)} placement="top" /></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 11 }}><button type="button" onClick={() => { const now = new Date(); onChange(toDatetimeLocal(now)); setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1)); }} style={{ ...secondaryButton, minHeight: 32 }}>今天</button><button type="button" onClick={() => setOpen(false)} style={{ ...primaryButton, minHeight: 32 }}>确定</button></div>
    </div>}
  </div>;
}

function Pager({ current, total, totalItems, pageSize, onChange, onPageSizeChange }: { current: number; total: number; totalItems: number; pageSize: number; onChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void }) {
  const [jumpPage, setJumpPage] = useState('');
  const applyJump = () => {
    const target = Math.max(1, Math.min(total, Number.parseInt(jumpPage, 10) || current));
    onChange(target);
    setJumpPage('');
  };
  return <div style={paginationStyle}>
    <span style={{ color: C.textMid, whiteSpace: 'nowrap' }}>共有 {totalItems} 条信息</span>
    <button aria-label="上一页" disabled={current <= 1} onClick={() => onChange(current - 1)} style={{ ...pagerStyle, opacity: current <= 1 ? .45 : 1 }}>‹</button>
    {pageTokens(current, total).map(token => typeof token === 'number'
      ? <button key={`page-${token}`} aria-label={`第${token}页`} onClick={() => onChange(token)} style={{ ...pagerStyle, background: token === current ? 'var(--dt-control)' : C.panel, color: token === current ? 'var(--dt-control-text)' : C.textDim }}>{token}</button>
      : <span key={token} style={{ minWidth: 30, textAlign: 'center', color: C.textMuted }}>…</span>)}
    <button aria-label="下一页" disabled={current >= total} onClick={() => onChange(current + 1)} style={{ ...pagerStyle, opacity: current >= total ? .45 : 1 }}>›</button>
    <StyledSelect ariaLabel="每页条数" value={pageSize} options={[{ value: 10, label: '每页/10条' }, { value: 20, label: '每页/20条' }, { value: 50, label: '每页/50条' }]} onChange={onPageSizeChange} placement="top" buttonStyle={{ width: 132, height: 40, background: C.panel }} />
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: C.textMid, whiteSpace: 'nowrap' }}>跳至<input aria-label="跳转页码" inputMode="numeric" value={jumpPage} onChange={event => setJumpPage(event.target.value.replace(/\D/g, ''))} onKeyDown={event => { if (event.key === 'Enter') applyJump(); }} onBlur={applyJump} style={jumpInputStyle} />页</label>
  </div>;
}

export default function Page() {
  const { isDark, viewportWidth } = useAegisOpsHostState();
  const brandLogo = useBrandLogo('datang-ai-v2-demo-custom-brand-logo-v1');
  const brandNameKey = 'tdp-custom-platform-name';
  const [brandName, setBrandName] = useState(() => { try { return localStorage.getItem(brandNameKey) || 'AI 研判平台'; } catch { return 'AI 研判平台'; } });
  const renamePlatform = () => {
    const value = window.prompt('设置平台名称（留空恢复默认）', brandName);
    if (value === null) return;
    const name = value.trim().slice(0, 60) || 'AI 研判平台';
    try { localStorage.setItem(brandNameKey, name); } catch { /* keep in memory */ }
    setBrandName(name);
  };
  const isMobile = viewportWidth < 760;
  const isCompact = viewportWidth < 1080;
  const themeVars = isDark ? DARK_THEME_VARS : LIGHT_THEME_VARS;
  const initialNow = useRef(Date.now()).current;
  const initialTimeSetting = useRef(readTimeSetting(initialNow)).current;
  const [minutes, setMinutes] = useState(initialTimeSetting.minutes);
  const [timeMode, setTimeMode] = useState<'preset' | 'custom'>(initialTimeSetting.mode);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [customStart, setCustomStart] = useState(initialTimeSetting.customStart);
  const [customEnd, setCustomEnd] = useState(initialTimeSetting.customEnd);
  const [draftStart, setDraftStart] = useState(customStart);
  const [draftEnd, setDraftEnd] = useState(customEnd);
  const [refreshMs, setRefreshMs] = useState(60000);
  const [autoJudge, setAutoJudge] = useState(() => localStorage.getItem('datang-ai-v2-auto') === '1');
  const [tdp, setTdp] = useState<TdpData>({ rows: [], start_time: 0, end_time: 0 });
  const [trend, setTrend] = useState<TrendData>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [detailIp, setDetailIp] = useState<string | null>(null);
  const [outputOpen, setOutputOpen] = useState(false);
  const [vulnImports, setVulnImports] = useState<Record<string, {status:string;error?:string;url?:string}>>({});
  const importLocks = useRef(new Set<string>());
  const importAlive = useRef(true);
  useEffect(()=>{importAlive.current=true;return()=>{importAlive.current=false;};},[]);
  const transferVulnerability = async (row:TdpRow) => {
    const key=rowKey(row);
    if(importLocks.current.has(key))return;
    importLocks.current.add(key);
    const update=(state:{status:string;error?:string;url?:string})=>{if(importAlive.current)setVulnImports(prev=>({...prev,[key]:state}));};
    update({status:'pending'});
    try{
      const response=await fetch('/api/scenes/tdp/vulnerability-imports',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'ai',row_key:key,first_time:row.first_time,confirmed:true})});
      let result=await response.json();if(!response.ok)throw new Error(result.detail||result.message||'转入失败');
      for(let attempt=0;result.status==='pending' && attempt<100;attempt++){
        await new Promise(resolve=>setTimeout(resolve,1500));if(!importAlive.current)return;
        const poll=await fetch('/api/scenes/tdp/vulnerability-imports/'+result.id,{credentials:'same-origin'});const next=await poll.json();if(!poll.ok)throw new Error(next.detail||next.message||'无法获取写入进度');result=next;
      }
      if(result.status==='pending')throw new Error('AI 仍在后台处理，可再次点击查看结果，不会重复建档。');
      if(result.status==='failed')throw new Error(result.error||'AI 建档失败，请重试');
      update({status:'completed',url:result.url});
    }catch(error){update({status:'failed',error:error instanceof Error?error.message:'转入失败，请重试'});}
    finally{importLocks.current.delete(key);}
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(0);
  const [currentModel, setCurrentModel] = useState({ providerId: '', modelId: '', error: '' });
  const requestSeq = useRef(0);
  const lastTrendRangeRef = useRef('');
  const launchingRef = useRef(new Set<string>());

  const loadDashboard = useCallback(async (quiet = false) => {
    const seq = ++requestSeq.current;
    if (!quiet) setLoading(true);
    try {
      const params: Record<string, string | number> = { auto: autoJudge ? 1 : 0, _: Date.now() };
      if (timeMode === 'custom') {
        params.start_time = Math.floor(new Date(customStart).getTime() / 1000);
        params.end_time = Math.floor(new Date(customEnd).getTime() / 1000);
      } else {
        params.minutes = minutes;
      }
      const trendRangeKey = timeMode === 'custom' ? `custom:${customStart}:${customEnd}` : `preset:${minutes}`;
      params.trend_refresh = lastTrendRangeRef.current === trendRangeKey
        ? (timeMode === 'preset' ? 'current' : 'none')
        : 'range';
      const response = await api.page.get('/dashboard', { params });
      const payload = response.data as any;
      if (!payload?.ok) throw new Error(payload?.error || '看板数据获取失败');
      if (seq !== requestSeq.current) return;
      const latest = payload.data.tdp || { rows: [], start_time: 0, end_time: 0 };
      setTdp(current => ({
        ...latest,
        rows: (latest.rows || []).map((row: TdpRow) => mergeDashboardRow(
          row,
          current.rows.find(item => rowKey(item) === rowKey(row)),
        )),
      }));
      setTrend(payload.trend || {});
      setUpdatedAt(payload.fetched_at || Math.floor(Date.now() / 1000));
      lastTrendRangeRef.current = trendRangeKey;
      setError('');
    } catch (e) {
      if (seq === requestSeq.current) setError(e instanceof Error ? e.message : '看板数据获取失败');
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [minutes, timeMode, customStart, customEnd, autoJudge]);

  useEffect(() => { setPage(1); void loadDashboard(); }, [loadDashboard]);
  useEffect(() => {
    if (!refreshMs) return;
    const timer = window.setInterval(() => void loadDashboard(true), refreshMs);
    return () => window.clearInterval(timer);
  }, [refreshMs, loadDashboard]);
  useEffect(() => {
    const loadModel = async () => {
      try {
        const response = await api.get('/api/default-model/resolved');
        setCurrentModel({
          providerId: String(response.data?.provider_id || ''),
          modelId: String(response.data?.model_id || ''),
          error: '',
        });
      } catch {
        setCurrentModel({ providerId: '', modelId: '', error: '未配置' });
      }
    };
    void loadModel();
    const timer = window.setInterval(() => void loadModel(), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const launchJudgement = useCallback(async (row: TdpRow, secondRound = false) => {
    const launchKey = `${rowKey(row)}:${secondRound ? 2 : 1}`;
    if (launchingRef.current.has(launchKey)) return;
    launchingRef.current.add(launchKey);
    try {
      const prepared = await api.page.post('/judgement/prepare', {
        ip: row.ip,
        start_time: tdp.start_time,
        end_time: tdp.end_time,
        alert_time: row.last_time || tdp.end_time,
        alert_context: {
          threat_name: row.threat_name || '',
          ioc: row.ioc || row.ip,
          severity: row.severity || '',
          count: row.count,
          threat_type: row.threat_type || '',
          is_cdn: Boolean(row.is_cdn),
          is_exit: Boolean(row.is_exit),
          geo_data: row.geo_data || {},
          src_ip_geo_data: row.src_ip_geo_data || {},
          distributed_scan_campaign: Boolean(row.distributed_scan_campaign),
          scan_campaign_family: row.scan_campaign_family || '',
          scan_campaign_source_count: row.scan_campaign_source_count || 0,
          scan_campaign_event_count: row.scan_campaign_event_count || 0,
          scan_campaign_target_count: row.scan_campaign_target_count || 0,
          scan_campaign_same_target_source_count: row.scan_campaign_same_target_source_count || 0,
          scan_campaign_window_seconds: row.scan_campaign_window_seconds || 0,
          scan_campaign_start_time: row.scan_campaign_start_time || 0,
          scan_campaign_end_time: row.scan_campaign_end_time || 0,
          scan_campaign_source_ips: row.scan_campaign_source_ips || [],
          aggregation_type: row.aggregation_type || '',
          aggregation_key: row.aggregation_key || '',
          grouped_row_count: row.grouped_row_count || 0,
          grouped_ips: row.grouped_ips || [],
          grouped_targets: row.grouped_targets || [],
          grouped_ports: row.grouped_ports || [],
        },
        second_round: secondRound,
        first_judgement: secondRound ? {
          verdict: row.ai_verdict,
          ban_decision: row.ai_ban_decision,
          confidence: row.ai_confidence,
          summary: row.ai_summary,
          evidence: row.ai_evidence || [],
          severity: row.ai_severity || '未知',
          attack_outcome: row.ai_attack_outcome || '尝试/未知',
          compromise_status: row.ai_compromise_status || '无法确认',
          supporting_evidence: row.ai_supporting_evidence || [],
          contradicting_evidence: row.ai_contradicting_evidence || [],
          missing_information: row.ai_missing_information || [],
          affected_targets: row.ai_affected_targets || [],
          key_iocs: row.ai_key_iocs || [],
          human_checkpoints: row.ai_human_checkpoints || [],
        } : undefined,
      });
      if (!prepared.data?.ok) throw new Error(prepared.data?.error || '研判准备失败');
      const workflowId = String(prepared.data.workflow_id || '');
      if (prepared.data.demo_result) {
        const completed = await api.page.post('/judgement/complete', {
          task_key: prepared.data.task_key,
          result: prepared.data.demo_result,
          raw_output: '演示环境使用包内固定证据，不调用生产 TDP 或模型。',
        });
        if (!completed.data?.ok) throw new Error(completed.data?.error || '演示研判完成失败');
        setTdp(current => ({ ...current, rows: current.rows.map(item => rowKey(item) === rowKey(row) ? mergeAi(item, {
          status: 'done', phase: 'done', label: '已完成', ...completed.data.result,
          task_key: prepared.data.task_key, workflow_id: '', execution_id: '',
        }) : item) }));
        return;
      }
      if (!workflowId || !prepared.data.inputs) throw new Error('固定研判工作流配置缺失');
      const execution = await api.post(`/api/workflow/${encodeURIComponent(workflowId)}/run`, {
        inputs: prepared.data.inputs,
        timeoutS: 900,
        trace: false,
        agent: prepared.data.agent,
      });
      const executionId = execution.data?.id;
      if (!executionId) throw new Error('AegisOps 工作流启动失败');
      await api.page.post('/judgement/register', {
        task_key: prepared.data.task_key,
        workflow_id: workflowId,
        execution_id: executionId,
      });
      setTdp(current => ({ ...current, rows: current.rows.map(item => rowKey(item) === rowKey(row) ? mergeAi(item, {
        status: 'pending', phase: 'queued', label: '队列中', progress: '等待固定工作流执行',
        task_key: prepared.data.task_key, workflow_id: workflowId, execution_id: executionId,
      }) : item) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '研判提交失败');
    } finally {
      launchingRef.current.delete(launchKey);
    }
  }, [tdp.start_time, tdp.end_time]);

  const pendingRows = useMemo(() => tdp.rows.filter(row => row.ai_status === 'pending' && row.ai_task_key), [tdp.rows]);
  useEffect(() => {
    if (!pendingRows.length) return;
    const poll = async () => {
      const updates = await Promise.all(pendingRows.slice(0, MAX_AI_CONCURRENCY).map(async row => {
        try {
          const status = await api.page.get('/judgement/status', { params: { task_key: row.ai_task_key, _: Date.now() } });
          if (status.data?.ai?.status !== 'pending') {
            return status.data?.ok ? { key: rowKey(row), ai: status.data.ai } : null;
          }
          const workflowId = String(status.data?.ai?.workflow_id || row.ai_workflow_id || '');
          const executionId = String(status.data?.ai?.execution_id || row.ai_execution_id || '');
          if (workflowId && executionId) {
            const run = await api.get(`/api/workflow/${encodeURIComponent(workflowId)}/history/${encodeURIComponent(executionId)}`);
            const runStatus = String(run.data?.status || 'running');
            if (runStatus === 'success' && run.data?.outputResults?.judgement) {
              const completed = await api.page.post('/judgement/complete', {
                task_key: row.ai_task_key,
                result: run.data.outputResults.judgement,
                raw_output: run.data.outputResults.judgement.raw_output || '',
              });
              return completed.data?.ok ? { key: rowKey(row), ai: {
                status: 'done', phase: 'done', label: '已完成', ...completed.data.result,
                task_key: row.ai_task_key, workflow_id: workflowId, execution_id: executionId,
              } } : null;
            }
            if (['error', 'timeout', 'cancelled'].includes(runStatus)) {
              const failed = await api.page.post('/judgement/fail', {
                task_key: row.ai_task_key,
                error: run.data?.errorMessage || `固定工作流执行${runStatus}`,
              });
              return failed.data?.ok ? { key: rowKey(row), ai: failed.data.ai } : null;
            }
          }
          return status.data?.ok ? { key: rowKey(row), ai: status.data.ai } : null;
        } catch { return null; }
      }));
      setTdp(current => ({ ...current, rows: current.rows.map(row => {
        const update = updates.find(item => item?.key === rowKey(row));
        return update ? mergeAi(row, update.ai) : row;
      }) }));
    };
    const timer = window.setInterval(() => void poll(), 3000);
    return () => window.clearInterval(timer);
  }, [pendingRows.map(row => `${rowKey(row)}:${row.ai_task_key}:${row.ai_execution_id}`).join('|')]);

  useEffect(() => {
    if (!autoJudge || !tdp.start_time || !tdp.end_time) return;
    const active = tdp.rows.filter(row => row.ai_status === 'pending').length + launchingRef.current.size;
    const available = Math.max(0, MAX_AI_CONCURRENCY - active);
    if (!available) return;
    const candidates = tdp.rows
      .filter(row => (!row.ai_status || row.ai_status === 'none') && row.count >= 1)
      .filter(row => !launchingRef.current.has(`${rowKey(row)}:1`))
      .slice(0, available);
    candidates.forEach(row => { void launchJudgement(row, false); });
  }, [autoJudge, tdp.start_time, tdp.end_time, tdp.rows, launchJudgement]);

  const startJudge = async (row: TdpRow) => {
    await launchJudgement(row, false);
  };

  const openDetail = async (row: TdpRow) => {
    setDetailIp(rowKey(row));
    if (row.ai_status !== 'done' && row.ai_status !== 'pending') return;
    try {
      const response = await api.page.get('/judgement/status', { params: { task_key: row.ai_task_key || '', ip: row.ip, _: Date.now() } });
      if (!response.data?.ok || !response.data?.ai) return;
      setTdp(current => ({ ...current, rows: current.rows.map(item => rowKey(item) === rowKey(row)
        ? mergeAi(item, response.data.ai)
        : item) }));
    } catch {
      // 列表摘要仍可查看，单条全文加载失败不覆盖现有研判结果。
    }
  };

  const openWorkbench = async (row: TdpRow) => {
    try {
      if (row.ai_workflow_id) {
        window.location.assign(`/workflows/${encodeURIComponent(row.ai_workflow_id)}`);
        return;
      }
      if (row.ai_session_id) {
        window.location.assign(`/sessions?session=${encodeURIComponent(row.ai_session_id)}`);
        return;
      }
      const prefix = `TDP-judgement-${row.ip}-`;
      const response = await api.get('/api/session', {
        params: { view: 'list', status: 'all', search: prefix, limit: 100 },
      });
      const sessions = Array.isArray(response.data) ? response.data : [];
      const matches = sessions
        .filter((item: any) => String(item?.title || '').startsWith(prefix))
        .sort((a: any, b: any) => Number(b?.time?.updated || b?.time?.created || 0) - Number(a?.time?.updated || a?.time?.created || 0));
      if (!matches.length || !matches[0]?.id) throw new Error('未找到该 IP 的 AegisOps 研判会话');
      window.location.assign(`/sessions?session=${encodeURIComponent(matches[0].id)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '研判工作台打开失败');
    }
  };

  const rows = useMemo(() => [...(tdp.rows || [])].sort((left, right) => {
    const rightTime = Number(right.last_time || right.first_time || 0);
    const leftTime = Number(left.last_time || left.first_time || 0);
    if (rightTime !== leftTime) return rightTime - leftTime;
    return String(left.ip).localeCompare(String(right.ip));
  }), [tdp.rows]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const done = rows.filter(r => r.ai_status === 'done').length;
  const pending = rows.filter(r => r.ai_status === 'pending').length;
  const detail = detailIp ? rows.find(r => rowKey(r) === detailIp) : undefined;
  const cards = [
    ['汇总攻击', tdp.event_total ?? rows.reduce((s, r) => s + Number(r.count || 0), 0)],
    ['流量检测 TDP', tdp.event_total ?? 0], ['攻击 IP 数', rows.length], ['AI 已研判', done], ['AI 研判中', pending],
    ['AI 研判率', rows.length ? `${(done / rows.length * 100).toFixed(1)}%` : '0.0%'],
  ];
  const metricCards = [
    { label: '汇总攻击', value: cards[0][1], hint: '当前时间范围事件总量', icon: 'activity', accent: C.blue, soft: C.blueDark },
    { label: '流量检测 TDP', value: cards[1][1], hint: 'TDP 告警聚合输出', icon: 'shield', accent: C.cyan, soft: C.cyanDark },
    { label: '攻击 IP 数', value: cards[2][1], hint: '按攻击源去重统计', icon: 'chart', accent: C.red, soft: C.redDark },
    { label: 'AI 已研判', value: cards[3][1], hint: '已形成处置建议', icon: 'bot', accent: C.green, soft: C.greenDark },
    { label: 'AI 研判中', value: cards[4][1], hint: '正在排队或运行', icon: 'spark', accent: C.orange, soft: C.orangeDark },
    { label: 'AI 研判率', value: cards[5][1], hint: '完成数 / 攻击 IP 数', icon: 'clock', accent: C.blue, soft: C.blueDark },
  ];
  const timeControlValue = timeMode === 'custom'
    ? '自定义时间'
    : (TIME_PRESETS.find(item => item.minutes === minutes)?.label || '最近2小时');
  const syncText = error ? '连接异常' : loading ? '同步中' : refreshMs ? '已同步' : '手动刷新';

  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);

  return <div data-aegisops-theme={isDark ? 'dark' : 'light'} data-layout={isMobile ? 'mobile' : isCompact ? 'compact' : 'desktop'} style={{ ...themeVars, background: C.pageBg, width: '100%', height: '100vh', minHeight: 0, color: C.text, fontFamily: FONT, margin: isCompact ? -12 : -16, transition: 'background-color .18s ease, color .18s ease', overflowX: 'hidden', overflowY: 'auto', scrollbarGutter: 'stable' }}>
    <style>{`[data-aegisops-theme] { -webkit-font-smoothing: antialiased; letter-spacing: 0; scrollbar-width: thin; scrollbar-color: var(--dt-border-strong) transparent; }
      [data-aegisops-theme] button { font-family: inherit; transition: background .16s ease, box-shadow .16s ease; }
      [data-aegisops-theme] button:enabled:hover { filter: brightness(.97); }
      [data-aegisops-theme] .dt-detail-button:hover { background: var(--dt-blue-bg) !important; }
      [data-aegisops-theme] button:disabled { cursor: not-allowed; }
      [data-aegisops-theme] button:focus-visible { outline: 2px solid var(--dt-blue); outline-offset: 3px; }
      [data-aegisops-theme] tbody tr:hover { background: var(--dt-blue-bg) !important; }
      [data-aegisops-theme] svg { flex-shrink: 0; }
      [data-aegisops-theme] { --dt-ease: cubic-bezier(.16,1,.3,1); }
      [data-aegisops-theme] .dt-metric { animation: dt-enter .55s var(--dt-ease) backwards; transition: box-shadow .22s ease, border-color .22s ease; }
      [data-aegisops-theme] .dt-metric:hover { border-color: var(--dt-border-strong); box-shadow: 0 4px 16px rgba(46,58,62,.07); }
      [data-aegisops-theme] button { transition: background .18s ease, color .18s ease, box-shadow .22s ease, transform .22s var(--dt-ease) !important; }
      [data-aegisops-theme] button:enabled:active { transform: translateY(1px); }
      [data-aegisops-theme] button:disabled { transform: none; }
      .dt-trend-bar { transform-box: fill-box; transform-origin: center bottom; animation: dt-bar-grow .7s var(--dt-ease) backwards; }
      .dt-trend-curve { animation: dt-curve-draw .9s var(--dt-ease) .12s backwards; }
      .dt-report-dialog { animation: dt-dialog-open .3s var(--dt-ease) both; }
      .dt-report-content { animation: dt-panel-enter .23s var(--dt-ease); }
      .dt-report-tabs button { transition: color .16s ease, border-color .2s ease !important; }
      [data-aegisops-theme] [role=progressbar] > span { animation: dt-progress-grow .65s var(--dt-ease) backwards; transform-origin: left center; }
      @keyframes dt-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      @keyframes dt-bar-grow { from { opacity: .15; transform: scaleY(.08); } to { opacity: 1; transform: none; } }
      @keyframes dt-progress-grow { from { opacity: .2; transform: scaleX(.06); } to { opacity: 1; transform: none; } }
      @keyframes dt-curve-draw { from { stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; } to { stroke-dasharray: 1; stroke-dashoffset: 0; opacity: 1; } }
      @keyframes dt-dialog-open { from { opacity: 0; transform: translateY(10px) scale(.99); } to { opacity: 1; transform: none; } }
      @keyframes dt-panel-enter { from { opacity: .3; transform: translateY(4px); } to { opacity: 1; transform: none; } }
      @media (prefers-reduced-motion: reduce) { [data-aegisops-theme] *, [data-aegisops-theme] *::before, [data-aegisops-theme] *::after { animation: none !important; transition: none !important; transform: none !important; scroll-behavior: auto !important; } }
      @media (hover:hover) { [data-aegisops-theme] button:enabled:hover { box-shadow: 0 3px 10px rgba(46,58,62,.08); } }
      .dt-report-dialog, .dt-report-dialog * { font-family: "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif !important; letter-spacing: 0 !important; font-synthesis: none; }
      .dt-report-dialog { font-size: 13px; line-height: 1.7; font-weight: 400; font-variant-numeric: tabular-nums; }
      .dt-report-dialog button { font-size: 13px; font-weight: 600; }
      .dt-report-dialog .dt-report-content { font-size: 13px; font-weight: 400; }
      .dt-report-dialog .dt-report-heading { font-size: 15px; font-weight: 650; }
      .dt-report-dialog code { font-size: 12px !important; font-weight: 500 !important; }
      .dt-report-dialog pre { font-size: 12px !important; font-weight: 400 !important; line-height: 1.7 !important; }
      .dt-report-dialog strong { font-weight: 650; }
      .dt-report-summary { display: grid; grid-template-columns: minmax(180px, 1fr) minmax(0, 1.7fr); gap: 24px; padding: 22px 28px; border-bottom: 1px solid var(--dt-border); background: var(--dt-panel); }
      .dt-report-metrics { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 16px; }
      .dt-report-tabs { flex: 0 0 auto; display: flex; padding: 0 28px; background: var(--dt-panel-soft); border-bottom: 1px solid var(--dt-border); }
      .dt-report-content { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 24px 28px; scrollbar-gutter: stable; }
      .dt-report-columns { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 24px; }
      .dt-report-heading { margin: 0; font-size: 15px; line-height: 1.4; font-weight: 700; color: var(--dt-text); }
      .dt-report-section { padding-top: 22px; margin-top: 22px; border-top: 1px solid var(--dt-border); }
      .dt-overview-fields { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 0 28px; margin: 12px 0 0; }
      @media (max-width:1080px) { .dt-report-summary { grid-template-columns: minmax(0,1fr); gap: 18px; } .dt-report-columns { grid-template-columns: minmax(0,1fr); } }
      @media (max-width:760px) { .dt-report-summary { padding: 16px; } .dt-report-metrics { grid-template-columns: repeat(2,minmax(0,1fr)); } .dt-report-content { padding: 18px 16px; } .dt-report-tabs { padding: 0 16px; } .dt-overview-fields { grid-template-columns: minmax(0,1fr); } }
      .dt-trend-body { display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 18px; align-items: center; padding: 12px; min-width: 0; }
      .dt-ring-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; align-items: center; min-width: 0; }
      [data-aegisops-theme] * { font-family: inherit; }
      [data-aegisops-theme] code, [data-aegisops-theme] pre { font-family: Consolas, monospace; }
      @media (max-width: 760px) { .dt-trend-body { grid-template-columns: minmax(0, 1fr); } .dt-trend-body > div:first-child { flex-direction: row !important; flex-wrap: wrap; align-items: center; justify-content: space-between !important; } }
      [data-layout="mobile"] [data-tdp-controls] { gap: 8px !important; }
      [data-layout="mobile"] header { padding: 16px 12px !important; }
      [data-layout="mobile"] h1 { font-size: 18px !important; }
      @media (prefers-reduced-motion: reduce) { [data-aegisops-theme] * { transition: none !important; } }
    `}</style>
    <header style={topbarStyle}>
      <div style={brandStyle}>
        <div style={{ position: 'relative' }}><button type="button" aria-label="更换 Logo" title="点击更换 Logo" onClick={brandLogo.chooseLogo} style={brandLogoStyle}>{brandLogo.logo ? <img src={brandLogo.logo} alt="工作台 Logo" style={{ maxWidth: isMobile ? 160 : 220, height: isMobile ? 24 : 28, objectFit: 'contain' }} /> : <span style={{ color: C.textDim, fontSize: 12, fontWeight: 600 }}>＋ 上传 Logo</span>}</button><input ref={brandLogo.inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={brandLogo.onLogoChange} style={{ display: 'none' }} />{brandLogo.logo && <button type="button" aria-label="恢复默认 Logo" title="恢复默认 Logo" onClick={brandLogo.resetLogo} style={resetLogoButtonStyle}>×</button>}</div>
        <div style={{ minWidth: 0 }}><h1 style={brandTitleStyle}><button type="button" onClick={renamePlatform} title="点击自定义平台名称" aria-label="修改平台名称" style={{ font: 'inherit', color: 'inherit', background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }}>{brandName} · 演示</button></h1><div style={{ marginTop: 4, color: C.textDim, fontSize: 12, fontWeight: 600 }}>固定样例数据 · 只读演示 · 不连接生产 TDP</div></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
        <span style={chipStyle}><span style={{ ...statusDotStyle, background: error ? C.red : loading ? C.orange : C.green }} />{syncText}</span>
        <span style={chipStyle}><Icon name="clock" size={16} />{error || fmtTime(updatedAt)}</span>
        <button type="button" title="立即刷新" onClick={() => void loadDashboard()} style={primaryButton}><Icon name="refresh" size={16} />{loading ? '刷新中' : '刷新'}</button>
      </div>
    </header>

    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16, padding: isMobile ? 12 : '20px 28px 32px', alignItems: 'start', minHeight: 'calc(100vh - 68px)' }}>
      <main className="dt-dashboard-main" style={{ display: 'grid', gap: 14, minWidth: 0 }}>
        <section style={{ padding: 0 }}>
          <div data-tdp-controls style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : isCompact ? 'repeat(2, minmax(0, 1fr))' : '1.05fr .8fr .95fr 1fr 1.15fr', gap: 12, alignItems: 'stretch' }}>
            <div style={{ ...syncFieldStyle, position: 'relative', padding: 0 }}>
              <button type="button" aria-label="时间范围" aria-expanded={timePickerOpen} onClick={() => { setDraftStart(customStart); setDraftEnd(customEnd); setTimePickerOpen(open => !open); }} style={{ width: '100%', height: '100%', minHeight: 58, border: 'none', background: 'transparent', color: C.text, textAlign: 'left', cursor: 'pointer', padding: '10px 12px' }}>
                <span style={syncLabelStyle}>时间范围</span><span style={syncValueStyle}><span>{timeControlValue}</span><small>▾</small></span>
              </button>
              {timePickerOpen && <div style={{ position: 'absolute', right: isMobile ? 'auto' : 0, left: isMobile ? 0 : 'auto', top: 'calc(100% + 8px)', zIndex: 80, width: isMobile ? 'min(340px, calc(100vw - 42px))' : 360, boxSizing: 'border-box', padding: 14, background: C.panel, border: `1px solid ${C.borderLight}`, borderRadius: 8, boxShadow: C.shadow }}>
                <div style={{ color: C.textMid, fontSize: 12, fontWeight: 650, marginBottom: 8 }}>快捷时间</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 13 }}>{TIME_PRESETS.map(item => <button type="button" key={item.minutes} onClick={() => { setMinutes(item.minutes); setTimeMode('preset'); saveTimeSetting('preset', item.minutes, customStart, customEnd); setTimePickerOpen(false); }} style={{ padding: '7px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: timeMode === 'preset' && minutes === item.minutes ? C.blueDark : C.panelSoft, color: timeMode === 'preset' && minutes === item.minutes ? C.blueLight : C.textMid, border: `1px solid ${timeMode === 'preset' && minutes === item.minutes ? C.blue : C.border}` }}>{item.label}</button>)}</div>
                <div style={{ color: C.textMid, fontSize: 12, fontWeight: 650, marginBottom: 8 }}>自定义时间</div>
                <DateTimeField label="开始时间" value={draftStart} onChange={setDraftStart} />
                <div style={{ marginTop: 9 }}><DateTimeField label="结束时间" value={draftEnd} onChange={setDraftEnd} /></div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 13 }}><button type="button" onClick={() => setTimePickerOpen(false)} style={secondaryButton}>取消</button><button type="button" onClick={() => { const nextStart = draftStart; const nextEnd = draftEnd; const start = new Date(nextStart).getTime(); const end = new Date(nextEnd).getTime(); if (!nextStart || !nextEnd || Number.isNaN(start) || Number.isNaN(end) || end <= start) { setError('自定义结束时间必须晚于开始时间'); return; } setCustomStart(nextStart); setCustomEnd(nextEnd); setTimeMode('custom'); saveTimeSetting('custom', minutes, nextStart, nextEnd); setTimePickerOpen(false); }} style={primaryButton}>应用</button></div>
              </div>}
            </div>
            <div style={syncFieldStyle}><span style={syncLabelStyle}>刷新频率</span><StyledSelect ariaLabel="刷新频率" value={refreshMs} options={[{ value: 5000, label: '5秒' }, { value: 30000, label: '30秒' }, { value: 60000, label: '1分钟' }, { value: 0, label: '已关闭' }]} onChange={setRefreshMs} buttonStyle={{ minHeight: 24, padding: 0, background: 'transparent', border: 'none', color: C.text, fontSize: 15, justifyContent: 'space-between' }} /></div>
            <button type="button" role="switch" aria-label="AI自动研判" aria-checked={autoJudge} onClick={() => { const next = !autoJudge; setAutoJudge(next); localStorage.setItem('datang-ai-v2-auto', next ? '1' : '0'); }} style={{ ...syncFieldStyle, fontFamily: 'inherit', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', color: C.text, cursor: 'pointer' }}>
              <span><span style={syncLabelStyle}>AI自动研判</span><span style={{ color: autoJudge ? C.blueLight : C.textDim, fontSize: 15, fontWeight: 700 }}>{autoJudge ? '已开启' : '已关闭'}</span></span>
              <span style={{ width: 48, height: 26, padding: 3, borderRadius: 999, background: autoJudge ? C.blue : C.borderLight, flex: '0 0 auto', display: 'flex', justifyContent: autoJudge ? 'flex-end' : 'flex-start', transition: '.2s' }}><span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 3px 8px rgba(28,44,66,.18)' }} /></span>
            </button>
            <div aria-label="当前AI模型" title={currentModel.modelId ? `${currentModel.providerId}/${currentModel.modelId}` : currentModel.error} style={syncFieldStyle}><span style={syncLabelStyle}>当前AI模型</span><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: currentModel.modelId ? C.blueLight : C.textDim, fontSize: 15, fontWeight: 700 }}>{currentModel.modelId || currentModel.error || '读取中'}</span>{currentModel.providerId && <small style={{ color: C.textMuted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentModel.providerId}</small>}</div>
            <div style={{ ...syncFieldStyle, borderColor: error ? C.red : C.border }}><span style={syncLabelStyle}>{error ? '连接异常' : '最近更新'}</span><span style={{ color: error ? C.redLight : C.textMid, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{error || fmtTime(updatedAt)}</span></div>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : isCompact ? 'repeat(3, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))', gap: 14 }}>
          {metricCards.map((card, index) => <div className="dt-metric" key={card.label} style={{ ...metricStyle, animationDelay: (index*45)+'ms', background: index === 0 ? 'var(--dt-accent-soft)' : C.panel }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><div style={{ ...labelStyle, color: C.textDim, fontWeight: 600 }}>{card.label}</div><div style={{ ...metricIconStyle, background: 'transparent', color: index === 0 ? C.greenLight : C.textMuted }}><Icon name={card.icon} size={17} /></div></div>
            <div style={{ minWidth: 0 }}><div style={metricValueStyle}>{String(card.value)}</div><div style={{ ...hintStyle, marginTop: 7 }}>{card.hint}</div></div>
          </div>)}
        </section>

        <section style={{ padding: 0 }}>
          <div style={sectionHeadStyle}><div><h2 style={sectionTitleStyle}>外网攻击趋势</h2><p style={sectionDescStyle}>{fmtTime(tdp.start_time)} ~ {fmtTime(tdp.end_time)}</p></div><div style={legendStyle}><span style={{ ...legendDotStyle, background: C.green }} />告警次数</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 1.8fr) minmax(330px, .82fr)', gap: 14, alignItems: 'stretch' }}>
            <div style={{ ...panelStyle, background: 'linear-gradient(120deg, var(--dt-accent-soft), var(--dt-panel) 68%)', minWidth: 0, minHeight: 290, display: 'grid', alignItems: 'center', padding: '14px 10px', overflow: 'hidden' }}><TrendChart trend={trend} /></div>
            <div style={{ ...panelStyle, minWidth: 0, padding: '18px 20px', boxSizing: 'border-box' }}><div style={{ marginBottom: 4, color: C.text, fontSize: 14, fontWeight: 800 }}>攻击类型分布</div><div style={{ marginBottom: 8, color: C.textMuted, fontSize: 11 }}>当前时间范围内的告警占比</div><AttackTypePie rows={tdp.rows} /></div>
          </div>
        </section>

        <section style={{ ...panelStyle, height: 782, minHeight: 782, maxHeight: 782, boxSizing: 'border-box', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ ...sectionHeadStyle, marginBottom: 0, padding: '20px 20px 14px', borderBottom: `1px solid ${C.border}`, flex: '0 0 auto' }}>
            <div style={{ minWidth: 0 }}><h2 style={sectionTitleStyle}>TDP 攻击源列表</h2><p style={sectionDescStyle}>共 {rows.length} 条 · 每页 {pageSize} 条 · 第 {page}/{pages} 页</p></div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <MiniStat icon="shield" label="TDP列表" value={`${rows.length} 个研判事件`} />
              <MiniStat icon="bot" label="AI研判" value={`${done} 已完成 / ${pending} 进行中`} />
              <button onClick={() => downloadCsv(rows)} style={secondaryButton}><Icon name="download" size={15} />下载</button>
            </div>
          </div>
          <div data-tdp-table-scroll style={{ overflow: 'auto', flex: '1 1 auto', minHeight: 0, WebkitOverflowScrolling: 'touch', scrollbarGutter: 'stable' }}><table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 1320 }}><colgroup>
            {['12%', '7%', '14%', '17%', '11%', '11%', '8%', '8%', '12%'].map((width, index) => <col key={index} style={{ width }} />)}
          </colgroup><thead><tr>
            {['最近发现时间', '类型', '攻击者IP/IOC', '威胁名称', 'AI研判建议', 'AI研判结果', '严重级别', '检出次数', '操作'].map(h => <th key={h} style={{ ...thStyle, textAlign: h === '检出次数' ? 'right' : 'left' }}>{h}</th>)}
          </tr></thead><tbody>{pageRows.map((row, i) => {
            const severity = severityLabel(row.severity);
            const severityColor = severity === '严重' || severity === '高危' ? C.redLight : severity === '中危' ? C.orangeLight : C.textDim;
            return <tr key={rowKey(row)} style={{ height: 58, background: i % 2 ? C.rowAlt : 'transparent' }}>
              <td title={fmtTime(row.last_time || row.first_time)} style={{ ...tdStyle, color: C.textMid, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(row.last_time || row.first_time)}</td>
              <td style={tdStyle}><span style={typeBadgeStyle}>{threatTypeLabel(row.threat_type)}</span></td>
              <td title={row.ioc || row.ip} style={{ ...tdStyle, padding: '6px 14px', color: C.cyanLight, fontFamily: 'Consolas, monospace', fontWeight: 700 }}><div style={{ lineHeight: '14px' }}>{row.ioc || row.ip}</div>{Boolean(row.grouped_row_count && row.grouped_row_count > 1) && <div style={{ marginTop: 2, color: C.textMuted, fontFamily: FONT, fontSize: 11, lineHeight: '14px', fontWeight: 650 }}>已聚合 {row.grouped_row_count} 个来源</div>}</td>
              <td title={row.threat_name || '--'} style={{ ...tdStyle, color: C.text, fontWeight: 700 }}>{row.threat_name || '--'}</td>
              <td title={row.ai_recommended_action || decisionLabel(row)} style={{ ...tdStyle, color: ['建议封禁', '仅阻断域名', '出站阻断域名', '隔离并封禁'].includes(decisionLabel(row)) ? C.redLight : decisionLabel(row) === '不建议封禁' ? C.greenLight : C.textMid, fontWeight: decisionLabel(row) === '-' ? 500 : 700, whiteSpace: 'nowrap' }}>{decisionLabel(row) === '-' ? '--' : decisionLabel(row)}</td>
              <td style={tdStyle}><AIResultBadge row={row} onStart={item => void startJudge(item)} /></td>
              <td style={{ ...tdStyle, color: severityColor, fontWeight: 700, whiteSpace: 'nowrap' }}>{severity === '--' ? '--' : <><span style={{ color: severityColor }}>●</span> {severity}</>}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 750, color: row.count >= 50 ? C.redLight : C.text }}>{row.count}</td>
              <td style={tdStyle}><button type="button" onClick={() => void openDetail(row)} className="dt-detail-button" style={detailLinkStyle}>查看详情</button></td>
            </tr>;
          })}{rows.length > 0 && Array.from({ length: Math.max(0, 10 - pageRows.length) }, (_, index) => <tr aria-hidden="true" key={`empty-row-${index}`} style={{ height: 58, background: (pageRows.length + index) % 2 ? C.rowAlt : 'transparent' }}><td colSpan={9} style={{ ...tdStyle, color: 'transparent' }}>&nbsp;</td></tr>)}</tbody></table></div>
          {!rows.length && <div style={{ padding: 38, textAlign: 'center', color: C.textMuted }}>{loading ? '正在获取 TDP 数据...' : error || '当前时间范围暂无数据'}</div>}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: 64, minHeight: 64, maxHeight: 64, boxSizing: 'border-box', padding: '10px 18px', borderTop: `1px solid ${C.border}`, background: C.panel, flex: '0 0 auto', overflow: 'visible' }}><Pager current={page} total={pages} totalItems={rows.length} pageSize={pageSize} onChange={setPage} onPageSizeChange={nextPageSize => { setPageSize(nextPageSize); setPage(1); }} /></div>
        </section>
      </main>
    </div>

    {detail && <div onClick={() => { setDetailIp(null); setOutputOpen(false); }} style={modalMask}><div className="dt-report-dialog" onClick={e => e.stopPropagation()} style={{ ...modalCard, width: 'min(1440px, calc(100vw - 32px))', height: 'min(920px, calc(100dvh - 32px))', maxHeight: 'calc(100dvh - 32px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ ...modalHead, flex: '0 0 auto', background: C.panel, zIndex: 2 }}>
        <div style={{ minWidth: 0 }}><strong style={{ color: C.text, fontSize: 20, lineHeight: 1.25 }}>告警研判详情</strong><div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 5, color: C.textDim, fontSize: 12, flexWrap: 'wrap' }}><code style={inlineCodeStyle}>{detail.ip}</code><span>{detail.threat_name || 'TDP 告警研判'}</span><span>·</span><span>{fmtTime(detail.last_time || detail.first_time)}</span></div></div>
        <button aria-label="关闭研判详情" title="关闭" onClick={() => { setDetailIp(null); setOutputOpen(false); }} style={closeStyle}><Icon name="x" size={20} /></button>
      </div>
      <ReviewReport key={rowKey(detail)} row={detail} compact={isCompact} />
      <div style={{padding:'10px 20px',borderTop:`1px solid ${C.border}`,background:C.panel,color:C.textMuted,fontSize:12}}>当前为隔离演示环境，样例告警不会写入正式漏洞台账。正式环境提供“确认攻击成功 · AI 转入漏洞”。</div><div style={reportActionsStyle}><button disabled title="演示数据不写入正式台账" style={{...secondaryButton,opacity:.5}}>AI 转入漏洞（正式环境可用）</button><button disabled={detail.ai_status === 'pending'} title={detail.ai_status === 'done' ? '重新执行固定工作流并用最新结果更新当前详情' : detail.ai_status === 'pending' ? '研判正在执行' : '开始AI研判'} onClick={() => detail.ai_status === 'done' ? void launchJudgement(detail, true) : detail.ai_status !== 'pending' ? void startJudge(detail) : undefined} style={{ ...primaryButton, opacity: detail.ai_status === 'pending' ? .58 : 1, cursor: detail.ai_status === 'pending' ? 'not-allowed' : 'pointer' }}><Icon name={detail.ai_status === 'done' ? 'spark' : 'bot'} size={15} />{detail.ai_status === 'done' ? '二次研判' : detail.ai_status === 'pending' ? '研判中' : 'AI研判'}</button><button onClick={() => void openWorkbench(detail)} style={secondaryButton}>查看工作台</button><button disabled={!detail.ai_raw_output && !detail.ai_progress} onClick={() => setOutputOpen(true)} style={{ ...secondaryButton, opacity: detail.ai_raw_output || detail.ai_progress ? 1 : .45 }}>AI输出全文</button><button onClick={() => setDetailIp(null)} style={secondaryButton}>关闭</button></div>
    </div></div>}
    {detail && outputOpen && <div onClick={() => setOutputOpen(false)} style={{ ...modalMask, zIndex: 1100 }}><div onClick={e => e.stopPropagation()} style={{ ...modalCard, width: 'min(920px, 96vw)' }}><div style={modalHead}><strong>AI输出全文</strong><button onClick={() => setOutputOpen(false)} style={closeStyle}>×</button></div><pre style={{ margin: 0, padding: 18, background: C.bg, color: C.textMid, whiteSpace: 'pre-wrap', maxHeight: '68vh', overflow: 'auto', fontSize: 12 }}>{detail.ai_raw_output || detail.ai_progress || '暂无AI输出'}</pre></div></div>}
  </div>;
}

const topbarStyle = { minHeight: 80, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, padding: '18px 28px', background: C.panel, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 10, flexWrap: 'wrap' } as const;
const brandStyle = { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14, minWidth: 0 } as const;
const brandTitleStyle = { margin: 0, color: C.text, fontSize: 22, lineHeight: 1.3, fontWeight: 720, letterSpacing: 0 } as const;
const brandLogoStyle = { minWidth: 44, height: 40, display: 'grid', placeItems: 'center', borderRadius: 6, padding: '0 10px', background: C.panel, border: `1px solid ${C.borderLight}`, boxShadow: '0 4px 12px rgba(28,44,66,.06)' } as const;
const resetLogoButtonStyle = { position: 'absolute', top: -7, right: -7, width: 18, height: 18, display: 'grid', placeItems: 'center', padding: 0, border: `1px solid ${C.border}`, borderRadius: '50%', background: C.panel, color: C.textDim, cursor: 'pointer', fontSize: 14, lineHeight: 1 } as const;
const chipStyle = { minHeight: 32, maxWidth: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.panelSoft, display: 'inline-flex', alignItems: 'center', gap: 8, overflowWrap: 'anywhere', color: C.textDim, fontSize: 12 } as const;
const statusDotStyle = { width: 7, height: 7, borderRadius: '50%', flex: '0 0 auto' } as const;
const panelStyle = { border: `1px solid ${C.border}`, borderRadius: 8, background: C.panel, boxShadow: C.shadow } as const;
const syncFieldStyle = { minHeight: 58, border: `1px solid ${C.border}`, borderRadius: 5, background: C.panel, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, textAlign: 'left' } as const;
const syncLabelStyle = { display: 'block', color: C.textDim, fontSize: 12, marginBottom: 4 } as const;
const syncValueStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, color: C.text, fontSize: 15, fontWeight: 750, lineHeight: 1.1 } as const;
const metricStyle = { minHeight: 126, padding: '18px 16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'space-between', gap: 12, borderRadius: 8, border: `1px solid ${C.border}`, background: C.panel, boxShadow: C.shadow, minWidth: 0 } as const;
const metricIconStyle = { width: 28, height: 28, borderRadius: 6, display: 'grid', placeItems: 'center', flex: '0 0 auto' } as const;
const labelStyle = { color: C.textDim, fontSize: 12 } as const;
const hintStyle = { marginTop: 8, color: C.textMuted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;
const metricValueStyle = { fontSize: 30, lineHeight: 1.15, fontWeight: 720, fontVariantNumeric: 'tabular-nums', color: C.text, marginTop: 10, overflow: 'hidden', textOverflow: 'ellipsis' } as const;
const sectionHeadStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' } as const;
const sectionTitleStyle = { margin: 0, color: C.text, fontSize: 16, lineHeight: 1.4, fontWeight: 700, letterSpacing: 0 } as const;
const sectionDescStyle = { margin: '5px 0 0', color: C.textDim, fontSize: 12 } as const;
const legendStyle = { display: 'flex', alignItems: 'center', gap: 8, color: C.textDim, fontSize: 12, flexWrap: 'wrap' } as const;
const legendDotStyle = { width: 10, height: 10, borderRadius: 999, flex: '0 0 auto' } as const;
const thStyle = { height: 52, boxSizing: 'border-box', padding: '12px 14px', background: C.panelHead, color: C.textMid, borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', position: 'sticky', top: 0, zIndex: 1 } as const;
const tdStyle = { height: 58, boxSizing: 'border-box', padding: '13px 14px', borderBottom: `1px solid ${C.border}`, color: C.textMid, fontSize: 12, verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as const;
const typeBadgeStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 48, height: 24, padding: '0 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: C.textMid, background: C.panelSoft } as const;
const aiResultBadgeStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 62, height: 28, padding: '0 12px', boxSizing: 'border-box', border: 'none', borderRadius: 6, fontFamily: 'inherit', fontSize: 12, fontWeight: 750, whiteSpace: 'nowrap' } as const;
const detailLinkStyle = { minHeight: 30, padding: '4px 8px', border: 'none', borderRadius: 5, background: 'transparent', color: C.blueLight, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' } as const;
const detailBlockStyle = { minWidth: 0, lineHeight: 1.65 } as const;
const detailGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 } as const;
const detailLabelStyle = { color: C.textDim, fontSize: 13, fontWeight: 800 } as const;
const reportBodyStyle = { flex: '1 1 auto', overflow: 'auto', padding: '0 30px 30px', background: C.panel, fontSize: 13, scrollbarGutter: 'stable' } as const;
const reportVerdictBarStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28, margin: '0 -30px', padding: '20px 30px', background: C.panelSoft, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' } as const;
const reportSectionStyle = { padding: '22px 0', borderBottom: `1px solid ${C.border}` } as const;
const reportSectionHeadStyle = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as const;
const reportNumberStyle = { width: 26, height: 26, display: 'grid', placeItems: 'center', flex: '0 0 auto', borderRadius: 4, color: C.blueLight, background: C.blueDark, fontSize: 12, fontWeight: 800 } as const;
const reportSectionTitleStyle = { margin: 0, color: C.text, fontSize: 16, lineHeight: 1.4, fontWeight: 700 } as const;
const conclusionStyle = { padding: '14px 16px', color: C.textMid, background: C.panelSoft, borderLeft: `3px solid ${C.blue}`, fontSize: 13, lineHeight: 1.75, fontWeight: 560, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } as const;
const overviewTableStyle = { display: 'grid', gridTemplateColumns: 'minmax(120px, .22fr) minmax(0, 1fr)', borderTop: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}` } as const;
const overviewLabelStyle = { padding: '11px 13px', color: C.textDim, background: C.panelSoft, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 750 } as const;
const overviewValueStyle = { minWidth: 0, padding: '11px 14px', color: C.textMid, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, fontSize: 13, lineHeight: 1.55, fontWeight: 600, overflowWrap: 'anywhere' } as const;
const inlineCodeStyle = { padding: '2px 6px', borderRadius: 3, color: C.textMid, background: C.panelSoft, border: `1px solid ${C.border}`, fontFamily: 'Consolas, "Cascadia Mono", monospace', fontSize: '1em', fontWeight: 750, overflowWrap: 'anywhere' } as const;
const outcomeTableStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', borderTop: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}`, marginBottom: 18 } as const;
const recommendationStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', alignItems: 'start', gap: 12, padding: '16px 18px', color: C.textMid, background: C.panelSoft, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.textDim}`, fontSize: 13, lineHeight: 1.8, overflowWrap: 'anywhere' } as const;
const reportActionsStyle = { flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', padding: '12px 20px', borderTop: `1px solid ${C.border}`, background: C.panel } as const;
const trafficFieldLabelStyle = { display: 'block', marginBottom: 3, color: C.textMuted, fontSize: 11, fontWeight: 700 } as const;
const trafficIpStyle = { display: 'block', fontFamily: 'Consolas, "Cascadia Mono", monospace', fontSize: 13, lineHeight: 1.35, fontWeight: 750, overflowWrap: 'anywhere' } as const;
const packetColumnStyle = { minWidth: 0, border: `1px solid ${C.border}`, borderRadius: 5, background: C.panelSoft, overflow: 'hidden' } as const;
const packetHeadStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 9, fontSize: 13 } as const;
const packetStatusStyle = { padding: '3px 7px', borderRadius: 4, fontSize: 11, fontWeight: 750, whiteSpace: 'nowrap' } as const;
const packetLineStyle = { display: 'block', padding: '8px 10px', color: C.textMid, background: C.bg, borderRadius: 3, fontFamily: 'Consolas, "Cascadia Mono", monospace', fontSize: 12, fontWeight: 650, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } as const;
const packetBodyStyle = { margin: 0, padding: 12, color: C.textMid, background: C.bg, borderTop: `1px solid ${C.border}`, fontFamily: 'Consolas, "Cascadia Mono", monospace', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } as const;
const packetEmptyStyle = { minHeight: 52, padding: 10, color: C.orangeLight, background: C.orangeDark, borderRadius: 4, fontSize: 12, lineHeight: 1.55 } as const;
const packetByteStyle = { marginTop: 8, color: C.textMuted, fontSize: 11 } as const;
const evidenceListStyle = { display: 'grid', gap: 9, marginTop: 11 } as const;
const stepStyle = { display: 'flex', gap: 10, alignItems: 'flex-start', color: C.textMid, fontSize: 13, lineHeight: 1.65, fontWeight: 540, overflowWrap: 'anywhere', wordBreak: 'break-word' } as const;
const checkStyle = { width: 20, height: 20, flex: '0 0 auto', borderRadius: 3, background: C.panelSoft, border: `1px solid ${C.border}`, color: C.textDim, display: 'grid', placeItems: 'center', marginTop: 1, fontSize: 11, fontWeight: 800 } as const;
const paginationStyle = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'nowrap', minWidth: 'max-content', fontSize: 13 } as const;
const pagerStyle = { width: 40, height: 40, display: 'grid', placeItems: 'center', background: C.panel, color: C.text, border: `1px solid ${C.borderLight}`, borderRadius: 5, padding: 0, cursor: 'pointer', fontSize: 14 } as const;
const jumpInputStyle = { width: 58, height: 40, boxSizing: 'border-box', border: `1px solid ${C.borderLight}`, borderRadius: 5, background: C.panel, color: C.text, outline: 'none', textAlign: 'center', fontSize: 13 } as const;
const calendarNavButtonStyle = { width: 32, height: 32, display: 'grid', placeItems: 'center', padding: 0, color: C.textMid, background: C.panelSoft, border: `1px solid ${C.border}`, borderRadius: 5, cursor: 'pointer' } as const;
const modalMask = { position: 'fixed', inset: 0, background: C.overlay, display: 'grid', placeItems: 'center', zIndex: 1000, padding: 18 } as const;
const modalCard = { width: 'min(760px, 96vw)', maxHeight: '86vh', overflow: 'auto', background: C.panel, border: `1px solid ${C.borderLight}`, borderRadius: 8, boxShadow: C.shadow } as const;
const modalHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 18px', borderBottom: `1px solid ${C.border}` } as const;
const closeStyle = { width: 32, height: 32, display: 'grid', placeItems: 'center', flex: '0 0 auto', border: 'none', borderRadius: 6, background: 'transparent', color: C.textDim, cursor: 'pointer', padding: 0 } as const;
const primaryButton = { minHeight: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'var(--dt-control)', color: 'var(--dt-control-text)', border: '1px solid transparent', borderRadius: 8, padding: '0 14px', cursor: 'pointer', fontSize: 13, fontWeight: 650, boxShadow: '0 3px 10px rgba(16,20,24,.16), inset 0 1px 0 rgba(255,255,255,.12)' } as const;
const secondaryButton = { minHeight: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: C.panel, color: C.textMid, border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: '0 13px', cursor: 'pointer', fontSize: 13, fontWeight: 600, boxShadow: '0 1px 2px rgba(46,58,62,.04), inset 0 1px 0 rgba(255,255,255,.12)' } as const;
function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div style={{ minHeight: 36, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.panelSoft, color: C.textMid }}>
    <span style={{ color: C.blueLight }}><Icon name={icon} size={15} /></span>
    <span style={{ display: 'grid', gap: 1, lineHeight: 1.1 }}>
      <b style={{ color: C.text, fontSize: 12, fontWeight: 800 }}>{label}</b>
      <small style={{ color: C.textDim, fontSize: 11, whiteSpace: 'nowrap' }}>{value}</small>
    </span>
  </div>;
}
function DetailMetric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return <div style={{ minWidth: 0 }}><div style={{ color: C.textMuted, fontSize: 12 }}>{label}</div><div style={{ marginTop: 6, color: danger ? C.redLight : C.text, fontSize: 16, lineHeight: 1.3, fontWeight: 800, overflowWrap: 'anywhere' }}>{value}</div></div>;
}

function ReportSection({ number, title, children }: { number: string; title: string; children: any }) {
  return <section style={reportSectionStyle}>
    <div style={reportSectionHeadStyle}><h2 style={reportSectionTitleStyle}>{number}、{title}</h2></div>
    {children}
  </section>;
}

function ReviewReport({ row, compact }: { row: TdpRow; compact: boolean }) {
  const [tab, setTab] = useState('overview');
  const scrollRef = useRef<HTMLDivElement>(null);
  const paths = trafficPathsFor(row);
  const decision = decisionLabel(row);
  const dangerous = ['建议封禁', '隔离并封禁', '出站阻断域名', '仅阻断域名'].includes(decision);
  const isDone = row.ai_status === 'done';
  return <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', background: C.panel }}>
    <div className="dt-report-summary">
      <div style={{ minWidth: 0 }}><div style={{ color: C.textDim, fontSize: 11, marginBottom: 7 }}>研判结论</div><div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}><strong style={{ fontSize: 24, fontWeight: 720, lineHeight: 1.3 }}>{isDone ? row.ai_verdict || '已完成' : row.ai_status === 'pending' ? '正在研判' : '等待研判'}</strong><span style={{ padding: '4px 9px', borderRadius: 4, background: dangerous ? C.redDark : C.panelSoft, color: dangerous ? C.redLight : C.textMid, fontSize: 12, fontWeight: 600 }}>{decision === '-' ? '尚未形成建议' : decision}</span></div></div>
      <div className="dt-report-metrics">
        <DetailMetric label="攻击结果" value={isDone ? row.ai_attack_outcome || '尝试/未知' : '--'} danger={row.ai_attack_outcome === '成功'} />
        <DetailMetric label="主机状态" value={isDone ? row.ai_compromise_status || '无法确认' : '--'} danger={row.ai_compromise_status === '已失陷'} />
        <DetailMetric label="风险等级" value={row.ai_severity || severityLabel(row.severity)} danger={['严重','高危','高'].includes(row.ai_severity || row.severity || '')} />
        <div><DetailMetric label="置信度" value={isDone && row.ai_confidence !== undefined ? row.ai_confidence+'%' : '--'} /><div style={{ height: 3, marginTop: 8, maxWidth: 90, background: C.border, borderRadius: 2 }}><span style={{ display: 'block', width: (isDone ? Math.max(0,Math.min(100,row.ai_confidence || 0)) : 0)+'%', height: '100%', background: C.green, borderRadius: 2 }} /></div></div>
      </div>
    </div>
    <div role="tablist" aria-label="研判详情分类" className="dt-report-tabs">
      {[['overview','研判概览'],['evidence','流量证据'],['additional','补充信息']].map(([id,label]) => <button key={id} id={'review-tab-'+id} type="button" role="tab" aria-selected={tab===id} aria-controls={'review-panel-'+id} onClick={() => { setTab(id); scrollRef.current?.scrollTo(0,0); }} style={{ minHeight: 44, padding: '0 3px', marginRight: 24, background: 'transparent', border: 'none', borderBottom: '2px solid '+(tab===id ? C.text : 'transparent'), color: tab===id ? C.text : C.textDim, cursor: 'pointer', fontSize: 13, fontWeight: tab===id ? 700 : 500 }}>{label}</button>)}
    </div>
    <div key={tab} ref={scrollRef} role="tabpanel" id={'review-panel-'+tab} aria-labelledby={'review-tab-'+tab} tabIndex={0} className="dt-report-content">
      {tab==='overview' && <>
        <div className="dt-report-columns">
          <section style={{ minWidth: 0 }}><h2 className="dt-report-heading">分析摘要</h2><p style={{ margin: '12px 0 0', fontSize: 14, color: C.textMid, lineHeight: 1.9, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{row.ai_summary || row.ai_progress || row.ai_error || '当前暂无研判结论。'}</p><EvidenceSection title="核心研判依据" items={row.ai_evidence} tone="support" /></section>
          <section style={{ minWidth: 0, paddingLeft: compact ? 0 : 24, borderLeft: compact ? 'none' : '1px solid '+C.border }}><h2 className="dt-report-heading">处置建议</h2><p style={{ margin: '12px 0 0', fontSize: 14, color: C.textMid, lineHeight: 1.9, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{row.ai_recommended_action || '请根据研判证据进行人工复核后处置。'}</p><EvidenceSection title="核查与处置清单" items={row.ai_human_checkpoints} tone="check" /></section>
        </div>
        <section className="dt-report-section"><h2 className="dt-report-heading">告警信息</h2><OverviewTable row={row} paths={paths} /></section>
        <section className="dt-report-section"><h2 className="dt-report-heading">证据评估</h2><div className="dt-report-columns"><EvidenceSection title="支持证据" items={row.ai_supporting_evidence} tone="support" /><EvidenceSection title="反证与疑点" items={row.ai_contradicting_evidence} tone="oppose" /></div></section>
      </>}
      {tab==='evidence' && <>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 20 }}>
          {[['请求报文',(row.ai_http_evidence || []).some(item=>Boolean(item.request_line || item.request_body))],['响应报文',(row.ai_http_evidence || []).some(item=>Boolean(item.response_line || item.response_body))]].map(([label,available])=><span key={String(label)} style={{ display: 'inline-flex', gap: 7, alignItems: 'center', border: '1px solid '+C.border, borderRadius: 5, padding: '7px 10px', color: C.textMid, fontSize: 12 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: available ? C.green : C.orange }} />{label} · {available ? '已获取' : '未获取'}</span>)}
        </div>
        <TrafficPaths paths={paths} compact={compact} /><HttpEvidencePanel items={row.ai_http_evidence} />
      </>}
      {tab==='additional' && <><section><h2 className="dt-report-heading">核验范围</h2><EvidenceSection title="缺失信息与取证限制" items={row.ai_missing_information} tone="missing" /></section><section className="dt-report-section"><div className="dt-report-columns"><EvidenceSection title="受影响目标" items={row.ai_affected_targets} tone="target" /><EvidenceSection title="关键 IOC" items={row.ai_key_iocs} tone="ioc" /></div></section></>}
    </div>
  </div>;
}

function OverviewTable({ row, paths }: { row: TdpRow; paths: TrafficPath[] }) {
  const request = (row.ai_http_evidence || []).find(item => item.request_line)?.request_line || '--';
  const targets = [...new Set(paths.map(path => [path.destination_ip, path.destination_port].filter(Boolean).join(':')).filter(Boolean))];
  const groupedIps = row.grouped_ips || [];
  const groupedSourceText = groupedIps.length
    ? `${groupedIps.slice(0, 8).join('、')}${groupedIps.length > 8 ? ` 等 ${groupedIps.length} 个` : ''}`
    : row.ip || '--';
  const entries = [
    ['请求', request],
    ['威胁名称', row.threat_name || '--'],
    ['攻击者 IP / IOC', row.ioc || row.ip || '--'],
    ['关联来源 IP', groupedSourceText],
    ['IP 归属地', row.ai_source_location?.known
      ? `${row.ai_source_location.display || row.ai_source_location.country || '--'}（${row.ai_source_location.is_foreign ? '境外' : '境内'}${row.ai_source_location.source ? `，${row.ai_source_location.source}` : ''}）`
      : '未知'],
    ['目标', targets.join('、') || (row.grouped_targets || []).join('、') || '--'],
    ['告警类型', threatTypeLabel(row.threat_type)],
    ['最近发现时间', fmtTime(row.last_time || row.first_time)],
    ['检出次数', `${row.count || 0} 次`],
    ['处置对象', actionScopeLabel(row)],
  ];
  return <dl className="dt-overview-fields">{entries.map(([label,value]) => <div key={label} style={{ minWidth: 0, display: 'grid', gridTemplateColumns: '98px minmax(0,1fr)', gap: 10, padding: '11px 0', borderBottom: '1px solid '+C.border }}><dt style={{ margin: 0, color: C.textDim, fontSize: 12 }}>{label}</dt><dd style={{ margin: 0, color: C.textMid, fontSize: 13, lineHeight: 1.6, overflowWrap: 'anywhere' }}>{label.includes('IP') || label === '请求' || label === '目标' ? <code style={{ fontFamily: 'Consolas, monospace', fontSize: 12 }}>{value}</code> : value}</dd></div>)}</dl>;
}

function ReportFact({ label, value, tone }: { label: string; value: string; tone: 'support' | 'missing' | 'danger' | 'neutral' }) {
  const palette = tone === 'support' ? { color: C.greenLight, background: C.greenDark }
    : tone === 'missing' ? { color: C.orangeLight, background: C.orangeDark }
      : tone === 'danger' ? { color: C.redLight, background: C.redDark }
        : { color: C.blueLight, background: C.blueDark };
  return <div style={{ minWidth: 0, padding: '13px 14px', borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}><div style={{ color: C.textMuted, fontSize: 11, fontWeight: 700 }}>{label}</div><div style={{ marginTop: 6, color: palette.color, fontSize: 14, lineHeight: 1.4, fontWeight: 800 }}><span style={{ display: 'inline-block', width: 7, height: 7, marginRight: 7, borderRadius: '50%', background: palette.color }} />{value}</div></div>;
}

function TrafficPaths({ paths, compact }: { paths: TrafficPath[]; compact: boolean }) {
  const directionPalette: Record<TrafficDirection, { color: string; background: string }> = {
    '外到内': { color: C.redLight, background: C.redDark },
    '内到内': { color: C.textMid, background: C.panelSoft },
    '内到外': { color: C.blueLight, background: C.blueDark },
    '待确认': { color: C.textDim, background: C.panelSoft },
  };
  return <div style={detailBlockStyle}>
    <div style={{ ...detailLabelStyle, color: C.textMid }}>关键流量路径</div>
    <div style={{ marginTop: 9 }}>
      {paths.map((path, index) => {
        const palette = directionPalette[path.direction] || directionPalette['待确认'];
        const transport = [path.protocol, path.destination_port ? `目的端口 ${path.destination_port}` : ''].filter(Boolean).join(' / ');
        return <div key={`${path.source_ip}-${path.destination_ip}-${path.destination_port || ''}-${index}`} style={{ display: 'grid', gridTemplateColumns: compact ? 'minmax(0, 1fr) auto minmax(0, 1fr)' : 'minmax(180px, 1fr) auto minmax(180px, 1fr) minmax(0, .8fr)', alignItems: 'center', gap: compact ? 8 : 14, minHeight: 54, padding: '7px 2px', borderTop: index ? `1px solid ${C.border}` : 'none' }}>
          <div style={{ minWidth: 0 }}><span style={trafficFieldLabelStyle}>源 IP</span><strong style={{ ...trafficIpStyle, color: C.textMid }}>{path.source_ip}</strong></div>
          <span style={{ minWidth: 64, padding: '5px 10px', borderRadius: 5, textAlign: 'center', color: palette.color, background: palette.background, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>{path.direction}</span>
          <div style={{ minWidth: 0 }}><span style={trafficFieldLabelStyle}>目的 IP</span><strong style={{ ...trafficIpStyle, color: path.destination_ip === '待确认' ? C.textDim : C.textMid }}>{path.destination_ip}</strong></div>
          <div style={{ minWidth: 0, gridColumn: compact ? '1 / -1' : 'auto', color: C.textDim, fontSize: 12, fontWeight: transport ? 650 : 500, overflowWrap: 'anywhere' }}>{transport || '协议 / 端口待确认'}</div>
        </div>;
      })}
    </div>
  </div>;
}

function HttpEvidencePanel({ items }: { items?: HttpEvidence[] }) {
  const values = Array.isArray(items) ? items : [];
  return <div style={{ ...detailBlockStyle, marginTop: 20 }}>
    <div style={{ ...detailLabelStyle, color: C.textMid }}>HTTP 请求 / 响应证据</div>
    {values.length ? <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
      {values.map((item, index) => {
        const requestAvailable = Boolean(item.request_line || item.request_body);
        const responseAvailable = Boolean(item.response_line || item.response_body);
        const endpoint = [item.source_ip, item.destination_ip ? `-> ${item.destination_ip}${item.destination_port ? `:${item.destination_port}` : ''}` : ''].filter(Boolean).join(' ');
        return <div key={`${item.flow_id || index}-${index}`} style={{ minWidth: 0, paddingTop: index ? 14 : 0, borderTop: index ? `1px solid ${C.border}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', color: C.textDim, fontSize: 12 }}>
            <span>{endpoint || '流量端点待确认'}{item.flow_id ? ` · Flow ${item.flow_id}` : ''}</span>
            <span>{item.occurrences && item.occurrences > 1 ? `同报文命中 ${item.occurrences} 条告警` : '单条告警'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 12, marginTop: 9 }}>
            <div style={packetColumnStyle}>
              <div style={{ padding: 12 }}><div style={packetHeadStyle}><strong style={{ color: C.text }}>请求包</strong><span style={{ ...packetStatusStyle, color: requestAvailable ? C.greenLight : C.orangeLight, background: requestAvailable ? C.greenDark : C.orangeDark }}>{item.request_status || 'TDP原始告警未采集'}</span></div>
              {requestAvailable ? <code style={packetLineStyle}>{item.request_line || '请求行未采集'}</code> : <div style={packetEmptyStyle}>TDP 原始告警中没有请求行和请求体。</div>}
              <div style={packetByteStyle}>客户端到服务端 {item.bytes_to_server || 0} bytes</div></div>
              {requestAvailable && <details><summary style={{ padding: '10px 12px', color: C.blueLight, borderTop: `1px solid ${C.border}`, cursor: 'pointer', fontSize: 12, fontWeight: 750 }}>完整请求体</summary><pre style={packetBodyStyle}>{item.request_body || '请求体为空'}</pre></details>}
            </div>
            <div style={packetColumnStyle}>
              <div style={{ padding: 12 }}><div style={packetHeadStyle}><strong style={{ color: C.text }}>响应包</strong><span style={{ ...packetStatusStyle, color: responseAvailable ? C.greenLight : C.orangeLight, background: responseAvailable ? C.greenDark : C.orangeDark }}>{item.response_status || 'TDP原始告警未采集'}</span></div>
              {responseAvailable ? <><code style={packetLineStyle}>{item.response_line || '响应行未采集'}</code><pre style={{ ...packetBodyStyle, marginTop: 8, border: 'none', borderRadius: 4 }}>{item.response_body || '响应体为空'}</pre></> : <div style={packetEmptyStyle}>TDP 原始告警的响应行和响应体为空，不能据此判断攻击是否成功。</div>}
              <div style={packetByteStyle}>服务端到客户端 {item.bytes_to_client || 0} bytes{!responseAvailable && item.bytes_to_client ? '，仅有流量计数，无可解析响应内容' : ''}</div></div>
            </div>
          </div>
        </div>;
      })}
    </div> : <div style={{ marginTop: 10, color: C.textMuted, fontSize: 13 }}>当前研判结果没有可展示的 HTTP 报文证据。</div>}
  </div>;
}

function EvidenceSection({ title, items, tone }: { title: string; items?: unknown[]; tone: 'support' | 'oppose' | 'missing' | 'check' | 'target' | 'ioc' }) {
  const palette = {
    support: { color: C.greenLight, background: C.greenDark },
    oppose: { color: C.redLight, background: C.redDark },
    missing: { color: C.orangeLight, background: C.orangeDark },
    check: { color: C.blueLight, background: C.blueDark },
    target: { color: C.cyanLight, background: C.cyanDark },
    ioc: { color: C.textMid, background: C.panelSoft },
  }[tone];
  const values = Array.isArray(items) ? items : [];
  return <div style={{ ...detailBlockStyle, minWidth: 0, marginTop: 16 }}>
    <div style={{ ...detailLabelStyle, color: C.textMid, fontWeight: 650 }}>{title}</div>
    <div style={evidenceListStyle}>
      {values.length ? values.map((item, index) => <div key={index} style={stepStyle}>
        <span style={{ ...checkStyle, color: C.textMuted, background: C.panelSoft }}>{index + 1}</span>
        <span style={{ minWidth: 0 }}>{evidenceText(item)}</span>
      </div>) : <div style={{ color: C.textMuted, fontSize: 13 }}>无</div>}
    </div>
  </div>;
}
