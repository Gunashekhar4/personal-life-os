import React, { useState } from 'react';
import { Target, Plus, Check, Briefcase, Trash2, Calendar, DollarSign, Award, Layers, BarChart, ArrowUpRight } from 'lucide-react';
import { JobApplication, JobStatus } from '../types';

interface JobProps {
  applications: JobApplication[];
  onAdd: (app: Omit<JobApplication, 'id'>) => void;
  onUpdateStatus: (id: string, status: JobStatus) => void;
  onDelete: (id: string) => void;
}

const JOB_STATUS_FLOW: { key: JobStatus; label: string; color: string }[] = [
  { key: 'Wishlist', label: 'Wishlist', color: 'border-zinc-800 bg-[#09090b] text-zinc-450' },
  { key: 'Applied', label: 'Applied', color: 'border-amber-500/10 bg-amber-500/5 text-amber-300' },
  { key: 'OA', label: 'OA Stage', color: 'border-sky-500/15 bg-sky-500/5 text-sky-450' },
  { key: 'Interview', label: 'Interviews', color: 'border-indigo-505/15 bg-indigo-505/5 text-indigo-400' },
  { key: 'Offer', label: 'Offers', color: 'border-emerald-500/20 bg-emerald-505/5 text-emerald-300' },
  { key: 'Rejected', label: 'Rejections', color: 'border-zinc-850 bg-[#09090b] text-zinc-550' }
];

