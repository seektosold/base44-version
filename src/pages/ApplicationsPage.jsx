import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusPill from '@/components/ui/StatusPill';
import { FileText, Plus, AlertTriangle, CheckCircle2, Star, ChevronRight, UserCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ApplicationCard({ application, onAction }) {
  const missing = application.missing_documents || [];
  const completeness = application.completeness_score ?? (
    [application.identity_docs, application.employment_verified, application.income_verified,
     application.rental_history, application.references_provided]
    .filter(Boolean).length / 5 * 100
  );

  return (
    <Card className={`border card-hover ${missing.length > 0 ? 'border-amber-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <StatusPill status={application.status} />
              {application.ranking_position && (
                <span className="status-pill bg-purple-100 text-purple-700">
                  <Star className="w-2.5 h-2.5" /> Rank #{application.ranking_position}
                </span>
              )}
            </div>

            <p className="text-sm font-semibold">Application — Property ...{application.property_id?.slice(-4)}</p>
            {application.move_in_date && (
              <p className="text-xs text-muted-foreground mt-0.5">Move in: {application.move_in_date}</p>
            )}

            {/* Checklist */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
              {[
                ['Identity Docs', application.identity_docs],
                ['Employment', application.employment_verified],
                ['Income', application.income_verified],
                ['Rental History', application.rental_history],
                ['References', application.references_provided],
              ].map(([label, done]) => (
                <div key={label} className="flex items-center gap-1.5 text-xs">
                  {done
                    ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                    : <AlertTriangle className="w-3 h-3 text-amber-500" />
                  }
                  <span className={done ? '' : 'text-amber-700'}>{label}</span>
                </div>
              ))}
            </div>

            {/* Completeness bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Completeness</span>
                <span className="font-medium">{Math.round(completeness)}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full">
                <div
                  className={`h-full rounded-full ${completeness >= 80 ? 'bg-green-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>

            {application.ai_summary && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{application.ai_summary}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {missing.length > 0 && (
              <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-700" onClick={() => onAction(application, 'request_info')}>
                Request Docs
              </Button>
            )}
            {application.status === 'complete' && (
              <Button size="sm" className="h-7 text-xs bg-primary" onClick={() => onAction(application, 'shortlist')}>
                Shortlist
              </Button>
            )}
            {application.status === 'shortlisted' && (
              <Button size="sm" className="h-7 text-xs bg-amber-600 text-white" onClick={() => onAction(application, 'landlord_review')}>
                Send to Landlord
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadApplications(); }, []);

  async function loadApplications() {
    setLoading(true);
    const data = await base44.entities.Application.list('-created_date', 50);
    setApplications(data);
    setLoading(false);
  }

  async function handleAction(application, action) {
    const statusMap = {
      request_info: 'info_requested',
      shortlist: 'shortlisted',
      landlord_review: 'landlord_review',
      approve: 'approved',
      reject: 'unsuccessful',
    };
    await base44.entities.Application.update(application.id, { status: statusMap[action] });
    loadApplications();
  }

  const byStatus = (statuses) => applications.filter(a => statuses.includes(a.status));

  const tabs = [
    { key: 'incomplete', label: 'Incomplete', statuses: ['received', 'incomplete', 'info_requested'] },
    { key: 'complete', label: 'Complete', statuses: ['complete', 'shortlisted'] },
    { key: 'landlord', label: 'Landlord Review', statuses: ['landlord_review'] },
    { key: 'decided', label: 'Decided', statuses: ['approved', 'unsuccessful', 'withdrawn'] },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-sm text-muted-foreground">{applications.length} total applications</p>
        </div>
        <Button className="bg-primary"><Plus className="w-4 h-4 mr-2" />Add Application</Button>
      </div>

      <Tabs defaultValue="incomplete">
        <TabsList>
          {tabs.map(tab => {
            const count = byStatus(tab.statuses).length;
            return (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label}
                {count > 0 && <Badge variant="secondary" className="ml-2 text-xs">{count}</Badge>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.key} value={tab.key} className="mt-4">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}</div>
            ) : byStatus(tab.statuses).length > 0 ? (
              <div className="space-y-3">
                {byStatus(tab.statuses).map(app => (
                  <ApplicationCard key={app.id} application={app} onAction={handleAction} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No {tab.label.toLowerCase()} applications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}