import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import StatusPill from '@/components/ui/StatusPill';
import AutomodeBadge from '@/components/ui/AutomodeBadge';
import {
  Building2, TrendingUp, Eye, Users, Mail, Phone, Calendar, FileText,
  BarChart3, Star, ArrowRight, Search, Filter, Plus, Gavel, Camera,
  Bot, CheckSquare, ChevronDown, ChevronRight, MessageSquare, Upload,
  Download, Zap, AlertCircle, Home, DollarSign, Clock, Share2
} from 'lucide-react';
import { useUser } from '@/lib/userContext';
import { ROLES } from '@/lib/roles';

// ── Sample listing data ──────────────────────────────────────────────────────
const SAMPLE_LISTINGS = [
  {
    id: 'l1', address: '12 Horizon Drive', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026',
    property_type: 'house', bedrooms: 4, bathrooms: 2, car_spaces: 2,
    listing_status: 'listed', asking_price: 2850000, weekly_rent: null,
    agent: 'Sarah Mitchell', days_on_market: 14,
    enquiries: 38, inspections_booked: 22, inspections_attended: 18, offers: 3,
    views_online: 1420, saves: 87,
    buyers: [
      { id: 'b1', name: 'James & Rachel Turner', budget: '2.7m–3.1m', intent: 92, status: 'hot', last_contact: '2 days ago', channel: 'email' },
      { id: 'b2', name: 'Michael Chen', budget: '2.5m–2.9m', intent: 74, status: 'warm', last_contact: '5 days ago', channel: 'sms' },
      { id: 'b3', name: 'Priya Sharma', budget: '2.8m–3.2m', intent: 61, status: 'warm', last_contact: '1 week ago', channel: 'email' },
    ],
    documents: ['Contract of Sale', 'Section 32', 'Building Report', 'Pest Inspection'],
    automation_mode: 'hybrid',
  },
  {
    id: 'l2', address: '7 Coral Court', suburb: 'Manly', state: 'NSW', postcode: '2095',
    property_type: 'apartment', bedrooms: 2, bathrooms: 2, car_spaces: 1,
    listing_status: 'under_offer', asking_price: 1450000,
    agent: 'Tom Nguyen', days_on_market: 28,
    enquiries: 54, inspections_booked: 31, inspections_attended: 27, offers: 1,
    views_online: 2210, saves: 142,
    buyers: [
      { id: 'b4', name: 'Alex & Sam Robertson', budget: '1.3m–1.6m', intent: 98, status: 'hot', last_contact: 'Yesterday', channel: 'email' },
    ],
    documents: ['Contract of Sale', 'OC Certificate', 'Strata Report'],
    automation_mode: 'approval',
  },
  {
    id: 'l3', address: '45 Eucalyptus Rise', suburb: 'Lane Cove', state: 'NSW', postcode: '2066',
    property_type: 'house', bedrooms: 5, bathrooms: 3, car_spaces: 2,
    listing_status: 'pre_market', asking_price: 3200000,
    agent: 'Sarah Mitchell', days_on_market: 0,
    enquiries: 9, inspections_booked: 4, inspections_attended: 0, offers: 0,
    views_online: 340, saves: 21,
    buyers: [
      { id: 'b5', name: 'David Park', budget: '3m–3.5m', intent: 55, status: 'warm', last_contact: '3 days ago', channel: 'phone' },
    ],
    documents: ['Draft Contract'],
    automation_mode: 'approval',
  },
];

const INTENT_COLOR = (score) =>
  score >= 85 ? 'bg-red-100 text-red-700' :
  score >= 65 ? 'bg-amber-100 text-amber-700' :
  'bg-blue-100 text-blue-700';

const STATUS_LISTING_COLOR = {
  pre_market: 'bg-purple-100 text-purple-700',
  listed: 'bg-green-100 text-green-700',
  under_offer: 'bg-amber-100 text-amber-700',
  sold: 'bg-slate-100 text-slate-600',
  withdrawn: 'bg-red-100 text-red-700',
};

