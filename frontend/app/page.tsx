"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const savedTranscript = localStorage.getItem("transcript");
    const savedUrl = localStorage.getItem("lastUrl");
    if (savedTranscript) {
      setTranscript(savedTranscript);
    }
    if (savedUrl) {
      setUrl(savedUrl);
    }
  }, []);

  const fetchTranscript = async () => {
    if (!url) return;

    setLoading(true);
    setError("");
    setTranscript("");

    try {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch transcript");
        return;
      }

      setTranscript(data.transcript);
      localStorage.setItem("transcript", data.transcript);
      localStorage.setItem("lastUrl", url);
    } catch (err) {
      setError("Failed to fetch transcript");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      fetchTranscript();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setChatLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input,
          transcript 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to get response");
        return;
      }

      setResponse(data.message);
      setInput("");
    } catch (err) {
      setError("Failed to send message");
    } finally {
      setChatLoading(false);
    }
  };



  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-4xl flex-2">
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter video URL"
            className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#555] transition-colors"
          />
          <button
            onClick={fetchTranscript}
            disabled={loading || !url}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Loading..." : "Get Transcript"}
          </button>
        </div>
        <div>
          
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-900 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* {transcript && (
          <div className="mb-6 p-6 bg-[#1a1a1a] border border-[#333] rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Transcript</h2>
            <pre className="whitespace-pre-wrap text-gray-300 text-sm max-h-60 overflow-y-auto">
              {transcript}
            </pre>
          </div>
        )} */}

        {transcript && (
          <div className="p-6 bg-[#1a1a1a] border border-[#333] rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-white">
              Chat with Transcript
            </h2>
            {response && (
              <div className="mb-4 p-4 bg-[#2a2a2a] rounded-lg">
                <div className="text-xs font-semibold mb-2 opacity-70 text-gray-400">
                  AI Response
                </div>
                <div className="text-gray-300 whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            )}
            {chatLoading && (
              <div className="mb-4 p-4 bg-[#2a2a2a] rounded-lg text-gray-400">
                Thinking...
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about the transcript..."
                className="flex-1 px-4 py-3 bg-[#2a2a2a] border border-[#444] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#666] transition-colors"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !input?.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
