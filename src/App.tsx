import { useState, useEffect } from 'react';
import { 
  Sparkles, Brain, Compass, Inbox, Target, Flame, Clock, 
  BookOpen, Folder, Briefcase, Database, Lock, Unlock, 
  RefreshCw, Menu, X, Terminal, ArrowRight, ShieldCheck, Github, ExternalLink, ListTodo, Settings
} from 'lucide-react';

import { 
  Goal, Habit, TimeboxBlock, InboxItem, VaultItem, 
  LearningEntry, Project, JobApplication, SyncConfig, JobStatus, VaultCategory, Subject, TimeSlot
} from './types';

import { 
  getAllFromIDB, putIntoIDB, deleteFromIDB, clearIDBStore, seedDatabaseIfEmpty 
} from './lib/db';

// Import subcomponents
import SecurityLock from './components/SecurityLock';
import DashboardView from './components/DashboardView';
import QuickInboxView from './components/QuickInboxView';
import TodoListView from './components/TodoListView';
import GoalsView from './components/GoalsView';
import HabitView from './components/HabitView';
import TimeboxView from './components/TimeboxView';
import KnowledgeVaultView from './components/KnowledgeVaultView';
import LearningLogsView from './components/LearningLogsView';
import ProjectsTrackerView from './components/ProjectsTrackerView';
import JobFunnelView from './components/JobFunnelView';
import SettingsView from './components/SettingsView';

