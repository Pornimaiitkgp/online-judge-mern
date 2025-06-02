// server/controllers/submissionController.js

import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
// --- REMOVED: exec, fs, path, fileURLToPath from 'url' ---
// These are no longer needed here as the Docker Judge Server handles execution.

// --- REMOVED: TEMP_CODE_DIR constant and fs.mkdir call ---
// Temporary file management is now handled by the Judge Server.

// --- REMOVED: executeShellCommand helper function ---
// This execution logic is now handled by the Judge Server.

// @desc    Create a new submission record
// @route   POST /api/submissions
// @access  Private (Authenticated User)
// This function now ONLY saves the submission to the database with an initial status.
export const createSubmission = async (req, res, next) => { // Added 'next' for error handling
    const { problemId, code, language } = req.body;
    const userId = req.user._id;

    if (!problemId || !code || !language) {
        return res.status(400).json({ message: 'Problem ID, code, and language are required.' });
    }

    try {
        // Fetch the problem to get problem details (like test cases, time/memory limits)
        // These details will be needed by the frontend to send to the /api/judge endpoint
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found.' });
        }

        // Create a new submission in DB with 'Pending' status
        const newSubmission = new Submission({
            user: userId,
            problem: problemId,
            code,
            language,
            status: 'Pending', // Initial status
            submittedAt: new Date(),
            totalTestCases: (problem.sampleTestCases || []).length + (problem.hiddenTestCases || []).length,
            // You might want to initialize other fields here if your Submission model requires them,
            // but they will be updated later by updateSubmissionDetails.
        });

        const savedSubmission = await newSubmission.save();

        // Respond to the frontend with the ID of the newly created submission
        // and necessary problem details (test cases, limits) for the *next* call to /api/judge.
        res.status(201).json({
            success: true,
            message: 'Submission received and set to pending. Judging initiated.',
            submission: savedSubmission, // Return the full saved submission object
            // Also return problem details needed for the judge API call (from frontend)
            problemDetailsForJudge: {
                timeLimit: problem.timeLimit,
                memoryLimit: problem.memoryLimit,
                // Combine sample and hidden test cases for the judge server
                testCases: [
                    ...(problem.sampleTestCases || []).map(tc => ({ input: tc.input, expectedOutput: tc.output, isSample: true })),
                    ...(problem.hiddenTestCases || []).map(tc => ({ input: tc.input, expectedOutput: tc.output, isSample: false }))
                ]
            }
        });

    } catch (error) {
        console.error('Error in createSubmission (saving to DB):', error);
        next(error); // Pass error to global error handler
    }
};

// --- Other existing controller functions (getUserSubmissions, getSubmissionById - keep them as is) ---

export const getUserSubmissions = async (req, res, next) => {
    try {
        const submissions = await Submission.find({ user: req.user._id })
            .populate('problem', 'title difficulty') // Populate problem details for display
            .sort({ submittedAt: -1 });
        res.json(submissions);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getSubmissionById = async (req, res, next) => {
    try {
        const submission = await Submission.findById(req.params.id).populate('problem');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        // Authorization check: User can view their own submissions or if they are admin
        if (submission.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to view this submission.' });
        }

        res.json(submission);
    } catch (error) {
        console.error(error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Submission ID' });
        }
        next(error);
    }
};


// @desc    Update submission details (including status, verdict, time, memory, results, etc.)
// @route   PUT /api/submissions/:id
// @access  Private (Authenticated User - expected to be called by your backend proxy)
// This function is now responsible for updating the submission record
// after the Judge Server has completed its work.
export const updateSubmissionDetails = async (req, res, next) => {
    try {
        const submissionId = req.params.id;
        // The req.body will contain all judging results from the judge server
        // (forwarded by your main backend's /api/judge endpoint)
        const {
            verdict,                // e.g., 'Accepted', 'Wrong Answer', 'Compilation Error'
            actualOutput,           // Overall output (e.g., compile error messages or user's main output)
            // ADDED 'compilerOutput' here to destructure it from req.body
            compilerOutput,         // Compiler output (stderr from compilation)
            dockerCommandOutput,    // Raw docker stdout
            dockerCommandErrors,    // Raw docker stderr
            status,                 // e.g., 'completed', 'failed' (from judge server)
            executionTime,          // Max execution time across test cases
            memoryUsed,             // Max memory used across test cases
            testCasesPassed,        // Count of passed test cases
            totalTestCases,         // Total count of test cases
            detailedResults         // Array of results for each test case
        } = req.body;

        // Ensure the submission belongs to the current user or is being updated by an admin/system
        // For internal service calls, you might simplify auth or use an internal API key check instead of authenticateUser
        // For now, authenticateUser check is assumed to be sufficient for your backend proxy's call
        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        // IMPORTANT: If you want to ensure only the submission's owner (or admin) can update,
        // you would add a check like:
        // if (submission.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        //     return res.status(403).json({ message: 'Forbidden: You are not authorized to update this submission.' });
        // }
        // However, in the proxy scenario, the `req.user` here would be the user who *initiated* the submission,
        // so it generally works.

        // Update the submission fields based on the judge server's result
        submission.status = verdict || status || 'Error'; // Use verdict as primary status, fallback to status
        let finalOutputMessage = 'No specific output or error details provided.'; // Default fallback
         if (verdict === 'Accepted') {
            finalOutputMessage = 'All test cases passed successfully.';
        } else if (verdict === 'Compilation Error') {
            finalOutputMessage = compilerOutput || 'Compilation failed with no specific output provided.';
        } else if (verdict === 'Runtime Error') {
            const firstFailedTest = detailedResults.find(res => res.status === 'Runtime Error');
            finalOutputMessage = (firstFailedTest && firstFailedTest.stderr) || dockerCommandErrors || 'Program terminated with runtime error.';
        } else if (verdict === 'Time Limit Exceeded') {
            finalOutputMessage = dockerCommandErrors || 'Program exceeded time limit.'; // Docker usually puts timeout message here
        } else if (verdict === 'Memory Limit Exceeded') {
            finalOutputMessage = dockerCommandErrors || 'Program exceeded memory limit.'; // Docker usually puts OOM message here
        } else if (dockerCommandErrors) {
            // Catch-all for other docker errors
            finalOutputMessage = `Docker Error: ${dockerCommandErrors}`;
        } else if (actualOutput) {
            finalOutputMessage = actualOutput;
        }

        submission.output = finalOutputMessage;
       
        submission.executionTime = executionTime || 0;
        submission.memoryUsed = memoryUsed || 'N/A'; // Judge server might send 'KB' or 'MB'
        submission.testCasesPassed = testCasesPassed || 0;
        submission.totalTestCases = totalTestCases || submission.totalTestCases;
        submission.detailedResults = detailedResults || []; // Store full detailed results from judge server
        submission.judgedAt = new Date(); // Record when judging was completed

        await submission.save();

        res.status(200).json({ success: true, message: 'Submission details updated successfully.', submission });

    } catch (error) {
        console.error('Error in updateSubmissionDetails:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Submission ID for update.' });
        }
        next(error);
    }
};