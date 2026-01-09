import React, { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardMetrics } from '@/components/dashboard-metrics';
import { ChatInterface } from '@/components/chat-interface';
import { DocumentVault } from '@/components/document-vault';
import { VobChecklist } from '@/components/vob-checklist';
import { ShopCareEstimator } from '@/components/shop-care-estimator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, History, AlertTriangle, Activity, Lock, CheckCircle2, Search } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
export function HomePage() {
  const activeTab = useAppStore(s => s.activeTab);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const isVobOpen = useAppStore(s => s.isVobOpen);
  const setIsVobOpen = useAppStore(s => s.setIsVobOpen);
  const insuranceData = useAppStore(s => s.insuranceState);
  const documents = useAppStore(s => s.documents);
  const auditLogs = useAppStore(s => s.auditLogs);
  const lastSync = useAppStore(s => s.lastSync);
  const syncData = useAppStore(s => s.syncData);
  useEffect(() => {
    syncData();
    const interval = setInterval(syncData, 30000);
    return () => clearInterval(interval);
  }, [syncData]);
  return (
    <AppLayout container>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                COMMAND CENTER
              </h1>
              <Badge variant="outline" className="h-6 border-blue-500/30 text-blue-600 bg-blue-500/5 font-mono text-[10px] font-bold uppercase">
                v2.0 Forensic Alpha
              </Badge>
            </div>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Lock className="h-3 w-3 text-emerald-500" />
              Strategic Health Advocacy & Forensic Bill Auditing
            </p>
          </div>
          <div className="flex items-center gap-6">
             <div className="text-right">
               <div className="flex items-center gap-2 justify-end mb-1">
                 <ShieldCheck className="h-4 w-4 text-emerald-500" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">NSA MONITOR ACTIVE</span>
               </div>
               <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
                 LAST SYNC: {new Date(lastSync).toLocaleTimeString()}
               </p>
             </div>
             <div className="h-10 w-10 rounded-full border-2 border-emerald-500/20 flex items-center justify-center bg-emerald-500/5">
                <Activity className="h-5 w-5 text-emerald-500 animate-pulse" />
             </div>
          </div>
        </header>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:w-[600px] h-12 bg-muted/30 p-1 rounded-xl">
            <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Command Center</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Forensic Chat</TabsTrigger>
            <TabsTrigger value="vault" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Document Vault</TabsTrigger>
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
                      {auditLogs.slice(0, 4).map(log => (
                        <div key={log.id} className="group p-3 hover:bg-muted/30 rounded-lg border border-transparent hover:border-border transition-all space-y-1">
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
                        </div>
                      ))}
                      {auditLogs.length === 0 && (
                        <div className="text-center py-8">
                           <Search className="h-8 w-8 text-muted/30 mx-auto mb-2" />
                           <p className="text-[10px] italic text-muted-foreground">Initializing forensic trail...</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500 shadow-soft bg-amber-500/[0.02]">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Discrepancy Tracker
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4">
                    <div className="p-4 border border-amber-500/20 rounded-xl bg-card shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-xs text-amber-600">UNBUNDLING FLAG #7214</p>
                        <Badge className="bg-amber-100 text-amber-700 text-[8px] h-4">IN REVIEW</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Claim used component codes for MRI Lumbar that should be bundled. Potential ROI: <span className="text-emerald-600 font-bold">$185.00</span>
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-bold">
                          <span>RESOLUTION PROGRESS</span>
                          <span>45%</span>
                        </div>
                        <Progress value={45} className="h-1 bg-amber-100 dark:bg-amber-950/20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="chat" className="min-h-[700px] border rounded-2xl bg-card shadow-glass overflow-hidden mt-0 focus-visible:outline-none">
            <ChatInterface activeDocuments={documents} />
          </TabsContent>
          <TabsContent value="vault" className="mt-0 focus-visible:outline-none">
            <DocumentVault documents={documents} onRefresh={syncData} insuranceState={insuranceData} />
          </TabsContent>
        </Tabs>
        <div className="relative h-10 w-full bg-muted/20 border rounded-full overflow-hidden flex items-center px-4 gap-4">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 shrink-0">
             <Activity className="h-3 w-3" /> LIVE AUDIT TICKER:
           </div>
           <div className="flex-1 overflow-hidden relative h-full flex items-center">
             <div className="flex gap-12 animate-marquee whitespace-nowrap text-[10px] font-mono text-muted-foreground uppercase absolute">
                <span>[CLAIM #9921-A]: VERIFIED - NO UNBUNDLING DETECTED</span>
                <span>[CLAIM #9921-B]: NSA FLAG TRIPPED - BALANCE BILLING DETECTED</span>
                <span>[VAULT]: SBC DOCUMENT #291 PARSED SUCCESSFULLY</span>
                <span>[SYSTEM]: PII SCRUB V2.1 DEPLOYED - 0 LEAKS DETECTED</span>
                <span>[NETWORK]: ST. JUDE MEMORIAL VERIFIED IN-NETWORK TIER 1</span>
                {/* Duplicate for seamless looping if needed by marquee logic */}
                <span>[CLAIM #9921-A]: VERIFIED - NO UNBUNDLING DETECTED</span>
                <span>[CLAIM #9921-B]: NSA FLAG TRIPPED - BALANCE BILLING DETECTED</span>
             </div>
           </div>
           <div className="flex items-center gap-2 shrink-0">
             <CheckCircle2 className="h-3 w-3 text-emerald-500" />
             <span className="text-[9px] font-bold text-emerald-600 uppercase">HIPAA-COMPLIANT</span>
           </div>
        </div>
        <footer className="pt-12 border-t text-center space-y-4">
          <div className="flex items-center justify-center gap-8">
             <span className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground grayscale hover:grayscale-0 transition-all cursor-default uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4 text-blue-600" /> PII-SCRUB V2.0
             </span>
             <span className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground grayscale hover:grayscale-0 transition-all cursor-default uppercase tracking-widest">
                <Lock className="h-4 w-4 text-blue-600" /> SOC2 COMPLIANT (SIM)
             </span>
             <span className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground grayscale hover:grayscale-0 transition-all cursor-default uppercase tracking-widest">
                <Activity className="h-4 w-4 text-blue-600" /> ISO 27001 ACTIVE
             </span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
            LEGACY NAVIGATOR UTILIZES FORENSIC LLM LOGIC. NOT LEGAL OR LICENSED FINANCIAL ADVICE. ALL CALCULATIONS ARE ESTIMATES.
          </p>
        </footer>
      </div>
      <VobChecklist
        isOpen={isVobOpen}
        onClose={() => setIsVobOpen(false)}
        insuranceInfo={{ policyId: "LEG-99238421", groupNumber: "GRP-NAV-01" }}
      />
    </AppLayout>
  );
}