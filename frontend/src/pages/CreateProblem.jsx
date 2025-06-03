// // online_judge/frontend/src/pages/CreateProblem.jsx

// import React, { useState, useEffect, useContext } from 'react'; // NEW: useEffect, useContext
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import AuthContext from '../context/AuthContext.jsx'; // NEW: Import AuthContext

// const CreateProblem = () => {
//     const navigate = useNavigate();
//     const { user, token, loading: authLoading } = useContext(AuthContext); // NEW: Get user, token, authLoading from AuthContext

//     const [formData, setFormData] = useState({
//         title: '',
//         description: '',
//         difficulty: 'Easy',
//         inputFormat: '',
//         outputFormat: '',
//         sampleTestCases: [{ input: '', output: '' }],
//         hiddenTestCases: [{ input: '', output: '' }], // Added hiddenTestCases as per backend model
//         timeLimit: 2000, // Default for 2 seconds
//         memoryLimit: 128, // Default for 128 MB
//         constraints: ''
//     });
//     const [message, setMessage] = useState('');
//     const [error, setError] = useState('');
//     const [submitLoading, setSubmitLoading] = useState(false); // To manage form submission loading

//     // Redirect if not admin or if auth is still loading
//     useEffect(() => {
//         if (!authLoading) { // Only check after AuthContext has loaded
//             if (!user || user.role !== 'admin') {
//                 navigate('/'); // Redirect to home or a forbidden page
//             }
//         }
//     }, [user, authLoading, navigate]);


//     const handleChange = (e) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleTestCaseChange = (type, index, e) => { // Updated to handle different test case types
//         const newTestCases = [...formData[type]];
//         newTestCases[index][e.target.name] = e.target.value;
//         setFormData({ ...formData, [type]: newTestCases });
//     };

//     const addTestCase = (type) => { // Updated to handle different test case types
//         setFormData({
//             ...formData,
//             [type]: [...formData[type], { input: '', output: '' }]
//         });
//     };

//     const removeTestCase = (type, index) => { // Updated to handle different test case types
//         const list = formData[type];
//         if (list.length > 1) { // Ensure at least one blank test case remains
//             const newTestCases = list.filter((_, i) => i !== index);
//             setFormData({ ...formData, [type]: newTestCases });
//         } else {
//             // Optionally clear the last one if only one remains
//             setFormData({ ...formData, [type]: [{ input: '', output: '' }] });
//         }
//     };


//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setSubmitLoading(true); // Start loading for form submission
//         setMessage('');
//         setError('');

//         if (!user || user.role !== 'admin' || !token) { // Double check auth and token
//             setError('Authentication required or not authorized as admin.');
//             setSubmitLoading(false);
//             return;
//         }

//         try {
//             const config = {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}` // Use token from AuthContext
//                 }
//             };
//             const response = await axios.post('/api/problems', formData, config);
//             setMessage('Problem created successfully!');
//             setFormData({ // Reset form after successful submission
//                 title: '',
//                 description: '',
//                 difficulty: 'Easy',
//                 inputFormat: '',
//                 outputFormat: '',
//                 sampleTestCases: [{ input: '', output: '' }],
//                 hiddenTestCases: [{ input: '', output: '' }],
//                 timeLimit: 2000,
//                 memoryLimit: 128,
//                 constraints: ''
//             });
//             navigate('/problems'); // Redirect to problem list
//         } catch (err) {
//             console.error('Error creating problem:', err);
//             setError(err.response?.data?.message || 'Failed to create problem. Please check your input.');
//         } finally {
//             setSubmitLoading(false); // End loading
//         }
//     };

//     if (authLoading) {
//         return <div style={{ padding: '20px' }}>Loading authentication...</div>;
//     }

//     if (!user || user.role !== 'admin') {
//         return <div style={{ padding: '20px', color: 'red' }}>Access Denied: You must be an admin to create problems.</div>;
//     }

