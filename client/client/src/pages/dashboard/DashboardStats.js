import React from "react";

const DashboardStats = () => {
  return (
    <div style={{ display: "flex", justifyContent: "space-around", margin: "2rem 0" }}>
      <div>
        <h3>Calories Today</h3>
        <p>1500 kcal</p>
      </div>
      <div>
        <h3>Steps Today</h3>
        <p>8500</p>
      </div>
      <div>
        <h3>Water Intake</h3>
        <p>2 L</p>
      </div>
    </div>
  );
};

export default DashboardStats;
