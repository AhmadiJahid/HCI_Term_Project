# Safe Review: Speech Practice & Anxiety Support

An HCI research application designed to help individuals manage speaking anxiety through an asynchronous "Safe Review" process. This tool allows participants to record their responses to speaking prompts and review them with the support of AI-driven coaching feedback.

## 🚀 Features

- **Asynchronous Recording**: Record speech responses to randomized prompts with live waveform visualization.
- **Real-time Encouragement**: During the recording phase, the system provides motivational prompts to keep the speaker focused and confident.
- **Safe Review Dashboard**: (Experiment Group) Review recordings with:
  - Automated high-accuracy transcription (Whisper-v3).
  - AI Coaching: Personalized feedback highlighting strengths, practical tips, and cognitive reframing.
  - Speech Stats: Word count, filler word detection (um, uh, like), and WPM analysis.
- **Control Group**: Standard audio playback interface to serve as a baseline for HCI research.
- **Admin Dashboard**: researcher-facing tool for participant management, real-time statistics (t-tests, regression), and data export.
- **Data Privacy**: Local processing and secure event logging for behavioral analysis.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS.
- **Backend**: Next.js API Routes, Prisma ORM.
- **Database**: SQLite (local `dev.db`).
- **AI Services**: Groq (Whisper-v3 transcription, Llama-3 coaching).

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd safe-review-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add the following:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   COACH_URL="https://api.groq.com/openai/v1/chat/completions"
   COACH_API_KEY="your_groq_api_key_here"
   ADMIN_PASSWORD="your_desired_admin_password"
   ```

4. Setup the Database:
   ```bash
   npx prisma migrate dev --name init
   ```

5. Run the Development Server:
   ```bash
   npm run dev
   ```

6. Access the Application:
   - Participant Entry: [http://localhost:3000](http://localhost:3000)
   - Admin Dashboard: [http://localhost:3000/admin](http://localhost:3000/admin)

## 📊 Research Analysis

The project includes a `data_analysis` directory with Python scripts for processing exported CSV data and generating researchers' reports.

---
*Created for the CS543/HCI Research Project.*
