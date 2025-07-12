'use client';

import { useState } from 'react';

export default function Home() {
  const [shareUrl, setShareUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createNewNote = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/thread', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuestion(data.question);
        const fullUrl = `${window.location.origin}/note/${data.shareUrl}`;
        setShareUrl(fullUrl);
      }
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Pass The Note
        </h1>
        
        {!shareUrl ? (
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Start a deep conversation chain with your friends!
            </p>
            <button
              onClick={createNewNote}
              disabled={isLoading}
              className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 px-8 py-3 rounded-lg font-semibold text-gray-800 transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create New Note'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded">
              <h2 className="font-semibold text-gray-800 mb-2">Your Question:</h2>
              <p className="text-gray-700">{question}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Share this link:</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 p-2 border border-gray-300 rounded"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShareUrl('');
                setQuestion('');
              }}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded transition-colors"
            >
              Create Another Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
