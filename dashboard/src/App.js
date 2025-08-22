import React from 'react';
import Sidebar from "./components/Sidebar";
import { BacktestProvider } from './context/BacktestContext';
import { SignalProvider } from './context/SignalContext';
import Dashboard from "./components/Dashboard";
import './App.css';

function App() {
  return (
    <BacktestProvider>
      <SignalProvider>
      <div className="complete window">
      <div className="title">
        <img src="/retrospect_logo.jpg" alt="Retrospect Logo" className="title-logo" />
        <h1 className="apptitle">Retrospect</h1>
      </div>
    <div className="app-container">
      <Sidebar />
      <Dashboard />
    </div>
    </div>
    </SignalProvider>
    </BacktestProvider>
  );
}

export default App;