//     return (
//         <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
//             <h1>Create New Problem</h1>
//             {message && <p style={{ color: 'green' }}>{message}</p>}
//             {error && <p style={{ color: 'red' }}>{error}</p>}
//             <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
//                 <label>Title:</label>
//                 <input
//                     type="text"
//                     name="title"
//                     placeholder="Problem Title"
//                     value={formData.title}
//                     onChange={handleChange}
//                     required
//                 />
//                 <label>Description:</label>
//                 <textarea
//                     name="description"
//                     placeholder="Description"
//                     value={formData.description}
//                     onChange={handleChange}
//                     rows="5"
//                     required
//                 ></textarea>
//                 <label>Difficulty:</label>
//                 <select name="difficulty" value={formData.difficulty} onChange={handleChange} required>
//                     <option value="Easy">Easy</option>
//                     <option value="Medium">Medium</option>
//                     <option value="Hard">Hard</option>
//                 </select>
//                 <label>Input Format:</label>
//                 <textarea
//                     name="inputFormat"
//                     placeholder="Input Format"
//                     value={formData.inputFormat}
//                     onChange={handleChange}
//                     rows="3"
//                     required
//                 ></textarea>
//                 <label>Output Format:</label>
//                 <textarea
//                     name="outputFormat"
//                     placeholder="Output Format"
//                     value={formData.outputFormat}
//                     onChange={handleChange}
//                     rows="3"
//                     required
//                 ></textarea>
//                 <label>Constraints:</label>
//                 <textarea
//                     name="constraints"
//                     placeholder="Constraints"
//                     value={formData.constraints}
//                     onChange={handleChange}
//                     rows="3"
//                     required
//                 ></textarea>
//                 <label>Time Limit (ms):</label>
//                 <input type="number" name="timeLimit" value={formData.timeLimit} onChange={handleChange} required />

//                 <label>Memory Limit (MB):</label>
//                 <input type="number" name="memoryLimit" value={formData.memoryLimit} onChange={handleChange} required />


//                 <h3>Sample Test Cases:</h3>
//                 {formData.sampleTestCases.map((testCase, index) => (
//                     <div key={index} style={{ border: '1px dashed #ccc', padding: '10px', marginBottom: '10px' }}>
//                         <h4>Sample Test Case {index + 1}</h4>
//                         <label>Input:</label>
//                         <textarea
//                             name="input"
//                             placeholder="Input"
//                             value={testCase.input}
//                             onChange={(e) => handleTestCaseChange('sampleTestCases', index, e)}
//                             rows="2"
//                             required
//                         ></textarea>
//                         <label>Output:</label>
//                         <textarea
//                             name="output"
//                             placeholder="Output"
//                             value={testCase.output}
//                             onChange={(e) => handleTestCaseChange('sampleTestCases', index, e)}
//                             rows="2"
//                             required
//                         ></textarea>
//                         <button type="button" onClick={() => removeTestCase('sampleTestCases', index)} style={{ marginTop: '5px', backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>
//                             Remove Sample Test Case
//                         </button>
//                     </div>
//                 ))}
//                 <button type="button" onClick={() => addTestCase('sampleTestCases')} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '4px' }}>
//                     Add Sample Test Case
//                 </button>

//                 <h3>Hidden Test Cases:</h3> {/* Added Hidden Test Cases section */}
//                 {formData.hiddenTestCases.map((testCase, index) => (
//                     <div key={index} style={{ border: '1px dashed #ccc', padding: '10px', marginBottom: '10px' }}>
//                         <h4>Hidden Test Case {index + 1}</h4>
//                         <label>Input:</label>
//                         <textarea
//                             name="input"
//                             placeholder="Input"
//                             value={testCase.input}
//                             onChange={(e) => handleTestCaseChange('hiddenTestCases', index, e)}
//                             rows="2"
//                             required
//                         ></textarea>
//                         <label>Output:</label>
//                         <textarea
//                             name="output"
//                             placeholder="Output"
//                             value={testCase.output}
//                             onChange={(e) => handleTestCaseChange('hiddenTestCases', index, e)}
//                             rows="2"
//                             required
//                         ></textarea>
//                         <button type="button" onClick={() => removeTestCase('hiddenTestCases', index)} style={{ marginTop: '5px', backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>
//                             Remove Hidden Test Case
//                         </button>
//                     </div>
//                 ))}
//                 <button type="button" onClick={() => addTestCase('hiddenTestCases')} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '4px' }}>
//                     Add Hidden Test Case
//                 </button>


