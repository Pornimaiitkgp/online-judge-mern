import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    code: { type: String, required: true },
    language: { type: String, enum: ['cpp', 'python', 'java'], required: true },
    status: {
        type: String,
        enum: ['Pending', 'Compiling', 'Judging', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Error', 'No Test Cases'], // Added 'No Test Cases'
        default: 'Pending'
    },
    output: { type: String }, // General message or first error output
    executionTime: { type: Number }, // In milliseconds (max time across all test cases)
    memoryUsed: { type: String }, // In kilobytes (still placeholder, harder to get without Docker)
    testCasesPassed: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
    judgedAt: { type: Date }, // When the judging process completed
    detailedResults: { // Store the array from judge service
        type: [{
            testCase: { type: Number }, // Changed to Number as it was an index
            status: { type: String, enum: ['Passed', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Error'] },
            message: { type: String },
            input: { type: String },
            expectedOutput: { type: String },
            userOutput: { type: String },
            executionTime: { type: Number }, // Execution time for this specific test case
            memoryUsed: { type: String }, // Memory used for this specific test case (placeholder)
            isSample: { type: Boolean, default: false } // To differentiate sample vs. hidden test case results
        }],
        default: []
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;