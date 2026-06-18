# 🚀 Personal Life OS

A full-stack, AI-assisted productivity operating system designed to unify habit tracking, goal management, project planning, learning progress, job applications, and personal knowledge management into a single workspace.

Built to replace my fragmented workflow across Google Sheets, Notion, notes apps, and standalone trackers.

## 🌐 Live Demo

https://personal-life-os-project.vercel.app/

https://personal-life-os-hsdl.onrender.com/

## 📂 GitHub Repository

https://github.com/Gunashekhar4/personal-life-os

---

# 📖 Why I Built This

For years, I tracked different parts of my life across multiple platforms:

* Google Sheets for habits
* Notion for planning
* Notes apps for ideas
* Separate trackers for learning and job applications

The problem was context switching.

I wanted a single system that could:

* Track habits
* Manage goals
* Plan my day
* Organize projects
* Track job applications
* Store knowledge
* Generate productivity insights

This project became **Life OS** — my personal productivity operating system.

---

# ✨ Key Features

## 🔒 Security Lock

* PIN-protected access
* Auto-lock after inactivity
* Secure local storage

---

## 📊 AI Dashboard

* Productivity insights
* Consistency tracking
* Habit analytics
* Daily recommendations
* Weekly summaries

Powered by Google Gemini API.

---

## 🤖 Natural Language Productivity Assistant

Interact using simple commands:

```text
leetcode done

worked on java for 90 mins

apply to microsoft tomorrow

save this AI tool for later
```

The assistant automatically:

* Understands intent
* Categorizes information
* Updates trackers
* Synchronizes data

---

## 🔥 Habit Tracker

Track habits such as:

* LeetCode
* CodeChef
* GeeksforGeeks
* Learning
* Job Applications
* Custom Habits

Features:

* Streaks
* Consistency score
* Heatmaps
* Progress charts

---

## 📆 Timeboxing Planner

Plan your day using time blocks.

Features:

* Daily schedule
* Focus sessions
* Replanning support
* Productivity monitoring

---

## 📋 Task Manager

* Priorities
* Categories
* Due dates
* Status tracking

---

## 🎓 Learning Tracker

Track:

* Study hours
* Courses
* Learning goals
* Skill development

---

## 📁 Project Tracker

Manage:

* Projects
* Milestones
* Progress
* Sprint tracking

---

## 💼 Job Application Tracker

Track:

* Applications
* OA rounds
* Interviews
* Offers
* Rejections

Visualized through a recruitment funnel.

---

## 🧠 Knowledge Vault

Personal second brain.

Store:

* Notes
* Links
* Resources
* Screenshots
* Research
* Ideas

---

## 📥 Quick Inbox

Capture ideas instantly.

Examples:

* Future project ideas
* AI tools
* Articles
* Tasks

---

# 🏗️ Architecture

```text
User
 │
 ▼
Life OS (PWA)
 │
 ├── IndexedDB
 │
 ├── Google Sheets
 │
 ├── Google Drive
 │
 └── Gemini API
```

## Storage Strategy

### Local First

* IndexedDB
* LocalStorage

### Cloud Sync

* Google Sheets
* Google Apps Script API

### File Storage

* Google Drive

### AI Layer

* Gemini API

---

# 🛠️ Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

## Backend

* Node.js
* Express

## AI

* Google Gemini API

## Database

* IndexedDB
* LocalStorage

## Sync

* Google Sheets
* Google Apps Script

## Deployment

* Vercel
* Render

---

# ⚙️ Local Setup

## Clone Repository

```bash
git clone https://github.com/Gunashekhar4/personal-life-os.git

cd personal-life-os
```

## Install Dependencies

```bash
npm install
```

## Configure Environment Variables

Create:

```env
.env
```

Add:

```env
GEMINI_API_KEY=your_api_key
PORT=3000
```

## Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 📊 Google Sheets Setup

Life OS supports syncing directly to your own Google Sheet.

## Steps

1. Create a Google Sheet
2. Open Extensions → Apps Script
3. Paste the Apps Script template
4. Deploy as Web App
5. Set access to:

   * Execute as: Me
   * Access: Anyone
6. Copy the Web App URL
7. Paste it into Life OS Settings
8. Save Configuration
9. Sync Data

You now have a free personal backend powered by Google Sheets.

---

# 📱 Mobile Installation

Life OS supports installation as a Progressive Web App (PWA).

### Android

1. Open the web app
2. Tap "Install App"
3. Add to Home Screen

The application behaves like a native Android app.

---

# 🎯 Key Learnings

This project helped me learn:

* Full-stack development
* Offline-first architecture
* Local-first systems
* API integrations
* Data synchronization
* AI-assisted development
* Product design thinking
* PWA development

---

# 🚧 Future Roadmap

* Calendar Integration
* Voice Commands
* AI Weekly Reports
* Advanced Analytics
* Smart Goal Planning
* Notifications
* Mobile Enhancements

---

# 🤝 Contributions

This project was built primarily for personal use, but suggestions, ideas, and feedback are always welcome.

---

# 📜 License

MIT License

Feel free to fork, modify, and adapt the project for your own productivity workflow.
