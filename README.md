# Proto — Frontend

Proto is the frontend for a university capstone project that uses agentic AI to provide UX improvement suggestions for e-commerce websites. This React-based UI communicates with a API based Django backend to collect user data, process webpage content, and visualize UX analysis results.

#### You can view the live demo [here.](https://proto-ux.netlify.app/)

---
> Note: This repository includes the frontend logic to build the user interface. You can find the code and instructions for building the backend API server in [this repo.](https://github.com/hussein-hh/proto-api)
---

## Setup Instructions

1. Clone the repository
   ```bash
   git clone 
   cd proto-frontend

2. Install dependencies
   npm install

3. Start the development server
   npm start
   Open http://localhost:3000 to view it in your browser.

4. Connect to backend
   The frontend is already configured to use the live backend deployed on Render. No changes are required unless you're running a local backend.
   If needed, you can update the base API URL to point to a local server instead in src/config/api.js:
    ```bash
    export const API_CONFIG = {
    METHOD: 'http',
    URL_BASE: 'localhost:8000',
   };

---

## Key Features
  Users can upload webpages, walk through a guided onboarding process, and receive AI-generated UX insights. The interface presents actionable feedback in a visual dashboard and includes a conversational AI agent for deeper analysis.

 ### Auth
  Sign-up / login / logout with token-based session context.

 ### 3-Step Onboarding
  User info → 2. Business info → 3. Page details (screenshot + metadata).

 ### UX Dashboard
  Combines UI feedback, user-behaviour insights and web-vitals charts.

 ### AI Chat
  AI-Agent based Insights Chat interface for discussing UX results further.

---
