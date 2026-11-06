import { describe, expect, it } from 'vitest';

import {
  addWorkflowLinks,
  pickLinkedWorkflow,
  workflowLinksFromMessages,
  workflowLinksFromToolPart,
  type WorkflowLinkKind,
} from './workflowSessionLinks';

const toolPart = (tool: string, input: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  id: `part-${tool}`,
  sessionID: 'session-1',
  type: 'tool',
  tool,
  state: { status: 'completed', input, ...extra },
});

const ids = (part: unknown) => workflowLinksFromToolPart(part).map(({ id, kind }) => `${kind}:${id}`);

describe('workflowLinksFromToolPart', () => {
  it('links the directories file tools write to, in any root', () => {
    expect(ids(toolPart('write', { filePath: '/home/alice/.aegisops/plugins/workflows/ip_intel/workflow.md' })))
      .toEqual(['write:ip_intel']);
    expect(ids(toolPart('edit', { filePath: '~/.aegisops/plugins/workflows/ip-intel-v2/workflow.json' })))
      .toEqual(['write:ip-intel-v2']);
    expect(ids(toolPart('write', { filePath: 'C:\\Users\\alice\\.aegisops\\plugins\\workflows\\win_flow\\workflow.md' })))
      .toEqual(['write:win_flow']);
    expect(ids(toolPart('mkdir', { path: '/repo/.aegisops/plugins/workflows/project_flow' })))
      .toEqual(['write:project_flow']);
    expect(ids(toolPart('copy', {
      sourcePath: '/home/bob/.aegisops/plugins/workflows/bob_flow/workflow.json',
      targetPath: '/home/alice/.aegisops/plugins/workflows/copied_flow/workflow.json',
    }))).toEqual(['write:copied_flow']);
  });

  it('keeps spaces in path arguments', () => {
    expect(ids(toolPart('write', { filePath: '/home/alice/.aegisops/plugins/workflows/IP 情报/workflow.md' })))
      .toEqual(['write:IP 情报']);
  });

  it('reads apply_patch add and update headers, including moves', () => {
    expect(ids(toolPart('apply_patch', {
      patchText: [
        '*** Begin Patch',
        '*** Add File: /home/alice/.aegisops/plugins/workflows/patched/workflow.json',
        '+{"note": "see plugins/workflows/quoted_in_body/"}',
        '*** Update File: /tmp/a.md -> /home/alice/.aegisops/plugins/workflows/moved_flow/workflow.md',
        '*** Delete File: /home/alice/.aegisops/plugins/workflows/deleted_flow/workflow.md',
        '*** End Patch',
      ].join('\n'),
    }))).toEqual(['write:patched', 'write:moved_flow']);
  });

  it('matches argument names the way the tool registry remaps guessed ones', () => {
    expect(ids(toolPart('write', { file_path: '/h/.aegisops/plugins/workflows/snake_flow/workflow.md' })))
      .toEqual(['write:snake_flow']);
    expect(ids(toolPart('edit', { FilePath: '/h/.aegisops/plugins/workflows/pascal_flow/workflow.md' })))
      .toEqual(['write:pascal_flow']);
    expect(ids(toolPart('copy', {
      source_path: '/h/.aegisops/plugins/workflows/bob_flow/workflow.json',
      target_path: '/h/.aegisops/plugins/workflows/copy_flow/workflow.json',
    }))).toEqual(['write:copy_flow']);
    expect(ids(toolPart('apply_patch', {
      patch_text: '*** Add File: /h/.aegisops/plugins/workflows/patch_flow/workflow.json\n+{}',
    }))).toEqual(['write:patch_flow']);
    expect(ids(toolPart('bash', { Command: 'mkdir -p /h/.aegisops/plugins/workflows/cmd_flow' })))
      .toEqual(['shell:cmd_flow']);
  });

  it('links shell commands only when they write, parsing quoting and full-width punctuation', () => {
    expect(ids(toolPart('bash', {
      command: 'mkdir -p ~/.aegisops/plugins/workflows/dns_flow && cat > ~/.aegisops/plugins/workflows/dns_flow/workflow.md',
    }))).toEqual(['shell:dns_flow']);
    expect(ids(toolPart('bash', { command: 'mkdir -p "/home/a/.aegisops/plugins/workflows/IP 情报"' })))
      .toEqual(['shell:IP 情报']);
    expect(ids(toolPart('bash', { command: 'mkdir -p ~/.aegisops/plugins/workflows/alert_triage，然后写说明' })))
      .toEqual(['shell:alert_triage']);
    expect(ids(toolPart('bash', {
      command: "cat > workflow.md <<'EOF'\n# flow\nEOF",
      workdir: '/home/a/.aegisops/plugins/workflows/wd_flow',
    }))).toEqual(['shell:wd_flow']);
    expect(ids(toolPart('bash', { command: 'sh -c "mkdir -p /h/.aegisops/plugins/workflows/sh_flow && echo ok"' })))
      .toEqual(['shell:sh_flow']);
    expect(ids(toolPart('bash', { command: "echo don't; mkdir -p /h/.aegisops/plugins/workflows/unbal_flow; echo 'x'" })))
      .toEqual(['shell:unbal_flow']);
    expect(ids(toolPart('bash', { command: 'echo x | tee /h/.aegisops/plugins/workflows/tee_flow/workflow.md' })))
      .toEqual(['shell:tee_flow']);
    expect(ids(toolPart('bash', { command: 'echo x >> /h/.aegisops/plugins/workflows/append_flow/workflow.md' })))
      .toEqual(['shell:append_flow']);
    expect(ids(toolPart('bash', { command: 'printf x>>/h/.aegisops/plugins/workflows/printf_flow/workflow.md' })))
      .toEqual(['shell:printf_flow']);
    expect(ids(toolPart('bash', {
      command: "python3 - <<'EOF'\nimport os\nfrom pathlib import Path\nPath(os.path.expanduser('~/.aegisops/plugins/workflows/py_flow')).mkdir(parents=True)\nEOF",
    }))).toEqual(['shell:py_flow']);
    expect(ids(toolPart('bash', {
      command: "python3 -c \"open('/h/.aegisops/plugins/workflows/open_flow/workflow.json', 'w').write('{}')\"",
    }))).toEqual(['shell:open_flow']);
  });

  it('does not link shell commands that only look', () => {
    const bob = '/home/bob/.aegisops/plugins/workflows/bob_flow';
    for (const command of [
      `cat ${bob}/workflow.json`,
      `ls -la ${bob}`,
      `test -d ${bob} && echo exists`,
      `head -50 "${bob}/workflow.md"`,
      `ls ${bob} 2>/dev/null`,
      `cat ${bob}/workflow.json 2>&1`,
      `cat ${bob}/workflow.json > /dev/null`,
      `cat ${bob}/workflow.json >> /dev/null`,
      `cat ${bob}/workflow.json >>/dev/null`,
      `cat ${bob}/workflow.json &>/dev/null`,
      `echo checked >&2; ls ${bob}`,
      "python3 -c \"import os; print(os.path.expanduser('~/.aegisops/plugins/workflows/bob_flow'))\"",
      'ls ~/.aegisops/plugins/workflows/',
    ]) {
      expect(ids(toolPart('bash', { command, workdir: bob }))).toEqual([]);
    }
  });

  it('ignores reads, searches, deletes, file bodies and outputs', () => {
    expect(ids(toolPart('read', { filePath: '/home/bob/.aegisops/plugins/workflows/bob_flow/workflow.json' }))).toEqual([]);
    expect(ids(toolPart('glob', { pattern: '*/workflow.md', path: '/home/a/.aegisops/plugins/workflows/x' }))).toEqual([]);
    expect(ids(toolPart('grep', { pattern: 'x', path: '/home/a/.aegisops/plugins/workflows/y' }))).toEqual([]);
    expect(ids(toolPart('delete', { path: '/home/a/.aegisops/plugins/workflows/z' }))).toEqual([]);
    expect(ids(toolPart('write', {
      filePath: '/home/alice/notes.md',
      content: 'see ~/.aegisops/plugins/workflows/someone_else/workflow.md',
    }))).toEqual([]);
    expect(ids(toolPart(
      'bash',
      { command: 'ls ~/.aegisops/plugins/workflows' },
      { output: '/home/bob/.aegisops/plugins/workflows/bob_flow/workflow.json' },
    ))).toEqual([]);
    expect(ids({ id: 'text-1', type: 'text', text: '~/.aegisops/plugins/workflows/mentioned/workflow.md' })).toEqual([]);
    expect(ids(null)).toEqual([]);
    expect(ids({ type: 'tool', tool: 'write', state: { input: '/h/.aegisops/plugins/workflows/raw/workflow.md' } }))
      .toEqual([]);
    expect(ids({ type: 'tool', tool: 'write', state: { input: ['/h/.aegisops/plugins/workflows/arr/x'] } })).toEqual([]);
    expect(ids({ type: 'tool', tool: 'write', state: null })).toEqual([]);
  });
});

