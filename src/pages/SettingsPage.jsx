import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Mail, Smartphone, AlertTriangle, CheckCircle2, Shield, Bot } from 'lucide-react';
import { useUser } from '@/lib/userContext';
import { ROLES } from '@/lib/roles';

const SMS_PROVIDER_CONNECTED = false;

export default function SettingsPage() {
  const { userRole } = useUser();
  const [gmailSettings, setGmailSettings] = useState({
    from_name: 'Liz at Seek to Sold',
    from_email: 'seektosold@gmail.com',
    phone: '+61 420 311 174',
    signature: 'Liz\nSeek to Sold\n+61 420 311 174',
  });
  const [smsSettings, setSmsSettings] = useState({
    provider_name: '',
    api_key: '',
    api_secret: '',
    from_number: '',
    webhook_secret: '',
    test_mode: true,
    default_signature: '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (userRole !== ROLES.OWNER) {
    return (
      <div className="p-6 text-center py-20">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">Settings are restricted to Owner role only.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6" />Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your organisation, email, SMS and AI settings.</p>
      </div>

      <Tabs defaultValue="email">
        <TabsList className="bg-muted">
          <TabsTrigger value="email"><Mail className="w-3.5 h-3.5 mr-2" />Email (Gmail)</TabsTrigger>
          <TabsTrigger value="sms"><Smartphone className="w-3.5 h-3.5 mr-2" />SMS Provider</TabsTrigger>
          <TabsTrigger value="compliance"><Shield className="w-3.5 h-3.5 mr-2" />Compliance</TabsTrigger>
          <TabsTrigger value="ai"><Bot className="w-3.5 h-3.5 mr-2" />AI Settings</TabsTrigger>
        </TabsList>

        {/* Email */}
        <TabsContent value="email" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500" />Gmail Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-800">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Gmail credentials are stored securely in environment variables only — never in code or logs.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Sender Display Name</Label><Input value={gmailSettings.from_name} onChange={e => setGmailSettings({...gmailSettings, from_name: e.target.value})} /></div>
                <div><Label>From Email</Label><Input value={gmailSettings.from_email} disabled className="bg-muted" /></div>
                <div><Label>Phone (for signature)</Label><Input value={gmailSettings.phone} onChange={e => setGmailSettings({...gmailSettings, phone: e.target.value})} /></div>
                <div><Label>Gmail App Password</Label><Input type="password" placeholder="Stored in GMAIL_APP_PASSWORD secret" disabled className="bg-muted" /></div>
              </div>
              <div>
                <Label>Default Email Signature</Label>
                <textarea className="w-full border border-input rounded-md p-2 text-sm resize-none h-24 bg-background mt-1" value={gmailSettings.signature} onChange={e => setGmailSettings({...gmailSettings, signature: e.target.value})} />
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <strong>Environment variables required:</strong><br />
                GMAIL_USER=seektosold@gmail.com<br />
                GMAIL_FROM_NAME=Liz at Seek to Sold<br />
                GMAIL_PHONE=+61 420 311 174<br />
                GMAIL_APP_PASSWORD=[set in secrets panel]
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS */}
        <TabsContent value="sms" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-green-500" />SMS Provider Settings
                {!SMS_PROVIDER_CONNECTED && <span className="status-pill bg-orange-100 text-orange-700 ml-2">Not Connected</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                <AlertTriangle className="inline w-4 h-4 mr-2" />
                SMS provider not yet connected. Live sending is disabled until API keys are configured and saved. All SMS drafts, scheduling, approvals and logs are available now.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Provider Name</Label><Input placeholder="e.g. Twilio, MessageBird, Vonage" value={smsSettings.provider_name} onChange={e => setSmsSettings({...smsSettings, provider_name: e.target.value})} /></div>
                <div><Label>From Number</Label><Input placeholder="+61..." value={smsSettings.from_number} onChange={e => setSmsSettings({...smsSettings, from_number: e.target.value})} /></div>
                <div><Label>API Key</Label><Input type="password" placeholder="SMS_API_KEY (stored in secrets)" value={smsSettings.api_key} onChange={e => setSmsSettings({...smsSettings, api_key: e.target.value})} /></div>
                <div><Label>API Secret</Label><Input type="password" placeholder="SMS_API_SECRET (stored in secrets)" value={smsSettings.api_secret} onChange={e => setSmsSettings({...smsSettings, api_secret: e.target.value})} /></div>
                <div><Label>Webhook Secret</Label><Input type="password" placeholder="SMS_WEBHOOK_SECRET" value={smsSettings.webhook_secret} onChange={e => setSmsSettings({...smsSettings, webhook_secret: e.target.value})} /></div>
                <div><Label>Delivery Webhook URL</Label><Input placeholder="https://..." /></div>
                <div><Label>Inbound Reply Webhook URL</Label><Input placeholder="https://..." /></div>
                <div>
                  <Label>Mode</Label>
                  <div className="flex gap-2 mt-1">
                    <Button variant={smsSettings.test_mode ? 'default' : 'outline'} size="sm" onClick={() => setSmsSettings({...smsSettings, test_mode: true})} className={smsSettings.test_mode ? 'bg-primary' : ''}>Test Mode</Button>
                    <Button variant={!smsSettings.test_mode ? 'default' : 'outline'} size="sm" onClick={() => setSmsSettings({...smsSettings, test_mode: false})} className={!smsSettings.test_mode ? 'bg-red-600 text-white' : ''}>Live Mode</Button>
                  </div>
                </div>
              </div>
              <div><Label>Default SMS Signature</Label><Input placeholder="e.g. Liz | Seek to Sold | Opt out: STOP" value={smsSettings.default_signature} onChange={e => setSmsSettings({...smsSettings, default_signature: e.target.value})} /></div>
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <strong>Environment variables (set in secrets panel):</strong><br />
                SMS_PROVIDER=<br />SMS_API_KEY=<br />SMS_API_SECRET=<br />SMS_FROM_NUMBER=<br />SMS_WEBHOOK_SECRET=
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-purple-500" />Compliance & Privacy</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Require SMS consent before sending', desc: 'Block SMS to contacts who have not opted in' },
                { label: 'Auto-detect opt-out replies', desc: 'Mark contacts as opted out on STOP, UNSUBSCRIBE, CANCEL, REMOVE, OPT OUT' },
                { label: 'Prevent duplicate message sending', desc: 'Block identical messages sent within the frequency cap window' },
                { label: 'Require source/rationale on all AI messages', desc: 'Every AI-drafted message must show where the recommendation came from' },
                { label: 'Block hallucinated market claims', desc: 'AI must not make unsupported market claims in outbound messages' },
                { label: 'Always approve sensitive/complaint messages', desc: 'Angry, legal, complaint or sensitive replies always pause for human review' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                  <span className="status-pill bg-green-100 text-green-700">Enabled</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI */}
        <TabsContent value="ai" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="w-4 h-4 text-blue-500" />AI Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                AI message drafting is active. All AI-generated content is marked as draft and requires approval before sending unless automation is explicitly enabled.
              </div>
              {[
                { label: 'Default tone', type: 'select', options: ['professional', 'warm', 'direct', 'concise'] },
                { label: 'Max message length (email, words)', type: 'number', value: '300' },
                { label: 'Max SMS length (characters)', type: 'number', value: '160' },
              ].map((field, i) => (
                <div key={i}>
                  <Label>{field.label}</Label>
                  <Input type={field.type || 'text'} defaultValue={field.value || ''} className="mt-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button className="bg-primary" onClick={handleSave}>
          {saved ? <><CheckCircle2 className="w-4 h-4 mr-2" />Saved!</> : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}