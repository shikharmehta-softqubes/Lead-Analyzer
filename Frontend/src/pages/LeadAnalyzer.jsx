import React, { useEffect, useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Copy,
  Check,
  Edit2,
  Eye,
  FileText,
  Filter,
  LayoutList,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  Smartphone,
  Target,
  Trash2,
  TrendingUp,
  User,
  X,
  Zap,
  Flag,
  AlertTriangle,
  Milestone,
  CheckCircle,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';

const demoLeads = [
  {
    LeadID: 'DEMO-10001',
    LeadNo: 'LEAD-10001',
    CompanyName: 'TechVision Global',
    FirstName: 'Sarah',
    LastName: 'Connor',
    MobileNo: '+1 (555) 010-1001',
    Email: 'sarah@techvision.example',
    City: 'Austin',
    State: 'Texas',
    Country: 'USA',
    Lead_Status_Term: 'Analyzing',
    Status: 'Pending',
    Lead_Source_Term: 'RFP',
    LeadRatings: 85,
    Priority: 'High',
    Comment: 'Analyzing engagement patterns and proposal fit.',
    GroupType: 'Corporate',
    SubmittedBy: 'Website',
    CreatedOn: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    LastActivityDate: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    IsActive: true,
  },
  {
    LeadID: 'DEMO-10002',
    LeadNo: 'LEAD-10002',
    CompanyName: 'Summit Group',
    FirstName: 'Mike',
    LastName: 'Johnson',
    MobileNo: '+1 (555) 010-1002',
    Email: 'mike@summit.example',
    City: 'Denver',
    State: 'Colorado',
    Country: 'USA',
    Lead_Status_Term: 'Scored',
    Status: 'Follow-up',
    Lead_Source_Term: 'Group Deal',
    LeadRatings: 62,
    Priority: 'Medium',
    Comment: 'Send updated pricing sheet.',
    GroupType: 'Association',
    SubmittedBy: 'Email',
    CreatedOn: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    IsActive: true,
  },
];

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const displayValue = (value) => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value === null || value === undefined || value === '') return '-';
  return value;
};

const getNurtureStatus = (createdOn, lastActivityDate) => {
  if (!createdOn) return { isStale: false, needsNurture: false };

  const now = new Date();
  const created = new Date(createdOn);
  const activity = new Date(lastActivityDate || createdOn);

  const diffCreatedMin = (now - created) / (1000 * 60);
  const diffActivityMin = (now - activity) / (1000 * 60);

  return {
    isStale: diffCreatedMin >= 1,
    needsNurture: diffActivityMin >= 1,
    ageMin: Math.floor(diffCreatedMin),
    inactiveMin: Math.floor(diffActivityMin)
  };
};

const formatDuration = (totalMinutes) => {
  if (totalMinutes < 1) return 'just now';

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = Math.floor(totalMinutes % 60);

  const parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);

  return parts.length > 0 ? parts.join(' ') : 'just now';
};

const normalizeLead = (lead, index) => {
  const nurture = getNurtureStatus(lead.CreatedOn, lead.LastActivityDate);
  const inputDetails = lead.InputDetails || {};
  const preferredMethod = inputDetails.contactMethod || (lead.Email ? 'Email' : 'Phone');

  return {
    id: lead.LeadID || lead._id || `TEMP-${index + 1}`,
    leadNo: lead.LeadNo || `LEAD-${index + 1}`,
    companyName: lead.CompanyName || 'Unnamed Company',
    contactName: [lead.FirstName, lead.LastName].filter(Boolean).join(' ') || 'Unnamed Contact',
    email: lead.Email || '-',
    mobileNo: lead.MobileNo || lead.TelephoneNo || '-',
    city: [lead.City, lead.State, lead.Country].filter(Boolean).join(', ') || '-',
    type: lead.GroupType || lead.Lead_Source_Term || 'Lead',
    source: lead.Lead_Source_Term || '-',
    status: lead.Status || 'Pending',
    priority: lead.Priority || 'Standard',
    score: Number(lead.LeadRatings || 0),
    action: lead.AIRecommendation || lead.Comment || 'Run AI analysis for recommended next action.',
    actions: (lead.AIRecommendations && lead.AIRecommendations.length > 0) 
      ? lead.AIRecommendations 
      : (lead.AIRecommendation ? [lead.AIRecommendation] : ['Run AI analysis for recommended next action.']),
    createdOn: lead.CreatedOn,
    lastActivityDate: lead.LastActivityDate,
    nurture,
    preferredMethod,
    isActive: lead.IsActive,
    raw: lead,
  };
};

const getScoreBadge = (score) => {
  if (score > 80) {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
  }
  if (score >= 50) {
    return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
  }
  return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
};

