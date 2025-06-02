// server/controllers/submissionController.js

import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
import { exec } from 'child_process'; // For executing shell commands
import fs from 'fs/promises'; // For asynchronous file operations
import path from 'path'; // For path manipulation
import { fileURLToPath } from 'url'; // For __dirname in ES modules

// Resolve __dirname in ES module for temporary file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define a directory for temporary code files, relative to the controller
const TEMP_CODE_DIR = path.join(__dirname, '..', '..', 'temp_submissions'); // e.g., online-judge/temp_submissions

// Ensure the temporary code directory exists when the server starts
// This will create it if it doesn't exist.
fs.mkdir(TEMP_CODE_DIR, { recursive: true })
    .then(() => console.log(`Temporary code directory created at ${TEMP_CODE_DIR}`))
    .catch(err => console.error('Error creating temporary code directory:', err));

/**
 * Helper function to execute shell commands with a timeout and input.
 * Catches timeout specifically and provides a clear message.
 * @param {string} command - The shell command to execute.
 * @param {number} timeout - Timeout in milliseconds.
 * @param {string} input - Input to pipe to the command's stdin.
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function executeShellCommand(command, timeout, input = '') {
    return new Promise((resolve, reject) => {
        const child = exec(command, { timeout: timeout, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => { // maxBuffer 1MB
            if (error) {
                if (error.killed) {
                    reject({ stdout: stdout, stderr: `Execution timed out after ${timeout / 1000} seconds.`, message: 'Timeout' });
                } else {
                    reject({ stdout: stdout, stderr: stderr, message: error.message });
                }
            } else {
                resolve({ stdout, stderr });
            }
        });

        if (input) {
            child.stdin.write(input);
            child.stdin.end();
        }
    });
}

// @desc    Create a new submission
// @route   POST /api/submissions
// @access  Private (Authenticated User)
export const createSubmission = async (req, res) => {
    const { problemId, code, language } = req.body;
    const userId = req.user._id;

    if (!problemId || !code || !language) {
        return res.status(400).json({ message: 'Problem ID, code, and language are required.' });
    }

    let newSubmission; // Declare outside try-catch to be accessible for potential cleanup
    let tempFilename;
    let tempExecutablePath; // For C++/Java compiled output
    let javaClassName = 'Main'; // Default for Java, can be dynamic later

    try {
        // Fetch the problem to get all test cases
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found.' });
        }

        const allTestCases = [
            ...problem.sampleTestCases.map(tc => ({ input: tc.input, expectedOutput: tc.output, isSample: true })),
            ...problem.hiddenTestCases.map(tc => ({ input: tc.input, expectedOutput: tc.output, isSample: false }))
        ];

        // 1. Create a new submission in DB with 'Pending' status
        newSubmission = new Submission({
            user: userId,
            problem: problemId,
            code,
            language,
            status: 'Pending',
            totalTestCases: allTestCases.length
        });
        const submission = await newSubmission.save(); // Save to get the _id for unique filenames

        const uniqueId = `${submission._id}-${Date.now()}`; // Use submission ID for uniqueness
        let compileCommand;
        let executeCommand;

        // Determine file extension and commands based on language
        switch (language) {
            case 'cpp':
                tempFilename = path.join(TEMP_CODE_DIR, `${uniqueId}.cpp`);
                tempExecutablePath = path.join(TEMP_CODE_DIR, uniqueId);
                compileCommand = `g++ ${tempFilename} -o ${tempExecutablePath}`;
                executeCommand = tempExecutablePath;
                break;
            case 'python':
                tempFilename = path.join(TEMP_CODE_DIR, `${uniqueId}.py`);
                executeCommand = `python3 ${tempFilename}`;
                break;
            case 'java':
                tempFilename = path.join(TEMP_CODE_DIR, `${uniqueId}.java`);
                // You might want to parse the code to get the actual class name
                // For simplicity, we assume the main class is 'Main' or you enforce it.
                // If you want dynamic class name: `const match = code.match(/public\s+class\s+(\w+)/); if (match) javaClassName = match[1];`
                tempExecutablePath = path.join(TEMP_CODE_DIR, `${javaClassName}.class`); // For cleanup
                compileCommand = `javac -d ${TEMP_CODE_DIR} ${tempFilename}`; // Compile into the temp directory
                executeCommand = `java -cp ${TEMP_CODE_DIR} ${javaClassName}`;
                break;
            default:
                submission.status = 'Error';
                submission.output = 'Unsupported language.';
                await submission.save();
                return res.status(400).json({ message: 'Unsupported language.' });
        }

        await fs.writeFile(tempFilename, code); // Write user's code to a temporary file

        let overallStatus = 'Accepted';
        let compilationOutput = '';
        let testCasesPassedCount = 0;
        let detailedResults = [];

        const problemTimeLimit = problem.timeLimit || 2000; // Default 2 seconds
        // Memory limit is harder to enforce directly with `child_process.exec` reliably.
        // It's more for conceptual understanding for now, or requires more advanced tools (like cgroups).

        // --- 2. Compilation (for C++, Java) ---
        if (compileCommand) {
            submission.status = 'Compiling';
            await submission.save();
            try {
                const { stdout, stderr } = await executeShellCommand(compileCommand, 15000); // 15 sec timeout for compilation
                if (stderr) {
                    overallStatus = 'Compilation Error';
                    compilationOutput = stderr;
                }
            } catch (error) {
                overallStatus = 'Compilation Error';
                compilationOutput = error.stderr || error.message || 'Unknown compilation error.';
            }
        }

        // --- 3. Execution (if no compilation errors and test cases exist) ---
        if (overallStatus !== 'Compilation Error' && allTestCases.length > 0) {
            submission.status = 'Judging';
            await submission.save();

            for (let i = 0; i < allTestCases.length; i++) {
                const testCase = allTestCases[i];
                let userOutput = '';
                let runtimeError = '';
                let testStatus = 'Passed';
                let executionTime = 0; // Placeholder
                let memoryUsed = 'N/A'; // Placeholder

                const startTime = process.hrtime.bigint(); // High-resolution time

                try {
                    const { stdout, stderr } = await executeShellCommand(executeCommand, problemTimeLimit, testCase.input);
                    const endTime = process.hrtime.bigint();
                    executionTime = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds

                    userOutput = stdout.trim();
                    runtimeError = stderr.trim();

                    if (runtimeError && runtimeError !== `Execution timed out after ${problemTimeLimit / 1000} seconds.`) {
                        testStatus = 'Runtime Error';
                    } else if (userOutput !== testCase.expectedOutput.trim()) {
                        testStatus = 'Wrong Answer';
                    } else {
                        testCasesPassedCount++;
                    }

                } catch (execError) {
                    const endTime = process.hrtime.bigint();
                    executionTime = Number(endTime - startTime) / 1_000_000;

                    userOutput = execError.stdout ? execError.stdout.trim() : '';
                    runtimeError = execError.stderr ? execError.stderr.trim() : execError.message;

                    if (execError.message === 'Timeout') {
                        testStatus = 'Time Limit Exceeded';
                    } else {
                        testStatus = 'Runtime Error'; // Catch-all for other execution failures
                    }
                }

                // Update overall status if a failure occurs
                if (testStatus !== 'Passed' && overallStatus === 'Accepted') {
                    overallStatus = testStatus; // Set overall status to the first failing status
                }

                detailedResults.push({
                    testCase: i + 1,
                    status: testStatus,
                    message: testStatus, // A simple message for now
                    input: testCase.input,
                    expectedOutput: testCase.expectedOutput,
                    userOutput: userOutput,
                    executionTime: executionTime,
                    memoryUsed: memoryUsed,
                    isSample: testCase.isSample // Useful for frontend to show only sample results initially
                });
            }
        } else if (overallStatus !== 'Compilation Error' && allTestCases.length === 0) {
            // No test cases, but no compilation error. Consider it accepted by default or specific status.
            overallStatus = 'No Test Cases'; // Custom status for this scenario
        }


        // 4. Update Submission in Database with final results
        submission.status = overallStatus;
        submission.output = compilationOutput || overallStatus; // If no compilation error, use overallStatus message
        submission.executionTime = detailedResults.length > 0 ? Math.max(...detailedResults.map(r => r.executionTime)) : 0; // Max execution time across test cases
        submission.memoryUsed = 'N/A'; // Still hard to get precisely
        submission.testCasesPassed = testCasesPassedCount;
        submission.detailedResults = detailedResults;
        submission.judgedAt = new Date();

        await submission.save();

        // 5. Clean Up Temporary Files
        await fs.unlink(tempFilename).catch(err => console.error(`Error deleting source file ${tempFilename}:`, err));
        if (tempExecutablePath) {
            await fs.unlink(tempExecutablePath).catch(err => console.error(`Error deleting executable/class file ${tempExecutablePath}:`, err));
        }
        if (language === 'java') {
            const javaClassFile = path.join(TEMP_CODE_DIR, `${javaClassName}.class`);
            await fs.unlink(javaClassFile).catch(err => console.error(`Error deleting Java class file ${javaClassFile}:`, err));
        }


        // 6. Send Response to Frontend
        res.status(200).json({
            message: 'Code submitted and judged.',
            submission: {
                _id: submission._id,
                status: submission.status,
                output: submission.output,
                executionTime: submission.executionTime,
                memoryUsed: submission.memoryUsed,
                testCasesPassed: submission.testCasesPassed,
                totalTestCases: submission.totalTestCases,
                detailedResults: submission.detailedResults.filter(r => r.isSample) // Send only sample results initially
            },
            // For production, you might only send overall status and message
            // and have a separate API to fetch detailed results for a specific submission ID.
        });

    } catch (error) {
        console.error('Error in createSubmission:', error);

        // Attempt to update submission status to 'Error' if something went wrong after initial save
        if (newSubmission && !newSubmission.isModified('status')) { // Only if status hasn't been set by compilation/execution
            newSubmission.status = 'Error';
            newSubmission.output = `Internal server error during judging: ${error.message}`;
            await newSubmission.save().catch(err => console.error('Failed to update submission status to Error:', err));
        }

        // Clean up any files that might have been created
        if (tempFilename) await fs.unlink(tempFilename).catch(() => {});
        if (tempExecutablePath) await fs.unlink(tempExecutablePath).catch(() => {});
        if (language === 'java' && javaClassName) {
            const javaClassFile = path.join(TEMP_CODE_DIR, `${javaClassName}.class`);
            await fs.unlink(javaClassFile).catch(() => {});
        }

        res.status(500).json({ message: 'Server Error processing submission.', error: error.message });
    }
};

// --- Other existing controller functions (keep them as is) ---

export const getUserSubmissions = async (req, res) => {
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

export const getSubmissionById = async (req, res) => {
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

export const updateSubmissionStatus = async (req, res) => {
    // This route is now less relevant as the status is updated directly by createSubmission.
    // You might keep it for admin overrides or future asynchronous judging integration.
    try {
        const { status, output, executionTime, memoryUsed, testCasesPassed, totalTestCases, detailedResults } = req.body;

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
        submission.detailedResults = detailedResults || submission.detailedResults; // Update detailed results too

        await submission.save();
        res.json({ message: 'Submission updated successfully', submission });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};