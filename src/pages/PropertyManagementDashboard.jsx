import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusPill from '@/components/ui/StatusPill';
import AutomodeBadge from '@/components/ui/AutomodeBadge';
import {
  Wrench, AlertTriangle, Clock, CheckCircle2, Building2, Users,
  ArrowRight, Bot, FileText, MessageSquare, Star, Zap, ChevronRight,
  HardHat, UserCheck, Home
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/lib/userContext';
import { getUrgencyColor } from '@/lib/roles';

function ServiceRequestCard({ request }) {
  const urgencyColor = getUrgencyColor(request.urgency);
  return (
    <Card className={`border card-hover ${urgencyColor}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusPill status={request.status || 'new'} />
              <span className={`status-pill border ${urgencyColor} text-xs`}>{request.urgency}</span>
            </div>
            <h3 className="font-semibold text-sm text-foreground mt-1 line-clamp-1">{request.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{request.issue_type?.replace(/_/g, ' ')}</p>
            {request.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{request.description}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <Button size="sm" className="h-7 text-xs bg-primary" asChild>
              <Link to={`/service-requests`}>View</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PropertyManagementDashboard() {
  const { currentUser } = useUser();
  const [serviceRequests, setServiceRequests] = useState([]);
  const [signals, setSignals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      Promise.all([
        base44.entities.ServiceRequest.list('-created_date', 20),
        base44.entities.Signal.filter({ module_type: 'property_management' }, '-urgency_score', 10),
        base44.entities.Task.filter({ module_type: 'property_management' }, '-due_date', 10),
      ]).then(([sr, s, t]) => {
        if (!cancelled) {
          setServiceRequests(sr);
          setSignals(s);
          setTasks(t);
        }
      }).finally(() => { if (!cancelled) setLoading(false); });
    }, 100);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const byStatus = (status) => serviceRequests.filter(sr => sr.status === status);
  const emergencies = serviceRequests.filter(sr => sr.urgency === 'emergency');
  const needsInfo = serviceRequests.filter(sr => sr.status === 'info_requested');
  const pendingLandlord = serviceRequests.filter(sr => sr.status === 'landlord_approval_pending');
  const pendingQuotes = serviceRequests.filter(sr => sr.status === 'quotes_requested');
  const escalated = serviceRequests.filter(sr => sr.status === 'escalated');

  const statCards = [
    { label: 'New Requests', value: byStatus('new').length, color: 'bg-blue-100 text-blue-600', icon: Wrench },
    { label: 'Awaiting Landlord', value: pendingLandlord.length, color: 'bg-amber-100 text-amber-600', icon: UserCheck },
    { label: 'Quotes Pending', value: pendingQuotes.length, color: 'bg-purple-100 text-purple-600', icon: FileText },
    { label: 'Escalated', value: escalated.length, color: 'bg-red-100 text-red-600', icon: AlertTriangle },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Property Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button size="sm" className="bg-primary" asChild>
          <Link to="/service-requests"><Wrench className="w-4 h-4 mr-2" />Service Requests</Link>
        </Button>
      </div>

      {/* Emergency banner */}
      {emergencies.length > 0 && (
        <div className="bg-red-600 text-white rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-bold">{emergencies.length} Emergency Request{emergencies.length > 1 ? 's' : ''}</p>
            <p className="text-red-100 text-sm">{emergencies.map(e => e.title).join(' · ')}</p>
          </div>
          <Button size="sm" variant="secondary" className="ml-auto" asChild>
            <Link to="/service-requests">View Now</Link>
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="card-hover cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service requests pipeline */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Active Service Requests
              </CardTitle>
              <Link to="/service-requests" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : serviceRequests.length > 0 ? (
              <div className="space-y-3">
                {serviceRequests.slice(0, 6).map(req => (
                  <ServiceRequestCard key={req.id} request={req} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No active service requests</p>
                <Button size="sm" variant="outline" className="mt-3" asChild>
                  <Link to="/service-requests">Create Request</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Workflow stages */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Workflow Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              {[
                { label: 'Info Requested', count: needsInfo.length, color: 'bg-blue-500' },
                { label: 'Quotes Requested', count: pendingQuotes.length, color: 'bg-purple-500' },
                { label: 'Landlord Approval', count: pendingLandlord.length, color: 'bg-amber-500' },
                { label: 'Contractor Booked', count: byStatus('contractor_booked').length, color: 'bg-green-500' },
                { label: 'Completion Pending', count: byStatus('completion_pending').length, color: 'bg-teal-500' },
              ].map(stage => (
                <div key={stage.label} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <span className="text-xs text-muted-foreground flex-1">{stage.label}</span>
                  <Badge variant="secondary" className="text-xs">{stage.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* PM Signals */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {signals.slice(0, 4).map(signal => (
                <div key={signal.id} className="py-2 border-b border-border last:border-0">
                  <p className="text-xs font-medium text-foreground line-clamp-1">{signal.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{signal.rationale}</p>
                </div>
              ))}
              {signals.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No active signals</p>
              )}
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Tasks Due Today</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    task.priority === 'urgent' ? 'bg-red-500' :
                    task.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-xs line-clamp-1 flex-1">{task.title}</span>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No tasks due</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}