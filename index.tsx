// FIX: The original file content was invalid. Replaced with a functional React component to demonstrate Gemini API usage.
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const App = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) return;

        setLoading(true);
        setResponse('');
        setError('');

        try {
            // Initialize the Google AI client. The API key is passed from environment variables.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResponse(result.text);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An error occurred while fetching the response.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Gemini API React Example</h1>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt"
                    rows={5}
                    style={{ width: '100%', boxSizing: 'border-box', marginBottom: '10px', padding: '8px' }}
                />
                <br />
                <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
                    {loading ? 'Loading...' : 'Generate Content'}
                </button>
            </form>
            {error && <div style={{ color: 'red', marginTop: '10px' }}>Error: {error}</div>}
            {response && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Response:</h2>
                    <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '10px', borderRadius: '5px', wordWrap: 'break-word' }}>{response}</pre>
                </div>
            )}
        </div>
    );
};

const rootEl = document.getElementById('root');
if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
} else {
    console.error("Failed to find the root element");
}