type TabType = 'dashboard' | 'inbox' | 'todos' | 'goals' | 'habits' | 'timebox' | 'learning' | 'projects' | 'jobs' | 'vault' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLockedByShield, setIsLockedByShield] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Database states
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [timebox, setTimebox] = useState<TimeboxBlock[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [learning, setLearning] = useState<LearningEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<JobApplication[]>([]);

  // Cloud Sync configurations
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    appsScriptUrl: '',
    status: 'idle',
    lastSyncedAt: null
  });

  // Today Date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Bootstrap Database & load tables
  const bootstrapOS = async () => {
    try {
      await seedDatabaseIfEmpty();
      await fetchAllLocalData();
    } catch (err) {
      console.error('Database bootstrap fault:', err);
    }
  };

  const fetchAllLocalData = async () => {
    try {
      const gls = await getAllFromIDB<Goal>('goals');
      const hbt = await getAllFromIDB<Habit>('habits');
      const tb = await getAllFromIDB<TimeboxBlock>('timebox');
      const ibx = await getAllFromIDB<InboxItem>('inbox');
      const vlt = await getAllFromIDB<VaultItem>('vault');
      const lrn = await getAllFromIDB<LearningEntry>('learning');
      const prj = await getAllFromIDB<Project>('projects');
      const jb = await getAllFromIDB<JobApplication>('jobs');

      setGoals(gls);
      setHabits(hbt);
      setTimebox(tb);
      setInbox(ibx);
      setVault(vlt);
      setLearning(lrn);
      setProjects(prj);
      setJobs(jb);

      // Load Sync Settings
      const savedSync = localStorage.getItem('life_os_sync_cfg');
      if (savedSync) {
        try {
          setSyncConfig(JSON.parse(savedSync));
        } catch (e) {
          console.error('Error parsing saved sync config', e);
        }
      }
    } catch (err) {
      console.error('IndexedDB loading fault:', err);
    }
  };

  useEffect(() => {
    bootstrapOS();
  }, []);

  // Sync Settings updating
  const handleUpdateSyncConfig = (updated: SyncConfig) => {
    setSyncConfig(updated);
    localStorage.setItem('life_os_sync_cfg', JSON.stringify(updated));
  };

  // Bidirectional Push/Pull Cloud Engines
  const handlePushCloudBackup = async () => {
    if (!syncConfig.appsScriptUrl) throw new Error('Web App Link is required.');

    handleUpdateSyncConfig({ ...syncConfig, status: 'syncing' });

    try {
      const payload = {
        action: 'push',
        data: {
          goals,
          habits,
          timebox,
          inbox,
          vault,
          learning,
          projects,
          jobs
        }
      };

      const res = await fetch(syncConfig.appsScriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'Push sync failed.');
      }

      handleUpdateSyncConfig({
        ...syncConfig,
        status: 'success',
        lastSyncedAt: Date.now()
      });
    } catch (err: any) {
      handleUpdateSyncConfig({ ...syncConfig, status: 'error' });
      throw err;
    }
  };

  const handlePullCloudRestore = async () => {
    if (!syncConfig.appsScriptUrl) throw new Error('Web App Link is required.');

    handleUpdateSyncConfig({ ...syncConfig, status: 'syncing' });

    try {
      const payload = { action: 'pull' };

      const res = await fetch(syncConfig.appsScriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.status !== 'success' || !result.data) {
        throw new Error(result.message || 'Pull sync failed.');
      }

      const dbData = result.data;

      // Overwrite local indexedDB tables
      const stores = ['goals', 'habits', 'timebox', 'inbox', 'vault', 'learning', 'projects', 'jobs'];
      for (const store of stores) {
        await clearIDBStore(store);
        const dataList = dbData[store] || [];
        for (const item of dataList) {
          await putIntoIDB(store, item);
        }
      }

      await fetchAllLocalData();

      handleUpdateSyncConfig({
        ...syncConfig,
        status: 'success',
        lastSyncedAt: Date.now()
      });
    } catch (err: any) {
      handleUpdateSyncConfig({ ...syncConfig, status: 'error' });
      throw err;
    }
  };

  // AI parsed commands applying (Voice or Natural language actions)
  const handleApplyParsedCommand = async (parsed: any) => {
    try {
      if (!parsed || !parsed.module || !parsed.action || !parsed.data) return;

      const { module, action, data } = parsed;
      const id = `${module.charAt(0)}-${Date.now()}`;

      if (module === 'habits' && action === 'complete_habit') {
        // Complete habit: find matching or insert then complete
        const existing = habits.find(h => h.name.toLowerCase().includes(data.name?.toLowerCase() || ''));
        if (existing) {
          await handleToggleHabitDay(existing.id, todayStr);
        } else {
          const newHabit: Habit = {
            id,
            name: data.name || 'Personal Practice Session',
            category: data.category || 'Custom',
            history: [todayStr],
            streak: 1,
            bestStreak: 1,
            successRate: 50,
            createdAt: todayStr
          };
          await putIntoIDB('habits', newHabit);
        }
      }

      if (module === 'learning' && action === 'add_learning') {
        const newLrn: LearningEntry = {
          id,
          subject: data.subject || 'DSA',
          hours: parseFloat(data.hours) || 1,
          date: data.date || todayStr,
          description: data.description || 'Logged via Natural Language parse engine.'
        };
        await putIntoIDB('learning', newLrn);
      }

      if (module === 'goals' && action === 'add_goal') {
        const newGoal: Goal = {
          id,
          title: data.title || 'Practice topic deliverables',
          type: data.type || 'daily',
          category: data.category || 'DSA',
          targetDate: data.targetDate || todayStr,
          progress: 0,
          completed: false,
          createdAt: todayStr
        };
        await putIntoIDB('goals', newGoal);
      }

      if (module === 'inbox' && action === 'add_inbox') {
        const newInb: InboxItem = {
          id,
          title: data.title || 'Quick captures',
          content: data.content || '',
          type: data.type || 'idea',
          status: 'active',
          createdAt: todayStr
        };
        await putIntoIDB('inbox', newInb);
      }

      if (module === 'vault' && action === 'add_vault') {
        const newVlt: VaultItem = {
          id,
          title: data.title || 'Asset notes',
          description: data.description || '',
          category: data.category || 'Learning',
          tags: data.tags || [],
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          dateAdded: todayStr
        };
        await putIntoIDB('vault', newVlt);
      }

      if (module === 'jobs' && action === 'add_job') {
        const newJob: JobApplication = {
          id,
          company: data.company || 'Pipeline lead',
          role: data.role || 'SWE Intern',
          dateApplied: data.dateApplied || todayStr,
          status: data.status || 'Applied',
          notes: data.notes
        };
        await putIntoIDB('jobs', newJob);
      }

      await fetchAllLocalData();
    } catch (e) {
      console.error('NLP Command applying fault', e);
    }
  };

  // 1. GOALS Operations
  const handleAddGoal = async (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: `g-${Date.now()}`,
      createdAt: todayStr
    };
    await putIntoIDB('goals', newGoal);
    await fetchAllLocalData();
  };

  const handleToggleGoalComplete = async (id: string) => {
    const target = goals.find(g => g.id === id);
    if (!target) return;

    const updated = {
      ...target,
      completed: !target.completed,
      progress: !target.completed ? 100 : 0
    };
    await putIntoIDB('goals', updated);
    await fetchAllLocalData();
  };

  const handleUpdateGoalProgress = async (id: string, progress: number) => {
    const target = goals.find(g => g.id === id);
    if (!target) return;

    const updated = {
      ...target,
      progress,
      completed: progress === 100
    };
    await putIntoIDB('goals', updated);
    await fetchAllLocalData();
  };

  const handleDeleteGoal = async (id: string) => {
    await deleteFromIDB('goals', id);
    await fetchAllLocalData();
  };

  // 2. HABITS Streaks calculator
  const handleAddHabit = async (habit: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'successRate' | 'history' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habit,
      id: `h-${Date.now()}`,
      history: [],
      streak: 0,
      bestStreak: 0,
      successRate: 0,
      createdAt: todayStr
    };
    await putIntoIDB('habits', newHabit);
    await fetchAllLocalData();
  };

  const handleToggleHabitDay = async (id: string, dateStr: string) => {
    const target = habits.find(h => h.id === id);
    if (!target) return;

    let history = [...target.history];
    if (history.includes(dateStr)) {
      history = history.filter(d => d !== dateStr);
    } else {
      history.push(dateStr);
    }

    // Sort descending
    history.sort((a,b) => b.localeCompare(a));

    // Calculate Streak
    let streak = 0;
    let pointer = new Date(todayStr);

    while (true) {
      const pStr = pointer.toISOString().split('T')[0];
      if (history.includes(pStr)) {
        streak++;
        pointer.setDate(pointer.getDate() - 1);
      } else {
        // If today is missing, check yesterday to persist previous streaks
        if (pStr === todayStr) {
          pointer.setDate(pointer.getDate() - 1);
          const yStr = pointer.toISOString().split('T')[0];
          if (history.includes(yStr)) {
            streak = 0; // Streak not broken yet but is 0 today until logged
            continue;
          }
        }
        break;
      }
    }

    const bestStreak = Math.max(target.bestStreak, streak);
    const successRate = Math.round((history.length / 28) * 100); // Past 4 weeks rating

    const updated: Habit = {
      ...target,
      history,
      streak,
      bestStreak,
      successRate: successRate > 100 ? 100 : successRate
    };

    await putIntoIDB('habits', updated);
    await fetchAllLocalData();
  };

  const handleDeleteHabit = async (id: string) => {
    await deleteFromIDB('habits', id);
    await fetchAllLocalData();
  };

  // 3. TIMEBOX Operations
  const handleAddTimeboxBlock = async (block: Omit<TimeboxBlock, 'id'>) => {
    const newBlock: TimeboxBlock = {
      ...block,
      id: `tb-${Date.now()}`
    };
    await putIntoIDB('timebox', newBlock);
    await fetchAllLocalData();
  };

  const handleToggleTimeboxComplete = async (id: string) => {
    const target = timebox.find(b => b.id === id);
    if (!target) return;

    const updated = {
      ...target,
      completed: !target.completed
    };
    await putIntoIDB('timebox', updated);
    await fetchAllLocalData();
  };

  const handleUpdateTimeboxReplan = async (id: string, notes: string) => {
    const target = timebox.find(b => b.id === id);
    if (!target) return;

    const updated = {
      ...target,
      replanNotes: notes
    };
    await putIntoIDB('timebox', updated);
    await fetchAllLocalData();
  };

  const handleRescheduleTimeblock = async (id: string, newSlot: TimeSlot) => {
    const target = timebox.find(b => b.id === id);
    if (!target) return;

    const updated = {
      ...target,
      timeSlot: newSlot
    };
    await putIntoIDB('timebox', updated);
    await fetchAllLocalData();
  };

  const handleDeleteTimeboxBlock = async (id: string) => {
    await deleteFromIDB('timebox', id);
    await fetchAllLocalData();
  };

  // 4. QUICK INBOX Operations
  const handleAddInboxItem = async (item: Omit<InboxItem, 'id' | 'createdAt'>) => {
    const newItem: InboxItem = {
      ...item,
      id: `ib-${Date.now()}`,
      createdAt: todayStr
    };
    await putIntoIDB('inbox', newItem);
    await fetchAllLocalData();
  };

  const handleArchiveInboxItem = async (id: string) => {
    const target = inbox.find(i => i.id === id);
    if (!target) return;

    const updated = {
      ...target,
      status: 'archived' as 'archived'
    };
    await putIntoIDB('inbox', updated);
    await fetchAllLocalData();
  };

  const handleDeleteInboxItem = async (id: string) => {
    await deleteFromIDB('inbox', id);
    await fetchAllLocalData();
  };

  // 5. KNOWLEDGE VAULT Operations
  const handleAddVaultItem = async (item: Omit<VaultItem, 'id' | 'dateAdded'>) => {
    const newItem: VaultItem = {
      ...item,
      id: `kv-${Date.now()}`,
      dateAdded: todayStr
    };
    await putIntoIDB('vault', newItem);
    await fetchAllLocalData();
  };

  const handleDeleteVaultItem = async (id: string) => {
    await deleteFromIDB('vault', id);
    await fetchAllLocalData();
  };

  // 6. LEARNING LOGS Operations
  const handleAddLearningEntry = async (entry: Omit<LearningEntry, 'id'>) => {
    const newLrnObj: LearningEntry = {
      ...entry,
      id: `ln-${Date.now()}`
    };
    await putIntoIDB('learning', newLrnObj);
    await fetchAllLocalData();
  };

  const handleDeleteLearningEntry = async (id: string) => {
    await deleteFromIDB('learning', id);
    await fetchAllLocalData();
  };

  // 7. PROJECTS TRACKER Operations
  const handleAddProject = async (prj: Omit<Project, 'id' | 'progress' | 'createdAt'>, milestoneTitles: string[]) => {
    const projectId = `pr-${Date.now()}`;
    const milestones: Project['milestones'] = milestoneTitles.map((title, idx) => ({
      id: `m-${projectId}-${idx}`,
      name: title,
      completed: false
    }));

    const newPrj: Project = {
      ...prj,
      id: projectId,
      progress: 0,
      milestones,
      createdAt: todayStr
    };

    await putIntoIDB('projects', newPrj);
    await fetchAllLocalData();
  };

  const handleToggleProjectMilestone = async (projectId: string, milestoneId: string) => {
    const target = projects.find(p => p.id === projectId);
    if (!target) return;

    const updatedMilestones = target.milestones.map((ms) => {
      if (ms.id === milestoneId) {
        return { ...ms, completed: !ms.completed };
      }
      return ms;
    });

    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const progress = target.milestones.length > 0 
      ? Math.round((completedCount / target.milestones.length) * 100) 
      : 0;

    const updated: Project = {
      ...target,
      milestones: updatedMilestones,
      progress,
      status: progress === 100 ? 'completed' : 'active'
    };

    await putIntoIDB('projects', updated);
    await fetchAllLocalData();
  };

  const handleDeleteProject = async (id: string) => {
    await deleteFromIDB('projects', id);
    await fetchAllLocalData();
  };

  // 8. JOB APPLICATIONS Operations
  const handleAddJobApplication = async (jb: Omit<JobApplication, 'id'>) => {
    const newJob: JobApplication = {
      ...jb,
      id: `jb-${Date.now()}`
    };
    await putIntoIDB('jobs', newJob);
    await fetchAllLocalData();
  };

  const handleUpdateJobStatus = async (id: string, status: JobStatus) => {
    const target = jobs.find(j => j.id === id);
    if (!target) return;

    const updated = {
      ...target,
      status
    };
    await putIntoIDB('jobs', updated);
    await fetchAllLocalData();
  };

  const handleDeleteJobApplication = async (id: string) => {
    await deleteFromIDB('jobs', id);
    await fetchAllLocalData();
  };

  // Nav categories meta arrays for rail rendering
  const navigationItems = [
    { key: 'dashboard', label: 'AI Analyst Center', icon: Brain },
    { key: 'inbox', label: 'Fast Capture Inbox', icon: Inbox },
    { key: 'todos', label: 'To-Do Backlog', icon: ListTodo },
    { key: 'goals', label: 'Milestones Planner', icon: Target },
    { key: 'habits', label: 'Habit Engines', icon: Flame },
    { key: 'timebox', label: 'Daily Timeboxer', icon: Clock },
    { key: 'learning', label: 'Study Hours Track', icon: BookOpen },
    { key: 'projects', label: 'Project Sprints', icon: Folder },
    { key: 'jobs', label: 'Career Pipelines', icon: Briefcase },
    { key: 'vault', label: 'Second Brain Vault', icon: Terminal },
    { key: 'settings', label: 'System Settings', icon: Settings },
  ] as const;

  return (
    <div id="life-os-root-container" className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-indigo-600/30 selection:text-white leading-normal">
      
      {/* 1. App Master PIN locked views handler */}
      <SecurityLock 
        isUnlocked={isUnlocked}
        onUnlock={() => setIsUnlocked(true)}
        onLockStateChange={(locked) => setIsLockedByShield(locked)}
      />

      {/* Screen displays only if unlocked successfully */}
      {isUnlocked && (
        <div className="flex-1 flex flex-col lg:flex-row">
          
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-64 bg-[#0c0c0e] border-r border-zinc-800 flex flex-col justify-between shrink-0">
            <div className="flex flex-col">
              
              {/* Sidebar Header Brand (Stunning Indigo bracket style from Sophisticated Dark design) */}
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold select-none shrink-0">
                    <span>A</span>
                  </div>
                  <div>
                    <h1 className="font-display font-semibold text-sm tracking-tight text-zinc-200">
                      Personal AI OS
                    </h1>
                    <span className="block text-[9px] font-mono tracking-wider text-zinc-500 uppercase">
                      CS Executive v1.2
                    </span>
                  </div>
                </div>

                {/* Mobile Menu Hamburger */}
                <button
                  id="btn-sidebar-hamburger"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden h-8 w-8 rounded border border-zinc-800 bg-zinc-900/40 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-750 transition-all"
                >
                  {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
              </div>

              {/* Navigation lists (Desktop or open mobile) */}
              <nav className={`p-3 space-y-1.5 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
                <div className="px-3 py-1.5 text-[9px] uppercase tracking-widest text-zinc-500 font-bold font-mono">Core Operating Units</div>
                
                {navigationItems.map((nav) => {
                  const Icon = nav.icon;
                  const isCurrent = activeTab === nav.key;
                  return (
                    <button
                      id={`nav-tab-${nav.key}`}
                      key={nav.key}
                      onClick={() => {
                        setActiveTab(nav.key);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all border ${
                        isCurrent 
                          ? 'bg-zinc-800/40 text-indigo-400 border-zinc-800 shadow-md shadow-indigo-950/20 font-bold' 
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border-transparent'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isCurrent ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-450'}`} />
                      <span>{nav.label}</span>
                    </button>
                  );
                })}
              </nav>

            </div>

            {/* Sidebar Footnotes */}
            <div className={`p-4 border-t border-zinc-800 bg-zinc-950/20 space-y-3 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="p-3 bg-zinc-900/50 border border-zinc-800/80 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono">Storage Sync</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${syncConfig.appsScriptUrl ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-300">
                    {syncConfig.appsScriptUrl ? 'Sheets API Active' : 'Offline State Sandboxed'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 px-1">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span>Authorized CS Sandbox</span>
              </div>
            </div>
          </aside>

          {/* Main Content Workspace Frame */}
          <main className="flex-1 flex flex-col overflow-x-hidden bg-[#09090b]">
            
            {/* Context/status notification strip (Polished 16-height top bar from the Sophisticated Dark) */}
            <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#09090b] shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="font-display font-semibold text-sm tracking-tight text-zinc-150 capitalize">
                  {activeTab === 'dashboard' ? 'AI Executive Analyst Core' : `${activeTab}`}
                </h2>
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-zinc-850">|</span>
                  <p className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                    {activeTab === 'dashboard' ? 'Metrics Analysis & NLP command bridge' : `Core operational interface`}
                  </p>
                </div>
              </div>

              {/* States / Sync connectivity panel indicator */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-2xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span className="text-zinc-400 font-medium">Productive State</span>
                </div>
                
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-zinc-500 text-xs font-mono">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div 
                    onClick={() => {
                      // Trigger lock system logic manually
                      window.location.reload();
                    }}
                    className="w-8 h-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center rounded cursor-pointer hover:border-zinc-700 transition-colors"
                    title="Relock personal database"
                  >
                    <Lock className="w-4 h-4 text-zinc-400 hover:text-zinc-200" />
                  </div>
                </div>
              </div>
            </header>

            {/* Main Tabs contents mapping */}
            <div className="flex-1 p-6 max-w-6xl w-full mx-auto animate-fadeIn pb-16">
              {activeTab === 'dashboard' && (
                <DashboardView 
                  habits={habits}
                  goals={goals}
                  learning={learning}
                  projects={projects}
                  jobs={jobs}
                  onRefreshAllData={fetchAllLocalData}
                  onApplyParsedCommand={handleApplyParsedCommand}
                />
              )}

              {activeTab === 'inbox' && (
                <QuickInboxView 
                  items={inbox}
                  onAdd={handleAddInboxItem}
                  onArchive={handleArchiveInboxItem}
                  onDelete={handleDeleteInboxItem}
                />
              )}

              {activeTab === 'todos' && (
                <TodoListView />
              )}

              {activeTab === 'goals' && (
                <GoalsView 
                  goals={goals}
                  onAdd={handleAddGoal}
                  onToggleComplete={handleToggleGoalComplete}
                  onUpdateProgress={handleUpdateGoalProgress}
                  onDelete={handleDeleteGoal}
                />
              )}

              {activeTab === 'habits' && (
                <HabitView 
                  habits={habits}
                  onAdd={handleAddHabit}
                  onToggleDay={handleToggleHabitDay}
                  onDelete={handleDeleteHabit}
                />
              )}

              {activeTab === 'timebox' && (
                <TimeboxView 
                  blocks={timebox}
                  onAddBlock={handleAddTimeboxBlock}
                  onToggleBlockComplete={handleToggleTimeboxComplete}
                  onUpdateReplanNotes={handleUpdateTimeboxReplan}
                  onRescheduleBlock={handleRescheduleTimeblock}
                  onDeleteBlock={handleDeleteTimeboxBlock}
                />
              )}

              {activeTab === 'learning' && (
                <LearningLogsView 
                  entries={learning}
                  onAdd={handleAddLearningEntry}
                  onDelete={handleDeleteLearningEntry}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectsTrackerView 
                  projects={projects}
                  onAdd={handleAddProject}
                  onToggleMilestone={handleToggleProjectMilestone}
                  onDelete={handleDeleteProject}
                />
              )}

              {activeTab === 'jobs' && (
                <JobFunnelView 
                  applications={jobs}
                  onAdd={handleAddJobApplication}
                  onUpdateStatus={handleUpdateJobStatus}
                  onDelete={handleDeleteJobApplication}
                />
              )}

              {activeTab === 'vault' && (
                <KnowledgeVaultView 
                  items={vault}
                  appsScriptUrl={syncConfig.appsScriptUrl}
                  onAddItem={handleAddVaultItem}
                  onDeleteItem={handleDeleteVaultItem}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  syncConfig={syncConfig}
                  onUpdateConfig={handleUpdateSyncConfig}
                  onPush={handlePushCloudBackup}
                  onPull={handlePullCloudRestore}
                />
              )}
            </div>

          </main>
        </div>
      )}

    </div>
  );
}
