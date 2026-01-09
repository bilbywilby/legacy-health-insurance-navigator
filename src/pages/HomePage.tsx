import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardMetrics } from '@/components/dashboard-metrics';
import { ChatInterface } from '@/components/chat-interface';
import { DocumentVault } from '@/components/document-vault';
import { VobChecklist } from '@/components/vob-checklist';
import { ShopCareEstimator } from '@/components/shop-care-estimator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, FileText, Activity, Code2, AlertTriangle, History, ShieldCheck } from 'lucide-react';
import { chatService } from '@/lib/chat';
import { useAppStore } from '@/lib/store';
import type { InsuranceDocument, InsuranceState, AuditEntry } from '../../worker/types';
export function HomePage() {
  const activeTab = useAppStore(s => s.activeTab);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const isVobOpen = useAppStore(s => s.isVobOpen);
  const setIsVobOpen = useAppStore(s => s.setIsVobOpen);
  const [insuranceData, setInsuranceData] = useState<InsuranceState>({
    deductibleTotal: 3000,
    deductibleUsed: 1350,
    oopMax: 6500,
    oopUsed: 2100,
  });
  const [documents, setDocuments] = useState<InsuranceDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [lastSync, setLastSync] = useState<number>(Date.now());
  const fetchState = async () => {
    try {
      const res = await chatService.getMessages();
      if (res.success && res.data) {
        if (res.data.insuranceState) setInsuranceData(res.data.insuranceState);
        if (res.data.documents) setDocuments(res.data.documents);
        if (res.data.auditLogs) setAuditLogs(res.data.auditLogs);
        if (res.data.lastContextSync) setLastSync(res.data.lastContextSync);
      }
    } catch (err) {
      console.error("Failed to fetch state:", err);
    }
  };
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 15000); // Polling for V2 context updates
    return () => clearInterval(interval);
  }, []);
  return (
    <AppLayout container>
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Legacy Health Navigator <span className="text-xs align-top font-mono text-blue-500 px-2 py-1 bg-blue-500/10 rounded">v2.0</span></h1>
            <p className="text-muted-foreground">Forensic Billing Audit & Strategic Financial Advocacy</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">PII Scrubbing: Active</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">Last Sync: {new Date(lastSync).toLocaleTimeString()}</p>
          </div>
        </header>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:w-[600px]">
            <TabsTrigger value="dashboard">Command Dashboard</TabsTrigger>
            <TabsTrigger value="chat">Forensic Chat</TabsTrigger>
            <TabsTrigger value="vault">Document Vault</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
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
              <div className="space-y-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <History className="h-4 w-4 text-blue-500" />
                      Policy Audit Trail
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {auditLogs.slice(0, 5).map(log => (
                        <div key={log.id} className="p-2 bg-muted/30 rounded border text-[10px] space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-blue-600 uppercase">{log.event}</span>
                            <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-muted-foreground line-clamp-2">{log.detail}</p>
                        </div>
                      ))}
                      {auditLogs.length === 0 && <p className="text-[10px] italic text-muted-foreground text-center">No recent activity.</p>}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Forensic Discrepancies
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 border rounded bg-amber-50/50 dark:bg-amber-950/20 text-xs">
                      <p className="font-bold text-amber-700 dark:text-amber-500">Unbundling Flagged</p>
                      <p className="text-muted-foreground mt-1">Claim 72141 uses component codes that should be bundled.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="chat" className="min-h-[600px] border rounded-xl bg-card overflow-hidden">
            <ChatInterface activeDocuments={documents} />
          </TabsContent>
          <TabsContent value="vault">
            <DocumentVault documents={documents} onRefresh={fetchState} insuranceState={insuranceData} />
          </TabsContent>
        </Tabs>
        <VobChecklist
          isOpen={isVobOpen}
          onClose={() => setIsVobOpen(false)}
          insuranceInfo={{ policyId: "LEG-99238421", groupNumber: "GRP-NAV-01" }}
        />
        <footer className="pt-8 border-t text-center text-[10px] text-muted-foreground space-y-2 uppercase tracking-tight">
          <p>Legacy Navigator utilizes Forensic LLM logic. Not legal or licensed financial advice.</p>
          <div className="flex items-center justify-center gap-4">
             <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-blue-500" /> HIPAA-ISO ACTIVE</span>
             <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-blue-500" /> PII-SCRUB V2 ACTIVE</span>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}