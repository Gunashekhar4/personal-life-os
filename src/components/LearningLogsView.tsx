import React, { useState } from 'react';
import { BookOpen, Plus, Calendar, Trash2, Sliders, Play, Sparkles, TrendingUp, BarChart2 } from 'lucide-react';
import { LearningEntry, Subject } from '../types';

interface LearningProps {
  entries: LearningEntry[];
  onAdd: (entry: Omit<LearningEntry, 'id'>) => void;
  onDelete: (id: string) => void;
}

export default function LearningLogsView({ entries, onAdd, onDelete }: LearningProps) {
  const [subject, setSubject] = useState<Subject>('DSA');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hrsVal = parseFloat(hours);
    if (!hrsVal || hrsVal <= 0 || !date) return;

    onAdd({
      subject,
      hours: hrsVal,
      date,
      description: description.trim() || `Study session for ${subject}`
    });

    setHours('');
    setDescription('');
    setIsAdding(false);
  };

  // Calculate Aggregates
  const totalHours = entries.reduce((acc, curr) => acc + curr.hours, 0);
  const javaHours = entries.filter(e => e.subject === 'Java').reduce((acc, curr) => acc + curr.hours, 0);
  const dsaHours = entries.filter(e => e.subject === 'DSA').reduce((acc, curr) => acc + curr.hours, 0);
  const webHours = entries.filter(e => e.subject === 'Web Dev').reduce((acc, curr) => acc + curr.hours, 0);
  const aimlHours = entries.filter(e => e.subject === 'AIML').reduce((acc, curr) => acc + curr.hours, 0);
  const otherHours = entries.filter(e => e.subject === 'Other').reduce((acc, curr) => acc + curr.hours, 0);

  const subjectStats = [
    { name: 'DSA', hours: dsaHours, color: 'bg-emerald-500', barColor: 'bg-emerald-500/20 text-emerald-400' },
    { name: 'Java', hours: javaHours, color: 'bg-orange-500', barColor: 'bg-orange-500/20 text-orange-400' },
    { name: 'Web Dev', hours: webHours, color: 'bg-indigo-500', barColor: 'bg-indigo-500/20 text-indigo-400' },
    { name: 'AIML', hours: aimlHours, color: 'bg-yellow-500', barColor: 'bg-yellow-500/20 text-yellow-400' },
    { name: 'Other', hours: otherHours, color: 'bg-zinc-500', barColor: 'bg-zinc-500/20 text-zinc-400' },
  ].sort((a,b) => b.hours - a.hours);

  return (
    <div id="learning-tracker-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* 1. Statistics Cards & Logs */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* KPI stat bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0c0c0e] border border-[#27272a]/85 p-4 rounded-xl text-center shadow-md">
            <span className="text-3xs font-mono text-zinc-500 uppercase tracking-widest font-bold">Aggregate Hours Logged</span>
            <div className="text-3xl font-mono font-bold text-zinc-100 mt-1 pr-1">{totalHours.toFixed(1)}h</div>
          </div>
          <div className="bg-[#0c0c0e] border border-[#27272a]/85 p-4 rounded-xl text-center shadow-md">
            <span className="text-3xs font-mono text-zinc-500 uppercase tracking-widest font-bold">Active Study Days</span>
            <div className="text-3xl font-mono font-bold text-zinc-100 mt-1">
              {new Set(entries.map(e => e.date)).size} days
            </div>
          </div>
          <div className="bg-[#0c0c0e] border border-[#27272a]/85 p-4 rounded-xl text-center shadow-md">
            <span className="text-3xs font-mono text-zinc-500 uppercase tracking-widest font-bold">Intensity Average</span>
            <div className="text-3xl font-mono font-bold text-zinc-100 mt-1">
              {(totalHours / (entries.length || 1)).toFixed(1)}h/session
            </div>
          </div>
        </div>

        {/* Subject Breakdown Progress Blocks */}
        <div className="bg-[#0c0c0e] border border-[#27272a]/80 rounded-xl p-5 space-y-4 shadow-md">
          <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
            <BarChart2 className="h-4 w-4 text-zinc-400" />
            <h4 className="font-display font-semibold text-zinc-150">Subject Hours Allocation</h4>
          </div>

          <div className="space-y-4">
            {subjectStats.map((stat) => {
              const percentage = totalHours > 0 ? (stat.hours / totalHours) * 100 : 0;
              return (
                <div key={stat.name} className="space-y-1.5 animate-fadeIn">
                  <div className="flex justify-between text-3xs font-mono">
                    <span className="text-zinc-200 uppercase font-bold">{stat.name}</span>
                    <span className="text-zinc-450 font-bold">{stat.hours.toFixed(1)} hours ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#09090b] border border-[#27272a]/40 rounded-full overflow-hidden">
                    <div className={`h-full ${stat.color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Learning log stream */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-display font-semibold text-zinc-150">Academic Study History</h4>
            <button
              id="btn-learning-toggle-add"
              onClick={() => setIsAdding(!isAdding)}
              className="px-3.5 py-1.5 bg-[#0c0c0e] hover:bg-[#1a1a1f] border border-zinc-800 text-zinc-300 rounded-lg text-2xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-indigo-400" /> {isAdding ? 'Close form' : 'Log New Session'}
            </button>
          </div>

          {isAdding && (
            <form id="form-add-learning" onSubmit={handleSubmit} className="bg-[#0c0c0e] border border-zinc-800 p-5 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-4 animate-fadeIn shadow-lg">
              <div className="sm:col-span-3">
                <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">SUBJECT</label>
                <select
                  id="log-input-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2 focus:outline-none focus:border-zinc-500 text-zinc-200 cursor-pointer"
                >
                  {['Java', 'DSA', 'Web Dev', 'AIML', 'Other'].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">HOURS SPENT</label>
                <input
                  id="log-input-hours"
                  type="number"
                  step="0.1"
                  required
                  placeholder="2.5, 1..."
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2 focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-700"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">DATE OF SESSION</label>
                <input
                  id="log-input-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs bg-[#09090b] border border-zinc-c border-zinc-800 rounded-lg p-2 focus:outline-none focus:border-zinc-500 text-zinc-200"
                />
              </div>

              <div className="sm:col-span-12">
                <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">TOPICS OR DETAILS WORKED ON</label>
                <input
                  id="log-input-desc"
                  type="text"
                  placeholder="Solved AVL trees implementation code, completed JUnit testing suite..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-700"
                />
              </div>

              <div className="sm:col-span-12 flex justify-end">
                <button
                  id="btn-log-session-submit"
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  Commit Log Entry
                </button>
              </div>
            </form>
          )}

          {/* Historical lists */}
          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="bg-[#0c0c0e] border border-zinc-850 p-12 text-center rounded-xl flex flex-col items-center shadow-inner">
                <BookOpen className="h-10 w-10 text-zinc-600 mb-3" />
                <p className="text-zinc-350 font-display font-semibold text-sm">No study hours logged</p>
                <p className="text-zinc-500 text-xs mt-1">Consistency is key. Log your sessions to generate analyst trends.</p>
              </div>
            ) : (
              [...entries].sort((a,b) => b.date.localeCompare(a.date)).map((e) => (
                <div
                  key={e.id}
                  className="bg-[#0c0c0e]/80 rounded-lg border border-zinc-c border-zinc-850 p-3 hover:border-zinc-700 transition-all flex justify-between items-center gap-4"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-3xs font-mono uppercase tracking-wider rounded border ${
                        e.subject === 'DSA' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                        e.subject === 'Java' ? 'text-orange-400 border-orange-500/20 bg-orange-500/10' :
                        e.subject === 'Web Dev' ? 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10' :
                        e.subject === 'AIML' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10' :
                        'text-zinc-400 border-zinc-500/20 bg-zinc-500/10'
                      }`}>
                        {e.subject}
                      </span>
                      <span className="text-3xs font-mono text-zinc-500">Log Date: {e.date}</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-normal font-medium">
                      {e.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-zinc-300 pr-1">{e.hours} hrs</span>
                    <button
                      id={`btn-delete-learning-${e.id}`}
                      onClick={() => onDelete(e.id)}
                      className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* 2. Side Panel suggestions */}
      <div className="lg:col-span-4">
        <div className="bg-[#0c0c0e] border border-[#27272a]/80 rounded-xl p-5 space-y-4 shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <h4 className="font-display font-semibold text-zinc-150">Focus Index Calculator</h4>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            By analyzing study distributions, goals met and habit logs, your current DSA prep ratio is:
            <span className="text-zinc-200 font-mono font-bold bg-[#09090b] px-1.5 py-0.5 rounded ml-1 border border-zinc-800">
              {((dsaHours / (totalHours || 1)) * 100).toFixed(0)}%
            </span>
          </p>

          <div className="bg-[#09090b]/80 border border-zinc-850 p-4 rounded-xl space-y-3">
            <h5 className="text-3xs font-mono text-zinc-500 uppercase tracking-wider font-bold">AI Study Guidelines</h5>
            <ul className="list-disc list-inside text-xs text-zinc-455 space-y-2 leading-relaxed">
              <li>Keep Java Spring sessions locked in with microservice patterns.</li>
              <li>Aim for at least 60% of logged time devoted to recursive tree structures and DP algorithms.</li>
              <li>Consolidated time blocks are better than sporadic checkouts.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
