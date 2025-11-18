mergeInto(LibraryManager.library, {
  // ---- QRコード用のカメラ起動 ----
  StartQRCodeScan: function() {
    console.log("StartQRCodeScan called!");

    if (typeof Html5Qrcode === "undefined") {
      console.warn("html5-qrcode not loaded");
      return;
    }

    // スキャン領域を作成（画面に DOM を追加）
    let qrRegionId = "reader";
    let oldEl = document.getElementById(qrRegionId);
    if (oldEl) oldEl.remove();

    let qrEl = document.createElement("div");
    qrEl.id = qrRegionId;
    qrEl.style.position = "absolute";
    qrEl.style.top = "0";
    qrEl.style.left = "0";
    qrEl.style.width = "100%";
    qrEl.style.height = "100%";
    qrEl.style.zIndex = "1000";
    qrEl.style.display = "block";
    document.body.appendChild(qrEl);

    // html5-qrcode インスタンス作成
    window.html5QrCode = new Html5Qrcode(qrRegionId);
    const qrConfig = { fps: 10, qrbox: 250 };

    window.html5QrCode.start(
      { facingMode: "environment" },
      qrConfig,
      (decodedText, decodedResult) => {
        console.log("QRコード読み取り:", decodedText);
        if (window.unityInstance) {
          //UnityのOnQRCodeScannedに送る
          window.unityInstance.SendMessage("Canvas", "OnQRCodeScanned", decodedText);
        }
        // 読み取り完了したら停止してDOM削除
        window.html5QrCode.stop().then(() => qrEl.remove());
      },
      (errorMessage) => {
        // 読み取り失敗は無視
      }
    ).catch(err => console.error(err));
  },

  // ---- WebRTCの処理 ----
  initWebRTC: function () {
    console.log("initWebRTC called!");
  }
});
