import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Label } from 'recharts';
import { formatCurrency, calculatePercentage } from '@/lib/utils';
import { CreditCard, TrendingDown, Target } from 'lucide-react';
interface MetricProps {
  deductibleTotal: number;
  deductibleUsed: number;
  oopMax: number;
  oopUsed: number;
}
export function DashboardMetrics({ deductibleTotal, deductibleUsed, oopMax, oopUsed }: MetricProps) {
  const dedPct = calculatePercentage(deductibleUsed, deductibleTotal);
  const oopPct = calculatePercentage(oopUsed, oopMax);
  const dedData = [{ value: deductibleUsed }, { value: Math.max(0, deductibleTotal - deductibleUsed) }];
  const oopData = [{ value: oopUsed }, { value: Math.max(0, oopMax - oopUsed) }];
  const COLORS = ['#3B82F6', '#E2E8F0'];
  const DARK_COLORS = ['#3B82F6', '#1E293B'];
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="col-span-1">
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
                  <Cell fill={COLORS[0]} />
                  <Cell fill={COLORS[1]} />
                  <Label
                    value={`${dedPct}%`}
                    position="center"
                    className="fill-foreground font-bold text-lg"
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <p className="text-2xl font-bold font-mono">{formatCurrency(deductibleUsed)}</p>
            <p className="text-xs text-muted-foreground">of {formatCurrency(deductibleTotal)} met</p>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-1">
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
                  <Cell fill={COLORS[1]} />
                  <Label
                    value={`${oopPct}%`}
                    position="center"
                    className="fill-foreground font-bold text-lg"
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <p className="text-2xl font-bold font-mono">{formatCurrency(oopUsed)}</p>
            <p className="text-xs text-muted-foreground">of {formatCurrency(oopMax)} limit</p>
          </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2 flex flex-col justify-center">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-500" />
            Max-Benefit Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Remaining Liability</span>
            <span className="text-xl font-bold font-mono text-emerald-500">
              {formatCurrency(oopMax - oopUsed)}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">STRATEGIC NOTE:</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You have met {dedPct}% of your deductible. For non-urgent procedures, verify if providers are tiered as "Preferred" to minimize coinsurance impact.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}