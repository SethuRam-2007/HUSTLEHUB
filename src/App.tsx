import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import other components as needed
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Add other routes here */}
      </Routes>
      {/* Toaster removed to fix Vercel build */}
    </Router>
  );
}

export default App;
