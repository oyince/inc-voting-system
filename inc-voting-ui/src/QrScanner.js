// src/QrScanner.js

import React, { useEffect } from "react";
import cameraManager from "./CameraManager";

const QrScanner = ({ onScan, onClose }) => {
  useEffect(() => {
    cameraManager.start("qr-reader", onScan);

    return () => {
      cameraManager.stop();
    };
  }, [onScan]); // ✅ FIXED: include onScan

  const handleClose = async () => {
    await cameraManager.stop();
    onClose();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >
      {/* Scanner frame */}
      <div
        style={{
          padding: "12px",
          border: "3px solid #16A34A",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          background: "#fff",
        }}
      >
        <div
          id="qr-reader"
          style={{
            width: "320px",
            maxWidth: "80vw",
          }}
        />
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="verify-button"
        style={{
          backgroundColor: "#ef4444",
          paddingLeft: "24px",
          paddingRight: "24px",
        }}
      >
        CLOSE CAMERA
      </button>
    </div>
  );
};

export default QrScanner;
