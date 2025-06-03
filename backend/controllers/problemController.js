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

export const updateProblem = async (req, res, next) => {
    try {
        // Destructure only the fields that are allowed to be updated from req.body
        // This implicitly excludes fields like _id, createdBy, createdAt, __v
        const {
            title,
            description,
            difficulty,
            inputFormat,
            outputFormat,
            sampleTestCases,
            hiddenTestCases,
            constraints,
            timeLimit,
            memoryLimit
        } = req.body;

        const updatedProblem = await Problem.findByIdAndUpdate(
            req.params.id,
            // Pass an object containing only the fields that are allowed to be updated.
            // This also ensures that if a field is not in req.body, it's not set to 'undefined'
            // and thus won't overwrite an existing value to 'undefined' unless explicitly set.
            {
                title,
                description,
                difficulty,
                inputFormat,
                outputFormat,
                sampleTestCases,
                hiddenTestCases,
                constraints,
                timeLimit,
                memoryLimit,
                updatedAt: new Date() // Manually update this timestamp if you want it
            },
            {
                new: true,           // Returns the updated document
                runValidators: true, // Run Mongoose validators (like `required: true` for inner objects, enum, etc.)
                context: 'query'     // This is often needed for validation to run correctly on updates
            }
        );

        if (!updatedProblem) {
            return res.status(404).json({ message: 'Problem not found.' });
        }

        res.status(200).json({ success: true, message: 'Problem updated successfully.', problem: updatedProblem });

    } catch (error) {
        console.error('Error updating problem:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Problem ID' });
        }
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ success: false, message: 'Validation Error', errors });
        }
        if (error.code === 11000) { // Duplicate key error for unique title
            return res.status(400).json({ message: 'Problem with this title already exists.' });
        }
        next(error); // Pass other errors to general error handler
    }
};


// @desc    Delete a problem
// @route   DELETE /api/problems/:id
// @access  Private (Admin only)
export const deleteProblem = async (req, res, next) => {
    try {
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }

        await Problem.deleteOne({ _id: req.params.id }); // Use deleteOne or findByIdAndDelete
        res.status(200).json({ success: true, message: 'Problem deleted successfully.' });

    } catch (error) {
        console.error('Error deleting problem:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Problem ID' });
        }
        next(error);
    }
};