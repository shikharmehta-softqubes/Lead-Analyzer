import React, { useState, useEffect, useRef } from 'react';
import { Target, TrendingUp, Users, Zap } from 'lucide-react';
import api from '../api/client';

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
    return () => {}; // Cleanup if needed
  }, [value]);

  return <span>{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};

const StatCard = ({ title, value, change, icon: Icon, isPositive, suffix = "", decimals = 0 }) => (
  <div className="bg-[#040183] rounded-xl p-6 relative overflow-hidden group shadow-md border-none">
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

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <button className="btn-primary flex items-center gap-2 px-6">
          <Zap size={18} />
          <span>Run AI Analysis</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Leads" value={stats.totalLeads} change="+12.5%" icon={Users} isPositive={true} />
        <StatCard title="Conversion Rate" value={stats.conversionRate} decimals={1} suffix="%" change="+15.0%" icon={Target} isPositive={true} />
        <StatCard title="Operational Time Saved" value={stats.operationalTimeSaved} suffix=" hrs" change="+30%" icon={TrendingUp} isPositive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6">
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
          
          <div className="h-64 flex items-end gap-4 relative">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-slate-100 dark:border-dark-800/50">
              {[1, 2, 3].map(i => <div key={i} className="w-full border-t border-slate-100/50 dark:border-dark-800/30"></div>)}
            </div>

            {aiPerformance.map((day, i) => {
              const scoreHeight = Math.max(day.qualityScore, 2);
              const volumeHeight = Math.max(day.count * 10, 2); 
              
              return (
                <div key={i} className="flex-1 flex flex-col justify-end group relative z-10 h-full">
                  <div className="flex items-end justify-center gap-1.5 w-full h-full pb-1">
                    {/* Volume Bar */}
                    <div 
                      className="w-1.5 bg-slate-200 dark:bg-dark-700 rounded-t-sm transition-all duration-300 group-hover:bg-slate-300 dark:group-hover:bg-dark-600"
                      style={{ height: `${volumeHeight}%` }}
                    ></div>
                    {/* Quality Bar */}
                    <div 
                      className={`w-full max-w-[28px] rounded-t-md relative transition-all duration-500 group-hover:scale-x-105 group-hover:shadow-lg shadow-sm ${
                        day.qualityScore >= 80 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' :
                        day.qualityScore >= 60 ? 'bg-gradient-to-t from-amber-500 to-amber-300' :
                        day.qualityScore > 0 ? 'bg-gradient-to-t from-rose-500 to-rose-400' :
                        'bg-slate-100 dark:bg-dark-800'
                      }`}
                      style={{ height: `${scoreHeight}%` }}
                    >
                      {/* Tooltip */}
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

        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Zap className="text-primary-600 dark:text-primary-400" />
            Next Best Actions
          </h2>
          <div className="space-y-4">
            {nextActions.length > 0 ? nextActions.map((task, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-dark-900/50 border border-slate-200 dark:border-dark-700/50 hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-colors group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-slate-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{task.company}</h4>
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                    task.priority === 'High' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20' : 
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
              <p className="text-center text-slate-500 py-8">No actions required.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
