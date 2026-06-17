import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckSquare, Plus, Bell, RefreshCw, Play, Pause, Square, ChevronRight, Zap, Target } from 'lucide-react';
import { TimeboxBlock, TimeSlot } from '../types';

interface TimeboxProps {
  blocks: TimeboxBlock[];
  onAddBlock: (block: Omit<TimeboxBlock, 'id'>) => void;
  onToggleBlockComplete: (id: string) => void;
  onUpdateReplanNotes: (id: string, notes: string) => void;
  onRescheduleBlock: (id: string, newSlot: TimeSlot) => void;
  onDeleteBlock: (id: string) => void;
}

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00', '00:30',
  '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30'
];

interface UntimedTodo {
  id: string;
  text: string;
  completed: boolean;
}

export function formatTo12Hour(slot: string): string {
  const [hourStr, minStr] = slot.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${minStr} ${ampm}`;
}

export default function TimeboxView({ blocks, onAddBlock, onToggleBlockComplete, onUpdateReplanNotes, onRescheduleBlock, onDeleteBlock }: TimeboxProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>('08:00');
  const [taskText, setTaskText] = useState('');
  
  // Untimed Todo List state
  const [untimedTodos, setUntimedTodos] = useState<UntimedTodo[]>(() => {
    const saved = localStorage.getItem('life_os_untimed_todos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 'ut-1', text: 'Prepare notes for upcoming machine learning assignment', completed: false },
      { id: 'ut-2', text: 'Find referrals on LinkedIn for SDE core positions', completed: true },
      { id: 'ut-3', text: 'Solve CodeChef practice challenge tasks', completed: false }
    ];
  });

  const [newTodoText, setNewTodoText] = useState('');

  useEffect(() => {
    localStorage.setItem('life_os_untimed_todos', JSON.stringify(untimedTodos));
  }, [untimedTodos]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const newTodo: UntimedTodo = {
      id: `ut-${Date.now()}`,
      text: newTodoText.trim(),
      completed: false
    };
    setUntimedTodos([...untimedTodos, newTodo]);
    setNewTodoText('');
  };

  const handleToggleTodo = (id: string) => {
    setUntimedTodos(untimedTodos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTodo = (id: string) => {
    setUntimedTodos(untimedTodos.filter(t => t.id !== id));
  };
  
  // Pomodoro Focus session state
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [pomoSessionMode, setPomoSessionMode] = useState<'focus' | 'break'>('focus');
  const [completedSessions, setCompletedSessions] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter blocks for today
  const todaysBlocks = blocks.filter(b => b.date === todayStr);

  // Time Slot Mapping for rendering the day's grid
  const blockMapping = DEFAULT_TIME_SLOTS.reduce((acc, slot) => {
    acc[slot] = todaysBlocks.find(b => b.timeSlot === slot) || null;
    return acc;
  }, {} as Record<TimeSlot, TimeboxBlock | null>);

  // Handle adding a block
  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    // Check if slot already exists
    const existing = blockMapping[selectedSlot];
    if (existing) {
      alert(`Block at ${selectedSlot} is already booked. Delete or edit that block first.`);
      return;
    }

    onAddBlock({
      date: todayStr,
      timeSlot: selectedSlot,
      task: taskText.trim(),
      completed: false,
      replanNotes: ''
    });

    setTaskText('');
  };

  // Focus Countdown logic
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer expired, play buzzer and switch modes
            clearInterval(timerRef.current!);
            setIsPlaying(false);
            
            // Notification or buzzer sound
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 chord
              osc.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.3);
            } catch (err) {
              console.log('Audio Context unsupported in sandbox iframe.', err);
            }

            if (pomoSessionMode === 'focus') {
              alert('Phenomenal job! Focus Session complete. Take a 5-minute breather.');
              setPomoSessionMode('break');
              setTimeLeft(5 * 60);
              setCompletedSessions(prev => prev + 1);
            } else {
              alert('Break is over. Time to lock in for the next deep session.');
              setPomoSessionMode('focus');
              setTimeLeft(25 * 60);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, pomoSessionMode]);

  const handlePomoControl = (action: 'play' | 'pause' | 'reset') => {
    if (action === 'play') setIsPlaying(true);
    if (action === 'pause') setIsPlaying(false);
    if (action === 'reset') {
      setIsPlaying(false);
      setPomoSessionMode('focus');
      setTimeLeft(25 * 60);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="timebox-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* 1. Daily schedule block grid */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-[#0c0c0e] rounded-xl border border-zinc-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-400" />
              <h3 className="font-display font-semibold text-lg text-zinc-100">Daily Planning Board</h3>
            </div>
            <span className="text-3xs font-mono text-zinc-500 uppercase font-bold">Today: {todayStr}</span>
          </div>

          {/* Quick Schedule Creator */}
          <form id="form-timebox-scheduler" onSubmit={handleAddBlock} className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#09090b] p-3 border border-zinc-800 rounded-lg">
            <div className="sm:col-span-3">
              <label className="block text-3xs font-mono text-zinc-550 mb-1 font-bold">SELECT HOUR</label>
              <select
                id="timebox-input-slot"
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value as TimeSlot)}
                className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-505 text-zinc-150"
              >
                {DEFAULT_TIME_SLOTS.map(slot => (
                  <option key={slot} value={slot}>{formatTo12Hour(slot)}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-3xs font-mono text-zinc-550 mb-1 font-bold">BLOCK TASK / OBJECTIVE</label>
              <input
                id="timebox-input-task"
                type="text"
                required
                placeholder="Leetcode dynamic programming, latex resume..."
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                className="w-full text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-150 placeholder-zinc-700"
              />
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                id="btn-timebox-submit"
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-2xs font-bold rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                Book Block
              </button>
            </div>
          </form>

          {/* Time Schedule List view */}
          <div className="space-y-3 pt-2 max-h-[550px] overflow-y-auto pr-1">
            {DEFAULT_TIME_SLOTS.map((slot) => {
              const b = blockMapping[slot];
              
              return (
                <div
                  key={slot}
                  className={`flex flex-col sm:flex-row items-stretch border rounded-xl overflow-hidden transition-all duration-150 ${
                    b
                      ? b.completed
                        ? 'border-emerald-900/40 bg-emerald-950/10'
                        : 'border-zinc-800 bg-[#09090b]'
                      : 'border-dashed border-zinc-850 bg-[#09090b]/10 opacity-60 hover:opacity-100 hover:border-zinc-800'
                  }`}
                >
                  {/* Left Column: Time Header */}
                  <div className="px-4 py-3 bg-[#09090b]/60 border-r border-zinc-800 font-mono text-3xs sm:text-2xs font-bold flex items-center justify-start text-zinc-400 min-w-[95px] shrink-0">
                    {formatTo12Hour(slot)}
                  </div>

                  {/* Middle Column: Task Details */}
                  <div className="flex-1 p-3 flex flex-col justify-between gap-2.5">
                    {b ? (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <button
                              id={`btn-timebox-check-${b.id}`}
                              onClick={() => onToggleBlockComplete(b.id)}
                              className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all focus:outline-none mt-0.5 ${
                                b.completed
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                                  : 'border-zinc-750 hover:border-zinc-600 bg-zinc-950/40'
                              }`}
                            >
                              {b.completed && <CheckSquare className="h-3.5 w-3.5 text-white" />}
                            </button>
                            <span className={`text-xs font-medium ${b.completed ? 'text-zinc-550 line-through' : 'text-zinc-200'}`}>
                              {b.task}
                            </span>
                          </div>

                          <button
                            id={`btn-timebox-delete-${b.id}`}
                            onClick={() => onDeleteBlock(b.id)}
                            className="text-2xs font-mono text-zinc-500 hover:text-red-400 hover:bg-red-500/5 px-1.5 py-0.5 rounded border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
                          >
                            CLEAR
                          </button>
                        </div>

                        {/* Replan & Reschedule Controls */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-850">
                          {/* Replan Notes */}
                          <div className="flex gap-2 items-center flex-wrap">
                            <span className="text-3xs font-mono text-zinc-500 uppercase font-bold shrink-0">Replan Notes:</span>
                            <input
                              id={`timebox-replan-notes-${b.id}`}
                              type="text"
                              placeholder="Reason for reschedule or outcomes..."
                              value={b.replanNotes || ''}
                              onChange={(e) => onUpdateReplanNotes(b.id, e.target.value)}
                              className="flex-1 text-2xs font-mono bg-transparent border-b border-zinc-800 focus:border-zinc-750 focus:outline-none py-0.5 text-zinc-300 placeholder-zinc-700 min-w-[200px]"
                            />
                          </div>

                          {/* Reschedule Dropdown */}
                          <div className="flex gap-2 items-center">
                            <span className="text-3xs font-mono text-zinc-500 uppercase font-bold shrink-0">RE-ROUTE HOUR Slot:</span>
                            <select
                              id={`reschedule-select-${b.id}`}
                              value={b.timeSlot}
                              onChange={(e) => {
                                const targetSlot = e.target.value as TimeSlot;
                                const isBusy = todaysBlocks.some(x => x.timeSlot === targetSlot && x.id !== b.id);
                                if (isBusy) {
                                  alert(`Hour slot ${targetSlot} is already booked. Reschedule failed.`);
                                  return;
                                }
                                onRescheduleBlock(b.id, targetSlot);
                              }}
                              className="text-3xs font-mono bg-[#09090b] border border-zinc-800 rounded px-2 py-0.5 text-indigo-400 focus:outline-none cursor-pointer hover:border-zinc-700 transition-all font-semibold"
                            >
                              {DEFAULT_TIME_SLOTS.map((slotOpt) => (
                                <option key={slotOpt} value={slotOpt}>
                                  {formatTo12Hour(slotOpt)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600 italic font-mono self-center sm:self-start">
                        No deep task slot scheduled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Live Pomodoro deep session workspace & Untimed Backlog */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Pomodoro Timer Card */}
        <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a]/80 p-6 flex flex-col items-center justify-center text-center shadow-md">
          <div className="flex items-center gap-2 mb-6">
            <Zap className={`h-4 w-4 ${pomoSessionMode === 'focus' ? 'text-indigo-400 animate-pulse' : 'text-sky-400'}`} />
            <span className="text-3xs font-mono text-zinc-455 text-zinc-400 uppercase tracking-widest font-bold">
              {pomoSessionMode === 'focus' ? 'Active Deep Session' : 'Relax - Rest Mode'}
            </span>
          </div>

          {/* Clock Visual dial */}
          <div className={`relative h-44 w-44 rounded-full border border-zinc-800 flex flex-col items-center justify-center mb-6 bg-zinc-950/40 p-4 transition-all duration-300 ${
            isPlaying ? 'ring-2 ring-zinc-700 border-zinc-600' : ''
          }`}>
            <span className="text-3xl font-mono font-bold text-zinc-150 tracking-tight leading-none mb-1">
              {formatTimer(timeLeft)}
            </span>
            <span className="text-4xs font-mono text-indigo-400 uppercase tracking-wider font-semibold">
              {pomoSessionMode === 'focus' ? 'DEDICATED CODE' : 'BREATHE'}
            </span>

            {/* Micro layout orbits */}
            <div className={`absolute inset-1 rounded-full border border-dashed border-zinc-900/60 transition-transform duration-[60s] ${
              isPlaying ? 'animate-spin' : ''
            }`} />
          </div>

          {/* Controls */}
          <div className="flex gap-3 justify-center mb-6">
            {isPlaying ? (
              <button
                id="btn-pomo-pause"
                onClick={() => handlePomoControl('pause')}
                className="px-5 py-2 rounded-lg bg-[#09090b] hover:bg-zinc-850 text-xs font-semibold border border-zinc-805 text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Pause className="h-3.5 w-3.5 text-zinc-400" /> Stop Timer
              </button>
            ) : (
              <button
                id="btn-pomo-play"
                onClick={() => handlePomoControl('play')}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
              >
                <Play className="h-3.5 w-3.5 text-white fill-current" /> Lock In
              </button>
            )}

            <button
              id="btn-pomo-reset"
              onClick={() => handlePomoControl('reset')}
              className="h-8 w-8 rounded-lg bg-[#09090b] border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white transition-colors cursor-pointer"
              title="Reset timer clock"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="border-t border-zinc-850 pt-4 w-full grid grid-cols-2 gap-4">
            <div className="text-center border-r border-zinc-850">
              <div className="text-lg font-mono font-bold text-zinc-150">{completedSessions}</div>
              <p className="text-4xs text-zinc-505 text-zinc-500 font-mono uppercase tracking-wider font-bold">Sessions Done</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono font-bold text-zinc-150">{completedSessions * 25}m</div>
              <p className="text-4xs text-zinc-505 text-zinc-500 font-mono uppercase tracking-wider font-bold">Total logged work</p>
            </div>
          </div>
        </div>

        {/* Untimed To-Do List Backlog Card */}
        <div id="untimed-todo-board" className="bg-[#0c0c0e] rounded-xl border border-[#27272a]/80 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-400" />
              <h3 className="font-display font-semibold text-sm text-zinc-100">Tasks Backlog (Untimed)</h3>
            </div>
            <span className="text-3xs font-mono text-zinc-505 text-zinc-500 uppercase font-bold">Inbox Queue</span>
          </div>

          {/* New Untimed Task Creator Form */}
          <form id="form-untimed-adder" onSubmit={handleAddTodo} className="flex gap-2 bg-[#09090b] p-2 border border-zinc-850 rounded-lg">
            <input
              id="input-untimed-task"
              type="text"
              required
              placeholder="Add non-time-bound item... (e.g. rewrite java mock, submit form)"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              className="flex-1 text-xs bg-transparent border-none outline-none focus:ring-0 text-zinc-200 placeholder-zinc-700 h-8 px-2"
            />
            <button
              id="btn-untimed-add"
              type="submit"
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-505 text-white text-3xs font-bold rounded-md transition-colors cursor-pointer shrink-0"
            >
              Plus Item
            </button>
          </form>

          {/* List queue area */}
          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
            {untimedTodos.length === 0 ? (
              <p className="text-3xs text-zinc-650 italic text-center py-6 font-mono">No active untimed items in your queue</p>
            ) : (
              untimedTodos.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-150 ${
                    t.completed
                      ? 'border-emerald-950/20 bg-emerald-950/5 opacity-60'
                      : 'border-zinc-850 bg-[#09090b] hover:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <button
                      id={`btn-toggle-untimed-${t.id}`}
                      type="button"
                      onClick={() => handleToggleTodo(t.id)}
                      className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-all focus:outline-none shrink-0 cursor-pointer ${
                        t.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-zinc-700 hover:border-indigo-400 bg-zinc-950/40'
                      }`}
                    >
                      {t.completed && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className={`text-2xs font-medium truncate ${t.completed ? 'text-zinc-550 line-through' : 'text-zinc-200'}`}>
                      {t.text}
                    </span>
                  </div>

                  <button
                    id={`btn-delete-untimed-${t.id}`}
                    type="button"
                    onClick={() => handleDeleteTodo(t.id)}
                    className="text-3xs font-mono text-zinc-550 hover:text-red-400 p-1 cursor-pointer hover:underline transition-all"
                  >
                    CLEAR
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
