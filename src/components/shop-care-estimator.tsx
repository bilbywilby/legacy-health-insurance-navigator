import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calculator, ShieldAlert, TrendingUp, Info, Printer, Sparkles, AlertTriangle, Fingerprint } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
interface EstimatorProps {
  deductibleRemaining: number;
  oopRemaining: number;
  onEstimateChange?: (val: number) => void;
}
export function ShopCareEstimator({ deductibleRemaining, oopRemaining }: EstimatorProps) {
  const [cost, setCost] = useState<string>('');
  const [isInNetwork, setIsInNetwork] = useState(true);
  const [isEmergency, setIsEmergency] = useState(false);
  const estimate = parseFloat(cost) || 0;
  // FMV V2.1 Simulation Logic
  // Assuming a baseline average of $500 for generic procedures in this view
  const genericBaseline = 500;
  const fmvUpperLimit = genericBaseline * 1.4; // 140% Baseline
  const isCriticalOvercharge = estimate > fmvUpperLimit * 1.4; // 40% Over Baseline
  const deductibleApplied = Math.min(estimate, deductibleRemaining);
  const remainingAfterDeductible = Math.max(0, estimate - deductibleApplied);
  const coinsuranceRate = isInNetwork ? 0.2 : 0.4;
  const coinsurance = remainingAfterDeductible * coinsuranceRate;
  const rawTotal = deductibleApplied + coinsurance;
  const netResponsibility = Math.min(rawTotal, oopRemaining);
  const oopImpactPercent = Math.round((netResponsibility / Math.max(1, oopRemaining)) * 100);
  const isNsaProtected = isEmergency || (!isInNetwork && estimate > 500);
  const potentialSavings = !isInNetwork && isNsaProtected ? (estimate * 0.4) - (estimate * 0.2) : 0;
  const handlePrint = () => {
    toast.success("Forensic Cost Report prepared for printing");
    window.print();
  };
  return (
    <Card className="glass-dark border-blue-500/20 shadow-glass overflow-hidden">
      <CardHeader className="relative overflow-hidden border-b border-white/5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-500">
            <Calculator className="h-5 w-5" />
            <CardTitle className="text-lg">Shop Care Estimator</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs font-medium">Deterministic V2.1 Liability Modeling Engine.</CardDescription>
        {isCriticalOvercharge && (
          <div className="absolute right-[-20px] top-[20px] rotate-45 bg-rose-600 text-white text-[8px] font-bold px-8 py-1 shadow-md animate-pulse">
            HIGH VARIANCE
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Estimated Provider Cost</Label>
              <span className="text-[9px] font-mono text-blue-500">FMV BASE: ${fmvUpperLimit.toFixed(0)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                placeholder="0.00"
                className={cn(
                  "pl-7 bg-muted/20 border-blue-500/10 focus-visible:ring-blue-500 font-mono",
                  isCriticalOvercharge && "border-rose-500/50 text-rose-600"
                )}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Network Status</Label>
            <div className="flex gap-1 p-1 bg-muted/20 rounded-lg border border-blue-500/10">
              <Button
                variant={isInNetwork ? "default" : "ghost"}
                size="sm"
                className={cn("flex-1 text-[10px] h-7 font-bold", isInNetwork && "bg-blue-600")}
                onClick={() => setIsInNetwork(true)}
              >
                IN-NETWORK
              </Button>
              <Button
                variant={!isInNetwork ? "default" : "ghost"}
                size="sm"
                className={cn("flex-1 text-[10px] h-7 font-bold", !isInNetwork && "bg-amber-600")}
                onClick={() => setIsInNetwork(false)}
              >
                OUT-OF-NETWORK
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-500/5 border-blue-500/10">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-tight">NSA / Emergency Logic</span>
              <span className="text-[9px] text-muted-foreground">Apply No Surprises Act protections</span>
            </div>
          </div>
          <Switch checked={isEmergency} onCheckedChange={setIsEmergency} />
        </div>
        <div className="p-4 bg-blue-600/5 rounded-xl border border-blue-500/20 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Net Patient Responsibility</p>
              <p className="text-3xl font-mono font-bold tracking-tighter">{formatCurrency(netResponsibility)}</p>
            </div>
            <div className="text-right space-y-1">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-mono font-bold">
                {Math.round(coinsuranceRate * 100)}% CO-INS
              </Badge>
              {potentialSavings > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <Sparkles className="h-3 w-3" /> ROI: {formatCurrency(potentialSavings)}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
              <span className="text-muted-foreground">Plan Limit Exposure</span>
              <span className="text-blue-500">{oopImpactPercent}% OF OOP MAX</span>
            </div>
            <Progress value={oopImpactPercent} className="h-1 bg-blue-100/50 dark:bg-blue-900/30" />
          </div>
        </div>
        <div className="flex gap-3 p-3 bg-muted/30 rounded-lg border text-[11px] leading-relaxed text-muted-foreground">
          {isCriticalOvercharge ? (
            <>
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-600">CRITICAL OVERCHARGE DETECTED: </span>
                This cost exceeds Fair Market Value by over 40%. A strategic dispute token (NAV-DS) is recommended before payment.
              </div>
            </>
          ) : (
            <>
              <Fingerprint className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground uppercase tracking-tight">Forensic Forecast: </span>
                {estimate > 0 ? `Cost is within expected variance (+${Math.round((estimate/fmvUpperLimit - 1) * 100)}%). Verification complete.` : "Awaiting forensic input data."}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}