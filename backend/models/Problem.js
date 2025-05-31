import mongoose from 'mongoose';

const ProblemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true, // Ensure each problem has a unique title
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'], // Restrict difficulty to these values
        required: true
    },
    inputFormat: {
        type: String,
        required: true
    },
    outputFormat: {
        type: String,
        required: true
    },
    sampleTestCases: [ // Array of objects for sample tests to show users
        {
            input: { type: String, required: true },
            output: { type: String, required: true }
        }
    ],
    hiddenTestCases: [ // Array of objects for hidden tests (for automated judging)
        {
            input: { type: String, required: true },
            output: { type: String, required: true }
        }
    ],
    constraints: {
        type: String,
        required: true
    },
    // Reference to the user who created the problem
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Links to your 'User' model
        required: true // Assuming problems must be created by a logged-in user
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// IMPORTANT: Export the model as the default export for ES Module compatibility
const Problem = mongoose.model('Problem', ProblemSchema);
export default Problem;