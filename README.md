Here's a README tailored to your branch that clearly states it contains only your feature and is **not yet wired into the main Express application**.

# 🤖 AI Crop Intelligence Module

This branch contains the AI Crop Intelligence feature for the **Khet-i** Smart Agriculture Platform.

**Branch Name:** `Safin's-(Ai)`

---

## Overview

This module enables farmers to upload images of crop leaves for AI-powered disease diagnosis and receive treatment and fertilizer recommendations. The feature is designed as an independent backend and frontend module that will be integrated into the main application during project merging.

---

## Implemented Features

### 🌿 Feature 1: AI Leaf Disease Diagnosis

* Upload leaf images (JPG, PNG, WEBP)
* Analyze images using the Google Gemini Vision API
* Detect probable crop diseases
* Display:

  * Disease name
  * Confidence score
  * Description
  * Symptoms
  * Severity

### 🌱 Feature 2: Automated Treatment & Fertilizer Recommendation

Based on the diagnosed disease, the system generates:

* Organic treatment suggestions
* Chemical treatment recommendations
* Fertilizer recommendations
* Prevention tips
* Irrigation advice
* Harvest safety guidelines

---

## Backend Components

* AI Controller
* AI Routes
* Disease Diagnosis Service
* DiseaseLog MongoDB Model

---

## Planned API Endpoints

| Method | Endpoint           | Description                                               |
| ------ | ------------------ | --------------------------------------------------------- |
| POST   | `/api/ai/diagnose` | Upload a leaf image and receive an AI diagnosis.          |
| GET    | `/api/ai/history`  | Retrieve previous diagnoses for the authenticated farmer. |

---

## Technologies Used

* Node.js
* Express.js
* MongoDB
* Mongoose
* React
* Tailwind CSS
* Axios
* Google Gemini Vision API

---

## Environment Variable

```env
GEMINI_API_KEY=your_api_key
```

---

## Integration Note

This branch contains only the AI feature implementation. The shared Express server bootstrap (`server.js`, `app.js`, or equivalent) is not present in this branch. During project integration, the AI routes should be registered in the main Express application, for example:

```javascript
import aiRoutes from "./routes/aiRoutes.js";

app.use("/api/ai", aiRoutes);
```

This integration will be performed when all team members' features are merged into the main project.

---

## Status

🚧 Feature implementation in progress and awaiting integration with the main Khet-i application.
