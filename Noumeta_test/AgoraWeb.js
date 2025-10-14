// グローバル変数
var agoraClient = null;
var localTrack = null;

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

    agoraClient.join(options.appid, options.channel, options.token || null).then(uid => {
        options.uid = uid;
        console.log("Joined channel, UID:", uid);

        AgoraRTC.createMicrophoneAudioTrack().then(track => {
            localTrack = track;
            agoraClient.publish(track);
            console.log("Published local audio track");
        });

        agoraClient.on("user-published", async (user, mediaType) => {
            await agoraClient.subscribe(user, mediaType);
            console.log("Subscribed to user:", user.uid, "mediaType:", mediaType);
            if (mediaType === "audio") user.audioTrack.play();
        });
    }).catch(err => {
        console.error("Failed to join channel:", err);
    });
}
