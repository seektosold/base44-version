import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, TrendingUp, Wrench, Key, Bot, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/lib/userContext';
import { ROLES } from '@/lib/roles';

const COLORS = ['#1e3a5f', '#d97706', '#16a34a', '#7c3aed', '#dc2626', '#0891b2'];

function StatCard({ label, value, sub, color }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color || 'text-foreground'}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { userRole } = useUser();
  const [data, setData] = useState({ signals: [], messages: [], tasks: [], serviceRequests: [], inspections: [], applications: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Signal.list('-created_date', 200),
      base44.entities.Message.list('-created_date', 200),
      base44.entities.Task.list('-created_date', 200),
      base44.entities.ServiceRequest.list('-created_date', 100),
      base44.entities.Inspection.list('-created_date', 100),
      base44.entities.Application.list('-created_date', 100),
    ]).then(([signals, messages, tasks, serviceRequests, inspections, applications]) => {
      setData({ signals, messages, tasks, serviceRequests, inspections, applications });
    }).finally(() => setLoading(false));
  }, []);

  const messageStatusData = ['drafted', 'pending_approval', 'approved', 'sent', 'delivered', 'bounced', 'failed'].map(s => ({
    name: s.replace(/_/g,' '), value: data.messages.filter(m => m.status === s).length
  })).filter(d => d.value > 0);

  const moduleSignalData = ['sales', 'property_management', 'leasing'].map(m => ({
    name: m === 'property_management' ? 'PM' : m.charAt(0).toUpperCase() + m.slice(1),
    signals: data.signals.filter(s => s.module_type === m).length,
  }));

  const taskStatusData = ['pending', 'in_progress', 'completed', 'overdue'].map(s => ({
    name: s.replace(/_/g,' '), count: data.tasks.filter(t => t.status === s).length
  }));

  const aiAcceptance = data.messages.length > 0 ? Math.round((data.messages.filter(m => m.status !== 'drafted').length / data.messages.length) * 100) : 0;
  const pendingApprovals = data.messages.filter(m => m.status === 'pending_approval').length;
  const overdueTaskCount = data.tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-blue-500" />Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Performance overview across all modules</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Signals" value={data.signals.length} sub="All time" />
        <StatCard label="Messages Sent" value={data.messages.filter(m => ['sent','delivered'].includes(m.status)).length} sub="Email + SMS" color="text-green-600" />
        <StatCard label="Pending Approvals" value={pendingApprovals} sub="In queue" color={pendingApprovals > 0 ? 'text-amber-600' : 'text-foreground'} />
        <StatCard label="AI Acceptance Rate" value={`${aiAcceptance}%`} sub="Messages actioned" color="text-blue-600" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Overdue Tasks" value={overdueTaskCount} color={overdueTaskCount > 0 ? 'text-red-600' : 'text-foreground'} />
        <StatCard label="Service Requests" value={data.serviceRequests.length} sub="Property Management" />
        <StatCard label="Inspections" value={data.inspections.length} sub="Leasing" />
        <StatCard label="Applications" value={data.applications.length} sub={`${data.applications.filter(a => a.status === 'approved').length} approved`} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList><TabsTrigger value="overview">Overview</TabsTrigger>
          {userRole === ROLES.OWNER && <><TabsTrigger value="sales">Sales</TabsTrigger><TabsTrigger value="pm">Property Management</TabsTrigger><TabsTrigger value="leasing">Leasing</TabsTrigger></>}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Signals by Module</CardTitle></CardHeader>
              <CardContent>
                {loading ? <div className="h-48 bg-muted rounded animate-pulse" /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={moduleSignalData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="signals" fill="#1e3a5f" radius={[4,4,0,0]} /></BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Message Status Distribution</CardTitle></CardHeader>
              <CardContent>
                {loading ? <div className="h-48 bg-muted rounded animate-pulse" /> : messageStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart><Pie data={messageStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, value}) => `${name}: ${value}`}>
                      {messageStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No message data yet</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Task Status</CardTitle></CardHeader>
              <CardContent>
                {loading ? <div className="h-48 bg-muted rounded animate-pulse" /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={taskStatusData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#d97706" radius={[4,4,0,0]} /></BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Application Pipeline</CardTitle></CardHeader>
              <CardContent>
                {['received','incomplete','complete','shortlisted','landlord_review','approved'].map(s => (
                  <div key={s} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-xs capitalize text-muted-foreground">{s.replace(/_/g,' ')}</span>
                    <span className="font-semibold text-sm">{data.applications.filter(a => a.status === s).length}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {['sales','pm','leasing'].map(tab => (
          <TabsContent key={tab} value={tab === 'pm' ? 'pm' : tab} className="mt-4">
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">Detailed {tab === 'pm' ? 'Property Management' : tab} analytics</p>
                <p className="text-sm text-muted-foreground mt-1">More data will appear here as the system tracks activity over time.</p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}