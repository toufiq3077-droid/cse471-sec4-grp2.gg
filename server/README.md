# Khet-i Backend

## Quick start

1. Copy `.env.example` to `.env`
2. Fill in MongoDB and AI provider values
3. Install dependencies:
   `npm install`
4. Start the server:
   `npm run dev`

## Vercel deployment

Deploy the backend and frontend as separate Vercel projects.

Backend project:

- Use the `server` folder as the project root.
- Vercel will use [server/api/index.js](api/index.js) as the serverless entrypoint.
- Set `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `AI_PROVIDER`, and `HF_API_KEY` in Vercel env vars.

Frontend project:

- Use the `client` folder as the project root.
- Keep [client/vercel.json](../client/vercel.json) for SPA rewrites.
- Set `VITE_API_URL` to your deployed backend URL.

MongoDB:

- Use MongoDB Atlas.
- Copy the Atlas connection string into `MONGO_URI`.

## Available endpoints

- `GET /health`
- `POST /api/ai/diagnose`
- `GET /api/ai/history`
- `GET /api/experts`
- `POST /api/experts/register`
- `GET /api/consultations/my`
- `POST /api/consultations/book`

## Authentication

The AI routes expect a JWT in the `Authorization` header as `Bearer <token>`.
The token payload should contain either `id` or `_id` for the current user.
The expert and consultation routes use the same JWT auth.

## Roles

Supported roles are `farmer`, `expert`, and `admin`.
The token payload should include one of these fields so the backend can enforce access rules:

- `role`
- `userRole`
- `type`
- `accountType`
