import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileLock2, ShieldCheck, Plus, Trash2, FileText, AlertCircle } from 'lucide-react';
import { chatService } from '@/lib/chat';
import type { InsuranceDocument, InsuranceDocumentType } from '../../worker/types';
import { toast } from 'sonner';
interface DocumentVaultProps {
  documents: InsuranceDocument[];
  onRefresh: () => void;
}
export function DocumentVault({ documents, onRefresh }: DocumentVaultProps) {
  const [isAdding, setIsAdding] = useState(false);
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
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Add Policy Text
          </Button>
        )}
      </div>
      {isAdding && (
        <Card className="border-blue-500/30 bg-blue-50/5 dark:bg-blue-950/5">
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
                placeholder="Paste key sections here (e.g. 'Covered Services', 'Cost Sharing'...)"
                value={newDoc.content}
                onChange={e => setNewDoc(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">Verify & Store</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {documents.map(doc => (
          <Card key={doc.id} className="group relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px] uppercase font-bold">{doc.type}</Badge>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <CardTitle className="text-base truncate mt-2">{doc.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>Added {new Date(doc.uploadDate).toLocaleDateString()}</span>
              </div>
              <div className="mt-4 p-2 bg-muted/30 rounded text-[10px] text-muted-foreground line-clamp-3 font-mono">
                {doc.content}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Context Active</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {documents.length === 0 && !isAdding && (
          <Card className="col-span-full border-dashed p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-blue-500" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Vault is Empty</p>
              <p className="text-sm text-muted-foreground">Add policy documents to enable Data Primacy audits.</p>
            </div>
            <Button variant="outline" onClick={() => setIsAdding(true)}>Begin Registration</Button>
          </Card>
        )}
      </div>
    </div>
  );
}