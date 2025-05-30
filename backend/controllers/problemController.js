// backend/controllers/problemController.js

import Problem from '../models/Problem.js'; // Use import, and ensure .js extension for local files

// @desc    Create a new problem
// @route   POST /api/problems
// @access  Private (Admin)
export const createProblem = async (req, res) => { // Use named export 'export const'
    try {
        // In a real scenario, you'd check if the user is an admin here
        // For now, let's assume the middleware handles authentication
        const {
            title,
            description,
            difficulty,
            inputFormat,
            outputFormat,
            sampleTestCases,
            constraints
        } = req.body;

        const newProblem = new Problem({
            title,
            description,
            difficulty,
            inputFormat,
            outputFormat,
            sampleTestCases,
            constraints,
            createdBy: req.user._id // Assuming you attach user info to req.user after authentication
        });

        const problem = await newProblem.save();
        res.status(201).json(problem);
    } catch (error) {
        console.error(error);
        if (error.code === 11000) { // Duplicate key error for unique title
            return res.status(400).json({ message: 'Problem with this title already exists' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all problems
// @route   GET /api/problems
// @access  Public
export const getAllProblems = async (req, res) => { // Use named export 'export const'
    try {
        const problems = await Problem.find({}).select('-hiddenTestCases'); // Don't expose hidden test cases
        res.json(problems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single problem by ID
// @route   GET /api/problems/:id
// @access  Public
export const getProblemById = async (req, res) => { // Use named export 'export const'
    try {
        const problem = await Problem.findById(req.params.id).select('-hiddenTestCases');
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }
        res.json(problem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};