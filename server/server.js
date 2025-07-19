const WebSocket = require("ws");

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    // 受け取ったメッセージを他の全クライアントに送信
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  console.log("🟢 新しいクライアントが接続しました");
});

console.log(`✅ WebSocketサーバー起動中 : ws://localhost:${port}`);
