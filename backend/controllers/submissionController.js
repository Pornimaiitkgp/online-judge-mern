// server/controllers/submissionController.js

import Submission from '../models/Submission.js'; // Change 'require' to 'import' and add .js
import Problem from '../models/Problem.js'; // Change 'require' to 'import' and add .js

// @desc    Create a new submission
// @route   POST /api/submissions
// @access  Private (Authenticated User)
export const createSubmission = async (req, res) => { // Change 'exports.createSubmission' to 'export const createSubmission'
    try {
        const { problemId, code, language } = req.body;
        // req.user will be populated by your 'protect' middleware
        const userId = req.user._id;

        // Basic validation
        if (!problemId || !code || !language) {
            return res.status(400).json({ message: 'Problem ID, code, and language are required.' });
        }

        // Check if problem exists
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found.' });
        }

        const newSubmission = new Submission({
            user: userId,
            problem: problemId,
            code,
            language,
            status: 'Pending', // Initial status
            totalTestCases: problem.sampleTestCases.length // For now, just sample test cases
        });

        const submission = await newSubmission.save();

        res.status(201).json({
            message: 'Submission received. It is now pending judgment.',
            submissionId: submission._id,
            status: submission.status
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all submissions for a user (or for a problem, or all for admin)
// @route   GET /api/submissions/me
// @access  Private (Authenticated User)
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