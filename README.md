# SproutCare — Plant Care & Routine Tracker

SproutCare is a modern full-stack plant care and routine management web application built with React, TypeScript, Tailwind CSS, Express, and Gemini AI. It helps houseplant enthusiasts manage watering, fertilizing, and pruning schedules, monitor plant health and growth over time, diagnose plant diseases from photos, plan trips with Vacation Mode, and earn milestones through an Achievements & Badges system.

---

## Features

- **Plant Collection & Indian Plant Catalog**
  - Add, view, search, filter (by room and health status), and delete plants.
  - Built-in searchable catalog featuring popular houseplants and Indian garden favorites (such as Tulsi, Curry Leaf, Money Plant / Golden Pothos, Mogra, Hibiscus, Aloe Vera, Snake Plant, Monstera, Peace Lily, and more) with curated care defaults.
  - AI photo plant identification to automatically populate species name, light needs, and care intervals.
- **Care Reminders & Routine Schedules**
  - Dynamic watering, fertilizing, and pruning reminders categorized into Overdue, Due Today, and Upcoming.
  - One-click care completion logging and `+1 day` snoozing.
  - Interactive **Plant Care Calendar** (month grid view) alongside a filterable list schedule.
- **Plant Growth Tracker**
  - Log height (cm), leaf count, milestone photos, and notes per plant.
  - Interactive SVG growth trend charts and longitudinal growth statistics.
- **Plant Health Score**
  - Automated 0–100 health score computed from care consistency, growth activity, and manual health observations (leaf condition, pests, soil, and overall appearance).
  - Visual health badges with score deltas across dashboard cards and plant detail views.
- **AI Plant Care Assistant**
  - Context-aware conversational botanist assistant powered by server-side Gemini API integration (`/api/plant-assistant`).
  - Ask general gardening questions or select a specific plant to receive tailored advice based on its care schedule and health profile.
- **AI Plant Disease Detection**
  - Upload or capture a plant photo to receive structured visual diagnostics (`/api/diagnose-plant`), including condition name, severity, confidence, visible symptoms, possible causes, safe step-by-step remedies, and prevention tips.
  - Apply diagnosis findings directly as a recorded plant health assessment.
- **Vacation Mode**
  - Set departure and return dates with automatic duration calculation and date validation.
  - Generates a prioritized pre-departure preparation checklist and projected care tasks during your absence.
  - Displays an active trip banner and automatically expires with a welcome-back message upon return.
- **Achievements & Badges**
  - 16 unlockable milestones across four categories (*Collection*, *Care Activities*, *Growth Tracker*, and *Gardening Mastery*) and four tiers (*Bronze*, *Silver*, *Gold*, *Emerald*).
  - Tracks genuine user activity only (excluding preloaded sample plants and records) with celebratory unlock toasts and capped progress indicators.
- **Persistent Local Storage**
  - All plant records, growth logs, health assessments, vacation settings, and achievements persist automatically in the browser's `localStorage`.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React
- **Build Tool:** Vite 8
- **Backend Server:** Node.js, Express 4 (`server.ts`)
- **AI Integration:** `@google/genai` (server-side proxy endpoints with retry & error handling)

---

## Project Structure

