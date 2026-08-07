# Demo: Run & demonstrate Khet-i (Module 1)

This file shows quick steps to run the project locally and a short demo flow.

1) Backend

```bash
cd backend
npm install
cp .env.example .env   # edit values (MONGO_URI, JWT_SECRET, CLOUDINARY_*)
npm run seed            # creates demo farmer + crops
npm run dev             # starts server on http://localhost:5000
```

2) Frontend

```bash
cd frontend
npm install
cp .env.example .env   # confirm VITE_API_URL if backend not on default
npm run dev            # starts app on http://localhost:5173
```

3) Demo flow

- Open `http://localhost:5173` in a browser.
- Register a new farmer or use seeded demo credentials shown after `npm run seed`:
  - email: demo@kheti.local
  - password: password123
- Login, then use Dashboard → Create Crop to add/edit/listings.
- Verify images show (seeded entries use placeholder Cloudinary sample URLs).

4) Quick API checks

List public crops:

```bash
curl http://localhost:5000/api/crops
```

Login via API (example):

```bash
curl -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"demo@kheti.local","password":"password123"}'
```

Notes:
- If you don't have Cloudinary keys, the seeded image URLs are external placeholders and will still display in the UI. Uploading new images from the frontend requires valid Cloudinary credentials in `.env`.
- If you prefer Atlas for MongoDB, paste the URI into `MONGO_URI` in `backend/.env`.
