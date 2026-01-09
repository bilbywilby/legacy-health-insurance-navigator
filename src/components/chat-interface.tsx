import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Info, FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { chatService } from '@/lib/chat';
import type { Message } from '../../worker/types';
export function ChatInterface() {
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
    // Pre-optimistic update would require creating a Message object locally
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
  return (
    <div className="flex flex-col h-[700px]">
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-blue-500" />
          <span className="font-semibold text-sm">Forensic Audit Session</span>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
          Plan Context Active
        </Badge>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.length === 0 && !loading && (
            <div className="text-center py-12 space-y-4">
              <Bot className="h-12 w-12 mx-auto text-blue-200" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Legacy Health Insurance Navigator</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Paste a medical bill, describe a service you're planning, or ask a question about your coverage.
                </p>
              </div>
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4",
                  m.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
                  m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-blue-600 text-white"
                )}>
                  {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl max-w-[85%] text-sm shadow-sm",
                  m.role === 'user' 
                    ? "bg-muted rounded-tr-none" 
                    : "bg-background border rounded-tl-none"
                )}>
                  <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap font-sans">
                    {m.content}
                  </div>
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex flex-col gap-2">
                      {m.toolCalls.map((tc, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-blue-500 font-mono">
                          <Info className="h-3 w-3" />
                          <span>CONSULTING_TOOL: {tc.name}</span>
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
                <div className="p-4 rounded-2xl bg-background border rounded-tl-none max-w-[85%] text-sm shadow-sm">
                  <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
                    {streamingContent}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {loading && !streamingContent && (
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-blue-600 text-white animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-4 bg-muted/50 rounded-2xl animate-pulse flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium text-muted-foreground">Navigator is reviewing forensics...</span>
              </div>
            </div>
          )}
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
            placeholder="Describe your billing issue or paste an EOC excerpt..."
            className="min-h-[100px] resize-none pr-12 focus-visible:ring-blue-500 bg-muted/20"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || loading}
            size="icon"
            className="absolute right-2 bottom-2 rounded-full h-8 w-8 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          Shift + Enter for new line. Legacy Navigator preserves your conversation state automatically.
        </p>
      </div>
    </div>
  );
}