```text
sproutcare/
├── public/
│   └── images/
│       └── plants/                 # Botanical plant photography assets
├── server/                         # Modular Backend (Express + Gemini AI)
│   ├── routes/
│   │   ├── identifyPlant.ts        # POST /api/identify-plant
│   │   ├── plantAssistant.ts       # POST /api/plant-assistant
│   │   └── diagnosePlant.ts        # POST /api/diagnose-plant
│   ├── services/
│   │   └── geminiClient.ts         # GoogleGenAI client + retry/fallback logic
│   └── utils/
│       ├── errorMapper.ts          # Transient error detection & friendly messages
│       └── imageParser.ts          # Base64 / data URL / local image extraction
├── src/                            # Modular Frontend (React + TypeScript + Tailwind)
│   ├── components/
│   │   ├── ErrorBoundary.tsx       # Fault-isolated error boundary
│   │   ├── Navbar.tsx              # Responsive desktop & mobile navigation
│   │   ├── Toast.tsx               # Action feedback toast
│   │   ├── achievements/           # AchievementsModal, AchievementToast
│   │   ├── assistant/              # PlantAssistantModal (AI chat)
│   │   ├── dashboard/              # Dashboard overview & plant grid
│   │   ├── growth/                 # GrowthTracker, GrowthChart, GrowthRecordFormModal
│   │   ├── health/                 # HealthAssessmentModal, HealthScoreBadge, PlantDiagnosisModal
│   │   ├── plants/                 # AddPlant, PlantDetailModal, PlantIllustration
│   │   ├── reminders/              # Reminders, CareSchedule, PlantCareCalendar
│   │   └── vacation/               # VacationModeModal
│   ├── services/
│   │   └── aiApi.ts                # Centralized typed API client for /api/*
│   ├── data/
│   │   ├── achievementCatalog.ts   # 16 achievement definitions
│   │   ├── plantDatabase.ts        # Searchable houseplant & Indian plant catalog
│   │   ├── sampleGrowthRecords.ts  # Initial sample growth logs
│   │   └── samplePlants.ts         # Initial 7 sample plants
│   ├── types/                      # TypeScript domain interfaces
│   │   ├── achievement.ts
│   │   ├── diagnosis.ts
│   │   ├── growth.ts
│   │   ├── health.ts
│   │   ├── plant.ts
│   │   └── vacation.ts
│   ├── utils/                      # Pure business logic & localStorage helpers
│   │   ├── achievementEvaluator.ts
│   │   ├── achievementStorage.ts
│   │   ├── calendarUtils.ts
│   │   ├── dateUtils.ts
│   │   ├── growthStorage.ts
│   │   ├── healthCalculator.ts
│   │   ├── healthStorage.ts
│   │   └── vacationUtils.ts
│   ├── App.tsx                     # Root application state & layout
│   ├── index.css                   # Tailwind CSS v4 theme & typography
│   └── main.tsx                    # React entry point
├── server.ts                       # Lightweight Express + Vite entry point
├── index.html                      # HTML entry & Google Fonts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── .gitignore
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** (or compatible package manager)
- A **Gemini API Key** (required only for AI Plant Identification, AI Plant Care Assistant, and AI Plant Disease Detection; all non-AI features work offline in the browser)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd sproutcare
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env` and add your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key"
   PORT=3000
   ```
   > **Security note:** Never commit `.env` or expose your API key in client-side code. All Gemini requests are proxied server-side through `server.ts`.

### Running the Application

- **Development server (Express + Vite middleware on port 3000):**
  ```bash
  npm run dev
  ```
  Open [http://localhost:3000](http://localhost:3000) in your browser.

- **TypeScript type-checking:**
  ```bash
  npm run lint
  ```

- **Production build:**
  ```bash
  npm run build
  ```

- **Start production server:**
  ```bash
  NODE_ENV=production npm start
  ```

---

## API Endpoints

All AI calls are handled securely on the backend in `server.ts`:

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/api/identify-plant` | Identifies plant species and care requirements from an uploaded photo |
| `POST` | `/api/plant-assistant` | Context-aware conversational plant care assistant |
| `POST` | `/api/diagnose-plant` | Visual disease, pest, and stress diagnosis from a plant photo |

---

## Local Storage Keys

SproutCare persists user data locally in the browser using versioned `localStorage` keys:

- `sproutcare_plants_data_v1` — Plant collection and care logs
- `sproutcare_growth_records_v1` — Growth measurements and milestone photos
- `sproutcare_health_assessments_v1` — Recorded plant health evaluations
- `sproutcare_vacation_config_v1` — Vacation Mode dates and configuration
- `sproutcare_achievements_v1` — Unlocked achievement badges and timestamps
- `sproutcare_user_stats_v1` — Genuine user activity metrics for achievement tracking

---

## License

This project is open for personal and educational use. Add your preferred license file (e.g., MIT) before publishing publicly.
