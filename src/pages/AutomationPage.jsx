import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import AutomodeBadge from '@/components/ui/AutomodeBadge';
import WorkflowEditorCard from '@/components/automation/WorkflowEditorCard';
import { Bot, Shield, Zap, AlertTriangle, Plus, Save, Trash2, Settings, Mail, MessageSquare, Clock } from 'lucide-react';
import { useUser } from '@/lib/userContext';
import { ROLES } from '@/lib/roles';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

const DEFAULT_WORKFLOWS = [
  {
    key: 'buyer_followup',
    title: 'Buyer Follow-Up',
    module: 'sales',
    automationMode: 'approval',
    steps: [
      { label: 'Signal detected — new listing matches buyer', canAutomate: true },
      { label: 'AI drafts personalised message', canAutomate: true },
      { label: 'Message sent (email/SMS)', requiresApproval: true },
      { label: 'Reply received and triaged', canAutomate: true },
      { label: 'Follow-up task created', canAutomate: true },
    ]
  },
  {
    key: 'seller_nurture',
    title: 'Seller Nurture',
    module: 'sales',
    automationMode: 'approval',
    steps: [
      { label: 'Appraisal anniversary detected', canAutomate: true },
      { label: 'Market update prepared by AI', canAutomate: true },
      { label: 'Email drafted for review', requiresApproval: true },
      { label: 'Sent and reply triaged', canAutomate: true },
    ]
  },
  {
    key: 'pm_service_request',
    title: 'PM Service Request',
    module: 'property_management',
    automationMode: 'hybrid',
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
    key: 'pm_tenant_onboarding',
    title: 'PM Tenant Onboarding',
    module: 'property_management',
    automationMode: 'approval',
    steps: [
      { label: 'Lease signed and keys issued', canAutomate: true },
      { label: 'Welcome pack sent', canAutomate: true },
      { label: 'Move-in inspection scheduled', requiresApproval: true },
      { label: 'Inspection report sent to landlord', requiresApproval: true },
    ]
  },
  {
    key: 'leasing_inspection',
    title: 'Leasing Inspection Workflow',
    module: 'leasing',
    automationMode: 'approval',
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
    automationMode: 'approval',
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

const MANDATORY_STOPS = [
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
];

export default function AutomationPage() {
  const { userRole, userProfile } = useUser();
  const isOwner = userRole === ROLES.OWNER;

  const [workflows, setWorkflows] = useState(DEFAULT_WORKFLOWS);
  const [globalMode, setGlobalMode] = useState(userProfile?.automation_mode || 'approval');
  const [saving, setSaving] = useState(false);

  // Global channel settings
  const [channelSettings, setChannelSettings] = useState({
    email_auto_send: false,
    sms_auto_send: false,
    auto_reply_email: false,
    auto_reply_sms: false,
    confidence_threshold: 80,
    sending_window_start: '08:00',
    sending_window_end: '20:00',
    frequency_cap_daily: 3,
    frequency_cap_weekly: 10,
  });

  // Role overrides
  const [roleOverrides, setRoleOverrides] = useState({
    sales: 'approval',
    property_manager: 'approval',
    leasing: 'approval',
  });

  useEffect(() => {
    // Load saved automation settings
    base44.entities.AutomationSetting.filter({ scope: 'organisation' }).then(settings => {
      if (settings?.length > 0) {
        const org = settings[0];
        if (org.automation_mode) setGlobalMode(org.automation_mode);
        setChannelSettings(prev => ({
          ...prev,
          email_auto_send: org.email_auto_send ?? prev.email_auto_send,
          sms_auto_send: org.sms_auto_send ?? prev.sms_auto_send,
          auto_reply_email: org.auto_reply_email ?? prev.auto_reply_email,
          auto_reply_sms: org.auto_reply_sms ?? prev.auto_reply_sms,
          confidence_threshold: org.confidence_threshold ?? prev.confidence_threshold,
          sending_window_start: org.sending_window_start ?? prev.sending_window_start,
          sending_window_end: org.sending_window_end ?? prev.sending_window_end,
          frequency_cap_daily: org.frequency_cap_daily ?? prev.frequency_cap_daily,
          frequency_cap_weekly: org.frequency_cap_weekly ?? prev.frequency_cap_weekly,
        }));
      }
    }).catch(() => {});

    // Load saved role overrides
    base44.entities.AutomationSetting.filter({ scope: 'role' }).then(settings => {
      if (settings?.length > 0) {
        const overrides = {};
        settings.forEach(s => { if (s.scope_id) overrides[s.scope_id] = s.automation_mode; });
        setRoleOverrides(prev => ({ ...prev, ...overrides }));
      }
    }).catch(() => {});

    // Load saved workflows
    base44.entities.Workflow.filter({ workflow_type: 'automation_config' }).then(saved => {
      if (saved?.length > 0) {
        setWorkflows(prev => prev.map(wf => {
          const match = saved.find(s => s.name === wf.key);
          if (match) {
            return {
              ...wf,
              title: match.module_type ? wf.title : wf.title,
              automationMode: match.automation_mode || wf.automationMode,
              steps: match.steps?.length > 0 ? match.steps : wf.steps,
            };
          }
          return wf;
        }));
      }
    }).catch(() => {});
  }, []);

  const handleSaveGlobal = async () => {
    setSaving(true);
    try {
      const existing = await base44.entities.AutomationSetting.filter({ scope: 'organisation' });
      const payload = {
        scope: 'organisation',
        scope_label: 'Global',
        module_type: 'all',
        organisation_id: userProfile?.organisation_id || 'default',
        automation_mode: globalMode,
        ...channelSettings,
      };
      if (existing?.length > 0) {
        await base44.entities.AutomationSetting.update(existing[0].id, payload);
      } else {
        await base44.entities.AutomationSetting.create(payload);
      }

      // Save role overrides
      for (const [roleKey, mode] of Object.entries(roleOverrides)) {
        const existingRole = await base44.entities.AutomationSetting.filter({ scope: 'role', scope_id: roleKey });
        const rolePayload = {
          scope: 'role',
          scope_id: roleKey,
          scope_label: roleKey.replace(/_/g, ' '),
          module_type: 'all',
          organisation_id: userProfile?.organisation_id || 'default',
          automation_mode: mode,
        };
        if (existingRole?.length > 0) {
          await base44.entities.AutomationSetting.update(existingRole[0].id, rolePayload);
        } else {
          await base44.entities.AutomationSetting.create(rolePayload);
        }
      }
      toast.success('Global settings saved');
    } catch (e) {
      toast.error('Failed to save settings');
    }
    setSaving(false);
  };

  const handleSaveWorkflow = async (updated) => {
    setWorkflows(prev => prev.map(wf => wf.key === updated.key ? updated : wf));
    try {
      const existing = await base44.entities.Workflow.filter({ workflow_type: 'automation_config', name: updated.key });
      const payload = {
        name: updated.key,
        workflow_type: 'automation_config',
        module_type: updated.module,
        automation_mode: updated.automationMode,
        steps: updated.steps,
        organisation_id: userProfile?.organisation_id || 'default',
      };
      if (existing?.length > 0) {
        await base44.entities.Workflow.update(existing[0].id, payload);
      } else {
        await base44.entities.Workflow.create(payload);
      }
      toast.success(`"${updated.title}" saved`);
    } catch (e) {
      toast.error('Failed to save workflow');
    }
  };

  const addWorkflow = () => {
    const key = `custom_${Date.now()}`;
    setWorkflows(prev => [...prev, {
      key,
      title: 'New Workflow',
      module: 'sales',
      automationMode: 'approval',
      steps: [{ label: 'Step 1', canAutomate: false, requiresApproval: true }],
    }]);
  };

  const deleteWorkflow = async (key) => {
    setWorkflows(prev => prev.filter(wf => wf.key !== key));
    try {
      const existing = await base44.entities.Workflow.filter({ workflow_type: 'automation_config', name: key });
      if (existing?.length > 0) await base44.entities.Workflow.delete(existing[0].id);
      toast.success('Workflow deleted');
    } catch (e) {}
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-500" /> Automation Control Centre
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure how the system handles each workflow — full automation, approval mode, or hybrid
          </p>
        </div>
        {isOwner && (
          <Button onClick={handleSaveGlobal} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Global Settings'}
          </Button>
        )}
      </div>

      <Tabs defaultValue="workflows">
        <TabsList className="mb-4">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="global">Global Settings</TabsTrigger>
          <TabsTrigger value="channels">Channel Controls</TabsTrigger>
          <TabsTrigger value="safety">Safety Rules</TabsTrigger>
        </TabsList>

        {/* ── WORKFLOWS TAB ── */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Click any workflow to expand, then use the <strong>pencil</strong> icon to edit steps and settings.
            </p>
            {isOwner && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={addWorkflow}>
                <Plus className="w-4 h-4" /> Add Workflow
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {workflows.map(wf => (
              <div key={wf.key} className="relative group">
                <WorkflowEditorCard
                  workflow={wf}
                  onSave={handleSaveWorkflow}
                />
                {isOwner && (
                  <button
                    className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-red-400"
                    title="Delete workflow"
                    onClick={() => deleteWorkflow(wf.key)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── GLOBAL SETTINGS TAB ── */}
        <TabsContent value="global" className="space-y-4">
          {/* Mode explanations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { mode: 'full_auto', title: 'Full Automation', desc: 'System drafts, sends, replies and follows up without approval.', color: 'bg-green-50 border-green-200' },
              { mode: 'hybrid', title: 'Hybrid Mode', desc: 'Routine steps auto-run. Sensitive actions require approval.', color: 'bg-blue-50 border-blue-200' },
              { mode: 'approval', title: 'Approval Mode', desc: 'Every external action requires your approval before sending.', color: 'bg-amber-50 border-amber-200' },
            ].map(opt => (
              <Card
                key={opt.mode}
                className={`border cursor-pointer transition-all ${opt.color} ${globalMode === opt.mode ? 'ring-2 ring-primary' : ''}`}
                onClick={() => isOwner && setGlobalMode(opt.mode)}
              >
                <CardContent className="p-4">
                  <AutomodeBadge mode={opt.mode} />
                  <p className="font-semibold text-sm mt-2">{opt.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                  {globalMode === opt.mode && (
                    <p className="text-xs font-semibold text-primary mt-2">✓ Active</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Per-role overrides */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" /> Per-Role Mode Overrides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 divide-y">
              {[
                { key: 'sales', label: 'Sales Agents' },
                { key: 'property_manager', label: 'Property Managers' },
                { key: 'leasing', label: 'Leasing Agents' },
              ].map(role => (
                <div key={role.key} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{role.label}</p>
                    <p className="text-xs text-muted-foreground">Overrides global mode for this role</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AutomodeBadge mode={roleOverrides[role.key]} />
                    {isOwner ? (
                      <Select
                        value={roleOverrides[role.key]}
                        onValueChange={v => setRoleOverrides(prev => ({ ...prev, [role.key]: v }))}
                      >
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approval">Approval Required</SelectItem>
                          <SelectItem value="hybrid">Hybrid Mode</SelectItem>
                          <SelectItem value="full_auto">Full Auto</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">Set by owner</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Confidence threshold */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Confidence Threshold
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Signals below this confidence level will always require manual approval, regardless of mode.
              </p>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={channelSettings.confidence_threshold}
                  onChange={e => setChannelSettings(p => ({ ...p, confidence_threshold: Number(e.target.value) }))}
                  className="w-24 h-8 text-sm"
                  disabled={!isOwner}
                />
                <span className="text-sm text-muted-foreground">%</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${channelSettings.confidence_threshold}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CHANNEL CONTROLS TAB ── */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Automation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-send emails</p>
                  <p className="text-xs text-muted-foreground">Send AI-drafted emails without approval</p>
                </div>
                <Switch
                  checked={channelSettings.email_auto_send}
                  onCheckedChange={v => isOwner && setChannelSettings(p => ({ ...p, email_auto_send: v }))}
                  disabled={!isOwner}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-reply to emails</p>
                  <p className="text-xs text-muted-foreground">AI handles inbound replies automatically</p>
                </div>
                <Switch
                  checked={channelSettings.auto_reply_email}
                  onCheckedChange={v => isOwner && setChannelSettings(p => ({ ...p, auto_reply_email: v }))}
                  disabled={!isOwner}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> SMS Automation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-send SMS</p>
                  <p className="text-xs text-muted-foreground">Send AI-drafted SMS without approval</p>
                </div>
                <Switch
                  checked={channelSettings.sms_auto_send}
                  onCheckedChange={v => isOwner && setChannelSettings(p => ({ ...p, sms_auto_send: v }))}
                  disabled={!isOwner}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-reply to SMS</p>
                  <p className="text-xs text-muted-foreground">AI handles inbound SMS replies automatically</p>
                </div>
                <Switch
                  checked={channelSettings.auto_reply_sms}
                  onCheckedChange={v => isOwner && setChannelSettings(p => ({ ...p, auto_reply_sms: v }))}
                  disabled={!isOwner}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" /> Sending Window & Frequency Caps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs mb-1 block">Window Start</Label>
                  <Input
                    type="time"
                    value={channelSettings.sending_window_start}
                    onChange={e => setChannelSettings(p => ({ ...p, sending_window_start: e.target.value }))}
                    className="h-8 text-xs"
                    disabled={!isOwner}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Window End</Label>
                  <Input
                    type="time"
                    value={channelSettings.sending_window_end}
                    onChange={e => setChannelSettings(p => ({ ...p, sending_window_end: e.target.value }))}
                    className="h-8 text-xs"
                    disabled={!isOwner}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs mb-1 block">Max messages / day per contact</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={channelSettings.frequency_cap_daily}
                    onChange={e => setChannelSettings(p => ({ ...p, frequency_cap_daily: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    disabled={!isOwner}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Max messages / week per contact</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={channelSettings.frequency_cap_weekly}
                    onChange={e => setChannelSettings(p => ({ ...p, frequency_cap_weekly: Number(e.target.value) }))}
                    className="h-8 text-xs"
                    disabled={!isOwner}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {isOwner && (
            <Button onClick={handleSaveGlobal} disabled={saving} className="w-full gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Channel Settings'}
            </Button>
          )}
        </TabsContent>

        {/* ── SAFETY RULES TAB ── */}
        <TabsContent value="safety">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" /> Always Requires Approval (even in Full Auto)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                These conditions are hard-coded safety rules that bypass all automation settings.
                They cannot be disabled.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {MANDATORY_STOPS.map(item => (
                  <div key={item} className="flex items-center gap-2 py-2 px-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-xs text-red-800">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}