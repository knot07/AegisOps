import { useEffect, useState } from 'react';
import ClockTicks from '@/components/common/ClockTicks';

const nodes = [[81,245],[180,91],[234,300],[326,171],[467,64],[514,251],[650,122],[700,325],[455,350]];
const edges = [[0,1],[0,2],[0,3],[1,3],[2,3],[2,8],[3,4],[3,5],[3,8],[4,5],[4,6],[5,6],[5,7],[5,8],[6,7],[7,8]];
const two = (n: number) => String(n).padStart(2, '0');
const weekdays = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

export function LoginClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => { if (!document.hidden) setNow(new Date()); };
    const timer = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, []);
  return <div className="login-clock" aria-hidden="true">
    <ClockTicks lit={now.getSeconds() + 1} />
    <div><strong>{two(now.getHours())}:{two(now.getMinutes())}:{two(now.getSeconds())}</strong>
      <span>{now.getFullYear()}.{two(now.getMonth() + 1)}.{two(now.getDate())} · {weekdays[now.getDay()]}</span></div>
  </div>;
}

export function LoginNetwork() {
  return <svg className="login-network" aria-hidden="true" viewBox="0 0 760 400" preserveAspectRatio="xMidYMid slice">
    <g className="login-network-flow">
      {edges.map(([from,to],i) => <g key={i}>
        <line x1={nodes[from][0]} y1={nodes[from][1]} x2={nodes[to][0]} y2={nodes[to][1]} />
        {i % 2 === 0 && <line className="login-network-packet" pathLength="100" style={{ animationDelay:`${-i * .63}s` }}
          x1={nodes[from][0]} y1={nodes[from][1]} x2={nodes[to][0]} y2={nodes[to][1]} />}
      </g>)}
      {nodes.map(([x,y], i) => <circle key={i} cx={x} cy={y} r={i === 3 ? 4 : 2.6} style={{ animationDelay:`${-i * .41}s` }} />)}
    </g>
    <g className="login-network-success">
      {Array.from({length:28},(_,i) => <line key={i} x1="380" y1={58 + i % 3 * 18} x2="380" y2={78 + i % 3 * 18} strokeWidth={i % 3 + 1} transform={`rotate(${i * 360 / 28} 380 200)`} />)}
      <path pathLength="1" d="m310 198 48 48 98-96" />
    </g>
  </svg>;
}
