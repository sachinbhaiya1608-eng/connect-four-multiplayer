# Connect Four — Phase 1

Zero-dependency local multiplayer implementation. It uses Node's built-in HTTP server and Server-Sent Events (SSE) for real-time server-to-browser updates, with HTTP POST requests for player actions.

## Run

```bash
node server.js
```

Open `http://localhost:3000` in two browser tabs (or one normal and one incognito). Create a room in the first, then enter its 5-character code in the second.

## Included
- 7×6 board
- Create/join room with unique 5-character code
- Real-time synchronized turns via SSE
- Server-authoritative move validation
- Automatic token drop
- Horizontal, vertical, and diagonal win detection
- Draw detection
- Winning-cell highlighting
- Basic disconnect handling
- Responsive UI
