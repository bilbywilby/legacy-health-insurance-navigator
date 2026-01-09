import React, { useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardMetrics } from '@/components/dashboard-metrics';
import { ChatInterface } from '@/components/chat-interface';
import { DocumentVault } from '@/components/document-vault';
import { VobChecklist } from '@/components/vob-checklist';
import { ShopCareEstimator } from '@/components/shop-care-estimator';
import { PredictiveForecast } from '@/components/predictive-forecast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, History, Activity, Lock, CheckCircle2, FileLock2, Link2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { chatService } from '@/lib/chat';
import { AppealGenerator } from '@/components/appeal-generator';
import { motion } from 'framer-motion';
export function HomePage() {
  const activeTab = useAppStore(s => s.activeTab);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const isVobOpen = useAppStore(s => s.isVobOpen);
  const setIsVobOpen = useAppStore(s => s.setIsVobOpen);
  const insuranceData = useAppStore(s => s.insuranceState);
  const documents = useAppStore(s => s.documents);
  const auditLogs = useAppStore(s => s.auditLogs);
  const lastSync = useAppStore(s => s.lastSync);
  const openAppeal = useAppStore(s => s.openAppealGenerator);
  const mostRecentCritical = auditLogs?.find(log => log.severity === 'critical');
  const doSync = useCallback(async () => {
    try {
      const res = await chatService.getMessages();
      if (res.success && res.data) {
        useAppStore.setState({
          insuranceState: res.data.insuranceState || insuranceData,
          documents: res.data.documents || [],
          auditLogs: res.data.auditLogs || [],
          lastSync: res.data.lastContextSync || Date.now(),
        });
      } else {
        useAppStore.setState({ lastSync: Date.now() });
      }
    } catch (err) {
      console.error('Failed to sync app data:', err);
      useAppStore.setState({ lastSync: Date.now() });
    }
  }, [insuranceData]);
  useEffect(() => {
    doSync();
    const interval = setInterval(doSync, 30000);
    return () => clearInterval(interval);
  }, [doSync]);
  return (
    <AppLayout container contentClassName="max-w-[1400px]">
      <div className="space-y-8 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground uppercase">
                Command Center
              </h1>
              <Badge variant="outline" className="h-6 border-blue-500/30 text-blue-600 bg-blue-500/5 font-mono text-[10px] font-bold uppercase">
                v2.3 Production
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-muted-foreground font-medium flex items-center gap-2 text-xs">
                <Lock className="h-3 w-3 text-emerald-500" />
                Live Dynamic Benchmarking Active
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest">STATE MONITOR SECURE</span>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
              SYSTEM TICK: {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </header>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:w-[600px] h-12 bg-muted/30 p-1 rounded-xl">
            <TabsTrigger value="dashboard" className="rounded-lg font-bold">Command Center</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg font-bold">Forensic Chat</TabsTrigger>
            <TabsTrigger value="vault" className="rounded-lg font-bold">Document Vault</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="space-y-8 mt-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-8">
                <DashboardMetrics deductibleTotal={insuranceData.deductibleTotal} deductibleUsed={insuranceData.deductibleUsed} oopMax={insuranceData.oopMax} oopUsed={insuranceData.oopUsed} />
                <PredictiveForecast deductibleTotal={insuranceData.deductibleTotal} deductibleUsed={insuranceData.deductibleUsed} oopMax={insuranceData.oopMax} oopUsed={insuranceData.oopUsed} />
                <ShopCareEstimator deductibleRemaining={insuranceData.deductibleTotal - insuranceData.deductibleUsed} oopRemaining={insuranceData.oopMax - insuranceData.oopUsed} />
              </div>
              <div className="space-y-8">
                <Card className="border-l-4 border-l-blue-600 shadow-soft">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-blue-600" />
                        Audit Pipeline
                      </div>
                      <Badge variant="outline" className="h-4 text-[8px] font-bold">{(auditLogs || []).length} EVENTS</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4">
                    <div className="space-y-4">
                      {(auditLogs || []).slice(0, 5).map(log => (
                        <div key={log.id} className="group relative p-3 hover:bg-muted/30 rounded-lg border border-transparent hover:border-border transition-all space-y-1">
                          <div className="flex justify-between items-start">
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                              log.severity === 'critical' ? 'bg-rose-500 text-white' :
                              log.severity === 'warning' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                            )}>
                              {log.event}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">{log.detail}</p>
                          <button onClick={() => openAppeal(log.id)} className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white p-1 rounded hover:bg-blue-700 shadow-sm">
                            <FileLock2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500 shadow-soft bg-amber-500/[0.02]">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-amber-500" />
                      Bridge Discrepancy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4">
                    <div className="p-4 border border-amber-500/20 rounded-xl bg-card shadow-sm space-y-3">
                      <p className="font-bold text-xs text-amber-600 uppercase">
                        {mostRecentCritical ? `Event: ${mostRecentCritical.event}` : 'Policy Deviation #8812'}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {mostRecentCritical ? mostRecentCritical.detail : 'Claim CPT mismatch detected against EOC Benefit Schedule.'}
                      </p>
                      <Button variant="outline" size="sm" className="w-full h-8 text-[9px] font-bold border-amber-500/20 text-amber-600 hover:bg-amber-50" onClick={() => openAppeal(mostRecentCritical?.id)}>
                        RECONCILE VIA BRIDGE
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="chat" className="min-h-[700px] border rounded-2xl bg-card shadow-glass overflow-hidden mt-0">
            <ChatInterface activeDocuments={documents} />
          </TabsContent>
          <TabsContent value="vault" className="mt-0">
            <DocumentVault documents={documents} onRefresh={doSync} insuranceState={insuranceData} />
          </TabsContent>
        </Tabs>
      </div>
      <VobChecklist isOpen={isVobOpen} onClose={() => setIsVobOpen(false)} insuranceInfo={{ policyId: "LEG-99238421", groupNumber: "GRP-NAV-01" }} />
      <AppealGenerator />
    </AppLayout>
  );
}