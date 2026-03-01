import express from 'express';
import http from 'http';
import { matchRouter } from './routes/matches.js';
import { attachWebSocketServer } from './ws/server.js';
import { securityMiddleware } from './arcjet.js';

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(securityMiddleware());
app.use('/matches', matchRouter);

// Root GET route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Sportz API!' });
});

// Initialize websocket
const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

// Start HTTP server (not app.listen) so the same server instance handles
// both Express requests and WebSocket upgrades.
server.listen(PORT, () => {
    const baseUrl =
        HOST === '0.0.0.0'
            ? `http://localhost:${PORT}`
            : `http://${HOST}:${PORT}`;
    console.log(`Server is running on ${baseUrl}`);
    console.log(
        `WebSocket Server is running on ${baseUrl.replace('http', 'ws')}/ws`,
    );
});
