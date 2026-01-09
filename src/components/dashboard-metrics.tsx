import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Label } from 'recharts';
import { formatCurrency, calculatePercentage } from '@/lib/utils';
import { Target, TrendingDown, Zap, PhoneCall, Gift, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
interface MetricProps {
  deductibleTotal: number;
  deductibleUsed: number;
  oopMax: number;
  oopUsed: number;
  confidenceScore?: number;
}
export function DashboardMetrics({ deductibleTotal, deductibleUsed, oopMax, oopUsed, confidenceScore = 0.94 }: MetricProps) {
  const setIsVobOpen = useAppStore(s => s.setIsVobOpen);
  const openAppeal = useAppStore(s => s.openAppealGenerator);
  const dedPct = calculatePercentage(deductibleUsed, deductibleTotal);
  const oopPct = calculatePercentage(oopUsed, oopMax);
  const dedData = [
    { value: deductibleUsed },
    { value: Math.max(0, deductibleTotal - deductibleUsed) }
  ];
  const oopData = [
    { value: oopUsed },
    { value: Math.max(0, oopMax - oopUsed) }
  ];
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="col-span-1 border-blue-500/20 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-[10px] font-bold uppercase tracking-wider">Deductible Status</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={45}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  <Cell fill="#3B82F6" />
                  <Cell fill="#F1F5F9" />
                  <Label
                    value={`${dedPct}%`}
                    position="center"
                    className="fill-foreground font-bold text-sm"
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2 font-mono">
            <p className="text-xl font-bold">{formatCurrency(deductibleUsed)}</p>
            <p className="text-[10px] text-muted-foreground">of {formatCurrency(deductibleTotal)}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-1 border-emerald-500/20 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-[10px] font-bold uppercase tracking-wider">OOP Max Status</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={oopData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={45}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F1F5F9" />
                  <Label
                    value={`${oopPct}%`}
                    position="center"
                    className="fill-foreground font-bold text-sm"
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2 font-mono">
            <p className="text-xl font-bold">{formatCurrency(oopUsed)}</p>
            <p className="text-[10px] text-muted-foreground">of {formatCurrency(oopMax)}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Strategic HUD
          </CardTitle>
          <Badge className="bg-emerald-500 text-white border-0 h-5 px-2 text-[10px] font-bold">
            <ShieldCheck className="h-3 w-3 mr-1" /> {Math.round(confidenceScore * 100)}% Accuracy
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Pre-Service Audit Pipeline</span>
              <span className="text-[10px] text-muted-foreground uppercase">Mandatory for procedures > $500</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 border-blue-500/20 text-blue-600 font-bold text-[10px]" onClick={() => openAppeal()}>
                <Sparkles className="mr-2 h-3 w-3" /> Evidence
              </Button>
              <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 font-bold text-[10px]" onClick={() => setIsVobOpen(true)}>
                <PhoneCall className="mr-2 h-3 w-3" /> VOB
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 border rounded-lg bg-card border-emerald-500/20 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold mb-1 text-emerald-600">
                <Gift className="h-3 w-3" /> ROI Opportunity
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">Annual wellness exam verified at $0 responsibility.</p>
            </div>
            <div className="p-2 border rounded-lg bg-card border-amber-500/20 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold mb-1 text-amber-600">
                <AlertCircle className="h-3 w-3" /> Liability Flag
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">Calculated liability discrepancy found in recent bill.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}