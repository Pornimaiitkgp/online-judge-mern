// client/src/pages/ProblemDetail.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react'; // Import Monaco Editor

// Ensure axios base URL is set up globally, e.g., in src/main.jsx or a config file:
// axios.defaults.baseURL = 'http://localhost:3000'; // Your backend server URL

const ProblemDetail = () => {
    const { id } = useParams(); // This 'id' is problemId
    const navigate = useNavigate();
    const [problem, setProblem] = useState(null); // Stores fetched problem details
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [code, setCode] = useState(''); // Stores the code from the editor
    const [language, setLanguage] = useState('cpp'); // Default language, maps to Monaco language IDs

    const [judgeResult, setJudgeResult] = useState(null); // Stores the final result from the judge server
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitMessage, setSubmitMessage] = useState('');

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
            case 'Internal Error': return 'black';
            case 'Error': return 'black'; // For general backend errors
            default: return 'gray';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitMessage('');
        setSubmitError('');
        setJudgeResult(null); // Clear previous judging results
        setSubmitLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setSubmitError('You must be logged in to submit code.');
                navigate('/signin');
                return;
            }

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };

            // --- STEP 1: Create a pending submission record in your main backend database ---
            // This calls your /api/submissions route (which uses createSubmission controller)
            const initialSubmissionResponse = await axios.post('/api/submissions', {
                problemId: id, // Pass problemId as expected by your backend
                code,
                language
                // Initial status and submittedAt are handled by the backend controller
            }, config);

            if (!initialSubmissionResponse.data.success) {
                throw new Error(initialSubmissionResponse.data.message || 'Failed to create initial submission record.');
            }
            const createdSubmission = initialSubmissionResponse.data.submission;
            const problemDetailsForJudge = initialSubmissionResponse.data.problemDetailsForJudge;

            // --- STEP 2: Send the submission to your main backend's /api/judge endpoint ---
            // This endpoint will proxy the request to the Docker Judge Server.
            const judgeRequestData = {
                submissionId: createdSubmission._id, // Pass the submission ID so the backend can update it
                code,
                language,
                // Use the problem details fetched by the backend in Step 1
                testCases: problemDetailsForJudge.testCases,
                timeLimit: problemDetailsForJudge.timeLimit,
                memoryLimit: problemDetailsForJudge.memoryLimit
            };

            const judgeResponse = await axios.post('/api/judge', judgeRequestData, config); // Backend URL is implied by axios.defaults.baseURL

            if (!judgeResponse.data || judgeResponse.data.status === 'failed') {
                throw new Error(judgeResponse.data.error || 'Judging failed unexpectedly or returned no data.');
            }

            const finalJudgeResult = judgeResponse.data;

            // --- STEP 3: Update the submission in your main backend database with the judging result ---
            // This calls your /api/submissions/:id route (which uses updateSubmissionDetails controller)
            await axios.put(`/api/submissions/${createdSubmission._id}`, {
                verdict: finalJudgeResult.verdict,
                actualOutput: finalJudgeResult.actualOutput,
                expectedOutput: finalJudgeResult.expectedOutput,
                dockerCommandOutput: finalJudgeResult.dockerCommandOutput,
                dockerCommandErrors: finalJudgeResult.dockerCommandErrors,
                compilerOutput: finalJudgeResult.compilerOutput, // Ensure this field is included if it comes from judge server
                status: finalJudgeResult.status, // The judge server's overall status (e.g., 'completed')
                executionTime: finalJudgeResult.executionTime,
                memoryUsed: finalJudgeResult.memoryUsed,
                testCasesPassed: finalJudgeResult.testCasesPassed,
                totalTestCases: finalJudgeResult.totalTestCases,
                detailedResults: finalJudgeResult.detailedResults
            }, config);

            setJudgeResult(finalJudgeResult); // Display the judge server's result on the page
            setSubmitMessage('Code submitted and judged successfully!');

        } catch (err) {
            console.error('Error during submission process:', err);
            setSubmitError(err.response?.data?.message || err.message || 'Failed to submit code. Please try again.');
            // If the error response itself contains detailed results (e.g., if an internal error occurs after some judging)
            // This line specifically for displaying errors coming back from the judge or backend proxy
            if (err.response?.data) {
                setJudgeResult(err.response.data); // Display partial results/errors from judge
            }
        } finally {
            setSubmitLoading(false);
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

            {/* --- Display JUDGE SERVER Results Here --- */}
            {judgeResult && (
                <div style={{ marginTop: '40px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h2>Judging Result (from Judge Server)</h2>
                    {/* Use optional chaining for properties that might be undefined */}
                    <p><strong>Status:</strong> <span style={{ color: getStatusColor(judgeResult.status), fontWeight: 'bold' }}>{judgeResult.status}</span></p>
                    <p><strong>Verdict:</strong> <span style={{ color: getStatusColor(judgeResult.verdict), fontWeight: 'bold' }}>{judgeResult.verdict || 'N/A'}</span></p>
                    <p><strong>Details:</strong> {judgeResult.detail || 'N/A'}</p>

                    {judgeResult.actualOutput && (
                        <>
                            <p><strong>Actual Output:</strong></p>
                            <pre style={{ backgroundColor: '#e9e9e9', padding: '10px', borderRadius: '3px', overflowX: 'auto' }}>{judgeResult.actualOutput}</pre>
                        </>
                    )}
                    {judgeResult.expectedOutput && (
                        <>
                            <p><strong>Expected Output:</strong></p>
                            <pre style={{ backgroundColor: '#e9e9e9', padding: '10px', borderRadius: '3px', overflowX: 'auto' }}>{judgeResult.expectedOutput}</pre>
                        </>
                    )}
                    {judgeResult.dockerCommandOutput && (
                        <>
                            <p><strong>Docker Command Output:</strong></p>
                            <pre style={{ backgroundColor: '#e9e9e9', padding: '10px', borderRadius: '3px', overflowX: 'auto' }}>{judgeResult.dockerCommandOutput}</pre>
                        </>
                    )}
                    {judgeResult.dockerCommandErrors && (
                        <>
                            <p><strong>Docker Command Errors:</strong></p>
                            <pre style={{ backgroundColor: '#ffe0e0', padding: '10px', borderRadius: '3px', overflowX: 'auto', border: '1px solid red', color: 'darkred' }}>{judgeResult.dockerCommandErrors}</pre>
                        </>
                    )}
                    {/* Added compilerOutput check as well */}
                    {judgeResult.compilerOutput && (
                        <>
                            <p><strong>Compiler Output:</strong></p>
                            <pre style={{ backgroundColor: '#ffe0e0', padding: '10px', borderRadius: '3px', overflowX: 'auto', border: '1px solid red', color: 'darkred' }}>{judgeResult.compilerOutput}</pre>
                        </>
                    )}
                    {judgeResult.detailedResults && judgeResult.detailedResults.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h3>Test Case Results:</h3>
                            {judgeResult.detailedResults.map((tcResult, index) => (
                                <div key={index} style={{ border: `1px solid ${getStatusColor(tcResult.status)}`, padding: '15px', marginBottom: '15px', borderRadius: '5px', backgroundColor: '#fdfdfd' }}>
                                    <h4>Test Case {tcResult.testCase}: <span style={{ color: getStatusColor(tcResult.status), float: 'right' }}>{tcResult.status}</span></h4>
                                    {tcResult.message && tcResult.status !== 'Passed' && (
                                        <p style={{ color: getStatusColor(tcResult.status), fontWeight: 'bold' }}>Reason: {tcResult.message}</p>
                                    )}
                                    {/* Ensure executionTime is a number before toFixed */}
                                    <p><strong>Execution Time:</strong> {typeof tcResult.executionTime === 'number' ? `${tcResult.executionTime.toFixed(2)} ms` : 'N/A'}</p>
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
                </div>
            )}
        </div>
    );
};

export default ProblemDetail;