# pwam-shopping-web

React web frontend for the **Global Shopping List** — a PWAM demo showing how one backend serves multiple platforms simultaneously.

Built with **React** and **Vite**.

---

## Prerequisites

- Node.js ≥ 18
- npm
- The backend running at `http://localhost:3000` (see [pwam-shopping-backend](https://github.com/eben4ya/pwam-shopping-backend))

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template
cp .env.example .env

# 3. Start the dev server
npm run dev
```

Opens at `http://localhost:5173`.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Backend API base URL |

> **Never commit `.env` to version control.** Use `.env.example` as the template.
>
> All Vite env vars must be prefixed with `VITE_` to be accessible in the browser.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production (output → `dist/`) |
| `npm run preview` | Preview the production build locally |

---

## Features

| Action | HTTP call |
|---|---|
| View items (auto-refresh every 3 s) | `GET /items` |
| Add item | `POST /items` |
| Edit item name (inline) | `PUT /items/:id` |
| Check / uncheck item | `PUT /items/:id` |
| Delete item (confirmation modal) | `DELETE /items/:id` |

---

## Project Structure

```
pwam-shopping-web/
├── .env.example      ← copy to .env
├── .gitignore
├── index.html        ← entry HTML (includes global CSS reset)
├── vite.config.js
└── src/
    ├── main.jsx      ← React root
    └── App.jsx       ← full app (components + styles)
```

---

## Ideas for Improvement

- Split `App.jsx` into smaller components (`ItemRow`, `AddForm`, etc.)
- Add loading and error states
- Add item categories or tags
- Connect to a real authentication system
- Deploy to Vercel or Netlify
