import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatusPill from '@/components/ui/StatusPill';
import { Calendar, Plus, Clock, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function InspectionForm({ properties, contacts, onSave, onCancel }) {
  const [form, setForm] = useState({
    property_id: '', contact_id: '', inspection_date: '',
    status: 'booked', automation_mode: 'approval',
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <Label>Property *</Label>
        <Select value={form.property_id} onValueChange={v => setForm({...form, property_id: v})}>
          <SelectTrigger><SelectValue placeholder="Select property..." /></SelectTrigger>
          <SelectContent>
            {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.address}, {p.suburb}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Applicant Contact</Label>
        <Select value={form.contact_id} onValueChange={v => setForm({...form, contact_id: v})}>
          <SelectTrigger><SelectValue placeholder="Select contact..." /></SelectTrigger>
          <SelectContent>
            {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Inspection Date & Time *</Label>
        <Input type="datetime-local" value={form.inspection_date} onChange={e => setForm({...form, inspection_date: e.target.value})} required />
      </div>
      <div>
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
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-primary">Book Inspection</Button>
      </div>
    </form>
  );
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState([]);
  const [properties, setProperties] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Inspection.list('-inspection_date', 50),
      base44.entities.Property.filter({ module_type: 'leasing' }),
      base44.entities.Contact.filter({ contact_type: 'applicant' }),
    ]).then(([i, p, c]) => {
      setInspections(i);
      setProperties(p);
      setContacts(c);
    }).finally(() => setLoading(false));
  }, []);

  async function handleSave(data) {
    await base44.entities.Inspection.create(data);
    setShowForm(false);
    const updated = await base44.entities.Inspection.list('-inspection_date', 50);
    setInspections(updated);
  }

  async function handleAction(inspection, action) {
    const updates = {
      confirm: { status: 'confirmed' },
      follow_up: { status: 'follow_up_sent', follow_up_sent: true },
      mark_attended: { status: 'attended', attended: true },
      no_show: { status: 'no_show', attended: false },
    };
    await base44.entities.Inspection.update(inspection.id, updates[action]);
    const updated = await base44.entities.Inspection.list('-inspection_date', 50);
    setInspections(updated);
  }

  const upcoming = inspections.filter(i => ['booked', 'confirmed'].includes(i.status));
  const followUpNeeded = inspections.filter(i => i.status === 'attended' && !i.follow_up_sent);
  const past = inspections.filter(i => ['no_show', 'cancelled', 'application_received'].includes(i.status));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inspections</h1>
          <p className="text-sm text-muted-foreground">{upcoming.length} upcoming · {followUpNeeded.length} follow-ups due</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-primary"><Plus className="w-4 h-4 mr-2" />Book Inspection</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Book Inspection</DialogTitle></DialogHeader>
            <InspectionForm properties={properties} contacts={contacts} onSave={handleSave} onCancel={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {followUpNeeded.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">{followUpNeeded.length} inspection follow-up{followUpNeeded.length > 1 ? 's' : ''} due</p>
            <p className="text-xs text-amber-700">These inspections have been attended but no follow-up has been sent yet.</p>
          </div>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">Send Follow-Ups</Button>
        </div>
      )}

      <div className="space-y-6">
        {[
          { title: 'Upcoming', items: upcoming, icon: Calendar },
          { title: 'Follow-Up Due', items: followUpNeeded, icon: Clock },
          { title: 'Completed / Past', items: past, icon: CheckCircle2 },
        ].map(section => (
          <div key={section.title}>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <section.icon className="w-4 h-4 text-muted-foreground" />{section.title}
              <span className="text-xs text-muted-foreground ml-1">({section.items.length})</span>
            </h2>
            {loading ? (
              <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
            ) : section.items.length > 0 ? (
              <div className="space-y-2">
                {section.items.map(inspection => (
                  <Card key={inspection.id} className="border">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Property ID: ...{inspection.property_id?.slice(-6)}</p>
                        <p className="text-xs text-muted-foreground">
                          {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleString('en-AU') : 'TBD'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={inspection.status} />
                        {inspection.status === 'booked' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAction(inspection, 'confirm')}>
                            Confirm
                          </Button>
                        )}
                        {inspection.status === 'confirmed' && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAction(inspection, 'mark_attended')}>Attended</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => handleAction(inspection, 'no_show')}>No Show</Button>
                          </>
                        )}
                        {inspection.status === 'attended' && !inspection.follow_up_sent && (
                          <Button size="sm" className="h-7 text-xs bg-primary" onClick={() => handleAction(inspection, 'follow_up')}>
                            <Send className="w-3 h-3 mr-1" />Follow Up
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">No {section.title.toLowerCase()} inspections</p>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}