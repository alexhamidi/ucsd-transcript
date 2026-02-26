"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
    } catch (err) {
      console.error("Failed to copy transcript");
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-white">
          UCSD Podcast Transcript Extractor
        </h1>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            UCSD Podcast URL:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://podcast.ucsd.edu/watch/..."
              className="flex-1 px-4 py-3 bg-[#2a2a2a] border border-[#444] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#666] transition-colors"
            />
            <button
              onClick={fetchTranscript}
              disabled={loading || !url}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Extracting..." : "Extract"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {transcript && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Transcript</h2>
              <button
                onClick={copyTranscript}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333] max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-300">
                {transcript}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}