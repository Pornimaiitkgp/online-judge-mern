// client/src/pages/ProblemDetail.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const ProblemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate(); // Initialize navigate
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('cpp'); // Default language
    const [submitMessage, setSubmitMessage] = useState('');
    const [submitError, setSubmitError] = useState('');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitMessage('');
        setSubmitError('');

        try {
            const token = localStorage.getItem('token'); // Get token from localStorage
            console.log("ProblemDetail: Token from localStorage:", token); // Add this log for debugging
            
            if (!token) {
                setSubmitError('You must be logged in to submit code.');
                navigate('/signin'); // Redirect to signin if not authenticated (not '/login')
                console.log("ProblemDetail: Token is missing, setting error and redirecting.");
                return;
            }

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    // *** FIX HERE: Change 'x-auth-token' to 'Authorization' with 'Bearer ' prefix ***
                    'Authorization': `Bearer ${token}` 
                }
            };

            const submissionData = {
                problemId: id,
                code,
                language
            };

            const response = await axios.post('/api/submissions', submissionData, config);
            setSubmitMessage(`Submission received! Status: ${response.data.status}. Submission ID: ${response.data.submissionId}`);
            // Optionally, clear the code editor after successful submission
            // setCode('');
            // You might want to redirect to a submission status page later
            // navigate(`/submissions/${response.data.submissionId}`);

        } catch (err) {
            console.error('Error submitting code:', err);
            // It's good practice to get the message from the response data if available
            setSubmitError(err.response?.data?.message || 'Failed to submit code. Please try again.');
        }
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
            {submitMessage && <p style={{ color: 'green' }}>{submitMessage}</p>}
            {submitError && <p style={{ color: 'red' }}>{submitError}</p>}
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