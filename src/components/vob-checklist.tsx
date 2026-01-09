import React from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Copy, Printer, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';
interface VobProps {
  isOpen: boolean;
  onClose: () => void;
  insuranceInfo: {
    policyId: string;
    groupNumber: string;
  };
}
export function VobChecklist({ isOpen, onClose, insuranceInfo }: VobProps) {
  if (!isOpen) return null;
  const copyScript = () => {
    const script = `Hello, my name is [Your Name]. I am calling to verify coverage for a [Procedure Name] with NPI [NPI Number]. My policy ID is ${insuranceInfo.policyId}.
    1. Is this provider In-Network?
    2. Is Pre-Authorization required?
    3. What is my remaining deductible?
    4. Can I have a Reference Number for this call?`;
    navigator.clipboard.writeText(script);
    toast.success("Script copied to clipboard");
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 border-b bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <PhoneCall className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold">Verification of Benefits (VOB)</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Pre-service audit script and checklist.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-blue-500 font-mono text-xs space-y-2">
              <p className="font-bold">CALLER INFO:</p>
              <p>Policy ID: {insuranceInfo.policyId}</p>
              <p>Group #: {insuranceInfo.groupNumber}</p>
            </div>
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">The Script</h3>
              <div className="p-4 border rounded-lg bg-card italic text-sm leading-relaxed">
                "Hello, I'm verifying benefits for a medical procedure. I have policy ID <span className="font-bold">{insuranceInfo.policyId}</span>. Is provider <span className="text-blue-500">[NPI/NAME]</span> currently In-Network for my plan? Does CPT code <span className="text-blue-500">[CODE]</span> require prior authorization?"
              </div>
            </section>
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Checklist</h3>
              {[
                "Confirmed In-Network Status",
                "Verified Pre-Authorization Requirements",
                "Obtained Reference Number",
                "Confirmed Place of Service coverage",
                "Calculated remaining Deductible impact"
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Checkbox id={`step-${i}`} />
                  <Label htmlFor={`step-${i}`} className="text-sm cursor-pointer">{item}</Label>
                </div>
              ))}
            </section>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 border-t flex justify-between gap-3 bg-muted/10">
          <Button variant="ghost" onClick={onClose}>Dismiss</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyScript}>
              <Copy className="mr-2 h-4 w-4" /> Copy Script
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print VOB
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}