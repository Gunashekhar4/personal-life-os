import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Award, Flame, RefreshCw, AlertCircle, TrendingUp, Compass, MessageSquare, Mic, HelpCircle, ArrowRight } from 'lucide-react';
import { Habit, Goal, LearningEntry, Project, JobApplication, AIInsightReport } from '../types';

interface DashboardProps {
  habits: Habit[];
  goals: Goal[];
  learning: LearningEntry[];
  projects: Project[];
  jobs: JobApplication[];
  onRefreshAllData: () => void;
  // Handler for direct natural language updates parsed by AI Command Engine
  onApplyParsedCommand: (parsedResult: any) => Promise<void>;
}

export default function DashboardView({
  habits,
  goals,
  learning,
  projects,
  jobs,
  onRefreshAllData,
  onApplyParsedCommand
}: DashboardProps) {
  
  // AI Command / Assistant states
  const [aiMode, setAiMode] = useState<'command' | 'ask'>('ask');
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Deep Analyst Report states
  const [insightReport, setInsightReport] = useState<AIInsightReport | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Calculate high-fidelity offline statistics
  const todayStr = new Date().toISOString().split('T')[0];
  const activeHabitsTodayCount = habits.filter(h => h.history.includes(todayStr)).length;
  const aggregateStudyHours = learning.reduce((sum, item) => sum + item.hours, 0);
  const coreCompetenciesCount = new Set(learning.map(e => e.subject)).size;
  const completedGoalsCount = goals.filter(g => g.completed).length;

  // Trigger Deep Analyst report compiles
  const generateDeepAIReport = async () => {
    setIsLoadingInsights(true);
    setInsightsError(null);
    try {
      const res = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habits,
          goals,
          learning,
          projects,
          jobs,
          scope: 'comprehensive daily'
        })
      });
      if (!res.ok) throw new Error('API server returned error parsing metrics.');
      const data = await res.json();
      setInsightReport(data);
    } catch (err: any) {
      console.error('Insights compile failure', err);
      setInsightsError('Coach node offline. Please verify GEMINI_API_KEY environment variable is healthy.');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Compile insights on mount
  useEffect(() => {
    generateDeepAIReport();
  }, []);

  // Handle Assistant Bar Actions (Directly integrates with the server-side LLM nodes)
  const handleAssistantAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessingAi(true);
    setAiResponse(null);

    try {
      if (aiMode === 'command') {
        // Mode 1: Natural Language Parse Commands
        const res = await fetch('/api/gemini/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query.trim(),
            currentDate: todayStr
          })
        });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        // Apply command structure to IndexedDB
        await onApplyParsedCommand(data);
        setAiResponse(`### AI PARSER ACTION REGISTERED\n**Action Dispatch**: Successfully processed state updates!\n- **Target store**: ${data.module}\n- **Trigger parameter**: ${data.action}\n\nMetrics synchronized safely in local DB core. Refreshing views.`);
        onRefreshAllData();
        setQuery('');
      } else {
        // Mode 2: Executive Coach consultation
        const res = await fetch('/api/gemini/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: query.trim(),
            stateContext: {
              habitsCount: habits.length,
              studyHours: aggregateStudyHours,
              activeGoals: goals.length,
              portfolioTracks: projects.length,
              pipelinesCount: jobs.length
            }
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setAiResponse(data.answer);
      }
    } catch (err: any) {
      console.error('Assistant API error', err);
      setAiResponse(`### OPERATION ERROR\n${err.message || 'Error compiling assistant response.'}`);
    } finally {
      setIsProcessingAi(false);
    }
  };

  return (
    <div id="ai-dashboard-panel" className="space-y-6">
      
      {/* 1. Quick Stats Banner cards (Sophisticated Dark custom stats grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-[#0c0c0e] border border-zinc-800 p-5 rounded-xl flex items-center gap-4 hover:border-zinc-700/65 transition-all shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-zinc-100">{activeHabitsTodayCount}/{habits.length}</div>
            <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider font-mono">Habits Complete Today</p>
          </div>
        </div>

        <div className="bg-[#0c0c0e] border border-zinc-800 p-5 rounded-xl flex items-center gap-4 hover:border-zinc-700/65 transition-all shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-zinc-100 pr-0.5">{aggregateStudyHours.toFixed(1)}h</div>
            <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider font-mono">Study Hours logged</p>
          </div>
        </div>

        <div className="bg-[#0c0c0e] border border-zinc-800 p-5 rounded-xl flex items-center gap-4 hover:border-zinc-700/65 transition-all shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-zinc-100">{completedGoalsCount} met</div>
            <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider font-mono">Total Goals accomplished</p>
          </div>
        </div>

        <div className="bg-[#0c0c0e] border border-zinc-800 p-5 rounded-xl flex items-center gap-4 hover:border-zinc-700/65 transition-all shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-zinc-100">{jobs.filter(j => j.status === 'Offer').length} select</div>
            <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider font-mono">Active offer metrics</p>
          </div>
        </div>

      </div>

      {/* 2. Chat / Action console */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Assistant console on the left (7 columns) */}
        <div className="xl:col-span-7">
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-indigo-400" />
                <h3 className="font-display font-semibold text-zinc-200">AI Operating Command</h3>
              </div>

              {/* Selector for AI behavior style (Muted zinc box with Indigo active highlight) */}
              <div className="flex gap-1 bg-[#09090b] p-1 border border-zinc-800 rounded-lg">
                <button
                  id="btn-aimode-ask"
                  onClick={() => { setAiMode('ask'); setAiResponse(null); }}
                  className={`px-3 py-1 text-[9px] uppercase tracking-wider font-mono rounded-md transition-colors ${
                    aiMode === 'ask' 
                      ? 'bg-zinc-800 text-indigo-400 font-bold' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Consult Antigravity Coach
                </button>
                <button
                  id="btn-aimode-command"
                  onClick={() => { setAiMode('command'); setAiResponse(null); }}
                  className={`px-3 py-1 text-[9px] uppercase tracking-wider font-mono rounded-md transition-colors ${
                    aiMode === 'command' 
                      ? 'bg-zinc-800 text-indigo-400 font-bold' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  NLP Action Capture
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {aiMode === 'ask' 
                ? "Seek personalized Career counseling, DSA roadmap questions, or Spring boot optimizations."
                : "Record progress instantly! Type 'studied dsa for 2 hours today' or 'leetcode done' to auto-update DB."
              }
            </p>

            {/* Input form bar (Sleek inner background with Indigo outer focal ring) */}
            <form id="form-assistant-bar" onSubmit={handleAssistantAction} className="relative flex gap-2">
              <input
                id="assistant-query-input"
                type="text"
                required
                placeholder={aiMode === 'ask' ? "Ask about trees or search strategy..." : "studied Java for 1.5 hours today..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 text-xs bg-[#09090b] border border-zinc-800 rounded-lg p-3 pr-12 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 transition-all font-mono"
              />
              <button
                id="btn-assistant-submit"
                type="submit"
                disabled={isProcessingAi}
                className="absolute right-2 top-2 h-8 w-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-40"
              >
                {isProcessingAi ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {/* AI Answer visual stack (Sophisticated Dark log output) */}
            {aiResponse && (
              <div className="bg-[#09090b] p-4 border border-zinc-800 rounded-xl space-y-2 animate-fadeIn max-h-96 overflow-y-auto shadow-inner">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block border-b border-zinc-850 pb-1.5 font-bold">
                  ANALYST LOGS OUTPUT
                </span>
                
                <div className="text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">
                  {aiResponse}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Deep Analyst report card on the right (5 columns) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400 font-semibold" />
                <h4 className="font-display font-semibold text-zinc-200">Daily Performance Metrics</h4>
              </div>

              <button
                id="btn-recompile-insights"
                onClick={generateDeepAIReport}
                disabled={isLoadingInsights}
                className="h-8 w-8 rounded-lg border border-zinc-800 bg-[#09090b] hover:text-white hover:border-zinc-700 flex items-center justify-center text-zinc-400 transition-all cursor-pointer"
                title="Recalculate report scores"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingInsights ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingInsights ? (
              <div className="py-12 text-center space-y-2.5">
                <RefreshCw className="h-5 w-5 animate-spin text-indigo-400 mx-auto" />
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Syncing state logs...</p>
              </div>
            ) : insightsError ? (
              <div className="p-3 bg-[#09090b] border border-zinc-800 rounded-xl text-center space-y-1">
                <AlertCircle className="h-4.5 w-4.5 text-zinc-600 mx-auto" />
                <p className="text-[10px] text-zinc-400 font-mono">{insightsError}</p>
              </div>
            ) : insightReport ? (
              <div className="space-y-4 animate-fadeIn">
                
                {/* Score meters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#09090b] border border-zinc-850 rounded-lg text-center shadow-sm">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">PRODUCTIVITY RATIO</span>
                    <div className="text-2xl font-mono font-bold text-zinc-100 mt-1">
                      {insightReport.productivityScore}%
                    </div>
                  </div>

                  <div className="p-3 bg-[#09090b] border border-zinc-850 rounded-lg text-center shadow-sm">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">STREAK CONSISTENCY</span>
                    <div className="text-2xl font-mono font-bold text-zinc-100 mt-1">
                      {insightReport.consistencyScore}%
                    </div>
                  </div>
                </div>

                {/* Summary sentences */}
                <p className="text-xs text-zinc-350 italic bg-[#09090b]/80 p-3 rounded-lg border border-zinc-800 leading-relaxed">
                  "{insightReport.weeklySummary}"
                </p>

                {/* Recommendations */}
                {insightReport.recommendations.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">STRATEGIC OUTLINE FOR THE DAY</span>
                    
                    <ul className="space-y-1.5">
                      {insightReport.recommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-zinc-300 font-mono leading-normal flex items-start gap-2">
                          <Compass className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recent Wins */}
                {insightReport.wins.length > 0 && (
                  <div className="space-y-1 pt-1.5">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">COMPILATION RECORD WINS</span>
                    <div className="flex flex-wrap gap-1.5">
                      {insightReport.wins.map((win, idx) => (
                        <span key={idx} className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-md">
                          ✓ {win}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="py-6 text-center text-xs text-zinc-500 font-mono">
                No active state reviews fetched. Hit compile.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
