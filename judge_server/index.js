const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process'); // For running shell commands (like 'docker run')
const fs = require('fs/promises'); // For asynchronous file system operations (creating/writing files)
const path = require('path'); // For working with file paths
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

const app = express();
const PORT = 3001;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Main Judging Endpoint
// This is where you send your code submission from Postman
app.post('/judge/cpp', async (req, res) => {
    // Extract data from the request body
    const { code, language, testCases, timeLimit, memoryLimit } = req.body;

    // --- Input Validation (Optional but Recommended) ---
    if (!code || !language || !testCases || !Array.isArray(testCases) || testCases.length === 0) {
        return res.status(400).json({ status: 'failed', error: 'Missing or invalid submission data.' });
    }
    if (language !== 'cpp') { // Currently only supports C++
        return res.status(400).json({ status: 'failed', error: 'Unsupported language. Only "cpp" is supported.' });
    }

    // Generate a unique ID for this submission (helps with temporary files and debugging)
    const submissionId = uuidv4();

    // Define the temporary directory path on your host machine
    // This will be something like: /Users/pornimagaikwad/.../judge_server/temp/some-unique-id
    const tempDirPath = path.join(__dirname, 'temp', submissionId);

    // Define file paths for the user's code, input, and output *within this temp directory*
    const userCodeFilePath = path.join(tempDirPath, 'user_code.cpp');
    const inputFilePath = path.join(tempDirPath, 'input.txt');
    const outputFilePath = path.join(tempDirPath, 'output.txt'); // Generic output name for simplicity

    // Get the first test case's input and expected output
    // For now, we'll only process the first test case. You can loop through testCases later.
    const currentInput = testCases[0].input || ''; // Use empty string if no input provided
    const expectedOutput = testCases[0].expectedOutput || '';


    try {
        // 1. Create the unique temporary directory for this submission
        // { recursive: true } means it will create parent directories if they don't exist
        await fs.mkdir(tempDirPath, { recursive: true });
        console.log(`Created temp directory: ${tempDirPath}`);

        // 2. Write the user's submitted 'code' into 'user_code.cpp' in the temp directory
        await fs.writeFile(userCodeFilePath, code);
        console.log(`Wrote user code to: ${userCodeFilePath}`);

        // 3. Write the test case 'input' into 'input.txt' in the temp directory
        // IMPORTANT: Even if input is empty, create an empty file. This prevents 'No such file' error.
        await fs.writeFile(inputFilePath, currentInput);
        console.log(`Wrote input to: ${inputFilePath}`);

        // 4. Define the Docker image name. YOU MUST BUILD THIS IMAGE (see Step 4 below)
        const dockerImageName = 'cpp-judge-runner';

        // 5. Construct the Docker command to execute inside the container
        //    - 'docker run --rm': Run a container and remove it after it exits
        //    - '-v "${tempDirPath}:/usr/src/app"': Mount your host's temp directory into the container's /usr/src/app
        //      This makes user_code.cpp, input.txt, and output.txt accessible inside the container.
        //    - 'cpp-judge-runner': The name of the Docker image to use
        //    - '/bin/bash -c "..."': Execute a shell command inside the container
        //      - 'g++ /usr/src/app/user_code.cpp -o /usr/src/app/exec_code -std=c++17 -O2': Compile user_code.cpp
        //      - '&&': Logical AND, so the next command only runs if compilation succeeds
        //      - '/usr/src/app/exec_code < /usr/src/app/input.txt > /usr/src/app/output.txt':
        //        Execute the compiled code, redirecting input from input.txt and output to output.txt
        const dockerCommand = `docker run --rm -v "${tempDirPath}:/usr/src/app" ${dockerImageName} /bin/bash -c "g++ /usr/src/app/user_code.cpp -o /usr/src/app/exec_code -std=c++17 -O2 && /usr/src/app/exec_code < /usr/src/app/input.txt > /usr/src/app/output.txt"`;

        console.log(`Executing Docker command for ${submissionId}: ${dockerCommand}`);

        // Execute the Docker command
        const { stdout, stderr } = await new Promise((resolve, reject) => {
            // Set a timeout for the Docker command execution (in milliseconds)
            // This acts as your Time Limit for the entire judging process (compile + run)
            exec(dockerCommand, { timeout: timeLimit || 5000 }, (error, stdout, stderr) => {
                if (error) {
                    // If the command fails (e.g., compile error, runtime error, Docker issue)
                    reject(error);
                    return;
                }
                resolve({ stdout, stderr }); // Resolve with stdout/stderr from the docker command itself
            });
        });

        console.log(`Docker execution finished for ${submissionId}`);

        // 6. Read the actual output generated by the user's code from 'output.txt'
        // This file is in the mounted temporary directory on your host machine.
        let actualOutput = '';
        try {
            actualOutput = await fs.readFile(outputFilePath, 'utf8');
        } catch (readError) {
            console.error(`Could not read output file for ${submissionId}:`, readError.message);
            // This might happen if compilation failed and exec_code was never created
            // Or if the program crashed before writing anything.
        }

        // 7. Determine the judging verdict
        let verdict = 'Unknown Error';
        let detailMessage = '';

        if (stderr) {
            // Check for compiler errors
            if (stderr.includes("error:")) {
                verdict = "Compile Error";
                detailMessage = "Compilation failed.";
            } else if (stderr.includes("Killed")) {
                // Docker often reports "Killed" if memory limit exceeded
                verdict = "Memory Limit Exceeded";
                detailMessage = "Program used too much memory.";
            } else if (stderr.includes("timeout")) {
                // If exec timeout from Node.js child_process kicks in
                verdict = "Time Limit Exceeded (Server Timeout)";
                detailMessage = "Judging process exceeded server-side time limit.";
            }
            else {
                verdict = "Runtime Error";
                detailMessage = "Program crashed during execution.";
            }
            console.error(`Container stderr for ${submissionId}:`, stderr);
        } else if (stdout.includes("Command failed")) { // Catch if docker exec itself failed
             verdict = "Execution Failed";
             detailMessage = "Docker command failed to execute.";
        } else if (actualOutput.trim() === expectedOutput.trim()) {
            verdict = 'Accepted';
            detailMessage = "Your code produced the correct output.";
        } else {
            verdict = 'Wrong Answer';
            detailMessage = "Your code's output does not match the expected output.";
        }

        // 8. Send the judging result back to the client
        res.json({
            submissionId,
            status: 'completed',
            verdict,
            detail: detailMessage,
            actualOutput: actualOutput.trim(),
            expectedOutput: expectedOutput.trim(),
            // stdout and stderr from the 'docker run' command itself, not from inside the container program
            dockerCommandOutput: stdout.trim(),
            dockerCommandErrors: stderr.trim()
        });

    } catch (error) {
        console.error(`Judging failed for ${submissionId}:`, error);

        let errorMessage = 'An unexpected error occurred during judging.';
        let errorDetails = error.message;
        let verdict = 'Internal Error';

        if (error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
            errorMessage = 'Output buffer exceeded. Program produced too much output.';
            verdict = 'Output Limit Exceeded';
        } else if (error.killed && error.signal === 'SIGTERM') {
            errorMessage = 'Program was terminated due to timeout.';
            verdict = 'Time Limit Exceeded';
        } else if (error.message.includes('No such file or directory')) {
             errorMessage = 'Internal error: files not prepared correctly for judging container.';
             verdict = 'Internal Error';
        }


        res.status(500).json({
            submissionId,
            status: 'failed',
            verdict: verdict,
            error: errorMessage,
            details: errorDetails,
            cmd: error.cmd || 'N/A' // The command that failed, if available
        });

    } finally {
        // 9. Clean up the temporary directory
        // This is important to free up disk space and keep your system tidy
        try {
            if (await fs.stat(tempDirPath).catch(() => null)) { // Check if directory exists
                await fs.rm(tempDirPath, { recursive: true, force: true });
                console.log(`Cleaned up temp directory: ${tempDirPath}`);
            }
        } catch (cleanupError) {
            console.error(`Error cleaning up temp directory ${tempDirPath}:`, cleanupError.message);
        }
    }
});

// Start the Node.js server
app.listen(PORT, () => {
    console.log(`Judge Server running on http://localhost:${PORT}`);
    console.log('Ready to receive judging requests...');
});