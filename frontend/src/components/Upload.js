import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle, XCircle } from 'lucide-react'; // Icons for upload, file, success, error

const Upload = ({ userEmail }) => {
  const [file, setFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setSuccess(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError('');
      setSuccess(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || !documentName) {
      setError('All fields are required.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userEmail);
    formData.append('documentName', documentName);

    setLoading(true);
    setUploadProgress(0);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'multipart/form-data',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post('http://localhost:8000/upload/upload-doc', formData, {
        headers: headers,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      setSuccess(true);
      setTimeout(() => {
        navigate(`/document/${response.data.documentId}`);
      }, 1500); // Redirect after a short delay to show success
    } catch (err) {
      setError('Failed to upload document. Please try again.');
      console.error(err);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 lg:p-10 mt-8 border border-gray-200 backdrop-filter backdrop-blur-lg bg-opacity-80">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Upload a New Document
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="documentName" className="block text-sm font-medium text-gray-700 mb-2">
              Document Name
            </label>
            <input
              type="text"
              id="documentName"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-200"
              placeholder="Enter document name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              required
            />
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary transition duration-200"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload-input').click()}
          >
            <input
              type="file"
              id="file-upload-input"
              hidden
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
            />
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">
              Drag and drop your document here, or{' '}
              <span className="text-primary font-medium">browse files</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">PDF, DOCX, TXT up to 10MB</p>
          </div>

          {file && (
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-primary mr-2" />
                <span className="text-gray-700 font-medium">{file.name}</span>
              </div>
              {loading && (
                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              {success && <CheckCircle className="h-6 w-6 text-accent" />}
              {error && <XCircle className="h-6 w-6 text-red-500" />}
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transition duration-200
              ${loading ? 'bg-primary-light cursor-not-allowed' : 'bg-primary hover:bg-blue-700'}`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading ({uploadProgress}%)
              </span>
            ) : (
              'Upload and Process'
            )}
          </button>
          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Upload;
