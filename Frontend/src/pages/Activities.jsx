import React, { useState, useEffect } from 'react';
import { Activity as ActivityIcon, Plus, Target, CheckCircle2, Search, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/client';

const ActivityModal = ({ isOpen, onClose, onActivityAdded }) => {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [formData, setFormData] = useState({
    ActivitySubject: '',
    ActivityDetails: '',
    ActivityType_Term: 'General',
    ActivityStatus_Term: 'Completed',
    AssociationID: '',
  });

  useEffect(() => {
    if (isOpen) {
      api.get('/leads')
        .then(res => setLeads(res.data))
        .catch(err => console.error('Failed to fetch leads for dropdown:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/activities', formData);
      onActivityAdded(response.data);
      onClose();
      setFormData({
        ActivitySubject: '',
        ActivityDetails: '',
        ActivityType_Term: 'General',
        ActivityStatus_Term: 'Completed',
        AssociationID: '',
      });
    } catch (error) {
      console.error('Failed to create activity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-dark-700 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add New Activity</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <input 
              type="text" 
              name="ActivitySubject" 
              value={formData.ActivitySubject} 
              onChange={handleChange} 
              required
              placeholder="E.g., Call with client, Sent proposal" 
              className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" 
            />
          </div>
          
          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lead (Optional)</label>
             <select 
              name="AssociationID" 
              value={formData.AssociationID} 
              onChange={handleChange} 
              className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700" 
             >
               <option value="">-- Select a Lead --</option>
               {leads.map(lead => (
                 <option key={lead._id || lead.LeadID} value={lead.LeadID || lead._id}>
                   {lead.CompanyName || [lead.FirstName, lead.LastName].filter(Boolean).join(' ') || 'Unknown'}
                 </option>
               ))}
             </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select name="ActivityType_Term" value={formData.ActivityType_Term} onChange={handleChange} className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700">
                <option value="General">General</option>
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Meeting">Meeting</option>
                <option value="action">Action</option>
                <option value="extraction">Extraction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select name="ActivityStatus_Term" value={formData.ActivityStatus_Term} onChange={handleChange} className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700">
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Details</label>
            <textarea 
              name="ActivityDetails" 
              value={formData.ActivityDetails} 
              onChange={handleChange} 
              rows="3" 
              placeholder="Additional notes or activity details..."
              className="input-field bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 resize-none" 
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary px-6 py-2">
              {loading ? 'Saving...' : 'Save Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const itemsPerPage = 10;

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await api.get('/activities');
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleActivityAdded = (newActivity) => {
    setActivities((prev) => [newActivity, ...prev]);
  };

  const filteredActivities = activities.filter(activity => {
    const term = search.toLowerCase();
    const matchesSearch = (
      (activity.ActivitySubject && activity.ActivitySubject.toLowerCase().includes(term)) ||
      (activity.ActivityDetails && activity.ActivityDetails.toLowerCase().includes(term)) ||
      (activity.AssociationID && activity.AssociationID.toLowerCase().includes(term)) ||
      (activity.AccountName && activity.AccountName.toLowerCase().includes(term))
    );
    
    const matchesType = typeFilter === 'All' || activity.ActivityType_Term === typeFilter;
    const matchesStatus = statusFilter === 'All' || activity.ActivityStatus_Term === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const pagedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <ActivityIcon className="text-primary-600 dark:text-primary-400" size={32} />
            Activity Log
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Track all automated and manual activities across leads and communications.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 mb-2 shrink-0"
        >
          <Plus size={18} />
          <span>Add Activity</span>
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-dark-700/50 bg-slate-50 dark:bg-dark-800/50 flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6 w-full lg:w-auto">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 shrink-0">
                    Recent Activities
                </h2>
                <div className="hidden sm:flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Filter size={14} /> Filters:
                    </div>
                    <select 
                      value={typeFilter} 
                      onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                      className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-400 focus:ring-0 cursor-pointer"
                    >
                      <option value="All">All Types</option>
                      <option value="Call">Call</option>
                      <option value="Email">Email</option>
                      <option value="Meeting">Meeting</option>
                      <option value="action">Action</option>
                      <option value="extraction">Extraction</option>
                      <option value="General">General</option>
                    </select>
                    <select 
                      value={statusFilter} 
                      onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-400 focus:ring-0 cursor-pointer"
                    >
                      <option value="All">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="input-field pl-10 bg-white dark:bg-dark-900"
                />
            </div>
        </div>
        
        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading activities...</div>
          ) : pagedActivities.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No activities found.</div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-dark-700">
              {pagedActivities.map((activity) => (
                <div key={activity._id || activity.ActivityID} className="p-5 hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                               {activity.ActivitySubject || activity.ActivityDetails || 'Activity'}
                             </h3>
                             {activity.AssociationID && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                                   Lead: {activity.AccountName || activity.AssociationID}
                                </span>
                             )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                           {activity.ActivitySubject ? activity.ActivityDetails : ''}
                        </p>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 shrink-0">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                           {formatDate(activity.DateOfCreated)}
                        </span>
                        <div className="flex gap-2">
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-dark-700 dark:text-slate-300 border border-slate-200 dark:border-dark-600">
                                {activity.ActivityType_Term}
                            </span>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                                activity.ActivityStatus_Term === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                                'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                            }`}>
                                {activity.ActivityStatus_Term}
                            </span>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-800/30 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredActivities.length)} of {filteredActivities.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-dark-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === i + 1
                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/50'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-dark-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <ActivityModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         onActivityAdded={handleActivityAdded} 
      />
    </div>
  );
};

export default Activities;
