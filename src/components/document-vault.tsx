import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileLock2, ShieldCheck, Plus, Trash2, FileText, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { chatService } from '@/lib/chat';
import { scrubService } from '@/lib/scrubber';
import type { InsuranceDocument, InsuranceDocumentType, InsuranceState } from '../../worker/types';
import { toast } from 'sonner';
import { VaultTemplates } from './vault-templates';
interface DocumentVaultProps {
  documents: InsuranceDocument[];
  onRefresh: () => void;
  insuranceState?: InsuranceState;
}
export function DocumentVault({ documents, onRefresh, insuranceState }: DocumentVaultProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubInput, setScrubInput] = useState('');
  const [scrubResult, setScrubResult] = useState<{ text: string; map: Record<string, string>; conf: number } | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [newDoc, setNewDoc] = useState({
    title: '',
    type: 'EOC' as InsuranceDocumentType,
    content: ''
  });
  const handleAdd = async () => {
    if (!newDoc.title || !newDoc.content) {
      toast.error('Title and content are required');
      return;
    }
    const res = await chatService.addDocument({
      id: crypto.randomUUID(),
      title: newDoc.title,
      type: newDoc.type,
      content: newDoc.content
    });
    if (res.success) {
      toast.success('Document added to Vault context');
      setNewDoc({ title: '', type: 'EOC', content: '' });
      setIsAdding(false);
      onRefresh();
    } else {
      toast.error('Failed to upload document');
    }
  };
  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const res = await chatService.deleteDocument(id);
      if (res.success) {
        toast.success('Document removed from context');
        onRefresh();
      } else {
        toast.error('Failed to delete document');
      }
    } catch (err) {
      toast.error('Error deleting document');
    } finally {
      setIsDeleting(null);
    }
  };
  const handleTemplateAdd = async (template: any) => {
    const res = await chatService.addDocument({
      id: crypto.randomUUID(),
      title: template.title,
      type: template.type,
      content: template.content
    });
    if (res.success) {
      onRefresh();
    } else {
      throw new Error('Upload failed');
    }
  };
  const handleTestScrub = async () => {
    if (!scrubInput.trim()) return;
    setIsScrubbing(true);
    const res = await scrubService.scrubText(scrubInput);
    if (res.success && res.data) {
      setScrubResult({ text: res.data.scrubbedText, map: res.data.tokenMap, conf: res.data.confidence });
      toast.success("De-identification complete");
    } else {
      toast.error("Scrubbing failed");
    }
    setIsScrubbing(false);
  };
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileLock2 className="h-6 w-6 text-blue-500" />
            Document Vault
          </h2>
          <p className="text-muted-foreground">Stored context for Data Primacy auditing</p>
        </div>
        <div className="flex gap-2">
          {!isAdding && (
            <>
              <Button variant="outline" onClick={() => setIsTemplatesOpen(true)} className="border-blue-500/20 text-blue-600 hover:bg-blue-50">
                <Sparkles className="mr-2 h-4 w-4" /> Load Legacy Templates
              </Button>
              <Button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> Add Policy Text
              </Button>
            </>
          )}
        </div>
      </div>
      <VaultTemplates
        isOpen={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        insuranceState={insuranceState}
        onAdd={handleTemplateAdd}
      />
      {isAdding && (
        <Card className="border-blue-500/30 bg-blue-50/5 dark:bg-blue-950/5 animate-scale-in">
          <CardHeader>
            <CardTitle className="text-lg">Register New Insurance Document</CardTitle>
            <CardDescription>Paste the text content from your policy PDF or EOB statement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document Title</label>
                <Input
                  placeholder="e.g. 2024 United PPO EOC"
                  value={newDoc.title}
                  onChange={e => setNewDoc(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                <Select value={newDoc.type} onValueChange={(val: InsuranceDocumentType) => setNewDoc(prev => ({ ...prev, type: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EOC">Evidence of Coverage (EOC)</SelectItem>
                    <SelectItem value="SBC">Summary of Benefits (SBC)</SelectItem>
                    <SelectItem value="EOB">Explanation of Benefits (EOB)</SelectItem>
                    <SelectItem value="FORMULARY">Drug Formulary</SelectItem>
                    <SelectItem value="BILL">Medical Bill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paste Document Content</label>
              <Textarea
                className="min-h-[200px] font-mono text-sm"
                placeholder="Paste key sections here..."
                value={newDoc.content}
                onChange={e => setNewDoc(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 font-bold">Verify & Store</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-soft">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Forensic Scrubber Test-Bed
          </CardTitle>
          <CardDescription className="text-[11px]">Verify zero-knowledge PII de-identification before policy registration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Raw Data Input</label>
              <Textarea 
                placeholder="Paste sample text with SSN, Email, or DOB..." 
                className="h-32 text-xs font-mono"
                value={scrubInput}
                onChange={(e) => setScrubInput(e.target.value)}
              />
              <Button size="sm" onClick={handleTestScrub} disabled={isScrubbing || !scrubInput} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {isScrubbing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Verify & Hash
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Forensic Output</label>
              <div className="h-32 rounded-md border bg-background p-3 overflow-y-auto font-mono text-[10px] whitespace-pre-wrap">
                {scrubResult ? scrubResult.text : <span className="text-muted-foreground italic">Awaiting de-identification...</span>}
              </div>
              {scrubResult && (
                <div className="p-2 bg-emerald-100/50 dark:bg-emerald-950/20 rounded border border-emerald-500/20 flex justify-between items-center">
                  <span className="text-[9px] font-bold text-emerald-700 uppercase">Detection Density Confidence:</span>
                  <Badge variant="outline" className="text-[9px] bg-emerald-500 text-white border-0">{Math.round(scrubResult.conf * 100)}%</Badge>
                </div>
              )}
            </div>
          </div>
          {scrubResult && Object.keys(scrubResult.map).length > 0 && (
            <div className="p-3 bg-muted/30 rounded-lg border text-[9px] font-mono grid grid-cols-2 gap-2">
              {Object.entries(scrubResult.map).map(([hash, type]) => <div key={hash} className="truncate"><span className="text-blue-600 font-bold">{hash}</span>: {type}</div>)}
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {documents.map(doc => (
          <Card key={doc.id} className="group relative border-l-4 border-l-blue-500/50 hover:border-l-blue-500 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">{doc.type}</Badge>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <CardTitle className="text-base truncate mt-2 font-bold">{doc.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-4">
                <FileText className="h-3 w-3" />
                <span>Added {new Date(doc.uploadDate).toLocaleDateString()}</span>
              </div>
              <div className="p-2 bg-muted/30 rounded text-[10px] text-muted-foreground line-clamp-3 font-mono border">
                {doc.content}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-emerald-600 animate-pulse" />
                  Context Active
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(doc.id)}
                  disabled={isDeleting === doc.id}
                >
                  {isDeleting === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {documents.length === 0 && !isAdding && (
          <Card className="col-span-full border-dashed p-12 text-center flex flex-col items-center justify-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold">Your Vault is Empty</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Add policy documents or use a Legacy Template to enable high-fidelity auditing for this session.
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setIsTemplatesOpen(true)} className="border-blue-500/20 text-blue-600">
                <Sparkles className="mr-2 h-4 w-4" /> Use Templates
              </Button>
              <Button onClick={() => setIsAdding(true)} className="bg-blue-600">
                <Plus className="mr-2 h-4 w-4" /> Manual Add
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}