# 🌾 Khet-i

**Khet-i** is a MERN Stack smart agriculture platform that connects farmers, buyers, agricultural experts, delivery riders, and administrators into a single digital ecosystem. The platform simplifies agricultural commerce through an online marketplace, AI-powered crop disease diagnostics, live delivery tracking, and expert consultation services.

---

## Project Overview

Khet-i aims to improve agricultural productivity and accessibility by providing:

* A digital marketplace for buying and selling crops.
* AI-powered crop disease detection and treatment recommendations.
* Real-time delivery tracking for agricultural products.
* A paid consultation platform connecting farmers with verified agricultural experts.
* Administrative tools for managing users, experts, and platform activities.

---

## Tech Stack

### Frontend

* React
* Vite
* React Router
* Tailwind CSS
* Axios

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication

### APIs & Services

* Cloudinary
* Google Gemini API
* OpenStreetMap
* Leaflet.js
* Socket.io
* Payment Gateway (Sandbox)

---

## User Roles

### 🌱 Farmer

* List agricultural products for sale.
* Diagnose crop diseases using AI.
* Book consultations with agricultural experts.
* Track deliveries.

### 🛒 Buyer

* Browse marketplace listings.
* Purchase crops directly from farmers.
* Track orders in real time.

### 👨‍🌾 Agriculture Expert

* Create a verified professional profile.
* Manage consultation schedules.
* Provide paid agricultural consultations.

### 🚚 Delivery Rider

* Accept delivery requests.
* Navigate optimized routes.
* Update delivery status in real time.

### 🛡️ Admin

* Manage platform users.
* Verify expert credentials.
* Monitor platform activity and revenue.

---

# Features

## Member 1 – Smart Marketplace & Data Analysis

* B2B/B2C Crop Marketplace
* Dynamic Market Price Charts
* Demand & Yield Prediction
* Secure Checkout System

---

## Member 2 – Smart Logistics

* Driver Assignment System
* Live Delivery Tracking
* Route & ETA Calculation
* Geo-Fencing Notifications

---

## Member 3 – Agriculture Expert Network

* Expert Verification
* Appointment Booking
* Live Consultation Chat
* Digital Billing & Payment

---

## Member 4 – AI Crop Intelligence

* AI Leaf Disease Diagnosis
* Treatment Recommendation Generator
* Weather Dashboard
* Weather Risk Notifications

---

# Database Collections

* Users
* Products
* Orders
* Deliveries
* Appointments
* Chats
* DiseaseLogs

---

# Project Structure

```text
client/
server/
docs/
README.md
```

---

# Installation

Clone the repository:

```bash
git clone <repository-url>
cd Khet-i
```

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd ../server
npm install
```

Create a `.env` file inside the `server` directory and configure the required environment variables.

Example:

```env
PORT=5000
MONGO_URI=
JWT_SECRET=
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Start the backend:

```bash
npm run dev
```

Start the frontend:

```bash
cd ../client
npm run dev
```

---

# Development Workflow

Each team member develops on a dedicated Git branch.

Example branch names:

* `feature/member1-marketplace`
* `feature/member2-logistics`
* `feature/member3-consultation`
* `feature/member4-ai`

Merge feature branches only after testing and review.

---

# Project Status

🚧 Under Development

---

# Team

* **Member 1:** Smart Marketplace & Data Analysis
* **Member 2:** Live Logistics & Tracking
* **Member 3:** Expert Consultation Network
* **Member 4:** AI Crop Intelligence

---

## License

This project was developed for academic purposes as part of the **CSE471 Software Engineering** course.
