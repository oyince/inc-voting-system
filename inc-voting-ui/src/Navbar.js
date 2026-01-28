// src/Navbar.js
import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{
      background: "linear-gradient(163deg, rgba(3, 16, 9, 91) 0%, rgb(59 75 165) 100%)",
      padding: "32px 41px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "28px solid #ef4444",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)"
    }}>
      {/* Logo/Flag Section */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "16px"
      }}>
        {/* INC Flag */}
        <div style={{
          width: "70px",
          height: "50px",
          borderRadius: "4px",
          overflow: "hidden",
          border: "2px solid white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{
            height: "33.33%",
            backgroundColor: "#3b4ba5",
            width: "100%"
          }}></div>
          <div style={{
            height: "33.33%",
            backgroundColor: "#ef4444",
            width: "100%"
          }}></div>
          <div style={{
            height: "33.34%",
            backgroundColor: "#10b981",
            width: "100%"
          }}></div>
        </div>
        
        {/* Title */}
        <div style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: "white",
          letterSpacing: "0.5px",
          textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
        }}>
          IJAW NATIONAL CONGRESS
        </div>
      </div>
      
      {/* Navigation Links */}
      <div style={{
        display: "flex",
        gap: "16px"
      }}>
        <Link 
          to="/" 
          style={{
            color: "white",
            textDecoration: "none",
            fontSize: "18px",
            fontWeight: "700",
            padding: "10px 20px",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            transition: "all 0.3s"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#10b981";
            e.target.style.borderColor = "white";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
            e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
          }}
        >
          Verify
        </Link>
        
        <Link 
          to="/dashboard" 
          style={{
            color: "white",
            textDecoration: "none",
            fontSize: "18px",
            fontWeight: "700",
            padding: "10px 20px",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            transition: "all 0.3s"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#10b981";
            e.target.style.borderColor = "white";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
            e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
          }}
        >
          Dashboard
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;