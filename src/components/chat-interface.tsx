import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, FileSearch, ShieldCheck, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { chatService } from '@/lib/chat';
import { ForensicInsight } from './forensic-insight';
import { useAppStore } from '@/lib/store';
import type { Message, InsuranceDocument, ForensicOutput } from '../../worker/types';
interface ChatInterfaceProps {
  activeDocuments?: InsuranceDocument[];
}
export function ChatInterface({ activeDocuments = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForensics, setShowForensics] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const syncData = useAppStore(s => s.syncData);
  useEffect(() => {
    loadMessages();
  }, []);
  useEffect(() => {
    if (scrollRef.current) {
      const timeoutId = setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, loading]);
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
    try {
      const res = await chatService.sendMessage(userMsg);
      if (res.success && res.data) {
        setMessages(res.data.messages);
        // Sync global state in case the AI modified plan status (simulated behavior)
        syncData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const parseMessageContent = (content: string) => {
    const forensicMatch = content.match(/<forensic_data>([\s\S]*?)<\/forensic_data>/m);
    let forensicData: ForensicOutput | null = null;
    if (forensicMatch) {
      try {
        let cleanedJson = forensicMatch[1].trim();
        // Remove markdown code fences if present
        cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        forensicData = JSON.parse(cleanedJson);
      } catch (e) {
        console.warn("Forensic parsing failed, attempting fuzzy recovery.");
        const calcMatch = forensicMatch[1].match(/"liability_calc":\s*([\d.]+)/);
        if (calcMatch) {
            forensicData = {
                liability_calc: parseFloat(calcMatch[1]),
                confidence_score: 0.5,
                code_validation: false,
                strategic_disclaimer: "Partial audit data recovered from malformed payload."
            };
        }
      }
    }
    const cleanContent = content.replace(/<forensic_data>[\s\S]*?<\/forensic_data>/g, '').trim();
    const strategicMatch = cleanContent.match(/Next Strategic Step:([\s\S]*)$/m);
    const mainBody = strategicMatch ? cleanContent.replace(strategicMatch[0], '').trim() : cleanContent;
    const strategicStep = strategicMatch ? strategicMatch[1].trim() : null;
    return { mainBody, strategicStep, forensicData };
  };
  const renderTextContent = (text: string) => {
    return text.split('`').map((part, i) => {
      if (i % 2 === 1) {
        const isMultiline = part.includes('\n');
        return (
          <code
            key={i}
            className={cn(
              "bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded font-mono text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-900/50",
              isMultiline && "block p-4 my-2 overflow-x-auto whitespace-pre"
            )}
          >
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
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[10px] font-bold uppercase tracking-tighter"
            onClick={() => setShowForensics(!showForensics)}
          >
            {showForensics ? <ChevronUp className="mr-1 h-3 w-3" /> : <ChevronDown className="mr-1 h-3 w-3" />}
            Forensics: {showForensics ? 'ON' : 'OFF'}
          </Button>
          <div className="flex gap-2">
            {activeDocuments.length > 0 ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1 flex items-center text-[10px]">
                <ShieldCheck className="h-3 w-3" />
                {activeDocuments.length} Record(s) Locked
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[10px]">
                Generic Audit Mode
              </Badge>
            )}
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-8 max-w-3xl mx-auto py-4">
          {messages.length === 0 && !loading && (
            <div className="text-center py-12 space-y-4">
              <div className="h-16 w-16 bg-blue-50 dark:bg-blue-950/20 rounded-full flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900/50">
                <Bot className="h-8 w-8 text-blue-500" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold tracking-tight">Senior Forensic Auditor Active</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  PII-Scrubbing is active. Upload a bill or EOB for deterministic liability analysis.
                </p>
              </div>
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const { mainBody, strategicStep, forensicData } = parseMessageContent(m.content);
              const isNsa = m.content.toLowerCase().includes('no surprises act') || m.content.toLowerCase().includes('nsa');
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-4", m.role === 'user' ? "flex-row-reverse" : "flex-row")}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                    m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-blue-600 text-white border-blue-700"
                  )}>
                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn("flex flex-col gap-2 max-w-[85%]", m.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "p-4 rounded-2xl text-sm shadow-soft border",
                      m.role === 'user' ? "bg-muted rounded-tr-none" : "bg-card rounded-tl-none border-l-4 border-l-blue-500"
                    )}>
                      <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap font-sans leading-relaxed text-foreground/90">
                        {renderTextContent(mainBody)}
                      </div>
                      {strategicStep && (
                        <div className="mt-4 pt-4 border-t border-dashed border-blue-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-3 w-3 text-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Next Strategic Step</span>
                          </div>
                          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/50 font-medium text-blue-700 dark:text-blue-300">
                            {strategicStep}
                          </div>
                        </div>
                      )}
                    </div>
                    {m.role === 'assistant' && forensicData && showForensics && (
                      <ForensicInsight data={forensicData} isNsaSubject={isNsa} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {loading && (
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center border border-blue-700">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-4 rounded-2xl bg-card border-l-4 border-l-blue-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-xs text-muted-foreground font-medium italic">Forensic engine compiling audit...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} className="h-1" />
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
            placeholder="Auditor query (e.g. 'Review this CPT code for unbundling')..."
            className="min-h-[100px] resize-none pr-12 focus-visible:ring-blue-500 bg-muted/20 border-blue-500/10"
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