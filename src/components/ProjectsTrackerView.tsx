import React, { useState } from 'react';
import { Target, Plus, CheckSquare, Trash2, Calendar, Folder, Award, Settings, Layers } from 'lucide-react';
import { Project, Milestone } from '../types';

interface ProjectsProps {
  projects: Project[];
  onAdd: (project: Omit<Project, 'id' | 'progress' | 'createdAt'>, milestoneNames: string[]) => void;
  onToggleMilestone: (projectId: string, milestoneId: string) => void;
  onDelete: (id: string) => void;
}

export default function ProjectsTrackerView({ projects, onAdd, onToggleMilestone, onDelete }: ProjectsProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Project['status']>('planning');
  const [milestonesText, setMilestonesText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const milestonesArr = milestonesText.split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    onAdd({
      name: name.trim(),
      description: description.trim(),
      status,
      milestones: []
    }, milestonesArr);

    setName('');
    setDescription('');
    setStatus('planning');
    setMilestonesText('');
    setIsAdding(false);
  };

  const getStatusColor = (s: Project['status']) => {
    switch (s) {
      case 'planning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'active': return 'text-sky-400 bg-sky-500/10 border-sky-500/10';
      case 'milestone': return 'text-purple-400 bg-purple-500/10 border-purple-500/10';
      case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10';
    }
  };

  return (
    <div id="projects-tracker-module" className="space-y-6">
      
      {/* 1. Module Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-zinc-850 pb-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-zinc-150">Engineering Portfolio Tracks</h3>
          <p className="text-xs text-zinc-450">Map out milestones, features, and check off completed sprint items.</p>
        </div>

        <button
          id="btn-projects-toggle-add"
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto px-4 py-2 bg-[#0c0c0e] hover:bg-[#1a1a1f] border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4 text-indigo-400" /> {isAdding ? 'Close Builder' : 'Kickoff New Project'}
        </button>
      </div>

      {/* Project Creation Form */}
      {isAdding && (
        <form id="form-add-project" onSubmit={handleSubmit} className="bg-[#0c0c0e] border border-zinc-805 p-5 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-4 animate-fadeIn shadow-lg">
          <div className="sm:col-span-8 space-y-4">
            <div>
              <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold uppercase">Project Name</label>
              <input
                id="project-input-name"
                type="text"
                required
                placeholder="Productivity life, Spring Cloud Gateway..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-700"
              />
            </div>

            <div>
              <label className="block text-3xs font-mono text-zinc-400 mb-1 font-bold uppercase">Description OR Scope</label>
              <textarea
                id="project-input-desc"
                rows={3}
                placeholder="Briefly detail frameworks, databases, and structural architectural plans..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-700"
              />
            </div>
          </div>

          <div className="sm:col-span-4 space-y-4">
            <div>
              <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold uppercase">Project State</label>
              <select
                id="project-input-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Project['status'])}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-zinc-500 text-zinc-200 cursor-pointer text-zinc-300"
              >
                {['planning', 'active', 'milestone', 'completed'].map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold uppercase">MILESTONES (COMMA SEPARATED)</label>
              <input
                id="project-input-milestones"
                type="text"
                placeholder="Setup Kafka, code REST points, build dashboard web view..."
                value={milestonesText}
                onChange={(e) => setMilestonesText(e.target.value)}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-zinc-500 text-zinc-205 placeholder-zinc-700"
              />
            </div>
          </div>

          <div className="sm:col-span-12 flex justify-end">
            <button
              id="btn-project-submit"
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-lg text-xs text-white transition-colors cursor-pointer shadow-md shadow-indigo-500/10"
            >
              Log Project Track
            </button>
          </div>
        </form>
      )}

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-1 md:col-span-2 bg-[#0c0c0e] border border-zinc-850 p-12 text-center rounded-xl flex flex-col items-center shadow-inner">
            <Folder className="h-10 w-10 text-zinc-600 mb-3" />
            <h4 className="font-display font-semibold text-sm text-zinc-350">No projects mapped in active status</h4>
            <p className="text-zinc-500 text-xs mt-1">Add features and milestones to track portfolio completions.</p>
          </div>
        ) : (
          projects.map((p) => {
            return (
              <div key={p.id} className="bg-[#0c0c0e] border border-zinc-850 rounded-xl p-5 flex flex-col justify-between gap-5 hover:border-zinc-700 transition-all shadow-md">
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 border-b border-zinc-850/60 pb-2.5">
                    <span className={`px-2.5 py-0.5 border text-3xs font-mono rounded uppercase tracking-wider ${getStatusColor(p.status)}`}>
                      {p.status}
                    </span>
                    <span className="text-3xs font-mono text-zinc-500">Initiated: {p.createdAt.split('T')[0]}</span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-display font-semibold text-lg text-zinc-150 leading-tight">{p.name}</h4>
                    <p className="text-xs text-zinc-400 leading-normal">{p.description}</p>
                  </div>

                  {/* Milestones List checkboxes */}
                  {p.milestones.length > 0 && (
                    <div className="space-y-2 bg-[#09090b] p-3 rounded-lg border border-zinc-850">
                      <div className="flex items-center gap-1.5 text-3xs font-mono text-zinc-500 uppercase tracking-wider pb-1 ml-0.5">
                        <Layers className="h-3 w-3 text-indigo-400" />
                        <span>Sprint deliverables checkoff</span>
                      </div>
                      
                      <div className="space-y-2">
                        {p.milestones.map((ms) => (
                          <div key={ms.id} className="flex items-start gap-2 text-xs font-mono">
                            <button
                              id={`btn-toggle-milestone-${p.id}-${ms.id}`}
                              onClick={() => onToggleMilestone(p.id, ms.id)}
                              className={`h-4 w-4 rounded border mt-0.5 flex items-center justify-center transition-all focus:outline-none cursor-pointer ${
                                ms.completed
                                  ? 'bg-emerald-600 border-emerald-650 text-white'
                                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-transparent'
                              }`}
                            >
                              {ms.completed && <CheckSquare className="h-3 w-3 text-white" />}
                            </button>
                            <span className={`leading-normal ${ms.completed ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                              {ms.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-2 pt-3 border-t border-zinc-850">
                  <div className="flex justify-between text-3xs font-mono">
                    <span className="text-zinc-500 font-bold">PROJECT COMPLETION</span>
                    <span className="text-indigo-400 font-bold pr-0.5">{p.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#09090b] rounded-full border border-zinc-c border-zinc-800 overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${p.progress}%` }} />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      id={`btn-delete-project-${p.id}`}
                      onClick={() => {
                        if (window.confirm('Delete this portfolio project and erase all milestones?')) {
                          onDelete(p.id);
                        }
                      }}
                      className="text-zinc-600 hover:text-red-400 text-3xs font-mono uppercase bg-[#09090b] px-2.5 py-1 rounded border border-zinc-850 hover:border-zinc-700 transition-all cursor-pointer"
                    >
                      Delete Track
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
