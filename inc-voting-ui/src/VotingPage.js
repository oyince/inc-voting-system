// src/VotingPage.js
// Fixed version with better candidate loading
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

// Use environment variable for API URL
const API_URL = process.env.REACT_APP_API_URL;

function VotingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tokenFromQuery = searchParams.get("token");

  const { token: tokenFromState, delegateName } = location.state || {};
  const token = tokenFromState || tokenFromQuery;
  
  const [positions, setPositions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showCountdown, setShowCountdown] = useState(false);

  // Redirect to verify page if no token
  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    // Fetch positions with candidates
    console.log('Fetching positions from:', `${API_URL}/positions`);
    axios.get(`${API_URL}/positions`)
      .then(res => {
        console.log('Positions response:', res.data);
        
        if (!res.data || res.data.length === 0) {
          setError("No positions available");
          setLoading(false);
          return;
        }
        
        // Ensure each position has a candidates array
        const positionsWithCandidates = res.data.map(pos => ({
          ...pos,
          candidates: Array.isArray(pos.candidates) ? pos.candidates : []
        }));
        
        console.log('Positions with candidates:', positionsWithCandidates);
        setPositions(positionsWithCandidates);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading positions:", err);
        setError(`Failed to load positions: ${err.response?.data?.error || err.message}`);
        setLoading(false);
      });
  }, [token, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (showCountdown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown && countdown === 0) {
      navigate("/", { replace: true, state: null });
    }
  }, [showCountdown, countdown, navigate]);

  // Prevent back navigation after submission
  useEffect(() => {
    if (submitted) {
      const handlePopState = (e) => {
        e.preventDefault();
        navigate("/", { replace: true });
      };
      
      window.addEventListener('popstate', handlePopState);
      window.history.pushState(null, '', window.location.pathname);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [submitted, navigate]);

  if (!token) {
    return null;
  }

  if (loading) {
    return (
      <div className="vote-page">
        <Navbar />
        <div className="vote-main">
          <div className="vote-container">
            <h3 className="vote-title">Loading positions...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vote-page">
        <Navbar />
        <div className="vote-main">
          <div className="vote-container">
            <h3 className="vote-title" style={{ color: "#ef4444" }}>{error}</h3>
            <button 
              onClick={() => navigate("/")} 
              className="verify-button"
              style={{ marginTop: "24px" }}
            >
              BACK TO VERIFICATION
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="vote-page">
        <Navbar />
        <div className="vote-main">
          <div className="vote-container">
            <h3 className="vote-title">No positions available</h3>
            <button 
              onClick={() => navigate("/")} 
              className="verify-button"
              style={{ marginTop: "24px" }}
            >
              BACK TO VERIFICATION
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success screen with countdown
  if (submitted) {
    return (
      <div className="vote-page">
        <Navbar />
        <div className="vote-main">
          <div className="vote-container" style={{ maxWidth: "600px" }}>
            <div style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#16a34a",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px"
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 style={{ fontSize: "32px", marginBottom: "16px" }}>Vote Submitted!</h2>
            <p style={{ fontSize: "18px", color: "#9ca3af", marginBottom: "24px" }}>
              Thank you for participating in the INC elections.
            </p>
            <div className="verify-box" style={{ marginBottom: "16px" }}>
              <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "4px" }}>Delegate</p>
              <p style={{ fontSize: "18px" }}>{delegateName}</p>
            </div>
            <div className="verify-box" style={{ marginBottom: "16px" }}>
              <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "4px" }}>Positions Voted</p>
              <p style={{ fontSize: "24px", fontWeight: "bold" }}>
                {Object.keys(votes).length} / {positions.length}
              </p>
            </div>
            
            {showCountdown && (
              <div style={{
                backgroundColor: "#3b82f6",
                padding: "20px",
                borderRadius: "8px",
                marginTop: "24px",
                textAlign: "center"
              }}>
                <p style={{ fontSize: "16px", marginBottom: "8px" }}>
                  Next delegate starts in
                </p>
                <p style={{ fontSize: "48px", fontWeight: "bold", margin: "0" }}>
                  {countdown}
                </p>
                <p style={{ fontSize: "14px", marginTop: "8px", opacity: 0.8 }}>
                  seconds
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentPosition = positions[currentPage];
  
  if (!currentPosition) {
    return (
      <div className="vote-page">
        <Navbar />
        <div className="vote-main">
          <div className="vote-container">
            <h3 className="vote-title">Loading position data...</h3>
          </div>
        </div>
      </div>
    );
  }

  // Ensure candidates array exists
  const candidates = Array.isArray(currentPosition.candidates) ? currentPosition.candidates : [];
  
  const progress = ((currentPage + 1) / positions.length) * 100;
  const isLastPage = currentPage === positions.length - 1;
  const canProceed = isLastPage ? true : votes[currentPosition.id] !== undefined;

  const handleVote = (candidateId) => {
    setVotes(prev => ({
      ...prev,
      [currentPosition.id]: candidateId
    }));
  };

  const handleSkip = () => {
    setVotes(prev => {
      const newVotes = { ...prev };
      delete newVotes[currentPosition.id];
      return newVotes;
    });
    
    if (isLastPage) {
      setShowConfirmModal(true);
    } else {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setError("");
    }
  };

  const handleNext = () => {
    if (isLastPage) {
      setShowConfirmModal(true);
    } else if (canProceed) {
      setCurrentPage(currentPage + 1);
      setError("");
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setError("");

    try {
      console.log('Submitting votes:', votes);
      const response = await axios.post(`${API_URL}/submit-votes`, {
        token,
        votes
      });

      console.log('Submit response:', response.data);
      setSubmitted(true);
      setShowCountdown(true);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.error || "Failed to submit votes. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="vote-page">
      <Navbar />
      <div className="vote-main">
        <div className="vote-container">
          {/* Progress bar */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{
              height: "8px",
              backgroundColor: "#374151",
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                height: "100%",
                width: `${progress}%`,
                backgroundColor: "#3b82f6",
                transition: "width 0.3s"
              }} />
            </div>
            <p style={{
              color: "#9ca3af",
              fontSize: "14px",
              marginTop: "8px",
              textAlign: "center"
            }}>
              Position {currentPage + 1} of {positions.length}
            </p>
          </div>

          {/* Position header */}
          <div style={{
            backgroundColor: "#1f2937",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "24px",
            textAlign: "center"
          }}>
            <div style={{
              display: "inline-block",
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "4px 16px",
              borderRadius: "16px",
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "12px"
            }}>
              {currentPosition.zone}
            </div>
            <h2 style={{
              fontSize: "28px",
              marginBottom: "8px"
            }}>
              {currentPosition.title}
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "16px" }}>
              Select one candidate to vote for
            </p>
          </div>

          {/* Candidates */}
          {candidates.length === 0 ? (
            <div style={{
              backgroundColor: "#374151",
              padding: "40px",
              borderRadius: "8px",
              textAlign: "center",
              marginBottom: "24px"
            }}>
              <p style={{ color: "#9ca3af", fontSize: "18px" }}>
                No candidates available for this position
              </p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
              marginBottom: "24px"
            }}>
              {candidates.map(candidate => {
                const isSelected = votes[currentPosition.id] === candidate.id;
                
                return (
                  <button
                    key={candidate.id}
                    onClick={() => handleVote(candidate.id)}
                    style={{
                      backgroundColor: isSelected ? "#1e3a8a" : "#1f2937",
                      border: isSelected ? "3px solid #3b82f6" : "2px solid #374151",
                      borderRadius: "12px",
                      padding: "20px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "center"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "#4b5563";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "#374151";
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {candidate.image_url && (
                      <div style={{
                        width: "120px",
                        height: "120px",
                        margin: "0 auto 16px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        backgroundColor: "#374151",
                        border: "3px solid " + (isSelected ? "#3b82f6" : "#4b5563")
                      }}>
                        <img
                          src={candidate.image_url}
                          alt={candidate.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                        />
                      </div>
                    )}
                    
                    <h3 style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                      color: "white"
                    }}>
                      {candidate.name}
                    </h3>
                    
                    <div style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      textAlign: "center",
                      backgroundColor: isSelected ? "#16a34a" : "#374151",
                      color: isSelected ? "white" : "#9ca3af"
                    }}>
                      {isSelected ? "SELECTED" : "SELECT"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: "#7f1d1d",
              color: "#fca5a5",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "16px",
              textAlign: "center"
            }}>
              {error}
            </div>
          )}

          {/* Navigation */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginTop: "32px"
          }}>
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className="verify-button"
              style={{
                backgroundColor: currentPage === 0 ? "#374151" : "#4b5563",
                cursor: currentPage === 0 ? "not-allowed" : "pointer",
                opacity: currentPage === 0 ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              PREVIOUS
            </button>

            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {!isLastPage && (
                <button
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="verify-button"
                  style={{
                    backgroundColor: "#f59e0b",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.5 : 1
                  }}
                >
                  SKIP
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={!canProceed || isSubmitting}
                className="verify-button"
                style={{
                  backgroundColor: !canProceed || isSubmitting ? "#374151" :
                    isLastPage ? "#16a34a" : "#3b82f6",
                  cursor: !canProceed || isSubmitting ? "not-allowed" : "pointer",
                  opacity: !canProceed || isSubmitting ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                {isSubmitting ? "SUBMITTING..." :
                  isLastPage ? "SUBMIT ALL VOTES" : "NEXT"}
                {!isSubmitting && !isLastPage && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Guidance text */}
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            {!canProceed && !isLastPage && (
              <p style={{ color: "#fbbf24", fontWeight: "bold" }}>
                Please select a candidate or click Skip to continue
              </p>
            )}
            {isLastPage && !votes[currentPosition.id] && (
              <p style={{ color: "#9ca3af", fontStyle: "italic" }}>
                You can submit without voting for this position
              </p>
            )}
          </div>

          {/* Vote Summary */}
          <div style={{
            backgroundColor: "#1f2937",
            borderRadius: "8px",
            padding: "16px",
            marginTop: "32px"
          }}>
            <h4 style={{ fontWeight: "bold", marginBottom: "12px" }}>Voting Progress</h4>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: "8px"
            }}>
              {positions.map((pos, idx) => (
                <div
                  key={pos.id}
                  style={{
                    textAlign: "center",
                    padding: "8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor: votes[pos.id] ? "#16a34a" :
                      idx === currentPage ? "#3b82f6" : "#374151"
                  }}
                >
                  {pos.title.split(' ').slice(0, 2).join(' ')}
                  {votes[pos.id] && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ marginTop: "4px", display: "block", margin: "4px auto 0" }}>
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#1f2937",
            padding: "32px",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)"
          }}>
            <h3 style={{
              fontSize: "24px",
              marginBottom: "16px",
              color: "white",
              textAlign: "center"
            }}>
              Confirm Submission
            </h3>
            <p style={{
              fontSize: "16px",
              color: "#9ca3af",
              marginBottom: "24px",
              textAlign: "center"
            }}>
              Are you sure you want to submit your votes?
            </p>
            <div style={{
              backgroundColor: "#374151",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "24px"
            }}>
              <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "8px" }}>
                You have voted for:
              </p>
              <p style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}>
                {Object.keys(votes).length} out of {positions.length} positions
              </p>
            </div>
            <div style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center"
            }}>
              <button
                onClick={handleCancelSubmit}
                className="verify-button"
                style={{
                  backgroundColor: "#4b5563",
                  flex: 1
                }}
              >
                NO, GO BACK
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="verify-button"
                style={{
                  backgroundColor: "#16a34a",
                  flex: 1
                }}
              >
                YES, SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VotingPage;