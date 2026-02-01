// src/Dashboard.js
import React, { useEffect, useState } from "react";
import { socket } from "./socket";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Use environment variable for API URL
const API_URL = process.env.REACT_APP_API_URL;

function Dashboard() {
  const [results, setResults] = useState([]);
  const [statistics, setStatistics] = useState({
    total_delegates: 0,
    voted_delegates: 0,
    total_votes: 0,
    total_candidates: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState("ALL");

  useEffect(() => {
    // Load initial results
    loadResults();

    // Load statistics
    loadStatistics();

    // Subscribe to live updates via Socket.io
    socket.on("new_votes", (data) => {
      console.log("Received new_votes on dashboard:", data);
      loadResults();
      loadStatistics();
    });

    return () => {
      socket.off("new_votes");
    };
  }, []);

  const loadResults = () => {
    fetch(`${API_URL}/results`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Results loaded:", data);
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading results:", err);
        setLoading(false);
      });
  };

  const loadStatistics = () => {
    fetch(`${API_URL}/statistics`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Statistics loaded:", data);
        setStatistics(data);
      })
      .catch((err) => {
        console.error("Error loading statistics:", err);
      });
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-chart-box">
          <h2 style={{ color: "white", textAlign: "center" }}>Loading results...</h2>
        </div>
      </div>
    );
  }

  // Filter results by zone
  const filteredResults = selectedZone === "ALL" 
    ? results 
    : results.filter(r => r.zone === selectedZone);

  const zones = ["ALL", "CENTRAL ZONE", "EASTERN ZONE", "WESTERN ZONE"];

  const turnoutPercentage = statistics.total_delegates > 0
    ? ((statistics.voted_delegates / statistics.total_delegates) * 100).toFixed(1)
    : 0;

  return (
    <div style={{ backgroundColor: "#0b1220", minHeight: "100vh", padding: "20px" }}>
      {/* Header Stats */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", marginBottom: "30px" }}>
        <h1 style={{ 
          color: "white", 
          textAlign: "center", 
          fontSize: "36px",
          marginBottom: "20px"
        }}>
          Ijaw National Congress – Live Voting Results
        </h1>
        
        {/* Statistics Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          <div style={{
            backgroundColor: "#1f2937",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "8px" }}>
              Total Delegates
            </div>
            <div style={{ color: "white", fontSize: "32px", fontWeight: "bold" }}>
              {statistics.total_delegates}
            </div>
          </div>

          <div style={{
            backgroundColor: "#1f2937",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "8px" }}>
              Delegates Voted
            </div>
            <div style={{ color: "#16a34a", fontSize: "32px", fontWeight: "bold" }}>
              {statistics.voted_delegates}
            </div>
          </div>

          <div style={{
            backgroundColor: "#1f2937",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "8px" }}>
              Total Votes Cast
            </div>
            <div style={{ color: "#3b82f6", fontSize: "32px", fontWeight: "bold" }}>
              {statistics.total_votes}
            </div>
          </div>

          <div style={{
            backgroundColor: "#1f2937",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "8px" }}>
              Turnout
            </div>
            <div style={{ color: "#f59e0b", fontSize: "32px", fontWeight: "bold" }}>
              {turnoutPercentage}%
            </div>
          </div>
        </div>

        {/* Zone Filter */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "30px"
        }}>
          {zones.map(zone => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              style={{
                padding: "10px 20px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: selectedZone === zone ? "#3b82f6" : "#374151",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (selectedZone !== zone) e.target.style.backgroundColor = "#4b5563";
              }}
              onMouseLeave={(e) => {
                if (selectedZone !== zone) e.target.style.backgroundColor = "#374151";
              }}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {filteredResults.length === 0 ? (
          <div style={{
            backgroundColor: "#1f2937",
            padding: "40px",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <h2 style={{ color: "white", marginBottom: "10px" }}>No Votes Yet</h2>
            <p style={{ color: "#9ca3af" }}>Results will appear here as votes are cast</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
            gap: "20px"
          }}>
            {filteredResults.map((position) => {
              const hasVotes = position.candidates.some(c => c.vote_count > 0);
              const maxVotes = Math.max(...position.candidates.map(c => c.vote_count));
              const totalVotes = position.candidates.reduce((sum, c) => sum + c.vote_count, 0);

              return (
                <div
                  key={position.position_id}
                  style={{
                    backgroundColor: "#1f2937",
                    padding: "20px",
                    borderRadius: "8px"
                  }}
                >
                  {/* Position Header */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{
                      display: "inline-block",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      marginBottom: "8px"
                    }}>
                      {position.zone}
                    </div>
                    <h3 style={{
                      color: "white",
                      fontSize: "20px",
                      marginBottom: "4px"
                    }}>
                      {position.position_title}
                    </h3>
                    <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                      Total votes: {totalVotes}
                    </p>
                  </div>

                  {/* Candidates */}
                  <div>
                    {position.candidates.map((candidate) => {
                      const percentage = totalVotes > 0 
                        ? ((candidate.vote_count / totalVotes) * 100).toFixed(1)
                        : 0;
                      const isWinning = hasVotes && candidate.vote_count === maxVotes && maxVotes > 0;

                      return (
                        <div
                          key={candidate.candidate_id}
                          style={{
                            marginBottom: "12px",
                            padding: "12px",
                            backgroundColor: isWinning ? "#065f46" : "#374151",
                            borderRadius: "6px",
                            border: isWinning ? "2px solid #10b981" : "none"
                          }}
                        >
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "6px"
                          }}>
                            <span style={{
                              color: "white",
                              fontWeight: "bold",
                              fontSize: "16px"
                            }}>
                              {isWinning && "🏆 "}
                              {candidate.candidate_name}
                            </span>
                            <span style={{
                              color: "white",
                              fontWeight: "bold",
                              fontSize: "18px"
                            }}>
                              {candidate.vote_count}
                            </span>
                          </div>
                          
                          {/* Progress Bar */}
                          <div style={{
                            height: "8px",
                            backgroundColor: "#1f2937",
                            borderRadius: "4px",
                            overflow: "hidden"
                          }}>
                            <div style={{
                              height: "100%",
                              width: `${percentage}%`,
                              backgroundColor: isWinning ? "#10b981" : "#3b82f6",
                              transition: "width 0.5s ease"
                            }} />
                          </div>
                          
                          <div style={{
                            color: "#9ca3af",
                            fontSize: "12px",
                            marginTop: "4px"
                          }}>
                            {percentage}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
