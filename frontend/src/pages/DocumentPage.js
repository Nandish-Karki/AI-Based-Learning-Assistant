import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AlertCircle, Search, BookOpen } from 'lucide-react'; // Icons for loading, error, search, module

const DocumentPage = () => {
  const { documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterText, setFilterText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await axios.get(`http://localhost:8000/index/get-index/${documentId}`, { headers });
        setDocument(response.data);
      } catch (err) {
        setError('Failed to fetch document details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const handleModuleClick = (moduleNumber) => {
    navigate(`/document/${documentId}/module/${moduleNumber}`);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return 'bg-accent text-white'; // Green
    if (confidence >= 0.4) return 'bg-yellow-500 text-white'; // Yellow
    return 'bg-red-500 text-white'; // Red
  };

  const filteredModules = document?.modules.filter(module =>
    module.preview.toLowerCase().includes(filterText.toLowerCase()) ||
    `module ${module.module_number}`.toLowerCase().includes(filterText.toLowerCase()) ||
    (module.module_name && module.module_name.toLowerCase().includes(filterText.toLowerCase()))
  ) || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <p className="ml-3 text-gray-600">Loading document modules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 lg:p-10 mt-8 border border-gray-200 backdrop-filter backdrop-blur-lg bg-opacity-80">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 text-center">
          Document: {document?.documentName || 'Details'}
        </h1>
        <p className="text-center text-gray-600 mb-8">Explore the modules generated from your document.</p>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search modules by name or content preview..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-200"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>

        {filteredModules.length === 0 && filterText ? (
          <div className="text-center py-10">
            <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No modules found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <div
                key={module.module_number}
                className="bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out border border-gray-200 cursor-pointer"
                onClick={() => handleModuleClick(module.module_number)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center flex-grow min-w-0">
                      <BookOpen className="h-6 w-6 text-primary mr-3 flex-shrink-0" />
                      <h3 className="text-xl font-semibold text-gray-800 flex-grow min-w-0 pr-2">
                        Module {module.module_number} - {module.module_name || 'Untitled'}
                      </h3>
                    </div>
                    {module.confidence !== undefined && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getConfidenceColor(module.confidence)}`}>
                        Confidence: {module.confidence.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {module.preview}
                  </p>
                  <button className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm">
                    View Module
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPage;
