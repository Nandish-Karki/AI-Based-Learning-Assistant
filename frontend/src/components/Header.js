import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react'; // Assuming lucide-react for icons

const Header = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md rounded-b-xl mx-2 mt-2">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="text-2xl font-bold text-primary">
          LLM Tutor
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/dashboard" className="text-gray-600 hover:text-primary transition-colors duration-200">
            Dashboard
          </Link>
          <Link to="/qna" className="text-gray-600 hover:text-primary transition-colors duration-200">
            Q&A History
          </Link>
          {token ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors duration-200">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-primary focus:outline-none">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg rounded-b-xl mx-2 pb-4">
          <div className="flex flex-col items-center space-y-4 py-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-primary transition-colors duration-200" onClick={() => setIsOpen(false)}>
              Dashboard
            </Link>
            <Link to="/qna" className="text-gray-600 hover:text-primary transition-colors duration-200" onClick={() => setIsOpen(false)}>
              Q&A History
            </Link>
            {token ? (
              <button
                onClick={() => { handleLogout(); setIsOpen(false); }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md w-3/4"
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors duration-200 w-3/4 text-center" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md w-3/4 text-center" onClick={() => setIsOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
