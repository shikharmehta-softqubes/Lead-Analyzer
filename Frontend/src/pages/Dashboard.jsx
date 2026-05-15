import React, { useState, useEffect, useRef } from 'react';
import { Target, TrendingUp, Users, Zap, X, Activity, CheckCircle2, BarChart2, ShieldCheck, BrainCircuit, Mail, ChevronRight } from 'lucide-react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

const AnimatedNumber = ({ value, decimals = 0, suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const valueRef = useRef(0);

  useEffect(() => {
    const end = Number(value) || 0;
    const start = valueRef.current;
    if (start === end) return;

    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      const current = start + (end - start) * easedProgress;
      setDisplayValue(current);
      valueRef.current = current;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    return () => { }; // Cleanup if needed
  }, [value]);

  return <span>{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};

const StatCard = ({ title, value, change, icon: Icon, isPositive, suffix = "", decimals = 0, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-[#040183] rounded-xl p-6 relative overflow-hidden group shadow-md border-none ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-300' : ''}`}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-all duration-500"></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div>
        <p className="text-white/80 font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white">
          <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
        </h3>
      </div>
      <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner">
        <Icon size={24} />
      </div>
    </div>
    <div className={`flex items-center gap-2 text-sm font-medium relative z-10 ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
      <TrendingUp size={16} className={!isPositive ? 'rotate-180' : ''} />
      <span>{change} from last month</span>
    </div>
  </div>
);

const AIAnalysisModal = ({ isOpen, onClose, stats }) => {
  const [phase, setPhase] = useState('scanning'); // scanning, results
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPhase('scanning');
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setPhase('results'), 500);
            return 100;
          }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-dark-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-white/20 relative">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent"></div>

        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600">
                <BrainCircuit size={24} className={phase === 'scanning' ? 'animate-pulse' : ''} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Workspace Insights</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          {phase === 'scanning' ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="relative w-24 h-24 mb-8">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-dark-800" />
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={276} strokeDashoffset={276 - (276 * progress) / 100} className="text-primary-500 transition-all duration-300" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-primary-600">
                  {progress}%
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Analyzing lead quality patterns...</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Scanning database, interaction history, and conversion signals.</p>

              <div className="mt-8 space-y-3 w-full max-w-sm">
                {[
                  { label: 'Ingesting lead metadata', done: progress > 30 },
                  { label: 'Scoring interaction sentiment', done: progress > 60 },
                  { label: 'Generating predictive models', done: progress > 90 }
                ].map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm font-medium transition-opacity duration-500 ${step.done ? 'opacity-100 text-emerald-600 dark:text-emerald-400' : 'opacity-40 text-slate-500'}`}>
                    <CheckCircle2 size={16} />
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-in zoom-in-95 fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Donut Chart Simulation */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lead Health Breakdown</h4>
                  <div className="flex items-center justify-center relative py-4">
                    <div className="w-32 h-32 rounded-full" style={{ background: 'conic-gradient(#10b981 0% 45%, #f59e0b 45% 80%, #ef4444 80% 100%)' }}></div>
                    <div className="absolute w-24 h-24 rounded-full bg-white dark:bg-dark-900 flex items-center justify-center">
                      <div className="text-center">
                        <span className="block text-2xl font-black text-slate-900 dark:text-white">84</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Avg Score</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span className="text-slate-600 dark:text-slate-300">High Quality (45%)</span></div>
                      <span className="font-bold text-slate-900 dark:text-white">Active</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> <span className="text-slate-600 dark:text-slate-300">Nurturing (35%)</span></div>
                      <span className="font-bold text-slate-900 dark:text-white">Steady</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div> <span className="text-slate-600 dark:text-slate-300">At Risk (20%)</span></div>
                      <span className="font-bold text-slate-900 dark:text-white">Urgent</span>
                    </div>
                  </div>
                </div>

                {/* AI Confidence & Recommendations */}
                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-dark-800/50 rounded-2xl p-4 border border-slate-100 dark:border-dark-800">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="text-primary-500" size={18} />
                      <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">AI Confidence</span>
                    </div>
                    <div className="h-4 bg-slate-200 dark:bg-dark-700 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>ACCURACY: 92%</span>
                      <span>SIGMA: 0.85</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key AI Insights</h4>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex gap-3">
                      <Activity className="text-emerald-600 shrink-0" size={16} />
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">Engagement is 24% higher on leads contacted within 15 minutes of creation.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 flex gap-3">
                      <BarChart2 className="text-primary-600 shrink-0" size={16} />
                      <p className="text-[11px] text-primary-700 dark:text-primary-300 font-medium leading-relaxed">Corporate segments are showing a "High Intent" pattern this week.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-dark-800">
                <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-dark-700 transition-all text-sm">
                  Dismiss
                </button>
                <button onClick={() => { onClose(); navigate('/leads'); }} className="px-6 py-2.5 rounded-xl bg-[#040183] text-white font-bold hover:shadow-lg shadow-primary-500/20 active:scale-95 transition-all text-sm">
                  View Leads
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
};

const LiveIntelligenceFeed = ({ navigate, externalEvents = [] }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (externalEvents && externalEvents.length > 0) {
      const mapped = externalEvents.map(e => ({
        ...e,
        icon: e.type === 'signal' ? Mail : e.type === 'intent' ? TrendingUp : Activity,
        color: e.type === 'signal' ? 'text-primary-500' : e.type === 'intent' ? 'text-emerald-500' : 'text-amber-500',
        bgColor: e.type === 'signal' ? 'bg-primary-500/10' : e.type === 'intent' ? 'bg-emerald-500/10' : 'bg-amber-500/10',
        time: formatRelativeTime(e.time)
      }));
      setEvents(mapped);
    }
  }, [externalEvents]);

  // Simulate periodic refreshes or new events if empty
  useEffect(() => {
    if (events.length === 0 && (!externalEvents || externalEvents.length === 0)) {
      setEvents([
        // {
        //   id: 1,
        //   type: 'signal',
        //   icon: Mail,
        //   title: 'System Ready',
        //   lead: 'AI Assistant',
        //   description: 'Dashboard is connected and waiting for new lead signals.',
        //   time: 'Just now',
        //   color: 'text-primary-500',
        //   bgColor: 'bg-primary-500/10',
        //   action: 'analyze'
        // }
      ]);
    }
  }, [events.length, externalEvents]);

  return (
    <div className="glass-panel p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Activity className="text-primary-600 dark:text-primary-400 animate-pulse" />
          Live Intelligence
        </h2>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Live</span>
        </div>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {events.map((event, i) => (
          <div
            key={event.id}
            className="relative pl-8 animate-in fade-in slide-in-from-right-4 duration-500"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Connector Line */}
            {i !== events.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-slate-100 dark:bg-dark-800"></div>
            )}

            <div className={`absolute left-0 top-0 w-8 h-8 rounded-lg ${event.bgColor} ${event.color} flex items-center justify-center shadow-sm`}>
              <event.icon size={16} />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">{event.title}</h4>
                <span className="text-[10px] font-medium text-slate-400">{event.time}</span>
              </div>
              <p className="text-xs font-bold text-primary-600 dark:text-primary-400">{event.lead}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{event.description}</p>

              <button
                onClick={() => navigate('/leads', { state: { leadId: event.lead, openModal: event.action === 'email' ? 'email' : 'email' } })}
                className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 transition-colors w-fit"
              >
                Take Action <ChevronRight size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = data?.stats || { totalLeads: 0, conversionRate: 0, aiAutomatedReplies: 0, operationalTimeSaved: 0 };
  const aiPerformance = data?.aiPerformance || [];
  const nextActions = data?.nextActions || [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome back, Alex</h1>
          <p className="text-slate-500 dark:text-slate-400">Here's what's happening with your leads today.</p>
        </div>
        <button
          onClick={() => setShowAnalysis(true)}
          className="btn-primary flex items-center gap-2 px-6"
        >
          <Zap size={18} />
          <span>Run AI Analysis</span>
        </button>
      </div>

      <AIAnalysisModal
        isOpen={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        stats={data?.stats}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          change="+12.5%"
          icon={Users}
          isPositive={true}
          onClick={() => navigate('/leads')}
        />
        <StatCard title="Conversion Rate" value={stats.conversionRate} decimals={1} suffix="%" change="+15.0%" icon={Target} isPositive={true} />
        <StatCard title="Operational Time Saved" value={stats.operationalTimeSaved} suffix=" hrs" change="+30%" icon={TrendingUp} isPositive={true} />
        <StatCard title="AI Automated Replies" value={stats.aiAutomatedReplies} change="+8.2%" icon={Mail} isPositive={true} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <div className="xl:col-span-3 glass-panel p-6 flex flex-col h-[400px]">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="text-primary-600 dark:text-primary-400" />
              AI Lead Quality Index
            </h2>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-slate-500">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary-500"></div>
                Avg. AI Score
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <div className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-dark-600"></div>
                Lead Volume
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-end gap-4 relative overflow-hidden mt-2">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-slate-100 dark:border-dark-800/50">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-full border-t border-slate-100/50 dark:border-dark-800/30"></div>)}
            </div>

            {aiPerformance.map((day, i) => {
              const scoreHeight = Math.min(Math.max(day.qualityScore, 2), 100);
              const volumeHeight = Math.min(Math.max(day.count * 10, 2), 100);


              return (
                <div key={i} className="flex-1 flex flex-col justify-end group relative z-10 h-full">
                  <div className="flex items-end justify-center gap-1.5 w-full h-full pb-1">
                    <div
                      className="w-1.5 bg-slate-200 dark:bg-dark-700 rounded-t-sm transition-all duration-300 group-hover:bg-slate-300 dark:group-hover:bg-dark-600"
                      style={{ height: `${volumeHeight}%` }}
                    ></div>
                    <div
                      className={`w-full max-w-[28px] rounded-t-md relative transition-all duration-500 group-hover:scale-x-105 group-hover:shadow-lg shadow-sm ${day.qualityScore >= 80 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' :
                        day.qualityScore >= 60 ? 'bg-gradient-to-t from-amber-500 to-amber-300' :
                          day.qualityScore > 0 ? 'bg-gradient-to-t from-rose-500 to-rose-400' :
                            'bg-slate-100 dark:bg-dark-800'
                        }`}
                      style={{ height: `${scoreHeight}%` }}
                    >
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-dark-800 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20 shadow-2xl border border-white/10 flex flex-col items-center translate-y-2 group-hover:translate-y-0">
                        <span className="font-bold">{day.qualityScore}% AI Quality</span>
                        <span className="opacity-70">{day.count} New Leads</span>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-dark-800 rotate-45 border-r border-b border-white/10"></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider pt-4 border-t border-slate-100 dark:border-dark-800/50">
            {aiPerformance.map((day, i) => (
              <span key={i} className="flex-1 text-center">
                {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
            ))}
          </div>
        </div>

        <div className="xl:col-span-1 h-[400px]">
          <LiveIntelligenceFeed navigate={navigate} externalEvents={data?.latestActivities} />
        </div>


      </div>

      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <Zap className="text-primary-600 dark:text-primary-400" />
          Next Best Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nextActions.length > 0 ? nextActions.map((task, i) => (
            <div
              key={i}
              onClick={() => navigate('/leads', { state: { leadId: task.id, openModal: 'email' } })}
              className="p-4 rounded-xl bg-slate-50 dark:bg-dark-900/50 border border-slate-200 dark:border-dark-700/50 hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-colors group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-slate-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{task.company}</h4>
                <span className={`text-xs px-2 py-1 rounded-md font-medium ${task.priority === 'High' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20' :
                  task.priority === 'Medium' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' :
                    'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                  }`}>
                  {task.priority}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 truncate">{task.action}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{task.time}</p>
            </div>
          )) : (
            <p className="text-center text-slate-500 py-8 col-span-full">No actions required.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