const WinProbabilityGauge = ({ probability }) => {
  const radius = 42;
  const circumference = Math.PI * radius;
  const offset = circumference - (probability / 100) * circumference;

  const getGaugeColor = (score) => {
    if (score > 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getTextColor = (score) => {
    if (score > 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  return (
    <div className="relative w-48 mx-auto mb-4">
      <svg viewBox="0 0 100 55" className="w-full">
        {/* Background track */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          className="text-slate-100 dark:text-dark-800"
        />
        {/* Progress track */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${getGaugeColor(probability)} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center">
        <span className={`text-3xl font-black leading-none ${getTextColor(probability)}`}>{probability}%</span>
        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Win Likelihood</span>
      </div>
    </div>
  );
};

const RoadmapToClose = ({ steps, score = 0 }) => (
  <div className="space-y-4">
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
      <Milestone size={14} className="text-primary-500" />
      Roadmap to Close
    </h4>
    <div className="relative pl-6 space-y-6">
      {/* Background line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-dark-800"></div>
      {/* Progress line */}
      <div
        className="absolute left-[11px] top-2 w-0.5 bg-primary-500 transition-all duration-1000 ease-out"
        style={{ height: `calc(${score}% * 0.9 + 2px)`, maxHeight: 'calc(100% - 12px)' }}
      ></div>

      {steps.map((step, i) => (
        <div key={i} className="relative">
          <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-dark-900 transition-colors duration-500 ${step.done ? 'bg-primary-500' : 'bg-slate-300 dark:bg-dark-700'}`}></div>
          <div className="flex flex-col gap-1">
            <p className={`text-sm font-bold transition-colors ${step.done ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>{step.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LeadDetailSection = ({ title, fields }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="rounded-lg border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-dark-800/50 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </h3>
        <div className="text-slate-400">
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {fields.map((field) => (
              <div key={field.label} className="rounded-lg border border-slate-100 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-800/30 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{field.label}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 break-words">
                  {displayValue(field.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const EmailModal = ({
  lead,
  onClose,
  onAnalyze,
  analyzingId,
  onGenerateEmail,
  generatingEmail,
  generatedEmail,
  onEmailChange,
  customOffer,
  onCustomOfferChange,
  generatingSms,
  generatedSms,
  sendingEmail,
  hotelOffer,
  allHotelOffers,
  onHotelChange,
  onSendEmail
}) => {
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState(hotelOffer?.HotelOfferID || '');
  const [selectedOffer, setSelectedOffer] = useState('');

  const currentHotel = allHotelOffers.find(h => h.HotelOfferID === selectedHotelId) || hotelOffer;

  const availableOffers = useMemo(() => {
    if (!currentHotel) return [];
    const offers = [];
    if (currentHotel.DefaultOffer) {
      offers.push({ label: 'Default Offer', value: currentHotel.DefaultOffer });
    }
    const rule = currentHotel.OfferRules?.find(r => r.leadSegment === lead.raw.AISegment);
    if (rule) {
      if (rule.initialOffer) offers.push({ label: 'Initial Lead Offer', value: rule.initialOffer });
      if (rule.followUpOffer) offers.push({ label: 'Follow-up Offer', value: rule.followUpOffer });
    }
    return offers;
  }, [currentHotel, lead.raw.AISegment]);

  useEffect(() => {
    if (!selectedHotelId && allHotelOffers.length > 0) {
      const firstHotel = allHotelOffers[0];
      setSelectedHotelId(firstHotel.HotelOfferID);
      onHotelChange(firstHotel.HotelOfferID);
    } else if (hotelOffer?.HotelOfferID && !selectedHotelId) {
      setSelectedHotelId(hotelOffer.HotelOfferID);
    }
  }, [hotelOffer, selectedHotelId, allHotelOffers, onHotelChange]);

  useEffect(() => {
    if (!selectedOffer && availableOffers.length > 0) {
      const firstOffer = availableOffers[0].value;
      setSelectedOffer(firstOffer);
      onCustomOfferChange(firstOffer);
      onGenerateEmail(firstOffer);
    } else if (lead.raw.AppliedOffer?.offerText && !selectedOffer) {
      setSelectedOffer(lead.raw.AppliedOffer.offerText);
    }
  }, [lead.raw.AppliedOffer, selectedOffer, availableOffers, onCustomOfferChange, onGenerateEmail]);

  if (!lead) return null;

  const raw = lead.raw;
  const inputDetails = raw.InputDetails || {};
  const contactFields = [
    { label: 'Lead No', value: raw.LeadNo },
    { label: 'Title', value: raw.Title },
    { label: 'First Name', value: raw.FirstName },
    { label: 'Last Name', value: raw.LastName },
    { label: 'Company Name', value: raw.CompanyName },
    { label: 'Email', value: raw.Email },
    { label: 'Telephone No', value: raw.TelephoneNo },
    { label: 'Mobile No', value: raw.MobileNo },
    { label: 'Website', value: raw.Website },
    { label: 'Ext', value: raw.Ext },
  ];

  const addressFields = [
    { label: 'Address', value: raw.Address },
    { label: 'Street', value: raw.Street },
    { label: 'City', value: raw.City },
    { label: 'State', value: raw.State },
    { label: 'Country', value: raw.Country },
    { label: 'Zipcode', value: raw.Zipcode },
  ];

  const crmFields = [
    { label: 'Lead Status', value: raw.Status || 'Pending' },
    { label: 'AI Processing Status', value: raw.Lead_Status_Term },
    { label: 'Lead Source', value: raw.Lead_Source_Term },
    { label: 'Lead Rating', value: raw.LeadRatings ? `${raw.LeadRatings}%` : raw.LeadRatings },
    { label: 'AI Segment', value: raw.AISegment },
    { label: 'AI Score Updated', value: formatDate(raw.AIScoreUpdatedOn) },
    { label: 'Priority', value: raw.Priority },
    { label: 'Is Active', value: raw.IsActive },
    { label: 'Is Converted Account', value: raw.IsConvertAcc },
    { label: 'Is Group', value: raw.IsGroup },
    { label: 'Group Type', value: raw.GroupType },
    { label: 'Submitted By', value: raw.SubmittedBy },
    { label: 'Seq No', value: raw.SeqNo },
  ];

  const ownershipFields = [
    { label: 'Client ID', value: raw.ClientID },
    { label: 'Owner ID', value: raw.OwnerID },
    { label: 'Account ID', value: raw.AccountID },
    { label: 'Property ID', value: raw.PropertyID },
    { label: 'Territerly ID', value: raw.TerriterlyID },
    { label: 'DOS ID', value: raw.DOSID },
    { label: 'Reference Item', value: raw.ReferenceItem },
    { label: 'Reference By', value: raw.ReferenceBy },
  ];

  const timelineFields = [
    { label: 'Created On', value: formatDate(raw.CreatedOn) },
    { label: 'Last Contacted On', value: formatDate(raw.LastContactedOn) },
    { label: 'Last Contacted By', value: raw.LastContactedBy },
    { label: 'Last Activity Date', value: formatDate(raw.LastActivityDate) },
    { label: 'Thread ID', value: raw.ThreadID },
    { label: 'Thread Update On', value: formatDate(raw.ThreadUpdateOn) },
  ];

  const inputFields = [
    { label: 'Event Purpose', value: inputDetails.eventPurpose },
    { label: 'Guest Count', value: inputDetails.guestCount },
    { label: 'Rooms Count', value: inputDetails.roomsCount },
    { label: 'Start Date', value: formatDate(inputDetails.startDate) },
    { label: 'End Date', value: formatDate(inputDetails.endDate) },
    { label: 'Budget Range', value: inputDetails.budgetRange },
    { label: 'Preferred Location', value: inputDetails.preferredLocation },
    { label: 'Decision Timeline', value: inputDetails.decisionTimeline },
    { label: 'Contact Method', value: inputDetails.contactMethod },
  ];

  const allDetailsFields = [
    ...contactFields,
    ...inputFields,
    ...addressFields,
    ...crmFields,
    ...ownershipFields,
    ...timelineFields,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-dark-700 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-500/10 text-xs font-bold text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20">
              {lead.leadNo}
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{lead.companyName}</h2>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <p className="text-lg text-slate-500 dark:text-slate-400">{lead.contactName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800"
            title="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* AI Predictive Analytics Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 p-6 shadow-sm">
                <WinProbabilityGauge probability={lead.score > 0 ? lead.score : 75} />

                <div className="space-y-4 mt-6">
                  {((lead.raw.AISignals && lead.raw.AISignals.length > 0) || lead.score >= 60) && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                      <Flag size={16} className="text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">Green Flag</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          {lead.raw.AISignals?.[0] || "Consistent response patterns detected in history."}
                        </p>
                      </div>
                    </div>
                  )}
                  {((lead.raw.AIRisks && lead.raw.AIRisks.length > 0) || lead.score <= 50) && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                      <AlertTriangle size={16} className="text-rose-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">Risk Factor</p>
                        <p className="text-xs text-rose-700 dark:text-rose-400">
                          {lead.raw.AIRisks?.[0] || "Budget constraints mentioned in last touchpoint."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <RoadmapToClose
                score={lead.score}
                steps={[
                  { label: 'Initial Engagement', description: 'Lead successfully responded to first AI draft.', done: lead.score >= 25 },
                  { label: 'Hotel Offer Resolution', description: 'Negotiate the seasonal group rate offer.', done: lead.score >= 50 },
                  { label: 'Contracting Phase', description: 'Send agreement and finalize dates.', done: lead.score >= 75 },
                  { label: 'Closing', description: 'Confirm deposit and welcome guest.', done: lead.score >= 95 },
                ]}
              />
            </div>

            {/* Email Drafting Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 p-5 shadow-sm overflow-hidden relative">
                {/* Dynamic Progress Background */}
                <div
                  className={`absolute top-0 left-0 h-full opacity-[0.03] dark:opacity-[0.07] transition-all duration-1000 ease-out ${lead.score > 80 ? 'bg-emerald-500' : lead.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  style={{ width: `${lead.score}%` }}
                ></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-black border ${getScoreBadge(lead.score)}`}>
                        {lead.score}% AI PROBABILITY
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live Analysis</span>
                    </div>
                  </div>

                  {/* Subtle Progress Bar */}
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full transition-all duration-1000 ease-out ${lead.score > 80 ? 'bg-emerald-500' : lead.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      style={{ width: `${lead.score}%` }}
                    ></div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <Zap size={14} className="text-indigo-500" />
                      Next Best Action
                    </h4>
                    <div className="space-y-1">
                      {lead.actions.map((action, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
                            idx === 1 ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : 'hover:bg-slate-50 dark:hover:bg-dark-800/50'
                          }`}
                        >
                          <Zap size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                            {action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <section className="animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
                  <Mail size={14} />
                  AI Generated Email Draft
                </h3>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Configured Hotel
                    </label>
                    <select
                      value={selectedHotelId}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setSelectedHotelId(newId);
                        setSelectedOffer('');
                        onHotelChange(newId);
                      }}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                    >
                      <option value="">Select a hotel...</option>
                      {allHotelOffers.map(hotel => (
                        <option key={hotel.HotelOfferID} value={hotel.HotelOfferID}>
                          {hotel.HotelName} ({hotel.HotelCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Select Offer
                    </label>
                    <select
                      value={selectedOffer}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedOffer(val);
                        onCustomOfferChange(val);
                        onGenerateEmail(val);
                      }}
                      disabled={!selectedHotelId}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-dark-900/50"
                    >
                      <option value="">Select an offer...</option>
                      {availableOffers.map((off, idx) => (
                        <option key={idx} value={off.value}>{off.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedOffer && (
                  <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase mb-1">Applied Offer:</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 italic">"{selectedOffer}"</p>
                  </div>
                )}
                {generatingEmail ? (
                  <div className="rounded-lg border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800/50 p-6 space-y-4">
                    <div className="h-4 bg-slate-200 dark:bg-dark-700 rounded w-1/4 animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="h-3 bg-slate-200 dark:bg-dark-700 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-slate-200 dark:bg-dark-700 rounded w-5/6 animate-pulse"></div>
                      <div className="h-3 bg-slate-200 dark:bg-dark-700 rounded w-full animate-pulse"></div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800/50 p-4">
                    <textarea
                      value={generatedEmail}
                      onChange={(e) => onEmailChange(e.target.value)}
                      className="w-full h-48 p-3 rounded-lg border border-slate-200 dark:border-dark-600 bg-white dark:bg-dark-900 text-sm text-slate-700 dark:text-slate-300 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Edit the AI-generated email draft..."
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => onSendEmail(generatedEmail, lead.email)}
                        disabled={sendingEmail || !generatedEmail}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 text-sm font-bold shadow-md shadow-emerald-500/20"
                      >
                        {sendingEmail ? 'Sending...' : 'Send to Lead'}
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>

          <LeadDetailSection title="Contact Details" fields={allDetailsFields} />

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Comment
            </h3>
            <div className="rounded-lg border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800/50 p-3">
              <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                {displayValue(raw.Comment)}
              </p>
            </div>
          </section>

          <div className="h-2 shrink-0"></div>
        </div>
      </div>
    </div>
  );
};

const PhoneModal = ({ lead, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-dark-700">
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
            <Phone size={36} className="animate-bounce" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{lead.contactName}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{lead.companyName}</p>
          </div>
          <div className="py-4 px-6 rounded-2xl bg-slate-50 dark:bg-dark-800 border border-slate-100 dark:border-dark-700">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Direct Line</p>
            <p className="text-3xl font-black text-primary-600 dark:text-primary-400 tracking-tight">{lead.mobileNo}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <a
              href={`tel:${lead.mobileNo}`}
              className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Phone size={18} /> Call Now
            </a>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-dark-700 transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TextModal = ({ lead, onClose, generatedSms, generatingSms }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-dark-700">
        <div className="p-6 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Text Follow-up</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{lead.mobileNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-dark-800 text-slate-400 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Suggested Message</label>
            <div className="relative group">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 text-slate-700 dark:text-slate-200 text-sm leading-relaxed italic">
                {generatingSms ? 'Generating AI message...' : generatedSms}
              </div>
              {!generatingSms && (
                <button
                  onClick={() => navigator.clipboard.writeText(generatedSms)}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-white dark:bg-dark-800 border border-indigo-100 dark:border-indigo-800 text-indigo-500 hover:bg-indigo-50 shadow-sm transition-all active:scale-90"
                  title="Copy to clipboard"
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800/50 flex gap-3">
            <AlertCircle size={18} className="text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-tight font-medium">
              Standard messaging rates apply. You can copy the message above and send it via your corporate mobile device.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-dark-800/50 border-t border-slate-100 dark:border-dark-800 flex justify-end gap-3">
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const LeadAnalyzer = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedLeadDetail, setSelectedLeadDetail] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'email', 'phone', 'text'
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [customOffer, setCustomOffer] = useState('');
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [generatedSms, setGeneratedSms] = useState('');
  const [generatingSms, setGeneratingSms] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);
  const [currentHotelOffer, setCurrentHotelOffer] = useState(null);
  const [allHotelOffers, setAllHotelOffers] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([{ id: 'score', desc: true }]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({
    email: false,
    city: false,
    createdOn: false,
    needsNurture: false,
    isStale: false,
  });
  const [paginationInfo, setPaginationInfo] = useState(null);

  const loadLeads = async (page = 1, limit = 50) => {
    setLoading(true);
    try {
      const response = await api.get(`/leads?page=${page}&limit=${limit}`);
      const data = response.data;

      // Handle both paginated and non-paginated responses for backward compatibility
      const leadsArray = data.leads || data;
      const nextLeads = leadsArray.length ? leadsArray : demoLeads;

      setLeads(nextLeads.map(normalizeLead));

      // Store pagination info if available
      if (data.pagination) {
        setPaginationInfo(data.pagination);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
      setLeads(demoLeads.map(normalizeLead));
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    loadLeads();

    const handleLeadCreated = () => loadLeads();
    window.addEventListener('lead-created', handleLeadCreated);

    // Handle auto-opening from Dashboard
    if (location.state?.leadId) {
      const timer = setTimeout(() => {
        handleRowClick(location.state.leadId, location.state.openModal || 'email');
        // Clear state so it doesn't reopen on refresh
        window.history.replaceState({}, document.title);
      }, 500); // Small delay to let leads load
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('lead-created', handleLeadCreated);
  }, [location.state]);

  const selectedLead = useMemo(
    () => {
      const listLead = leads.find((lead) => lead.id === selectedLeadId) || null;
      return selectedLeadDetail ? normalizeLead(selectedLeadDetail, 0) : listLead;
    },
    [leads, selectedLeadDetail, selectedLeadId],
  );

  const handleRowClick = (leadId, modalType = 'email') => {
    setSelectedLeadId(leadId);
    setActiveModal(modalType);
    setGeneratedEmail('');
    setCustomOffer('');
    setGeneratedSms('');

    // Auto-trigger generation for email/text
    if (modalType === 'email' || modalType === 'text') {
      setShouldAutoGenerate(true);
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedLeadId(null);
    setSelectedLeadDetail(null);
    setGeneratedEmail('');
    setCustomOffer('');
    setGeneratedSms('');
    setShouldAutoGenerate(false);
    setCurrentHotelOffer(null);
  };

  useEffect(() => {
    if (!selectedLeadId) return;

    const fetchHotelOffers = async () => {
      try {
        const response = await api.get('/hotel-offers');
        const hotels = response.data || [];
        setAllHotelOffers(hotels);

        const lead = leads.find(l => l.id === selectedLeadId);
        if (lead?.raw) {
          const hotel = hotels.find(h =>
            h.HotelOfferID === lead.raw.SelectedHotelOfferID ||
            (lead.raw.PropertyID && h.HotelCode === lead.raw.PropertyID)
          ) || (hotels.length > 0 ? hotels[0] : null);
          setCurrentHotelOffer(hotel || null);
        }
      } catch (error) {
        console.error('Failed to fetch hotel offers:', error);
      }
    };

    fetchHotelOffers();
  }, [selectedLeadId, leads]);

  useEffect(() => {
    if (!selectedLeadId || String(selectedLeadId).startsWith('DEMO-')) {
      setSelectedLeadDetail(null);
      return;
    }

    const loadLeadDetail = async () => {
      try {
        const response = await api.get(`/leads/${selectedLeadId}`);
        setSelectedLeadDetail(response.data);
      } catch (error) {
        console.error('Failed to load lead detail:', error);
        setSelectedLeadDetail(null);
      }
    };

    loadLeadDetail();
  }, [selectedLeadId]);

  // Handle auto-generation
  useEffect(() => {
    if (activeModal && selectedLead && shouldAutoGenerate) {
      if (activeModal === 'email' && !generatedEmail && !generatingEmail) {
        generateEmail();
        setShouldAutoGenerate(false);
      } else if (activeModal === 'text' && !generatedSms && !generatingSms) {
        generateSms();
        setShouldAutoGenerate(false);
      }
    }
  }, [activeModal, selectedLead, shouldAutoGenerate, generatedEmail, generatingEmail, generatedSms, generatingSms]);

  const runAnalysis = async (id) => {
    setAnalyzingId(id);
    try {
      const response = await api.post('/leads/analyze', { leadData: { id } });
      const { score, next_best_action, next_best_actions } = response.data;

      setLeads((prev) => prev.map((lead) => (
        lead.id === id
          ? {
            ...lead,
            score,
            status: lead.status || 'Pending',
            action: next_best_action,
            actions: next_best_actions || [next_best_action],
            raw: {
              ...lead.raw,
              LeadRatings: score,
              Lead_Status_Term: 'Scored',
              Status: lead.status || 'Pending',
              AIRecommendation: next_best_action,
              AIRecommendations: next_best_actions,
              AISegment: response.data.segment,
              AIScoreBreakdown: response.data.breakdown,
              AISignals: response.data.signals,
              AIRisks: response.data.risks,
              AIScoreUpdatedOn: new Date().toISOString(),
              Comment: next_best_action,
              LastActivityDate: new Date().toISOString(),
            },
          }
          : lead
      )));
    } catch (error) {
      console.error('Failed to analyze lead:', error);
    } finally {
      setAnalyzingId(null);
    }
  };

  const generateEmail = async (offerOverride) => {
    if (!selectedLead) return;
    const activeOffer = offerOverride !== undefined ? offerOverride : customOffer;
    setGeneratingEmail(true);
    try {
      const isFollowUp = selectedLead.status === 'Follow-up';
      const endpoint = isFollowUp ? '/communication/generate-follow-up' : '/communication/smart-reply';
      const payload = isFollowUp
        ? { leadId: selectedLead.id, leadData: selectedLead.raw, customOffer: activeOffer }
        : { leadData: selectedLead.raw, emailContext: 'Initial outreach for event planning inquiry', customOffer: activeOffer };

      const response = await api.post(endpoint, payload);
      setGeneratedEmail(response.data.draft);
    } catch (error) {
      console.error('Failed to generate email:', error);
      setGeneratedEmail('Error generating email. Please try again.');
    } finally {
      setGeneratingEmail(false);
    }
  };

  const generateSms = async () => {
    if (!selectedLead) return;
    setGeneratingSms(true);
    try {
      const response = await api.post('/communication/generate-sms', {
        leadId: selectedLead.id,
        leadData: selectedLead.raw
      });
      setGeneratedSms(response.data.sms);
    } catch (error) {
      console.error('Failed to generate SMS:', error);
      setGeneratedSms('Error generating SMS.');
    } finally {
      setGeneratingSms(false);
    }
  };

  const handleSendEmail = async (content, emailAddress) => {
    if (!selectedLead) return;
    setSendingEmail(true);
    try {
      await api.post('/communication/send-email', {
        leadId: selectedLead.id,
        content: content,
        subject: `Re: Inquiry - ${selectedLead.companyName}`
      });
      alert('Email sent successfully directly from the server!');
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Error sending email. Please check backend SMTP settings.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleEmailChange = (email) => {
    setGeneratedEmail(email);
  };

  const handleHotelChange = async (hotelId) => {
    if (!selectedLeadId) return;
    try {
      const hotel = allHotelOffers.find(h => h.HotelOfferID === hotelId);
      await api.put(`/leads/${selectedLeadId}`, {
        selectedHotelOfferId: hotelId,
        SelectedHotelCode: hotel?.HotelCode,
        PropertyID: hotel?.HotelCode
      });
      loadLeads();
    } catch (error) {
      console.error('Failed to update lead hotel:', error);
    }
  };

  const statusOptions = useMemo(
    () => [...new Set(leads.map((lead) => lead.status).filter(Boolean))],
    [leads],
  );
  const typeOptions = useMemo(
    () => [...new Set(leads.map((lead) => lead.type).filter(Boolean))],
    [leads],
  );

  const columns = useMemo(() => [
    {
      accessorKey: 'companyName',
      header: 'Company',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 py-0.5 min-w-[240px]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/leads/new/${row.original.id}`)}
              className="font-bold text-slate-900 dark:text-white hover:text-primary-600 hover:underline transition-colors truncate text-sm"
              title={row.original.companyName}
            >
              {row.original.companyName}
            </button>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate shrink-0">
              ({row.original.contactName})
            </span>
            <div className="flex items-center gap-2 shrink-0 ml-auto border-l border-slate-100 dark:border-dark-800 pl-2">
              <div className="flex gap-1.5">
                {row.original.nurture.needsNurture && (
                  <span
                    title={`Last activity: ${formatDuration(row.original.nurture.inactiveMin)} ago`}
                    className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] cursor-help shrink-0"
                  ></span>
                )}
                {row.original.nurture.isStale && (
                  <span
                    title={`Lead age: ${formatDuration(row.original.nurture.ageMin)}`}
                    className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] cursor-help shrink-0"
                  ></span>
                )}
              </div>
              <div className="flex items-center gap-2 ml-1.5 border-l border-slate-100 dark:border-dark-800 pl-2">
                {row.original.email !== '-' && (
                  <Mail size={12} className={row.original.preferredMethod === 'Email' ? 'text-primary-500' : 'text-slate-300 dark:text-slate-600'} />
                )}
                {row.original.mobileNo !== '-' && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className={row.original.preferredMethod === 'Phone' ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'} />
                    <MessageSquare size={12} className={['sms', 'text'].includes(row.original.preferredMethod?.toLowerCase()) ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {row.original.nurture.needsNurture && (
              <span
                title={`Last activity: ${formatDuration(row.original.nurture.inactiveMin)} ago`}
                className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tight bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 cursor-help"
              >
                Awaiting Action
              </span>
            )}
            {row.original.nurture.isStale && (
              <span
                title={`Lead age: ${formatDuration(row.original.nurture.ageMin)}`}
                className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tight bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 cursor-help"
              >
                Stale Lead
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'mobileNo',
      header: 'Mobile',
      cell: ({ getValue }) => (
        <span className="inline-block min-w-[100px]">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Location',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }) => (
        <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-dark-600 min-w-[70px] justify-center">
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-white dark:bg-dark-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-dark-600 min-w-[80px] justify-center">
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ getValue }) => (
        <span className="inline-block min-w-[70px]">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'score',
      header: 'AI Prob.',
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        const score = Number(row.getValue(columnId));
        if (typeof filterValue === 'object') {
          const { min, max } = filterValue;
          return score >= (min ?? 0) && score <= (max ?? 100);
        }
        return score >= Number(filterValue);
      },
      cell: ({ getValue }) => {
        const score = getValue();
        return (
          <div className="min-w-[80px]">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getScoreBadge(score)}`}>
              {score}%
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'action',
      header: 'Next Best Action',
      cell: ({ getValue }) => (
        <div className="flex items-start gap-2 min-w-[180px]">
          <Zap className="text-primary-500 shrink-0 mt-0.5" size={14} />
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{getValue()}</p>
        </div>
      ),
    },
    {
      accessorKey: 'createdOn',
      header: 'Created',
      cell: ({ getValue }) => formatDate(getValue()),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/leads/new/${row.original.id}`);
            }}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white dark:bg-dark-700 border border-slate-200 dark:border-dark-600 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400"
            title="Edit lead details"
          >
            <Edit2 size={16} />
          </button>
          {row.original.preferredMethod === 'Email' && row.original.email !== '-' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(row.original.id, 'email');
              }}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-500/20 active:scale-95"
              title="Email Follow-up"
            >
              <Mail size={14} />
            </button>
          )}
          {row.original.preferredMethod === 'Phone' && row.original.mobileNo !== '-' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(row.original.id, 'phone');
              }}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 active:scale-95"
              title="Phone Call"
            >
              <Phone size={14} />
            </button>
          )}
          {row.original.preferredMethod === 'Text' && row.original.mobileNo !== '-' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(row.original.id, 'text');
              }}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 active:scale-95"
              title="Text Follow-up"
            >
              <Smartphone size={14} />
            </button>
          )}
        </div>
      ),
    },
    {
      id: 'needsNurture',
      accessorFn: (row) => row.nurture.needsNurture,
      filterFn: 'equals',
    },
    {
      id: 'isStale',
      accessorFn: (row) => row.nurture.isStale,
      filterFn: 'equals',
    },
  ], [analyzingId, navigate]);

  const table = useReactTable({
    data: leads,
    columns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  const highValueCount = leads.filter((lead) => lead.score > 80).length;
  const nurtureCount = leads.filter((lead) => lead.score >= 50 && lead.score <= 80).length;
  const atRiskCount = leads.filter((lead) => lead.score < 50).length;
  const awaitingCount = leads.filter((lead) => lead.nurture.needsNurture).length;
  const staleCount = leads.filter((lead) => lead.nurture.isStale).length;

  const clearAllFilters = () => {
    table.resetColumnFilters();
    setGlobalFilter('');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <Target className="text-primary-600 dark:text-primary-400" size={32} />
            Lead Listing & Analysis
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Search, sort, filter, analyze, and review every captured CRM lead with AI-driven next best actions.
          </p>
        </div>
        <button
          onClick={() => navigate('/leads/new')}
          className="btn-primary flex items-center gap-2 mb-2 shrink-0"
        >
          <Plus size={18} />
          <span>New Lead</span>
        </button>
      </div>

      <div className="grid gap-6 grid-cols-1">
        <div className="glass-panel overflow-visible">
          <div className="p-5 border-b border-slate-200 dark:border-dark-700/50 bg-slate-50 dark:bg-dark-800/50">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-5">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="text-primary-600 dark:text-primary-400" size={20} />
                Lead Pipeline Database
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={clearAllFilters}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm border ${!table.getState().columnFilters.length && !globalFilter
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-dark-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-600 hover:border-primary-400'
                    }`}
                >
                  <LayoutList size={14} className={!table.getState().columnFilters.length && !globalFilter ? 'text-white' : 'text-primary-500'} />
                  {leads.length} Total
                </button>
                <button
                  onClick={() => {
                    table.resetColumnFilters();
                    table.getColumn('score')?.setFilterValue({ min: 81, max: 100 });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm border ${JSON.stringify(table.getColumn('score')?.getFilterValue()) === JSON.stringify({ min: 81, max: 100 })
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-dark-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-600 hover:border-emerald-400'
                    }`}
                >
                  <Target size={14} className={JSON.stringify(table.getColumn('score')?.getFilterValue()) === JSON.stringify({ min: 81, max: 100 }) ? 'text-white' : 'text-emerald-500'} />
                  {highValueCount} High Value (Hot)
                </button>
                <button
                  onClick={() => {
                    table.resetColumnFilters();
                    table.getColumn('score')?.setFilterValue({ min: 50, max: 80 });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm border ${JSON.stringify(table.getColumn('score')?.getFilterValue()) === JSON.stringify({ min: 50, max: 80 })
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-dark-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-600 hover:border-amber-400'
                    }`}
                >
                  <AlertCircle size={14} className={JSON.stringify(table.getColumn('score')?.getFilterValue()) === JSON.stringify({ min: 50, max: 80 }) ? 'text-white' : 'text-amber-500'} />
                  {nurtureCount} Nurture (Warm)
                </button>
                <button
                  onClick={() => {
                    table.resetColumnFilters();
                    table.getColumn('score')?.setFilterValue({ min: 0, max: 49 });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm border ${JSON.stringify(table.getColumn('score')?.getFilterValue()) === JSON.stringify({ min: 0, max: 49 })
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white dark:bg-dark-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-600 hover:border-rose-400'
                    }`}
                >
                  <AlertCircle size={14} className={JSON.stringify(table.getColumn('score')?.getFilterValue()) === JSON.stringify({ min: 0, max: 49 }) ? 'text-white' : 'text-rose-500'} />
                  {atRiskCount} At Risk (Cold)
                </button>

                <div className="w-px h-8 bg-slate-200 dark:bg-dark-700 mx-1 self-center hidden sm:block"></div>

                <button
                  onClick={() => {
                    table.resetColumnFilters();
                    table.getColumn('needsNurture')?.setFilterValue(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm border ${table.getColumn('needsNurture')?.getFilterValue() === true
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white dark:bg-dark-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-600 hover:border-amber-400'
                    }`}
                >
                  <div className={`h-2 w-2 rounded-full bg-amber-500 border border-white shadow-[0_0_8px_rgba(245,158,11,0.6)] ${table.getColumn('needsNurture')?.getFilterValue() === true ? 'animate-pulse' : ''}`}></div>
                  {awaitingCount} Awaiting Action
                </button>
                <button
                  onClick={() => {
                    table.resetColumnFilters();
                    table.getColumn('isStale')?.setFilterValue(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm border ${table.getColumn('isStale')?.getFilterValue() === true
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-white dark:bg-dark-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-600 hover:border-rose-400'
                    }`}
                >
                  <div className="h-2 w-2 rounded-full bg-rose-500 border border-white shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                  {staleCount} Stale Lead
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,1fr)_160px_160px_140px] gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={globalFilter ?? ''}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  placeholder="Search leads..."
                  className="input-field pl-10 bg-white dark:bg-dark-900"
                />
              </div>
              <select
                value={table.getColumn('status')?.getFilterValue() ?? ''}
                onChange={(event) => table.getColumn('status')?.setFilterValue(event.target.value)}
                className="input-field bg-white dark:bg-dark-900"
              >
                <option value="">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Closed">Closed</option>
                {/* <option value="">All statuses</option>
                {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)} */}
              </select>
              <select
                value={table.getColumn('type')?.getFilterValue() ?? ''}
                onChange={(event) => table.getColumn('type')?.setFilterValue(event.target.value)}
                className="input-field bg-white dark:bg-dark-900"
              >
                <option value="">All types</option>
                <option value="Corporate">Corporate</option>
                <option value="Association">Association</option>
                <option value="SMERF">SMERF</option>
                <option value="Wedding">Wedding</option>
                {/* <option value="">All types</option>
                {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)} */}
              </select>
              <select
                value={table.getColumn('score')?.getFilterValue() ?? ''}
                onChange={(event) => table.getColumn('score')?.setFilterValue(event.target.value)}
                className="input-field bg-white dark:bg-dark-900"
              >
                <option value="">All scores</option>
                <option value="80">80% and up</option>
                <option value="60">60% and up</option>
                <option value="40">40% and up</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-slate-50/80 dark:bg-dark-900/40 border-b border-slate-200 dark:border-dark-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="p-4 font-semibold">
                        {header.isPlaceholder ? null : (
                          <button
                            onClick={header.column.getToggleSortingHandler()}
                            disabled={!header.column.getCanSort()}
                            className="flex items-center gap-1"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={table.getVisibleLeafColumns().length} className="p-8 text-center text-sm text-slate-500">
                      Loading leads...
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`transition-all duration-200 border-l-4 ${row.original.nurture.isStale
                        ? 'bg-rose-50/30 dark:bg-rose-500/5 hover:bg-rose-50/50 dark:hover:bg-rose-500/10 border-l-rose-500'
                        : row.original.nurture.needsNurture
                          ? 'bg-amber-50/30 dark:bg-amber-500/5 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 border-l-amber-500'
                          : 'hover:bg-slate-50/70 dark:hover:bg-dark-800/30 border-l-transparent'
                        }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4 align-top text-sm text-slate-700 dark:text-slate-300">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={table.getVisibleLeafColumns().length} className="p-8 text-center text-sm text-slate-500">
                      No leads match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-dark-800/50 border-t border-slate-200 dark:border-dark-700/50">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>Show</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="input-field bg-white dark:bg-dark-900 text-sm py-1 px-2"
              >
                {[8, 16, 24, 32].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1 rounded border border-slate-300 dark:border-dark-600 hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1 rounded border border-slate-300 dark:border-dark-600 hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                    const pageIndex = Math.max(0, Math.min(table.getPageCount() - 5, table.getState().pagination.pageIndex - 2)) + i;
                    if (pageIndex >= table.getPageCount()) return null;

                    return (
                      <button
                        key={pageIndex}
                        onClick={() => table.setPageIndex(pageIndex)}
                        className={`px-3 py-1 text-sm rounded border ${table.getState().pagination.pageIndex === pageIndex
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'border-slate-300 dark:border-dark-600 hover:bg-slate-100 dark:hover:bg-dark-700'
                          }`}
                      >
                        {pageIndex + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-1 rounded border border-slate-300 dark:border-dark-600 hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="p-1 rounded border border-slate-300 dark:border-dark-600 hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {activeModal === 'email' && selectedLead && (
          <EmailModal
            lead={selectedLead}
            onClose={handleCloseModal}
            hotelOffer={currentHotelOffer}
            allHotelOffers={allHotelOffers}
            onHotelChange={handleHotelChange}
            onGenerateEmail={generateEmail}
            generatingEmail={generatingEmail}
            generatedEmail={generatedEmail}
            onEmailChange={handleEmailChange}
            onSendEmail={handleSendEmail}
            sendingEmail={sendingEmail}
            customOffer={customOffer}
            onCustomOfferChange={setCustomOffer}
          />
        )}

        {activeModal === 'phone' && selectedLead && (
          <PhoneModal
            lead={selectedLead}
            onClose={handleCloseModal}
          />
        )}

        {activeModal === 'text' && selectedLead && (
          <TextModal
            lead={selectedLead}
            onClose={handleCloseModal}
            generatedSms={generatedSms}
            generatingSms={generatingSms}
          />
        )}
      </div>
    </div>
  );
};

export default LeadAnalyzer;
