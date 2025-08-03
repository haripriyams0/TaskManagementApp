import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Simple test component
const TestComponent = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          App is Working!
        </h1>
        <p className="text-gray-600">
          If you can see this, the basic app structure is working.
        </p>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TestComponent />} />
        <Route path="*" element={<TestComponent />} />
      </Routes>
    </Router>
  );
}

export default App;
