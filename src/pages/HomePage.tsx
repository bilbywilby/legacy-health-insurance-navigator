import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardMetrics } from '@/components/dashboard-metrics';
import { ChatInterface } from '@/components/chat-interface';
import { DocumentVault } from '@/components/document-vault';
import { VobChecklist } from '@/components/vob-checklist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, FileText, Activity, Code2, AlertTriangle } from 'lucide-react';
import { chatService } from '@/lib/chat';
import { useAppStore } from '@/lib/store';
import type { InsuranceDocument, InsuranceState } from '../../worker/types';
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
  const fetchState = async () => {
    try {
      const res = await chatService.getMessages();
      if (res.success && res.data) {
        if (res.data.insuranceState) setInsuranceData(res.data.insuranceState);
        if (res.data.documents) setDocuments(res.data.documents);
      }
    } catch (err) {
      console.error("Failed to fetch state:", err);
    }
  };
  useEffect(() => {
    fetchState();
  }, []);
  return (
    <AppLayout container>
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Legacy Health Navigator</h1>
            <p className="text-muted-foreground">Forensic Billing Audit & Strategic Financial Advocacy</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audit Mode: Active</span>
          </div>
        </header>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:w-[600px]">
            <TabsTrigger value="dashboard">Command Dashboard</TabsTrigger>
            <TabsTrigger value="chat">Forensic Chat</TabsTrigger>
            <TabsTrigger value="vault">Document Vault</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardMetrics
              deductibleTotal={insuranceData.deductibleTotal}
              deductibleUsed={insuranceData.deductibleUsed}
              oopMax={insuranceData.oopMax}
              oopUsed={insuranceData.oopUsed}
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/10">
                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                  <ShieldAlert className="h-6 w-6 text-blue-500" />
                  <CardTitle className="text-lg">Priority Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('chat')}>
                    <Code2 className="mr-2 h-4 w-4" /> Coding & CPT Translation
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setIsVobOpen(true)}>
                    <Activity className="mr-2 h-4 w-4" /> Verify Pre-Service Benefit
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" /> Audit Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="p-3 border rounded bg-amber-50/50 dark:bg-amber-900/10">
                      <p className="font-semibold text-amber-700 dark:text-amber-400">Potential Unbundling</p>
                      <p className="text-xs text-muted-foreground">Coding error detected in Recent Provider Claim.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Document Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {documents.length > 0 ? (
                    documents.slice(0, 2).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between text-xs p-2 border rounded bg-muted/30">
                        <span className="flex items-center gap-2 truncate max-w-[150px]"><FileText className="h-3 w-3" /> {doc.title}</span>
                        <span className="text-emerald-500 font-bold uppercase text-[9px]">Loaded</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No policy documents found.</p>
                  )}
                  <Button variant="ghost" className="w-full text-blue-500" onClick={() => setActiveTab('vault')}>Manage Vault</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="chat" className="min-h-[600px] border rounded-xl bg-card">
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
          <p className="font-medium text-blue-500">HIPAA-GRADE CONTEXTUAL ISOLATION ACTIVE • RATE LIMITS APPLY</p>
        </footer>
      </div>
    </AppLayout>
  );
}