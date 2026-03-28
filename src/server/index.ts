import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { handleSession } from './sessionHandler.js';

const app = express();
const port = Number(process.env.SERVER_PORT) || 3001;

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const server = createServer(app);

// WebSocket server on the same port
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('[Server] New client connected');

  // Client must send an init message with deviceId
  ws.once('message', (raw) => {
    const msg = JSON.parse(raw.toString());

    if (msg.type === 'init' && msg.deviceId) {
      handleSession(ws, msg.deviceId);
    } else {
      ws.send(JSON.stringify({ event: 'onError', data: { message: 'First message must be { type: "init", deviceId: "..." }' } }));
      ws.close();
    }
  });
});

server.listen(port, () => {
  console.log(`[iDIY Server] Running on http://localhost:${port}`);
  console.log(`[iDIY Server] WebSocket ready on ws://localhost:${port}`);
});
