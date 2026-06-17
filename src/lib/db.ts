/**
 * IndexedDB Local Database Layer & Seed Engine
 * Enables 100% offline-first operations for Personal AI Life OS
 */

import { Goal, Habit, TimeboxBlock, InboxItem, VaultItem, LearningEntry, Project, JobApplication } from '../types';

const DB_NAME = 'LifeOS_Database';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      
      const stores = [
        'goals',
        'habits',
        'timebox',
        'inbox',
        'vault',
        'learning',
        'projects',
        'jobs'
      ];

      stores.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = (event: any) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });

  return dbPromise;
}

// Generic CRUD methods
export async function getAllFromIDB<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putIntoIDB<T>(storeName: string, item: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFromIDB(storeName: string, id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearIDBStore(storeName: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Pre-populate Database with high-quality CS student metrics
export async function seedDatabaseIfEmpty(): Promise<void> {
  const existingGoals = await getAllFromIDB<Goal>('goals');
  if (existingGoals.length > 0) return; // Already seeded / has data

  console.log('[Life OS Seed] Database empty. Pre-populating developer OS metrics...');

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastWeekStr = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  // 1. Seed Goals
  const initialGoals: Goal[] = [
    {
      id: 'g-1',
      title: 'Land a Software Engineering summer internship',
      type: 'yearly',
      category: 'Productivity',
      targetDate: '2026-09-30',
      progress: 60,
      completed: false,
      criteria: 'Offer letter from top tech/product company',
      createdAt: lastWeekStr
    },
    {
      id: 'g-2',
      title: 'Master Advanced Data Structures & Algorithms',
      type: 'yearly',
      category: 'DSA',
      targetDate: '2026-12-31',
      progress: 75,
      completed: false,
      criteria: 'Reach 350+ LeetCode milestones',
      createdAt: lastWeekStr
    },
    {
      id: 'g-3',
      title: 'Complete Java Spring Boot microservice stack',
      type: 'monthly',
      category: 'Java',
      targetDate: '2026-06-30',
      progress: 40,
      completed: false,
      criteria: 'Build fully secure API cluster with OAuth and Spanner integration',
      createdAt: todayStr
    },
    {
      id: 'g-4',
      title: 'Complete Machine Learning Core Course',
      type: 'monthly',
      category: 'AIML',
      targetDate: '2026-06-25',
      progress: 90,
      completed: false,
      criteria: 'Develop classification and neural model prototypes',
      createdAt: lastWeekStr
    },
    {
      id: 'g-5',
      title: 'Practice 15 Greedy & Dynamic Programming problems',
      type: 'weekly',
      category: 'DSA',
      targetDate: '2026-06-18',
      progress: 100,
      completed: true,
      criteria: 'Greedy logic complete on CodeChef / GeeksforGeeks',
      createdAt: yesterdayStr
    },
    {
      id: 'g-6',
      title: 'Polishing Resume & portfolio layout',
      type: 'daily',
      category: 'Web Dev',
      targetDate: todayStr,
      progress: 100,
      completed: true,
      criteria: 'Resume compiled in LaTeX and updated on Drive',
      createdAt: todayStr
    },
    {
      id: 'g-7',
      title: 'LeetCode Daily Challenge',
      type: 'daily',
      category: 'DSA',
      targetDate: todayStr,
      progress: 0,
      completed: false,
      criteria: 'Solve daily on LeetCode platform',
      createdAt: todayStr
    }
  ];

  for (const g of initialGoals) {
    await putIntoIDB('goals', g);
  }

  // 2. Seed Habits
  const initialHabitList: Habit[] = [
    {
      id: 'h-1',
      name: 'LeetCode & GFG Practice',
      category: 'Leetcode',
      history: [yesterdayStr, new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]],
      streak: 5,
      bestStreak: 12,
      successRate: 85,
      createdAt: lastWeekStr
    },
    {
      id: 'h-2',
      name: 'Competitive CodeChef Rounds',
      category: 'CodeChef',
      history: [yesterdayStr],
      streak: 1,
      bestStreak: 3,
      successRate: 60,
      createdAt: lastWeekStr
    },
    {
      id: 'h-3',
      name: 'Java Spring Dev Session',
      category: 'Java Dev',
      history: [yesterdayStr, new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]],
      streak: 2,
      bestStreak: 6,
      successRate: 70,
      createdAt: lastWeekStr
    },
    {
      id: 'h-4',
      name: 'Explore AIML & Neural Nets',
      category: 'AIML',
      history: [yesterdayStr],
      streak: 1,
      bestStreak: 4,
      successRate: 55,
      createdAt: lastWeekStr
    }
  ];

  for (const h of initialHabitList) {
    await putIntoIDB('habits', h);
  }

  // 3. Seed Timebox blocks
  const initialTimebox: TimeboxBlock[] = [
    {
      id: 'tb-1',
      date: todayStr,
      timeSlot: '08:00',
      task: 'Solve LeetCode Daily Challenge on Tree Traversal',
      completed: true,
      replanNotes: ''
    },
    {
      id: 'tb-2',
      date: todayStr,
      timeSlot: '09:00',
      task: 'Watch Spring Boot Microservices Session 4',
      completed: true,
      replanNotes: ''
    },
    {
      id: 'tb-3',
      date: todayStr,
      timeSlot: '11:00',
      task: 'Review Resume template & compile updated LaTeX',
      completed: true,
      replanNotes: ''
    },
    {
      id: 'tb-4',
      date: todayStr,
      timeSlot: '14:30',
      task: 'Java collections framework practice',
      completed: false,
      replanNotes: 'Postponed to prepare for upcoming OA'
    },
    {
      id: 'tb-5',
      date: todayStr,
      timeSlot: '16:00',
      task: 'Take Mock OA on HackerRank for Amazon test prep',
      completed: false,
      replanNotes: ''
    }
  ];

  for (const tb of initialTimebox) {
    await putIntoIDB('timebox', tb);
  }

  // 4. Seed Inbox
  const initialInbox: InboxItem[] = [
    {
      id: 'ib-1',
      title: 'Idea: Build an interactive DSA Visualizer',
      content: 'A React application to visualize heap sort, red-black trees, and Dijkstra graphs in 3D using canvas. Useful for portfolios.',
      type: 'idea',
      status: 'active',
      createdAt: lastWeekStr
    },
    {
      id: 'ib-2',
      title: 'Task: Apply to Salesforce SDE Intern opening',
      content: 'Referral link found on LinkedIn, apply by end of this week.',
      type: 'opportunity',
      status: 'active',
      createdAt: yesterdayStr
    },
    {
      id: 'ib-3',
      title: 'Article: System Design of Google Docs Real-time Collaboration',
      content: 'Excellent guide on Operational Transformation (OT) and CRDTs for sync. Saved to read later.',
      type: 'article',
      status: 'active',
      createdAt: todayStr
    }
  ];

  for (const ib of initialInbox) {
    await putIntoIDB('inbox', ib);
  }

  // 5. Seed Knowledge Vault
  const initialVault: VaultItem[] = [
    {
      id: 'kv-1',
      title: 'Dijkstra and A* Pathfinder Cheat Sheet',
      description: 'Quick reference sheet showing runtime complexities, priority queue updates, and heuristics comparison.',
      category: 'Learning',
      tags: ['DSA', 'Algorithms', 'Notes'],
      dateAdded: lastWeekStr
    },
    {
      id: 'kv-2',
      title: 'Dockerizing Spring Boot + PostgreSQL Apps',
      description: 'Clean Multi-stage Dockerfile setup for lightweight production images, using Alpine base image and layered JARs.',
      category: 'Programming',
      tags: ['Java', 'Docker', 'DevOps'],
      dateAdded: yesterdayStr
    },
    {
      id: 'kv-3',
      title: 'Amazon Online Assessment Prep Tracker',
      description: 'Curated list of 50 Amazon-specific DSA problems categorized by frequency and tags.',
      category: 'Career',
      tags: ['Interview', 'Amazon', 'DSA'],
      dateAdded: todayStr
    }
  ];

  for (const kv of initialVault) {
    await putIntoIDB('vault', kv);
  }

  // 6. Seed Learning Tracker
  const initialLearning: LearningEntry[] = [
    {
      id: 'ln-1',
      subject: 'DSA',
      hours: 3.5,
      date: yesterdayStr,
      description: 'Solves 4 DP questions & practiced AVL tree height balancing algorithms.'
    },
    {
      id: 'ln-2',
      subject: 'Java',
      hours: 2,
      date: yesterdayStr,
      description: 'Studied concurrent maps, locks, and task scheduling executors.'
    },
    {
      id: 'ln-3',
      subject: 'AIML',
      hours: 4,
      date: lastWeekStr,
      description: 'Coded a simple neural network from scratch using Python & NumPy.'
    },
    {
      id: 'ln-4',
      subject: 'Web Dev',
      hours: 1.5,
      date: todayStr,
      description: 'Configured full-stack sync routes and indexdb schema hooks.'
    }
  ];

  for (const ln of initialLearning) {
    await putIntoIDB('learning', ln);
  }

  // 7. Seed Project Tracker
  const initialProjects: Project[] = [
    {
      id: 'pr-1',
      name: 'Personal AI Life Operating System',
      description: 'React + Express full-stack center for CS activities, integrated with Google Sheets, local IndexedDB backup, and Gemini insights.',
      progress: 85,
      status: 'active',
      milestones: [
        { id: 'm-1-1', name: 'Database schema & local IndexedDB engine', completed: true },
        { id: 'm-1-2', name: 'UI Components & elegant dark dashboard state', completed: true },
        { id: 'm-1-3', name: 'Secure Express client and Gemini AI proxy', completed: true },
        { id: 'm-1-4', name: 'Configure App Lock PIN security rules', completed: true },
        { id: 'm-1-5', name: 'Bidirectional sync to Google Sheets Apps Script', completed: false }
      ],
      createdAt: lastWeekStr
    },
    {
      id: 'pr-2',
      name: 'Spring Boot Reactive Chat Cluster',
      description: 'High-throughput microservices using Spring WebFlux, RSocket, and Apache Kafka for pub-sub messaging.',
      progress: 30,
      status: 'active',
      milestones: [
        { id: 'm-2-1', name: 'Draft architectural cluster diagram', completed: true },
        { id: 'm-2-2', name: 'Implement OAuth Gateway proxy', completed: false },
        { id: 'm-2-3', name: 'Kafka broker docker compose setup', completed: false }
      ],
      createdAt: todayStr
    }
  ];

  for (const pr of initialProjects) {
    await putIntoIDB('projects', pr);
  }

  // 8. Seed Job applications
  const initialJobs: JobApplication[] = [
    {
      id: 'jb-1',
      company: 'Microsoft',
      role: 'Software Engineering Intern',
      dateApplied: yesterdayStr,
      status: 'Applied',
      notes: 'Applied with referral code, pending resume triage.',
      salary: '$45/hr',
      location: 'Redmond, WA (Remote/Hybrid)'
    },
    {
      id: 'jb-2',
      company: 'Amazon',
      role: 'SDE Intern',
      dateApplied: lastWeekStr,
      status: 'OA',
      notes: 'Received Online Assessment email. 2 coding problems + leadership vibes. Deadline next week.',
      salary: '$50/hr',
      location: 'Seattle, WA'
    },
    {
      id: 'jb-3',
      company: 'Google',
      role: 'STEP Intern 2026',
      dateApplied: todayStr,
      status: 'Wishlist',
      notes: 'Applications opening soon. Preparing resume matches.',
      salary: '$48/hr',
      location: 'Mountain View, CA'
    }
  ];

  for (const jb of initialJobs) {
    await putIntoIDB('jobs', jb);
  }

  console.log('[Life OS Seed] Successfully seeded default developer state logs.');
}
