// client/src/pages/MySubmissions.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const MySubmissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubmissions = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('You must be logged in to view your submissions.');
                setLoading(false);
                navigate('/login');
                return;
            }

            try {
                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                };
                const response = await axios.get('/api/submissions/me', config);
                setSubmissions(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching submissions:', err);
                setError(err.response?.data?.message || 'Failed to fetch submissions.');
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, [navigate]);

    // Helper for status color
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
        return <div style={{ padding: '20px' }}>Loading submissions...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>My Submissions</h1>
            {submissions.length === 0 ? (
                <p>You have not made any submissions yet.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Problem</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Language</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Test Cases</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Time</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Memory</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Submitted At</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.map((submission) => (
                            <tr key={submission._id}>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    {/* Ensure submission.problem exists before accessing its properties */}
                                    <Link to={`/problems/${submission.problem?._id}`}>{submission.problem?.title || 'N/A'}</Link>
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{submission.language.toUpperCase()}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px', color: getStatusColor(submission.status), fontWeight: 'bold' }}>{submission.status}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{submission.testCasesPassed}/{submission.totalTestCases}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{submission.executionTime ? `${submission.executionTime.toFixed(2)} ms` : 'N/A'}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{submission.memoryUsed ? `${submission.memoryUsed} KB` : 'N/A'}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(submission.submittedAt).toLocaleString()}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    {/* This link was confirmed to be correct based on your network tab */}
                                    <Link to={`/submissions/${submission._id}`}>View</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default MySubmissions;