// ── Sub-components ────────────────────────────────────────────────────────────
function StatTile({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function BuyerRow({ buyer, listingId }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/40"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
            {buyer.name[0]}
          </div>
          <div>
            <p className="text-sm font-medium">{buyer.name}</p>
            <p className="text-xs text-muted-foreground">Budget {buyer.budget} · Last contact {buyer.last_contact}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-pill text-xs ${INTENT_COLOR(buyer.intent)}`}>
            Intent {buyer.intent}%
          </span>
          <span className={`status-pill text-xs ${buyer.status === 'hot' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
            {buyer.status}
          </span>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>
      {expanded && (
        <div className="px-4 py-3 bg-muted/30 border-t space-y-3">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Shared with this buyer</p>
          <div className="flex flex-wrap gap-2">
            {['Floor plan', 'Building inspection', 'Contract of Sale', 'Price guide'].map(doc => (
              <span key={doc} className="status-pill bg-slate-100 text-slate-700 text-xs">{doc}</span>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Button size="sm" className="h-7 text-xs gap-1"><Mail className="w-3 h-3" /> Draft Email</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><MessageSquare className="w-3 h-3" /> SMS</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Share2 className="w-3 h-3" /> Share Doc</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing, onSelect, selected }) {
  return (
    <Card
      className={`border cursor-pointer transition-all card-hover ${selected ? 'ring-2 ring-primary' : ''}`}
      onClick={() => onSelect(listing)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-semibold text-sm">{listing.address}</p>
            <p className="text-xs text-muted-foreground">{listing.suburb}, {listing.state}</p>
          </div>
          <span className={`status-pill text-xs ${STATUS_LISTING_COLOR[listing.listing_status] || 'bg-slate-100 text-slate-600'}`}>
            {listing.listing_status?.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span>{listing.bedrooms}bd</span>
          <span>{listing.bathrooms}ba</span>
          <span>{listing.car_spaces}car</span>
          <span className="ml-auto font-semibold text-foreground">${(listing.asking_price / 1000000).toFixed(2)}m</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/50 rounded-lg p-1.5">
            <p className="text-sm font-bold">{listing.enquiries}</p>
            <p className="text-xs text-muted-foreground">Enquiries</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-1.5">
            <p className="text-sm font-bold">{listing.inspections_attended}</p>
            <p className="text-xs text-muted-foreground">Attended</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-1.5">
            <p className="text-sm font-bold">{listing.buyers.length}</p>
            <p className="text-xs text-muted-foreground">Buyers</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <AutomodeBadge mode={listing.automation_mode} size="xs" />
          <span className="text-xs text-muted-foreground ml-auto">{listing.days_on_market}d on market</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ListingDetailPanel({ listing }) {
  const [tab, setTab] = useState('overview');
  const [autoMode, setAutoMode] = useState(listing.automation_mode);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold">{listing.address}</h2>
          <p className="text-sm text-muted-foreground">{listing.suburb}, {listing.state} {listing.postcode} · {listing.bedrooms}bd {listing.bathrooms}ba {listing.car_spaces}car</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`status-pill ${STATUS_LISTING_COLOR[listing.listing_status]}`}>
            {listing.listing_status?.replace(/_/g, ' ')}
          </span>
          <span className="font-bold text-lg">${(listing.asking_price / 1000000).toFixed(2)}m</span>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-lg">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'performance', label: 'Performance' },
            { key: 'buyers', label: `Buyers (${listing.buyers.length})` },
            { key: 'inspections', label: 'Inspections' },
            { key: 'documents', label: 'Documents' },
            { key: 'enquiries', label: 'Enquiries' },
            { key: 'automation', label: 'Automation' },
          ].map(t => (
            <TabsTrigger key={t.key} value={t.key} className="text-xs h-7">{t.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="Online Views" value={listing.views_online.toLocaleString()} icon={Eye} color="bg-blue-500" />
            <StatTile label="Saves / Watches" value={listing.saves} icon={Star} color="bg-amber-500" />
            <StatTile label="Total Enquiries" value={listing.enquiries} icon={MessageSquare} color="bg-green-500" />
            <StatTile label="Inspections" value={listing.inspections_attended} icon={Calendar} color="bg-purple-500" />
          </div>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Agent</span>
                <span className="font-medium">{listing.agent}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Days on Market</span>
                <span className="font-medium">{listing.days_on_market}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Buyers</span>
                <span className="font-medium">{listing.buyers.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Offers Received</span>
                <span className="font-medium">{listing.offers}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERFORMANCE */}
        <TabsContent value="performance" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Views" value={listing.views_online} icon={Eye} color="bg-blue-500" />
            <StatTile label="Saves" value={listing.saves} icon={Star} color="bg-amber-500" />
            <StatTile label="Enquiries" value={listing.enquiries} icon={MessageSquare} color="bg-green-500" />
            <StatTile label="Inspections Booked" value={listing.inspections_booked} icon={Calendar} color="bg-teal-500" />
            <StatTile label="Inspections Attended" value={listing.inspections_attended} icon={CheckSquare} color="bg-purple-500" />
            <StatTile label="Offers" value={listing.offers} icon={DollarSign} color="bg-red-500" />
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Engagement Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: 'Enquiry rate', value: Math.round((listing.enquiries / listing.views_online) * 100) },
                  { label: 'Inspection conversion', value: Math.round((listing.inspections_attended / listing.enquiries) * 100) },
                  { label: 'Offer conversion', value: listing.inspections_attended > 0 ? Math.round((listing.offers / listing.inspections_attended) * 100) : 0 },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium">{m.value}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(m.value, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BUYERS / LEAD MANAGEMENT */}
        <TabsContent value="buyers" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Buyer leads with intent scoring and shared document history</p>
            <Button size="sm" variant="outline" className="gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Add Buyer</Button>
          </div>
          {listing.buyers.map(b => <BuyerRow key={b.id} buyer={b} listingId={listing.id} />)}

          {/* Lead overlap notice */}
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800">Lead Overlap Detected</p>
                <p className="text-xs text-amber-700 mt-0.5">Michael Chen is also in Tom Nguyen's pipeline for 7 Coral Court. Resolve ownership below.</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="h-7 text-xs">Claim Lead</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs">Transfer to Tom</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INSPECTIONS & AUCTION */}
        <TabsContent value="inspections" className="space-y-3 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Booked" value={listing.inspections_booked} icon={Calendar} color="bg-blue-500" />
            <StatTile label="Attended" value={listing.inspections_attended} icon={CheckSquare} color="bg-green-500" />
            <StatTile label="No-shows" value={listing.inspections_booked - listing.inspections_attended} icon={Clock} color="bg-red-500" />
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Gavel className="w-4 h-4" /> Auction Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Registered Bidders</span>
                <span className="font-semibold">—</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pre-auction offers</span>
                <span className="font-semibold">{listing.offers}</span>
              </div>
              <Button size="sm" variant="outline" className="w-full text-xs mt-2 gap-1"><Gavel className="w-3.5 h-3.5" /> Schedule Auction</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Listing Documents</p>
            <Button size="sm" variant="outline" className="gap-1 text-xs"><Upload className="w-3.5 h-3.5" /> Upload</Button>
          </div>
          <div className="space-y-2">
            {listing.documents.map(doc => (
              <div key={doc} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{doc}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1"><Download className="w-3 h-3" /> Download</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1"><Share2 className="w-3 h-3" /> Share</Button>
                </div>
              </div>
            ))}
          </div>
          <Card className="border-dashed">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Document requests from buyers appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENQUIRIES */}
        <TabsContent value="enquiries" className="space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Total Enquiries" value={listing.enquiries} icon={MessageSquare} color="bg-green-500" />
            <StatTile label="Mortgage Broker Leads" value={Math.floor(listing.enquiries * 0.18)} icon={DollarSign} color="bg-blue-500" />
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Enquiries</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {listing.buyers.map((b, i) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.channel} · {b.last_contact}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs">Follow Up</Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-600" /> Mortgage Broker Leads</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">Enquiries flagged as potential finance referrals</p>
              <Button size="sm" variant="outline" className="w-full text-xs">View Mortgage Leads</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUTOMATION */}
        <TabsContent value="automation" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bot className="w-4 h-4 text-blue-500" /> Automation Mode for this Listing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <AutomodeBadge mode={autoMode} />
                <Select value={autoMode} onValueChange={setAutoMode}>
                  <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_auto">Full Automation</SelectItem>
                    <SelectItem value="hybrid">Hybrid Mode</SelectItem>
                    <SelectItem value="approval">Approval Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {[
                { label: 'Auto-reply to enquiries', key: 'reply' },
                { label: 'Send inspection reminders', key: 'reminder' },
                { label: 'Post-inspection follow-up', key: 'followup' },
                { label: 'Share documents on request', key: 'docs' },
                { label: 'Buyer intent re-scoring', key: 'intent' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm">{item.label}</span>
                  <Switch defaultChecked={autoMode !== 'approval'} />
                </div>
              ))}
              <Button className="w-full text-xs gap-1 mt-2"><CheckSquare className="w-3.5 h-3.5" /> Save Automation Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SalesListingsPage() {
  const { userRole, currentUser } = useUser();
  const [listings] = useState(SAMPLE_LISTINGS);
  const [selectedListing, setSelectedListing] = useState(SAMPLE_LISTINGS[0]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = listings.filter(l => {
    const matchesSearch = l.address.toLowerCase().includes(search.toLowerCase()) || l.suburb.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.listing_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalEnquiries = listings.reduce((a, l) => a + l.enquiries, 0);
  const totalBuyers = listings.reduce((a, l) => a + l.buyers.length, 0);
  const totalViews = listings.reduce((a, l) => a + l.views_online, 0);

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" /> Sales Listings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">All active listings, buyer leads, analytics and automations</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> New Listing</Button>
      </div>

      {/* Agency-wide stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Active Listings" value={listings.filter(l => l.listing_status === 'listed').length} icon={Home} color="bg-blue-500" />
        <StatTile label="Total Enquiries" value={totalEnquiries} icon={MessageSquare} color="bg-green-500" />
        <StatTile label="Active Buyers" value={totalBuyers} icon={Users} color="bg-purple-500" />
        <StatTile label="Online Views" value={totalViews.toLocaleString()} icon={Eye} color="bg-amber-500" />
      </div>

      {/* Main split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Listing list */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search listings…"
                className="pl-8 h-8 text-xs"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pre_market">Pre-Market</SelectItem>
                <SelectItem value="listed">Listed</SelectItem>
                <SelectItem value="under_offer">Under Offer</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {filtered.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onSelect={setSelectedListing}
                selected={selectedListing?.id === listing.id}
              />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selectedListing ? (
            <ListingDetailPanel listing={selectedListing} />
          ) : (
            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-xl text-muted-foreground text-sm">
              Select a listing to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}