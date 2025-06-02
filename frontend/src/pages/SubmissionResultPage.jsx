import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './SubmissionResultPage.css'; // Create this CSS file for styling

const SubmissionResultPage = () => {
    const { submissionId } = useParams();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/submissions/${submissionId}`);
                setSubmission(response.data);
            } catch (err) {
                setError('Failed to load submission details.');
                console.error('Error fetching submission:', err);
            } finally {
                setLoading(false);
            }
        };

        if (submissionId) {
            fetchSubmission();
        }
    }, [submissionId]);

    if (loading) {
        return <div className="submission-result-container">Loading submission details...</div>;
    }

    if (error) {
        return <div className="submission-result-container error-message">{error}</div>;
    }

    if (!submission) {
        return <div className="submission-result-container">No submission found for this ID.</div>;
    }

    return (
        <div className="submission-result-container">
            <h2>Submission Results for ID: {submission.id}</h2>
            <div className="result-card">
                <p><strong>Problem:</strong> {submission.problemId}</p> {/* You might need to fetch problem title separately if not stored */}
                <p><strong>Language:</strong> {submission.language}</p>
                <p>
                    <strong>Status:</strong>{' '}
                    <span className={`status-${submission.status.toLowerCase().replace(/ /g, '-')}`}>
                        {submission.status}
                    </span>
                </p>
                <p>
                    <strong>Verdict:</strong>{' '}
                    <span className={`verdict-${submission.verdict.toLowerCase().replace(/ /g, '-')}`}>
                        {submission.verdict}
                    </span>
                </p>
                <p><strong>Test Cases Passed:</strong> {submission.testCasesPassed} / {submission.totalTestCases}</p>
                {submission.executionTime && <p><strong>Execution Time:</strong> {submission.executionTime} ms</p>}
                {submission.memoryUsed && <p><strong>Memory Used:</strong> {submission.memoryUsed}</p>}

                {submission.compilerOutput && (
                    <div className="output-section">
                        <h3>Compiler Output:</h3>
                        <pre className="compiler-output">{submission.compilerOutput}</pre>
                    </div>
                )}

                {submission.overallMessage && (
                     <div className="output-section">
                        <h3>Error/Detail Message:</h3>
                        <pre className="error-message-detail">{submission.overallMessage}</pre>
                    </div>
                )}

                {submission.detailedResults && submission.detailedResults.length > 0 && (
                    <div className="detailed-results">
                        <h3>Detailed Test Case Results:</h3>
                        {submission.detailedResults.map((result, index) => (
                            <div key={index} className={`test-case-result ${result.passed ? 'passed' : 'failed'}`}>
                                <h4>Test Case {index + 1}: {result.passed ? 'Passed' : 'Failed'}</h4>
                                {result.input && <p><strong>Input:</strong> <pre>{result.input}</pre></p>}
                                {result.expectedOutput && <p><strong>Expected Output:</strong> <pre>{result.expectedOutput}</pre></p>}
                                {result.actualOutput && <p><strong>Your Output:</strong> <pre>{result.actualOutput}</pre></p>}
                                {result.error && <p><strong>Error:</strong> <pre>{result.error}</pre></p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubmissionResultPage;