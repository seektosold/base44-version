import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusPill from '@/components/ui/StatusPill';
import AutomodeBadge from '@/components/ui/AutomodeBadge';
import SignalViewDrawer from '@/components/signals/SignalViewDrawer';
import {
  TrendingUp, Zap, MessageSquare, CheckSquare, Users, ArrowRight,
  Clock, Star, AlertTriangle, Bot, Phone, Mail, Inbox, Sun,
  ChevronRight, CheckCircle2, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/lib/userContext';

function OpportunityCard({ signal, onView }) {
  return (
    <Card className="border border-border card-hover">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusPill status={signal.status || 'new'} />
              {signal.urgency_score >= 8 && (
                <span className="status-pill bg-red-100 text-red-700">Urgent</span>
              )}
              {signal.requires_approval && (
                <span className="status-pill bg-yellow-100 text-yellow-700">☑ Approval Required</span>
              )}
            </div>
            <h3 className="font-semibold text-sm text-foreground mt-1">{signal.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{signal.rationale}</p>
            
            {signal.recommended_channel && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Channel:</span>
                {signal.recommended_channel === 'email' ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                <span className="text-xs font-medium capitalize">{signal.recommended_channel}</span>
              </div>
            )}

            {signal.confidence_level && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{signal.confidence_level}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${signal.confidence_level >= 70 ? 'bg-green-500' : signal.confidence_level >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${signal.confidence_level}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <Button size="sm" className="h-7 text-xs bg-slate-900 text-white hover:bg-slate-700">
              <CheckSquare className="w-3 h-3 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onView(signal)}>
              <Eye className="w-3 h-3 mr-1" /> View
            </Button>
          </div>
        </div>

        {signal.recommended_action && (
          <div className="mt-3 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Suggested action: </span>
              {signal.recommended_action}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, count, icon: Icon, color }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <h2 className="font-semibold text-foreground">{title}</h2>
      {count !== undefined && (
        <Badge variant="secondary" className="ml-auto">{count}</Badge>
      )}
    </div>
  );
}

export default function SalesDashboard() {
  const { currentUser, userProfile } = useUser();
  const [signals, setSignals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingSignal, setViewingSignal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      Promise.all([
        base44.entities.Signal.filter({ module_type: 'sales' }, '-urgency_score', 20),
        base44.entities.Task.filter({ module_type: 'sales' }, '-due_date', 10),
        base44.entities.Message.filter({ module_type: 'sales', status: 'pending_approval' }, '-created_date', 5),
      ]).then(([s, t, m]) => {
        if (!cancelled) {
          setSignals(s);
          setTasks(t);
          setMessages(m);
        }
      }).finally(() => { if (!cancelled) setLoading(false); });
    }, 100);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const prioritySignals = signals.filter(s => s.urgency_score >= 7);
  const waitingSignals = signals.filter(s => s.status === 'in_progress');
  const overdueTasksList = tasks.filter(t => t.status === 'overdue');
  const pendingMessages = messages;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Morning brief */}
      <div className="bg-gradient-to-r from-[hsl(222,47%,15%)] to-[hsl(222,35%,25%)] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Sun className="w-5 h-5 text-amber-400" />
          <span className="text-amber-400 text-sm font-medium">Morning Brief</span>
        </div>
        <h1 className="text-xl font-bold">
          Good morning, {currentUser?.full_name?.split(' ')[0] || 'Agent'}
        </h1>
        <p className="text-white/70 text-sm mt-1">
          {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Priority Actions', value: prioritySignals.length, color: 'text-red-300' },
            { label: 'Waiting for Reply', value: waitingSignals.length, color: 'text-yellow-300' },
            { label: 'Pending Approval', value: pendingMessages.length, color: 'text-blue-300' },
            { label: 'Tasks Due', value: tasks.length, color: 'text-green-300' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-white/60 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Priority + Waiting */}
          <div className="lg:col-span-2 space-y-6">
            {/* Priority */}
            <div>
              <SectionHeader title="Priority — Act Today" count={prioritySignals.length} icon={Star} color="bg-red-500" />
              {prioritySignals.length > 0 ? (
                <div className="space-y-3">
                  {prioritySignals.slice(0, 5).map(signal => (
                    <OpportunityCard key={signal.id} signal={signal} onView={setViewingSignal} />
                  ))}
                  {prioritySignals.length > 5 && (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to="/signals">View all {prioritySignals.length} priority signals <ArrowRight className="w-3 h-3 ml-1" /></Link>
                    </Button>
                  )}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">All priority actions are clear</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Needs approval */}
            {pendingMessages.length > 0 && (
              <div>
                <SectionHeader title="Needs Approval" count={pendingMessages.length} icon={AlertTriangle} color="bg-amber-500" />
                <div className="space-y-2">
                  {pendingMessages.map(msg => (
                    <Card key={msg.id} className="border border-amber-200 bg-amber-50/50">
                      <CardContent className="p-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{msg.subject || 'Draft message'}</p>
                          <p className="text-xs text-muted-foreground">{msg.channel} · AI drafted</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs bg-primary">Approve</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs">Edit</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Overdue */}
            {overdueTasksList.length > 0 && (
              <div>
                <SectionHeader title="Overdue" count={overdueTasksList.length} icon={Clock} color="bg-red-600" />
                <div className="space-y-2">
                  {overdueTasksList.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-red-900">{task.title}</p>
                        <p className="text-xs text-red-600">Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Unknown'}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-700">Complete</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar panels */}
          <div className="space-y-4">
            {/* Quick actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Draft New Message', icon: MessageSquare, href: '/messages', color: 'bg-blue-500' },
                  { label: 'Add Contact', icon: Users, href: '/contacts', color: 'bg-green-500' },
                  { label: 'View All Signals', icon: Zap, href: '/signals', color: 'bg-purple-500' },
                  { label: 'Open Tasks', icon: CheckSquare, href: '/tasks', color: 'bg-amber-500' },
                ].map(action => {
                  const Icon = action.icon;
                  return (
                    <Button key={action.label} variant="ghost" className="w-full justify-start h-9 text-sm" asChild>
                      <Link to={action.href}>
                        <div className={`w-5 h-5 rounded-md ${action.color} flex items-center justify-center mr-2.5`}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        {action.label}
                      </Link>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Automation status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-500" /> Automation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Mode</span>
                    <AutomodeBadge mode={userProfile?.automation_mode || 'approval'} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Auto-replies</span>
                    <span className={userProfile?.email_auto_reply ? 'text-green-600' : 'text-muted-foreground'}>
                      {userProfile?.email_auto_reply ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3 text-xs" asChild>
                  <Link to="/automation">Configure Automation</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent tasks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      task.priority === 'urgent' ? 'bg-red-500' :
                      task.priority === 'high' ? 'bg-orange-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-xs text-foreground line-clamp-1 flex-1">{task.title}</span>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">No pending tasks</p>
                )}
                <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" asChild>
                  <Link to="/tasks">View all tasks</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <SignalViewDrawer
        signal={viewingSignal}
        open={!!viewingSignal}
        onClose={() => setViewingSignal(null)}
      />
    </div>
  );
}