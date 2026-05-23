# NordRock TraceChain — Setup Guide

## Step 1: Install Dependencies

Open a terminal in the `tracechain-app` folder and run:

```bash
npm install
```

This installs React, Vite, Tailwind CSS, React Router, Lucide icons, and the Supabase client.

---

## Step 2: Configure Environment

1. Copy `.env.example` to a new file called `.env`:
   ```bash
   copy .env.example .env
   ```
2. Leave the `.env` values as placeholders for now — we'll fill these in during Step 2 (Supabase setup).

---

## Step 3: Start the Dev Server

```bash
npm run dev
```

Open your browser and go to: **http://localhost:5173**

You should see the TraceChain Entity Registration screen with 8 role cards.

---

## Project Structure

```
tracechain-app/
├── public/
│   └── logo.png              ← App logo (add your actual logo here)
├── src/
│   ├── components/
│   │   ├── layout/           ← Navbar, Sidebar, Footer
│   │   ├── ui/               ← Buttons, Badges, Cards (reusable)
│   │   ├── forms/            ← Reusable form fields
│   │   └── registration/     ← Multi-step registration components
│   ├── pages/
│   │   ├── SelectRolePage    ← Role selection entry screen ✅
│   │   ├── RegistrationPage  ← Multi-step form (Step 4)
│   │   ├── LoginPage         ← Login screen (Step 2)
│   │   ├── DashboardPage     ← HQ Dashboard (Step 7)
│   │   └── RegistrationSuccessPage ✅
│   ├── lib/
│   │   ├── supabase.js       ← Supabase client
│   │   ├── nexusId.js        ← Nexus ID + Trace ID generator
│   │   └── entityConfig.js   ← All roles + form fields config
│   └── styles/
│       └── index.css         ← Global styles + Tailwind
├── .env                      ← Your private keys (never commit!)
├── .env.example              ← Template for new developers
├── tailwind.config.js        ← Design system colours & fonts
└── vite.config.js
```
