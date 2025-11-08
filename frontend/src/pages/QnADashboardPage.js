import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, AlertCircle, Search, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'; // Icons for loading, error, search, Q&A, expand/collapse

const QnADashboardPage = () => {
  const [qnaList, setQnaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterText, setFilterText] = useState('');
  const [expandedQna, setExpandedQna] = useState(null); // State to manage expanded Q&A item
  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    const fetchQnAList = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await axios.get(`http://localhost:8000/qa/history/${userEmail}`, { headers });
        setQnaList(response.data.qna_history);
      } catch (err) {
        setError('Failed to fetch Q&A history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchQnAList();
    } else {
      setError('User email not found. Please log in.');
      setLoading(false);
    }
  }, [userEmail]);

  const handleToggleExpand = (index) => {
    setExpandedQna(expandedQna === index ? null : index);
  };

  const filteredQnAList = qnaList.filter(qna =>
    qna.question.toLowerCase().includes(filterText.toLowerCase()) ||
    qna.answer.toLowerCase().includes(filterText.toLowerCase()) ||
    (qna.documentName && qna.documentName.toLowerCase().includes(filterText.toLowerCase())) ||
    (qna.moduleNumber && `module ${qna.moduleNumber}`.toLowerCase().includes(filterText.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <p className="ml-3 text-gray-600">Loading Q&A history...</p>
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
          Your Q&A History
        </h1>
        <p className="text-center text-gray-600 mb-8">Review your past questions and AI-generated answers.</p>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Filter Q&A by question, answer, document, or module..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-200"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>

        {filteredQnAList.length === 0 && filterText ? (
          <div className="text-center py-10">
            <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No Q&A found matching your filter.</p>
          </div>
        ) : filteredQnAList.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No Q&A history available yet.</p>
            <p className="text-gray-500 mt-2">Start asking questions in your modules!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQnAList.map((qna, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 ease-in-out"
              >
                <button
                  className="w-full text-left p-5 flex justify-between items-center focus:outline-none"
                  onClick={() => handleToggleExpand(index)}
                  aria-expanded={expandedQna === index}
                  aria-controls={`qna-answer-${index}`}
                >
                  <div>
                    <p className="text-lg font-semibold text-gray-800 mb-1">Q: {qna.question}</p>
                    <div className="text-sm text-gray-500">
                      {qna.documentName && <span className="mr-3">Document: {qna.documentName}</span>}
                      {qna.moduleNumber !== undefined && <span>Module: {qna.moduleNumber}</span>}
                    </div>
                  </div>
                  {expandedQna === index ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
                </button>
                {expandedQna === index && (
                  <div id={`qna-answer-${index}`} className="p-5 pt-0 border-t border-gray-200 bg-white rounded-b-xl">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">A: {qna.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QnADashboardPage;
