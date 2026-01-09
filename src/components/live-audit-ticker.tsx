import React from 'react';
import { useAppStore } from '@/lib/store';
import { Activity, ShieldCheck, Zap, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
export function LiveAuditTicker() {
  const liveTicker = useAppStore(s => s.liveTicker);
  if (liveTicker.length === 0) return null;
  return (
    <div className="w-full bg-slate-950 border-y border-white/5 py-2 overflow-hidden relative group">
      <div className="flex animate-marquee whitespace-nowrap gap-12 items-center hover:[animation-play-state:paused]">
        {[...liveTicker, ...liveTicker].map((event, idx) => (
          <div key={`${event.id}-${idx}`} className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-tighter">
            <span className="text-slate-500">{new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <div className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded",
              event.type === 'AUDIT' ? "bg-blue-500/10 text-blue-400" : 
              event.type === 'COMPLIANCE' ? "bg-emerald-500/10 text-emerald-400" :
              "bg-slate-800 text-slate-400"
            )}>
              {event.type === 'AUDIT' && <Zap className="h-2.5 w-2.5" />}
              {event.type === 'COMPLIANCE' && <ShieldCheck className="h-2.5 w-2.5" />}
              {event.type === 'SYNC' && <Activity className="h-2.5 w-2.5" />}
              <span className="font-black">{event.type}</span>
            </div>
            <span className="text-slate-300 font-bold">{event.label}</span>
            <div className="flex items-center gap-1 text-slate-600">
              <Lock className="h-2.5 w-2.5" />
              <span>SHA-256</span>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10" />
    </div>
  );
}