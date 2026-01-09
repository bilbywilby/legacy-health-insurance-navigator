import React, { useState } from 'react';
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
import { FileText, ClipboardCopy, PlusCircle, Check } from 'lucide-react';
import { getLegacyTemplates, LegacyTemplate } from '@/lib/templates';
import { toast } from 'sonner';
import type { InsuranceState } from '../../worker/types';
interface VaultTemplatesProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  insuranceState?: InsuranceState;
  onAdd: (template: LegacyTemplate) => Promise<void>;
}
export function VaultTemplates({ isOpen, onOpenChange, insuranceState, onAdd }: VaultTemplatesProps) {
  const templates = getLegacyTemplates(insuranceState);
  const [selectedId, setSelectedId] = useState<string>(templates[0].id);
  const [isAdding, setIsAdding] = useState(false);
  const selectedTemplate = templates.find(t => t.id === selectedId) || templates[0];
  const handleAdd = async () => {
    setIsAdding(true);
    try {
      await onAdd(selectedTemplate);
      toast.success(`${selectedTemplate.title} registered to Vault`);
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to register template');
    } finally {
      setIsAdding(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-blue-500/20 shadow-glass">
        <DialogHeader className="p-6 border-b bg-blue-50/30 dark:bg-blue-950/20">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <PlusCircle className="h-6 w-6 text-blue-600" />
            Legacy Forensic Templates
          </DialogTitle>
          <DialogDescription>
            Bootstrap your insurance context with high-fidelity forensic data structures.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 border-r bg-muted/20 p-4 space-y-2 overflow-y-auto">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${
                  selectedId === t.id 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-background hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className={`h-4 w-4 ${selectedId === t.id ? 'text-white' : 'text-blue-500'}`} />
                  <span className="text-sm font-bold truncate">{t.title}</span>
                </div>
                <p className={`text-[10px] line-clamp-2 ${selectedId === t.id ? 'text-blue-100' : 'text-muted-foreground'}`}>
                  {t.description}
                </p>
              </button>
            ))}
          </div>
          {/* Preview Area */}
          <div className="flex-1 flex flex-col bg-background">
            <div className="p-4 border-b flex items-center justify-between">
              <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-600">
                Type: {selectedTemplate.type}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => {
                navigator.clipboard.writeText(selectedTemplate.content);
                toast.success('Markdown copied to clipboard');
              }}>
                <ClipboardCopy className="mr-2 h-4 w-4" /> Copy
              </Button>
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="font-mono text-sm whitespace-pre-wrap bg-muted/10 p-4 rounded-xl border leading-relaxed">
                {selectedTemplate.content}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter className="p-4 border-t bg-muted/10 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 font-bold" 
            onClick={handleAdd}
            disabled={isAdding}
          >
            {isAdding ? 'Registering...' : 'Add Context to Vault'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}