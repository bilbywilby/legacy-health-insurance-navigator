import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, ClipboardCopy, Printer, ShieldCheck, Sparkles, Loader2, AlertCircle, FileDown } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { APPEAL_TEMPLATES, getHydratedTemplate } from '@/lib/appeal-templates';
import { scrubService } from '@/lib/scrubber';
import { pdfService } from '@/lib/pdf-service';
import { toast } from 'sonner';
export function AppealGenerator() {
  const isOpen = useAppStore(s => s.isAppealModalOpen);
  const close = useAppStore(s => s.closeAppealGenerator);
  const auditId = useAppStore(s => s.selectedAuditId);
  const auditLogs = useAppStore(s => s.auditLogs);
  const [selectedTemplateId, setSelectedTemplateId] = useState(APPEAL_TEMPLATES[0].id);
  const [hydratedText, setHydratedText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const selectedAudit = auditLogs.find(log => log.id === auditId);
  const forensicData = selectedAudit?.metadata as any;
  useEffect(() => {
    if (isOpen) {
      const text = getHydratedTemplate(selectedTemplateId, {
        cpt: forensicData?.cpt || '99214',
        variance: forensicData?.fmv_variance || 0,
        disputeToken: forensicData?.dispute_token || 'NAV-FORENSIC-001',
        liability: forensicData?.liability_calc || 0
      });
      setHydratedText(text);
    }
  }, [
    isOpen,
    selectedTemplateId,
    auditId,
    forensicData?.cpt,
    forensicData?.fmv_variance,
    forensicData?.dispute_token,
    forensicData?.liability_calc
  ]);
  const handleCopy = () => {
    navigator.clipboard.writeText(hydratedText);
    toast.success("Appeal letter copied to clipboard");
  };
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Final PII check before output
      const scrubRes = await scrubService.scrubText(hydratedText);
      if (scrubRes.success && scrubRes.data) {
        setHydratedText(scrubRes.data.scrubbedText);
        await pdfService.generateAppealPDF('appeal-preview-content', {
          title: `Medical Appeal - ${forensicData?.dispute_token || 'Audit'}`,
          subject: 'Billing Dispute and Forensic Audit Report',
          author: 'Legacy Navigator',
          disputeToken: forensicData?.dispute_token || 'NAV-V2'
        });
        toast.success("Forensic PDF exported successfully");
      }
    } catch (err) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  };
  const handlePrint = async () => {
    setIsPrinting(true);
    const scrubRes = await scrubService.scrubText(hydratedText);
    if (scrubRes.success && scrubRes.data) {
      setHydratedText(scrubRes.data.scrubbedText);
      toast.success("Zero-Knowledge scrub verified. Printing...");
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 500);
    } else {
      setIsPrinting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden shadow-glass border-blue-500/20">
        <DialogHeader className="p-6 border-b bg-blue-50/50 dark:bg-blue-950/20 print-hide">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <DialogTitle className="text-xl font-bold">Strategic Dispute Engine</DialogTitle>
          </div>
          <DialogDescription className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
            Generate Forensic-Grade Patient Advocacy Documentation
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-1 min-h-0 overflow-hidden bg-background">
          <div className="w-1/3 border-r p-4 space-y-3 bg-muted/20 overflow-y-auto print-hide">
            <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter mb-2">Select Logic Pattern</h3>
            {APPEAL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${
                  selectedTemplateId === t.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-card hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className={`h-4 w-4 ${selectedTemplateId === t.id ? 'text-white' : 'text-blue-500'}`} />
                  <span className="text-xs font-bold truncate">{t.name}</span>
                </div>
                <p className={`text-[9px] line-clamp-2 ${selectedTemplateId === t.id ? 'text-blue-100' : 'text-muted-foreground'}`}>
                  {t.description}
                </p>
              </button>
            ))}
            <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase">Data Primacy</span>
              </div>
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                All templates automatically integrate <span className="text-blue-600 font-bold">ERISA Sec. 502</span> and <span className="text-blue-600 font-bold">NSA</span> legal citations.
              </p>
            </div>
          </div>
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
            <div className="p-4 border-b flex items-center justify-between bg-muted/5 print-hide">
              <Badge variant="outline" className="font-mono text-[10px] font-bold text-emerald-600 border-emerald-500/20 bg-emerald-500/5">
                <ShieldCheck className="h-3 w-3 mr-1" /> FORENSIC VERIFIED
              </Badge>
              <Button variant="ghost" size="sm" className="h-8 text-[10px]" onClick={handleCopy}>
                <ClipboardCopy className="mr-2 h-3.5 w-3.5" /> Copy Text
              </Button>
            </div>
            <ScrollArea className="flex-1 p-8 md:p-12">
              <div id="appeal-preview-content" className="max-w-2xl mx-auto space-y-8 font-serif text-slate-900 dark:text-slate-100 print-only">
                <div className="hidden print:flex items-center justify-between border-b-2 border-blue-600 pb-4 mb-8">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-8 w-8 text-blue-600" />
                    <div className="flex flex-col">
                      <span className="font-bold text-xl tracking-tight">LEGACY NAVIGATOR</span>
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Strategic Audit Report</span>
                    </div>
                  </div>
                  <div className="text-right text-[10px] font-mono text-muted-foreground">
                    REPORT-ID: {forensicData?.dispute_token || 'N/A'}<br />
                    SYNC-DATE: {new Date().toISOString()}
                  </div>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-base font-sans prose prose-slate max-w-none">
                  {hydratedText}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter className="p-4 border-t bg-muted/10 print-hide">
          <div className="flex items-center gap-4 text-muted-foreground mr-auto">
             <AlertCircle className="h-4 w-4 text-blue-500" />
             <span className="text-[10px] font-medium italic">Scrubbing applied before export.</span>
          </div>
          <Button variant="ghost" onClick={close} className="h-9 px-6 font-bold text-xs">Discard</Button>
          <div className="flex gap-2">
            <Button
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs uppercase"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <FileDown className="h-3 w-3 mr-2" />}
              Export PDF
            </Button>
            <Button
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 font-bold text-xs uppercase shadow-glow"
              onClick={handlePrint}
              disabled={isPrinting}
            >
              {isPrinting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Printer className="h-3 w-3 mr-2" />}
              Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}