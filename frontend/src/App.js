import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import DocumentPage from './pages/DocumentPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ModuleView from './pages/ModuleView';
import QnADashboardPage from './pages/QnADashboardPage';
import { Navigate } from 'react-router-dom';
// No longer importing App.css as it has been removed and replaced by Tailwind

function App() {
  const isAuthenticated = localStorage.getItem('token'); // Check for token to determine authentication

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background-light">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/document/:documentId" element={<DocumentPage />} />
            <Route path="/document/:documentId/module/:moduleNumber" element={<ModuleView />} />
            <Route path="/qna" element={<QnADashboardPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
