import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, FileSearch, ShieldCheck, SearchCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { chatService } from '@/lib/chat';
import type { Message, InsuranceDocument } from '../../worker/types';
interface ChatInterfaceProps {
  activeDocuments?: InsuranceDocument[];
}
export function ChatInterface({ activeDocuments = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    loadMessages();
  }, []);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);
  const loadMessages = async () => {
    const res = await chatService.getMessages();
    if (res.success && res.data) {
      setMessages(res.data.messages);
    }
  };
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);
    setStreamingContent('');
    try {
      await chatService.sendMessage(userMsg, undefined, (chunk) => {
        setStreamingContent(prev => prev + chunk);
      });
      await loadMessages();
      setStreamingContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const renderContent = (content: string) => {
    return content.split('`').map((part, i) => {
      if (i % 2 === 1) {
        return (
          <code key={i} className="bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded font-mono text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-900/50">
            {part}
          </code>
        );
      }
      return part;
    });
  };
  return (
    <div className="flex flex-col h-[700px] bg-background">
      <div className="p-4 border-b flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-blue-500" />
          <span className="font-semibold text-sm">Forensic Audit Console</span>
        </div>
        <div className="flex gap-2">
          {activeDocuments.length > 0 ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1 flex items-center">
              <ShieldCheck className="h-3 w-3" />
              {activeDocuments.length} Document(s) Loaded
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
              General Knowledge Mode
            </Badge>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.length === 0 && !loading && (
            <div className="text-center py-12 space-y-4">
              <Bot className="h-12 w-12 mx-auto text-blue-200" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Senior Insurance Auditor Initialized</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Provide an EOC, medical bill, or EOB for forensic analysis. Data Primacy is active.
                </p>
              </div>
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-4", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 border", m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-blue-600 text-white")}>
                  {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn("p-4 rounded-2xl max-w-[85%] text-sm shadow-sm", m.role === 'user' ? "bg-muted rounded-tr-none" : "bg-card border rounded-tl-none border-l-4 border-l-blue-500")}>
                  <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap font-sans leading-relaxed">
                    {renderContent(m.content)}
                  </div>
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex flex-col gap-2">
                      {m.toolCalls.map((tc, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] text-blue-500 font-mono font-bold uppercase tracking-wider">
                          <SearchCode className="h-3 w-3" /> Forensic_Module: {tc.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {streamingContent && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-blue-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-4 rounded-2xl bg-card border rounded-tl-none border-l-4 border-l-blue-500 max-w-[85%] text-sm shadow-sm">
                  <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap leading-relaxed">
                    {renderContent(streamingContent)}
                    <span className="inline-block w-1.5 h-4 ml-1 bg-blue-500 animate-pulse align-middle" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background">
        <div className="max-w-3xl mx-auto flex gap-3 relative">
          <Textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => { 
              if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                handleSend(); 
              } 
            }} 
            placeholder="Auditor query (e.g. 'Identify CPT codes for a lumbar MRI')..." 
            className="min-h-[100px] resize-none pr-12 focus-visible:ring-blue-500 bg-muted/20 text-sm" 
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || loading} 
            size="icon" 
            className="absolute right-2 bottom-2 rounded-full h-8 w-8 bg-blue-600 hover:bg-blue-700 shadow-glow"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}