let pc;
let socket;
let localStream;
let audio;

function initWebRTC(roomId) {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
      localStream = stream;

      audio = new Audio();
      audio.srcObject = stream;
      audio.play();

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
      socket = new WebSocket("ws://localhost:55794");

      socket.onopen = () => {
        console.log("WebSocket connected");
        createOffer();
      };

      socket.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.send(JSON.stringify({ type: "answer", answer: answer, roomId: roomId }));
        } else if (msg.type === "answer") {
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
