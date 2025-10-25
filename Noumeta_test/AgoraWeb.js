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

// Unity から呼ばれるトグル関数
window.toggleAgoraVoice = async function() {
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
        isVoiceEnabled = true;
    } else {
        // オフにする
        if (localTrack) {
            localTrack.setEnabled(false);
            console.log("Voice OFF");
        }
        isVoiceEnabled = false;
    }
};
