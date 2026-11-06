import { describe, expect, it } from 'vitest';
import { taskTrend, DAY } from './trends';
import type { TaskExecution } from '@/api/task';
const now=Date.parse('2026-11-05T12:00:00Z');
const task=(id:string,when:number,status='completed')=>({id,startedAt:new Date(when).toISOString(),status}) as TaskExecution;
describe('task trend windows',()=>{
  it('separates previous and current intervals, counts boundary once, and excludes future and unstarted tasks',()=>{
    const data=taskTrend([task('previous',now-DAY-1),task('boundary',now-DAY),task('current',now),task('future',now+1),{id:'queued',status:'queued'} as TaskExecution],1,now);
    expect(data.current).toHaveLength(2);expect(data.previous).toBe(1);
    expect(data.points.reduce((sum,p)=>sum+p.count,0)).toBe(2);
    expect(data.points[0].count).toBe(1);expect(data.points[23].count).toBe(1);
    expect(data.change).toBe(100);
  });
  it('calculates success rate from ended tasks only',()=>{
    const data=taskTrend([task('a',now),task('b',now,'failed'),task('c',now,'running'),task('d',now,'cancelled')],7,now);
    expect(data.rate).toBe(50);expect(data.completed).toBe(1);expect(data.failed).toBe(1);
  });
  it('keeps empty rate unknown instead of implying success',()=>{
    const data=taskTrend([],30,now);expect(data.rate).toBeNull();expect(data.change).toBeNull();expect(data.peak).toBe(0);expect(data.points).toHaveLength(30);
  });
});
