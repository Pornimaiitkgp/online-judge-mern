// online_judge/frontend/src/pages/ProblemList.jsx

import React, { useState, useEffect } from 'react'; // Removed useContext
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
// import AuthContext from '../context/AuthContext.jsx'; // REMOVED AuthContext import
import { useSelector } from 'react-redux'; // NEW: Add useSelector

const ProblemList = () => {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteMessage, setDeleteMessage] = useState('');
    const [deleteError, setDeleteError] = useState('');

    // const { user, loading: authLoading } = useContext(AuthContext); // REMOVED AuthContext
    const { currentUser, loading: authLoading } = useSelector((state) => state.user); // NEW: Get currentUser and authLoading from Redux

    const navigate = useNavigate();

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

        // Fetch problems regardless of login, but only show admin buttons if user is admin.
        fetchProblems();
    }, []); // Empty dependency array means this runs once on mount

    const handleDeleteProblem = async (problemId) => {
        // Use currentUser from Redux for authorization check
        if (!currentUser || !currentUser.isAdmin) {
            setDeleteError('You are not authorized to delete problems.');
            return;
        }

        if (window.confirm('Are you sure you want to delete this problem? This action cannot be undone.')) {
            setDeleteMessage('');
            setDeleteError('');
            try {
                const token = localStorage.getItem('token'); // Get token from localStorage for API calls

                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                };
                await axios.delete(`/api/problems/${problemId}`, config);
                setDeleteMessage('Problem deleted successfully!');
                // Remove the deleted problem from the state to update the UI
                setProblems(problems.filter(problem => problem._id !== problemId));
            } catch (err) {
                console.error('Error deleting problem:', err);
                setDeleteError(err.response?.data?.message || 'Failed to delete problem. Please try again.');
            }
        }
    };

    const handleEditProblem = (problemId) => {
        // Use currentUser from Redux for authorization check
        if (!currentUser || !currentUser.isAdmin) {
            setDeleteError('You are not authorized to edit problems.'); // Reusing error state for simplicity
            return;
        }
        navigate(`/admin/problems/edit/${problemId}`);
    };

    // If AuthContext (now Redux) is still loading, show a loading state for the list itself
    if (authLoading || loading) { // Combined loading states
        return <div>Loading problems...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
            <h1>All Problems</h1>
            {deleteMessage && <p style={{ color: 'green' }}>{deleteMessage}</p>}
            {deleteError && <p style={{ color: 'red' }}>{deleteError}</p>}

            {/* Optional: Add a button for admins to create new problems */}
            {currentUser && currentUser.isAdmin && ( // Use currentUser for check
                <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                    <Link to="/admin/problems/new" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                        Create New Problem
                    </Link>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {problems.map((problem) => (
                    <div key={problem._id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        <h3>
                            <Link to={`/problems/${problem._id}`} style={{ textDecoration: 'none', color: '#007bff' }}>
                                {problem.title}
                            </Link>
                        </h3>
                        <p><strong>Difficulty:</strong> {problem.difficulty}</p>
                        <p><strong>Time Limit:</strong> {problem.timeLimit / 1000} seconds</p>
                        <p><strong>Memory Limit:</strong> {problem.memoryLimit} MB</p>

                        {/* Admin buttons for Edit/Delete */}
                        {currentUser && currentUser.isAdmin && ( // Use currentUser for check
                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleEditProblem(problem._id)}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#ffc107',
                                        color: 'black',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteProblem(problem._id)}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProblemList;