# Connect Four — Vercel Deployment Package

This package is prepared for Vercel's current zero-configuration Node.js server deployment.
Vercel detects a `server.ts` at the project root and runs it as the Node.js application.

## Important

- Keep `server.ts` in the repository root.
- Keep the `public/` folder beside `server.ts`.
- Do **not** add a separate root `index.html`; the Node server serves `public/index.html` at `/`.
- No Build Command is required.
- No Output Directory is required.
- Use Node.js 24.x.

## Deploy

1. Create/open the GitHub repository for this project.
2. Upload **the contents of this ZIP**, so `server.ts` and `package.json` are at the repository root.
3. In Vercel, import that repository.
4. Set the Root Directory to the folder that directly contains `server.ts` (normally `.`).
5. Leave Framework Preset as the default/Other if Vercel asks.
6. Leave Build Command and Output Directory empty/default.
7. Deploy.
8. Open the production domain directly and test it in two browser tabs.

## What should load

Opening `/` should show the Connect Four lobby.
The server also handles `/events`, `/room/create`, `/room/join`, `/game/move`, and `/room/leave`.

## Current architecture

The game uses a Node HTTP server and Server-Sent Events (SSE) for real-time updates. Room state is held in server memory, so this is a Phase 1 deployment and is intended for testing/small use. A later production version can move room state to shared storage and use WebSockets.
