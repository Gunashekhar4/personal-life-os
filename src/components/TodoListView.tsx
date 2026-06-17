import React, { useState, useEffect } from 'react';
import { Plus, ListTodo, Check, Trash2, Calendar, Search, Tag, AlertCircle, Sparkles } from 'lucide-react';

export type PriorityLevel = 'High' | 'Medium' | 'Low';

interface UntimedTodo {
  id: string;
  text: string;
  completed: boolean;
  priority?: PriorityLevel;
  category?: string;
  dueDate?: string;
}

export default function TodoListView() {
  const [todos, setTodos] = useState<UntimedTodo[]>(() => {
    const saved = localStorage.getItem('life_os_untimed_todos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => {
            let normPriority: PriorityLevel = 'Medium';
            if (item.priority) {
              const p = item.priority.toLowerCase();
              if (p === 'high') normPriority = 'High';
              else if (p === 'low') normPriority = 'Low';
              else normPriority = 'Medium';
            }
            return {
              ...item,
              priority: normPriority
            };
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Default fallback seed items
    return [
      { id: 'ut-1', text: 'Prepare notes for upcoming machine learning assignment', completed: false, priority: 'High', category: 'AIML' },
      { id: 'ut-2', text: 'Find referrals on LinkedIn for SDE core positions', completed: true, priority: 'Medium', category: 'Career' },
      { id: 'ut-3', text: 'Solve CodeChef practice challenge tasks', completed: false, priority: 'Low', category: 'Leetcode' },
      { id: 'ut-4', text: 'Review Amazon online assessment preparation track sheet', completed: false, priority: 'High', category: 'Leetcode' },
      { id: 'ut-5', text: 'Update resume with LaTeX template for internship applications', completed: true, priority: 'Medium', category: 'Career' }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [category, setCategory] = useState('General');
  const [dueDate, setDueDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    localStorage.setItem('life_os_untimed_todos', JSON.stringify(todos));
  }, [todos]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newTodo: UntimedTodo = {
      id: `ut-${Date.now()}`,
      text: inputText.trim(),
      completed: false,
      priority,
      category: category.trim() || 'General',
      dueDate: dueDate || undefined
    };

    setTodos([newTodo, ...todos]);
    setInputText('');
    setDueDate('');
    setPriority('Medium');
  };

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const handleClearCompleted = () => {
    setTodos(todos.filter(t => !t.completed));
  };

  // Filter & Search computation
  const filteredTodos = todos.filter(t => {
    const matchesSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' ? true : 
                          filterStatus === 'completed' ? t.completed : !t.completed;
    
    const matchesPriority = filterPriority === 'all' ? true : (t.priority?.toLowerCase() === filterPriority.toLowerCase());

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate high-level metrics
  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const activeCount = totalCount - completedCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header and KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <ListTodo className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-zinc-150">Durable Backlog Task Console</h3>
            <p className="text-3xs text-zinc-450 font-mono tracking-wide mt-0.5 uppercase">MANAGE & TRACE NON-TIME-SPECIFIC OBJECTIVES</p>
          </div>
        </div>

        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 flex flex-col justify-center shadow-sm">
          <div className="text-sm font-mono text-zinc-500 uppercase tracking-widest font-bold">Progress Rate</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-mono font-bold text-indigo-400">{completionPercentage}%</span>
            <span className="text-[10px] text-zinc-400 font-mono">({completedCount}/{totalCount})</span>
          </div>
          <div className="w-full bg-zinc-950 h-1.5 rounded-full mt-2 overflow-hidden border border-zinc-900">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 flex flex-col justify-center shadow-sm">
          <div className="text-sm font-mono text-zinc-500 uppercase tracking-widest font-bold">Active Backlog</div>
          <div className="text-lg font-mono font-bold text-zinc-150 mt-1">
            {activeCount} <span className="text-3xs font-sans text-zinc-500 font-normal">items pending</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Create Task Form & Filtering */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Create Task Form */}
          <div className="bg-[#0c0c0e] border border-[#27272a]/80 rounded-xl p-5 space-y-4 shadow-sm">
            <h4 className="font-display font-semibold text-xs text-zinc-200 uppercase tracking-wider font-bold">Register Untimed Task</h4>
            
            <form onSubmit={handleAddTodo} className="space-y-4">
              <div>
                <label className="block text-4xs font-mono text-zinc-450 uppercase font-bold mb-1.5">Task Description</label>
                <textarea
                  id="todo-desc-input"
                  required
                  rows={2}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="e.g. Master dynamic programming knapsack solutions, compile research..."
                  className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-150 placeholder-zinc-700 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-4xs font-mono text-zinc-450 uppercase font-bold mb-1.5">Priority</label>
                  <select
                    id="todo-priority-input"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs bg-[#09090b] border border-zinc-805 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-150"
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-4xs font-mono text-zinc-450 uppercase font-bold mb-1.5">Category</label>
                  <select
                    id="todo-cat-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs bg-[#09090b] border border-zinc-805 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-150"
                  >
                    <option value="General">📦 General</option>
                    <option value="Leetcode">💻 LeetCode</option>
                    <option value="AIML">🧠 AIML</option>
                    <option value="Java">☕ Java Dev</option>
                    <option value="Career">💼 Career</option>
                    <option value="Projects">🔨 Projects</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-4xs font-mono text-zinc-450 uppercase font-bold mb-1.5">Optional Target Date</label>
                <div className="relative">
                  <input
                    id="todo-date-input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs bg-[#09090b] border border-zinc-805 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-150"
                  />
                </div>
              </div>

              <button
                id="btn-add-todo-big"
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/30"
              >
                <Plus className="h-4 w-4" /> Add to Backlog
              </button>
            </form>
          </div>

          {/* Quick Filters */}
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
            <h4 className="font-display font-semibold text-xs text-zinc-200 uppercase tracking-wider font-bold">Query Framework</h4>
            
            <div className="space-y-3.5">
              <div>
                <label className="block text-4xs font-mono text-zinc-500 uppercase font-bold mb-1.5">Filter by State</label>
                <div className="grid grid-cols-3 gap-1 bg-[#09090b] p-1 border border-zinc-850 rounded-lg">
                  {(['all', 'active', 'completed'] as const).map((st) => (
                    <button
                      id={`btn-todo-state-${st}`}
                      key={st}
                      type="button"
                      onClick={() => setFilterStatus(st)}
                      className={`py-1 text-4xs font-mono font-bold rounded capitalize cursor-pointer transition-all ${
                        filterStatus === st 
                          ? 'bg-zinc-800 text-zinc-200' 
                          : 'text-zinc-500 hover:text-zinc-350'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-4xs font-mono text-zinc-500 uppercase font-bold mb-1.5">Filter by Priority</label>
                <div className="grid grid-cols-4 gap-1 bg-[#09090b] p-1 border border-zinc-850 rounded-lg">
                  {['all', 'High', 'Medium', 'Low'].map((p) => (
                    <button
                      id={`btn-todo-priority-${p}`}
                      key={p}
                      type="button"
                      onClick={() => setFilterPriority(p)}
                      className={`py-1 text-4xs font-mono font-bold rounded capitalize cursor-pointer transition-all ${
                        filterPriority === p 
                          ? 'bg-zinc-800 text-zinc-200' 
                          : 'text-zinc-500 hover:text-zinc-350'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {todos.some(t => t.completed) && (
                <button
                  id="btn-todo-clear-completed"
                  type="button"
                  onClick={handleClearCompleted}
                  className="w-full py-1.5 border border-red-950/20 bg-red-950/5 hover:bg-red-950/15 text-red-400 text-5xs font-mono uppercase tracking-widest font-bold rounded-lg transition-colors cursor-pointer"
                >
                  🧹 Clear completed backlog items
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Backlog Queue Registry List */}
        <div className="lg:col-span-8 bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 space-y-4 flex flex-col shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-zinc-855 pb-4">
            <div className="flex items-center gap-2">
              <h4 className="font-display font-semibold text-sm text-zinc-100 flex items-center gap-2">
                Active Task Stack
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-xs font-bold leading-none">
                  {filteredTodos.length}
                </span>
              </h4>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-zinc-650 absolute left-2.5 top-2.5" />
              <input
                id="todo-search-query"
                type="text"
                placeholder="Search description/tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#09090b] border border-zinc-850 pl-8 pr-3 py-1.5 rounded-lg text-2xs focus:outline-none focus:ring-1 focus:ring-indigo-505 placeholder-zinc-700 text-zinc-250 w-full sm:w-48"
              />
            </div>
          </div>

          {/* List Area */}
          <div className="space-y-2.5 flex-1 max-h-[600px] overflow-y-auto pr-1">
            {filteredTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-zinc-950/80 border border-zinc-900 flex items-center justify-center text-zinc-600 mb-3 font-mono">?</div>
                <h5 className="text-xs font-semibold text-zinc-400">Empty Backlog Registry</h5>
                <p className="text-3xs text-zinc-550 max-w-xs mt-1">No items match your selected filters, or queue is fully complete. Log a new task to track!</p>
              </div>
            ) : (
              filteredTodos.map((t) => {
                const isHigh = t.priority === 'High' || t.priority === 'high';
                const isMedium = t.priority === 'Medium' || t.priority === 'medium';
                const isLow = t.priority === 'Low' || t.priority === 'low';

                return (
                  <div
                    key={t.id}
                    className={`group min-h-[4.5rem] flex items-start gap-4 p-3.5 rounded-xl border transition-all duration-200 ${
                      t.completed
                        ? 'border-emerald-950/20 bg-emerald-950/5 opacity-60'
                        : 'border-[#27272a]/50 bg-[#09090b] hover:border-zinc-700/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)]'
                    }`}
                  >
                    {/* Tick action on the left side */}
                    <button
                      id={`btn-todo-tick-${t.id}`}
                      type="button"
                      onClick={() => handleToggleTodo(t.id)}
                      title={t.completed ? "Mark incomplete" : "Mark complete"}
                      className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all focus:outline-none shrink-0 cursor-pointer mt-0.5 ${
                        t.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-zinc-700 hover:border-indigo-400 hover:bg-indigo-950/10 bg-zinc-950/40'
                      }`}
                    >
                      {t.completed && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />}
                    </button>

                    {/* Information Cluster */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <span className={`text-[13.5px] md:text-sm font-semibold tracking-wide leading-relaxed block ${t.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                        {t.text}
                      </span>
                      
                      {/* Meta Tags list */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        
                        {/* Priority Pill */}
                        {t.priority && (
                          <span className={`text-[10px] md:text-2xs font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border flex items-center justify-center ${
                            isHigh ? 'border-red-500/30 bg-red-500/10 text-red-300' :
                            isMedium ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' :
                            'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                          }`}>
                            <span className="mr-1">{isHigh ? '🔴' : isMedium ? '🟡' : '🟢'}</span>
                            {t.priority}
                          </span>
                        )}

                        {/* Category Tag */}
                        {t.category && (
                          <span className="text-[10px] md:text-2xs font-mono font-bold tracking-wider text-indigo-300 bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-500/25 flex items-center gap-1.5">
                            <Tag className="h-3 w-3 text-indigo-400 shrink-0" />
                            {t.category}
                          </span>
                        )}

                        {/* Due Date Indicator */}
                        {t.dueDate && (
                          <span className="text-[10px] md:text-2xs font-mono font-bold tracking-wider text-rose-300 bg-rose-950/30 px-2 py-0.5 rounded border border-rose-500/25 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-rose-450 shrink-0" />
                            Due: {t.dueDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete action on the right */}
                    <button
                      id={`btn-todo-delete-${t.id}`}
                      type="button"
                      onClick={() => handleDeleteTodo(t.id)}
                      title="Remove task"
                      className="text-zinc-600 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer shrink-0 mt-0.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Legend Footer */}
          <div className="border-t border-zinc-850 pt-2.5 flex items-center justify-between text-4xs font-mono text-zinc-650">
            <span>🔴 High = Action required</span>
            <span>✓ Click tick button on left to toggle task state</span>
          </div>
        </div>

      </div>

    </div>
  );
}
