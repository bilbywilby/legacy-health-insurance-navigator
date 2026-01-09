import React, { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardMetrics } from '@/components/dashboard-metrics';
import { ChatInterface } from '@/components/chat-interface';
import { DocumentVault } from '@/components/document-vault';
import { VobChecklist } from '@/components/vob-checklist';
import { ShopCareEstimator } from '@/components/shop-care-estimator';
import { PredictiveForecast } from '@/components/predictive-forecast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, History, AlertTriangle, Activity, Lock, CheckCircle2, Search, FileLock2, Link2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { chatService } from '@/lib/chat';
import { AppealGenerator } from '@/components/appeal-generator';
import { Button } from '@/components/ui/button';
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
  const doSync = async () => {
    try {
      const res = await chatService.getMessages();
      if (res.success && res.data) {
        useAppStore.setState({
          insuranceState: res.data.insuranceState || {
            deductibleTotal: 3000,
            deductibleUsed: 1350,
            oopMax: 6500,
            oopUsed: 2100,
            planType: 'PPO',
            networkStatus: 'In-Network'
          },
          documents: res.data.documents || [],
          auditLogs: res.data.auditLogs || [],
          lastSync: res.data.lastContextSync || Date.now(),
        });
      }
    } catch (err) {
      console.error('Failed to sync app data:', err);
    }
  };
  useEffect(() => {
    doSync();
    const interval = setInterval(doSync, 30000);
    return () => clearInterval(interval);
  }, []);
  return (
    <AppLayout container>
      <div className="space-y-8 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                COMMAND CENTER
              </h1>
              <Badge variant="outline" className="h-6 border-blue-500/30 text-blue-600 bg-blue-500/5 font-mono text-[10px] font-bold uppercase">
                v2.2 Production
              </Badge>
            </div>
            <p className="text-muted-foreground font-medium flex items-center gap-2 text-sm">
              <Lock className="h-3 w-3 text-emerald-500" />
              Distributed Intelligence Bridge Active
            </p>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex gap-4 border-r pr-6 print-hide">
                <div className="flex flex-col items-end">
                   <span className="text-[8px] font-black uppercase text-muted-foreground">Audit Engine</span>
                   <Badge className="h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px]">LIVE</Badge>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[8px] font-black uppercase text-muted-foreground">Compliance Bridge</span>
                   <Badge className="h-4 bg-blue-500/10 text-blue-600 border-blue-500/20 text-[8px]">SYNCED</Badge>
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
          </div>
        </header>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:w-[600px] h-12 bg-muted/30 p-1 rounded-xl">
            <TabsTrigger value="dashboard" className="rounded-lg">Command Center</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg">Forensic Chat</TabsTrigger>
            <TabsTrigger value="vault" className="rounded-lg">Document Vault</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="space-y-8 mt-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <DashboardMetrics
                  deductibleTotal={insuranceData.deductibleTotal}
                  deductibleUsed={insuranceData.deductibleUsed}
                  oopMax={insuranceData.oopMax}
                  oopUsed={insuranceData.oopUsed}
                />
                <PredictiveForecast
                   deductibleTotal={insuranceData.deductibleTotal}
                   deductibleUsed={insuranceData.deductibleUsed}
                   oopMax={insuranceData.oopMax}
                   oopUsed={insuranceData.oopUsed}
                />
                <ShopCareEstimator
                  deductibleRemaining={insuranceData.deductibleTotal - insuranceData.deductibleUsed}
                  oopRemaining={insuranceData.oopMax - insuranceData.oopUsed}
                />
              </div>
              <div className="space-y-8">
                <Card className="border-l-4 border-l-blue-600 shadow-soft">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-blue-600" />
                        Audit Pipeline
                      </div>
                      <Badge variant="outline" className="h-4 text-[8px] font-bold">{auditLogs.length} EVENTS</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4">
                    <div className="space-y-4">
                      {auditLogs.slice(0, 5).map(log => (
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
                          <button
                            onClick={() => openAppeal(log.id)}
                            className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white p-1 rounded hover:bg-blue-700 shadow-sm">
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
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-xs text-amber-600 uppercase">Policy Deviation #8812</p>
                        <Badge className="bg-amber-100 text-amber-700 text-[8px] h-4">BRIDGE-FLG</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Claim CPT mismatch detected against EOC Benefit Schedule. Policy specifies 20% Co-Ins; Bill reflects 40%.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-[9px] font-bold border-amber-500/20 text-amber-600"
                        onClick={() => openAppeal()}>
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
        <div className="relative h-10 w-full bg-muted/20 border rounded-full overflow-hidden flex items-center px-4 gap-4 print-hide">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 shrink-0">
             <Activity className="h-3 w-3" /> LIVE AUDIT TICKER:
           </div>
           <div className="flex-1 overflow-hidden relative h-full flex items-center">
             <div className="flex gap-12 animate-marquee whitespace-nowrap text-[10px] font-mono text-muted-foreground uppercase absolute">
                <span>[PREDICTIVE V2.2]: OOP MAX THRESHOLD PROJECTED FOR OCTOBER</span>
                <span>[BRIDGE]: EOC-BILL CONTRADICTION DETECTED IN CLAIM #9921-B</span>
                <span>[SCRUBBER]: ZERO-KNOWLEDGE HMAC VALIDATED</span>
                <span>[SYSTEM]: DISTRIBUTED AUDIT BRIDGE OPERATIONAL</span>
                <span>[PREDICTIVE V2.2]: OOP MAX THRESHOLD PROJECTED FOR OCTOBER</span>
             </div>
           </div>
           <div className="flex items-center gap-2 shrink-0">
             <CheckCircle2 className="h-3 w-3 text-emerald-500" />
             <span className="text-[9px] font-bold text-emerald-600 uppercase">HIPAA V2 VERIFIED</span>
           </div>
        </div>
      </div>
      <VobChecklist
        isOpen={isVobOpen}
        onClose={() => setIsVobOpen(false)}
        insuranceInfo={{ policyId: "LEG-99238421", groupNumber: "GRP-NAV-01" }}
      />
      <AppealGenerator />
    </AppLayout>
  );
}