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

      // 相手から来る音声を再生
      pc.ontrack = (event) => {
        const remoteAudio = new Audio();
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.play();
      };

      // ICE Candidateが見つかったら送信
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.send(JSON.stringify({
            type: "candidate",
            candidate: event.candidate,
            roomId: roomId
          }));
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

        const msg = JSON.parse(data);

        if (msg.type === "offer") {
          if (pc.signalingState !== "stable") {
            console.warn("Ignoring offer because signalingState is not 'stable'");
            return;
          }

          await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.send(JSON.stringify({ type: "answer", answer: answer, roomId: roomId }));

        } else if (msg.type === "answer") {
          if (pc.signalingState !== "have-local-offer") {
            console.warn("Ignoring answer because signalingState is not 'have-local-offer'");
            return;
          }

          await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));

        } else if (msg.type === "candidate") {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }
      };

      async function createOffer() {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.send(JSON.stringify({ type: "offer", offer: offer, roomId: roomId }));
      }

    }).catch(err => {
      console.error("Error accessing microphone", err);
    });
}