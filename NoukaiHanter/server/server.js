const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// 静的ファイル（必要なら公開）
app.use(express.static(path.join(__dirname, "public"))); // ← publicフォルダなどを利用する場合

// WebSocket 接続処理
wss.on("connection", (ws) => {
  console.log("🟢 新しいクライアントが接続しました");

  ws.on("message", (message) => {
    // 他の全クライアントにブロードキャスト
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

// サーバー起動
server.listen(PORT, () => {
  console.log(`✅ サーバー起動中: http://localhost:${PORT}`);
});
