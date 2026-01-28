// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VotingPage from "./VotingPage";
import DashboardPage from "./DashboardPage";
import VerifyPage from "./VerifyPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Start here */}
        <Route path="/" element={<VerifyPage />} />
        {/* Voting screen with candidates */}
        <Route path="/vote" element={<VotingPage />} />
        {/* Existing dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;