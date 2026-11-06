import type { TaskExecution } from '@/api/task';
export const DAY = 86_400_000;
export function taskTrend(tasks: TaskExecution[], days: number, now: number) {
  const duration = days * DAY;
  const start = now - duration;
  const count = days === 1 ? 24 : days;
  const step = duration / count;
  const points = Array.from({ length: count }, (_, i) => ({
    time: start + i * step, count: 0,
    label: new Date(start + i * step).toLocaleString('zh-CN', days === 1 ? { hour: '2-digit', minute: '2-digit' } : { month: 'numeric', day: 'numeric' }),
  }));
  const current: TaskExecution[] = [];
  let previous = 0;
  for (const task of tasks) {
    const time = Date.parse(task.startedAt || '');
    if (time >= start && time <= now) {
      points[Math.min(count - 1, Math.floor((time - start) / step))].count++;
      current.push(task);
    } else if (time >= start - duration && time < start) previous++;
  }
  const completed = current.filter(t => t.status === 'completed').length;
  const failed = current.filter(t => t.status === 'failed').length;
  return { points, current, previous, completed, failed,
    peak: Math.max(...points.map(p => p.count)),
    average: current.length / count,
    rate: completed + failed ? completed / (completed + failed) * 100 : null,
    change: previous ? (current.length - previous) / previous * 100 : null,
  };
}
