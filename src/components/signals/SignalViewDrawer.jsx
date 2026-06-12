import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet';
import {
  Mail, MessageSquare, RefreshCw, Send, Zap, Phone,
  CheckCircle2, Sparkles, ChevronRight, User, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TONES = [
  {
    id: 'direct',
    label: 'Direct',
    description: 'Clear, no fluff',
    color: 'bg-slate-800 text-white border-slate-800',
    inactive: 'border-slate-200 text-slate-700 hover:border-slate-400'
  },
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Upbeat & casual',
    color: 'bg-blue-500 text-white border-blue-500',
    inactive: 'border-slate-200 text-slate-700 hover:border-blue-300'
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Formal & polished',
    color: 'bg-indigo-600 text-white border-indigo-600',
    inactive: 'border-slate-200 text-slate-700 hover:border-indigo-300'
  },
  {
    id: 'warm',
    label: 'Warm',
    description: 'Personal & caring',
    color: 'bg-amber-500 text-white border-amber-500',
    inactive: 'border-slate-200 text-slate-700 hover:border-amber-300'
  }
];

function suggestTone(signal) {
  // Suggest tone based on signal type and urgency
  if (signal?.signal_type === 'relationship_milestone') return 'warm';
  if (signal?.signal_type === 'emergency_maintenance') return 'direct';
  if (signal?.signal_type === 'approval_overdue') return 'professional';
  if (signal?.urgency_score >= 8) return 'direct';
  if (signal?.signal_type === 'market_event') return 'professional';
  return 'friendly';
}

