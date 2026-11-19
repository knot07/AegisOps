import ThemedSelect from './ThemedSelect';
import ContextBudgetSlider from './ContextBudgetSlider';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Brain, Check, ExternalLink, Loader2, RotateCcw, Search, Settings2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { modelSettingsAPI, modelV2API } from '@/api/provider';
import { useOptionalAuth } from '@/contexts/authState';
import { refreshChatModelResources } from '@/hooks/useChatModelResources';
import { ModelBrandIcon, brandStyle } from './VisualIdentity';
import { extractErrorMessage } from '@/utils/error';
import type { ModelDefinitionV2, ModelSettingV2 } from '@/types';
import './model-preferences.css';

type Row = { model: ModelDefinitionV2; saved: ModelSettingV2; enabled: boolean; parameters: Record<string, any> };
const fields = ['enable_thinking', 'reasoning_effort', 'context_window_limit'] as const;
function dirty(row: Row) {
  return row.enabled !== row.saved.enabled || fields.some(key => row.parameters[key] !== row.saved.default_parameters[key]);
}

export default function ModelPreferencesDialog({ onClose }: { onClose: () => void }) {
  const { i18n } = useTranslation();
  const zh = i18n.language.startsWith('zh');
  const l = (cn: string, en: string) => zh ? cn : en;
  const auth = useOptionalAuth();
  const isAdmin = auth?.user?.role === 'admin';
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'custom'>('all');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  busyRef.current = saving;
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    return () => { dialog?.close?.(); previous?.focus(); };
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await modelV2API.listDefinitions();
        const models = result.data.models.filter(m => m.model_type === 'llm');
        const loaded = await Promise.all(models.map(async model => {
          const response = await modelSettingsAPI.get(model.provider_id, model.id);
          const saved = { ...response.data, default_parameters: response.data.default_parameters || {} };
          return { model, saved, enabled: saved.enabled !== false, parameters: { ...saved.default_parameters } };
        }));
        if (active) { setRows(loaded); setError(''); }
      } catch (err) { if (active) setError(extractErrorMessage(err)); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  const shown = useMemo(() => rows.filter(row => (tab !== 'custom' || row.model.fetch_from === 'customizable')
    && `${row.model.name} ${row.model.id} ${row.model.provider_id}`.toLowerCase().includes(query.toLowerCase().trim())), [rows, tab, query]);
  const change = (target: Row, update: Partial<Row>) => setRows(current => current.map(row => row === target ? { ...row, ...update } : row));
  const param = (row: Row, key: string, value: any) => {
    const parameters = { ...row.parameters };
    if (value === undefined) delete parameters[key]; else parameters[key] = value;
    change(row, { parameters });
  };
  const changed = rows.filter(dirty);
  const save = async () => {
    if (!isAdmin || saving || !changed.length) return;
    if (!rows.some(row => row.enabled)) { setError(l('请至少保留一个启用模型。', 'Keep at least one model enabled.')); return; }
    setSaving(true); setError('');
    const failures: string[] = [];
    for (const row of changed) {
      try {
        // Preserve unrelated parameters edited elsewhere while this dialog was open.
        const latest = await modelSettingsAPI.get(row.model.provider_id, row.model.id);
        const parameters = { ...latest.data.default_parameters };
        for (const key of fields) {
          if (row.parameters[key] === row.saved.default_parameters[key]) continue;
          if (row.parameters[key] === undefined) delete parameters[key]; else parameters[key] = row.parameters[key];
        }
        const saved = await modelSettingsAPI.update(row.model.provider_id, row.model.id, {
          ...(row.enabled !== row.saved.enabled ? { enabled: row.enabled } : {}), default_parameters: parameters,
        });
        setRows(current => current.map(value => value.model === row.model
          ? { ...value, saved: saved.data, enabled: saved.data.enabled, parameters: { ...saved.data.default_parameters } } : value));
      } catch (err) { failures.push(`${row.model.name}: ${extractErrorMessage(err)}`); }
    }
    try { await refreshChatModelResources(); } catch (err) { failures.push(extractErrorMessage(err)); }
    setSaving(false);
    if (failures.length) setError(failures.join('\n')); else onClose();
  };
  return createPortal(
    <dialog ref={dialogRef} className="aegis-model-preferences" aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); if (!busyRef.current) onClose(); }}>
      <header className="model-preferences-header">
        <span className="model-preferences-mark"><Settings2 size={20} /></span>
        <div><h2 id={titleId}>{l('模型管理', 'Model preferences')}</h2><p>{l('选择常用模型，调整思考与上下文', 'Choose models and configure reasoning and context')}</p></div>
        <a href="/models" target="_blank" rel="noreferrer">{l('厂商配置', 'Providers')}<ExternalLink size={13} /></a>
        <button type="button" onClick={onClose} disabled={saving} aria-label={l('关闭模型管理', 'Close model preferences')}><X size={18} /></button>
      </header>
      <div className="model-preferences-toolbar">
        <div role="tablist" aria-label={l('模型分类', 'Model categories')}>
          <button role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>{l('全部模型', 'All models')}<small>{rows.length}</small></button>
          <button role="tab" aria-selected={tab === 'custom'} onClick={() => setTab('custom')}>{l('自定义', 'Custom')}</button>
        </div>
        <label className="model-preferences-search"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={l('搜索模型或厂商', 'Search models or providers')} aria-label={l('搜索模型或厂商', 'Search models or providers')} /></label>
      </div>
      {error && <p className="model-preferences-error" role="alert">{error}</p>}
      <div className="model-preferences-body" aria-busy={loading}>
        {loading ? <div className="model-preferences-empty" role="status"><Loader2 size={18} className="animate-spin" />{l('正在加载模型配置…', 'Loading model settings…')}</div>
          : <>
            <div className="model-preferences-columns" aria-hidden="true"><span>{l('模型名称', 'Model')}</span><span>{l('思考模式', 'Reasoning')}</span><span>{l('思考强度', 'Effort')}</span><span>{l('启用显示', 'Enabled')}</span><span>{l('上下文使用上限', 'Context budget')}</span></div>
            {shown.map(row => {
              const { model, parameters } = row;
              const capacity = model.limits?.context_window || 0;
              const limit = parameters.context_window_limit ?? capacity;
              const reasoning = model.capabilities?.supports_reasoning || model.capabilities?.features?.includes('reasoning');
              const effortMap = model.capabilities?.thinking_level_map || {};
              const efforts = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'].filter(key => typeof effortMap[key] === 'string');
              const effortNames: Record<string, string> = { minimal: l('最低', 'Minimal'), low: l('低', 'Low'), medium: l('中', 'Medium'), high: l('高', 'High'), xhigh: l('极高', 'Very high'), max: l('最大', 'Maximum') };
              const controlsDisabled = !isAdmin || saving;
              return <div className={`model-preferences-row ${row.enabled ? '' : 'is-disabled'}`} key={`${model.provider_id}/${model.id}`} data-preference-model={model.id} style={brandStyle(model.id)}>
                <div className="model-preferences-name"><ModelBrandIcon value={`${model.provider_id} ${model.id}`} /><div><strong title={model.id}>{model.name || model.id}</strong><small>{model.provider_id}{model.fetch_from === 'customizable' ? ` · ${l('自定义', 'Custom')}` : ''}</small></div>
                  <button className="model-preferences-reset" type="button" disabled={controlsDisabled} aria-label={`${model.name} ${l('恢复默认参数', 'Reset parameters')}`} title={l('恢复模型默认参数', 'Reset model parameters')} onClick={() => {
                    const next = { ...row.parameters }; fields.forEach(key => delete next[key]); change(row, { parameters: next });
                  }}><RotateCcw size={13} /></button></div>
                <div className="model-preferences-control" data-label={l('思考模式', 'Reasoning')}>
                  {reasoning ? <div className="model-preferences-thinking"><button type="button" role="switch" aria-checked={parameters.enable_thinking !== false} aria-label={`${model.name} ${l('思考模式', 'Reasoning')}`} className="model-preferences-switch" disabled={controlsDisabled} onClick={() => param(row, 'enable_thinking', parameters.enable_thinking === false)}><span /></button>
                    {parameters.enable_thinking === undefined && <small>{l('默认', 'Default')}</small>}</div> : <small>{l('不支持', 'Unavailable')}</small>}
                </div>
                <div className="model-preferences-control" data-label={l('思考强度', 'Effort')}>
                  <ThemedSelect label={`${model.name} ${l('思考强度', 'Effort')}`} value={parameters.reasoning_effort || ''}
                    themeStyle={brandStyle(model.id)} disabled={controlsDisabled || !reasoning || parameters.enable_thinking === false || !efforts.length}
                    onChange={value => param(row, 'reasoning_effort', value || undefined)}
                    options={[{ value: '', label: efforts.length ? l('模型默认', 'Default') : l('自动适配', 'Automatic') },
                      ...efforts.map(effort => ({ value: effort, label: effortNames[effort] }))]} />
                </div>
                <div className="model-preferences-control" data-label={l('启用显示', 'Enabled')}><button type="button" role="switch" aria-checked={row.enabled} aria-label={`${model.name} ${l('启用显示', 'Enabled')}`} className="model-preferences-switch" disabled={controlsDisabled} onClick={() => change(row, { enabled: !row.enabled })}><span /></button></div>
                <div className="model-preferences-budget" data-label={l('上下文使用上限', 'Context budget')}>
                  {capacity >= 4096 ? <ContextBudgetSlider value={limit} capacity={capacity}
                    scaleMax={Math.max(1000000, ...rows.map(item => item.model.limits?.context_window || 0))}
                    label={`${model.name} ${l('上下文使用上限', 'Context budget')}`}
                    disabled={controlsDisabled} onChange={value => param(row, 'context_window_limit', value)} /> : <small>{l('容量未声明', 'Capacity unknown')}</small>}
                </div>
              </div>;
            })}
            {!shown.length && <div className="model-preferences-empty">{l('没有匹配的模型', 'No matching models')}</div>}
          </>}
      </div>
      <footer className="model-preferences-footer"><p><Brain size={15} />{l(isAdmin ? '设置应用到所有会话，下一轮请求生效。上下文上限影响压缩策略。' : '当前为只读，模型参数由管理员统一设置。', isAdmin ? 'Applies to all sessions from the next request. Context budgets control compaction.' : 'Read only. Model settings are managed by an administrator.')}</p>
        <button type="button" disabled={saving} onClick={onClose}>{l('取消', 'Cancel')}</button>
        <button type="button" className="is-primary" disabled={loading || saving || !isAdmin || !changed.length} onClick={() => void save()}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}{l('保存设置', 'Save settings')}{changed.length > 0 && ` (${changed.length})`}</button>
      </footer>
    </dialog>, document.body,
  );
}
