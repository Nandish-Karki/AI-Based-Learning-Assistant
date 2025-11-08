import React, { useState } from 'react';
import axios from 'axios';
import { Loader2, AlertCircle, BookOpen } from 'lucide-react'; // Icons for loading, error, roadmap

const Roadmap = ({ documentId, documentName, userEmail }) => {
  const [duration, setDuration] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [purpose, setPurpose] = useState('');
  const [roadmapContent, setRoadmapContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  console.log("Roadmap Component - documentName prop:", documentName); // Debugging line

  const handleGenerateRoadmap = async () => {
    if (!duration || !hoursPerDay || !purpose) {
      setError('All fields are required to generate a roadmap.');
      return;
    }

    setLoading(true);
    setError('');
    setRoadmapContent(null);

    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const requestData = {
        documentId,
        documentName,
        userEmail,
        duration,
        hoursPerDay: parseInt(hoursPerDay),
        purpose,
        learningType: "general", // Added default learningType
      };

      const response = await axios.post('http://localhost:8000/roadmap/generate-roadmap', requestData, { headers });
      setRoadmapContent(response.data.roadmap);
    } catch (err) {
      setError('Failed to generate roadmap. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Generate Learning Roadmap</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Duration (e.g., "2 weeks", "1 month")
          </label>
          <input
            type="text"
            id="duration"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-200"
            placeholder="e.g., 2 weeks"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="hoursPerDay" className="block text-sm font-medium text-gray-700 mb-2">
            Hours per day
          </label>
          <input
            type="number"
            id="hoursPerDay"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-200"
            placeholder="e.g., 2"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
            Learning Purpose
          </label>
          <textarea
            id="purpose"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-200 resize-y"
            rows="3"
            placeholder="e.g., To understand the core concepts for an exam"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
          ></textarea>
        </div>
        <button
          onClick={handleGenerateRoadmap}
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transition duration-200
            ${loading ? 'bg-primary-light cursor-not-allowed' : 'bg-primary hover:bg-blue-700'}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin h-5 w-5 mr-3 text-white" />
              Generating Roadmap...
            </span>
          ) : (
            'Generate Roadmap'
          )}
        </button>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center mt-4">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="block sm:inline">{error}</span>
          </div>
        )}
      </div>

      {roadmapContent && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-primary" />
            Your Learning Roadmap
          </h3>
          <div className="prose max-w-none text-gray-700 leading-relaxed">
            <p className="whitespace-pre-wrap">{roadmapContent}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roadmap;