export default function SignalViewDrawer({ signal, open, onClose }) {
  const [selectedTone, setSelectedTone] = useState('friendly');
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [generatedMessage, setGeneratedMessage] = useState(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [editedMessage, setEditedMessage] = useState('');

  // On open, set suggested tone and generate message
  useEffect(() => {
    if (open && signal) {
      const suggested = suggestTone(signal);
      setSelectedTone(suggested);
      setGeneratedMessage(null);
      setSent(false);
      setEditedMessage('');
      generateMessage(signal, suggested, 'email');
    }
  }, [open, signal]);

  async function generateMessage(sig, tone, channel) {
    setLoading(true);
    setGeneratedMessage(null);
    setSent(false);
    try {
      const channelLabel = channel === 'sms' ? 'SMS (keep under 160 chars)' : 'email';
      const prompt = `You are an expert real estate agent assistant. Write a ${tone} ${channelLabel} message for the following situation.

Signal: ${sig.title}
Context: ${sig.rationale}
Recommended action: ${sig.recommended_action}
Module: ${sig.module_type}
Tone: ${tone}

${channel === 'email' ? 'Write a professional email with a subject line on the first line (format: Subject: ...) followed by the email body. Keep it concise (3-5 short paragraphs max). Sign off as "Liz | Seek to Sold".' : 'Write a single short SMS message (under 160 characters). No subject line needed. Just the message.'}

Return only the message text, nothing else.`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });

      if (channel === 'email') {
        const lines = result.split('\n');
        const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:'));
        const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, '').trim() : sig.title;
        const body = lines.filter(l => !l.toLowerCase().startsWith('subject:')).join('\n').trim();
        setMessageSubject(subject);
        setGeneratedMessage(body);
        setEditedMessage(body);
      } else {
        setMessageSubject('');
        setGeneratedMessage(result.trim());
        setEditedMessage(result.trim());
      }
    } catch (e) {
      setGeneratedMessage('Unable to generate message. Please try again.');
      setEditedMessage('Unable to generate message. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleToneChange(tone) {
    setSelectedTone(tone);
    generateMessage(signal, tone, selectedChannel);
  }

  function handleChannelChange(channel) {
    setSelectedChannel(channel);
    generateMessage(signal, selectedTone, channel);
  }

  async function handleSend() {
    setLoading(true);
    try {
      await base44.entities.Message.create({
        subject: messageSubject,
        body: editedMessage,
        channel: selectedChannel,
        direction: 'outbound',
        status: 'pending_approval',
        module_type: signal.module_type,
        signal_id: signal.id,
        ai_generated: true,
        from_address: 'seektosold@gmail.com',
        source_rationale: signal.rationale,
        organisation_id: signal.organisation_id,
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  const suggestedTone = suggestTone(signal);

  if (!signal) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-5 text-white">
          <SheetHeader>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium uppercase tracking-wide">Signal</span>
              {signal.urgency_score >= 8 && (
                <span className="text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full border border-red-400/30">Urgent</span>
              )}
            </div>
            <SheetTitle className="text-white text-base leading-snug">{signal.title}</SheetTitle>
            <SheetDescription className="text-white/60 text-xs mt-1 leading-relaxed">
              {signal.rationale}
            </SheetDescription>
          </SheetHeader>

          {/* Confidence */}
          {signal.confidence_level && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/60 mb-1">
                <span>AI Confidence</span>
                <span className="text-white font-medium">{signal.confidence_level}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-400"
                  style={{ width: `${signal.confidence_level}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Recommended action */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Suggested: </span>{signal.recommended_action}
            </p>
          </div>

          {/* Channel selector */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Send via</p>
            <div className="flex gap-2">
              {[
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'sms', label: 'SMS', icon: MessageSquare },
              ].map(ch => {
                const Icon = ch.icon;
                const active = selectedChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleChannelChange(ch.id)}
                    disabled={loading}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all flex-1 justify-center",
                      active
                        ? "bg-slate-900 text-white border-slate-900"
                        : "border-slate-200 text-slate-600 hover:border-slate-400 bg-white"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tone</p>
              {selectedTone === suggestedTone && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <Sparkles className="w-3 h-3" /> AI suggested
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {TONES.map(tone => {
                const active = selectedTone === tone.id;
                return (
                  <button
                    key={tone.id}
                    onClick={() => handleToneChange(tone.id)}
                    disabled={loading}
                    className={cn(
                      "flex flex-col items-center py-2 px-1 rounded-lg border text-center transition-all",
                      active ? tone.color : tone.inactive + ' bg-white'
                    )}
                  >
                    <span className="text-xs font-semibold">{tone.label}</span>
                    <span className={cn("text-[10px] mt-0.5", active ? "opacity-80" : "text-muted-foreground")}>
                      {tone.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generated message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                AI Draft
              </p>
              <button
                onClick={() => generateMessage(signal, selectedTone, selectedChannel)}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40"
              >
                <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                Regenerate
              </button>
            </div>

            <div className="rounded-xl border border-border bg-slate-50 overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                    <span>Crafting your {selectedTone} message…</span>
                  </div>
                  {[80, 100, 65, 90, 55].map((w, i) => (
                    <div key={i} className="h-3 bg-slate-200 rounded animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : sent ? (
                <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <p className="font-semibold text-sm">Queued for approval</p>
                  <p className="text-xs text-muted-foreground">Message added to your approval queue</p>
                </div>
              ) : generatedMessage ? (
                <div className="p-1">
                  {messageSubject && (
                    <div className="px-3 pt-2.5 pb-1.5 border-b border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">Subject</p>
                      <p className="text-sm font-medium text-foreground">{messageSubject}</p>
                    </div>
                  )}
                  <Textarea
                    value={editedMessage}
                    onChange={e => setEditedMessage(e.target.value)}
                    className="border-0 bg-transparent text-sm min-h-[160px] resize-none focus-visible:ring-0 p-3"
                    placeholder="Message will appear here…"
                  />
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Select a tone to generate a message
                </div>
              )}
            </div>

            {/* AI badge */}
            {generatedMessage && !sent && !loading && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1.5">
                <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                AI drafted · Edit freely before sending
              </p>
            )}
          </div>

          {/* Send actions */}
          {generatedMessage && !sent && !loading && (
            <div className="space-y-2 pb-2">
              <Button
                className="w-full bg-slate-900 hover:bg-slate-700 text-white"
                onClick={handleSend}
                disabled={loading}
              >
                <Send className="w-4 h-4 mr-2" />
                {selectedChannel === 'email' ? 'Queue Email for Approval' : 'Queue SMS for Approval'}
              </Button>
              <Button
                variant="outline"
                className="w-full text-sm"
                onClick={onClose}
              >
                Save as Draft
              </Button>
            </div>
          )}

          {sent && (
            <Button variant="outline" className="w-full" onClick={onClose}>
              Done <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}