export default function JobFunnelView({ applications, onAdd, onUpdateStatus, onDelete }: JobProps) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState<JobStatus>('Applied');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    onAdd({
      company: company.trim(),
      role: role.trim(),
      salary: salary.trim() || undefined,
      status,
      applicationUrl: url.trim() || undefined,
      notes: notes.trim(),
      dateApplied: new Date().toISOString().split('T')[0]
    });

    setCompany('');
    setRole('');
    setSalary('');
    setStatus('Applied');
    setUrl('');
    setNotes('');
    setIsAdding(false);
  };

  // Funnel allocation metrics calculations
  const countByStatus = (st: JobStatus) => applications.filter(a => a.status === st).length;

  return (
    <div id="job-applications-module" className="space-y-6">
      
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-zinc-100">Career Search Strategy</h3>
          <p className="text-xs text-zinc-450">Pipeline internship leads, track interview rounds, salary logs, and feedback loops.</p>
        </div>

        <button
          id="btn-job-toggle-add"
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-indigo-500/15"
        >
          <Plus className="h-4 w-4" /> {isAdding ? 'Close Builder' : 'Log Internship Lead'}
        </button>
      </div>

      {/* Dynamic Funnel Chart Row */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2">
        {JOB_STATUS_FLOW.map((flow) => {
          const count = countByStatus(flow.key);
          return (
            <div key={flow.key} className="bg-[#0c0c0e] border border-[#27272a]/80 p-3 rounded-xl text-center flex flex-col justify-between shadow-sm">
              <span className={`text-3xs uppercase tracking-wider font-mono font-bold ${flow.key === 'Rejected' ? 'text-zinc-650' : 'text-zinc-500'}`}>
                {flow.label}
              </span>
              <div className="text-2xl font-mono font-bold text-zinc-150 mt-1.5">{count}</div>
            </div>
          );
        })}
      </div>

      {/* New Application capture form drawer */}
      {isAdding && (
        <form id="form-add-job" onSubmit={handleSubmit} className="bg-[#0c0c0e] border border-zinc-800 p-5 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-4 animate-fadeIn shadow-lg">
          <div className="md:col-span-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-3xs font-mono text-zinc-550 mb-1 font-bold">COMPANY NAME</label>
                <input
                  id="job-input-company"
                  type="text"
                  required
                  placeholder="Google, Stripe, Netflix..."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-700"
                />
              </div>

              <div>
                <label className="block text-3xs font-mono text-zinc-550 mb-1 font-bold">INTERNSHIP ROLE / LEVEL</label>
                <input
                  id="job-input-role"
                  type="text"
                  required
                  placeholder="SWE Intern, Backend Dev..."
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-705"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-3xs font-mono text-zinc-550 mb-1 font-bold">COMPENSATION DETAILS (OPTIONAL)</label>
                <input
                  id="job-input-salary"
                  type="text"
                  placeholder="$12k/month, $45/hr..."
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-750"
                />
              </div>

              <div>
                <label className="block text-3xs font-mono text-zinc-550 mb-1 font-bold">JOB DESCRIPTION LINK (OPTIONAL)</label>
                <input
                  id="job-input-url"
                  type="url"
                  placeholder="https://careers.google.com/jobs/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-750"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-4 space-y-4">
            <div>
              <label className="block text-3xs font-mono text-zinc-550 mb-1 font-bold">APPLICATION PIPELINE STATE</label>
              <select
                id="job-input-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:border-zinc-500 text-zinc-200 cursor-pointer"
              >
                {JOB_STATUS_FLOW.map(flow => (
                  <option key={flow.key} value={flow.key}>{flow.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-3xs font-mono text-zinc-550 mb-1 font-bold">DIAGNOSTIC NOTES OR PROGRESS COMMENTS</label>
              <input
                id="job-input-notes"
                type="text"
                placeholder="Passed resume screening, OA solved 2/2..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs bg-[#09090b] border border-zinc-805 rounded-lg p-2.5 focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-700"
              />
            </div>
          </div>

          <div className="md:col-span-12 flex justify-end">
            <button
              id="btn-job-submit"
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-indigo-500/15"
            >
              Verify & Pipeline Lead
            </button>
          </div>
        </form>
      )}

      {/* Interactive Kanban Grid style of list application cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(['Wishlist', 'Applied', 'OA', 'Interview', 'Offer', 'Rejected'] as JobStatus[]).map((channelKey) => {
          const chanObj = JOB_STATUS_FLOW.find(x => x.key === channelKey)!;
          const channelApps = applications.filter(a => a.status === channelKey);
          
          return (
            <div key={channelKey} className="bg-[#0c0c0e] border border-[#27272a]/80 p-4 rounded-xl space-y-4 shadow-sm">
              
              <div className="flex items-center justify-between border-b border-zinc-850 pb-2 flex-wrap">
                <span className="text-2xs font-mono uppercase tracking-wider font-bold text-zinc-350">
                  {chanObj.label}
                </span>
                <span className="text-3xs font-mono text-zinc-500 font-bold">{channelApps.length} applications</span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {channelApps.length === 0 ? (
                  <div className="py-8 text-center text-3xs font-mono text-zinc-650 italic">
                    Grid empty
                  </div>
                ) : (
                  channelApps.map((a) => (
                    <div key={a.id} className="bg-[#09090b] border border-zinc-805 p-3 rounded-lg space-y-3 hover:border-zinc-700 transition-all shadow-sm">
                      
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-display font-semibold text-xs text-zinc-150 truncate">{a.company}</h4>
                          <button
                            id={`btn-delete-job-${a.id}`}
                            onClick={() => {
                              if (window.confirm('Delete job application from registry?')) {
                                onDelete(a.id);
                              }
                            }}
                            className="text-zinc-600 hover:text-red-400 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-3xs font-mono text-zinc-450 uppercase tracking-wide truncate">{a.role}</p>
                      </div>

                      {/* Salary log details */}
                      {a.salary && (
                        <div className="flex items-center gap-1 text-3xs font-mono text-emerald-400">
                          <DollarSign className="h-3 w-3" />
                          <span>Comp: {a.salary}</span>
                        </div>
                      )}

                      {/* Notes comments */}
                      {a.notes && (
                        <p className="text-3xs font-mono text-zinc-400 bg-[#0c0c0e]/60 p-2 rounded border border-zinc-850 leading-normal">
                          {a.notes}
                        </p>
                      )}

                      {/* Interactive Next-Stage transition dropdown */}
                      <div className="flex items-center justify-between gap-2 border-t border-zinc-850 pt-2 flex-wrap">
                        {a.applicationUrl ? (
                          <a
                            href={a.applicationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-3xs font-mono text-zinc-400 hover:text-white flex items-center gap-0.5 border-b border-zinc-800 pb-0.5 capitalize transition-colors"
                          >
                            Careers URL <ArrowUpRight className="h-2.5 w-2.5 text-zinc-500" />
                          </a>
                        ) : (
                          <span className="text-3xs font-mono text-zinc-650">No external URL</span>
                        )}

                        <select
                          id={`change-job-status-${a.id}`}
                          value={a.status}
                          onChange={(e) => onUpdateStatus(a.id, e.target.value as JobStatus)}
                          className="text-3xs font-mono bg-[#09090b] border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-505 cursor-pointer"
                        >
                          <option value="Wishlist">Wishlist</option>
                          <option value="Applied">Applied</option>
                          <option value="OA">OA Stage</option>
                          <option value="Interview">Interview</option>
                          <option value="Offer">Offer</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
