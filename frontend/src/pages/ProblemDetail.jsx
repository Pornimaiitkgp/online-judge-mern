// client/src/pages/ProblemDetail.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react'; // Import Monaco Editor

const ProblemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [code, setCode] = useState(''); // Stores the code from the editor
    const [language, setLanguage] = useState('cpp'); // Default language, maps to Monaco language IDs
    // We'll now store the *full* submission result directly here for display
    const [submissionResult, setSubmissionResult] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false); // New state for submission loading
    const [submitError, setSubmitError] = useState(''); // Corrected state declaration for submitError
    const [submitMessage, setSubmitMessage] = useState(''); // Corrected state declaration for submitMessage

    // Map your backend languages to Monaco Editor's language IDs
    const languageMap = {
        'cpp': 'cpp',
        'python': 'python',
        'java': 'java'
    };

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const response = await axios.get(`/api/problems/${id}`);
                setProblem(response.data);
                setLoading(false);
                // Set initial code for the selected language
                if (language === 'cpp') {
                    setCode(`#include <iostream>

int main() {
    // Your code here
    std::cout << "Hello, world!" << std::endl;
    return 0;
}`);
                } else if (language === 'python') {
                    setCode(`def solve():
    # Your code here
    print("Hello, world!")

if __name__ == "__main__":
    solve()
`);
                } else if (language === 'java') {
                    setCode(`public class Main {
    public static void main(String[] args) {
        // Your code here
        System.out.println("Hello, world!");
    }
}`);
                }
            } catch (err) {
                console.error('Error fetching problem:', err);
                setError(err.response?.data?.message || 'Failed to fetch problem details. Please try again later.');
                setLoading(false);
            }
        };

        fetchProblem();
    }, [id, language]); // Added 'language' to dependency array for initial code setting

    // Handle language change, and update the default code snippet
    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        setLanguage(newLanguage);
        // Set default code snippet based on the selected language
        if (newLanguage === 'cpp') {
            setCode(`#include <iostream>

int main() {
    // Your code here
    std::cout << "Hello, world!" << std::endl;
    return 0;
}`);
        } else if (newLanguage === 'python') {
            setCode(`def solve():
    # Your code here
    print("Hello, world!")

if __name__ == "__main__":
    solve()
`);
        } else if (newLanguage === 'java') {
            setCode(`public class Main {
    public static void main(String[] args) {
        // Your code here
        System.out.println("Hello, world!");
    }
}`);
        }
    };

    // Helper for status color (can be reused from SubmissionDetail)
    const getStatusColor = (status) => {
        switch (status) {
            case 'Accepted': return 'green';
            case 'Wrong Answer': return 'red';
            case 'Time Limit Exceeded': return 'orange';
            case 'Memory Limit Exceeded': return 'purple';
            case 'Runtime Error': return 'darkred';
            case 'Compilation Error': return 'brown';
            case 'Pending': return 'blue';
            case 'Compiling': return 'deepskyblue'; // New status
            case 'Judging': return 'violet'; // New status
            case 'No Test Cases': return 'gray'; // New status
            case 'Error': return 'black'; // For general backend errors
            default: return 'gray';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitMessage(''); // Clear previous messages
        setSubmitError(''); // Clear previous errors
        setSubmissionResult(null); // Clear previous submission results
        setSubmitLoading(true); // Start loading

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setSubmitError('You must be logged in to submit code.');
                navigate('/login');
                return;
            }

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };

            const submissionData = {
                problemId: id,
                code,
                language
            };

            const response = await axios.post('/api/submissions', submissionData, config);

            // Directly set the submission result received from the backend
            // Assuming the backend sends the full submission object or a relevant part
            if (response.data.success) {
                setSubmissionResult(response.data.submission); // Assuming 'submission' key holds the object
                setSubmitMessage('Code submitted successfully!');
                // Optional: Redirect to submission details after a short delay
                // setTimeout(() => navigate(`/submissions/${response.data.submission.id}`), 2000);
            } else {
                setSubmitError(response.data.message || 'Submission failed.');
            }

        } catch (err) {
            console.error('Error submitting code:', err);
            setSubmitError(err.response?.data?.message || 'Failed to submit code. Please try again.');
            // If the error response itself contains detailed results (e.g., if an internal error occurs after some judging)
            if (err.response?.data?.submission) {
                setSubmissionResult(err.response.data.submission);
            }
        } finally {
            setSubmitLoading(false); // Stop loading
        }
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading problem...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
    }

    if (!problem) {
        return <div style={{ padding: '20px' }}>Problem not found.</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <h1>{problem.title}</h1>
            <p><strong>Difficulty:</strong> {problem.difficulty}</p>
            <p><strong>Time Limit:</strong> {problem.timeLimit / 1000} seconds</p>
            <p><strong>Memory Limit:</strong> {problem.memoryLimit} MB</p>


            <h2>Problem Description</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{problem.description}</p>

            <h2>Input Format</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{problem.inputFormat}</p>

            <h2>Output Format</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{problem.outputFormat}</p>

            <h2>Constraints</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{problem.constraints}</p>

            <h2>Sample Test Cases</h2>
            {problem.sampleTestCases.length === 0 ? (
                <p>No sample test cases available.</p>
            ) : (
                problem.sampleTestCases.map((testCase, index) => (
                    <div key={index} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', backgroundColor: '#f9f9f9' }}>
                        <h3>Sample {index + 1}</h3>
                        <div>
                            <strong>Input:</strong>
                            <pre style={{ backgroundColor: '#e0e0e0', padding: '5px', borderRadius: '3px' }}>{testCase.input}</pre>
                        </div>
                        <div>
                            <strong>Output:</strong>
                            <pre style={{ backgroundColor: '#e0e0e0', padding: '5px', borderRadius: '3px' }}>{testCase.output}</pre>
                        </div>
                    </div>
                ))
            )}

            <hr style={{ margin: '30px 0' }} />

            <h2>Submit Your Solution</h2>
            {submitMessage && <p style={{ color: 'green' }}>{submitMessage}</p>}
            {submitError && <p style={{ color: 'red' }}>{submitError}</p>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label htmlFor="language-select">Select Language:</label>
                <select
                    id="language-select"
                    value={language}
                    onChange={handleLanguageChange}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="cpp">C++</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                </select>

                <label htmlFor="code-editor">Your Code:</label>
                <div style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                    <Editor
                        height="400px"
                        language={languageMap[language]}
                        theme="vs-light"
                        value={code}
                        onChange={(newValue) => setCode(newValue)}
                        options={{
                            minimap: { enabled: false },
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitLoading} // Disable button while submitting
                    style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    {submitLoading ? 'Submitting & Judging...' : 'Submit Code'}
                </button>
            </form>

            {/* --- Display Submission Results Here --- */}
            {submissionResult && (
                <div style={{ marginTop: '40px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h2>Submission Results</h2>
                    <p><strong>Overall Status:</strong> <span style={{ color: getStatusColor(submissionResult.status), fontWeight: 'bold' }}>{submissionResult.status}</span></p>
                    {submissionResult.executionTime > 0 && (
                        <p><strong>Max Execution Time:</strong> {submissionResult.executionTime.toFixed(2)} ms</p>
                    )}
                    {submissionResult.memoryUsed && (
                        <p><strong>Memory Used:</strong> {submissionResult.memoryUsed}</p>
                    )}
                    <p><strong>Test Cases Passed:</strong> {submissionResult.testCasesPassed} / {submissionResult.totalTestCases}</p>

                    {submissionResult.status === 'Compilation Error' && submissionResult.output && (
                        <div style={{ marginTop: '20px' }}>
                            <h3>Compilation Output:</h3>
                            <pre style={{ backgroundColor: '#ffe0e0', padding: '10px', borderRadius: '5px', overflowX: 'auto', border: '1px solid red', color: 'darkred' }}>
                                {submissionResult.output}
                            </pre>
                        </div>
                    )}

                    {submissionResult.detailedResults && submissionResult.detailedResults.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h3>Sample Test Case Results:</h3>
                            {submissionResult.detailedResults.filter(r => r.isSample).map((tcResult, index) => ( // Filter for sample tests
                                <div key={index} style={{ border: `1px solid ${getStatusColor(tcResult.status)}`, padding: '15px', marginBottom: '15px', borderRadius: '5px', backgroundColor: '#fdfdfd' }}>
                                    <h4>Test Case {tcResult.testCase}: <span style={{ color: getStatusColor(tcResult.status), float: 'right' }}>{tcResult.status}</span></h4>
                                    {tcResult.message && tcResult.status !== 'Passed' && (
                                        <p style={{ color: getStatusColor(tcResult.status), fontWeight: 'bold' }}>Reason: {tcResult.message}</p>
                                    )}
                                    <p><strong>Execution Time:</strong> {tcResult.executionTime ? `${tcResult.executionTime.toFixed(2)} ms` : 'N/A'}</p>
                                    {/* <p><strong>Memory Used:</strong> {tcResult.memoryUsed ? `${tcResult.memoryUsed} KB` : 'N/A'}</p> */}

                                    <div style={{ marginTop: '10px' }}>
                                        <h4>Input:</h4>
                                        <pre style={{ backgroundColor: '#e9e9e9', padding: '10px', borderRadius: '3px', overflowX: 'auto' }}>{tcResult.input}</pre>
                                    </div>

                                    {tcResult.status !== 'Accepted' && tcResult.status !== 'Compilation Error' && (
                                        <>
                                            <div style={{ marginTop: '10px' }}>
                                                <h4>Expected Output:</h4>
                                                <pre style={{ backgroundColor: '#e9e9e9', padding: '10px', borderRadius: '3px', overflowX: 'auto' }}>{tcResult.expectedOutput}</pre>
                                            </div>
                                            <div style={{ marginTop: '10px' }}>
                                                <h4>Your Output:</h4>
                                                <pre style={{ backgroundColor: '#ffe0e0', padding: '10px', borderRadius: '3px', overflowX: 'auto', border: '1px solid red' }}>{tcResult.userOutput}</pre>
                                            </div>
                                        </>
                                    )}
                                    {(tcResult.status === 'Runtime Error' || tcResult.status === 'Time Limit Exceeded') && tcResult.userOutput && (
                                        <div style={{ marginTop: '10px' }}>
                                            <h4>Error/Trace Output:</h4>
                                            <pre style={{ backgroundColor: '#ffe0e0', padding: '10px', borderRadius: '3px', overflowX: 'auto', border: '1px solid red', color: 'darkred' }}>{tcResult.userOutput}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {!submissionResult.detailedResults || submissionResult.detailedResults.filter(r => r.isSample).length === 0 && submissionResult.status !== 'Compilation Error' && (
                        <p>No sample test case results to display (might be due to compilation error or no samples defined).</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProblemDetail;