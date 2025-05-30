// client/src/pages/ProblemDetail.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ProblemDetail = () => {
    const { id } = useParams(); // Get problem ID from URL parameter
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [code, setCode] = useState(''); // State for user's code input
    const [language, setLanguage] = useState('cpp'); // Default language

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const response = await axios.get(`/api/problems/${id}`);
                setProblem(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching problem:', err);
                setError(err.response?.data?.message || 'Failed to fetch problem details. Please try again later.');
                setLoading(false);
            }
        };

        fetchProblem();
    }, [id]); // Re-run effect if ID changes

    const handleSubmit = (e) => {
        e.preventDefault();
        // This is where you'll send the code and language to the backend later
        console.log('Submitting code:', code);
        console.log('Language:', language);
        alert('Code submission logic will be implemented in the next parts!');
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading problem...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
    }

    if (!problem) {
        return <div style={{ padding: '20px' }}>Problem not found.</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <h1>{problem.title}</h1>
            <p><strong>Difficulty:</strong> {problem.difficulty}</p>

            <h2>Problem Description</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{problem.description}</p>

            <h2>Input Format</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{problem.inputFormat}</p>

            <h2>Output Format</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{problem.outputFormat}</p>

            <h2>Constraints</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{problem.constraints}</p>

            <h2>Sample Test Cases</h2>
            {problem.sampleTestCases.length === 0 ? (
                <p>No sample test cases available.</p>
            ) : (
                problem.sampleTestCases.map((testCase, index) => (
                    <div key={index} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', backgroundColor: '#f9f9f9' }}>
                        <h3>Sample {index + 1}</h3>
                        <div>
                            <strong>Input:</strong>
                            <pre style={{ backgroundColor: '#e0e0e0', padding: '5px', borderRadius: '3px' }}>{testCase.input}</pre>
                        </div>
                        <div>
                            <strong>Output:</strong>
                            <pre style={{ backgroundColor: '#e0e0e0', padding: '5px', borderRadius: '3px' }}>{testCase.output}</pre>
                        </div>
                    </div>
                ))
            )}

            <hr style={{ margin: '30px 0' }} />

            <h2>Submit Your Solution</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label htmlFor="language-select">Select Language:</label>
                <select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="cpp">C++</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    {/* Add more languages as you integrate judges */}
                </select>

                <label htmlFor="code-editor">Your Code:</label>
                <textarea
                    id="code-editor"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Write your code here..."
                    rows="15"
                    style={{ fontFamily: 'monospace', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                    required
                ></textarea>

                <button
                    type="submit"
                    style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    Submit Code
                </button>
            </form>
        </div>
    );
};

export default ProblemDetail;