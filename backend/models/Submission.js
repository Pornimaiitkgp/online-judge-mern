// server/models/Submission.js

import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    code: {
        type: String,
        required: true
    },
    language: {
        type: String,
        enum: ['cpp', 'python', 'java'], // Match languages supported on frontend
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Judging', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Error'],
        default: 'Pending'
    },
    output: { // This will store the output of the judge service
        type: String
    },
    executionTime: { // In milliseconds
        type: Number
    },
    memoryUsed: { // In kilobytes
        type: Number
    },
    testCasesPassed: {
        type: Number,
        default: 0
    },
    totalTestCases: {
        type: Number,
        default: 0
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission; // Use ES Module default export