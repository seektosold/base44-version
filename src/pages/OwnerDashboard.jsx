import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StatusPill from '@/components/ui/StatusPill';
import {
  TrendingUp, Wrench, Key, Users, AlertTriangle, Clock,
  CheckCircle2, Zap, Bot, BarChart3, MessageSquare, ArrowRight,
  Activity, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/lib/userContext';

function StatCard({ icon: Icon, label, value, sub, color, href }) {
  return (
    <Link to={href || '#'}>
      <Card className="card-hover cursor-pointer border border-border">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{label}</p>
              <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </div>
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AlertItem({ type, title, description, time, severity }) {
  const colors = {
    urgent: 'border-l-red-500 bg-red-50',
    warning: 'border-l-amber-500 bg-amber-50',
    info: 'border-l-blue-500 bg-blue-50',
  };
  return (
    <div className={`border-l-4 rounded-r-lg p-3 ${colors[severity] || colors.info}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const { currentUser } = useUser();
  const [signals, setSignals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Signal.list('-created_date', 20),
      base44.entities.Task.filter({ status: 'pending' }, '-due_date', 10),
      base44.entities.Message.filter({ status: 'pending_approval' }, '-created_date', 10),
      base44.entities.ServiceRequest.list('-created_date', 10),
      base44.entities.Contact.list('-created_date', 5),
    ]).then(([s, t, m, sr, c]) => {
      setSignals(s);
      setTasks(t);
      setMessages(m);
      setServiceRequests(sr);
      setContacts(c);
    }).finally(() => setLoading(false));
  }, []);

  const urgentSignals = signals.filter(s => s.urgency_score >= 8);
  const overdueTaskCount = tasks.filter(t => t.status === 'overdue').length;
  const pendingApprovals = messages.filter(m => m.status === 'pending_approval').length;
  const escalated = serviceRequests.filter(sr => sr.status === 'escalated').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Owner Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Complete business overview — {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/users"><Users className="w-4 h-4 mr-2" />Manage Users</Link>
          </Button>
          <Button size="sm" className="bg-primary" asChild>
            <Link to="/settings"><Shield className="w-4 h-4 mr-2" />Settings</Link>
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Sales Signals" value={signals.filter(s => s.module_type === 'sales').length} sub="Active opportunities" color="bg-blue-100 text-blue-600" href="/sales" />
        <StatCard icon={Wrench} label="Service Requests" value={serviceRequests.length} sub={`${escalated} escalated`} color="bg-green-100 text-green-600" href="/property-management" />
        <StatCard icon={Key} label="Leasing Actions" value={signals.filter(s => s.module_type === 'leasing').length} sub="Pending actions" color="bg-orange-100 text-orange-600" href="/leasing" />
        <StatCard icon={AlertTriangle} label="Needs Approval" value={pendingApprovals} sub="Messages queued" color="bg-amber-100 text-amber-600" href="/messages" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard icon={CheckCircle2} label="Overdue Tasks" value={overdueTaskCount} sub="Across all teams" color="bg-red-100 text-red-600" href="/tasks" />
        <StatCard icon={Zap} label="Urgent Signals" value={urgentSignals.length} sub="Require immediate action" color="bg-purple-100 text-purple-600" href="/signals" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Escalations & Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Urgent Escalations
              </CardTitle>
              <Link to="/signals" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : urgentSignals.length > 0 ? urgentSignals.slice(0, 5).map(signal => (
              <AlertItem
                key={signal.id}
                title={signal.title}
                description={signal.rationale || signal.recommended_action}
                time={new Date(signal.created_date).toLocaleDateString()}
                severity={signal.urgency_score >= 9 ? 'urgent' : 'warning'}
              />
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No urgent escalations</p>
              </div>
            )}

            {/* Pending approvals */}
            {messages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Message Approval Queue</h4>
                {messages.slice(0, 3).map(msg => (
                  <div key={msg.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{msg.subject || 'Draft message'}</p>
                      <p className="text-xs text-muted-foreground">{msg.channel} · {msg.module_type}</p>
                    </div>
                    <div className="flex gap-2">
                      <StatusPill status={msg.status} />
                      <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                        <Link to="/messages">Review</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Automation status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-500" />
              Automation Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { module: 'Sales', mode: 'approval', running: 3 },
              { module: 'Property Management', mode: 'hybrid', running: 7 },
              { module: 'Leasing', mode: 'approval', running: 2 },
            ].map(item => (
              <div key={item.module} className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.module}</span>
                  <StatusPill status={item.mode} />
                </div>
                <div className="text-xs text-muted-foreground">{item.running} workflows running</div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/automation">Manage Automation</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Module quick access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'Sales',
            icon: TrendingUp,
            color: 'bg-blue-600',
            href: '/sales',
            stats: [
              { label: 'Active Signals', value: signals.filter(s => s.module_type === 'sales').length },
              { label: 'Opportunities', value: signals.filter(s => s.module_type === 'sales' && s.status === 'new').length },
            ]
          },
          {
            title: 'Property Management',
            icon: Wrench,
            color: 'bg-green-600',
            href: '/property-management',
            stats: [
              { label: 'Service Requests', value: serviceRequests.length },
              { label: 'Escalated', value: escalated },
            ]
          },
          {
            title: 'Leasing',
            icon: Key,
            color: 'bg-orange-600',
            href: '/leasing',
            stats: [
              { label: 'Active Signals', value: signals.filter(s => s.module_type === 'leasing').length },
              { label: 'Pending', value: signals.filter(s => s.module_type === 'leasing' && s.status === 'new').length },
            ]
          },
        ].map(mod => {
          const Icon = mod.icon;
          return (
            <Card key={mod.title} className="card-hover cursor-pointer" onClick={() => {}}>
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-3">{mod.title}</h3>
                <div className="space-y-1.5">
                  {mod.stats.map(stat => (
                    <div key={stat.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{stat.label}</span>
                      <span className="font-semibold">{stat.value}</span>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-3 text-xs" asChild>
                  <Link to={mod.href}>Open {mod.title} <ArrowRight className="w-3 h-3 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}