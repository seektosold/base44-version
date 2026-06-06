import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusPill from '@/components/ui/StatusPill';
import { Shield, CheckCircle2, AlertTriangle, Star, User, Send, ThumbsUp, ThumbsDown } from 'lucide-react';

function ApplicantSummary({ application, rank, onApprove, onReject }) {
  const strengths = application.strengths || [];
  const risks = application.risks || [];

  return (
    <Card className={`border-2 ${rank === 1 ? 'border-amber-400' : 'border-border'}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rank === 1 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
              #{rank}
            </div>
            <div>
              <p className="font-semibold text-sm">Applicant {rank}</p>
              <StatusPill status={application.status} />
            </div>
          </div>
          {rank === 1 && (
            <span className="status-pill bg-amber-100 text-amber-700">
              <Star className="w-2.5 h-2.5" /> Recommended
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          {application.move_in_date && (
            <div>
              <p className="text-xs text-muted-foreground">Move-in Date</p>
              <p className="font-medium">{application.move_in_date}</p>
            </div>
          )}
          {application.weekly_rent_offered && (
            <div>
              <p className="text-xs text-muted-foreground">Rent Offered</p>
              <p className="font-medium">${application.weekly_rent_offered}/wk</p>
            </div>
          )}
        </div>

        {application.ai_summary && (
          <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100 mb-3">
            <p className="text-xs text-blue-800">{application.ai_summary}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          {strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700 mb-1">Strengths</p>
              {strengths.map(s => (
                <div key={s} className="flex items-center gap-1 text-xs text-green-700"><CheckCircle2 className="w-3 h-3" />{s}</div>
              ))}
            </div>
          )}
          {risks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1">Risks / Missing</p>
              {risks.map(r => (
                <div key={r} className="flex items-center gap-1 text-xs text-amber-700"><AlertTriangle className="w-3 h-3" />{r}</div>
              ))}
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="grid grid-cols-2 gap-1 mb-3">
          {[
            ['Identity', application.identity_docs],
            ['Employment', application.employment_verified],
            ['Income', application.income_verified],
            ['Rental History', application.rental_history],
            ['References', application.references_provided],
            ['Pets', application.pets ? 'Yes' : null],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center gap-1.5 text-xs">
              {value
                ? <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                : <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
              }
              <span className={value ? '' : 'text-muted-foreground'}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => onApprove(application)}>
            <ThumbsUp className="w-3 h-3 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs border-red-200 text-red-600" onClick={() => onReject(application)}>
            <ThumbsDown className="w-3 h-3 mr-1" /> Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LandlordPacksPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Application.filter({ status: 'landlord_review' }, '-ranking_score', 20)
      .then(setApplications)
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(application) {
    await base44.entities.Application.update(application.id, {
      status: 'approved',
      landlord_decision: 'approved',
      landlord_decided_at: new Date().toISOString(),
    });
    const updated = await base44.entities.Application.filter({ status: 'landlord_review' });
    setApplications(updated);
  }

  async function handleReject(application) {
    await base44.entities.Application.update(application.id, {
      status: 'unsuccessful',
      landlord_decision: 'rejected',
      landlord_decided_at: new Date().toISOString(),
    });
    const updated = await base44.entities.Application.filter({ status: 'landlord_review' });
    setApplications(updated);
  }

  // Group by property
  const byProperty = {};
  applications.forEach(app => {
    if (!byProperty[app.property_id]) byProperty[app.property_id] = [];
    byProperty[app.property_id].push(app);
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-500" /> Landlord Packs
        </h1>
        <p className="text-sm text-muted-foreground">
          Best applicant summaries ready for landlord review
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-60 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : Object.keys(byProperty).length > 0 ? (
        Object.entries(byProperty).map(([propertyId, apps]) => (
          <div key={propertyId}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-semibold">Property ...{propertyId.slice(-6)}</h2>
              <Badge variant="secondary">{apps.length} applicant{apps.length > 1 ? 's' : ''}</Badge>
              <Button size="sm" variant="outline" className="ml-auto text-xs">
                <Send className="w-3 h-3 mr-1" /> Email Pack to Landlord
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {apps.slice(0, 3).map((app, i) => (
                <ApplicantSummary
                  key={app.id}
                  application={app}
                  rank={i + 1}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No landlord packs ready</p>
            <p className="text-xs text-muted-foreground mt-1">Shortlisted applications will appear here once ready for landlord review</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}