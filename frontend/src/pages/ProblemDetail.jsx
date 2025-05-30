import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// You'll likely need an API service later
// import { getProblemById } from '../services/problemService';

function ProblemDetail() {
    const { id } = useParams(); // Get the 'id' from the URL
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // This useEffect will fetch the problem details when the component mounts
    useEffect(() => {
        const fetchProblem = async () => {
            setLoading(true);
            setError(null);
            try {
                // IMPORTANT: Ensure your backend is running at http://localhost:3000 (or whatever port you set)
                // This fetches from your backend API
                const response = await fetch(`http://localhost:3000/api/problems/${id}`);
                if (!response.ok) {
                    // Check for 404 specifically if the problem doesn't exist
                    if (response.status === 404) {
                        setProblem(null); // Explicitly set problem to null if not found
                        throw new Error("Problem not found.");
                    }
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                setProblem(data);
            } catch (err) {
                console.error("Failed to fetch problem details:", err);
                setError(err.message || "Failed to load problem details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProblem();
        }
    }, [id]); // Re-run when the 'id' changes

    if (loading) return <div style={{ padding: '20px' }}>Loading problem...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
    // This handles the case where loading is false, no error, but no problem was found (e.g., 404)
    if (!problem) return <div style={{ padding: '20px' }}>Problem not found.</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto', lineHeight: '1.6' }}>
            <h1 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                {problem.title} ({problem.difficulty})
            </h1>
            <div style={{ marginBottom: '20px' }}>
                <h2>Description</h2>
                <p>{problem.description}</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <h2>Input Format</h2>
                <pre style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px', overflowX: 'auto' }}>
                    <code>{problem.inputFormat}</code>
                </pre>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <h2>Output Format</h2>
                <pre style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px', overflowX: 'auto' }}>
                    <code>{problem.outputFormat}</code>
                </pre>
            </div>
            {problem.sampleTestCases && problem.sampleTestCases.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h2>Sample Test Cases</h2>
                    {problem.sampleTestCases.map((testCase, index) => (
                        <div key={index} style={{ marginBottom: '15px', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                            <h3>Sample {index + 1}</h3>
                            <h4>Input:</h4>
                            <pre style={{ backgroundColor: '#eee', padding: '8px', borderRadius: '3px', overflowX: 'auto' }}>
                                <code>{testCase.input}</code>
                            </pre>
                            <h4>Output:</h4>
                            <pre style={{ backgroundColor: '#eee', padding: '8px', borderRadius: '3px', overflowX: 'auto' }}>
                                <code>{testCase.output}</code>
                            </pre>
                        </div>
                    ))}
                </div>
            )}
            {problem.constraints && (
                <div style={{ marginBottom: '20px' }}>
                    <h2>Constraints</h2>
                    <p>{problem.constraints}</p>
                </div>
            )}
            {/* You'll add submission form/editor here later */}
        </div>
    );
}

export default ProblemDetail;