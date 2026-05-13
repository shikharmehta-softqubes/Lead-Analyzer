import React, { useState, useEffect } from 'react';
import { Mail, Sparkles, Send, Inbox, FileText, Activity as ActivityIcon, Plus } from 'lucide-react';
import api from '../api/client';

const Communication = () => {
  const [emails, setEmails] = useState([
    { id: 1, sender: 'Sarah Connor', leadId: 'DEMO-10001', subject: 'RFP Inquiry - Q3 Retreat', snippet: 'We are looking to host our Q3 retreat at your property...', date: '10:42 AM', active: true },
    { id: 2, sender: 'Mike Johnson', leadId: 'DEMO-10002', subject: 'Follow up on proposal', snippet: 'Thanks for sending over the proposal. We had a few...', date: 'Yesterday', active: false },
  ]);
  const [activeEmailId, setActiveEmailId] = useState(1);
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activities, setActivities] = useState([]);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivityText, setNewActivityText] = useState('');

  const fetchActivities = async () => {
    try {
      const response = await api.get('/activities');
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const activeEmail = emails.find(e => e.id === activeEmailId);

  const generateSmartReply = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/communication/smart-reply', { 
        emailContext: activeEmail.subject,
        leadId: activeEmail.leadId
      });
      setDraft(response.data.draft);
      
      setActivities(prev => [{
        id: Date.now(),
        text: `AI drafted response to: ${activeEmail.subject}`,
        time: 'Just now',
        type: 'action'
      }, ...prev]);

    } catch (error) {
      console.error('Failed to generate smart reply:', error);
    } finally {
      setGenerating(false);
      fetchActivities();
    }
  };

  const handleAddActivity = async () => {
    if(!newActivityText.trim()) return;
    try {
      await api.post('/activities', {
        ActivitySubject: 'Manual Log',
        ActivityDetails: newActivityText,
        ActivityType_Term: 'General',
        ActivityStatus_Term: 'Completed'
      });
      setNewActivityText('');
      setIsAddingActivity(false);
      fetchActivities();
    } catch (error) {
      console.error('Failed to add activity:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <Mail className="text-primary-600 dark:text-primary-400" size={32} />
            Smart Communication
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Auto-draft contextual responses, extract data autonomously, and log activities without manual entry.
          </p>
        </div>
      </div>

      <div className="flex gap-6 h-full">
        {/* Inbox Sidebar */}
        <div className="w-1/3 glass-panel overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-dark-700/50 bg-slate-50 dark:bg-dark-800/50 flex items-center gap-2">
            <Inbox size={18} className="text-primary-600 dark:text-primary-400" />
            <h3 className="font-semibold text-slate-800 dark:text-white">Inbox</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {emails.map(email => (
              <div 
                key={email.id}
                onClick={() => setActiveEmailId(email.id)}
                className={`p-4 border-b border-slate-200 dark:border-dark-700/30 cursor-pointer transition-all ${
                  email.id === activeEmailId 
                    ? 'bg-primary-50 dark:bg-primary-500/10 border-l-4 border-l-primary-500' 
                    : 'hover:bg-slate-50 dark:hover:bg-dark-800'
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{email.sender}</span>
                  <span className="text-xs text-slate-500">{email.date}</span>
                </div>
                <h4 className={`text-sm mb-1 ${email.id === activeEmailId ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                  {email.subject}
                </h4>
                <p className="text-xs text-slate-500 truncate">{email.snippet}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-2/3 flex flex-col gap-6">
          {/* Email View & Reply */}
          <div className="glass-panel flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-dark-700/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{activeEmail?.subject}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">From: {activeEmail?.sender} • {activeEmail?.date}</p>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="bg-slate-50 dark:bg-dark-800/50 rounded-xl p-4 border border-slate-200 dark:border-dark-700/50 mb-6 text-slate-700 dark:text-slate-300 text-sm">
                {activeEmail?.snippet}
                <br/><br/>
                Looking forward to hearing from you.
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Sparkles size={16} className="text-primary-600 dark:text-primary-400" />
                    Generative Smart Reply
                  </h3>
                  <button 
                    onClick={generateSmartReply}
                    disabled={generating}
                    className="bg-slate-100 dark:bg-dark-700 hover:bg-slate-200 dark:hover:bg-dark-600 text-primary-600 dark:text-primary-400 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-600 transition-colors flex items-center gap-2"
                  >
                    {generating ? 'Generating...' : 'Auto-Draft Response'}
                  </button>
                </div>
                
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Draft your reply or let AI generate one..."
                  className="w-full h-40 bg-slate-50 dark:bg-dark-900/50 border border-slate-200 dark:border-dark-600 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-slate-800 dark:text-slate-200 text-sm resize-none"
                ></textarea>

                <div className="flex justify-end">
                  <button className="btn-primary flex items-center gap-2 px-6">
                    <span>Send</span>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI Activity Log */}
          <div className="h-48 glass-panel overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-dark-700/50 bg-slate-50 dark:bg-dark-800/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                <ActivityIcon size={16} className="text-primary-600 dark:text-primary-400" />
                Activity Log
              </h3>
              <button 
                onClick={() => setIsAddingActivity(!isAddingActivity)}
                className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 p-1"
                title="Add Activity"
              >
                <Plus size={16} />
              </button>
            </div>
            {isAddingActivity && (
              <div className="px-4 py-2 border-b border-slate-200 dark:border-dark-700/50 flex gap-2">
                <input 
                  type="text" 
                  value={newActivityText}
                  onChange={(e) => setNewActivityText(e.target.value)}
                  placeholder="Activity details..." 
                  className="input-field text-sm bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-700"
                />
                <button 
                  onClick={handleAddActivity}
                  className="btn-primary px-3 py-1 text-xs shrink-0"
                >
                  Save
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activities.slice(0, 10).map(activity => (
                <div key={activity._id || activity.ActivityID || activity.id} className="flex gap-3 items-start">
                  <div className={`mt-0.5 w-2 h-2 rounded-full ${activity.ActivityType_Term === 'extraction' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] dark:bg-amber-400 dark:shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-primary-600 shadow-[0_0_8px_rgba(13,148,136,0.6)] dark:bg-primary-400 dark:shadow-[0_0_8px_rgba(45,212,191,0.6)]'}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {activity.ActivitySubject || activity.text || 'Activity'}
                      </p>
                      {activity.AssociationID && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-100 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400 leading-none">
                           Lead: {activity.AccountName || activity.AssociationID}
                        </span>
                      )}
                    </div>
                    {activity.ActivityDetails && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {activity.ActivityDetails}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 mt-1">
                      {activity.DateOfCreated ? formatDate(activity.DateOfCreated) : activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Communication;
