import React, { useContext } from "react";
import { ThemeContext } from "../../context/ThemeProv";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import DashboardStats from "./DashboardStats";

const DashboardPage = () => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <div style={{ background: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000", minHeight: "100vh" }}>
      <Header />
      <main style={{ padding: "2rem" }}>
        <h1>Dashboard</h1>
        <button onClick={toggleTheme}>Toggle Theme</button>
        <DashboardStats />
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;

