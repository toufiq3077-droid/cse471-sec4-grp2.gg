# Khet-i — Module 1 · Member 1

**Feature:** Farmers can create, update, and manage crop listings with stock quantity, seasonal
information, pricing, and multiple product images uploaded through Cloudinary. Buyers can browse
the marketplace, manage a shopping cart, place orders, and complete checkout using Cash on Delivery
or Digital Payment, with invoice generation.

Both farmers and buyers use a single, unified login/registration system (role-based).

## Stack
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, Cloudinary + Multer for images
- **Frontend:** React (Vite), React Router, Tailwind CSS, Axios

## Folder structure
```
khet-i/
  backend/
    config/        # db.js, cloudinary.js
    models/        # User.js (farmer+buyer, role field), Crop.js, Order.js
    middleware/     # auth.js (protect/optionalAuth/authorize), upload.js, errorMiddleware.js
    controllers/    # authController.js, cropController.js, orderController.js
    routes/         # authRoutes.js, cropRoutes.js, orderRoutes.js
    scripts/        # seedDemo.js
    server.js
  frontend/
    src/
      api/axios.js
      context/AuthContext.jsx, CartContext.jsx
      components/  # Navbar, CropCard, ProductCard, ImageUploader, ProtectedRoute
      pages/       # Home, Login, Register, Dashboard, CropForm, Cart, Checkout, OrderInvoice, Orders
      App.jsx
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:
- `MONGO_URI` — local MongoDB or MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — from your free [Cloudinary](https://cloudinary.com) dashboard

Run it:
```bash
npm run dev
```
Server starts at `http://localhost:5000`. If `MONGO_URI` isn't reachable in development, it
automatically falls back to an in-memory MongoDB instance so you can still run the app (data resets
on restart). This requires downloading a mongod binary the first time, so it needs a normal internet
connection.

Optional: seed demo accounts + crops
```bash
npm run seed
```
This creates:
- Farmer login → `demo.farmer@kheti.local` / `password123`
- Buyer login  → `demo.buyer@kheti.local` / `password123`

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
App runs at `http://localhost:5173`.

## 3. Quick manual test (curl)

```bash
# Register a buyer
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Buyer","email":"buyer@test.com","password":"password123","phone":"01700000000","role":"buyer"}'

# Register a farmer
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Farmer","email":"farmer@test.com","password":"password123","phone":"01711111111","role":"farmer","farmName":"Green Acres"}'

# Login (either role)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@test.com","password":"password123"}'
# -> copy the returned "token" and use it as: -H "Authorization: Bearer <token>"
```

## API Reference

### Auth (unified — role: "farmer" | "buyer")
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register as a farmer or buyer (`role` field required) |
| POST | `/api/auth/login` | Public | Login (works for either role), returns JWT |
| GET | `/api/auth/profile` | Private | Get logged-in user's profile |
| PUT | `/api/auth/profile` | Private | Update profile fields |
| PUT | `/api/auth/profile/image` | Private | Upload/replace profile photo |

### Crop Listings (farmer-only for mutations)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/crops` | Public | Browse all **active** listings (search/filter/pagination) — used by the marketplace |
| GET | `/api/crops/mine` | Private (farmer) | Get the logged-in farmer's own listings |
| GET | `/api/crops/:id` | Public | Get one listing |
| POST | `/api/crops` | Private (farmer) | Create listing (multipart form, field `images`, up to 6) |
| PUT | `/api/crops/:id` | Private (farmer, owner) | Update fields and/or add more images |
| DELETE | `/api/crops/:id/images/:publicId` | Private (farmer, owner) | Remove a single image |
| DELETE | `/api/crops/:id` | Private (farmer, owner) | Delete listing + all its Cloudinary images |

Query params supported on list endpoints: `status`, `season`, `category`, `search`, `page`, `limit`.

### Orders / Checkout
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/orders` | Public / optional login | Place an order (COD or Digital Payment). If a buyer is logged in, the order is linked to their account automatically; guests can still check out. |
| GET | `/api/orders/:id` | Public | Fetch an order for the invoice page |
| GET | `/api/orders/mine` | Private (buyer) | Buyer's own order history |

### Crop fields
- `name`, `category` (enum), `description`
- `stockQuantity`, `unit` (kg/gram/ton/quintal/piece/dozen/bundle)
- `season` (Summer/Winter/Rainy/Autumn/Spring/All Season), `harvestDate`, `availableFrom`, `availableUntil`
- `pricePerUnit`, `discountPercent`
- `images: [{url, publicId}]` — max 6, stored on Cloudinary
- `status` — auto-set to `Out of Stock` when `stockQuantity` hits 0, editable to `Active`/`Inactive`

## What's intentionally left out (for later integration)
- Order/delivery rider flow (Module 1 — Member 2)
- Expert consultation booking (Module 1 — Member 3)
- Disease diagnosis AI (Module 1 — Member 4)

The `Crop` model already exposes a public `GET /api/crops`, and `User` model's `role` field is
generic, so teammates can register their own modules against the same accounts.
