import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle2, AlertCircle, Info, ExternalLink, Activity, ClipboardCopy, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ForensicOutput } from '../../worker/types';
interface ForensicInsightProps {
  data: ForensicOutput;
  isNsaSubject?: boolean;
}
export function ForensicInsight({ data, isNsaSubject = false }: ForensicInsightProps) {
  const variance = data.fmv_variance ?? 0;
  const confidenceColor = data.confidence_score > 0.9 ? 'text-emerald-500' : data.confidence_score > 0.7 ? 'text-amber-500' : 'text-rose-500';
  const confidenceBg = data.confidence_score > 0.9 ? 'bg-emerald-500' : data.confidence_score > 0.7 ? 'bg-amber-500' : 'bg-rose-500';
  const varianceColor = variance > 40 ? 'text-rose-500' : variance > 10 ? 'text-amber-500' : 'text-emerald-500';
  const copyEvidence = () => {
    const summary = `
      LEGACY NAVIGATOR V2.1 AUDIT SUMMARY
      ----------------------------------
      Liability Estimate: $${data.liability_calc.toLocaleString()}
      FMV Variance: ${variance}%
      Dispute Token: ${data.dispute_token || 'N/A'}
      Audit Confidence: ${Math.round(data.confidence_score * 100)}%
      Disclaimer: ${data.strategic_disclaimer}
    `.trim();
    navigator.clipboard.writeText(summary);
    toast.success("Forensic evidence copied to clipboard");
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mt-4 overflow-hidden rounded-xl border border-blue-500/20 bg-blue-50/30 shadow-sm dark:bg-blue-950/20"
    >
      <div className="flex items-center justify-between border-b border-blue-500/10 bg-blue-500/5 px-4 py-2">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
          <Activity className="h-3 w-3" />
          Forensic V2.1 Payload
        </div>
        <div className="flex gap-2">
          {isNsaSubject && (
            <Badge className="h-5 border-0 bg-amber-500 text-white text-[9px] font-bold">
              <ShieldAlert className="mr-1 h-3 w-3" /> NSA PROTECTED
            </Badge>
          )}
          <Badge variant="outline" className="h-5 font-mono text-[9px] border-blue-200 text-blue-600 bg-blue-50">
            STRAT-01
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">FMV Variance</p>
            <p className={cn("text-xl font-mono font-bold", varianceColor)}>
              {variance > 0 ? `+${variance}%` : `${variance}%`}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Audit Confidence</p>
              <span className={cn("text-[10px] font-bold", confidenceColor)}>
                {Math.round(data.confidence_score * 100)}%
              </span>
            </div>
            <Progress value={data.confidence_score * 100} className={cn("h-1", confidenceBg)} />
          </div>
        </div>
        {data.dispute_token && (
          <div className="p-3 bg-blue-600/5 rounded-lg border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase text-muted-foreground">Strategic Dispute Token</span>
                <span className="text-xs font-mono font-bold text-blue-600">{data.dispute_token}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[8px] bg-blue-100 text-blue-600">ENCRYPTED</Badge>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card text-[11px] leading-relaxed">
            <div className={cn("mt-0.5", data.code_validation ? "text-emerald-500" : "text-amber-500")}>
              {data.code_validation ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            </div>
            <div>
              <p className="font-bold mb-0.5">Benchmarking</p>
              <p className="text-muted-foreground font-mono">
                Est: ${data.liability_calc.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card text-[11px] leading-relaxed italic text-muted-foreground">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground not-italic">Audit Summary</p>
              {data.strategic_disclaimer}
            </div>
          </div>
        </div>
        <div className="pt-2 flex justify-between items-center">
           <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline uppercase tracking-tight">
             Detailed Analysis <ExternalLink className="h-3 w-3" />
           </button>
           <button 
             onClick={copyEvidence}
             className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
           >
             <ClipboardCopy className="h-3 w-3" /> Copy Evidence
           </button>
        </div>
      </CardContent>
    </motion.div>
  );
}