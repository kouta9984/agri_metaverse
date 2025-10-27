// グローバル変数
var agoraClient = null;
var localTrack = null;
var isVoiceEnabled = false; // 現在の状態

var options = {
    appid: "a7801a2eaab24a7e9c1a0a0ff2593682",
    channel: "testserver", // テスト用チャンネル
    uid: null,
    token: null
};

// Agora接続
function joinAgoraChannel() {
    console.log("joinAgoraChannel called testserver");

    if (!agoraClient) {
        agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    }

    return agoraClient.join(options.appid, options.channel, options.token || null).then(uid => {
        options.uid = uid;
        console.log("Joined channel, UID:", uid);

        return AgoraRTC.createMicrophoneAudioTrack();
    });
}

// ==========================
// 💡 表示エリアを作成（HTMLに自動追加）
// ==========================
(function setupVoiceLabel() {
    if (!document.getElementById("voice-status")) {
        const label = document.createElement("div");
        label.id = "voice-status";
        label.textContent = "OFF";
        label.style.position = "absolute";
        label.style.top = "10px";
        label.style.left = "10px";
        label.style.background = "rgba(150, 0, 0, 0.7)";
        label.style.color = "white";
        label.style.padding = "8px 16px";
        label.style.borderRadius = "20px";
        label.style.fontSize = "16px";
        label.style.fontFamily = "sans-serif";
        label.style.transition = "background 0.3s ease";
        label.style.zIndex = "9999";
        document.body.appendChild(label);
    }

    // 光るアニメーション（CSS追加）
    const style = document.createElement("style");
    style.textContent = `
        @keyframes glowOn {
            0% { box-shadow: 0 0 0px rgba(0,255,0,0); }
            30% { box-shadow: 0 0 20px rgba(0,255,0,0.8); }
            100% { box-shadow: 0 0 0px rgba(0,255,0,0); }
        }
    `;
    document.head.appendChild(style);
})();

window.toggleAgoraVoice = async function() {
    const label = document.getElementById("voice-status");

    if (!isVoiceEnabled) {
        // オンにする
        if (!localTrack) {
            try {
                const track = await joinAgoraChannel();
                localTrack = track;
                await agoraClient.publish(localTrack);
                console.log("Published local audio track");
            } catch (err) {
                console.error("Failed to join or publish:", err);
                return;
            }

            agoraClient.on("user-published", async (user, mediaType) => {
                await agoraClient.subscribe(user, mediaType);
                console.log("Subscribed to user:", user.uid, "mediaType:", mediaType);
                if (mediaType === "audio") user.audioTrack.play();
            });
        } else {
            localTrack.setEnabled(true);
            console.log("Voice ON");
        }

        // 🔸 表示をONに変更
        label.textContent = "ON";
        label.style.background = "rgba(0, 150, 0, 0.7)";
        label.style.animation = "glowOn 1s ease";

        isVoiceEnabled = true;
    } else {
        // オフにする
        if (localTrack) {
            localTrack.setEnabled(false);
            console.log("Voice OFF");
        }

        // 🔸 表示をOFFに変更
        label.textContent = "OFF";
        label.style.background = "rgba(150, 0, 0, 0.7)";
        label.style.animation = "none";

        isVoiceEnabled = false;
    }
};
