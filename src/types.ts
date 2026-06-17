/**
 * Shared Type Definitions for Personal AI Life OS
 */

export type GoalType = 'yearly' | 'monthly' | 'weekly' | 'daily';

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  category: 'DSA' | 'Java' | 'Web Dev' | 'AIML' | 'Productivity' | 'General';
  targetDate: string;
  progress: number; // 0 to 100
  completed: boolean;
  criteria?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  category: 'Leetcode' | 'CodeChef' | 'GFG' | 'Job Apps' | 'Java Dev' | 'Web Dev' | 'AIML' | 'Custom';
  history: string[]; // List of YYYY-MM-DD completion dates
  streak: number;
  bestStreak: number;
  successRate: number; // Percentage
  createdAt: string;
}

export type TimeSlot = string; // "08:00", "08:30", etc.

export interface TimeboxBlock {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlot: TimeSlot; // e.g. "08:30"
  task: string;
  completed: boolean;
  replanNotes: string;
}

export type InboxType = 'idea' | 'task' | 'article' | 'link' | 'video' | 'note' | 'opportunity';

export interface InboxItem {
  id: string;
  title: string;
  content: string;
  type: InboxType;
  status: 'active' | 'archived';
  createdAt: string;
}

export type VaultCategory = 'AI Tools' | 'Programming' | 'Career' | 'Learning' | 'Research' | 'Projects' | 'Personal';

export interface VaultItem {
  id: string;
  title: string;
  description: string;
  category: VaultCategory;
  tags: string[];
  fileUrl?: string; // Google Drive Web View Link
  fileType?: string; // 'Screenshot' | 'PDF' | 'Video' | 'Document' | 'Link'
  driveId?: string; // Google Drive File ID
  dateAdded: string; // YYYY-MM-DD
}

export type Subject = 'Java' | 'DSA' | 'Web Dev' | 'AIML' | 'Other';

export interface LearningEntry {
  id: string;
  subject: Subject;
  hours: number;
  date: string; // YYYY-MM-DD
  description: string;
}

export interface Milestone {
  id: string;
  name: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  progress: number; // 0 - 100
  status: 'planning' | 'active' | 'milestone' | 'completed';
  milestones: Milestone[];
  createdAt: string;
}

export type JobStatus = 'Wishlist' | 'Applied' | 'OA' | 'Interview' | 'Rejected' | 'Offer';

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  dateApplied: string; // YYYY-MM-DD
  status: JobStatus;
  notes: string;
  salary?: string;
  location?: string;
  applicationUrl?: string;
}

export interface AIInsightReport {
  productivityScore: number;
  consistencyScore: number;
  streakAlerts: string[];
  neglectedAreas: string[];
  wins: string[];
  recommendations: string[];
  weeklySummary: string;
}

export interface SyncConfig {
  appsScriptUrl: string;
  lastSyncedAt: string | null;
  status: 'idle' | 'syncing' | 'error' | 'success';
  errorMessage?: string;
}

export interface AppLockConfig {
  pin: string; // 4-digit PIN hashed or plain text
  isLocked: boolean;
  enabled: boolean;
  lastActivity: number;
}
