import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  Hash,
  Gift,
  Mail,
  MapPin,
  Phone,
  Save,
  Send,
  Smartphone,
  User,
  Users,
  X,
  Activity as ActivityIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../api/client';

const emptyFormData = {
  firstName: '',
  lastName: '',
  companyName: '',
  email: '',
  mobileNumber: '',
  telephoneNo: '',
  website: '',
  groupType: '',
  eventPurpose: '',
  guestCount: '',
  roomsCount: '',
  startDate: '',
  endDate: '',
  budgetRange: '',
  preferredLocation: '',
  city: '',
  state: '',
  country: '',
  zipcode: '',
  status: 'Pending',
  mainPriority: '',
  decisionTimeline: '',
  specialRequirements: '',
  contactMethod: 'Email',
  selectedHotelOfferId: '',
};

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const mapLeadToForm = (lead) => {
  const inputDetails = lead.InputDetails || {};

  return {
    firstName: lead.FirstName || '',
    lastName: lead.LastName || '',
    companyName: lead.CompanyName || '',
    email: lead.Email || '',
    mobileNumber: lead.MobileNo || '',
    telephoneNo: lead.TelephoneNo || '',
    website: lead.Website || '',
    groupType: lead.GroupType || '',
    eventPurpose: inputDetails.eventPurpose || lead.Lead_Source_Term || '',
    guestCount: inputDetails.guestCount ?? '',
    roomsCount: inputDetails.roomsCount ?? '',
    startDate: toDateInput(inputDetails.startDate),
    endDate: toDateInput(inputDetails.endDate),
    budgetRange: inputDetails.budgetRange || '',
    preferredLocation: inputDetails.preferredLocation || lead.Address || '',
    city: lead.City || '',
    state: lead.State || '',
    country: lead.Country || '',
    zipcode: lead.Zipcode || '',
    status: lead.Status || 'Pending',
    mainPriority: lead.Priority || '',
    decisionTimeline: inputDetails.decisionTimeline || '',
    specialRequirements: lead.Comment || '',
    contactMethod: inputDetails.contactMethod || 'Email',
    selectedHotelOfferId: lead.SelectedHotelOfferID || '',
  };
};

const mapFormToPayload = (formData) => ({
  firstName: formData.firstName,
  lastName: formData.lastName,
  companyName: formData.companyName,
  email: formData.email,
  mobileNumber: formData.mobileNumber,
  telephoneNo: formData.telephoneNo,
  Website: formData.website,
  City: formData.city,
  State: formData.state,
  Country: formData.country,
  Zipcode: formData.zipcode,
  Status: formData.status,
  groupType: formData.groupType,
  eventPurpose: formData.eventPurpose,
  guestCount: formData.guestCount,
  roomsCount: formData.roomsCount,
  startDate: formData.startDate,
  endDate: formData.endDate,
  budgetRange: formData.budgetRange,
  preferredLocation: formData.preferredLocation,
  mainPriority: formData.mainPriority,
  decisionTimeline: formData.decisionTimeline,
  specialRequirements: formData.specialRequirements,
  contactMethod: formData.contactMethod,
  selectedHotelOfferId: formData.selectedHotelOfferId,
});

const InputWrapper = ({ icon: Icon, children }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
      <Icon size={18} />
    </div>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    {children}
  </div>
);

