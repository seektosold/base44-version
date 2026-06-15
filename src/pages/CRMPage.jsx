import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AutomodeBadge from '@/components/ui/AutomodeBadge';
import {
  Users, Bot, Zap, Mail, MessageSquare, Upload, Search, Filter,
  Plus, Star, TrendingUp, Phone, Clock, ArrowRight, CheckCircle2,
  AlertCircle, Sparkles, UserCheck, RefreshCw, Send, BarChart3,
  FileText, Settings, ExternalLink, ChevronRight
} from 'lucide-react';
import { useUser } from '@/lib/userContext';
import { toast } from 'sonner';

// ── Sample CRM contacts ───────────────────────────────────────────────────────
const SAMPLE_CONTACTS = [
  {
    id: 'c1', name: 'Sandra & Roy Papadopoulos', email: 'sroy@email.com', phone: '0411 222 333',
    type: 'past_client', subtype: 'sold_with_us',
    last_interaction: '14 months ago', area_of_interest: 'Mosman',
    data_richness: 'high',
    ai_signal: 'Active investor — owns 3 IPs. Area median up 11%. Ready to receive investment brief.',
    suggested_action: 'Send Mosman investment report + off-market alert',
    intent: 78, warmth: 'warm',
    tags: ['investor', 'repeat client', 'Mosman'],
  },
  {
    id: 'c2', name: 'Jake Whitfield', email: 'jake.w@gmail.com', phone: '0422 555 777',
    type: 'prospect', subtype: 'portal_enquiry',
    last_interaction: '2 years ago', area_of_interest: 'Surry Hills',
    data_richness: 'low',
    ai_signal: 'Viewed 1 property 2 years ago. No follow-up since. Cold re-engagement opportunity.',
    suggested_action: 'Check-in: still looking in Surry Hills? Soft touch outreach',
    intent: 22, warmth: 'cold',
    tags: ['cold lead', 'Surry Hills'],
  },
  {
    id: 'c3', name: 'Mei-Ling Tan', email: 'meiling.tan@corp.com', phone: '0433 888 999',
    type: 'buyer', subtype: 'active',
    last_interaction: '3 weeks ago', area_of_interest: 'North Sydney',
    data_richness: 'high',
    ai_signal: 'Pre-approved to $2.1m. Inspected 4 properties. High intent buyer.',
    suggested_action: 'Share new comparable listing + invite to weekend inspection',
    intent: 88, warmth: 'hot',
    tags: ['pre-approved', 'active buyer', 'North Sydney'],
  },
  {
    id: 'c4', name: 'David & Claire Nguyen', email: 'dc.nguyen@outlook.com', phone: '0444 111 222',
    type: 'seller', subtype: 'appraisal_done',
    last_interaction: '6 months ago', area_of_interest: 'Chatswood',
    data_richness: 'medium',
    ai_signal: 'Had appraisal 6 months ago. Market has moved up 6% since. Good time to re-engage.',
    suggested_action: 'Updated market appraisal + current comparable sales',
    intent: 55, warmth: 'warm',
    tags: ['seller', 'appraisal', 'Chatswood'],
  },
  {
    id: 'c5', name: 'Omar Al-Rasheed', email: 'omar.ar@biz.com', phone: '0455 333 444',
    type: 'prospect', subtype: 'referral',
    last_interaction: 'Never', area_of_interest: 'Pyrmont',
    data_richness: 'low',
    ai_signal: 'Referred by past client. No contact yet. First-touch opportunity.',
    suggested_action: 'Warm intro email mentioning the referral source',
    intent: 40, warmth: 'cold',
    tags: ['referral', 'new', 'Pyrmont'],
  },
];

const WARMTH_STYLE = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-blue-100 text-blue-700',
};

const RICHNESS_STYLE = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-red-100 text-red-700',
};

