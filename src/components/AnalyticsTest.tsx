"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";

export default function AnalyticsTest() {
  useEffect(() => {
    // Test analytics on component mount
    console.log("Analytics test component mounted");
    
    // Manual tracking test
    track("page_view_test", {
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
    
    console.log("Manual analytics event sent");
  }, []);

  const handleTestClick = () => {
    track("manual_test_click", {
      timestamp: new Date().toISOString(),
    });
    console.log("Test click event sent to analytics");
  };

  return (
    <div style={{ position: "fixed", bottom: "10px", right: "10px", zIndex: 9999 }}>
      <button
        onClick={handleTestClick}
        style={{
          padding: "8px 12px",
          background: "#007acc",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        Test Analytics
      </button>
    </div>
  );
}