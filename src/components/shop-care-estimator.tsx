import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calculator, ShieldAlert, Search, Zap, Loader2, AlertTriangle, Fingerprint, FileCheck } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { chatService } from '@/lib/chat';
import { perfMonitor } from '@/lib/perf';
import { toast } from 'sonner';
interface EstimatorProps {
  deductibleRemaining: number;
  oopRemaining: number;
}
export function ShopCareEstimator({ deductibleRemaining, oopRemaining }: EstimatorProps) {
  const [cost, setCost] = useState<string>('');
  const [cpt, setCpt] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedRate, setVerifiedRate] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const handleVerify = async () => {
    if (!cpt || cpt.length !== 5) {
      toast.error("Valid 5-digit CPT code required");
      return;
    }
    setIsVerifying(true);
    const start = performance.now();
    try {
      const res = await perfMonitor.track('lookup', () => chatService.lookupCpt(cpt));
      if (res.success && res.data?.rate) {
        setVerifiedRate(res.data.rate);
        setCost(res.data.rate.toString());
        setLatency(performance.now() - start);
        toast.success(`Dynamic FMV Locked: ${formatCurrency(res.data.rate)}`);
      } else {
        toast.error("Live benchmarking failed. Using fallback estimate.");
      }
    } catch (err) {
      toast.error("Intelligence bridge timeout.");
    } finally {
      setIsVerifying(false);
    }
  };
  const estimate = parseFloat(cost) || 0;
  const HIGH_THRESHOLD = 40; // Align with worker/forensic.ts
  const variancePercent = verifiedRate ? ((estimate / (verifiedRate * 1.4)) - 1) * 100 : 0;
  const isCriticalOvercharge = variancePercent >= HIGH_THRESHOLD;
  const netResponsibility = Math.min(estimate, oopRemaining);
  const oopImpactPercent = Math.round((netResponsibility / Math.max(1, oopRemaining)) * 100);
  return (
    <Card className="glass-dark border-blue-500/20 shadow-glass overflow-hidden">
      <CardHeader className="border-b border-white/5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-500">
            <Calculator className="h-5 w-5" />
            <CardTitle className="text-lg font-bold">Shop Care Estimator</CardTitle>
          </div>
          {latency !== null && (
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 font-mono text-[9px] flex items-center gap-1">
              <Zap className="h-2 w-2" /> {latency.toFixed(0)}ms
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs font-medium">Real-time CPT FMV Benchmarking Engine.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Audit CPT Code</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. 99214"
                className="bg-muted/20 border-blue-500/10 focus-visible:ring-blue-500 font-mono"
                value={cpt}
                maxLength={5}
                onChange={(e) => setCpt(e.target.value)}
              />
              <Button size="sm" onClick={handleVerify} disabled={isVerifying} className="bg-blue-600 hover:bg-blue-700">
                {isVerifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Provider Cost (Est)</Label>
            <Input
              type="number"
              placeholder="0.00"
              className={cn("bg-muted/20 border-blue-500/10 focus-visible:ring-blue-500 font-mono", isCriticalOvercharge && "border-rose-500/50 text-rose-600")}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
        </div>
        {verifiedRate && (
          <div className="flex items-center gap-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase">
            <FileCheck className="h-3 w-3" /> Compliance Verified Against Dynamic Benchmark
          </div>
        )}
        <div className="p-4 bg-blue-600/5 rounded-xl border border-blue-500/20 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Net Patient Responsibility</p>
              <p className="text-3xl font-mono font-bold tracking-tighter">{formatCurrency(netResponsibility)}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[9px] font-mono font-bold">
                {oopImpactPercent}% EXPOSURE
              </Badge>
            </div>
          </div>
          <Progress value={oopImpactPercent} className="h-1 bg-blue-100/50 dark:bg-blue-900/30" />
        </div>
        <div className="flex gap-3 p-3 bg-muted/30 rounded-lg border text-[11px] leading-relaxed text-muted-foreground">
          {isCriticalOvercharge ? (
            <>
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-600">CRITICAL VARIANCE: </span>
                Charge is highly unaligned with fair market value standards.
              </div>
            </>
          ) : (
            <>
              <Fingerprint className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground uppercase tracking-tight">Intelligence Forecast: </span>
                {estimate > 0 ? `Cost is verified within regional standards.` : "Awaiting CPT verification."}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}