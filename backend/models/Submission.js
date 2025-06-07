import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    code: { type: String, required: true },
    language: { type: String, enum: ['cpp', 'python', 'java'], required: true },
    status: {
        type: String,
        enum: [
            'Pending',
            'Compiling',
            'Judging',
            'Accepted',
            'Wrong Answer',
            'Time Limit Exceeded',
            'Memory Limit Exceeded',
            'Runtime Error',
            'Compilation Error',
            'Error',
            'No Test Cases',
            'Failed' // Added 'Failed' as judge server can return 'status: failed'
        ],
        default: 'Pending'
    },
    output: { type: String }, // General message or first error output (can include compiler errors)
    executionTime: { type: Number }, // In milliseconds (max time across all test cases)
    memoryUsed: { type: String }, // In kilobytes (still placeholder, harder to get without Docker)
    testCasesPassed: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
    judgedAt: { type: Date }, // When the judging process completed
    detailedResults: { // Store the array from judge service
        type: [{
            testCase: { type: Number }, // Changed to Number as it was an index
            // *** IMPORTANT CHANGE HERE ***
            // Added 'Accepted' to match judge_server's output for individual test cases.
            // Also, included other relevant states for comprehensive reporting.
            status: {
                type: String,
                enum: [
                    'Accepted', // Corresponds to 'Accepted' from judge_server
                    'Wrong Answer',
                    'Time Limit Exceeded',
                    'Memory Limit Exceeded',
                    'Runtime Error',
                    'Compilation Error', // Judge server might return this for specific test case if it's a global error
                    'Internal Error', // From judge server, if something goes wrong for a test case
                    'Error', // Generic error
                    'Passed', // If you prefer 'Passed' over 'Accepted' for individual test cases
                    'Skipped', // If you implement skipping
                    'Pending' // If a test case could be in pending state
                ],
                required: true
            },
            message: { type: String },
            // Removed 'input' from here to reduce storage, as it's usually already in problem details.
            // Add back if you specifically need the submitted input for detailed results.
            // input: { type: String },
            expectedOutput: { type: String },
            userOutput: { type: String },
            stderr: { type: String }, // Added stderr for individual test case output
            executionTime: { type: Number }, // Execution time for this specific test case
            memoryUsed: { type: String }, // Memory used for this specific test case (placeholder)
            isSample: { type: Boolean, default: false } // To differentiate sample vs. hidden test case results
        }],
        default: []
    }
}, { timestamps: true }); // Automatically adds cretedAt and updatedAt

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;