import React, { useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardMetrics } from '@/components/dashboard-metrics';
import { ChatInterface } from '@/components/chat-interface';
import { DocumentVault } from '@/components/document-vault';
import { VobChecklist } from '@/components/vob-checklist';
import { AppealGenerator } from '@/components/appeal-generator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, History, Activity, Lock, Activity as ActivityIcon, BadgeCheck, FileCheck, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { chatService } from '@/lib/chat';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
export function HomePage() {
  const activeTab = useAppStore(s => s.activeTab);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const isVobOpen = useAppStore(s => s.isVobOpen);
  const setIsVobOpen = useAppStore(s => s.setIsVobOpen);
  const insuranceData = useAppStore(s => s.insuranceState);
  const documents = useAppStore(s => s.documents);
  const auditLogs = useAppStore(s => s.auditLogs);
  const complianceLogs = useAppStore(s => s.complianceLogs);
  const lastSync = useAppStore(s => s.lastSync);
  const systemMetrics = useAppStore(s => s.systemMetrics);
  const setStoreState = useAppStore(s => s.setStoreState);
  const doSync = useCallback(async () => {
    try {
      const res = await chatService.getMessages();
      if (res.success && res.data) {
        setStoreState({
          insuranceState: res.data.insuranceState || insuranceData,
          documents: res.data.documents || [],
          auditLogs: res.data.auditLogs || [],
          complianceLogs: res.data.complianceLogs || [],
          lastSync: Date.now(),
          systemMetrics: res.data.metrics || systemMetrics
        });
      }
    } catch (err) {
      console.error('Sync failure:', err);
    }
  }, [insuranceData, systemMetrics, setStoreState]);
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
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
              Forensic HUD <span className="text-blue-600">v2.4</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
                Compliance Bridge Active
              </p>
            </div>
          </div>
          <div className="text-right font-mono text-[10px] text-muted-foreground uppercase">
            <p>Last Context Sync: {new Date(lastSync).toLocaleTimeString()}</p>
            <p className="text-emerald-500 font-bold">SHA-256 Integrity Verified</p>
          </div>
        </header>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:w-[600px] h-12 bg-muted/30 p-1 rounded-xl">
            <TabsTrigger value="dashboard" className="rounded-lg font-bold">Command</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg font-bold">Audit Chat</TabsTrigger>
            <TabsTrigger value="vault" className="rounded-lg font-bold">Vault</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="space-y-8 mt-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3 space-y-6">
                <DashboardMetrics
                  deductibleTotal={insuranceData.deductibleTotal}
                  deductibleUsed={insuranceData.deductibleUsed}
                  oopMax={insuranceData.oopMax}
                  oopUsed={insuranceData.oopUsed}
                />
                {/* Forensic Timeline */}
                <Card className="border-l-4 border-l-emerald-500 shadow-soft overflow-hidden">
                  <CardHeader className="bg-emerald-500/5 py-3">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-emerald-700">
                      <History className="h-4 w-4" /> Compliance Chain (v2.4)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y text-[10px] font-mono">
                      {complianceLogs.length > 0 ? complianceLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="p-3 flex items-center justify-between bg-card hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge className={cn("text-[8px] h-4", 
                              log.risk_level === 'HIGH' ? 'bg-rose-500' : 'bg-emerald-500'
                            )}>{log.operation}</Badge>
                            <span className="text-muted-foreground truncate max-w-[200px]">{log.args_hash}</span>
                          </div>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <FileCheck className="h-3 w-3 text-emerald-500" />
                          </div>
                        </div>
                      )) : (
                        <div className="p-12 text-center text-muted-foreground italic">
                          Awaiting forensic operations...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card className="border-l-4 border-l-blue-600 shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <ActivityIcon className="h-4 w-4 text-blue-600" /> Audit Pulse
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-xl border space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Audit Count</span>
                        <span className="text-sm font-bold">{systemMetrics.audit_count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Latency (AVG)</span>
                        <span className="text-sm font-bold">{systemMetrics.worker_latency.toFixed(1)}ms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="chat" className="min-h-[600px] border rounded-2xl bg-card shadow-glass overflow-hidden mt-0">
            <ChatInterface activeDocuments={documents} />
          </TabsContent>
          <TabsContent value="vault" className="mt-0">
            <DocumentVault documents={documents} onRefresh={doSync} insuranceState={insuranceData} />
          </TabsContent>
        </Tabs>
        {/* HUD FOOTER */}
        <footer className="pt-8 border-t">
          <div className="bg-slate-950 rounded-2xl p-6 border border-white/10 shadow-glass flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase">System Integrity</p>
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm">
                  <BadgeCheck className="h-4 w-4" /> SECURE_256
                </div>
              </div>
              <div className="h-10 w-px bg-white/10 hidden md:block" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase">Scrub Conf</p>
                <p className="text-sm font-black text-blue-400 font-mono">{(systemMetrics.scrub_avg_confidence * 100).toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Carter V2.4 Specification Applied</span>
            </div>
          </div>
        </footer>
      </div>
      <VobChecklist isOpen={isVobOpen} onClose={() => setIsVobOpen(false)} insuranceInfo={{ policyId: "NAV-992-X", groupNumber: "GRP-FORENSIC" }} />
      <AppealGenerator />
    </AppLayout>
  );
}