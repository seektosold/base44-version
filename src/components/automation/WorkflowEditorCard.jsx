import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AutomodeBadge from '@/components/ui/AutomodeBadge';
import {
  Bot, ChevronRight, Plus, Trash2, GripVertical, Save, Pencil, Check, X
} from 'lucide-react';

const MODULE_COLORS = {
  sales: 'bg-blue-100 text-blue-700',
  property_management: 'bg-green-100 text-green-700',
  leasing: 'bg-orange-100 text-orange-700',
  owner_admin: 'bg-purple-100 text-purple-700',
};

export default function WorkflowEditorCard({ workflow, onSave }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(workflow);

  const handleToggleExpand = () => {
    if (!expanded) setExpanded(true);
    else if (!editing) setExpanded(false);
  };

  const startEdit = (e) => {
    e.stopPropagation();
    setDraft({ ...workflow, steps: workflow.steps.map(s => ({ ...s })) });
    setEditing(true);
    setExpanded(true);
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setDraft(workflow);
    setEditing(false);
  };

  const saveEdit = (e) => {
    e.stopPropagation();
    onSave(draft);
    setEditing(false);
  };

  const updateStep = (i, field, value) => {
    setDraft(prev => {
      const steps = prev.steps.map((s, idx) => idx === i ? { ...s, [field]: value } : s);
      return { ...prev, steps };
    });
  };

  const addStep = () => {
    setDraft(prev => ({
      ...prev,
      steps: [...prev.steps, { label: 'New step', canAutomate: false, requiresApproval: false }]
    }));
  };

  const removeStep = (i) => {
    setDraft(prev => ({ ...prev, steps: prev.steps.filter((_, idx) => idx !== i) }));
  };

  const displayed = editing ? draft : workflow;

  return (
    <Card className="border">
      <CardContent className="p-4">
        {/* Header row */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={handleToggleExpand}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${MODULE_COLORS[displayed.module] || 'bg-slate-100'}`}>
              <Bot className="w-4 h-4" />
            </div>
            <div>
              {editing ? (
                <Input
                  value={draft.title}
                  onChange={e => setDraft(p => ({ ...p, title: e.target.value }))}
                  className="h-7 text-sm font-semibold px-2 w-52"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm font-semibold">{displayed.title}</p>
              )}
              {editing ? (
                <Select
                  value={draft.module}
                  onValueChange={v => setDraft(p => ({ ...p, module: v }))}
                >
                  <SelectTrigger className="mt-1 h-6 text-xs w-44" onClick={e => e.stopPropagation()}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="property_management">Property Management</SelectItem>
                    <SelectItem value="leasing">Leasing</SelectItem>
                    <SelectItem value="owner_admin">Owner / Admin</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground capitalize">{displayed.module?.replace(/_/g, ' ')}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AutomodeBadge mode={displayed.automationMode} />
            {!editing && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={startEdit}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
            {editing ? (
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={saveEdit}>
                  <Check className="w-3 h-3" /> Save
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={cancelEdit}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
            )}
          </div>
        </div>

        {/* Expanded body */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-2">
            {/* Mode selector */}
            <div className="flex items-center gap-3 mb-3">
              <Label className="text-xs font-semibold w-32 flex-shrink-0">Workflow Mode</Label>
              <Select
                value={editing ? draft.automationMode : workflow.automationMode}
                onValueChange={v => editing
                  ? setDraft(p => ({ ...p, automationMode: v }))
                  : onSave({ ...workflow, automationMode: v })
                }
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approval">Approval Required</SelectItem>
                  <SelectItem value="hybrid">Hybrid Mode</SelectItem>
                  <SelectItem value="full_auto">Full Automation</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Steps */}
            <p className="text-xs font-semibold text-muted-foreground mb-2">Workflow Steps</p>
            <div className="space-y-1.5">
              {displayed.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 py-2 px-2.5 bg-muted/50 rounded-lg"
                >
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground w-5 flex-shrink-0 mt-0.5">{i + 1}.</span>

                  {editing ? (
                    <div className="flex-1 space-y-1.5">
                      <Input
                        value={step.label}
                        onChange={e => updateStep(i, 'label', e.target.value)}
                        className="h-6 text-xs px-2"
                      />
                      <div className="flex items-center gap-4 flex-wrap">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Switch
                            checked={!!step.canAutomate}
                            onCheckedChange={v => updateStep(i, 'canAutomate', v)}
                            className="h-4 w-7 data-[state=checked]:bg-green-600"
                          />
                          <span className="text-xs">Can Automate</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Switch
                            checked={!!step.requiresApproval}
                            onCheckedChange={v => updateStep(i, 'requiresApproval', v)}
                            className="h-4 w-7 data-[state=checked]:bg-amber-500"
                          />
                          <span className="text-xs">Requires Approval</span>
                        </label>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-red-500 hover:bg-red-50 ml-auto"
                          onClick={() => removeStep(i)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between flex-wrap gap-1">
                      <span className="text-xs">{step.label}</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {step.requiresApproval && (
                          <span className="status-pill bg-amber-100 text-amber-700 text-xs">Approval Required</span>
                        )}
                        {step.canAutomate && workflow.automationMode !== 'approval' && (
                          <span className="status-pill bg-green-100 text-green-700 text-xs">Auto-eligible</span>
                        )}
                        {step.canAutomate && workflow.automationMode === 'approval' && (
                          <span className="status-pill bg-slate-100 text-slate-500 text-xs">Auto (paused)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {editing && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full h-8 text-xs border-dashed gap-1"
                onClick={addStep}
              >
                <Plus className="w-3.5 h-3.5" /> Add Step
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}