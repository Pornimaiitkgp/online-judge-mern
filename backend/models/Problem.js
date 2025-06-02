import mongoose from 'mongoose';

const ProblemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
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
    sampleTestCases: [
        {
            input: { type: String, required: true },
            output: { type: String, required: true }
        }
    ],
    hiddenTestCases: [
        {
            input: { type: String, required: true },
            output: { type: String, required: true }
        }
    ],
    constraints: {
        type: String,
        required: true
    },
    timeLimit: { // In milliseconds
        type: Number,
        default: 2000, // Default to 2 seconds if not specified
    },
    memoryLimit: { // In MB (Note: Primarily for display/conceptual for now without Docker)
        type: Number,
        default: 256, // Default to 256 MB if not specified
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Problem = mongoose.model('Problem', ProblemSchema);
export default Problem;