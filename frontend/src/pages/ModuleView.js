import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import ModuleDetails from '../components/ModuleDetails';
import QA from '../components/QA';
import Notes from '../components/Notes';
import Roadmap from '../components/Roadmap'; // Import Roadmap component
import { BookOpen, Notebook, MessageSquare, Map } from 'lucide-react'; // Icons for tabs

const ModuleView = () => {
  const { documentId, moduleNumber } = useParams();
  const userEmail = localStorage.getItem('userEmail'); // Assuming email is stored on login
  const [moduleName, setModuleName] = useState('');
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'notes', 'qa', 'roadmap'

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 lg:p-10 mt-8 border border-gray-200 backdrop-filter backdrop-blur-lg bg-opacity-80">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          Module {parseInt(moduleNumber)}{moduleName ? ` - ${moduleName}` : ''} Details
        </h1>

        {/* Tab Navigation */}
        <div className="flex justify-center space-x-4 mb-8 flex-wrap">
          <button
            className={`flex items-center px-4 py-2 rounded-full text-lg font-medium transition-all duration-300 mb-2
              ${activeTab === 'content' ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('content')}
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Content
          </button>
          <button
            className={`flex items-center px-4 py-2 rounded-full text-lg font-medium transition-all duration-300 mb-2
              ${activeTab === 'notes' ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('notes')}
          >
            <Notebook className="h-5 w-5 mr-2" />
            Notes
          </button>
          <button
            className={`flex items-center px-4 py-2 rounded-full text-lg font-medium transition-all duration-300 mb-2
              ${activeTab === 'qa' ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('qa')}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Ask a Question
          </button>
          <button
            className={`flex items-center px-4 py-2 rounded-full text-lg font-medium transition-all duration-300 mb-2
              ${activeTab === 'roadmap' ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('roadmap')}
          >
            <Map className="h-5 w-5 mr-2" />
            Roadmap
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'content' && (
            <ModuleDetails
              documentId={documentId}
              moduleNumber={parseInt(moduleNumber)}
              userEmail={userEmail}
              onModuleLoad={setModuleName}
            />
          )}
          {activeTab === 'notes' && (
            <Notes
              documentId={documentId}
              chapter={parseInt(moduleNumber)}
              userEmail={userEmail}
            />
          )}
          {activeTab === 'qa' && (
            <QA
              documentId={documentId}
              userEmail={userEmail}
            />
          )}
          {activeTab === 'roadmap' && (
            <Roadmap
              documentId={documentId}
              documentName={moduleName}
              userEmail={userEmail}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleView;
