import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import StatusPill from '@/components/ui/StatusPill';
import {
  Users, Plus, Search, Filter, Mail, Phone, MessageSquare,
  AlertTriangle, ChevronRight, Edit, Trash2, Eye, UserCheck
} from 'lucide-react';
import { useUser } from '@/lib/userContext';
import { ROLES, getRoleColor } from '@/lib/roles';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const CONTACT_TYPES = ['buyer', 'seller', 'past_client', 'landlord', 'tenant', 'applicant', 'contractor', 'referrer', 'prospect', 'other'];
const MODULE_TYPES = ['sales', 'property_management', 'leasing', 'shared'];

function ContactForm({ contact, onSave, onCancel }) {
  const [form, setForm] = useState(contact || {
    full_name: '', email: '', mobile: '', phone: '',
    contact_type: 'buyer', module_type: 'sales',
    status: 'active', preferred_channel: 'email',
    sms_consent: false, email_consent: true,
    suburb: '', notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Full Name *</Label>
          <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        <div>
          <Label>Mobile</Label>
          <Input value={form.mobile || ''} onChange={e => setForm({...form, mobile: e.target.value})} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
        </div>
        <div>
          <Label>Contact Type *</Label>
          <Select value={form.contact_type} onValueChange={v => setForm({...form, contact_type: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONTACT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Module *</Label>
          <Select value={form.module_type} onValueChange={v => setForm({...form, module_type: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODULE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Suburb</Label>
          <Input value={form.suburb || ''} onChange={e => setForm({...form, suburb: e.target.value})} />
        </div>
        <div>
          <Label>Preferred Channel</Label>
          <Select value={form.preferred_channel || 'email'} onValueChange={v => setForm({...form, preferred_channel: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="any">Any</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <textarea
          className="w-full border border-input rounded-md p-2 text-sm resize-none h-20 bg-background"
          value={form.notes || ''}
          onChange={e => setForm({...form, notes: e.target.value})}
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.sms_consent} onChange={e => setForm({...form, sms_consent: e.target.checked})} />
          SMS Consent
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.email_consent} onChange={e => setForm({...form, email_consent: e.target.checked})} />
          Email Consent
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-primary">Save Contact</Button>
      </div>
    </form>
  );
}

export default function ContactsPage() {
  const { userRole } = useUser();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    setLoading(true);
    const all = await base44.entities.Contact.list('-created_date', 100);
    setContacts(all);
    setLoading(false);
  }

  async function handleSave(data) {
    if (editingContact) {
      await base44.entities.Contact.update(editingContact.id, data);
    } else {
      await base44.entities.Contact.create(data);
    }
    setShowForm(false);
    setEditingContact(null);
    loadContacts();
  }

  async function handleDelete(id) {
    if (confirm('Delete this contact?')) {
      await base44.entities.Contact.delete(id);
      loadContacts();
    }
  }

  const filtered = contacts.filter(c => {
    const matchesSearch = !search ||
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.suburb?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || c.contact_type === filterType;
    return matchesSearch && matchesType;
  });

  const typeColors = {
    buyer: 'bg-blue-100 text-blue-800',
    seller: 'bg-purple-100 text-purple-800',
    past_client: 'bg-green-100 text-green-800',
    landlord: 'bg-amber-100 text-amber-800',
    tenant: 'bg-teal-100 text-teal-800',
    applicant: 'bg-orange-100 text-orange-800',
    contractor: 'bg-gray-100 text-gray-800',
    referrer: 'bg-pink-100 text-pink-800',
    prospect: 'bg-indigo-100 text-indigo-800',
    other: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm text-muted-foreground">{contacts.length} total contacts</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-primary" onClick={() => setEditingContact(null)}>
              <Plus className="w-4 h-4 mr-2" /> Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
            </DialogHeader>
            <ContactForm
              contact={editingContact}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingContact(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44">
            <Filter className="w-3.5 h-3.5 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CONTACT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Contacts grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(contact => (
            <Card key={contact.id} className="card-hover border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {(contact.full_name || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{contact.full_name}</p>
                      {contact.suburb && <p className="text-xs text-muted-foreground">{contact.suburb}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingContact(contact); setShowForm(true); }}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(contact.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`status-pill ${typeColors[contact.contact_type] || 'bg-gray-100 text-gray-700'}`}>
                    {contact.contact_type?.replace(/_/g,' ')}
                  </span>
                  {contact.sms_opted_out && <span className="status-pill bg-orange-100 text-orange-700">SMS Opted Out</span>}
                  {contact.suppressed && <span className="status-pill bg-red-100 text-red-700">Suppressed</span>}
                </div>

                <div className="space-y-1">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" /> {contact.email}
                    </div>
                  )}
                  {contact.mobile && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="w-3 h-3" /> {contact.mobile}
                    </div>
                  )}
                </div>

                {contact.missing_data_flags?.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                    <AlertTriangle className="w-3 h-3" />
                    {contact.missing_data_flags.length} data gap{contact.missing_data_flags.length > 1 ? 's' : ''}
                  </div>
                )}

                {contact.notes && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{contact.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No contacts found</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first contact to get started</p>
            <Button className="mt-4 bg-primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Contact
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}