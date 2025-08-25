import React from "react";
import Home from "./pages/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ReportDisaster from "./pages/ReportDisaster";
import ReportSOS from "./pages/ReportSOS";
import Profile from "./pages/Profile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ReportDisaster" element={<ReportDisaster />} />
        <Route path="/ReportSOS" element={<ReportSOS />} />
        <Route path="/Profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
