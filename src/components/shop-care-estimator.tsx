import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calculator, ShieldAlert, TrendingUp, Info, Printer, Sparkles, AlertTriangle } from 'lucide-react';
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
  // Logic: Deductible First -> Co-insurance (assume 20%) -> OOP Max limit
  const deductibleApplied = Math.min(estimate, deductibleRemaining);
  const remainingAfterDeductible = Math.max(0, estimate - deductibleApplied);
  const coinsuranceRate = isInNetwork ? 0.2 : 0.4;
  const coinsurance = remainingAfterDeductible * coinsuranceRate;
  const rawTotal = deductibleApplied + coinsurance;
  const netResponsibility = Math.min(rawTotal, oopRemaining);
  const oopImpactPercent = Math.round((netResponsibility / Math.max(1, oopRemaining)) * 100);
  // NSA Logic
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
        <CardDescription className="text-xs">Dynamic liability modeling based on current plan state.</CardDescription>
        {isNsaProtected && (
          <div className="absolute right-[-20px] top-[20px] rotate-45 bg-amber-500 text-white text-[8px] font-bold px-8 py-1 shadow-md">
            NSA ACTIVE
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Estimated Provider Cost</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                placeholder="0.00"
                className="pl-7 bg-muted/20 border-blue-500/10 focus-visible:ring-blue-500"
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
                className={cn("flex-1 text-[10px] h-7", isInNetwork && "bg-blue-600")}
                onClick={() => setIsInNetwork(true)}
              >
                IN-NETWORK
              </Button>
              <Button
                variant={!isInNetwork ? "default" : "ghost"}
                size="sm"
                className={cn("flex-1 text-[10px] h-7", !isInNetwork && "bg-amber-600")}
                onClick={() => setIsInNetwork(false)}
              >
                OUT-OF-NETWORK
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/5 border-amber-500/10">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-tight">NSA Compliance Monitor</span>
              <span className="text-[9px] text-muted-foreground">Flag for No Surprises Act protections</span>
            </div>
          </div>
          <Switch checked={isEmergency} onCheckedChange={setIsEmergency} />
        </div>
        <div className="p-4 bg-blue-600/5 rounded-xl border border-blue-500/20 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Net Liability</p>
              <p className="text-3xl font-mono font-bold tracking-tighter">{formatCurrency(netResponsibility)}</p>
            </div>
            <div className="text-right space-y-1">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-mono">
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
            <div className="flex justify-between text-[10px] font-medium uppercase tracking-tighter">
              <span className="text-muted-foreground">OOP Exposure impact</span>
              <span className="text-blue-500 font-bold">{oopImpactPercent}% REMAINING LIMIT</span>
            </div>
            <Progress value={oopImpactPercent} className="h-1 bg-blue-100/50 dark:bg-blue-900/30" />
          </div>
        </div>
        <div className="flex gap-3 p-3 bg-muted/30 rounded-lg border text-[11px] leading-relaxed text-muted-foreground">
          {isNsaProtected ? (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-600">NSA PROTECTION ACTIVE: </span>
                Facility is {isInNetwork ? 'In-Network' : 'Out-of-Network'} but emergency logic applies. You are protected from balance billing above in-network rates.
              </div>
            </>
          ) : (
            <>
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground">STRATEGIC FORECAST: </span>
                {netResponsibility > 500 && deductibleRemaining > 0
                  ? "Liability exceeds $500 threshold. Manual VOB is recommended to confirm Tier 1 status."
                  : "Calculated liability is within expected parameters. Proceed with digital record capture."}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}