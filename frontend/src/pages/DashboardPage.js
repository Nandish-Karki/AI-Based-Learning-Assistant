import React, { useState } from 'react';
import Upload from '../components/Upload';
import Search from '../components/Search';
import DocumentList from '../components/DocumentList';
import { UploadCloud, FileText, Search as SearchIcon } from 'lucide-react'; // Icons for tabs

const DashboardPage = () => {
  const userEmail = localStorage.getItem('userEmail');
  const [activeTab, setActiveTab] = useState('documents'); // 'documents', 'upload', 'search'

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 lg:p-10 mt-8 border border-gray-200 backdrop-filter backdrop-blur-lg bg-opacity-80">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 text-center">
          Dashboard
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Welcome, <span className="font-semibold text-primary">{userEmail || 'User'}</span>! Manage your documents and learning modules here.
        </p>

        {/* Tab Navigation */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            className={`flex items-center px-6 py-3 rounded-full text-lg font-medium transition-all duration-300
              ${activeTab === 'documents' ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('documents')}
          >
            <FileText className="h-5 w-5 mr-2" />
            My Documents
          </button>
          <button
            className={`flex items-center px-6 py-3 rounded-full text-lg font-medium transition-all duration-300
              ${activeTab === 'upload' ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('upload')}
          >
            <UploadCloud className="h-5 w-5 mr-2" />
            Upload New
          </button>
          <button
            className={`flex items-center px-6 py-3 rounded-full text-lg font-medium transition-all duration-300
              ${activeTab === 'search' ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('search')}
          >
            <SearchIcon className="h-5 w-5 mr-2" />
            Search
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'documents' && <DocumentList />}
          {activeTab === 'upload' && <Upload userEmail={userEmail} />}
          {activeTab === 'search' && <Search />}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
