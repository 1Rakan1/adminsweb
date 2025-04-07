import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DiscordButton from './components/DiscordButton';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <div className="app">
        <DiscordButton />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
