# Connect Four Phase 1 — Vercel deployment

This bundle is prepared for Vercel's current Node.js server deployment model.

## No local Node.js required

The easiest path is to upload these files to a GitHub repository from the browser, then import that repository into Vercel.

### 1. Create a GitHub repository

On GitHub, create a new repository, then upload the contents of this folder (not the ZIP file itself) using **Add file → Upload files**.

### 2. Import into Vercel

In Vercel, choose **New Project**, select the GitHub repository, and deploy it. No build command is required.

The project contains `server.ts` at the root, which Vercel's current Node.js server deployment detects automatically.

### 3. Test multiplayer

After deployment, Vercel gives you a public `https://...vercel.app` URL.

Open that URL in two browser windows/tabs:
- Window 1: Create Room
- Window 2: enter the room code and Join
- Play alternating turns.

## Important

This Phase 1 stores rooms in server memory. It is intended for testing/demo use. A production version should move room state to a shared durable store and use a persistent real-time transport such as WebSockets/Socket.IO.
