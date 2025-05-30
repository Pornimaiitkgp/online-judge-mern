// client/src/pages/ProblemList.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Assuming React Router DOM

const ProblemList = () => {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const response = await axios.get('/api/problems'); // Adjust API URL as needed
                setProblems(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching problems:', err);
                setError('Failed to fetch problems. Please try again later.');
                setLoading(false);
            }
        };

        fetchProblems();
    }, []);

    if (loading) {
        return <div>Loading problems...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Problems</h1>
            {problems.length === 0 ? (
                <p>No problems available yet.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Title</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Difficulty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {problems.map((problem) => (
                            <tr key={problem._id}>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    <Link to={`/problems/${problem._id}`}>{problem.title}</Link>
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{problem.difficulty}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {/* Optional: Admin only problem creation link */}
            {/* <Link to="/admin/create-problem">Create New Problem</Link> */}
        </div>
    );
};

export default ProblemList;