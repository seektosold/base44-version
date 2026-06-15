import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatusPill from '@/components/ui/StatusPill';
import { CheckSquare, Plus, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

function TaskForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '', module_type: 'sales', priority: 'medium', status: 'pending', due_date: new Date().toISOString().split('T')[0] });
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div><Label>Task Title *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Module</Label>
          <Select value={form.module_type} onValueChange={v => setForm({...form, module_type: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales Listings</SelectItem>
              <SelectItem value="owner_admin">CRM / Re-engagement</SelectItem>
              <SelectItem value="property_management">Property Management</SelectItem>
              <SelectItem value="leasing">Leasing</SelectItem>
              <SelectItem value="shared">Shared</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={v => setForm({...form, priority: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><Label>Due Date</Label><Input type="date" value={form.due_date?.split('T')[0] || ''} onChange={e => setForm({...form, due_date: e.target.value})} /></div>
      </div>
      <div><Label>Description</Label><textarea className="w-full border border-input rounded-md p-2 text-sm resize-none h-20 bg-background" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" className="bg-primary">Save Task</Button></div>
    </form>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterModule, setFilterModule] = useState('all');

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    setLoading(true);
    const data = await base44.entities.Task.list('-due_date', 100);
    setTasks(data); setLoading(false);
  }

  async function handleSave(data) {
    await base44.entities.Task.create(data);
    setShowForm(false); loadTasks();
  }

  async function handleComplete(task) {
    await base44.entities.Task.update(task.id, { status: 'completed', completed_at: new Date().toISOString() });
    loadTasks();
  }

  const filtered = filterModule === 'all' ? tasks : tasks.filter(t => t.module_type === filterModule);
  const pending = filtered.filter(t => ['pending', 'in_progress', 'waiting'].includes(t.status));
  const overdue = filtered.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date());
  const completed = filtered.filter(t => t.status === 'completed');
  const priorityColors = { urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-gray-400' };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Tasks</h1><p className="text-sm text-muted-foreground">{pending.length} pending · {overdue.length} overdue</p></div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild><Button className="bg-primary"><Plus className="w-4 h-4 mr-2" />Add Task</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader><TaskForm onSave={handleSave} onCancel={() => setShowForm(false)} /></DialogContent>
        </Dialog>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'sales', label: 'Sales Listings' },
          { key: 'owner_admin', label: 'CRM / Re-engagement' },
          { key: 'property_management', label: 'PM' },
          { key: 'leasing', label: 'Leasing' },
          { key: 'shared', label: 'Shared' },
        ].map(m => (
          <Button key={m.key} variant={filterModule === m.key ? 'default' : 'outline'} size="sm" onClick={() => setFilterModule(m.key)} className={filterModule === m.key ? 'bg-primary' : ''}>
            {m.label}
          </Button>
        ))}
      </div>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending <Badge variant="secondary" className="ml-2 text-xs">{pending.length}</Badge></TabsTrigger>
          <TabsTrigger value="overdue">Overdue {overdue.length > 0 && <Badge className="ml-2 text-xs bg-red-500 text-white">{overdue.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        {[['pending', pending], ['overdue', overdue], ['completed', completed]].map(([tab, items]) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
            : items.length > 0 ? (
              <div className="space-y-2">
                {items.map(task => (
                  <Card key={task.id} className={`border card-hover ${tab === 'overdue' ? 'border-red-200 bg-red-50/30' : ''}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority] || 'bg-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground capitalize">{task.module_type?.replace(/_/g,' ')}</span>
                          {task.due_date && <span className={`text-xs ${tab === 'overdue' ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>Due {new Date(task.due_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusPill status={task.priority} />
                        {tab !== 'completed' && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleComplete(task)}><CheckCircle2 className="w-3 h-3 mr-1" />Done</Button>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed"><CardContent className="p-10 text-center"><CheckSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No {tab} tasks</p></CardContent></Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}