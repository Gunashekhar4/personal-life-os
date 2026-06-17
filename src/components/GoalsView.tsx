import React, { useState } from 'react';
import { Target, Plus, CheckCircle, Calendar, Trash2, Sliders, Play, Sparkles, TrendingUp } from 'lucide-react';
import { Goal, GoalType } from '../types';

interface GoalsProps {
  goals: Goal[];
  onAdd: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  onToggleComplete: (id: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onDelete: (id: string) => void;
}

export default function GoalsView({ goals, onAdd, onToggleComplete, onUpdateProgress, onDelete }: GoalsProps) {
  const [activeTab, setActiveTab] = useState<GoalType>('weekly');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Goal['category']>('DSA');
  const [targetDate, setTargetDate] = useState('');
  const [criteria, setCriteria] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;

    onAdd({
      title: title.trim(),
      type: activeTab,
      category,
      targetDate,
      progress: 0,
      completed: false,
      criteria: criteria.trim() || undefined
    });

    setTitle('');
    setCriteria('');
    setIsAdding(false);
  };

  const filteredGoals = goals.filter(g => g.type === activeTab);

  return (
    <div id="goals-manager-module" className="space-y-6">
      
      {/* Tab selectors for Yearly, Monthly, Weekly, Daily goals */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex gap-2 p-1 bg-[#09090b] rounded-xl border border-zinc-800 w-full sm:w-auto">
          {(['yearly', 'monthly', 'weekly', 'daily'] as GoalType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`flex-1 sm:flex-none px-5 py-2 text-xs font-semibold uppercase tracking-wider font-mono rounded-lg transition-all ${
                activeTab === type
                  ? 'bg-zinc-800 text-indigo-400 font-bold shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-350'
              }`}
            >
              {type} goals
            </button>
          ))}
        </div>

        <button
          id="btn-goals-toggle-add"
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto px-4 py-2 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-indigo-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="h-4 w-4" /> {isAdding ? 'Close Drawer' : 'Formulate Goal'}
        </button>
      </div>

      {/* Goal creation drawer */}
      {isAdding && (
        <form id="form-add-goal" onSubmit={handleSubmit} className="bg-[#0c0c0e] rounded-xl border border-zinc-800 p-5 grid grid-cols-1 md:grid-cols-12 gap-4 animate-fadeIn shadow-lg">
          <div className="md:col-span-8 space-y-4">
            <div>
              <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">GOAL DESCRIPTION</label>
              <input
                id="goal-input-title"
                type="text"
                required
                placeholder="Complete 50 LeetCode, Polish portfolio backend, launch life os app..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-150"
              />
            </div>

            <div>
              <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">SUCCESS METRIC / CRITERIA (OPTIONAL)</label>
              <input
                id="goal-input-criteria"
                type="text"
                placeholder="Compile LaTeX code, host microservices on Cloud Run, complete test run..."
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-150 animate-fadeIn"
              />
            </div>
          </div>

          <div className="md:col-span-4 space-y-4">
            <div>
              <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">DSA / TECH FOCUS</label>
              <select
                id="goal-input-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Goal['category'])}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-150"
              >
                {['DSA', 'Java', 'Web Dev', 'AIML', 'Productivity', 'General'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">TARGET DATE</label>
              <input
                id="goal-input-date"
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-200"
              />
            </div>
          </div>

          <div className="md:col-span-12 pt-2 border-t border-zinc-800/80 flex justify-end">
            <button
              id="btn-goals-submit"
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Verify & Lock Goal
            </button>
          </div>
        </form>
      )}

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGoals.length === 0 ? (
          <div className="col-span-1 md:col-span-2 bg-[#0c0c0e] rounded-xl border border-zinc-800 p-12 text-center flex flex-col items-center justify-center">
            <Target className="h-10 w-10 text-zinc-700 mb-3 animate-pulse" />
            <h4 className="font-display font-semibold text-sm text-zinc-450">No active {activeTab} goals set</h4>
            <p className="text-zinc-500 text-xs mt-1">Break big yearly milestones down into weekly and daily activities.</p>
          </div>
        ) : (
          filteredGoals.map((g) => {
            const isCompleted = g.completed || g.progress === 100;
            return (
              <div
                key={g.id}
                className={`glass-panel border rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between gap-4 ${
                  isCompleted ? 'border-emerald-500/20 bg-emerald-950/5' : 'border-zinc-800/80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="px-2.5 py-0.5 text-2xs font-mono tracking-wider uppercase border border-zinc-800 rounded bg-zinc-900 text-indigo-400 font-bold">
                      {g.category}
                    </span>
                    
                    <div className="flex items-center gap-1 text-2xs font-mono text-zinc-500">
                      <Calendar className="h-3 w-3" />
                      <span>By: {g.targetDate}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <button
                      id={`btn-toggle-goal-${g.id}`}
                      onClick={() => onToggleComplete(g.id)}
                      className={`h-5 w-5 rounded border mt-0.5 flex items-center justify-center transition-all focus:outline-none ${
                        isCompleted 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                          : 'border-zinc-700 bg-zinc-900/45 hover:border-zinc-550'
                      }`}
                    >
                      {isCompleted && <CheckCircle className="h-4 w-4 bg-emerald-600 rounded-full" />}
                    </button>
                    
                    <div className="space-y-1">
                      <h4 className={`font-display font-semibold text-sm transition-all ${
                        isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200'
                      }`}>
                        {g.title}
                      </h4>
                      {g.criteria && (
                        <p className="text-2xs font-mono text-zinc-400 leading-normal bg-[#09090b] p-2.5 rounded border border-zinc-800/60 shadow-inner">
                          🎯 CRITERIA: {g.criteria}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Sliders & Controls */}
                <div className="space-y-3 pt-3 border-t border-zinc-800/60 flex flex-col justify-end">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-2xs font-mono">
                      <span className="text-zinc-500">METRICS COMPLETION</span>
                      <span className={`${isCompleted ? 'text-emerald-400 font-bold' : 'text-zinc-400'}`}>
                        {g.progress}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        id={`goal-progress-slider-${g.id}`}
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={g.progress}
                        onChange={(e) => onUpdateProgress(g.id, parseInt(e.target.value))}
                        className="flex-1 accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      id={`btn-delete-goal-${g.id}`}
                      onClick={() => {
                        if (window.confirm('Erase this goal from your active OS list?')) {
                          onDelete(g.id);
                        }
                      }}
                      className="text-zinc-600 hover:text-red-400 px-1 py-1 rounded transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
