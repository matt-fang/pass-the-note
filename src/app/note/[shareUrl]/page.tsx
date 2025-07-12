'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DrawingCanvas from '@/components/DrawingCanvas';

interface Response {
  id: string;
  drawingData: string;
  authorName: string;
  createdAt: string;
}

interface Thread {
  id: string;
  question: string;
  responses: Response[];
}

export default function NotePage() {
  const params = useParams();
  const shareUrl = params.shareUrl as string;
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [drawingData, setDrawingData] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newShareUrl, setNewShareUrl] = useState('');
  const [nextShareUrl, setNextShareUrl] = useState('');

  useEffect(() => {
    if (shareUrl) {
      loadThread();
    }
  }, [shareUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadThread = async () => {
    try {
      const response = await fetch(`/api/share/${shareUrl}`);
      if (response.ok) {
        const data = await response.json();
        setThread(data.thread);
        setCanEdit(data.canEdit);
        setNextShareUrl(data.nextShareUrl || '');
      } else {
        console.error('Thread not found');
      }
    } catch (error) {
      console.error('Error loading thread:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitResponse = async () => {
    if (!drawingData || !thread) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: thread.id,
          drawingData,
          authorName: authorName || 'Anonymous'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const fullUrl = `${window.location.origin}/note/${data.shareUrl}`;
        setNewShareUrl(fullUrl);
        setCanEdit(false);
        await loadThread(); // Reload to see the new response
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newShareUrl);
    alert('Link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Note Not Found</h1>
          <p className="text-gray-600">This note link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Pass The Note
        </h1>
        
        {/* Question */}
        <div className="bg-yellow-100 border-l-4 border-yellow-400 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Question:</h2>
          <p className="text-lg text-gray-700">{thread.question}</p>
        </div>

        {/* All Responses */}
        <div className="space-y-6 mb-8">
          {thread.responses.map((response, index) => (
            response.drawingData && (
              <div key={response.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {response.authorName}
                  </h3>
                  <span className="text-sm text-gray-500">
                    Response #{index}
                  </span>
                </div>
                <div className="flex justify-center">
                  <DrawingCanvas
                    width={400}
                    height={300}
                    initialData={response.drawingData}
                    disabled={true}
                  />
                </div>
              </div>
            )
          ))}
        </div>

        {/* Drawing Area (if can edit) */}
        {canEdit && !newShareUrl ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Response:</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name (optional):
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter your name..."
              />
            </div>

            <div className="mb-6 flex justify-center">
              <DrawingCanvas
                width={400}
                height={300}
                onDrawingChange={setDrawingData}
              />
            </div>

            <div className="text-center">
              <button
                onClick={submitResponse}
                disabled={!drawingData || isSubmitting}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Response & Share'}
              </button>
            </div>
          </div>
        ) : canEdit && newShareUrl ? (
          <div className="bg-green-100 border-l-4 border-green-400 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Response Submitted!</h3>
            <p className="text-gray-700 mb-4">Share this link with the next person:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newShareUrl}
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
        ) : nextShareUrl ? (
          <div className="bg-blue-100 border-l-4 border-blue-400 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">This note has been responded to!</h3>
            <p className="text-gray-700 mb-4">Share this link to continue the chain:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${window.location.origin}/note/${nextShareUrl}`}
                readOnly
                className="flex-1 p-2 border border-gray-300 rounded"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/note/${nextShareUrl}`);
                  alert('Link copied to clipboard!');
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 border-l-4 border-gray-400 p-6 rounded-lg text-center">
            <p className="text-gray-600">
              This note has already been responded to. You can view all responses above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}