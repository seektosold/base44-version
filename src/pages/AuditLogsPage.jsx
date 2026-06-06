import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, Search, AlertTriangle, Shield, Bot, Mail, Smartphone } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/lib/userContext';
import { ROLES } from '@/lib/roles';

const eventIcons = {
  email_sent: Mail,
  sms_sent: Smartphone,
  automation: Bot,
  approval: Shield,
  default: FileText,
};

export default function AuditLogsPage() {
  const { userRole } = useUser();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadLogs(); }, []);

  async function loadLogs() {
    setLoading(true);
    const data = await base44.entities.AuditLog.list('-created_date', 100);
    setLogs(data); setLoading(false);
  }

  const filtered = logs.filter(l => {
    const matchModule = filterModule === 'all' || l.module_type === filterModule;
    const matchSearch = !search || l.description?.toLowerCase().includes(search.toLowerCase()) || l.event_type?.toLowerCase().includes(search.toLowerCase());
    return matchModule && matchSearch;
  });

  const moduleColors = {
    sales: 'bg-blue-100 text-blue-700',
    property_management: 'bg-green-100 text-green-700',
    leasing: 'bg-orange-100 text-orange-700',
    owner_admin: 'bg-purple-100 text-purple-700',
    system: 'bg-gray-100 text-gray-700',
  };

  if (userRole !== ROLES.OWNER) {
    return (
      <div className="p-6 text-center py-20">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">Audit logs are restricted to Owner role only.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6" />Audit Logs</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} log entries</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search logs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="property_management">Property Management</SelectItem>
            <SelectItem value="leasing">Leasing</SelectItem>
            <SelectItem value="owner_admin">Owner Admin</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : filtered.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map(log => {
                const Icon = eventIcons[log.event_type] || eventIcons.default;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold">{log.event_type?.replace(/_/g,' ')}</span>
                        <span className={`status-pill text-xs ${moduleColors[log.module_type] || 'bg-gray-100 text-gray-700'}`}>{log.module_type?.replace(/_/g,' ')}</span>
                        {log.approval_required && <span className="status-pill bg-yellow-100 text-yellow-700 text-xs">Approval Required</span>}
                        {log.approval_bypassed && <span className="status-pill bg-red-100 text-red-700 text-xs">Auto-bypassed</span>}
                      </div>
                      <p className="text-sm text-foreground">{log.description}</p>
                      {log.source_rationale && <p className="text-xs text-muted-foreground mt-0.5">{log.source_rationale}</p>}
                    </div>
                    <div className="text-xs text-muted-foreground flex-shrink-0 text-right">
                      <p>{new Date(log.created_date).toLocaleDateString()}</p>
                      <p>{new Date(log.created_date).toLocaleTimeString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No audit logs yet</p>
            <p className="text-sm text-muted-foreground mt-1">All system actions will be logged here automatically</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}