// ── Sub-components ────────────────────────────────────────────────────────────
function SignalCard({ contact, onDraftMessage }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="border card-hover">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {contact.name[0]}
            </div>
            <div>
              <p className="font-semibold text-sm">{contact.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{contact.type?.replace(/_/g, ' ')} · {contact.area_of_interest}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span className={`status-pill text-xs ${WARMTH_STYLE[contact.warmth]}`}>{contact.warmth}</span>
            <span className={`status-pill text-xs ${RICHNESS_STYLE[contact.data_richness]}`}>{contact.data_richness} data</span>
          </div>
        </div>

        {/* AI signal */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 mb-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">{contact.ai_signal}</p>
          </div>
        </div>

        {/* Intent bar */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground w-12">Intent</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${contact.intent >= 70 ? 'bg-green-500' : contact.intent >= 40 ? 'bg-amber-500' : 'bg-blue-400'}`}
              style={{ width: `${contact.intent}%` }}
            />
          </div>
          <span className="text-xs font-semibold">{contact.intent}%</span>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          <span className="font-medium">Suggested: </span>{contact.suggested_action}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {contact.tags.map(t => (
            <span key={t} className="status-pill bg-slate-100 text-slate-600 text-xs">{t}</span>
          ))}
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="h-7 text-xs gap-1 flex-1" onClick={() => onDraftMessage(contact)}>
            <Bot className="w-3 h-3" /> AI Draft
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
            <ExternalLink className="w-3 h-3" /> Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AIDraftPanel({ contact, onClose }) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [channel, setChannel] = useState('email');
  const [tone, setTone] = useState('friendly');

  const generateDraft = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a real estate agent assistant. Draft a short, personalised outreach message for:
Contact: ${contact.name}
Type: ${contact.type}
Area of interest: ${contact.area_of_interest}
Last interaction: ${contact.last_interaction}
AI signal: ${contact.ai_signal}
Suggested action: ${contact.suggested_action}
Channel: ${channel}
Tone: ${tone}

Write a ${channel === 'sms' ? 'brief SMS (under 160 chars)' : 'concise email'} in a ${tone} tone. Do not include subject line. Just the message body.`
      });
      setDraft(result);
    } catch (e) {
      toast.error('Failed to generate draft');
    }
    setLoading(false);
  };

  useEffect(() => { generateDraft(); }, []);

  return (
    <Card className="border-primary border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-500" /> AI Draft — {contact.name}
          </CardTitle>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={generateDraft} disabled={loading}>
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {loading ? (
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
        ) : (
          <Textarea value={draft} onChange={e => setDraft(e.target.value)} className="text-sm min-h-[100px]" />
        )}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 h-8 text-xs gap-1">
            <Send className="w-3 h-3" /> Queue for Approval
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
            <CheckCircle2 className="w-3 h-3" /> Send Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ImportPanel() {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="p-6 text-center space-y-3">
        <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="font-semibold text-sm">Import Your Database</p>
        <p className="text-xs text-muted-foreground">Upload a CSV or Excel file with your existing contacts. The AI will score each contact and suggest outreach actions.</p>
        <Button variant="outline" className="gap-2"><Upload className="w-4 h-4" /> Upload CSV / Excel</Button>
        <p className="text-xs text-muted-foreground">Supported columns: Name, Email, Phone, Suburb, Type, Notes, Last Contacted</p>
      </CardContent>
    </Card>
  );
}

function OnboardingInvitePanel() {
  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-green-600" /> Re-Qualify via Seek to Sold Onboarding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Invite leads to create their own Seek to Sold account. They'll go through a personalised onboarding flow that re-qualifies their intent, budget, and timeline — giving you richer data to work with.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Enter email or select from list…" className="h-8 text-xs flex-1" />
          <Button size="sm" className="h-8 text-xs gap-1 flex-shrink-0">
            <Send className="w-3 h-3" /> Send Invite
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          <span>Invite link auto-personalised based on CRM data</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          <span>Onboarding completion synced back to your CRM</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          <span>AI re-scores intent and warmth after onboarding</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CRMPage() {
  const { userRole, currentUser } = useUser();
  const [contacts, setContacts] = useState(SAMPLE_CONTACTS);
  const [search, setSearch] = useState('');
  const [warmthFilter, setWarmthFilter] = useState('all');
  const [draftingFor, setDraftingFor] = useState(null);
  const [tab, setTab] = useState('signals');
  const [autoMode, setAutoMode] = useState('hybrid');

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.area_of_interest.toLowerCase().includes(search.toLowerCase());
    const matchWarmth = warmthFilter === 'all' || c.warmth === warmthFilter;
    return matchSearch && matchWarmth;
  });

  const stats = {
    hot: contacts.filter(c => c.warmth === 'hot').length,
    warm: contacts.filter(c => c.warmth === 'warm').length,
    cold: contacts.filter(c => c.warmth === 'cold').length,
    total: contacts.length,
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" /> CRM — Client Relationship Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Import your database, let AI identify signals, re-engage leads with personalised outreach
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-sm"><Upload className="w-4 h-4" /> Import Database</Button>
          <Button className="gap-2 text-sm"><Plus className="w-4 h-4" /> Add Contact</Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Contacts', value: stats.total, color: 'bg-slate-500', icon: Users },
          { label: 'Hot Leads', value: stats.hot, color: 'bg-red-500', icon: Star },
          { label: 'Warm', value: stats.warm, color: 'bg-amber-500', icon: TrendingUp },
          { label: 'Cold / Dormant', value: stats.cold, color: 'bg-blue-400', icon: Clock },
        ].map(s => (
          <div key={s.label} className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="signals">AI Signal Queue</TabsTrigger>
          <TabsTrigger value="all">All Contacts</TabsTrigger>
          <TabsTrigger value="pipeline">Follow-up Pipeline</TabsTrigger>
          <TabsTrigger value="invite">Re-Qualify & Invite</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        {/* AI SIGNAL QUEUE */}
        <TabsContent value="signals" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Search contacts…" className="pl-8 h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={warmthFilter} onValueChange={setWarmthFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="All warmth" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {draftingFor && (
            <AIDraftPanel contact={draftingFor} onClose={() => setDraftingFor(null)} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(c => (
              <SignalCard key={c.id} contact={c} onDraftMessage={setDraftingFor} />
            ))}
          </div>
        </TabsContent>

        {/* ALL CONTACTS */}
        <TabsContent value="all" className="space-y-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search…" className="pl-8 h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Area</th>
                  <th className="py-2 pr-4">Last Contact</th>
                  <th className="py-2 pr-4">Warmth</th>
                  <th className="py-2 pr-4">Intent</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b hover:bg-muted/30">
                    <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground capitalize">{c.type?.replace(/_/g,' ')}</td>
                    <td className="py-2.5 pr-4 text-xs">{c.area_of_interest}</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{c.last_interaction}</td>
                    <td className="py-2.5 pr-4"><span className={`status-pill text-xs ${WARMTH_STYLE[c.warmth]}`}>{c.warmth}</span></td>
                    <td className="py-2.5 pr-4 text-xs font-semibold">{c.intent}%</td>
                    <td className="py-2.5">
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { setDraftingFor(c); setTab('signals'); }}>
                        <Bot className="w-3 h-3 mr-1" /> AI Draft
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* FOLLOW-UP PIPELINE */}
        <TabsContent value="pipeline" className="space-y-4">
          <p className="text-sm text-muted-foreground">Leads grouped by stage in the re-engagement follow-up pipeline</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Initial Outreach', color: 'border-blue-200 bg-blue-50/40', contacts: contacts.filter(c => c.warmth === 'cold') },
              { label: 'Engaged / Responding', color: 'border-amber-200 bg-amber-50/40', contacts: contacts.filter(c => c.warmth === 'warm') },
              { label: 'High Intent / Active', color: 'border-green-200 bg-green-50/40', contacts: contacts.filter(c => c.warmth === 'hot') },
            ].map(stage => (
              <div key={stage.label} className={`border rounded-xl p-3 ${stage.color}`}>
                <p className="text-xs font-semibold mb-2 text-muted-foreground">{stage.label} ({stage.contacts.length})</p>
                <div className="space-y-2">
                  {stage.contacts.map(c => (
                    <div key={c.id} className="bg-white rounded-lg p-2.5 border text-xs">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-muted-foreground truncate">{c.suggested_action}</p>
                      <Button size="sm" className="h-6 text-xs mt-1.5 gap-1" onClick={() => { setDraftingFor(c); setTab('signals'); }}>
                        <Bot className="w-3 h-3" /> Draft
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* RE-QUALIFY & INVITE */}
        <TabsContent value="invite" className="space-y-4">
          <OnboardingInvitePanel />
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Bulk Invite from CRM</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Select contacts to receive a personalised Seek to Sold account invite and onboarding flow</p>
              <div className="space-y-2">
                {contacts.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked={c.warmth !== 'cold'} />
                      <span className="text-sm">{c.name}</span>
                      <span className={`status-pill text-xs ${WARMTH_STYLE[c.warmth]}`}>{c.warmth}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{c.email}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full gap-2"><Send className="w-4 h-4" /> Send Bulk Invitations</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IMPORT */}
        <TabsContent value="import" className="space-y-4">
          <ImportPanel />
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">After Import: AI Processing</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                'Deduplication against existing contacts',
                'Intent & warmth scoring based on historical data',
                'Signal generation for each contact',
                'Suggested outreach action queued for review',
                'Compliance check — opt-out / suppression list',
              ].map(step => (
                <div key={step} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  {step}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUTOMATION */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-500" /> CRM Automation Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <AutomodeBadge mode={autoMode} />
                <Select value={autoMode} onValueChange={setAutoMode}>
                  <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_auto">Full Automation</SelectItem>
                    <SelectItem value="hybrid">Hybrid Mode</SelectItem>
                    <SelectItem value="approval">Approval Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {[
                { label: 'Auto-send initial outreach', description: 'AI sends first-touch messages without approval' },
                { label: 'Auto-send comparable sales', description: 'Send market reports when signal detected' },
                { label: 'Re-qualification invite automation', description: 'Auto-invite cold leads to onboarding' },
                { label: 'Intent re-scoring on engagement', description: 'Update scores when contact opens or replies' },
                { label: 'Follow-up on no reply (7 days)', description: 'Automated nudge after silence' },
              ].map(item => (
                <div key={item.label} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked={autoMode !== 'approval'} />
                </div>
              ))}
              <Button className="w-full gap-2 mt-2"><CheckCircle2 className="w-4 h-4" /> Save CRM Automation Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}