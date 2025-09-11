let pc;
let socket;
let localStream;

function initWebRTC(roomId) {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
      localStream = stream;

      pc = new RTCPeerConnection();

      // マイクストリームを追加
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      console.log("Local audio tracks added.");

      // 相手から来る音声を再生
      pc.ontrack = (event) => {
        console.log("Received remote track:", event.streams[0]);
        const remoteAudio = new Audio();
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.play().catch(e => console.warn("Audio play failed:", e));
      };

      // ICE Candidateが見つかったら送信
      pc.onicecandidate = (event) => {
        console.log("ICE candidate event:", event.candidate);
        if (event.candidate) {
          if (socket.readyState === WebSocket.OPEN) {
            try {
              console.log("Sending ICE candidate:", event.candidate);
              socket.send(JSON.stringify({
                type: "candidate",
                candidate: event.candidate,
                roomId: roomId
              }));
            } catch (e) {
              console.error("WebSocket send error:", e);
            }
          } else {
            console.warn("WebSocket is not open. Cannot send ICE candidate.");
          }
        }
      };

      // WebSocketで接続
      socket = new WebSocket("wss://agri-metaverse.onrender.com");

      socket.onopen = () => {
        console.log("WebSocket connected");

        // 簡易的な Offer/Answer 決定ロジック（適宜調整可能）
        const amOfferer = (roomId.length % 2 === 0);

        if (amOfferer) {
          createOffer();
        }
      };

      socket.onmessage = async (event) => {
        let data = event.data;

        // Blob 対応
        if (data instanceof Blob) {
          data = await data.text();
        }

        console.log("WebSocket message received:", data);

        const msg = JSON.parse(data);

        if (msg.type === "offer") {
          if (pc.signalingState !== "stable") {
            console.warn("Ignoring offer because signalingState is not 'stable'");
            return;
          }

          console.log("Received offer, setting remote description.");
          await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log("Sending answer.");
          if (socket.readyState === WebSocket.OPEN) {
            try {
              socket.send(JSON.stringify({ type: "answer", answer: answer, roomId: roomId }));
            } catch (e) {
              console.error("WebSocket send error:", e);
            }
          } else {
            console.warn("WebSocket is not open. Cannot send answer.");
          }

        } else if (msg.type === "answer") {
          if (pc.signalingState !== "have-local-offer") {
            console.warn("Ignoring answer because signalingState is not 'have-local-offer'");
            return;
          }

          console.log("Received answer, setting remote description.");
          await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));

        } else if (msg.type === "candidate") {
          console.log("Received ICE candidate.");
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }
      };

      async function createOffer() {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (socket.readyState === WebSocket.OPEN) {
          try {
            console.log("Sending offer.");
            socket.send(JSON.stringify({ type: "offer", offer: offer, roomId: roomId }));
          } catch (e) {
            console.error("WebSocket send error:", e);
          }
        } else {
          console.warn("WebSocket is not open. Cannot send offer.");
        }
      }

    }).catch(err => {
      console.error("Error accessing microphone", err);
    });
}
