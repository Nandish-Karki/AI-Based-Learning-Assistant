import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'; // Icons for send, bot, loading, error, expand/collapse

const QA = ({ documentId, userEmail }) => {
  const [question, setQuestion] = useState('');
  const [qnaHistory, setQnaHistory] = useState([]); // Store history of Q&A
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChatHistoryExpanded, setIsChatHistoryExpanded] = useState(false); // State for chat history expansion
  const chatHistoryRef = useRef(null);

  // Scroll to bottom of chat history when new messages are added
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [qnaHistory]);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    const currentQuestion = question;
    setQuestion(''); // Clear input immediately
    setLoading(true);
    setError('');

    // Add user's question to history
    setQnaHistory(prevHistory => [...prevHistory, { type: 'question', text: currentQuestion }]);

    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await axios.post('http://localhost:8000/qa/ask-question', {
        question: currentQuestion,
        documentId,
        email: userEmail,
      }, { headers });

      // Add AI's answer to history
      setQnaHistory(prevHistory => [...prevHistory, { type: 'answer', text: response.data.answer, emotion: response.data.emotion }]);
    } catch (err) {
      setError('Failed to get an answer.');
      console.error(err);
      // Optionally add an error message to the chat history
      setQnaHistory(prevHistory => [...prevHistory, { type: 'error', text: 'Failed to get an answer. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Ask a Question</h2>
        {qnaHistory.length > 0 && (
          <button
            onClick={() => setIsChatHistoryExpanded(!isChatHistoryExpanded)}
            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition duration-200"
            aria-label={isChatHistoryExpanded ? "Collapse chat history" : "Expand chat history"}
          >
            {isChatHistoryExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}
      </div>

      <div
        ref={chatHistoryRef}
        className={`flex flex-col space-y-4 pr-2 ${isChatHistoryExpanded ? 'flex-grow' : 'max-h-60 overflow-y-auto'}`}
      >
        {qnaHistory.map((item, index) => (
          <div key={index} className={`flex items-start space-x-3 p-4 rounded-lg shadow-sm animate-fade-in ${item.type === 'question' ? 'bg-gray-100 justify-end' : 'bg-blue-50'}`}>
            {item.type === 'answer' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
            <div>
              <p className={`text-gray-800 leading-relaxed whitespace-pre-wrap ${item.type === 'question' ? 'text-right' : ''}`}>{item.text}</p>
              {item.type === 'answer' && item.emotion && (
                <p className="text-sm text-gray-500 mt-1">Emotion: {item.emotion}</p>
              )}
              {item.type === 'error' && (
                <p className="text-sm text-red-500 mt-1">Error: {item.text}</p>
              )}
            </div>
            {item.type === 'question' && <Send className="h-6 w-6 text-gray-600 flex-shrink-0 transform rotate-45" />}
          </div>
        ))}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin h-6 w-6 text-primary mr-3" />
            <p className="text-gray-600">Thinking...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center mt-4">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mt-6 relative">
        <textarea
          className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-200 resize-none"
          rows="3"
          placeholder="Type your question here..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        ></textarea>
        <button
          onClick={handleAskQuestion}
          disabled={loading || !question.trim()}
          className={`absolute right-3 bottom-3 p-2 rounded-full text-white transition duration-200
            ${loading || !question.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-700'}`}
          aria-label="Ask question"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default QA;
