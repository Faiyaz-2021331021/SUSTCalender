import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./GlobalNav.css";

export default function GlobalNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  if (isHome) return null;

  return (
    <div className="global-nav">
      <button className="global-btn back" onClick={() => navigate(-1)} aria-label="Back">
        ←
      </button>
      <button className="global-btn home" onClick={() => navigate("/")} aria-label="Home">
        ⌂
      </button>
    </div>
  );
}
