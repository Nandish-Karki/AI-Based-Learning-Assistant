import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, FileText, Loader2, AlertCircle } from 'lucide-react'; // Icons for search, file, loading, error

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.get(`http://localhost:8000/upload/search`, {
        params: { query: searchTerm },
        headers: headers,
      });
      setSearchResults(response.data.results);
    } catch (err) {
      setError('Failed to perform search.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentClick = (documentId) => {
    navigate(`/document/${documentId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 lg:p-10 mt-8 border border-gray-200 backdrop-filter backdrop-blur-lg bg-opacity-80">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Search Documents
        </h2>
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Search by document name or content..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transition duration-200
            ${loading ? 'bg-primary-light cursor-not-allowed' : 'bg-primary hover:bg-blue-700'}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin h-5 w-5 mr-3 text-white" />
              Searching...
            </span>
          ) : (
            'Search'
          )}
        </button>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center mt-4">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Search Results:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((result) => (
                <div
                  key={result.documentId}
                  className="bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out border border-gray-200 cursor-pointer"
                  onClick={() => handleDocumentClick(result.documentId)}
                >
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <FileText className="h-5 w-5 text-primary mr-2" />
                      <h4 className="text-lg font-semibold text-gray-800 truncate">
                        {result.documentName}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {result.preview}
                    </p>
                    <button className="mt-3 w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm">
                      View Document
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {searchResults.length === 0 && !loading && searchTerm.trim() && (
          <div className="text-center py-10">
            <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No documents found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
