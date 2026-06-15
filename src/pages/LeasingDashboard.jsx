import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusPill from '@/components/ui/StatusPill';
import {
  Key, Clock, Users, FileText, CheckCircle2, ArrowRight,
  AlertTriangle, Calendar, UserCheck, Building2, Zap, Home, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/lib/userContext';

function InspectionItem({ inspection }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-medium">{inspection.property_id ? `Property #${inspection.property_id.slice(-4)}` : 'Inspection'}</p>
          <p className="text-xs text-muted-foreground">
            {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleString() : 'TBD'}
          </p>
        </div>
      </div>
      <StatusPill status={inspection.status} />
    </div>
  );
}

function ApplicationCard({ application }) {
  return (
    <Card className="border card-hover">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusPill status={application.status} />
              {application.completeness_score !== undefined && (
                <span className="text-xs text-muted-foreground">{application.completeness_score}% complete</span>
              )}
            </div>
            <p className="text-sm font-medium">Application</p>
            {application.missing_documents?.length > 0 && (
              <p className="text-xs text-amber-600 mt-0.5">
                Missing: {application.missing_documents.slice(0,2).join(', ')}
                {application.missing_documents.length > 2 && ` +${application.missing_documents.length - 2}`}
              </p>
            )}
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
            <Link to="/applications">Review</Link>
          </Button>
        </div>
        {application.completeness_score !== undefined && (
          <div className="mt-2 h-1.5 bg-muted rounded-full">
            <div
              className={`h-full rounded-full ${application.completeness_score >= 80 ? 'bg-green-500' : application.completeness_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${application.completeness_score}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LeasingDashboard() {
  const { currentUser } = useUser();
  const [inspections, setInspections] = useState([]);
  const [applications, setApplications] = useState([]);
  const [signals, setSignals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      Promise.all([
        base44.entities.Inspection.list('-inspection_date', 20),
        base44.entities.Application.list('-created_date', 20),
        base44.entities.Signal.filter({ module_type: 'leasing' }, '-urgency_score', 10),
        base44.entities.Task.filter({ module_type: 'leasing' }, '-due_date', 10),
      ]).then(([ins, apps, s, t]) => {
        if (!cancelled) {
          setInspections(ins);
          setApplications(apps);
          setSignals(s);
          setTasks(t);
        }
      }).finally(() => { if (!cancelled) setLoading(false); });
    }, 100);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const upcoming = inspections.filter(i => i.status === 'booked' || i.status === 'confirmed');
  const followUpDue = inspections.filter(i => i.status === 'attended' && !i.follow_up_sent);
  const incompleteApps = applications.filter(a => a.status === 'incomplete' || a.status === 'info_requested');
  const readyForLandlord = applications.filter(a => a.status === 'complete' || a.status === 'shortlisted');
  const pendingDecision = applications.filter(a => a.status === 'landlord_review');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leasing Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/inspections"><Calendar className="w-4 h-4 mr-2" />Inspections</Link>
          </Button>
          <Button size="sm" className="bg-primary" asChild>
            <Link to="/applications"><FileText className="w-4 h-4 mr-2" />Applications</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Upcoming Inspections', value: upcoming.length, icon: Calendar, color: 'bg-orange-100 text-orange-600' },
          { label: 'Follow-Ups Due', value: followUpDue.length, icon: Clock, color: 'bg-amber-100 text-amber-600' },
          { label: 'Incomplete Apps', value: incompleteApps.length, icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
          { label: 'Awaiting Decision', value: pendingDecision.length, icon: UserCheck, color: 'bg-blue-100 text-blue-600' },
        ].map(stat => {
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
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming inspections */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  Upcoming Inspections
                </CardTitle>
                <Link to="/inspections" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
              ) : upcoming.length > 0 ? upcoming.slice(0, 5).map(i => (
                <InspectionItem key={i.id} inspection={i} />
              )) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="w-7 h-7 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No upcoming inspections</p>
                </div>
              )}

              {followUpDue.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-800">{followUpDue.length} follow-up{followUpDue.length > 1 ? 's' : ''} due after inspections</p>
                  </div>
                  <Button size="sm" variant="outline" className="mt-2 text-xs border-amber-200 text-amber-700" asChild>
                    <Link to="/inspections">Send Follow-Ups</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Applications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Applications
                </CardTitle>
                <Link to="/applications" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 bg-muted rounded animate-pulse" />)}</div>
              ) : (
                <div className="space-y-3">
                  {incompleteApps.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Incomplete</h4>
                      {incompleteApps.slice(0,3).map(a => <ApplicationCard key={a.id} application={a} />)}
                    </div>
                  )}
                  {readyForLandlord.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ready for Landlord</h4>
                      {readyForLandlord.slice(0,3).map(a => <ApplicationCard key={a.id} application={a} />)}
                    </div>
                  )}
                  {applications.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <FileText className="w-7 h-7 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No applications yet</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right */}
        <div className="space-y-4">
          {pendingDecision.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
                  <UserCheck className="w-4 h-4" /> Awaiting Landlord Decision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-700">{pendingDecision.length}</p>
                <p className="text-xs text-amber-600 mt-1">Applications ready for landlord review</p>
                <Button size="sm" className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white text-xs" asChild>
                  <Link to="/landlord-packs">View Landlord Packs</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {signals.slice(0, 4).map(signal => (
                <div key={signal.id} className="py-2 border-b border-border last:border-0">
                  <p className="text-xs font-medium line-clamp-1">{signal.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{signal.rationale}</p>
                </div>
              ))}
              {signals.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No active signals</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-orange-500' : 'bg-blue-400'}`} />
                  <span className="text-xs line-clamp-1 flex-1">{task.title}</span>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No pending tasks</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}