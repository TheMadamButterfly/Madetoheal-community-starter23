# Made to Heal — Community Starter (MVP)

This is a **starter** codebase for the *Made to Heal* community social site (MVP).
Designed to be deployed on **Render**.

Features:
- User auth (register/login) using JWT
- User profiles (name, avatar URL, bio)
- Posts (text + optional image URL)
- Likes & comments
- Simple feed (recent posts)
- Basic report endpoint

Stack:
- Backend: Node.js + Express
- Database: PostgreSQL (schema included)
- Frontend: React (Vite)
- Deployment: Render (render.yaml included)

## Quick local run
1. Install deps:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
