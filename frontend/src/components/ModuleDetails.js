import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, AlertCircle, Volume2, PauseCircle } from 'lucide-react'; // Icons for loading, error, audio play/pause

const ModuleDetails = ({ documentId, moduleNumber, userEmail, onModuleLoad }) => {
  const [moduleContent, setModuleContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [audio, setAudio] = useState({ loading: false, url: null, error: '' });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (moduleNumber === null) return;

    const fetchModuleContent = async () => {
      setLoading(true);
      setError('');
      setAudio({ loading: false, url: null, error: '' }); // Reset audio state
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await axios.get(`http://localhost:8000/upload/module/${documentId}/${moduleNumber}`, { headers });
        console.log("ModuleDetails fetch response:", response.data); // Debugging line
        setModuleContent(response.data);
        if (onModuleLoad && response.data.module_name) {
          onModuleLoad(response.data.module_name); // Pass module name to parent
        } else if (onModuleLoad) {
          onModuleLoad(''); // Clear module name if not found
        }
      } catch (err) {
        setError('Failed to fetch module content.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchModuleContent();
  }, [documentId, moduleNumber, onModuleLoad]);

  const handleGenerateAudio = async () => {
    setAudio({ loading: true, url: null, error: '' });
    setIsPlaying(false); // Stop any current playback
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await axios.post('http://localhost:8000/audio/generate-module-audio', {
        email: userEmail,
        documentId: documentId,
        moduleNumber: moduleNumber.toString(),
      }, { headers });
      setAudio({ loading: false, url: response.data.public_url, error: '' });
    } catch (err) {
      setAudio({ loading: false, url: null, error: 'Failed to generate audio.' });
      console.error(err);
    }
  };

  const toggleAudioPlayback = () => {
    const audioElement = document.getElementById('module-audio-player');
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (moduleNumber === null) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
        <p className="text-gray-600 text-lg text-center">Select a module to see the details.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <p className="ml-3 text-gray-600">Loading module content...</p>
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
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Module {moduleNumber} Content</h2>
      {moduleContent && (
        <div className="prose max-w-none text-gray-700 leading-relaxed mb-6 p-4 bg-gray-50 rounded-lg overflow-auto max-h-96">
          <p className="whitespace-pre-wrap">{moduleContent.text}</p>
        </div>
      )}

      <div className="flex items-center space-x-4 mt-4">
        <button
          onClick={handleGenerateAudio}
          disabled={audio.loading}
          className={`flex items-center px-5 py-2 rounded-full text-white font-semibold shadow-md transition duration-200
            ${audio.loading ? 'bg-primary-light cursor-not-allowed' : 'bg-primary hover:bg-blue-700'}`}
        >
          {audio.loading ? (
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
          ) : (
            <Volume2 className="h-5 w-5 mr-2" />
          )}
          {audio.loading ? 'Generating Audio...' : 'Generate Audio'}
        </button>

        {audio.url && (
          <div className="flex items-center space-x-2">
            <audio id="module-audio-player" src={audio.url} onEnded={() => setIsPlaying(false)} hidden />
            <button
              onClick={toggleAudioPlayback}
              className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition duration-200 shadow-sm"
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
            >
              {isPlaying ? <PauseCircle size={24} /> : <Volume2 size={24} />}
            </button>
            <span className="text-sm text-gray-600">Audio Ready</span>
          </div>
        )}
      </div>

      {audio.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center mt-4">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="block sm:inline">{audio.error}</span>
        </div>
      )}
    </div>
  );
};

export default ModuleDetails;
