// online_judge/frontend/src/pages/EditProblemPage.js

import React, { useState, useEffect } from 'react'; // Removed useContext
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
// import AuthContext from '../context/AuthContext.jsx'; // REMOVED AuthContext import
import { useSelector } from 'react-redux'; // NEW: Import useSelector from react-redux

const EditProblemPage = () => {
    const { id } = useParams(); // This is the problem ID to edit
    const navigate = useNavigate();
    // const { user } = useContext(AuthContext); // REMOVED: Get user from context
    const { currentUser, loading: authLoading } = useSelector((state) => state.user); // NEW: Get currentUser and loading from Redux

    const [problem, setProblem] = useState(null); // Stores the original problem data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        inputFormat: '',
        outputFormat: '',
        constraints: '',
        sampleTestCases: [{ input: '', output: '' }],
        hiddenTestCases: [{ input: '', output: '' }],
        timeLimit: 2000, // default 2 seconds
        memoryLimit: 128, // default 128 MB
        difficulty: 'Easy'
    });
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // console.log for debugging:
    console.log("EditProblemPage.js: currentUser from Redux:", currentUser);
    console.log("EditProblemPage.js: authLoading from Redux:", authLoading);


    useEffect(() => {
        // Only fetch problem if auth is not loading and user is an admin
        if (!authLoading) {
            if (!currentUser || !currentUser.isAdmin) {
                navigate('/'); // Or to a login/unauthorized page
                return;
            }

            const fetchProblem = async () => {
                try {
                    const response = await axios.get(`/api/problems/${id}`);
                    const problemData = response.data;
                    setProblem(problemData);
                    // Pre-fill form data with fetched problem details
                    setFormData({
                        title: problemData.title,
                        description: problemData.description,
                        inputFormat: problemData.inputFormat,
                        outputFormat: problemData.outputFormat,
                        constraints: problemData.constraints,
                        // Ensure test case arrays are always arrays, even if empty from backend
                        sampleTestCases: problemData.sampleTestCases && problemData.sampleTestCases.length > 0 ? problemData.sampleTestCases : [{ input: '', output: '' }],
                        hiddenTestCases: problemData.hiddenTestCases && problemData.hiddenTestCases.length > 0 ? problemData.hiddenTestCases : [{ input: '', output: '' }],
                        timeLimit: problemData.timeLimit,
                        memoryLimit: problemData.memoryLimit,
                        difficulty: problemData.difficulty
                    });
                    setLoading(false);
                } catch (err) {
                    console.error('Error fetching problem for edit:', err);
                    setError(err.response?.data?.message || 'Failed to load problem for editing.');
                    setLoading(false);
                }
            };

            fetchProblem();
        }
    }, [id, currentUser, navigate, authLoading]); // Added authLoading to dependencies

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleTestCaseChange = (index, type, field, value) => {
        const list = formData[type];
        const updatedList = list.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        setFormData({ ...formData, [type]: updatedList });
    };

    const addTestCase = (type) => {
        setFormData({
            ...formData,
            [type]: [...formData[type], { input: '', output: '' }]
        });
    };

    const removeTestCase = (index, type) => {
        const list = formData[type];
        if (list.length > 1) { // Ensure at least one blank test case remains, or allow empty
            const updatedList = list.filter((_, i) => i !== index);
            setFormData({ ...formData, [type]: updatedList });
        } else {
            // Optionally clear the last one if only one remains (depends on desired behavior)
            // For now, allow deletion if only one is left
            setFormData({ ...formData, [type]: [{ input: '', output: '' }] });
        }
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setMessage('');

    // Basic validation (can be expanded)
    if (!formData.title || !formData.description || !formData.timeLimit || !formData.memoryLimit) {
        setError('Please fill in all required fields.');
        setSubmitLoading(false);
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        // --- IMPORTANT MODIFICATION START ---
        // Create a cleaned-up object to send to the backend
        const dataToSend = { ...formData };

        // 1. Remove 'createdBy' from formData if it exists, as it's not meant to be updated by client
        // This field should be handled on the backend for creation and ignored for update.
        delete dataToSend.createdBy;
        // Also remove _id if it's accidentally in formData, as it's in the URL param
        delete dataToSend._id;
        delete dataToSend.createdAt; // Also remove createdAt if present

        // 2. Filter out empty sample and hidden test cases
        dataToSend.sampleTestCases = dataToSend.sampleTestCases.filter(
            tc => tc.input.trim() !== '' || tc.output.trim() !== ''
        );
        dataToSend.hiddenTestCases = dataToSend.hiddenTestCases.filter(
            tc => tc.input.trim() !== '' || tc.output.trim() !== ''
        );
        // --- IMPORTANT MODIFICATION END ---

        // Send the cleaned dataToSend object
        await axios.put(`/api/problems/${id}`, dataToSend, config); // Use dataToSend
        setMessage('Problem updated successfully!');
        setSubmitLoading(false);
        navigate(`/problems/${id}`); // Go back to the problem detail page
    } catch (err) {
        console.error('Error updating problem:', err);
        setError(err.response?.data?.message || 'Failed to update problem.');
        setSubmitLoading(false);
    }
};
    // Render loading state for Redux auth and problem data
    if (authLoading || loading) {
        return <div style={{ padding: '20px' }}>Loading authentication or problem data...</div>;
    }

    // Render access denied if not admin (after authLoading is false)
    if (!currentUser || !currentUser.isAdmin) {
        return <div style={{ padding: '20px', color: 'red' }}>Access Denied: You must be an admin to edit problems.</div>;
    }

    // Render error if problem failed to load (and not due to auth denied)
    if (error && !problem) {
        return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <h1>Edit Problem: {problem?.title}</h1>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* Basic Details */}
                <label>Title:</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required />

                <label>Description:</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows="5"></textarea>

                <label>Input Format:</label>
                <textarea name="inputFormat" value={formData.inputFormat} onChange={handleChange} rows="3"></textarea>

                <label>Output Format:</label>
                <textarea name="outputFormat" value={formData.outputFormat} onChange={handleChange} rows="3"></textarea>

                <label>Constraints:</label>
                <textarea name="constraints" value={formData.constraints} onChange={handleChange} rows="3"></textarea>

                <label>Time Limit (ms):</label>
                <input type="number" name="timeLimit" value={formData.timeLimit} onChange={handleChange} required />

                <label>Memory Limit (MB):</label>
                <input type="number" name="memoryLimit" value={formData.memoryLimit} onChange={handleChange} required />

                <label>Difficulty:</label>
                <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                </select>

                {/* Sample Test Cases */}
                <h2>Sample Test Cases</h2>
                {formData.sampleTestCases.map((testCase, index) => (
                    <div key={index} style={{ border: '1px dashed #ccc', padding: '10px', marginBottom: '10px' }}>
                        <h4>Sample Test Case {index + 1}</h4>
                        <label>Input:</label>
                        <textarea
                            value={testCase.input}
                            onChange={(e) => handleTestCaseChange(index, 'sampleTestCases', 'input', e.target.value)}
                            rows="3"
                        ></textarea>
                        <label>Output:</label>
                        <textarea
                            value={testCase.output}
                            onChange={(e) => handleTestCaseChange(index, 'sampleTestCases', 'output', e.target.value)}
                            rows="3"
                        ></textarea>
                        <button type="button" onClick={() => removeTestCase(index, 'sampleTestCases')} style={{ marginTop: '5px', backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>
                            Remove Sample
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => addTestCase('sampleTestCases')} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '4px' }}>
                    Add Sample Test Case
                </button>

                {/* Hidden Test Cases */}
                <h2>Hidden Test Cases</h2>
                {formData.hiddenTestCases.map((testCase, index) => (
                    <div key={index} style={{ border: '1px dashed #ccc', padding: '10px', marginBottom: '10px' }}>
                        <h4>Hidden Test Case {index + 1}</h4>
                        <label>Input:</label>
                        <textarea
                            value={testCase.input}
                            onChange={(e) => handleTestCaseChange(index, 'hiddenTestCases', 'input', e.target.value)}
                            rows="3"
                        ></textarea>
                        <label>Output:</label>
                        <textarea
                            value={testCase.output}
                            onChange={(e) => handleTestCaseChange(index, 'hiddenTestCases', 'output', e.target.value)}
                            rows="3"
                        ></textarea>
                        <button type="button" onClick={() => removeTestCase(index, 'hiddenTestCases')} style={{ marginTop: '5px', backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>
                            Remove Hidden
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => addTestCase('hiddenTestCases')} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '4px' }}>
                    Add Hidden Test Case
                </button>

                <button
                    type="submit"
                    disabled={submitLoading}
                    style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' }}
                >
                    {submitLoading ? 'Updating Problem...' : 'Update Problem'}
                </button>
            </form>
        </div>
    );
};

export default EditProblemPage;