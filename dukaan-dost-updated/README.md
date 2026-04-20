# 🏪 Dukaan Dost — AI Local Business Agent

> **Har Dukaan ka AI Business Partner**  
> Powered by Google Gemini · Hindsight Memory Engine · React + Node.js

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Google Gemini API key (free at https://aistudio.google.com)

---

## 📁 Project Structure

```
dukaan-dost/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── pages/         # Dashboard, Chat, Inventory, Hindsight, Billing, Analytics
│   │   ├── components/    # Layout, shared UI
│   │   ├── context/       # AuthContext, ShopContext
│   │   └── utils/
│   │       ├── api.js         # Axios instance
│   │       └── hindsight.js   # Client-side Hindsight memory engine
│   └── package.json
│
├── backend/           # Express + MongoDB API
│   ├── server.js          # Main entry point
│   ├── config/db.js       # MongoDB connection
│   ├── middleware/auth.js # JWT middleware
│   ├── models/            # User, Inventory, Sale, Hindsight
│   ├── routes/            # auth, inventory, sales, dashboard, ai, alerts, hindsight, billing
│   └── package.json
│
└── README.md
```

---

## ⚙️ Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your keys:
#   MONGODB_URI=mongodb://localhost:27017/dukaan-dost
#   JWT_SECRET=your_secret_key
#   GEMINI_API_KEY=your_gemini_api_key

# Start development server
npm run dev
# → API running on http://localhost:5000
```

---

## 🎨 Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# → App running on http://localhost:3000
```

---

## 🔑 Environment Variables (backend/.env)

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default 5000) | No |
| `MONGODB_URI` | MongoDB connection string | ✅ Yes |
| `JWT_SECRET` | Secret for JWT signing | ✅ Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Recommended |
| `NODE_ENV` | `development` or `production` | No |
| `CORS_ORIGIN` | Frontend URL for CORS | No |

> **Note:** App works without Gemini key — falls back to rule-based Hinglish responses.

---

## 🌐 API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new shop |
| POST | `/api/auth/login` | Login with mobile + password |
| GET | `/api/auth/me` | Get current user |

### Inventory
| Method | Route | Description |
|---|---|---|
| GET | `/api/inventory` | List all items |
| POST | `/api/inventory` | Add new item |
| PUT | `/api/inventory/:id` | Update item |
| PATCH | `/api/inventory/:id/stock` | Quick stock update |
| DELETE | `/api/inventory/:id` | Soft delete item |

### Sales
| Method | Route | Description |
|---|---|---|
| POST | `/api/sales` | Record sale + auto deduct stock |
| GET | `/api/sales` | List sales with date filter |
| GET | `/api/sales/summary` | Aggregated stats |

### AI
| Method | Route | Description |
|---|---|---|
| POST | `/api/ai/chat` | Gemini-powered chat |
| POST | `/api/ai/experiment` | Hindsight experiment prediction |
| POST | `/api/ai/insights` | GWA geo market insights |

### Dashboard
| Method | Route | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Full dashboard aggregation |

### Hindsight Memory
| Method | Route | Description |
|---|---|---|
| GET | `/api/hindsight` | List memories |
| POST | `/api/hindsight` | Save new memory |
| GET | `/api/hindsight/similar` | Find similar past decisions |
| GET | `/api/hindsight/stats` | Memory statistics |
| DELETE | `/api/hindsight/:id` | Delete memory |

---

## 🧠 Hindsight Memory Engine

Dukaan Dost uses a dual-layer memory system:

### Client-side (frontend/src/utils/hindsight.js)
- Stores up to **200 decisions** in localStorage
- Smart eviction: removes old bad decisions first, then neutral, then good
- Cosine similarity search for finding similar past decisions
- Builds context string for AI prompt injection

### Server-side (MongoDB Hindsight model)
- Persistent storage across devices
- Feature vectors stored for similarity queries
- Used by `/api/ai/experiment` for accurate predictions

---

## 🏆 Features

| Feature | Status |
|---|---|
| AI Chat (Gemini) | ✅ Live |
| Hindsight Memory | ✅ Live |
| Live Dashboard | ✅ Live |
| Inventory CRUD | ✅ Live |
| Auto Billing | ✅ Live |
| Smart Alerts | ✅ Live |
| AI Experiment Mode | ✅ Live |
| Analytics Charts | ✅ Live |
| JWT Auth | ✅ Live |
| Geo Insights (GWA) | 🔄 Gemini-powered proxy |
| WhatsApp Alerts | 🔜 Planned |
| Voice Commands | 🔜 Planned |

---

## 📲 Production Deployment

```bash
# Frontend build
cd frontend && npm run build
# Outputs to frontend/dist/

# Serve frontend from Express in production
# Add to backend/server.js:
# import { fileURLToPath } from 'url'
# import path from 'path'
# app.use(express.static(path.join(__dirname, '../frontend/dist')))
# app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')))
```

---

## 🙏 Credits

Built with ❤️ for Indian shopkeepers  
**Stack:** React 18 · Vite · Express · MongoDB · Google Gemini · Recharts · JWT
