import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Plus, UserX, UserCheck, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/lib/userContext';
import { ROLES, ROLE_LABELS, getRoleColor } from '@/lib/roles';

function InviteUserDialog({ onInvite }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('sales');
  const [sending, setSending] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setSending(true);
    await onInvite(email, role);
    setEmail(''); setSending(false);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Email Address *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="agent@example.com" /></div>
      <div>
        <Label>Role *</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="sales">Sales Agent</SelectItem>
            <SelectItem value="property_manager">Property Manager</SelectItem>
            <SelectItem value="leasing">Leasing Agent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full bg-primary" disabled={sending}>{sending ? 'Sending...' : 'Send Invitation'}</Button>
    </form>
  );
}

export default function UsersPage() {
  const { userRole } = useUser();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => { loadProfiles(); }, []);

  async function loadProfiles() {
    setLoading(true);
    const data = await base44.entities.UserProfile.list('-created_date', 50);
    setProfiles(data); setLoading(false);
  }

  async function handleInvite(email, role) {
    await base44.users.inviteUser(email, role === 'owner' ? 'admin' : 'user');
    await base44.entities.UserProfile.create({ user_id: 'pending', role, email, status: 'pending', organisation_id: 'default', automation_mode: 'approval' });
    setShowInvite(false); loadProfiles();
  }

  async function handleSuspend(profile) {
    await base44.entities.UserProfile.update(profile.id, { status: profile.status === 'suspended' ? 'active' : 'suspended' });
    loadProfiles();
  }

  if (userRole !== ROLES.OWNER) {
    return (
      <div className="p-6 text-center py-20">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">Access restricted to Owner role only.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-purple-500" />Users & Permissions</h1>
          <p className="text-sm text-muted-foreground">{profiles.length} users in your organisation</p>
        </div>
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogTrigger asChild><Button className="bg-primary"><Plus className="w-4 h-4 mr-2" />Invite User</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Invite New User</DialogTitle></DialogHeader><InviteUserDialog onInvite={handleInvite} /></DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Role Permission Matrix</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">Permission</th>
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <th key={role} className="text-center py-2 px-3 font-semibold"><span className={`status-pill ${getRoleColor(role)}`}>{label}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { perm: 'View all data', owner: true, sales: false, pm: false, leasing: false },
                  { perm: 'Sales module', owner: true, sales: true, pm: false, leasing: false },
                  { perm: 'PM module', owner: true, sales: false, pm: true, leasing: false },
                  { perm: 'Leasing module', owner: true, sales: false, pm: false, leasing: true },
                  { perm: 'Invite users', owner: true, sales: false, pm: false, leasing: false },
                  { perm: 'Manage automation', owner: true, sales: false, pm: false, leasing: false },
                  { perm: 'Configure settings', owner: true, sales: false, pm: false, leasing: false },
                  { perm: 'View audit logs', owner: true, sales: false, pm: false, leasing: false },
                  { perm: 'Approve messages', owner: true, sales: true, pm: true, leasing: true },
                  { perm: 'AI message studio', owner: true, sales: true, pm: true, leasing: true },
                ].map(row => (
                  <tr key={row.perm} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 pr-4">{row.perm}</td>
                    {['owner','sales','pm','leasing'].map(r => (
                      <td key={r} className="text-center py-2 px-3">{row[r] ? <span className="text-green-600 font-bold">✓</span> : <span className="text-muted-foreground/40">—</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Team Members</h2>
        {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
        : profiles.length > 0 ? (
          <div className="space-y-2">
            {profiles.map(profile => (
              <Card key={profile.id} className="border">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{(profile.full_name || profile.email || 'U')[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{profile.full_name || profile.email || 'Pending User'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`status-pill ${getRoleColor(profile.role)}`}>{ROLE_LABELS[profile.role] || profile.role}</span>
                      <span className={`status-pill ${profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{profile.status}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSuspend(profile)}>
                    {profile.status === 'suspended' ? <><UserCheck className="w-3 h-3 mr-1" />Activate</> : <><UserX className="w-3 h-3 mr-1" />Suspend</>}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">No users yet</p>
              <Button className="mt-4 bg-primary" onClick={() => setShowInvite(true)}><Plus className="w-4 h-4 mr-2" />Invite First User</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}