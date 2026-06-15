import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import StatusPill from '@/components/ui/StatusPill';
import { Zap, Plus, AlertTriangle, CheckCircle2, Mail, Phone, Search, Bot } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/lib/userContext';
import { ROLES } from '@/lib/roles';

function SignalCard({ signal, onAction }) {
  const urgencyBorder = signal.urgency_score >= 8 ? 'border-red-300 bg-red-50/20' :
    signal.urgency_score >= 5 ? 'border-amber-200 bg-amber-50/20' : '';

  return (
    <Card className={`border card-hover ${urgencyBorder}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <StatusPill status={signal.status || 'new'} />
              {signal.urgency_score >= 8 && <span className="status-pill bg-red-100 text-red-700">Urgent</span>}
              <span className="status-pill bg-gray-100 text-gray-600 capitalize text-xs">{signal.module_type?.replace(/_/g,' ')}</span>
            </div>
            <h3 className="font-semibold text-sm">{signal.title}</h3>
            {signal.rationale && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{signal.rationale}</p>}

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
              {signal.source && <span className="text-muted-foreground">Source: <strong>{signal.source}</strong></span>}
              {signal.confidence_level !== undefined && (
                <span className={`font-medium ${signal.confidence_level >= 70 ? 'text-green-600' : signal.confidence_level >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                  {signal.confidence_level}% confidence
                </span>
              )}
              {signal.recommended_channel && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  {signal.recommended_channel === 'email' ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                  {signal.recommended_channel}
                </span>
              )}
            </div>

            {signal.recommended_action && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800">
                <span className="font-semibold">Action: </span>{signal.recommended_action}
              </div>
            )}
            {signal.risk_flags?.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="w-3 h-3" />{signal.risk_flags.join(' · ')}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <Button size="sm" className="h-7 text-xs bg-primary" onClick={() => onAction(signal, 'action')}>Act</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onAction(signal, 'snooze')}>Snooze</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => onAction(signal, 'dismiss')}>Dismiss</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateSignalForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    title: '', signal_type: '', module_type: 'sales',
    rationale: '', urgency_score: 5, confidence_level: 70,
    recommended_action: '', recommended_channel: 'email',
    source: '', role_visibility: ['owner', 'sales'],
    status: 'new',
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <Label>Signal Title *</Label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Module</Label>
          <Select value={form.module_type} onValueChange={v => setForm({...form, module_type: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="property_management">Property Management</SelectItem>
              <SelectItem value="leasing">Leasing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Urgency (1–10)</Label>
          <Input type="number" min={1} max={10} value={form.urgency_score} onChange={e => setForm({...form, urgency_score: +e.target.value})} />
        </div>
        <div>
          <Label>Confidence (%)</Label>
          <Input type="number" min={0} max={100} value={form.confidence_level} onChange={e => setForm({...form, confidence_level: +e.target.value})} />
        </div>
        <div>
          <Label>Recommended Channel</Label>
          <Select value={form.recommended_channel} onValueChange={v => setForm({...form, recommended_channel: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="any">Any</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Source</Label>
          <Select value={form.source} onValueChange={v => setForm({...form, source: v})}>
            <SelectTrigger><SelectValue placeholder="Select source…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CRM">CRM</SelectItem>
              <SelectItem value="Re-engagement">Re-engagement</SelectItem>
              <SelectItem value="Sales Listing">Sales Listing</SelectItem>
              <SelectItem value="Portal Enquiry">Portal Enquiry</SelectItem>
              <SelectItem value="Market Data">Market Data</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
              <SelectItem value="Property Management">Property Management</SelectItem>
              <SelectItem value="Leasing">Leasing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Signal Type</Label>
          <Input value={form.signal_type} onChange={e => setForm({...form, signal_type: e.target.value})} placeholder="e.g. re_engagement, listing_enquiry" />
        </div>
      </div>
      <div>
        <Label>Rationale</Label>
        <Textarea value={form.rationale} onChange={e => setForm({...form, rationale: e.target.value})} className="h-20 resize-none" />
      </div>
      <div>
        <Label>Recommended Action</Label>
        <Input value={form.recommended_action} onChange={e => setForm({...form, recommended_action: e.target.value})} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-primary">Create Signal</Button>
      </div>
    </form>
  );
}

export default function SignalsPage() {
  const { userRole } = useUser();
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { loadSignals(); }, []);

  async function loadSignals() {
    setLoading(true);
    const data = await base44.entities.Signal.list('-urgency_score', 100);
    // Filter by role
    const roleFiltered = userRole === ROLES.OWNER ? data :
      data.filter(s => {
        if (userRole === ROLES.SALES) return s.module_type === 'sales';
        if (userRole === ROLES.PROPERTY_MANAGER) return s.module_type === 'property_management';
        if (userRole === ROLES.LEASING) return s.module_type === 'leasing';
        return false;
      });
    setSignals(roleFiltered);
    setLoading(false);
  }

  async function handleCreate(data) {
    const s = await base44.entities.Signal.create(data);
    setSignals(prev => [s, ...prev]);
    setShowCreate(false);
  }

  async function handleAction(signal, action) {
    const statusMap = { action: 'in_progress', snooze: 'snoozed', dismiss: 'dismissed' };
    await base44.entities.Signal.update(signal.id, { status: statusMap[action] });
    loadSignals();
  }

  const filtered = signals.filter(s => {
    const matchModule = filterModule === 'all' || s.module_type === filterModule;
    const matchSearch = !search || s.title?.toLowerCase().includes(search.toLowerCase());
    const matchSource = filterSource === 'all' ||
      (filterSource === 'crm' && ['CRM', 'crm', 'Re-engagement', 're_engagement'].includes(s.source)) ||
      (filterSource === 'listings' && ['Sales Listing', 'listing', 'Portal Enquiry'].includes(s.source)) ||
      (filterSource === 'other' && !['CRM', 'crm', 'Re-engagement', 're_engagement', 'Sales Listing', 'listing', 'Portal Enquiry'].includes(s.source));
    return matchModule && matchSearch && matchSource;
  });

  const active = filtered.filter(s => ['new', 'in_progress'].includes(s.status));
  const snoozed = filtered.filter(s => s.status === 'snoozed');
  const done = filtered.filter(s => ['actioned', 'dismissed', 'expired'].includes(s.status));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" /> Signal Engine
          </h1>
          <p className="text-sm text-muted-foreground">{active.length} active signals</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-primary"><Plus className="w-4 h-4 mr-2" />Add Signal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Signal</DialogTitle></DialogHeader>
            <CreateSignalForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search signals..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(userRole === ROLES.OWNER ? ['all', 'sales', 'property_management', 'leasing'] : ['all']).map(m => (
            <Button key={m} variant={filterModule === m ? 'default' : 'outline'} size="sm"
              onClick={() => setFilterModule(m)} className={filterModule === m ? 'bg-primary' : ''}>
              {m === 'all' ? 'All Modules' : m === 'property_management' ? 'PM' : m.charAt(0).toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All Sources' },
            { key: 'crm', label: 'CRM / Re-engagement' },
            { key: 'listings', label: 'Sales Listings' },
            { key: 'other', label: 'Other' },
          ].map(s => (
            <Button key={s.key} variant={filterSource === s.key ? 'secondary' : 'ghost'} size="sm"
              onClick={() => setFilterSource(s.key)} className="text-xs">
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active <Badge variant="secondary" className="ml-2 text-xs">{active.length}</Badge></TabsTrigger>
          <TabsTrigger value="snoozed">Snoozed</TabsTrigger>
          <TabsTrigger value="done">Completed</TabsTrigger>
        </TabsList>
        {[['active', active], ['snoozed', snoozed], ['done', done]].map(([tab, items]) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : items.length > 0 ? (
              <div className="space-y-3">{items.map(s => <SignalCard key={s.id} signal={s} onAction={handleAction} />)}</div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No {tab} signals</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}