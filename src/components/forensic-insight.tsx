import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle2, AlertCircle, Info, ExternalLink, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ForensicOutput } from '../../worker/types';
interface ForensicInsightProps {
  data: ForensicOutput;
  isNsaSubject?: boolean;
}
export function ForensicInsight({ data, isNsaSubject = false }: ForensicInsightProps) {
  const confidenceColor = data.confidence_score > 0.9 ? 'text-emerald-500' : data.confidence_score > 0.7 ? 'text-amber-500' : 'text-rose-500';
  const confidenceBg = data.confidence_score > 0.9 ? 'bg-emerald-500' : data.confidence_score > 0.7 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mt-4 overflow-hidden rounded-xl border border-blue-500/20 bg-blue-50/30 shadow-sm dark:bg-blue-950/20"
    >
      <div className="flex items-center justify-between border-b border-blue-500/10 bg-blue-500/5 px-4 py-2">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
          <Activity className="h-3 w-3" />
          AI Audit Payload
        </div>
        <div className="flex gap-2">
          {isNsaSubject && (
            <Badge className="h-5 border-0 bg-amber-500 text-white text-[9px] font-bold">
              <ShieldAlert className="mr-1 h-3 w-3" /> NSA PROTECTED
            </Badge>
          )}
          <Badge variant="outline" className="h-5 font-mono text-[9px] border-blue-200 text-blue-600 bg-blue-50">
            v2.0-CORE
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Calculated Liability</p>
            <p className="text-xl font-mono font-bold text-foreground">
              ${data.liability_calc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Confidence</p>
              <span className={cn("text-[10px] font-bold", confidenceColor)}>
                {Math.round(data.confidence_score * 100)}%
              </span>
            </div>
            <Progress value={data.confidence_score * 100} className={cn("h-1", confidenceBg)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card text-[11px] leading-relaxed">
            <div className={cn("mt-0.5", data.code_validation ? "text-emerald-500" : "text-amber-500")}>
              {data.code_validation ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            </div>
            <div>
              <p className="font-bold mb-0.5">Validation Status</p>
              <p className="text-muted-foreground">
                {data.code_validation 
                  ? "Claim structure aligns with EOC bundling logic." 
                  : "Potential discrepancy in CPT bundling detected."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card text-[11px] leading-relaxed italic text-muted-foreground">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground not-italic">Strategic Disclaimer</p>
              {data.strategic_disclaimer}
            </div>
          </div>
        </div>
        <div className="pt-2 flex justify-end">
           <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
             VIEW DETAILED AUDIT LOG <ExternalLink className="h-3 w-3" />
           </button>
        </div>
      </CardContent>
    </motion.div>
  );
}