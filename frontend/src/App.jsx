// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RoleList from './components/RoleList';
import RoleDetails from './components/RoleDetails';
import RoleCreationForm from './components/RoleCreationForm';
import './App.css'; // Basic styling for the app

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>TA Rubrics</h1>
          <nav className="main-nav">
            <Link to="/">Home</Link>
            <Link to="/create-role">Create New Role</Link>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<RoleList />} />
            <Route path="/create-role" element={<RoleCreationForm />} />
            <Route path="/role/:id" element={<RoleDetails />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>&copy; 2024 TA Rubrics. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
