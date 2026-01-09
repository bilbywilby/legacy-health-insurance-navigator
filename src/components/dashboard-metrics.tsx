import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Label } from 'recharts';
import { formatCurrency, calculatePercentage } from '@/lib/utils';
import { CreditCard, TrendingDown, Target, Zap, PhoneCall, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
interface MetricProps {
  deductibleTotal: number;
  deductibleUsed: number;
  oopMax: number;
  oopUsed: number;
}
export function DashboardMetrics({ deductibleTotal, deductibleUsed, oopMax, oopUsed }: MetricProps) {
  const setIsVobOpen = useAppStore(s => s.setIsVobOpen);
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
      <Card className="col-span-1 border-blue-500/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Deductible Status</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={55}
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
                    className="fill-foreground font-bold text-lg"
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2 font-mono">
            <p className="text-2xl font-bold">{formatCurrency(deductibleUsed)}</p>
            <p className="text-xs text-muted-foreground">of {formatCurrency(deductibleTotal)} met</p>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-1 border-emerald-500/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">OOP Max Exposure</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={oopData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={55}
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
                    className="fill-foreground font-bold text-lg"
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2 font-mono">
            <p className="text-2xl font-bold">{formatCurrency(oopUsed)}</p>
            <p className="text-xs text-muted-foreground">of {formatCurrency(oopMax)} limit</p>
          </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Strategic HUD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">PRE-SERVICE AUDIT</span>
              <span className="text-[10px] text-muted-foreground uppercase">Mandatory for costs &gt; $500</span>
            </div>
            <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700" onClick={() => setIsVobOpen(true)}>
              <PhoneCall className="mr-2 h-3 w-3" /> Initiate VOB
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg bg-card">
              <div className="flex items-center gap-2 text-xs font-bold mb-1">
                <Gift className="h-3 w-3 text-emerald-500" /> Plan Maximization
              </div>
              <p className="text-[10px] text-muted-foreground">Annual wellness exam & preventive screenings are 100% covered. ROI Opportunity identified.</p>
            </div>
            <div className="p-3 border rounded-lg bg-card">
              <div className="flex items-center gap-2 text-xs font-bold mb-1">
                <CreditCard className="h-3 w-3 text-blue-500" /> Spend-Down
              </div>
              <p className="text-[10px] text-muted-foreground">Q4 Strategy: If deductible is met, prioritize elective care before Jan 1 reset.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}