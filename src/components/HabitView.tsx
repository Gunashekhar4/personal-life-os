import React, { useState } from 'react';
import { Target, Flame, Award, Trash2, Check, RefreshCw, BarChart, Plus, Calendar } from 'lucide-react';
import { Habit } from '../types';

interface HabitProps {
  habits: Habit[];
  onAdd: (habit: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'successRate' | 'history' | 'createdAt'>) => void;
  onToggleDay: (id: string, date: string) => void;
  onDelete: (id: string) => void;
}

const getLocalDateString = (dateObj: Date): string => {
  const offset = dateObj.getTimezoneOffset();
  const adjusted = new Date(dateObj.getTime() - (offset * 60 * 1000));
  return adjusted.toISOString().split('T')[0];
};

export default function HabitView({ habits, onAdd, onToggleDay, onDelete }: HabitProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Habit['category']>('Leetcode');
  const [isAdding, setIsAdding] = useState(false);

  const todayStr = getLocalDateString(new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      category
    });

    setName('');
    setIsAdding(false);
  };

  // Generate date strings for the past 28 days (for Heatmaps)
  const generatePastDates = () => {
    const dates = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(getLocalDateString(d));
    }
    return dates;
  };

  const heatmapDates = generatePastDates();

  const getCategoryColor = (cat: Habit['category']) => {
    switch (cat) {
      case 'Leetcode': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'CodeChef': return 'text-sky-400 bg-sky-500/10 border-sky-400/20';
      case 'GFG': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Job Apps': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Java Dev': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'Web Dev': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'AIML': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'Custom': return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div id="habit-tracker-module" className="space-y-6">
      
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-zinc-100">Daily Habit Engines</h3>
          <p className="text-xs text-zinc-450">Track and reinforce streaks, DSA consistency, and coding metrics.</p>
        </div>

        <button
          id="btn-habit-toggle-add"
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-505 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-indigo-500/15"
        >
          <Plus className="h-4 w-4" /> {isAdding ? 'Close Builder' : 'Establish Habit'}
        </button>
      </div>

      {/* Habit Maker Tool */}
      {isAdding && (
        <form id="form-add-habit" onSubmit={handleSubmit} className="bg-[#0c0c0e] rounded-xl border border-zinc-803 border-zinc-800 p-5 grid grid-cols-1 sm:grid-cols-12 gap-4 animate-fadeIn shadow-lg">
          <div className="sm:col-span-6">
            <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">HABIT TITLE</label>
            <input
              id="habit-input-title"
              type="text"
              required
              placeholder="CodeChef Short Rounds, Solve 2 GFG topics..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-150 placeholder-zinc-650"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">CORE CATEGORY</label>
            <select
              id="habit-input-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Habit['category'])}
              className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-150"
            >
              {['Leetcode', 'CodeChef', 'GFG', 'Job Apps', 'Java Dev', 'Web Dev', 'AIML', 'Custom'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              id="btn-habit-submit"
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-md shadow-indigo-500/10"
            >
              Lock Habit
            </button>
          </div>
        </form>
      )}

      {/* Habits List & Heatmaps Column */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="bg-[#0c0c0e] rounded-xl border border-zinc-800 p-12 text-center flex flex-col items-center justify-center animate-fadeIn">
            <Flame className="h-10 w-10 text-zinc-700 mb-3" />
            <h4 className="font-display font-semibold text-sm text-zinc-450">No habits tracked in this engine</h4>
            <p className="text-zinc-550 text-xs mt-1 animate-pulse">Consistency compounds. Create a daily practice routine.</p>
          </div>
        ) : (
          habits.map((h) => {
            const isCompletedToday = h.history.includes(todayStr);
            const totalCompletions = h.history.length;
            
            return (
              <div
                key={h.id}
                className="bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center shadow-sm"
              >
                
                {/* Meta details */}
                <div className="space-y-3 flex-1 col-span-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 text-2xs font-mono uppercase tracking-wider border rounded-md ${getCategoryColor(h.category)}`}>
                      {h.category}
                    </span>
                    
                    <span className="text-2xs font-mono text-zinc-500 font-semibold">
                      Completions: {h.successRate}% rate
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      id={`btn-complete-habit-today-${h.id}`}
                      onClick={() => onToggleDay(h.id, todayStr)}
                      className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-all focus:outline-none ${
                        isCompletedToday
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                          : 'border-zinc-750 bg-[#09090b] hover:border-zinc-600 hover:bg-zinc-900 text-transparent'
                      }`}
                      title={isCompletedToday ? "Mark as Incomplete" : "Mark as Completed"}
                    >
                      <Check className="h-4.5 w-4.5" />
                    </button>
                    
                    <h4 className={`font-display font-bold text-base transition-all ${isCompletedToday ? 'text-zinc-550 line-through font-medium' : 'text-zinc-200 hover:text-indigo-400'}`}>
                      {h.name}
                    </h4>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="flex flex-wrap gap-4 p-3 bg-[#09090b] border border-zinc-800 rounded-lg">
                  <div className="flex items-center gap-1.5 px-2">
                    <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                    <div>
                      <div className="text-xs font-mono text-zinc-350 font-bold">{h.streak}d</div>
                      <div className="text-3xs text-zinc-500 font-mono font-bold">STREAK</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2 border-l border-zinc-800">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <div>
                      <div className="text-xs font-mono text-zinc-350 font-bold">{h.bestStreak}d</div>
                      <div className="text-3xs text-zinc-500 font-mono font-bold">BEST</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2 border-l border-zinc-800">
                    <BarChart className="h-4 w-4 text-sky-400" />
                    <div>
                      <div className="text-xs font-mono text-zinc-350 font-bold">{totalCompletions}</div>
                      <div className="text-3xs text-zinc-500 font-mono font-bold">TOTAL</div>
                    </div>
                  </div>
                </div>

                {/* Heatmap Section */}
                <div className="space-y-2 bg-[#09090b] p-3 rounded-lg border border-zinc-800 w-full sm:w-auto shadow-inner">
                  <div className="flex items-center justify-between text-3xs font-mono text-zinc-500 uppercase tracking-widest px-0.5 font-bold mb-0.5 whitespace-nowrap gap-4">
                    <span>28-day core training grid</span>
                    <span className="flex items-center gap-1 font-mono text-[9px]">
                      <span>Less</span>
                      <span className="h-2 w-2 rounded-sm bg-[#18181b] border border-zinc-700/80" />
                      <span className="h-2 w-2 rounded-sm bg-emerald-700 border border-emerald-600" />
                      <span className="h-2 w-2 rounded-sm bg-emerald-500 border border-emerald-400" />
                      <span>More</span>
                    </span>
                  </div>
 
                  <div className="grid grid-cols-7 gap-1 bg-[#101014] p-1.5 border border-zinc-900 rounded max-w-max">
                    {heatmapDates.map((dateStr) => {
                      const isComplete = h.history.includes(dateStr);
                      const isToday = dateStr === todayStr;
                      
                      return (
                        <button
                          key={dateStr}
                          id={`btn-toggle-day-${h.id}-${dateStr}`}
                          onClick={() => onToggleDay(h.id, dateStr)}
                          title={`${dateStr}: ${isComplete ? 'Completed' : 'Not logged'}${isToday ? ' (Today)' : ''}`}
                          className={`h-4 w-4 rounded-sm transition-all focus:outline-none hover:scale-110 cursor-pointer ${
                            isComplete
                              ? 'bg-emerald-500 border border-emerald-600 shadow-[0_0_4px_rgba(16,185,129,0.25)]'
                              : isToday
                                ? 'border border-indigo-500 bg-zinc-900 hover:bg-zinc-800'
                                : 'bg-[#18181b] border border-zinc-900 hover:bg-zinc-800'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Delete button */}
                <div className="self-end xl:self-center border-t xl:border-t-0 xl:border-l border-zinc-800/50 w-full xl:w-auto pt-3 xl:pt-0 xl:pl-3 flex justify-end">
                  <button
                    id={`btn-delete-habit-${h.id}`}
                    onClick={() => {
                      if (window.confirm('Delete this habit engine and reset all historical scores?')) {
                        onDelete(h.id);
                      }
                    }}
                    className="h-8 w-8 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-550/10 hover:border hover:border-red-500/10 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
