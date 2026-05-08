# pwam-shopping-web

React + Vite web frontend for the PWAM Global Shopping List demo.

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Requires the backend running at `http://localhost:3000`.

## Features

- Add items via the input form (POST /items)
- Check/uncheck items (PUT /items/:id)
- Delete items with ✕ button (DELETE /items/:id)
- Auto-refreshes every 3 seconds to stay in sync with other clients
