const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = process.env.WS_PORT || 8080;
const HOST = process.env.WS_HOST || "0.0.0.0";

// rooms: { [roomCode]: { members: Map<userId, { ws, name, image, isHost, progress }> } }
const rooms = new Map();

// HTTP server — needed for Render's health checks
const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", rooms: rooms.size }));
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

// WebSocket server attached to the HTTP server (same port)
const wss = new WebSocketServer({ server });

function broadcastToRoom(roomCode, data, excludeUserId = null) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const message = JSON.stringify(data);
  room.members.forEach((member, userId) => {
    if (userId !== excludeUserId && member.ws.readyState === 1) {
      member.ws.send(message);
    }
  });
}

function getRoomMembersList(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return [];
  return Array.from(room.members.entries()).map(([id, m]) => ({
    id,
    name: m.name,
    image: m.image,
    isHost: m.isHost,
    progress: m.progress || null,
  }));
}

wss.on("connection", (ws) => {
  let currentUserId = null;
  let currentRoomCode = null;

  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    const { type, userId, roomCode } = data;

    if (type === "JOIN_ROOM") {
      currentUserId = userId;
      currentRoomCode = roomCode;

      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, { members: new Map() });
      }

      const room = rooms.get(roomCode);
      const isHost = room.members.size === 0; // first joiner is host

      room.members.set(userId, {
        ws,
        name: data.userData?.name || "Anonymous",
        image: data.userData?.image || null,
        isHost,
        progress: null,
      });

      console.log(`[JOIN] ${data.userData?.name} joined room ${roomCode} (host: ${isHost})`);

      // Broadcast updated members list to everyone in room
      const members = getRoomMembersList(roomCode);
      room.members.forEach((member) => {
        if (member.ws.readyState === 1) {
          member.ws.send(JSON.stringify({ type: "ROOM_MEMBERS", members }));
        }
      });
    }

    else if (type === "SEND_MESSAGE") {
      const room = rooms.get(roomCode);
      if (!room) return;
      const sender = room.members.get(userId);
      const message = {
        type: "MESSAGE",
        message: data.message,
        userData: { name: sender?.name, image: sender?.image },
      };
      // Broadcast to everyone including sender
      room.members.forEach((member) => {
        if (member.ws.readyState === 1) {
          member.ws.send(JSON.stringify(message));
        }
      });
      console.log(`[CHAT] ${sender?.name} in ${roomCode}: ${data.message}`);
    }

    else if (type === "START_RACE") {
      console.log(`[RACE] Starting race in room ${roomCode}`);
      const room = rooms.get(roomCode);
      if (!room) return;
      // Reset all progress
      room.members.forEach((member) => { member.progress = null; });
      const payload = JSON.stringify({ type: "RACE_START", text: data.text });
      room.members.forEach((member) => {
        if (member.ws.readyState === 1) member.ws.send(payload);
      });
    }

    else if (type === "UPDATE_PROGRESS") {
      const room = rooms.get(roomCode);
      if (!room) return;
      const member = room.members.get(userId);
      if (member) member.progress = data.progress;

      broadcastToRoom(roomCode, {
        type: "PROGRESS_UPDATE",
        userId,
        progress: data.progress,
      });
    }
  });

  ws.on("close", () => {
    if (!currentRoomCode || !currentUserId) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const leaving = room.members.get(currentUserId);
    room.members.delete(currentUserId);
    console.log(`[LEAVE] ${leaving?.name} left room ${currentRoomCode}`);

    if (room.members.size === 0) {
      rooms.delete(currentRoomCode);
      console.log(`[ROOM] Room ${currentRoomCode} deleted (empty)`);
    } else {
      // If host left, promote next member
      if (leaving?.isHost) {
        const [newHostId, newHost] = room.members.entries().next().value;
        newHost.isHost = true;
        console.log(`[HOST] ${newHost.name} is new host of ${currentRoomCode}`);
      }
      // Broadcast updated members
      const members = getRoomMembersList(currentRoomCode);
      broadcastToRoom(currentRoomCode, { type: "ROOM_MEMBERS", members });
    }
  });

  ws.on("error", (err) => console.error("[WS ERROR]", err.message));
});

server.listen(PORT, HOST, () => {
  console.log(`✅ TypeFast WebSocket server running on ws://${HOST}:${PORT}`);
  console.log(`✅ HTTP health check available at http://${HOST}:${PORT}/health`);
});