//                 <button 
//                     type="submit" 
//                     disabled={submitLoading} // Disable button during submission
//                     style={{ marginTop: '20px', padding: '10px', backgroundColor: 'blue', color: 'white' }}>
//                     {submitLoading ? 'Creating...' : 'Create Problem'}
//                 </button>
//             </form>
//         </div>
//     );
// };

// export default CreateProblem;




// online_judge/frontend/src/pages/CreateProblem.jsx

import React, { useState, useEffect } from 'react'; // Removed useContext
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// import AuthContext from '../context/AuthContext.jsx'; // Removed AuthContext import
import { useSelector } from 'react-redux'; // NEW: Import useSelector from react-redux

const CreateProblem = () => {
    const navigate = useNavigate();
    // Use useSelector to get user and loading state from Redux store
    const { currentUser, loading: authLoading } = useSelector((state) => state.user); // NEW: Get currentUser from Redux

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'Easy',
        inputFormat: '',
        outputFormat: '',
        sampleTestCases: [{ input: '', output: '' }],
        hiddenTestCases: [{ input: '', output: '' }],
        timeLimit: 2000,
        memoryLimit: 128,
        constraints: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    // console.log statements for debugging (can remove later)
    console.log("CreateProblem.jsx: currentUser from Redux:", currentUser);
    console.log("CreateProblem.jsx: authLoading from Redux:", authLoading);

    // Redirect if not admin or if auth is still loading
    useEffect(() => {
        // Use Redux's authLoading
        if (!authLoading) {
            // Use Redux's currentUser for the check
            if (!currentUser || !currentUser.isAdmin) { // Check for currentUser.isAdmin (assuming Redux user object has it)
                navigate('/'); // Redirect to home or a forbidden page
            }
        }
    }, [currentUser, authLoading, navigate]); // Dependencies updated to Redux state


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTestCaseChange = (type, index, e) => {
        const newTestCases = [...formData[type]];
        newTestCases[index][e.target.name] = e.target.value;
        setFormData({ ...formData, [type]: newTestCases });
    };

    const addTestCase = (type) => {
        setFormData({
            ...formData,
            [type]: [...formData[type], { input: '', output: '' }]
        });
    };

    const removeTestCase = (type, index) => {
        const list = formData[type];
        if (list.length > 1) {
            const newTestCases = list.filter((_, i) => i !== index);
            setFormData({ ...formData, [type]: newTestCases });
        } else {
            setFormData({ ...formData, [type]: [{ input: '', output: '' }] });
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setMessage('');
        setError('');

        // Use Redux's currentUser for the check, and get token from local storage (if needed) or from Redux if stored there
        // Assuming token is still managed in AuthContext/localStorage for API calls, or can be added to Redux user state
        const tokenForApi = localStorage.getItem('token'); // Get token for API call

        if (!currentUser || !currentUser.isAdmin || !tokenForApi) { // Check currentUser.isAdmin and token
            setError('Authentication required or not authorized as admin.');
            setSubmitLoading(false);
            return;
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenForApi}` // Use token from localStorage/Redux
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
                hiddenTestCases: [{ input: '', output: '' }],
                timeLimit: 2000,
                memoryLimit: 128,
                constraints: ''
            });
            navigate('/problems');
        } catch (err) {
            console.error('Error creating problem:', err);
            setError(err.response?.data?.message || 'Failed to create problem. Please check your input.');
        } finally {
            setSubmitLoading(false);
        }
    };

    // Use Redux's authLoading
    if (authLoading) {
        return <div style={{ padding: '20px' }}>Loading authentication...</div>;
    }

    // Use Redux's currentUser for the final check
    if (!currentUser || !currentUser.isAdmin) {
        return <div style={{ padding: '20px', color: 'red' }}>Access Denied: You must be an admin to create problems.</div>;
    }

    // --- MAIN RENDER (using only Section 1 and 4 for now) ---
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto', border: '2px solid green' }}>
            <h1>Create New Problem - Heading Test (Redux)</h1>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* --- START SECTION 1: Basic Problem Details --- */}
                <label>Title:</label>
                <input
                    type="text"
                    name="title"
                    placeholder="Problem Title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                />
                <label>Description:</label>
                <textarea
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="5"
                    required
                ></textarea>
                <label>Difficulty:</label>
                <select name="difficulty" value={formData.difficulty} onChange={handleChange} required>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                </select>
                <label>Input Format:</label>
                <textarea
                    name="inputFormat"
                    placeholder="Input Format"
                    value={formData.inputFormat}
                    onChange={handleChange}
                    rows="3"
                    required
                ></textarea>
                <label>Output Format:</label>
                <textarea
                    name="outputFormat"
                    placeholder="Output Format"
                    value={formData.outputFormat}
                    onChange={handleChange}
                    rows="3"
                    required
                ></textarea>
                <label>Constraints:</label>
                <textarea
                    name="constraints"
                    placeholder="Constraints"
                    value={formData.constraints}
                    onChange={handleChange}
                    rows="3"
                    required
                ></textarea>
                <label>Time Limit (ms):</label>
                <input type="number" name="timeLimit" value={formData.timeLimit} onChange={handleChange} required />

                <label>Memory Limit (MB):</label>
                <input type="number" name="memoryLimit" value={formData.memoryLimit} onChange={handleChange} required />
                {/* --- END SECTION 1: Basic Problem Details --- */}

                {/* --- START SECTION 2: Sample Test Cases (Currently Commented Out) --- */}
                
                <h3>Sample Test Cases:</h3>
                {formData.sampleTestCases.map((testCase, index) => (
                    <div key={index} style={{ border: '1px dashed #ccc', padding: '10px', marginBottom: '10px' }}>
                        <h4>Sample Test Case {index + 1}</h4>
                        <label>Input:</label>
                        <textarea
                            name="input"
                            placeholder="Input"
                            value={testCase.input}
                            onChange={(e) => handleTestCaseChange('sampleTestCases', index, e)}
                            rows="2"
                            required
                        ></textarea>
                        <label>Output:</label>
                        <textarea
                            name="output"
                            placeholder="Output"
                            value={testCase.output}
                            onChange={(e) => handleTestCaseChange('sampleTestCases', index, e)}
                            rows="2"
                            required
                        ></textarea>
                        <button type="button" onClick={() => removeTestCase('sampleTestCases', index)} style={{ marginTop: '5px', backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>
                            Remove Sample Test Case
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => addTestCase('sampleTestCases')} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '4px' }}>
                    Add Sample Test Case
                </button>
                
                {/* --- END SECTION 2: Sample Test Cases --- */}

                {/* --- START SECTION 3: Hidden Test Cases (Currently Commented Out) --- */}
               
                <h3>Hidden Test Cases:</h3>
                {formData.hiddenTestCases.map((testCase, index) => (
                    <div key={index} style={{ border: '1px dashed #ccc', padding: '10px', marginBottom: '10px' }}>
                        <h4>Hidden Test Case {index + 1}</h4>
                        <label>Input:</label>
                        <textarea
                            name="input"
                            placeholder="Input"
                            value={testCase.input}
                            onChange={(e) => handleTestCaseChange('hiddenTestCases', index, e)}
                            rows="2"
                            required
                        ></textarea>
                        <label>Output:</label>
                        <textarea
                            name="output"
                            placeholder="Output"
                            value={testCase.output}
                            onChange={(e) => handleTestCaseChange('hiddenTestCases', index, e)}
                            rows="2"
                            required
                        ></textarea>
                        <button type="button" onClick={() => removeTestCase('hiddenTestCases', index)} style={{ marginTop: '5px', backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>
                            Remove Hidden Test Case
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => addTestCase('hiddenTestCases')} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '4px' }}>
                    Add Hidden Test Case
                </button>
             
                {/* --- END SECTION 3: Hidden Test Cases --- */}

                {/* --- START SECTION 4: Submit Button --- */}
                <button
                    type="submit"
                    disabled={submitLoading}
                    style={{ marginTop: '20px', padding: '10px', backgroundColor: 'blue', color: 'white' }}>
                    {submitLoading ? 'Creating...' : 'Create Problem'}
                </button>
                {/* --- END SECTION 4: Submit Button --- */}
            </form>
        </div>
    );
};

export default CreateProblem;