describe('workflowLinksFromMessages', () => {
  it('collects links across stored messages', () => {
    expect(workflowLinksFromMessages([
      { info: { id: 'm1' }, parts: [toolPart('write', { filePath: '/h/.aegisops/plugins/workflows/a/workflow.md' })] },
      { info: { id: 'm2' }, parts: [toolPart('mkdir', { path: '/h/.aegisops/plugins/workflows/b' })] },
      { info: { id: 'm3' } },
    ]).map(({ id }) => id)).toEqual(['a', 'b']);
    expect(workflowLinksFromMessages({})).toEqual([]);
  });
});

describe('pickLinkedWorkflow', () => {
  const links = (entries: Array<[string, WorkflowLinkKind]>) => {
    const map = new Map<string, WorkflowLinkKind>();
    addWorkflowLinks(map, entries.map(([id, kind]) => ({ id, kind })));
    return map;
  };
  const candidates = [{ id: 'mine' }, { id: 'theirs' }, { id: 'other' }];

  it('prefers the one workflow a file tool wrote', () => {
    expect(pickLinkedWorkflow(candidates, links([['theirs', 'shell'], ['mine', 'write']]))).toEqual({ id: 'mine' });
  });

  it('upgrades a shell link when a file tool later writes the same workflow', () => {
    expect(links([['mine', 'write'], ['mine', 'shell']]).get('mine')).toBe('write');
    expect(links([['mine', 'shell'], ['mine', 'write']]).get('mine')).toBe('write');
  });

  it('falls back to a single shell link and refuses to guess between several', () => {
    expect(pickLinkedWorkflow(candidates, links([['other', 'shell']]))).toEqual({ id: 'other' });
    expect(pickLinkedWorkflow(candidates, links([['mine', 'shell'], ['theirs', 'shell']]))).toBeNull();
    expect(pickLinkedWorkflow(candidates, links([['mine', 'write'], ['theirs', 'write']]))).toBeNull();
    expect(pickLinkedWorkflow(candidates, links([]))).toBeNull();
  });
});
