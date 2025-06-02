// client/src/pages/SubmissionDetail.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const SubmissionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Log the ID to console for debugging purposes, placed inside useEffect to run on mount/id change
        console.log('Submission ID from URL:', id);

        // Defensive check: If ID is not available, set an error and stop
        if (!id) {
            setError('Submission ID is missing from the URL. Please check the link or ensure a valid ID is provided.');
            setLoading(false);
            return; // Prevent the API call from even attempting if ID is missing
        }

        const fetchSubmission = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('You must be logged in to view submission details.');
                setLoading(false);
                navigate('/login'); // Redirect to login if no token
                return;
            }

            try {
                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                };
                // Make sure the ID is correctly appended to the URL
                const response = await axios.get(`/api/submissions/${id}`, config);
                setSubmission(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching submission:', err);
                // Attempt to get a more specific message from the backend response
                setError(err.response?.data?.message || 'Failed to fetch submission details. Please try again.');
                setLoading(false);
            }
        };

        fetchSubmission();
    }, [id, navigate]); // `id` and `Maps` are correct dependencies for useEffect

    // Determine color for status
    const getStatusColor = (status) => {
        switch (status) {
            case 'Accepted': return 'green';
            case 'Wrong Answer': return 'red';
            case 'Time Limit Exceeded': return 'orange';
            case 'Memory Limit Exceeded': return 'purple';
            case 'Runtime Error': return 'darkred';
            case 'Compilation Error': return 'brown';
            case 'Pending': return 'blue';
            case 'Compiling': return 'deepskyblue';
            case 'Judging': return 'violet';
            case 'No Test Cases': return 'gray';
            case 'Error': return 'black'; // For general backend errors
            default: return 'gray';
        }
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading submission details...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
    }

    if (!submission) {
        // This might happen if the ID was valid but no submission was found by the backend (e.g., 404 response not handled specifically)
        return <div style={{ padding: '20px' }}>Submission not found.</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
            <h1>Submission Details</h1>
            <p><strong>Problem:</strong> {submission.problem ? submission.problem.title : 'N/A'}</p>
            <p><strong>Language:</strong> {submission.language.toUpperCase()}</p>
            <p>
                <strong>Status:</strong> <span style={{ color: getStatusColor(submission.status), fontWeight: 'bold' }}>{submission.status}</span>
            </p>
            {submission.status === 'Accepted' && submission.executionTime && (
                <>
                    <p><strong>Execution Time:</strong> {submission.executionTime.toFixed(2)} ms</p>
                    {/* <p><strong>Memory Used:</strong> {submission.memoryUsed ? `${submission.memoryUsed} KB` : 'N/A'}</p> */}
                </>
            )}
            {/* Show overall output if it's not Accepted (e.g., compilation error, or general message) */}
            {submission.output && submission.status !== 'Accepted' && (
                <p><strong>Overall Message:</strong> <span style={{ color: getStatusColor(submission.status) }}>{submission.output}</span></p>
            )}
            <p><strong>Test Cases Passed:</strong> {submission.testCasesPassed}/{submission.totalTestCases}</p>
            <p><strong>Submitted At:</strong> {new Date(submission.submittedAt).toLocaleString()}</p>
            {submission.judgedAt && <p><strong>Judged At:</strong> {new Date(submission.judgedAt).toLocaleString()}</p>}


            <h2 style={{ marginTop: '30px' }}>Submitted Code</h2>
            <pre style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '5px', overflowX: 'auto', border: '1px solid #ddd' }}>
                <code>{submission.code}</code>
            </pre>

            {submission.detailedResults && submission.detailedResults.length > 0 && (
                <>
                    <h2 style={{ marginTop: '30px' }}>Test Case Results ({submission.detailedResults.filter(r => r.isSample).length} Sample, {submission.detailedResults.filter(r => !r.isSample).length} Hidden)</h2>
                    {submission.detailedResults.map((tcResult, index) => (
                        <div key={index} style={{ border: `1px solid ${getStatusColor(tcResult.status)}`, padding: '15px', marginBottom: '20px', borderRadius: '5px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                            <h3>
                                Test Case {tcResult.testCase} ({tcResult.isSample ? 'Sample' : 'Hidden'})
                                <span style={{ color: getStatusColor(tcResult.status), float: 'right' }}>{tcResult.status}</span>
                            </h3>
                            {tcResult.message && tcResult.status !== 'Passed' && (
                                <p style={{ color: getStatusColor(tcResult.status), fontWeight: 'bold' }}>Reason: {tcResult.message}</p>
                            )}
                            <p><strong>Execution Time:</strong> {tcResult.executionTime ? `${tcResult.executionTime.toFixed(2)} ms` : 'N/A'}</p>
                            {/* <p><strong>Memory Used:</strong> {tcResult.memoryUsed ? `${tcResult.memoryUsed} KB` : 'N/A'}</p> */}

                            <div style={{ marginTop: '15px' }}>
                                <h4>Input:</h4>
                                <pre style={{ backgroundColor: '#e9e9e9', padding: '10px', borderRadius: '3px', overflowX: 'auto' }}>{tcResult.input}</pre>
                            </div>

                            {/* Only show expected/user output if it's not a compilation error or general error */}
                            {tcResult.status !== 'Compilation Error' && tcResult.status !== 'Error' && (
                                <>
                                    <div style={{ marginTop: '10px' }}>
                                        <h4>Expected Output:</h4>
                                        <pre style={{ backgroundColor: '#e9e9e9', padding: '10px', borderRadius: '3px', overflowX: 'auto' }}>{tcResult.expectedOutput}</pre>
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <h4>Your Output:</h4>
                                        <pre style={{ backgroundColor: (tcResult.status === 'Passed' ? '#e9e9e9' : '#ffe0e0'), padding: '10px', borderRadius: '3px', overflowX: 'auto', border: (tcResult.status === 'Passed' ? 'none' : '1px solid red') }}>{tcResult.userOutput}</pre>
                                    </div>
                                </>
                            )}
                            {/* Show detailed error output if available for compilation/runtime errors */}
                            {(tcResult.status === 'Compilation Error' || tcResult.status === 'Runtime Error' || tcResult.status === 'Error') && tcResult.userOutput && (
                                <div style={{ marginTop: '10px' }}>
                                    <h4>Error Output:</h4>
                                    <pre style={{ backgroundColor: '#ffe0e0', padding: '10px', borderRadius: '3px', overflowX: 'auto', border: '1px solid red', color: 'darkred' }}>{tcResult.userOutput}</pre>
                                </div>
                            )}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};

export default SubmissionDetail;