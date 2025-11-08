import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AlertCircle } from 'lucide-react'; // Icons for loading, error

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/auth/login', {
        email,
        password,
      });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('userEmail', email); // Store user email
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 lg:p-10 w-full max-w-md border border-gray-200 backdrop-filter backdrop-blur-lg bg-opacity-80">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Sign In
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-200"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-200"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transition duration-200
              ${loading ? 'bg-primary-light cursor-not-allowed' : 'bg-primary hover:bg-blue-700'}`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 mr-3 text-white" />
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center mt-4">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <p className="text-center text-gray-600 text-sm mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
