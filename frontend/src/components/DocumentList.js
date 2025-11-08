import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, FolderOpen, Loader2, AlertCircle } from 'lucide-react'; // Icons for document, folder, loading, error

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await axios.get(`http://localhost:8000/upload/documents/${userEmail}`, { headers });
        setDocuments(response.data.documents);
      } catch (err) {
        setError('Failed to fetch documents.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchDocuments();
    } else {
      setError('User email not found. Please log in.');
      setLoading(false);
    }
  }, [userEmail]);

  const handleDocumentClick = (documentId) => {
    navigate(`/document/${documentId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <p className="ml-3 text-gray-600">Loading documents...</p>
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
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Your Uploaded Documents
        </h2>
        {documents.length === 0 ? (
          <div className="text-center py-10">
            <FolderOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No documents uploaded yet.</p>
            <p className="text-gray-500 mt-2">Start by uploading a new document above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.documentId}
                className="bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out border border-gray-200 cursor-pointer"
                onClick={() => handleDocumentClick(doc.documentId)}
              >
                <div className="p-5">
                  <div className="flex items-center mb-3">
                    <FileText className="h-6 w-6 text-primary mr-3" />
                    <h3 className="text-xl font-semibold text-gray-800 truncate">
                      {doc.documentName}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                  <button className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm">
                    View Document
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

export default DocumentList;
