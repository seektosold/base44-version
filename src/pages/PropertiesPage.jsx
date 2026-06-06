import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatusPill from '@/components/ui/StatusPill';
import { Building2, Plus, Search, Home, Edit, Trash2, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function PropertyForm({ property, onSave, onCancel }) {
  const [form, setForm] = useState(property || { address: '', suburb: '', state: 'NSW', postcode: '', property_type: 'house', module_type: 'sales', status: 'active', bedrooms: 3, bathrooms: 2 });
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div><Label>Address *</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} required /></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2"><Label>Suburb</Label><Input value={form.suburb || ''} onChange={e => setForm({...form, suburb: e.target.value})} /></div>
        <div><Label>State</Label><Input value={form.state || ''} onChange={e => setForm({...form, state: e.target.value})} /></div>
        <div><Label>Postcode</Label><Input value={form.postcode || ''} onChange={e => setForm({...form, postcode: e.target.value})} /></div>
        <div>
          <Label>Type</Label>
          <Select value={form.property_type} onValueChange={v => setForm({...form, property_type: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['house','unit','apartment','townhouse','land','commercial','other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Module</Label>
          <Select value={form.module_type} onValueChange={v => setForm({...form, module_type: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="property_management">Property Management</SelectItem>
              <SelectItem value="leasing">Leasing</SelectItem>
              <SelectItem value="shared">Shared</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Beds</Label><Input type="number" value={form.bedrooms || ''} onChange={e => setForm({...form, bedrooms: +e.target.value})} /></div>
        <div><Label>Baths</Label><Input type="number" value={form.bathrooms || ''} onChange={e => setForm({...form, bathrooms: +e.target.value})} /></div>
        <div><Label>Cars</Label><Input type="number" value={form.car_spaces || ''} onChange={e => setForm({...form, car_spaces: +e.target.value})} /></div>
        <div><Label>Weekly Rent ($)</Label><Input type="number" value={form.weekly_rent || ''} onChange={e => setForm({...form, weekly_rent: +e.target.value})} /></div>
        <div><Label>Asking Price ($)</Label><Input type="number" value={form.asking_price || ''} onChange={e => setForm({...form, asking_price: +e.target.value})} /></div>
      </div>
      <div><Label>Notes</Label><textarea className="w-full border border-input rounded-md p-2 text-sm resize-none h-16 bg-background" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} /></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" className="bg-primary">Save Property</Button></div>
    </form>
  );
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await base44.entities.Property.list('-created_date', 100);
    setProperties(data); setLoading(false);
  }

  async function handleSave(data) {
    if (editing) await base44.entities.Property.update(editing.id, data);
    else await base44.entities.Property.create(data);
    setShowForm(false); setEditing(null); load();
  }

  async function handleDelete(id) {
    if (confirm('Delete this property?')) { await base44.entities.Property.delete(id); load(); }
  }

  const filtered = properties.filter(p => {
    const matchSearch = !search || p.address?.toLowerCase().includes(search.toLowerCase()) || p.suburb?.toLowerCase().includes(search.toLowerCase());
    const matchModule = filterModule === 'all' || p.module_type === filterModule;
    return matchSearch && matchModule;
  });

  const moduleColors = { sales: 'bg-blue-100 text-blue-700', property_management: 'bg-green-100 text-green-700', leasing: 'bg-orange-100 text-orange-700', shared: 'bg-gray-100 text-gray-700' };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Properties</h1><p className="text-sm text-muted-foreground">{properties.length} properties</p></div>
        <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button className="bg-primary" onClick={() => setEditing(null)}><Plus className="w-4 h-4 mr-2" />Add Property</Button></DialogTrigger>
          <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Property</DialogTitle></DialogHeader><PropertyForm property={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} /></DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search properties..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
        {['all','sales','property_management','leasing'].map(m => (
          <Button key={m} variant={filterModule === m ? 'default' : 'outline'} size="sm" onClick={() => setFilterModule(m)} className={filterModule === m ? 'bg-primary' : ''}>
            {m === 'property_management' ? 'PM' : m.charAt(0).toUpperCase() + m.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(prop => (
            <Card key={prop.id} className="border card-hover">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Home className="w-4 h-4 text-primary" /></div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(prop); setShowForm(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(prop.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <p className="font-semibold text-sm line-clamp-1">{prop.address}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5"><MapPin className="w-3 h-3" />{prop.suburb}{prop.state ? `, ${prop.state}` : ''}</div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <span className={`status-pill ${moduleColors[prop.module_type] || 'bg-gray-100 text-gray-700'}`}>{prop.module_type?.replace(/_/g,' ')}</span>
                  <StatusPill status={prop.status || 'active'} />
                </div>
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  {prop.bedrooms && <span>{prop.bedrooms}bed</span>}
                  {prop.bathrooms && <span>{prop.bathrooms}bath</span>}
                  {prop.weekly_rent && <span>${prop.weekly_rent}/wk</span>}
                  {prop.asking_price && <span>${prop.asking_price?.toLocaleString()}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed"><CardContent className="p-12 text-center"><Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" /><p className="font-medium text-muted-foreground">No properties found</p><Button className="mt-4 bg-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Add Property</Button></CardContent></Card>
      )}
    </div>
  );
}