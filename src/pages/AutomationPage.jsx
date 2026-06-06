import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AutomodeBadge from '@/components/ui/AutomodeBadge';
import { Bot, Shield, Zap, CheckCircle2, AlertTriangle, ChevronRight, Play, Pause } from 'lucide-react';
import { useUser } from '@/lib/userContext';
import { ROLES } from '@/lib/roles';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function AutomationScope({ scope, label, currentMode, onModeChange, canEdit }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground capitalize">{scope}</p>
      </div>
      <div className="flex items-center gap-3">
        <AutomodeBadge mode={currentMode} />
        {canEdit && (
          <Select value={currentMode} onValueChange={onModeChange}>
            <SelectTrigger className="w-36 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approval">Approval Mode</SelectItem>
              <SelectItem value="hybrid">Hybrid Mode</SelectItem>
              <SelectItem value="full_auto">Full Auto</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

function WorkflowAutomationCard({ title, module, steps, automationMode, onModeChange }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              module === 'sales' ? 'bg-blue-100' : module === 'property_management' ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              <Bot className="w-4 h-4 text-foreground/60" />
            </div>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground capitalize">{module?.replace(/_/g,' ')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AutomodeBadge mode={automationMode} />
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Workflow Steps</p>
            {steps.map((step, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i+1}.</span>
                  <span className="text-xs">{step.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {step.requiresApproval && (
                    <span className="status-pill bg-amber-100 text-amber-700 text-xs">Approval Required</span>
                  )}
                  {step.canAutomate && automationMode !== 'approval' && (
                    <span className="status-pill bg-green-100 text-green-700 text-xs">Auto-eligible</span>
                  )}
                </div>
              </div>
            ))}
            <div className="mt-3">
              <Label className="text-xs">Change workflow mode:</Label>
              <Select value={automationMode} onValueChange={onModeChange}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approval">Approval Required</SelectItem>
                  <SelectItem value="hybrid">Hybrid Mode</SelectItem>
                  <SelectItem value="full_auto">Full Automation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AutomationPage() {
  const { userRole, userProfile } = useUser();
  const isOwner = userRole === ROLES.OWNER;

  const [workflowModes, setWorkflowModes] = useState({
    buyer_followup: 'approval',
    seller_nurture: 'approval',
    cold_enquiry: 'hybrid',
    pm_service_request: 'hybrid',
    pm_tenant_onboarding: 'approval',
    leasing_inspection: 'approval',
    leasing_applications: 'approval',
  });

  const workflows = [
    {
      key: 'buyer_followup',
      title: 'Buyer Follow-Up',
      module: 'sales',
      steps: [
        { label: 'Signal detected — new listing matches buyer', canAutomate: true },
        { label: 'AI drafts personalised message', canAutomate: true },
        { label: 'Message sent (email/SMS)', requiresApproval: true },
        { label: 'Reply received and triaged', canAutomate: true },
        { label: 'Follow-up task created', canAutomate: true },
      ]
    },
    {
      key: 'pm_service_request',
      title: 'PM Service Request',
      module: 'property_management',
      steps: [
        { label: 'Request received from tenant', canAutomate: true },
        { label: 'AI classifies issue and urgency', canAutomate: true },
        { label: 'Request extra info/photos from tenant', canAutomate: true },
        { label: 'Send quote request to contractors', requiresApproval: true },
        { label: 'Landlord approval summary sent', requiresApproval: true },
        { label: 'Contractor booking confirmed', requiresApproval: true },
        { label: 'Completion confirmation sent', canAutomate: true },
      ]
    },
    {
      key: 'leasing_inspection',
      title: 'Leasing Inspection Workflow',
      module: 'leasing',
      steps: [
        { label: 'Inspection booked', canAutomate: true },
        { label: 'Confirmation sent to applicant', canAutomate: true },
        { label: 'Reminder sent before inspection', canAutomate: true },
        { label: 'Attendance recorded', canAutomate: false },
        { label: 'Follow-up sent after inspection', canAutomate: true },
        { label: 'Application link sent', canAutomate: true },
      ]
    },
    {
      key: 'leasing_applications',
      title: 'Application to Tenant',
      module: 'leasing',
      steps: [
        { label: 'Application received', canAutomate: true },
        { label: 'Completeness check run', canAutomate: true },
        { label: 'Missing documents requested', canAutomate: true },
        { label: 'Best 3 pack prepared for landlord', canAutomate: true },
        { label: 'Landlord decision recorded', requiresApproval: true },
        { label: 'Successful applicant notified', requiresApproval: true },
        { label: 'Unsuccessful applicants notified', requiresApproval: true },
      ]
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-500" /> Automation Control Centre
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure how the system handles each workflow — full automation, approval mode, or hybrid
        </p>
      </div>

      {/* My mode */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Your Current Mode</p>
                <p className="text-xs text-muted-foreground">All your workflows default to this mode unless overridden</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AutomodeBadge mode={userProfile?.automation_mode || 'approval'} />
              {userProfile?.can_set_automation || isOwner ? (
                <Select value={userProfile?.automation_mode || 'approval'}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approval">Approval Required</SelectItem>
                    <SelectItem value="hybrid">Hybrid Mode</SelectItem>
                    <SelectItem value="full_auto">Full Auto</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground">Set by owner</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What each mode means */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { mode: 'full_auto', title: 'Full Automation', desc: 'System drafts, sends, replies and follows up without approval. Requires explicit owner enablement.', color: 'bg-green-50 border-green-200' },
          { mode: 'hybrid', title: 'Hybrid Mode', desc: 'Routine steps auto-run. Sensitive, high-value or risky actions require approval.', color: 'bg-blue-50 border-blue-200' },
          { mode: 'approval', title: 'Approval Mode', desc: 'Every external action requires your approval before anything is sent or updated.', color: 'bg-amber-50 border-amber-200' },
        ].map(opt => (
          <Card key={opt.mode} className={`border ${opt.color}`}>
            <CardContent className="p-4">
              <AutomodeBadge mode={opt.mode} />
              <p className="font-semibold text-sm mt-2">{opt.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mandatory stops */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" /> Always Requires Approval (even in Full Auto)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              'Confidence below threshold',
              'Contact opted out',
              'Missing consent',
              'Complaint or angry reply',
              'Legal or compliance risk',
              'Quote over approval threshold',
              'Landlord decision required',
              'SMS provider not connected',
              'Gmail bounce or failure',
              'Safety-related issue',
              'Duplicate contact conflict',
              'Stale or missing required data',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-xs py-1">
                <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-workflow controls */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Workflow Automation Settings</h2>
        <div className="space-y-3">
          {workflows.map(wf => (
            <WorkflowAutomationCard
              key={wf.key}
              {...wf}
              automationMode={workflowModes[wf.key]}
              onModeChange={mode => setWorkflowModes(prev => ({ ...prev, [wf.key]: mode }))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}