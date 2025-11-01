// ==========================
// 💡 グローバル変数
// ==========================
var agoraClient = null;
var localTrack = null;
var isVoiceEnabled = false;

var options = {
    appid: "a7801a2eaab24a7e9c1a0a0ff2593682",
    channel: "testserver",
    uid: null,
    token: null
};

// ==========================
// 💡 Agoraクライアント初期化（user-publishedを先に登録）
// ==========================
function initAgoraClient() {
    if (!agoraClient) {
        agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

        // 他ユーザーの音声を常に受信
        agoraClient.on("user-published", async (user, mediaType) => {
            await agoraClient.subscribe(user, mediaType);
            console.log("Subscribed to user:", user.uid, "mediaType:", mediaType);
            if (mediaType === "audio") user.audioTrack.play();
        });
    }
}

// ==========================
// 💡 Unityから呼ばれる関数（ON/OFF切り替え）
// ==========================
window.toggleAgoraVoice = async function() {
    const label = document.getElementById("voice-status");

    if (!isVoiceEnabled) {
        // オンにする
        if (!localTrack) {
            try {
                await joinAgoraChannel();
            } catch (err) {
                console.error("Failed to join or publish:", err);
                return;
            }
        } else {
            localTrack.setEnabled(true);
            console.log("Voice ON");
        }

        // 🔸 表示ON
        if (label) {
            label.textContent = "ON";
            label.style.background = "rgba(0, 150, 0, 0.7)";
            label.style.animation = "glowOn 1s ease";
        }

        isVoiceEnabled = true;
    } else {
        // オフにする
        if (localTrack) {
            localTrack.setEnabled(false);
            console.log("Voice OFF");
        }

        // 🔸 表示OFF
        if (label) {
            label.textContent = "OFF";
            label.style.background = "rgba(150, 0, 0, 0.7)";
            label.style.animation = "none";
        }

        isVoiceEnabled = false;
    }
};

// ==========================
// 💡 Agoraに参加してマイクをpublish
// ==========================
async function joinAgoraChannel() {
    initAgoraClient();

    const uid = await agoraClient.join(options.appid, options.channel, options.token || null);
    options.uid = uid;
    console.log("Joined channel, UID:", uid);

    if (!localTrack) {
        localTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await agoraClient.publish(localTrack);
        console.log("Published local audio track");
    }

    return localTrack;
}

// ==========================
// 💡 表示ラベルを作成（HTMLに自動追加）
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
