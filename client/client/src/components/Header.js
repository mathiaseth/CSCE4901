import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header style={{ padding: "1rem", background: "#282c34", color: "#fff" }}>
      <h2>NutriTrack</h2>
      <nav>
        <Link to="/" style={{ marginRight: "1rem", color: "#61dafb" }}>Home</Link>
        <Link to="/dashboard" style={{ color: "#61dafb" }}>Dashboard</Link>
      </nav>
    </header>
  );
};

export default Header;
