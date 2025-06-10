import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import './SubmissionResultPage.css';

const SubmissionResultPage = () => {
    const { submissionId } = useParams();
    const { currentUser } = useSelector((state) => state.user);

    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [aiReviewContent, setAiReviewContent] = useState('');
    const [aiReviewLoading, setAiReviewLoading] = useState(false);
    const [aiReviewError, setAiReviewError] = useState(null);
    const [showAiReviewSection, setShowAiReviewSection] = useState(false);

    useEffect(() => {
        const fetchSubmission = async () => {
            if (!submissionId) {
                setError('Submission ID is missing from the URL.');
                setLoading(false);
                return;
            }

            if (!currentUser || !currentUser.token) {
                setError('You must be logged in to view submission details.');
                setLoading(false);
                return;
            }

            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                    },
                    withCredentials: true
                };
                const response = await axios.get(`/api/submissions/${submissionId}`, config);
                setSubmission(response.data);
                console.log("Detailed Results received:", response.data.detailedResults);
            } catch (err) {
                console.error('Error fetching submission details:', err);
                setError(err.response?.data?.message || err.message || 'Failed to load submission details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubmission();
    }, [submissionId, currentUser]);

    const problemId = submission?.problem?._id || submission?.problem;

    const handleGetAIReview = async () => {
        if (!submission || !submission.code) {
            setAiReviewError('Cannot get AI review: Missing submitted code.');
            setShowAiReviewSection(true);
            return;
        }

        if (!currentUser || !currentUser.token) {
            setAiReviewError('You must be logged in to get an AI code review.');
            setShowAiReviewSection(true);
            return;
        }

        setAiReviewLoading(true);
        setAiReviewError(null);
        setAiReviewContent('');
        setShowAiReviewSection(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentUser.token}`,
                },
                withCredentials: true
            };

            const requestBody = {
                code: submission.code,
                problemId: problemId, 
            };

            const { data } = await axios.post('http://localhost:3000/ai-review', requestBody, config);

            setAiReviewContent(data.result);

        } catch (err) {
            console.error('Error getting AI review:', err);
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to get AI review. Please try again later.';
            setAiReviewError(errorMessage);
        } finally {
            setAiReviewLoading(false);
        }
    };

    if (loading) {
        console.log("SubmissionResultPage: Loading state.");
        return <div className="submission-result-container">Loading submission details...</div>;
    }

    if (error) {
        console.log("SubmissionResultPage: Error state.", error);
        return <div className="submission-result-container error-message">Error: {error}</div>;
    }

    if (!submission) {
        console.log("SubmissionResultPage: No submission found (null/undefined).");
        return <div className="submission-result-container">No submission found for this ID.</div>;
    }
    console.log("SubmissionResultPage: Rendering main content. Submission object:", submission);
    console.log("Submission status for rendering:", submission.status);
    console.log("Submission verdict for rendering:", submission.verdict);


    return (
        <div className="submission-result-container">
            <h2>Submission Results for Problem: {submission.problem ? submission.problem.title : submission.problemId}</h2>
            <div className="result-card">
                <p><strong>Language:</strong> {submission.language}</p>
                <p>
                    <strong>Status:</strong>{' '}
                    {submission.status ? (
                        <span className={`status-${submission.status?.toLowerCase().replace(/ /g, '-')}`}>
                            {submission.status}
                        </span>
                    ) : (
                        <span className="status-unknown">N/A</span>
                    )}
                </p>
                <p>
                    <strong>Verdict:</strong>{' '}
                    {submission.verdict ? (
                        <span className={`verdict-${submission.verdict?.toLowerCase().replace(/ /g, '-')}`}>
                            {submission.verdict}
                        </span>
                    ) : (
                        <span className="verdict-unknown">N/A</span>
                    )}
                </p>
                <p><strong>Test Cases Passed:</strong> {submission.testCasesPassed} / {submission.totalTestCases}</p>
                {/* {submission.executionTime && <p><strong>Execution Time:</strong> {submission.executionTime} ms</p>}
                {submission.memoryUsed && <p><strong>Memory Used:</strong> {submission.memoryUsed}</p>} */}

                {submission.code && (
                    <div className="output-section">
                        <h3>Your Submitted Code:</h3>
                        <pre className="submitted-code-display">{submission.code}</pre>
                    </div>
                )}

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

                {submission.detailedResults && 
                 submission.detailedResults.length > 0 && 
                 submission.verdict && 
                 submission.verdict?.toLowerCase() !== 'accepted' && (
            
                    <div className="detailed-results">
                        <h3>Detailed Test Case Results:</h3>
                        {submission.detailedResults.map((result, index) => (

                            <div key={index} className={`test-case-result ${result.passed ? 'passed' : 'failed'}`}>
    <h4>Test Case {index + 1}: {result.passed ? 'Passed' : 'Failed'}</h4>
    {result.input && (
        <div>
            <strong>Input:</strong> <pre>{result.input}</pre>
        </div>
    )}
    {result.expectedOutput && (
        <div>
            <strong>Expected Output:</strong> <pre>{result.expectedOutput}</pre>
        </div>
    )}
    {result.actualOutput && (
        <div>
            <strong>Your Output:</strong> <pre>{result.actualOutput}</pre>
        </div>
    )}
    {result.error && (
        <div>
            <strong>Error:</strong> <pre>{result.error}</pre>
        </div>
    )}
</div>

  ))}
        </div>
     )}
</div>

            {console.log("SubmissionResultPage: Attempting to render AI review button section.")}
            <div className="ai-review-section-control">
                <button
                    onClick={handleGetAIReview}
                    disabled={aiReviewLoading || !currentUser?.token || !submission?.code || !problemId} 
                    className="ai-review-button"
                >
                    {aiReviewLoading ? 'Getting AI Review...' : 'Get AI Code Review'}
                </button>
            </div>

            {console.log("SubmissionResultPage: Attempting to render AI review display area (conditional). showAiReviewSection:", showAiReviewSection)}
            {showAiReviewSection && (
                <div className="ai-review-display-area">
                    <h3>AI Code Review</h3>
                    {aiReviewError && (
                        <p className="ai-review-error">{aiReviewError}</p>
                    )}
                    {aiReviewLoading ? (
                        <p className="ai-review-loading">Analyzing your code, please wait...</p>
                    ) : aiReviewContent ? (
                        <div className="ai-review-content"
     dangerouslySetInnerHTML={{ __html: aiReviewContent.replace(/\n/g, '<br/>') }} />
                    ) : (
                        !aiReviewError && (
                            <p className="ai-review-placeholder">Click the button above to get an AI review of your code.</p>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default SubmissionResultPage;