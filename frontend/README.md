# AI Interview Integrity Monitoring System - Frontend

A high-performance, platform-style frontend UI built with React 18, Tailwind CSS (v4), and Framer Motion.

## Features

- **Live Session Platform**: Split-screen interview environment with Monaco code editor and real-time AI monitoring.
- **AI Monitoring System**: Simulated risk score engine, detection indicators (Eye Tracking, Face Detection, Tab Activity), and live alerts feed.
- **Dashboard**: High-level overview of system status, active sessions, and violation trends.
- **Sessions Management**: Table view to manage and review historical and active interview sessions.
- **Deep Analytics**: Radar charts for violation fingerprints, regional metrics, and outcome distribution.
- **Dark Mode**: Premium LeetCode-inspired aesthetic with glassmorphism and smooth transitions.

## Tech Stack

- **Framework**: React 18
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **Editor**: @monaco-editor/react

## Getting Started

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Simulation Details

The platform view simulates real-time data using `setInterval`:
- Risk scores fluctuate dynamically.
- Random integrity violations are triggered (Look away, Multi-face, Tab switch).
- The alert feed updates automatically with severity-coded badges.