const LeadForm = ({ isOpen, onClose, leadId: leadIdProp }) => {
  const params = useParams();
  const navigate = useNavigate();
  const isModal = typeof isOpen === 'boolean';
  const routeLeadId = params.id && params.id !== 'new' ? params.id : null;
  const leadId = leadIdProp || routeLeadId;
  const isEditMode = Boolean(leadId);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLead, setLoadingLead] = useState(false);
  const [error, setError] = useState('');
  const [leadMeta, setLeadMeta] = useState(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [hotelOffers, setHotelOffers] = useState([]);
  const [loadingHotelOffers, setLoadingHotelOffers] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [newActivityText, setNewActivityText] = useState('');
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const activitiesPerPage = 5;

  useEffect(() => {
    const loadHotelOffers = async () => {
      setLoadingHotelOffers(true);
      try {
        const response = await api.get('/hotel-offers');
        const hotels = response.data || [];
        setHotelOffers(hotels);
        
        // Auto-select the first hotel if none is selected and we're in create mode
        if (hotels.length > 0 && !isEditMode && !formData.selectedHotelOfferId) {
          setFormData(prev => ({ ...prev, selectedHotelOfferId: hotels[0].HotelOfferID }));
        }
      } catch (err) {
        console.error('Failed to load hotel offer configuration:', err);
      } finally {
        setLoadingHotelOffers(false);
      }
    };

    loadHotelOffers();
  }, []);

  const fetchActivities = async () => {
    if (!leadId) return;
    setLoadingActivities(true);
    try {
      const response = await api.get(`/activities?leadId=${leadId}`);
      setActivities(response.data);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchActivities();
    }
  }, [leadId]);

  const handleAddActivity = async () => {
    if (!newActivityText.trim()) return;
    try {
      await api.post('/activities', {
        ActivitySubject: 'Manual Log',
        ActivityDetails: newActivityText,
        ActivityType_Term: 'General',
        ActivityStatus_Term: 'Completed',
        AssociationID: leadId,
      });
      setNewActivityText('');
      setIsAddingActivity(false);
      fetchActivities();
    } catch (error) {
      console.error('Failed to add activity:', error);
    }
  };

  const formatActivityDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  useEffect(() => {
    if (!leadId) {
      setFormData(emptyFormData);
      setLeadMeta(null);
      return;
    }

    const loadLead = async () => {
      setLoadingLead(true);
      setError('');

      try {
        const response = await api.get(`/leads/${leadId}`);
        setLeadMeta(response.data);
        setFormData(mapLeadToForm(response.data));
      } catch (err) {
        console.error('Failed to load lead:', err);
        setError('Unable to load this lead. Please try again.');
      } finally {
        setLoadingLead(false);
      }
    };

    loadLead();
  }, [leadId]);

  const title = isEditMode ? 'Lead Details' : 'New Request';
  const subtitle = isEditMode ? 'Review and update the captured lead information.' : 'Fill in the fields below to process the lead.';
  const successText = isEditMode ? 'Lead details updated!' : 'Lead securely processed!';
  const selectedHotelOffer = useMemo(
    () => hotelOffers.find((hotel) => hotel.HotelOfferID === formData.selectedHotelOfferId),
    [hotelOffers, formData.selectedHotelOfferId],
  );

  const crmSummary = useMemo(() => {
    if (!leadMeta) return null;

    return [
      { label: 'Lead No', value: leadMeta.LeadNo || '-' },
      { label: 'Status', value: leadMeta.Status || 'Pending' },
      { label: 'AI Rating', value: leadMeta.LeadRatings ? `${leadMeta.LeadRatings}%` : '-' },
      { label: 'Created On', value: leadMeta.CreatedOn ? new Date(leadMeta.CreatedOn).toLocaleDateString() : '-' },
    ];
  }, [leadMeta]);

  if (isModal && !isOpen) return null;

  const closeForm = () => {
    if (isModal) {
      onClose?.();
      return;
    }

    navigate('/leads');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactMethodChange = (method) => {
    setFormData((prev) => ({ ...prev, contactMethod: method }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = mapFormToPayload(formData);
      const response = isEditMode
        ? await api.put(`/leads/${leadId}`, payload)
        : await api.post('/leads', payload);

      setLeadMeta(response.data.lead || response.data);
      window.dispatchEvent(new Event('lead-created'));
      setSubmitted(true);

      setTimeout(() => {
        setSubmitted(false);
        setLoading(false);

        if (isModal) {
          onClose?.();
          setFormData(emptyFormData);
        } else if (!isEditMode) {
          navigate('/leads');
        }
      }, 900);
    } catch (err) {
      console.error('Failed to save lead:', err);
      setError('Unable to save the lead. Please review the form and try again.');
      setLoading(false);
    }
  };

  const formShell = (
    <div className={`relative w-full ${isModal ? 'max-w-4xl max-h-[90vh] rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]' : 'max-w-5xl mx-auto rounded-xl shadow-sm'} overflow-hidden flex flex-col bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 animate-in slide-in-from-bottom-8 zoom-in-95 duration-400`}>
      <div className={`w-full flex flex-col ${isModal ? 'h-full max-h-[90vh]' : 'min-h-[calc(100vh-8rem)]'}`}>
        <div className="px-8 py-8 border-b border-slate-200/60 dark:border-dark-800/60 bg-white/50 dark:bg-dark-900/50 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-6 z-10 shrink-0">
          <div className="flex flex-col gap-4">
            {!isModal && (
              <button
                type="button"
                onClick={() => navigate('/leads')}
                className="group w-fit inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-dark-800 text-xs font-bold text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 border border-slate-200 dark:border-dark-700 transition-all active:scale-95"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Leads
              </button>
            )}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">{title}</h3>
                {isEditMode && leadMeta && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                    leadMeta.Status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                    leadMeta.Status === 'Follow-up' ? 'bg-primary-50 text-primary-600 border-primary-200' : 
                    'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>
                    {leadMeta.Status}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">{subtitle}</p>
            </div>
          </div>

          {isEditMode && (
            <div className="inline-flex p-1 bg-slate-100 dark:bg-dark-800 rounded-xl border border-slate-200 dark:border-dark-700 h-fit">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                  activeTab === 'details' 
                    ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm shadow-black/5' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Hash size={16} />
                Lead Details
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                  activeTab === 'activities' 
                    ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm shadow-black/5' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <ActivityIcon size={16} />
                Activities
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 bg-slate-50/50 dark:bg-dark-900/50 custom-scrollbar">
          {loadingLead ? (
            <div className="h-80 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mr-3"></div>
              Loading lead details...
            </div>
          ) : activeTab === 'details' ? (
            <form id={isModal ? 'lead-form' : 'lead-page-form'} onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-300">
              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {crmSummary && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {crmSummary.map((item) => (
                    <div key={item.label} className="rounded-lg border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={16} /> Contact Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="First Name">
                    <InputWrapper icon={User}>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="Sarah" className="input-field pl-10 bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                    </InputWrapper>
                  </Field>
                  <Field label="Last Name">
                    <InputWrapper icon={User}>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Connor" className="input-field pl-10 bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                    </InputWrapper>
                  </Field>
                  <Field label="Company Name">
                    <InputWrapper icon={Building2}>
                      <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Cyberdyne Systems" className="input-field pl-10 bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                    </InputWrapper>
                  </Field>
                  <Field label="Email Address">
                    <InputWrapper icon={Mail}>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="sarah@example.com" className="input-field pl-10 bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                    </InputWrapper>
                  </Field>
                  <Field label="Mobile Number">
                    <InputWrapper icon={Phone}>
                      <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="+1 (555) 000-0000" className="input-field pl-10 bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                    </InputWrapper>
                  </Field>
                  <Field label="Telephone Number">
                    <InputWrapper icon={Phone}>
                      <input type="tel" name="telephoneNo" value={formData.telephoneNo} onChange={handleChange} placeholder="+1 (555) 000-0000" className="input-field pl-10 bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                    </InputWrapper>
                  </Field>
                </div>
              </div>

              <div className="h-px w-full bg-slate-200 dark:bg-dark-800"></div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar size={16} /> Event Specifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Group Type">
                    <select name="groupType" value={formData.groupType} onChange={handleChange} className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700">
                      <option value="">Select type...</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Association">Association</option>
                      <option value="SMERF">SMERF</option>
                      <option value="Wedding">Wedding</option>
                    </select>
                  </Field>
                  <Field label="Selected Hotel">
                    <InputWrapper icon={Building2}>
                      <select
                        name="selectedHotelOfferId"
                        value={formData.selectedHotelOfferId}
                        onChange={handleChange}
                        className="input-field pl-10 bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700"
                      >
                        <option value="">{loadingHotelOffers ? 'Loading hotels...' : 'Select hotel...'}</option>
                        {hotelOffers.map((hotel) => (
                          <option key={hotel.HotelOfferID} value={hotel.HotelOfferID}>
                            {hotel.HotelName}
                          </option>
                        ))}
                      </select>
                    </InputWrapper>
                  </Field>
                  <Field label="Event Purpose">
                    <InputWrapper icon={ClipboardList}>
                      <input type="text" name="eventPurpose" value={formData.eventPurpose} onChange={handleChange} placeholder="Q3 retreat, annual meeting..." className="input-field pl-10 bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                    </InputWrapper>
                  </Field>
                  <Field label="Guest Count">
                    <InputWrapper icon={Users}>
                      <input type="number" name="guestCount" value={formData.guestCount} onChange={handleChange} min="1" placeholder="150" className="input-field pl-10 bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                    </InputWrapper>
                  </Field>
                  <Field label="Number of Rooms">
                    <InputWrapper icon={Hash}>
                      <input type="number" name="roomsCount" value={formData.roomsCount} onChange={handleChange} min="0" placeholder="50" className="input-field pl-10 bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                    </InputWrapper>
                  </Field>
                  <Field label="Budget Range">
                    <InputWrapper icon={DollarSign}>
                      <select name="budgetRange" value={formData.budgetRange} onChange={handleChange} className="input-field pl-10 bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700">
                        <option value="">Select budget...</option>
                        <option value="under_10k">Under $10,000</option>
                        <option value="10k_to_50k">$10,000 - $50,000</option>
                        <option value="50k_to_100k">$50,000 - $100,000</option>
                        <option value="over_100k">Over $100,000</option>
                      </select>
                    </InputWrapper>
                  </Field>
                  <Field label="Decision Timeline">
                    <InputWrapper icon={Clock}>
                      <select name="decisionTimeline" value={formData.decisionTimeline} onChange={handleChange} className="input-field pl-10 bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700">
                        <option value="">Select timeline...</option>
                        <option value="ASAP">ASAP (Within 48 hours)</option>
                        <option value="Week">This week</option>
                        <option value="Month">This month</option>
                      </select>
                    </InputWrapper>
                  </Field>
                  <Field label="Start Date">
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-500 dark:text-slate-400" />
                  </Field>
                  <Field label="End Date">
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-500 dark:text-slate-400" />
                  </Field>
                </div>
                {selectedHotelOffer && (
                  <div className="mt-4 rounded-lg border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <Gift size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                          Default offer will be auto-applied
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-200 mt-1">
                          {selectedHotelOffer.DefaultOffer || 'Segment based offer configured for this hotel.'}
                        </p>
                        <p className="text-xs font-semibold text-emerald-700/80 dark:text-emerald-300/80 mt-2">
                          Maximum discount: {selectedHotelOffer.MaxDiscountPercent || 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px w-full bg-slate-200 dark:bg-dark-800"></div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin size={16} /> Preferences & Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Preferred Location">
                    <input type="text" name="preferredLocation" value={formData.preferredLocation} onChange={handleChange} placeholder="Downtown, Beachfront, etc." className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                  </Field>
                  <Field label="Website">
                    <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                  </Field>
                  <Field label="City">
                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Austin" className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                  </Field>
                  <Field label="State">
                    <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Texas" className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                  </Field>
                  <Field label="Country">
                    <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="USA" className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                  </Field>
                  <Field label="Zipcode">
                    <input type="text" name="zipcode" value={formData.zipcode} onChange={handleChange} placeholder="78701" className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" />
                  </Field>
                  <Field label="Lead Status">
                    <select name="status" value={formData.status} onChange={handleChange} className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700">
                      <option value="Pending">Pending</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </Field>
                  <Field label="Priority">
                    <select name="mainPriority" value={formData.mainPriority} onChange={handleChange} className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700">
                      <option value="">Select priority...</option>
                      <option value="Hot">Hot</option>
                      <option value="Warm">Warm</option>
                      <option value="Cold">Cold</option>
                    </select>
                  </Field>
                </div>

                <div className="space-y-6 mt-6">
                  <Field label="Special Requirements">
                    <textarea
                      name="specialRequirements"
                      value={formData.specialRequirements}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Enter any VIP requests, AV needs, dietary restrictions..."
                      className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 resize-none"
                    ></textarea>
                  </Field>

                  <Field label="Preferred Contact Method">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'Email', icon: Mail },
                        { id: 'Phone', icon: Phone },
                        { id: 'Text', icon: Smartphone },
                      ].map((method) => (
                        <button
                          type="button"
                          key={method.id}
                          onClick={() => handleContactMethodChange(method.id)}
                          className={`rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                            formData.contactMethod === method.id
                              ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 shadow-[0_0_15px_rgba(20,184,166,0.15)]'
                              : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-500 hover:border-slate-300 dark:hover:border-dark-600 hover:bg-slate-50 dark:hover:bg-dark-700/50'
                          }`}
                        >
                          <method.icon size={20} />
                          <span className="text-xs font-semibold">{method.id}</span>
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
            </form>
          ) : null}

          {isEditMode && !loadingLead && activeTab === 'activities' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                  <ActivityIcon size={20} className="text-primary-600 dark:text-primary-400" />
                  Activity History
                </h3>
                <button
                  onClick={() => setIsAddingActivity(!isAddingActivity)}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Activity
                </button>
              </div>

              {isAddingActivity && (
                <div className="mb-4 p-4 rounded-xl border border-primary-200 dark:border-primary-500/20 bg-primary-50 dark:bg-primary-500/10 flex gap-2">
                  <input
                    type="text"
                    value={newActivityText}
                    onChange={(e) => setNewActivityText(e.target.value)}
                    placeholder="Describe the activity..."
                    className="input-field bg-white dark:bg-dark-900 border-primary-200 dark:border-primary-500/30 text-sm"
                    autoFocus
                  />
                  <button onClick={handleAddActivity} className="btn-primary px-4 py-2 shrink-0">
                    Save
                  </button>
                  <button onClick={() => setIsAddingActivity(false)} className="px-3 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    Cancel
                  </button>
                </div>
              )}

              {loadingActivities ? (
                <div className="text-center p-6 text-slate-500">Loading activities...</div>
              ) : activities.length === 0 ? (
                <div className="text-center p-6 text-slate-500 bg-slate-50 dark:bg-dark-800/50 rounded-xl border border-slate-200 dark:border-dark-700">
                  No activities recorded for this lead yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.slice((activitiesPage - 1) * activitiesPerPage, activitiesPage * activitiesPerPage).map(activity => (
                    <div key={activity._id || activity.ActivityID} className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800/80">
                      <div className={`mt-1 shrink-0 w-2 h-2 rounded-full ${activity.ActivityType_Term === 'action' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-primary-600 shadow-[0_0_8px_rgba(13,148,136,0.6)]'}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {activity.ActivitySubject || activity.ActivityDetails || 'Activity'}
                          </p>
                          <span className="shrink-0 text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-dark-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-dark-600">
                            {formatActivityDate(activity.DateOfCreated)}
                          </span>
                        </div>
                        {activity.ActivityDetails && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {activity.ActivityDetails}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-dark-700 dark:text-slate-400 border border-slate-200 dark:border-dark-600">
                            {activity.ActivityType_Term}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              activity.ActivityStatus_Term === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                              'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                          }`}>
                            {activity.ActivityStatus_Term}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {activities.length > activitiesPerPage && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-dark-700 mt-6">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Showing {((activitiesPage - 1) * activitiesPerPage) + 1} to {Math.min(activitiesPage * activitiesPerPage, activities.length)} of {activities.length} activities
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActivitiesPage(p => Math.max(1, p - 1))}
                          disabled={activitiesPage === 1}
                          className="p-2 rounded-lg border border-slate-200 dark:border-dark-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-8 text-center">
                          {activitiesPage}
                        </span>
                        <button
                          onClick={() => setActivitiesPage(p => Math.min(Math.ceil(activities.length / activitiesPerPage), p + 1))}
                          disabled={activitiesPage >= Math.ceil(activities.length / activitiesPerPage)}
                          className="p-2 rounded-lg border border-slate-200 dark:border-dark-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-dark-800 bg-white dark:bg-dark-900 shrink-0 flex items-center justify-between">
          <div>
            {submitted && activeTab === 'details' && (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium animate-in slide-in-from-left-4 duration-300">
                <CheckCircle2 size={18} />
                <span className="text-sm">{successText}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeForm}
              className="px-5 py-2.5 text-sm font-bold rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors"
            >
              {activeTab === 'activities' ? 'Close' : 'Cancel'}
            </button>
            {activeTab === 'details' && (
              <button
                form={isModal ? 'lead-form' : 'lead-page-form'}
                type="submit"
                disabled={loading || submitted || loadingLead}
                className="btn-primary flex items-center gap-2 px-8 py-2.5 font-bold disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isEditMode ? <Save size={18} /> : <Send size={18} />}
                    <span>{isEditMode ? 'Save Lead' : 'Submit Lead'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
        {formShell}
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        ` }} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {formShell}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      ` }} />
    </div>
  );
};

export default LeadForm;
