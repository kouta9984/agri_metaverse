// グローバル変数
var agoraClient = null;
var localTrack = null;

var options = {
    appid: "aebc8c485f7d4777b8e4bcb6760da56a",
    channel: "test",
    uid: null,
    token: "007eJxTYFh1N+b+sTcLc+O5lj8SZt27WZFx5YR99dEzkyfk5Fx0Y89XYEhMTUq2SDaxME0zTzExNzdPskg1SUpOMjM3M0hJNDVLdFd7l9EQyMjwdQcHKyMDBIL4LAwlqcUlDAwAm1IgaQ=="
};

function joinAgoraChannel() {
    console.log("joinAgoraChannel called");

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
