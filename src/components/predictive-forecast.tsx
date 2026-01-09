import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Calendar, AlertCircle, Info, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
interface ForecastProps {
  deductibleTotal: number;
  deductibleUsed: number;
  oopMax: number;
  oopUsed: number;
}
export function PredictiveForecast({ deductibleTotal, deductibleUsed, oopMax, oopUsed }: ForecastProps) {
  const [scenario, setScenario] = useState<'low' | 'med' | 'high'>('med');
  const forecastData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    // Guard: Ensure multiplier is never zero
    const multiplier = scenario === 'low' ? 0.04 : scenario === 'med' ? 0.08 : 0.15;
    const currentTotalSpend = deductibleUsed + oopUsed;
    let cumulativeActual = 0;
    // Anchor projections at the current actual spend
    let cumulativeProjected = currentTotalSpend;
    return months.map((month, i) => {
      const isPast = i <= currentMonth;
      const isCurrent = i === currentMonth;
      if (isPast) {
        // Linearly distribute current spend over past months for visualization
        cumulativeActual = (currentTotalSpend / (currentMonth + 1)) * (i + 1);
      }
      // Add monthly burn based on scenario
      if (!isPast) {
        cumulativeProjected += (oopMax * multiplier);
      } else {
        // Sync projected with actual up to current month
        cumulativeProjected = cumulativeActual;
      }
      return {
        month,
        actual: isPast ? Math.round(cumulativeActual) : null,
        projected: Math.round(cumulativeProjected),
        isPast,
        isCurrent
      };
    });
  }, [scenario, oopMax, oopUsed, deductibleUsed]);
  const oopMaxDate = useMemo(() => {
    const hitIndex = forecastData.findIndex(d => d.projected >= oopMax);
    return hitIndex === -1 ? 'DEC' : forecastData[hitIndex].month;
  }, [forecastData, oopMax]);
  return (
    <Card className="border-blue-500/20 bg-slate-950 text-white shadow-glass overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-lg font-bold">Predictive Liability Engine</CardTitle>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
            MODEL: V2.2-PREDICT
          </Badge>
        </div>
        <CardDescription className="text-slate-400 text-xs">
          Forecasting annual spend burn-rate based on historical claim frequency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. OOP Max Threshold</p>
            <AnimatePresence mode="wait">
              <motion.div 
                key={oopMaxDate}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4 text-emerald-500" />
                <span className="text-xl font-mono font-black text-emerald-400">{oopMaxDate.toUpperCase()} 2024</span>
              </motion.div>
            </AnimatePresence>
          </div>
          <Tabs value={scenario} onValueChange={(v: any) => setScenario(v)}>
            <TabsList className="bg-slate-900 border-white/10">
              <TabsTrigger value="low" className="text-[10px] font-bold">LOW</TabsTrigger>
              <TabsTrigger value="med" className="text-[10px] font-bold">MED</TabsTrigger>
              <TabsTrigger value="high" className="text-[10px] font-bold">HIGH</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="h-[240px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide domain={[0, oopMax * 1.5]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                formatter={(value: any) => [formatCurrency(value), "Liability"]}
              />
              <ReferenceLine y={oopMax} stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" />
              <ReferenceLine y={oopMax} stroke="#ef4444" strokeWidth={4} strokeOpacity={0.1} />
              <Area
                type="monotone"
                dataKey="projected"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProj)"
                isAnimationActive={true}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#3B82F6"
                strokeWidth={3}
                fill="transparent"
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 flex gap-3">
            <Zap className="h-4 w-4 text-blue-400 shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-blue-400 uppercase">Strategic Advisory</p>
              <p className="text-[11px] text-slate-300 leading-snug">
                Prioritize major elective procedures after <span className="text-white font-bold">{oopMaxDate}</span> to maximize plan benefit and minimize out-of-pocket costs.
              </p>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 flex gap-3">
            <AlertCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-emerald-400 uppercase">Liability Gap</p>
              <p className="text-[11px] text-slate-300 leading-snug">
                You have <span className="text-white font-bold">{formatCurrency(Math.max(0, oopMax - (oopUsed + deductibleUsed)))}</span> remaining until your 100% coverage threshold.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}