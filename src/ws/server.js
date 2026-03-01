import { WebSocket, WebSocketServer } from "ws"
import { wsArcjet } from '../arcjet.js';

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        // server,
        path: '/ws',
        maxPayload: 1024 * 1024,
        noServer: true,
    });

    // Protect the WebSocket upgrade path before connection is established
    server.on('upgrade', async (req, socket, head) => {
        // Only protect WebSocket upgrades to /ws
        const { pathname } = new URL(req.url, `http://${req.headers.host}`);
        if (pathname !== '/ws') {
            socket.destroy();
            return;
        }

        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);

                if (decision.isDenied()) {
                    const status = decision.reason.isRateLimit()
                        ? '429 Too Many Requests'
                        : '403 Forbidden';
                    socket.write(
                        `HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`,
                    );
                    socket.destroy();
                    return;
                }
            } catch (e) {
                console.error('WS upgrade protection error', e);
                socket.write(
                    'HTTP/1.1 500 Internal Server Error\r\nConnection: close\r\n\r\n',
                );
                socket.destroy();
                return;
            }
        }

        // Upgrade passed protection; complete the handshake
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });

    wss.on('connection', (socket) => {
        socket.isAlive = true;
        socket.on('pong', () => {
            socket.isAlive = true;
        });

        sendJson(socket, { type: 'welcome' });
        socket.on('error', console.error);
    });

    const interval = setInterval(() => {
        for (const ws of wss.clients) {
            if (ws.isAlive === false) {
                ws.terminate();
                continue;
            }
            ws.isAlive = false;
            ws.ping();
        }
    }, 30000);

    wss.on('close', () => clearInterval(interval));

    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'match_created', data: match });
    }

    return { broadcastMatchCreated };
}