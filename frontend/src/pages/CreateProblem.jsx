// client/src/pages/CreateProblem.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateProblem = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'Easy',
        inputFormat: '',
        outputFormat: '',
        sampleTestCases: [{ input: '', output: '' }],
        constraints: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTestCaseChange = (index, e) => {
        const newTestCases = [...formData.sampleTestCases];
        newTestCases[index][e.target.name] = e.target.value;
        setFormData({ ...formData, sampleTestCases: newTestCases });
    };

    const addTestCase = () => {
        setFormData({
            ...formData,
            sampleTestCases: [...formData.sampleTestCases, { input: '', output: '' }]
        });
    };

    const removeTestCase = (index) => {
        const newTestCases = formData.sampleTestCases.filter((_, i) => i !== index);
        setFormData({ ...formData, sampleTestCases: newTestCases });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            // Get token from localStorage (assuming it's stored after login)
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required. Please log in as an admin.');
                return;
            }

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token // Send JWT token in header
                }
            };
            const response = await axios.post('/api/problems', formData, config);
            setMessage('Problem created successfully!');
            setFormData({
                title: '',
                description: '',
                difficulty: 'Easy',
                inputFormat: '',
                outputFormat: '',
                sampleTestCases: [{ input: '', output: '' }],
                constraints: ''
            });
            navigate('/problems'); // Redirect to problem list after creation
        } catch (err) {
            console.error('Error creating problem:', err);
            setError(err.response?.data?.message || 'Failed to create problem. Please check your input.');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Create New Problem</h1>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                    type="text"
                    name="title"
                    placeholder="Problem Title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                />
                <textarea
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="5"
                    required
                ></textarea>
                <select name="difficulty" value={formData.difficulty} onChange={handleChange} required>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                </select>
                <textarea
                    name="inputFormat"
                    placeholder="Input Format"
                    value={formData.inputFormat}
                    onChange={handleChange}
                    rows="3"
                    required
                ></textarea>
                <textarea
                    name="outputFormat"
                    placeholder="Output Format"
                    value={formData.outputFormat}
                    onChange={handleChange}
                    rows="3"
                    required
                ></textarea>
                <textarea
                    name="constraints"
                    placeholder="Constraints"
                    value={formData.constraints}
                    onChange={handleChange}
                    rows="3"
                    required
                ></textarea>

                <h3>Sample Test Cases:</h3>
                {formData.sampleTestCases.map((testCase, index) => (
                    <div key={index} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                        <h4>Test Case {index + 1}</h4>
                        <textarea
                            name="input"
                            placeholder="Input"
                            value={testCase.input}
                            onChange={(e) => handleTestCaseChange(index, e)}
                            rows="2"
                            required
                        ></textarea>
                        <textarea
                            name="output"
                            placeholder="Output"
                            value={testCase.output}
                            onChange={(e) => handleTestCaseChange(index, e)}
                            rows="2"
                            required
                        ></textarea>
                        {formData.sampleTestCases.length > 1 && (
                            <button type="button" onClick={() => removeTestCase(index)}>
                                Remove Test Case
                            </button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addTestCase}>
                    Add Test Case
                </button>

                <button type="submit" style={{ marginTop: '20px', padding: '10px', backgroundColor: 'blue', color: 'white' }}>
                    Create Problem
                </button>
            </form>
        </div>
    );
};

export default CreateProblem;