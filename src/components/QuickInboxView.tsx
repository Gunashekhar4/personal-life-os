import React, { useState } from 'react';
import { Inbox, Plus, Search, Archive, Trash2, Link, FileText, CheckCircle, Tag, Sparkles } from 'lucide-react';
import { InboxItem, InboxType } from '../types';

interface QuickInboxProps {
  items: InboxItem[];
  onAdd: (item: Omit<InboxItem, 'id' | 'createdAt'>) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function QuickInboxView({ items, onAdd, onArchive, onDelete }: QuickInboxProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<InboxType>('idea');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [filterType, setFilterType] = useState<string>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      content: content.trim(),
      type,
      status: 'active'
    });
    setTitle('');
    setContent('');
    setType('idea');
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.content.toLowerCase().includes(search.toLowerCase());
    const matchesTab = item.status === activeTab;
    const matchesFilterType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesTab && matchesFilterType;
  });

  const getTypeColor = (t: InboxType) => {
    switch (t) {
      case 'idea': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'task': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'article': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'link': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'video': return 'text-red-400 bg-red-500/10 border-red-500/10';
      case 'note': return 'text-zinc-400 bg-zinc-800/40 border-zinc-800';
      case 'opportunity': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  return (
    <div id="quick-inbox-module" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Fast Capture Form */}
      <div className="lg:col-span-1">
        <div className="bg-[#0c0c0e] rounded-xl border border-zinc-800 p-5 sticky top-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <h3 className="font-display font-semibold text-lg text-zinc-200">Capture Idea / Item</h3>
          </div>
          
          <form id="form-quick-capture" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">TITLE</label>
              <input
                id="inbox-input-title"
                type="text"
                required
                placeholder="Amazon deadline, OAuth design, GFG round..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-150 placeholder-zinc-650"
              />
            </div>

            <div>
              <label className="block text-3xs font-mono text-zinc-500 mb-1 font-bold">CONTENT / DETAILS (OPTIONAL)</label>
              <textarea
                id="inbox-input-content"
                rows={4}
                placeholder="Code snippets, URL links, meeting details..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-150 placeholder-zinc-650"
              />
            </div>

            <div>
              <label className="block text-3xs font-mono text-zinc-500 mb-1.5 font-bold">CLASSIFY CATEGORY</label>
              <div className="grid grid-cols-2 gap-2">
                {(['idea', 'task', 'article', 'link', 'video', 'note', 'opportunity'] as InboxType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-2 text-xs font-semibold rounded-lg border text-left flex items-center justify-between capitalize transition-all ${
                      type === t 
                        ? 'bg-indigo-600/10 text-indigo-400 border-indigo-550/30 font-bold shadow-md' 
                        : 'bg-[#09090b]/40 text-zinc-450 border-zinc-800 hover:bg-zinc-800/40 hover:text-zinc-200'
                    }`}
                  >
                    <span>{t}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${type === t ? 'bg-indigo-400' : 'bg-current opacity-40'}`} />
                  </button>
                ))}
              </div>
            </div>

            <button
              id="btn-submit-quick-capture"
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <Plus className="h-4 w-4" /> Secure Capture
            </button>
          </form>
        </div>
      </div>

      {/* 2. Captured Inbox Stream */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Controls, tab selectors and search bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0c0c0e] rounded-xl border border-zinc-800 p-4">
          <div className="flex gap-2 p-1 bg-[#09090b] rounded-lg border border-zinc-800 w-full sm:w-auto">
            <button
              id="btn-inbox-tab-active"
              onClick={() => setActiveTab('active')}
              className={`flex-1 sm:flex-none px-4 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'active' ? 'bg-zinc-800 text-indigo-450 text-indigo-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Active Stream ({items.filter(i => i.status === 'active').length})
            </button>
            <button
              id="btn-inbox-tab-archived"
              onClick={() => setActiveTab('archived')}
              className={`flex-1 sm:flex-none px-4 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'archived' ? 'bg-zinc-800 text-indigo-450 text-indigo-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Archive ({items.filter(i => i.status === 'archived').length})
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search captured stack..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-200 placeholder-zinc-650"
            />
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2 py-1">
          {['all', 'idea', 'task', 'article', 'link', 'video', 'note', 'opportunity'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-3 py-1 text-2xs uppercase tracking-wider font-mono rounded-full border transition-all ${
                filterType === cat
                  ? 'bg-indigo-600/10 text-indigo-400 font-semibold border-indigo-500/30'
                  : 'bg-zinc-900/60 text-zinc-450 border-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stream Stack */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-[#0c0c0e] rounded-xl border border-zinc-800 p-12 text-center flex flex-col items-center">
              <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
                <Inbox className="h-5 w-5" />
              </div>
              <p className="text-zinc-450 font-display font-semibold text-sm">No items in this inbox category</p>
              <p className="text-zinc-500 text-xs mt-1">Capture everything instantly so you do not break focus.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-[#0c0c0e] rounded-xl border border-zinc-800 p-5 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-sm"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-2xs font-mono uppercase tracking-wider rounded-md border ${getTypeColor(item.type)}`}>
                      {item.type}
                    </span>
                    <span className="text-2xs font-mono text-zinc-500">
                      {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="font-display font-semibold text-zinc-200 group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h4>

                  {item.content && (
                    <p className="text-xs text-zinc-350 font-mono whitespace-pre-wrap bg-[#09090b] p-3 border border-zinc-805 rounded-lg leading-relaxed shadow-inner">
                      {item.content}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex gap-2 self-end sm:self-start sm:border-l sm:border-zinc-800/60 sm:pl-3">
                  {item.status === 'active' && (
                    <button
                      id={`btn-archive-${item.id}`}
                      onClick={() => onArchive(item.id)}
                      title="Archive captured note"
                      className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-750 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    id={`btn-delete-${item.id}`}
                    onClick={() => {
                      if (window.confirm('Delete this entry from inbox stack?')) {
                        onDelete(item.id);
                      }
                    }}
                    title="Delete reference"
                    className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/30 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 flex items-center justify-center transition-all cursor-pointer"
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
  );
}
