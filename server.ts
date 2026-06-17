import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Initialize Gemini
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in Secrets / environment variables.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Endpoint 1: Parse Natural Language Commands
app.post("/api/gemini/command", async (req: express.Request, res: express.Response) => {
  try {
    const { message, currentDate } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const ai = getGemini();
    const systemPrompt = `
You are a brilliant productivity parsing module for a Personal AI Life Operating System.
Your job is to analyze a single natural language input from the user and parse it into a structured command to update their productivity state.
The available modules and their structured updates are:

1. Module: "habits"
   - action: "complete_habit"
   - data fields: { name: string, category: string }
   - Example: "leetcode done" -> { "module": "habits", "action": "complete_habit", "data": { "name": "Leetcode Code practice", "category": "Leetcode" } }

2. Module: "learning"
   - action: "add_learning"
   - data fields: { subject: "Java"|"DSA"|"Web Dev"|"AIML"|"Other", hours: number, description: string, date: string } (if hours not specified, default to 1 hour, date is: ${currentDate || 'today'}'s date in YYYY-MM-DD)
   - Example: "worked on java for 90 mins" -> { "module": "learning", "action": "add_learning", "data": { "subject": "Java", "hours": 1.5, "description": "Worked on Java practice via natural language parse", "date": "current_date_formatted" } }

3. Module: "goals"
   - action: "add_goal"
   - data fields: { title: string, type: "yearly"|"monthly"|"weekly"|"daily", category: "DSA"|"Java"|"Web Dev"|"AIML"|"Productivity"|"General", targetDate: string }
   - Example: "apply to microsoft tomorrow" -> { "module": "jobs", ... } (or if goal: { "module": "goals", "action": "add_goal", "data": { "title": "Apply to Microsoft", "type": "daily", "category": "Productivity", "targetDate": "tomorrow_date" } })

4. Module: "inbox"
   - action: "add_inbox"
   - data fields: { title: string, content: string, type: "idea"|"task"|"article"|"link"|"video"|"note"|"opportunity" }
   - Example: "save this note about spring boot configuration" -> { "module": "inbox", "action": "add_inbox", "data": { "title": "Spring Boot configuration", "content": "Spring Boot configuration note created via Voice/Quick Capture", "type": "note" } }

5. Module: "jobs"
   - action: "add_job"
   - data fields: { company: string, role: string, dateApplied: string, status: "Wishlist"|"Applied"|"OA"|"Interview"|"Rejected"|"Offer", notes: string } (dateApplied is usually today's date in YYYY-MM-DD or specified date)
   - Example: "add goldman sachs wishlist for mechanical sde role" -> { "module": "jobs", "action": "add_job", "data": { "company": "Goldman Sachs", "role": "sde", "dateApplied": "current_date", "status": "Wishlist", "notes": "Mechanical sde role" } }

6. Module: "vault"
   - action: "add_vault"
   - data fields: { title: string, description: string, category: "AI Tools"|"Programming"|"Career"|"Learning"|"Research"|"Projects"|"Personal", tags: string[], fileType: "Link"|"Document"|"PDF"|"Screenshot"|undefined }
   - Example: "add AI article to vault" -> { "module": "vault", "action": "add_vault", "data": { "title": "AI Article Bookmark", "description": "Quick captured ai article", "category": "Research", "tags": ["AI", "Article"], "fileType": "Link" } }

Ensure you output EXACTLY one JSON object matching this schema:
{
  "module": "habits" | "learning" | "goals" | "inbox" | "vault" | "jobs",
  "action": "complete_habit" | "add_learning" | "add_goal" | "add_inbox" | "add_vault" | "add_job",
  "data": object
}

If you cannot parse it or are unsure, assign it to "inbox" with type "idea" as a fallback so the user doesn't lose the capture.
The current date is: ${currentDate || new Date().toISOString().split('T')[0]}. Translate "tomorrow", "today", "yesterday" accordingly.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["module", "action", "data"],
          properties: {
            module: { type: Type.STRING },
            action: { type: Type.STRING },
            data: { type: Type.OBJECT }
          }
        }
      }
    });

    const structuredResult = JSON.parse(response.text?.trim() || "{}");
    res.json(structuredResult);
  } catch (err: any) {
    console.error("AI command parsing error:", err);
    res.status(500).json({ error: "Failed to parse command with Gemini AI. Is GEMINI_API_KEY configured?" });
  }
});

// Dynamic Local Fallback Analyst for CS Student's Life OS (when Gemini times out or is unreachable)
function generateOfflineInsights(habits: any[] = [], goals: any[] = [], learning: any[] = [], projects: any[] = [], jobs: any[] = []) {
  const totalGoals = goals?.length || 0;
  const completedGoals = goals?.filter((g: any) => g.completed)?.length || 0;
  const goalScore = totalGoals > 0 ? (completedGoals / totalGoals) * 30 : 15;

  const validHabits = habits || [];
  const avgHabitSuccess = validHabits.length > 0
    ? (validHabits.reduce((acc: number, h: any) => acc + (parseFloat(h.successRate) || 0), 0) / validHabits.length)
    : 50;
  const habitScore = (avgHabitSuccess / 100) * 30;

  const validLearning = learning || [];
  const totalLearningHours = validLearning.reduce((acc: number, item: any) => acc + (parseFloat(item.hours) || 0), 0);
  const learningScore = totalLearningHours > 20 ? 20 : (totalLearningHours / 20) * 20;

  const validProjects = projects || [];
  const totalProjects = validProjects.length;
  const avgProjectProgress = totalProjects > 0
    ? (validProjects.reduce((acc: number, p: any) => acc + (parseFloat(p.progress) || 0), 0) / totalProjects)
    : 50;
  const projectScore = (avgProjectProgress / 100) * 20;

  const productivityScore = Math.max(1, Math.min(100, Math.round(goalScore + habitScore + learningScore + projectScore)));

  const maxStreak = validHabits.length > 0
    ? Math.max(...validHabits.map((h: any) => parseInt(h.streak) || 0))
    : 0;
  const streakScore = maxStreak > 15 ? 40 : (maxStreak / 15) * 40;
  const consistencyScoreOffset = validHabits.length > 0
    ? (validHabits.reduce((acc: number, h: any) => acc + (parseFloat(h.successRate) || 0), 0) / validHabits.length) * 0.6
    : 30;
  const consistencyScore = Math.max(1, Math.min(100, Math.round(streakScore + consistencyScoreOffset)));

  const streakAlerts: string[] = [];
  if (validHabits.length > 0) {
    const sortedByStreak = [...validHabits].sort((a: any, b: any) => (b.streak || 0) - (a.streak || 0));
    const highStreakHabit = sortedByStreak[0];
    if (highStreakHabit && (highStreakHabit.streak || 0) > 0) {
      streakAlerts.push(`🔥 Active Focus: "${highStreakHabit.name}" is on a steady ${highStreakHabit.streak}-day streak!`);
    }
    const lowSuccessHabit = [...validHabits].sort((a: any, b: any) => (a.successRate || 0) - (b.successRate || 0))[0];
    if (lowSuccessHabit && (parseFloat(lowSuccessHabit.successRate) || 0) < 50) {
      streakAlerts.push(`⚠️ Re-focus required: "${lowSuccessHabit.name}" compliance rate is at ${lowSuccessHabit.successRate}%.`);
    }
  }
  if (streakAlerts.length === 0) {
    streakAlerts.push("💡 Establish routine computer science practices to trigger automated streak alerts.");
    streakAlerts.push("🎯 Quick goals help maintain consistency and sustain momentum across academic sprints.");
  }

  const neglectedAreas: string[] = [];
  const subjects = ["DSA", "Java", "Web Dev", "AIML"];
  const subjectLogs: { [key: string]: number } = {};
  subjects.forEach(s => { subjectLogs[s] = 0; });
  validLearning.forEach((l: any) => {
    if (subjects.includes(l.subject)) {
      subjectLogs[l.subject] += parseFloat(l.hours) || 0;
    }
  });
  const sortedSubjectsByHours = Object.keys(subjectLogs).sort((a, b) => subjectLogs[a] - subjectLogs[b]);
  if (sortedSubjectsByHours.length > 0 && subjectLogs[sortedSubjectsByHours[0]] < 2) {
    neglectedAreas.push(`${sortedSubjectsByHours[0]} Core Practice`);
  }
  const lowProgressProject = validProjects.find((p: any) => (parseFloat(p.progress) || 0) < 40 && p.status === 'Active');
  if (lowProgressProject) {
    neglectedAreas.push(`Project: ${lowProgressProject.name}`);
  }
  if (neglectedAreas.length === 0) {
    neglectedAreas.push("Algorithmic LeetCode Practice");
  }

  const wins: string[] = [];
  const completedProject = validProjects.find((p: any) => (parseFloat(p.progress) || 0) === 100 || p.status === 'Completed');
  if (completedProject) {
    wins.push(`Successfully completed high-priority project "${completedProject.name}".`);
  }
  const completedG = goals?.find((g: any) => g.completed);
  if (completedG) {
    wins.push(`Hit targeted milestone objective: "${completedG.title}".`);
  }
  if (totalLearningHours > 4) {
    wins.push(`Logged ${totalLearningHours.toFixed(1)} hours of deep computer science mastery and concept review.`);
  }
  if (wins.length === 0) {
    if (validHabits.length > 0) {
      wins.push("Successfully established and logged daily tracking habits.");
    } else {
      wins.push("Operationalized Life OS panels and configured the productivity suite.");
    }
  }

  const recommendations: string[] = [];
  const minProject = validProjects.length > 0 ? [...validProjects].sort((a: any, b: any) => (a.progress || 0) - (b.progress || 0))[0] : null;
  if (minProject && (parseFloat(minProject.progress) || 0) < 100) {
    recommendations.push(`Devote 45 minutes to scale "${minProject.name}" from its current progress of ${minProject.progress}%.`);
  } else {
    recommendations.push("Brainstorm and prototype an innovative side-project using React and the Gemini API.");
  }

  if (subjectLogs["DSA"] === 0) {
    recommendations.push("Attempt 2 LeetCode algorithm challenges focusing on Graph Traversal or Dynamic Programming.");
  } else {
    recommendations.push("Practice system design concepts or draft a Java Core API in your sandbox.");
  }

  const jobsWishlist = (jobs || []).filter((j: any) => j.status === 'Wishlist').length;
  if (jobsWishlist > 0) {
    recommendations.push(`Refine your application materials and submit resume drafts for ${jobsWishlist} wishlist positions.`);
  } else {
    recommendations.push("Track and add 2 additional software engineering job postings to your Application Funnel.");
  }

  let weeklySummary = `Your focus metrics remain stable with ${totalLearningHours.toFixed(1)} study hours logged. `;
  if (productivityScore > 75) {
    weeklySummary += "You are demonstrating outstanding discipline and progress. Keep maintaining this solid trajectory!";
  } else {
    weeklySummary += "Consider timeboxing your core concepts study sessions and complete active backlog goals to optimize output.";
  }

  return {
    productivityScore,
    consistencyScore,
    streakAlerts,
    neglectedAreas,
    wins,
    recommendations,
    weeklySummary
  };
}

// AI Endpoint 2: Deep Productivity Analyst Insights
app.post("/api/gemini/insights", async (req: express.Request, res: express.Response) => {
  const { habits, goals, learning, projects, jobs, scope } = req.body;
  try {
    const ai = getGemini();

    const statsSummary = `
--- CURRENT OS STATE SUMMARY ---
Total Active Goals: ${goals?.length || 0}
Goals breakdown: Yearly (${goals?.filter((g: any) => g.type === 'yearly').length || 0}), Monthly (${goals?.filter((g: any) => g.type === 'monthly').length || 0}), Weekly (${goals?.filter((g: any) => g.type === 'weekly').length || 0}), Daily (${goals?.filter((g: any) => g.type === 'daily').length || 0})
Completed Goals: ${goals?.filter((g: any) => g.completed).length || 0}

Habits: ${habits?.map((h: any) => `${h.name} (${h.category}) - Streak: ${h.streak}d, Best Streak: ${h.bestStreak}d, Success Rate: ${h.successRate}%`).join(', ') || 'No habits configured yet'}

Learning Subject breakdown (study log rows): ${learning?.length || 0} logs
Total Logged Learning Hours: ${learning?.reduce((acc: number, item: any) => acc + (parseFloat(item.hours) || 0), 0) || 0} hours

Projects Tracked: ${projects?.map((p: any) => `${p.name} (${p.status}) - Progress: ${p.progress}%`).join(', ') || 'No projects configured yet'}

Job Applications Status Funnel:
Wishlist: ${jobs?.filter((j: any) => j.status === 'Wishlist').length || 0}
Applied: ${jobs?.filter((j: any) => j.status === 'Applied').length || 0}
OA (Online Assessments): ${jobs?.filter((j: any) => j.status === 'OA').length || 0}
Interview: ${jobs?.filter((j: any) => j.status === 'Interview').length || 0}
Rejected: ${jobs?.filter((j: any) => j.status === 'Rejected').length || 0}
Offer: ${jobs?.filter((j: any) => j.status === 'Offer').length || 0}
`;

    const systemPrompt = `
You are a direct, elite Personal Productivity AI Analyst for a Computer Science student's Life OS.
Your role is NOT a general chat assistant. You analyze their precise state logs, find neglected areas, calculate streaks/scores, highlight wins, flag declining habits, and generate actionable recommendations.

Generate a JSON object with the following fields:
- "productivityScore": a calculated number (1-100) based on goals met, learning hours, projects progress, and habit completion.
- "consistencyScore": a calculated number (1-100) specifically based on streaks and habit success rates.
- "streakAlerts": an array of short strings highlighting streaking habits or warning about broken ones.
- "neglectedAreas": an array of categories/subjects that need urgent attention (minimum 1, max 3).
- "wins": an array of recent highlights (completed projects, completed goals, logged DSA hours, etc.)
- "recommendations": a list of 3-4 hyper-specific, direct, tech-focused actionable recommendations tailored for a Computer Science student (e.g. suggesting specific DSA study, job applications, web projects next steps, or timeboxing tips).
- "weeklySummary": a 2-sentence summary of the user's focus and trajectory.

Analyze the user's data state deeply and return EXACTLY this JSON format. Avoid conversational introductions or extra formatting outside the requested JSON schema.
`;

    // 15-second execution timeout threshold race to prevent undici HeadersTimeoutError
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), 15000);
    });

    const geminiPromise = (async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Perform a ${scope || 'daily'} review on the following state logs: ${statsSummary}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["productivityScore", "consistencyScore", "streakAlerts", "neglectedAreas", "wins", "recommendations", "weeklySummary"],
            properties: {
              productivityScore: { type: Type.INTEGER },
              consistencyScore: { type: Type.INTEGER },
              streakAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
              neglectedAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
              wins: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              weeklySummary: { type: Type.STRING }
            }
          }
        }
      });
      return JSON.parse(response.text?.trim() || "{}");
    })();

    const parsedInsights = await Promise.race([geminiPromise, timeoutPromise]);
    res.json(parsedInsights);
  } catch (err: any) {
    console.log("[Analyst System] Served local analytical metrics fallback.");
    // Serve premium local calculated insights as a reliable, zero-latency fallback
    const offlineInsights = generateOfflineInsights(habits, goals, learning, projects, jobs);
    res.json(offlineInsights);
  }
});

// AI Endpoint 3: Ask Second Brain Assistant
app.post("/api/gemini/ask", async (req: express.Request, res: express.Response) => {
  try {
    const { question, stateContext } = req.body;
    if (!question) {
      res.status(400).json({ error: "Question query is required" });
      return;
    }

    const ai = getGemini();

    const systemPrompt = `
You are the elite "Second Brain AI Analyst" and Executive Coach for a Computer Science student's Life OS.
Your user has asked you a productivity or study question: "${question}".

Here is their current database context:
${JSON.stringify(stateContext || {})}

Offer a highly specific, direct, motivational, and hyper-actionable markdown response. 
Use precise CS terminology where relevant (e.g. Java, trees, graphs, Spring framework, system design, LeetCode patterns). 
Ensure your tone is professional, technical, clear, and highly focused. Limit responses to 3 brief paragraphs or elegant bullet-points. Avoid flattery or conversational introductions.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: question,
      config: {
        systemInstruction: systemPrompt
      }
    });

    res.json({ answer: response.text?.trim() || "No response received from your Personal Coach node." });
  } catch (err: any) {
    console.error("AI coach question error:", err);
    res.status(500).json({ error: "Coach node went offline. Is your GEMINI_API_KEY healthy?" });
  }
});

// Serve Frontend Bundle with Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const viteModuleName = "vite";
    const { createServer: createViteServer } = await import(viteModuleName);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Life OS Server] Running real-time dev server on http://0.0.0.0:${PORT}`);
  });
}

startServer();
