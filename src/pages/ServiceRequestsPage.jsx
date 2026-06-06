import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StatusPill from '@/components/ui/StatusPill';
import AutomodeBadge from '@/components/ui/AutomodeBadge';
import {
  Wrench, Plus, AlertTriangle, ChevronRight, Clock, CheckCircle2,
  User, Building2, FileText, Bot, MessageSquare, ArrowRight, X
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { getUrgencyColor } from '@/lib/roles';

const STATUS_STEPS = [
  'new', 'info_requested', 'quotes_requested', 'quotes_received',
  'landlord_approval_pending', 'approved', 'contractor_booked',
  'scheduled', 'in_progress', 'completion_pending', 'completed'
];

function ServiceRequestDetail({ request, onClose, onUpdate }) {
  const [status, setStatus] = useState(request.status);

  const handleStatusUpdate = async (newStatus) => {
    await base44.entities.ServiceRequest.update(request.id, { status: newStatus });
    setStatus(newStatus);
    onUpdate();
  };

  const stepIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="space-y-5 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg border ${getUrgencyColor(request.urgency)}`}>
          <Wrench className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{request.title}</h3>
          <div className="flex gap-2 mt-1">
            <StatusPill status={status} />
            <span className={`status-pill border ${getUrgencyColor(request.urgency)}`}>{request.urgency}</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Workflow Progress</p>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STATUS_STEPS.map((step, i) => (
            <div
              key={step}
              className={`flex-shrink-0 h-1.5 rounded-full flex-1 min-w-5 cursor-pointer transition-colors ${
                i < stepIndex ? 'bg-green-500' :
                i === stepIndex ? 'bg-primary' : 'bg-muted'
              }`}
              onClick={() => handleStatusUpdate(step)}
              title={step.replace(/_/g,' ')}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{status?.replace(/_/g,' ')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {request.description && (
          <div className="col-span-2">
            <p className="font-medium text-muted-foreground text-xs mb-1">Description</p>
            <p className="text-foreground">{request.description}</p>
          </div>
        )}
        <div>
          <p className="font-medium text-muted-foreground text-xs mb-1">Issue Type</p>
          <p>{request.issue_type?.replace(/_/g,' ')}</p>
        </div>
        <div>
          <p className="font-medium text-muted-foreground text-xs mb-1">Automation Mode</p>
          <AutomodeBadge mode={request.automation_mode || 'approval'} />
        </div>
      </div>

      {/* Quote info */}
      {request.quotes?.length > 0 && (
        <div>
          <p className="font-medium text-xs text-muted-foreground mb-2">Quotes Received</p>
          {request.quotes.map((q, i) => (
            <div key={i} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">{q.contractor_name || `Contractor ${i+1}`}</p>
                <p className="text-xs text-muted-foreground">{q.description}</p>
              </div>
              <p className="font-bold">${q.amount?.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Audit log */}
      {request.audit_log?.length > 0 && (
        <div>
          <p className="font-medium text-xs text-muted-foreground mb-2">Activity Log</p>
          <div className="space-y-2">
            {request.audit_log.map((log, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <div className="w-1 bg-border rounded-full flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{log.action}</p>
                  <p className="text-muted-foreground">{log.by} · {log.at ? new Date(log.at).toLocaleString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status update */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Update Status</p>
        <Select value={status} onValueChange={handleStatusUpdate}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_STEPS.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g,' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={onClose} variant="outline" className="w-full">Close</Button>
    </div>
  );
}

function CreateRequestForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    title: '', description: '', issue_type: 'maintenance',
    urgency: 'routine', automation_mode: 'approval',
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <Label>Title *</Label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="e.g. Water leak in bathroom" />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="h-24 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Issue Type</Label>
          <Select value={form.issue_type} onValueChange={v => setForm({...form, issue_type: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['maintenance','repair','complaint','inspection','emergency','improvement','other'].map(t =>
                <SelectItem key={t} value={t}>{t}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Urgency</Label>
          <Select value={form.urgency} onValueChange={v => setForm({...form, urgency: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Automation Mode</Label>
          <Select value={form.automation_mode} onValueChange={v => setForm({...form, automation_mode: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="approval">Approval Required</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="full_auto">Full Auto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-primary">Create Request</Button>
      </div>
    </form>
  );
}

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    setLoading(true);
    const data = await base44.entities.ServiceRequest.list('-created_date', 50);
    setRequests(data);
    setLoading(false);
  }

  async function handleCreate(data) {
    const req = await base44.entities.ServiceRequest.create({ ...data, status: 'new' });
    setRequests(prev => [req, ...prev]);
    setShowCreate(false);
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter || r.urgency === filter);

  const urgencyFilters = [
    { label: 'All', value: 'all' },
    { label: 'Emergency', value: 'emergency' },
    { label: 'Urgent', value: 'urgent' },
    { label: 'New', value: 'new' },
    { label: 'Awaiting Landlord', value: 'landlord_approval_pending' },
    { label: 'Completed', value: 'completed' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Requests</h1>
          <p className="text-sm text-muted-foreground">{requests.length} total requests</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-primary"><Plus className="w-4 h-4 mr-2" />New Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Service Request</DialogTitle></DialogHeader>
            <CreateRequestForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {urgencyFilters.map(f => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
            className={filter === f.value ? 'bg-primary' : ''}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Requests */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(req => (
            <Card key={req.id} className={`border card-hover cursor-pointer ${req.urgency === 'emergency' ? 'border-red-300' : ''}`}
              onClick={() => setSelectedRequest(req)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <StatusPill status={req.status} />
                      <span className={`status-pill border text-xs ${getUrgencyColor(req.urgency)}`}>{req.urgency}</span>
                      <AutomodeBadge mode={req.automation_mode || 'approval'} size="xs" />
                    </div>
                    <h3 className="font-semibold text-sm">{req.title}</h3>
                    {req.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{req.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{req.issue_type?.replace(/_/g,' ')} · {new Date(req.created_date).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Wrench className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No service requests</p>
            <Button className="mt-4 bg-primary" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />Create Request
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Service Request Detail</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <ServiceRequestDetail
              request={selectedRequest}
              onClose={() => setSelectedRequest(null)}
              onUpdate={loadRequests}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}