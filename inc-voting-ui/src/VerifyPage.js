// src/VerifyPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import QrScanner from "./QrScanner";
import cameraManager from "./CameraManager";

// Use environment variable for API URL
const API_URL = process.env.REACT_APP_API_URL;

function VerifyPage() {
  const [token, setToken] = useState("");
  const [delegate, setDelegate] = useState(null);
  const [message, setMessage] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const navigate = useNavigate();

  // 🔒 Always kill camera when leaving this page
  useEffect(() => {
    return () => {
      cameraManager.stop();
    };
  }, []);

  const verifyDelegate = async () => {
    setMessage("");
    setDelegate(null);

    if (!token.trim()) {
      setMessage("Please enter or scan delegate ID.");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/verify-delegate`, {
        token: token.trim(),
      });

      setDelegate(res.data);

      if (res.data.has_voted) {
        setMessage("This delegate has ALREADY VOTED.");
      } else {
        setMessage(`Delegate verified: ${res.data.name}`);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "Error verifying delegate");
    }
  };

  const handleScan = (decodedText) => {
    console.log("✅ Scan received:", decodedText);

    // Close scanner UI (camera already stopped by CameraManager)
    setShowScanner(false);

    setToken(decodedText);
    setMessage(`Scanned token: ${decodedText}`);
  };

  const openScanner = async () => {
    // Clear previous state
    setMessage("");
    setDelegate(null);

    // 🔒 HARD GUARANTEE: kill any camera before opening
    await cameraManager.stop();

    setShowScanner(true);
  };

  const closeScanner = async () => {
    await cameraManager.stop();
    setShowScanner(false);
  };

  const goToVote = async () => {
    if (!delegate || delegate.has_voted) return;

    // 🔒 Kill camera before navigation
    await cameraManager.stop();

    navigate("/vote", {
      state: {
        token,
        delegateName: delegate.name,
      },
    });
  };

  return (
    <div className="verify-page">
      <Navbar />

      <div className="verify-main">
        <div className="verify-container">
          <h1 className="verify-title">Delegate Verification</h1>

          {showScanner && (
            <div style={{ marginBottom: "24px" }}>
              <QrScanner onScan={handleScan} onClose={closeScanner} />
            </div>
          )}

          {!showScanner && (
            <div style={{ marginBottom: "32px" }}>
              <p className="verify-text">
                Scan or enter Delegate ID / QR code:
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="INC-1-XXXXXXXXXXXX"
                  className="verify-input"
                />

                <button onClick={verifyDelegate} className="verify-button">
                  VERIFY
                </button>

                <button
                  onClick={openScanner}
                  className="verify-button"
                  style={{ backgroundColor: "#16A34A" }}
                >
                  SCAN QR WITH CAMERA
                </button>
              </div>
            </div>
          )}

          {delegate && (
            <div className="verify-box">
              <div>Delegate: {delegate.name}</div>
              <div style={{ marginTop: "8px" }}>
                Status:{" "}
                {delegate.has_voted ? "ALREADY VOTED" : "Eligible to vote"}
              </div>
            </div>
          )}

          <button
            onClick={goToVote}
            disabled={!delegate || delegate.has_voted}
            className={
              "verify-proceed" +
              (!delegate || delegate.has_voted ? " disabled" : "")
            }
          >
            PROCEED TO VOTE
          </button>

          {message && <div className="verify-message">{message}</div>}
        </div>
      </div>
    </div>
  );
}

export default VerifyPage;
