import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StatusPill from '@/components/ui/StatusPill';
import {
  MessageSquare, Mail, Phone, Bot, CheckCircle2, AlertTriangle,
  Clock, Plus, Send, Edit, Eye, Ban, Zap, Inbox, ArrowRight,
  Smartphone, Mic, ChevronDown, ChevronRight, Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { useUser } from '@/lib/userContext';

const SMS_PROVIDER_CONNECTED = false; // Will be enabled when SMS keys are configured

function MessageCard({ message, onApprove, onEdit }) {
  const channelIcon = {
    email: <Mail className="w-4 h-4 text-blue-500" />,
    sms: <Smartphone className="w-4 h-4 text-green-500" />,
    whatsapp: <MessageSquare className="w-4 h-4 text-emerald-500" />,
    call_script: <Mic className="w-4 h-4 text-purple-500" />,
  };

  return (
    <Card className="border card-hover">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {channelIcon[message.channel]}
              <span className="text-xs font-medium capitalize">{message.channel?.replace(/_/g,' ')}</span>
              <StatusPill status={message.status} />
              {message.ai_generated && (
                <span className="status-pill bg-purple-100 text-purple-700">
                  <Bot className="w-2.5 h-2.5" /> AI Draft
                </span>
              )}
              {message.channel === 'sms' && !SMS_PROVIDER_CONNECTED && (
                <span className="status-pill bg-orange-100 text-orange-700">Provider Not Connected</span>
              )}
            </div>

            {message.subject && (
              <h3 className="font-semibold text-sm text-foreground">{message.subject}</h3>
            )}
            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{message.body}</p>

            {message.source_rationale && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700 border border-blue-100">
                <span className="font-semibold">Rationale: </span>{message.source_rationale}
              </div>
            )}

            {message.risk_flags?.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                <AlertTriangle className="w-3 h-3" />
                {message.risk_flags.join(' · ')}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {message.status === 'pending_approval' && (
              <>
                <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => onApprove(message)}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onEdit(message)}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
                </Button>
              </>
            )}
            {message.status === 'drafted' && (
              <Button size="sm" className="h-7 text-xs bg-primary" onClick={() => onApprove(message)}>
                <Send className="w-3 h-3 mr-1" /> Send
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MessageStudio({ contacts, onSave }) {
  const { userProfile } = useUser();
  const [channel, setChannel] = useState('email');
  const [contactId, setContactId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');

  const generateDraft = async () => {
    if (!prompt) return;
    setGenerating(true);
    const selectedContact = contacts.find(c => c.id === contactId);
    const contextPrompt = `You are ${userProfile?.full_name || 'Liz'} from Seek to Sold.
Write a professional real estate ${channel === 'call_script' ? 'call script' : channel === 'sms' ? 'SMS (max 160 chars)' : channel} message.
Contact: ${selectedContact?.full_name || 'Client'} (${selectedContact?.contact_type?.replace(/_/g,' ') || 'contact'})
Task: ${prompt}
Tone: ${(userProfile?.tone_preference || ['professional', 'warm']).join(', ')}
Channel: ${channel}

${channel === 'sms' ? 'Keep it SHORT (under 160 characters). Be direct and clear.' : 'Write a complete, natural message.'}

IMPORTANT: Do not include hallucinated market facts. Keep it factual and personalised.

Sign off as: Liz, Seek to Sold, +61 420 311 174`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            body: { type: 'string' },
            rationale: { type: 'string' },
          }
        }
      });
      if (result.subject) setSubject(result.subject);
      if (result.body) setBody(result.body);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (status = 'drafted') => {
    await onSave({
      subject, body, channel,
      contact_id: contactId,
      status,
      ai_generated: true,
      from_address: 'seektosold@gmail.com',
      module_type: 'sales',
    });
    setSubject('');
    setBody('');
    setPrompt('');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Channel</Label>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email"><Mail className="inline w-3.5 h-3.5 mr-2" />Email</SelectItem>
              <SelectItem value="sms">
                <Smartphone className="inline w-3.5 h-3.5 mr-2" />
                SMS {!SMS_PROVIDER_CONNECTED && '(Provider Not Connected)'}
              </SelectItem>
              <SelectItem value="whatsapp"><MessageSquare className="inline w-3.5 h-3.5 mr-2" />WhatsApp Copy</SelectItem>
              <SelectItem value="call_script"><Mic className="inline w-3.5 h-3.5 mr-2" />Call Script</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Contact</Label>
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger><SelectValue placeholder="Select contact..." /></SelectTrigger>
            <SelectContent>
              {contacts.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.full_name} ({c.contact_type})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {channel === 'sms' && !SMS_PROVIDER_CONNECTED && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
          <AlertTriangle className="inline w-4 h-4 mr-2" />
          SMS provider not connected. Drafts will be saved but not sent. Configure in Settings.
        </div>
      )}

      <div>
        <Label>What do you want to say? (AI will draft it)</Label>
        <div className="flex gap-2 mt-1">
          <Input
            placeholder={`e.g., Follow up on inspection, check if they are still interested...`}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateDraft()}
          />
          <Button onClick={generateDraft} disabled={generating || !prompt} variant="outline" className="flex-shrink-0">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Bot className="w-4 h-4 mr-1" /> Generate</>}
          </Button>
        </div>
      </div>

      {channel === 'email' && (
        <div>
          <Label>Subject</Label>
          <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." />
        </div>
      )}

      <div>
        <Label>
          Message {channel === 'sms' && <span className="text-muted-foreground">({body.length}/160)</span>}
        </Label>
        <Textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Message content will appear here..."
          className="min-h-36 resize-none"
          maxLength={channel === 'sms' ? 160 : undefined}
        />
      </div>

      {body && (
        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <Bot className="inline w-3.5 h-3.5 mr-1 text-purple-500" />
          <span className="font-medium text-purple-600">AI Draft</span> — Review before sending. This requires approval.
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => handleSave('drafted')}>Save Draft</Button>
        <Button variant="outline" className="border-amber-300 text-amber-700" onClick={() => handleSave('pending_approval')}>
          Submit for Approval
        </Button>
        {channel !== 'sms' && (
          <Button className="bg-primary" onClick={() => handleSave('queued')} disabled={!body}>
            <Send className="w-4 h-4 mr-2" /> Queue to Send
          </Button>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { userRole } = useUser();
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approval_queue');
  const [showStudio, setShowStudio] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Message.list('-created_date', 50),
      base44.entities.Contact.list('-created_date', 100),
    ]).then(([m, c]) => {
      setMessages(m);
      setContacts(c);
    }).finally(() => setLoading(false));
  }, []);

  async function handleApprove(message) {
    await base44.entities.Message.update(message.id, { status: 'approved', approved_at: new Date().toISOString() });
    setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: 'approved' } : m));
  }

  async function handleSaveMessage(data) {
    const msg = await base44.entities.Message.create(data);
    setMessages(prev => [msg, ...prev]);
    setShowStudio(false);
  }

  const byStatus = (status) => messages.filter(m => m.status === status);
  const pendingApproval = byStatus('pending_approval');
  const drafts = byStatus('drafted');
  const sent = messages.filter(m => ['sent', 'delivered', 'queued', 'scheduled'].includes(m.status));
  const replies = messages.filter(m => m.reply_triage);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground">
            {pendingApproval.length} pending approval · {drafts.length} drafts
          </p>
        </div>
        <Dialog open={showStudio} onOpenChange={setShowStudio}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Bot className="w-4 h-4 mr-2" /> AI Message Studio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-500" /> AI Message Studio
              </DialogTitle>
            </DialogHeader>
            <MessageStudio contacts={contacts} onSave={handleSaveMessage} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="approval_queue">
            Approval Queue
            {pendingApproval.length > 0 && <Badge className="ml-2 bg-amber-500 text-white text-xs">{pendingApproval.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="drafts">Drafts {drafts.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{drafts.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="replies">Replies</TabsTrigger>
        </TabsList>

        <TabsContent value="approval_queue" className="mt-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : pendingApproval.length > 0 ? (
            <div className="space-y-3">
              {pendingApproval.map(msg => (
                <MessageCard key={msg.id} message={msg} onApprove={handleApprove} onEdit={() => {}} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Approval queue is clear</p>
                <p className="text-sm text-muted-foreground mt-1">All messages have been reviewed</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="mt-4">
          {drafts.length > 0 ? (
            <div className="space-y-3">
              {drafts.map(msg => (
                <MessageCard key={msg.id} message={msg} onApprove={handleApprove} onEdit={() => {}} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Edit className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">No drafts</p>
                <Button className="mt-4 bg-primary" onClick={() => setShowStudio(true)}>
                  <Bot className="w-4 h-4 mr-2" /> Create with AI
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-4">
          {sent.length > 0 ? (
            <div className="space-y-3">
              {sent.map(msg => (
                <MessageCard key={msg.id} message={msg} onApprove={handleApprove} onEdit={() => {}} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Send className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">No sent messages</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="replies" className="mt-4">
          {replies.length > 0 ? (
            <div className="space-y-3">
              {replies.map(msg => (
                <Card key={msg.id} className="border card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusPill status={msg.reply_triage} />
                    </div>
                    <p className="text-sm">{msg.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Inbox className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">No replies to triage</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}