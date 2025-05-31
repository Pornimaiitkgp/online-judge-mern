
import Submission from '../models/Submission.js'; 
import Problem from '../models/Problem.js'; 


import axios from 'axios'; 

// Add this at the top of your file
const JUDGE_SERVICE_URL = process.env.JUDGE_SERVICE_URL || 'http://localhost:5001'; // Get from .env

// @desc    Create a new submission
// @route   POST /api/submissions
// @access  Private (Authenticated User)
export const createSubmission = async (req, res) => {
    try {
        const { problemId, code, language } = req.body;
        const userId = req.user._id;

        if (!problemId || !code || !language) {
            return res.status(400).json({ message: 'Problem ID, code, and language are required.' });
        }

        // Fetch the problem to get all test cases (both sample and hidden)
        const problem = await Problem.findById(problemId); // This fetches all fields by default
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found.' });
        }

        const newSubmission = new Submission({
            user: userId,
            problem: problemId,
            code,
            language,
            status: 'Pending',
            totalTestCases: (problem.sampleTestCases.length + problem.hiddenTestCases.length) // Total test cases
        });

        const submission = await newSubmission.save();

        try {
            const judgeResponse = await axios.post(`${JUDGE_SERVICE_URL}/execute`, {
                submissionId: submission._id,
                code: code,
                language: language,
                testCases: [...problem.sampleTestCases, ...problem.hiddenTestCases] // Send ALL test cases
            });

            // Update submission status based on judge service's detailed response
            submission.status = judgeResponse.data.status;
            submission.output = judgeResponse.data.message; // General message/summary
            submission.executionTime = judgeResponse.data.totalExecutionTime;
            submission.memoryUsed = judgeResponse.data.maxMemoryUsed;
            submission.testCasesPassed = judgeResponse.data.testCasesPassed;
            // You might want to store detailed test case results in a new field on the submission model
            // For now, let's keep it simple.

            await submission.save();

            res.status(201).json({
                message: 'Submission received and judged.',
                submissionId: submission._id,
                status: submission.status,
                judgeResult: judgeResponse.data // Send full judge result back to client
            });

        } catch (judgeError) {
            console.error('Error sending submission to judge service:', judgeError.message);
            submission.status = 'Error';
            submission.output = `Failed to connect to judge service or judge service error: ${judgeError.message}`;
            await submission.save();

            res.status(500).json({
                message: 'Submission received but failed to process by judge service.',
                submissionId: submission._id,
                status: submission.status,
                judgeError: judgeError.response?.data || judgeError.message
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};



export const getUserSubmissions = async (req, res) => { // Change 'exports.getUserSubmissions' to 'export const getUserSubmissions'
    try {
        const submissions = await Submission.find({ user: req.user._id })
            .populate('problem', 'title difficulty')
            .sort({ submittedAt: -1 });
        res.json(submissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single submission by ID
// @route   GET /api/submissions/:id
// @access  Private (User who made submission or Admin)
export const getSubmissionById = async (req, res) => { // Change 'exports.getSubmissionById' to 'export const getSubmissionById'
    try {
        const submission = await Submission.findById(req.params.id).populate('problem');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        if (submission.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to view this submission.' });
        }

        res.json(submission);
    } catch (error) {
        console.error(error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Submission ID' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update submission status (Internal/Judge Service Use Only)
// @route   PUT /api/submissions/:id/status
// @access  Private (Judge Service - Requires a specific API key or internal mechanism)
export const updateSubmissionStatus = async (req, res) => { // Change 'exports.updateSubmissionStatus' to 'export const updateSubmissionStatus'
    try {
        const { status, output, executionTime, memoryUsed, testCasesPassed, totalTestCases } = req.body;

        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        submission.status = status || submission.status;
        submission.output = output || submission.output;
        submission.executionTime = executionTime || submission.executionTime;
        submission.memoryUsed = memoryUsed || submission.memoryUsed;
        submission.testCasesPassed = testCasesPassed || submission.testCasesPassed;
        submission.totalTestCases = totalTestCases || submission.totalTestCases;

        await submission.save();
        res.json({ message: 'Submission updated successfully', submission });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};