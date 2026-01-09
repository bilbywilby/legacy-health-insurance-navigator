import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardMetrics } from '@/components/dashboard-metrics';
import { ChatInterface } from '@/components/chat-interface';
import { DocumentVault } from '@/components/document-vault';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, FileText, Activity, CreditCard, PlusCircle } from 'lucide-react';
import { chatService } from '@/lib/chat';
import type { InsuranceDocument } from '../../worker/types';
export function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [insuranceData, setInsuranceData] = useState({
    deductibleTotal: 3000,
    deductibleUsed: 1350,
    oopMax: 6500,
    oopUsed: 2100,
  });
  const [documents, setDocuments] = useState<InsuranceDocument[]>([]);
  const fetchState = async () => {
    const res = await chatService.getMessages();
    if (res.success && res.data) {
      if (res.data.insuranceState) setInsuranceData(res.data.insuranceState);
      if (res.data.documents) setDocuments(res.data.documents);
    }
  };
  useEffect(() => {
    fetchState();
  }, []);
  return (
    <AppLayout container onVaultClick={() => setActiveTab('vault')}>
      <div className="space-y-8 animate-fade-in">
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
                  <p className="text-sm text-muted-foreground">High-impact financial strategies based on your current plan usage.</p>
                  <Button variant="outline" className="w-full justify-start text-left" onClick={() => setActiveTab('chat')}>
                    <Activity className="mr-2 h-4 w-4" /> Start Pre-Service Audit
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-left" onClick={() => setActiveTab('chat')}>
                    <FileText className="mr-2 h-4 w-4" /> Dispute Medical Bill
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Alerts</CardTitle>
                  <CardDescription>Forensic scanning results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 text-sm">
                      <div className="mt-0.5 rounded-full bg-amber-100 p-1 dark:bg-amber-900/30 text-amber-600">
                        <PlusCircle className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="font-medium">Potential Unbundling Detected</p>
                        <p className="text-muted-foreground text-xs">Possible coding error in recent provider claim.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Knowledge Base</CardTitle>
                  <CardDescription>Active Insurance Documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {documents.length > 0 ? (
                    documents.slice(0, 2).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between text-xs p-2 border rounded bg-muted/30">
                        <span className="flex items-center gap-2 truncate max-w-[150px]"><FileText className="h-3 w-3" /> {doc.title}</span>
                        <span className="text-emerald-500 font-bold uppercase text-[9px]">Verified</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No active documents for Data Primacy.</p>
                  )}
                  <Button variant="ghost" className="w-full text-blue-500 hover:text-blue-600 text-sm" onClick={() => setActiveTab('vault')}>
                    Manage Vault
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="chat" className="min-h-[600px] border rounded-xl bg-card">
            <ChatInterface activeDocuments={documents} />
          </TabsContent>
          <TabsContent value="vault">
            <DocumentVault documents={documents} onRefresh={fetchState} />
          </TabsContent>
        </Tabs>
        <footer className="pt-8 border-t text-center text-[10px] text-muted-foreground space-y-2 uppercase tracking-tight">
          <p>Legacy Navigator utilizes Forensic LLM logic. Not legal or licensed financial advice.</p>
          <p className="font-medium text-blue-500">HIPAA-GRADE CONTEXTUAL ISOLATION ACTIVE • RATE LIMITS APPLY</p>
        </footer>
      </div>
    </AppLayout>
  );
}