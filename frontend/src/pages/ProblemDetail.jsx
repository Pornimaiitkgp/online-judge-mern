// online_judge/frontend/src/pages/ProblemDetail.js

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

    // Removed: const [judgeResult, setJudgeResult] = useState(null); // This will now be on SubmissionResultPage
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

    // Helper for status color (no longer strictly needed here, but can keep for other uses)
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
        // Removed: setJudgeResult(null); // Clear previous judging results as it's not displayed here
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

            // const finalJudgeResult = judgeResponse.data; // No longer needed here as we redirect

            // --- STEP 3: Update the submission in your main backend database with the judging result ---
            // This calls your /api/submissions/:id route (which uses updateSubmissionDetails controller)
            // This PUT request *must* happen before navigation if you want the results available immediately
            await axios.put(`/api/submissions/${createdSubmission._id}`, {
                verdict: judgeResponse.data.verdict, // Use judgeResponse.data directly
                actualOutput: judgeResponse.data.actualOutput,
                expectedOutput: judgeResponse.data.expectedOutput,
                dockerCommandOutput: judgeResponse.data.dockerCommandOutput,
                dockerCommandErrors: judgeResponse.data.dockerCommandErrors,
                compilerOutput: judgeResponse.data.compilerOutput,
                status: judgeResponse.data.status,
                executionTime: judgeResponse.data.executionTime,
                memoryUsed: judgeResponse.data.memoryUsed,
                testCasesPassed: judgeResponse.data.testCasesPassed,
                totalTestCases: judgeResponse.data.totalTestCases,
                detailedResults: judgeResponse.data.detailedResults,
                overallMessage: judgeResponse.data.overallMessage // Ensure this is passed
            }, config);

            // Removed: setJudgeResult(finalJudgeResult); // No longer display on this page
            setSubmitMessage('Code submitted successfully! Redirecting to results...');
            
            // Redirect to the submission result page
            navigate(`/submissions/${createdSubmission._id}`); // This is the key change to navigate

        } catch (err) {
            console.error('Error during submission process:', err);
            setSubmitError(err.response?.data?.message || err.message || 'Failed to submit code. Please try again.');
            // Removed: if (err.response?.data) { setJudgeResult(err.response.data); }
            // If you still want to show *some* error on this page for failed submissions,
            // you can modify submitError or submitMessage accordingly.
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

            {/* --- Removed: Display JUDGE SERVER Results Here --- */}
            {/* The judge results will now be displayed on the /submissions/:submissionId page */}

        </div>
    );
};

export default ProblemDetail;