// src/CameraManager.js

import { Html5Qrcode } from "html5-qrcode";

class CameraManager {
  constructor() {
    this.html5QrCode = null;
    this.isRunning = false;
    this.currentElementId = null;
  }

  async start(elementId, onSuccess) {
    // HARD STOP anything that might already exist
    await this.stop();

    if (this.isRunning) return;

    this.html5QrCode = new Html5Qrcode(elementId);
    this.currentElementId = elementId;

    try {
      this.isRunning = true;

      await this.html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          // One-shot scan
          if (!this.isRunning) return;

          this.isRunning = false;

          await this.stop();

          onSuccess(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error("Camera start error:", err);
      this.isRunning = false;
    }
  }

  async stop() {
    try {
      if (this.html5QrCode) {
        if (this.html5QrCode.isScanning) {
          await this.html5QrCode.stop();
        }
        await this.html5QrCode.clear();
      }
    } catch (err) {
      console.log("Camera stop (safe to ignore):", err);
    }

    this.html5QrCode = null;
    this.isRunning = false;
    this.currentElementId = null;

    // HARD KILL any orphaned streams
    const videos = document.getElementsByTagName("video");
    for (let video of videos) {
      if (video.srcObject) {
        video.srcObject.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      }
    }
  }
}

// 🔒 EXPORT A SINGLE INSTANCE FOR THE ENTIRE APP
const cameraManager = new CameraManager();
export default cameraManager;
