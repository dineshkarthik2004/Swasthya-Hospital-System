# Medical Voice & Patient Management System

A full-stack medical application featuring AI-powered voice extraction and complete clinic management.

## 📁 Repository Structure

-   `frontend/`: React + Vite application (Patient Dashboard, Doctor Panel, Receptionist Portal).
-   `backend/`: Express.js + Prisma API (Auth, CRUD, AI Processing).

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js v18+
- PostgreSQL database (Local or Cloud like Neon)

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file (see .env.example)
npx prisma generate
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Create a .env file (see .env.example)
npm run dev
```

---

## 🛠️ Deployment Instructions

### Backend (Render / Railway / Fly.io)
- **Repo Base**: `backend/`
- **Build**: `npm install` (Automated `postinstall` will handle Prisma)
- **Start**: `npm start`
- **Environment Variables**:
    - `DATABASE_URL`: Your PostgreSQL string
    - `FRONTEND_URL`: Your production frontend domain
    - `JWT_SECRET`: A secure random string
    - `GROQ_API_KEY`: Your Groq API key

### Frontend (Netlify / Vercel)
- **Repo Base**: `frontend/`
- **Build**: `npm run build`
- **Output**: `dist/`
- **Environment Variables**:
    - `VITE_API_URL`: Your production backend domain

---

## 🛡️ Security & Features
- **Production-Ready**: Uses Helmet.js for secure headers and Morgan for logging.
- **ORM**: Prisma for type-safe database queries.
- **AI**: Integrates Groq for high-speed voice-to-structured-data extraction.
- **Auth**: JWT-based authentication with role-based access control.
