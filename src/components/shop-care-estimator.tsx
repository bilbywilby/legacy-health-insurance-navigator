import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calculator, ShieldAlert, TrendingUp, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
interface EstimatorProps {
  deductibleRemaining: number;
  oopRemaining: number;
  onEstimateChange?: (val: number) => void;
}
export function ShopCareEstimator({ deductibleRemaining, oopRemaining }: EstimatorProps) {
  const [cost, setCost] = useState<string>('');
  const [isInNetwork, setIsInNetwork] = useState(true);
  const estimate = parseFloat(cost) || 0;
  // Logic: Deductible First -> Co-insurance (assume 20%) -> OOP Max limit
  const deductibleApplied = Math.min(estimate, deductibleRemaining);
  const remainingAfterDeductible = Math.max(0, estimate - deductibleApplied);
  const coinsurance = remainingAfterDeductible * (isInNetwork ? 0.2 : 0.4);
  const rawTotal = deductibleApplied + coinsurance;
  const netResponsibility = Math.min(rawTotal, oopRemaining);
  const oopImpactPercent = Math.round((netResponsibility / oopRemaining) * 100);
  return (
    <Card className="glass-dark border-blue-500/20 shadow-glass">
      <CardHeader>
        <div className="flex items-center gap-2 text-blue-500 mb-1">
          <Calculator className="h-5 w-5" />
          <CardTitle className="text-lg">Shop Care Estimator</CardTitle>
        </div>
        <CardDescription className="text-xs">Predict financial impact on your specific plan state.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Estimated Procedure Cost</Label>
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
            <div className="flex gap-2">
              <Button 
                variant={isInNetwork ? "default" : "outline"} 
                className="flex-1 h-10 text-xs"
                onClick={() => setIsInNetwork(true)}
              >
                In-Network
              </Button>
              <Button 
                variant={!isInNetwork ? "default" : "outline"} 
                className="flex-1 h-10 text-xs"
                onClick={() => setIsInNetwork(false)}
              >
                Out-of-Network
              </Button>
            </div>
          </div>
        </div>
        <div className="p-4 bg-blue-600/5 rounded-xl border border-blue-500/20 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-blue-500 uppercase">Net Patient Responsibility</p>
              <p className="text-3xl font-mono font-bold">{formatCurrency(netResponsibility)}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                {isInNetwork ? '20% Co-ins' : '40% Co-ins'}
              </Badge>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-medium">
              <span className="text-muted-foreground">OOP Max Exposure Impact</span>
              <span className="text-blue-500">{oopImpactPercent}% of remaining limit</span>
            </div>
            <Progress value={oopImpactPercent} className="h-1.5 bg-blue-100/50 dark:bg-blue-900/30" />
          </div>
        </div>
        <div className="flex gap-3 p-3 bg-muted/30 rounded-lg border text-[11px] leading-relaxed italic text-muted-foreground">
          <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
          <div>
            <span className="font-bold text-foreground">Strategic Recommendation: </span>
            {netResponsibility > 500 && deductibleRemaining > 0 
              ? "Consider deferring elective care until Q4 if you anticipate hitting your deductible with other claims."
              : "Calculated liability is within optimal threshold. Ensure VOB is initiated before appointment."}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}