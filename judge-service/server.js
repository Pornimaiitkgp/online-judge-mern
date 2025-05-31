
require('dotenv').config();
const express = require('express');
const Docker = require('dockerode');
const fs = require('fs').promises; // Using promises version of fs
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Although uuid is not used in the provided code, keeping it as it was present

const app = express();
app.use(express.json());

const docker = new Docker();

docker.ping((err, data) => {
    if (err) {
        console.error('Failed to connect to Docker daemon:', err.message);
        console.error('Please ensure Docker is running and accessible.');
        process.exit(1);
    }
    console.log('Successfully connected to Docker daemon.');
});

// Helper function to trim whitespace from strings for comparison
function normalizeOutput(str) {
    return str.trim().split(/\s+/).join(' ');
}

app.get('/', (req, res) => {
    res.send('Judge Service is running!');
});

app.post('/execute', async (req, res) => {
    const { submissionId, code, language, testCases } = req.body;

    if (!code || !language || !Array.isArray(testCases) || testCases.length === 0) {
        return res.status(400).json({ success: false, message: 'Code, language, and test cases are required.' });
    }

    let imageName;
    let compileCommand = '';
    let executeCommand = '';
    let fileName;
    // Use a unique directory for each submission to avoid conflicts
    const submissionDirPathInContainer = `/usr/src/app/${submissionId}`;
    let codeFileFullPathInContainer;

    switch (language) {
        case 'cpp':
            imageName = 'gcc:latest';
            fileName = `main.cpp`;
            codeFileFullPathInContainer = `${submissionDirPathInContainer}/${fileName}`;
            // Redirect stderr to a file for compilation errors
            compileCommand = `g++ ${codeFileFullPathInContainer} -o ${submissionDirPathInContainer}/a.out 2> ${submissionDirPathInContainer}/compile_err.txt`;
            executeCommand = `${submissionDirPathInContainer}/a.out`;
            break;
        case 'python':
            imageName = 'python:3.9-slim-buster';
            fileName = `main.py`;
            codeFileFullPathInContainer = `${submissionDirPathInContainer}/${fileName}`;
            executeCommand = `python ${codeFileFullPathInContainer}`;
            break;
        case 'java':
            imageName = 'openjdk:17-jdk-slim';
            fileName = `Main.java`;
            codeFileFullPathInContainer = `${submissionDirPathInContainer}/${fileName}`;
            // Redirect stderr to a file for compilation errors
            compileCommand = `javac ${codeFileFullPathInContainer} 2> ${submissionDirPathInContainer}/compile_err.txt`;
            executeCommand = `java -cp ${submissionDirPathInContainer} Main`;
            break;
        default:
            return res.status(400).json({ success: false, message: 'Unsupported language.' });
    }

    const containerName = `judge-${submissionId}`;
    let container;
    let finalStatus = 'Pending';
    let testCasesPassed = 0;
    const testCaseResults = [];
    let maxExecutionTime = 0;
    let maxMemoryUsed = 0;

    try {
        console.log(`[${submissionId}] Pulling image: ${imageName}`);
        await docker.pull(imageName);

        console.log(`[${submissionId}] Creating container: ${containerName}`);
        container = await docker.createContainer({
            Image: imageName,
            name: containerName,
            Tty: false,
            OpenStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            HostConfig: {
                AutoRemove: true,
                Memory: 256 * 1024 * 1024, // 256 MB memory limit
                CpuPeriod: 100000,
                CpuQuota: 50000, // 0.5 CPU share
                NetworkMode: 'none' // For security, no network access for user code
            }
        });

        console.log(`[${submissionId}] Starting container: ${containerName}`);
        await container.start();

        // 1. Create directory for this submission inside the container
        console.log(`[${submissionId}] Creating directory ${submissionDirPathInContainer} in container.`);
        const createDirExec = await container.exec({
            Cmd: ['mkdir', '-p', submissionDirPathInContainer],
            AttachStdout: true, AttachStderr: true
        });
        const createDirStream = await createDirExec.start({});
        await new Promise((resolve, reject) => {
            docker.modem.followProgress(createDirStream, (err, output) => {
                if (err) {
                    console.error(`[${submissionId}] Error creating dir:`, err, output);
                    return reject(err);
                }
                console.log(`[${submissionId}] Directory creation output:`, output.toString().trim());
                resolve(output);
            });
        });

        // 2. Write user's code to a file inside the container
        // IMPORTANT: Escaping the code string carefully. This is a common source of bugs.
        // We replace " with \" and also escape backticks and dollar signs if they appear in code,
        // as they can cause issues in shell commands.
        const escapedCode = code.replace(/\\/g, '\\\\') // Escape backslashes first
                               .replace(/"/g, '\\"')   // Then double quotes
                               .replace(/\$/g, '\\$')   // Escape dollar signs
                               .replace(/`/g, '\\`');   // Escape backticks

        const writeCodeCommand = `echo "${escapedCode}" > ${codeFileFullPathInContainer}`;
        console.log(`[${submissionId}] Writing code to ${codeFileFullPathInContainer} in container.`);
        // console.log(`[${submissionId}] Write command: ${writeCodeCommand}`); // For deep debugging the command itself

        const writeCodeExec = await container.exec({
            Cmd: ['sh', '-c', writeCodeCommand],
            AttachStdout: true, AttachStderr: true
        });
        const writeCodeStream = await writeCodeExec.start({});
        await new Promise((resolve, reject) => {
            docker.modem.followProgress(writeCodeStream, (err, output) => {
                if (err) {
                    console.error(`[${submissionId}] Error writing code:`, err, output);
                    return reject(err);
                }
                console.log(`[${submissionId}] Code write output (if any):`, output.toString().trim());
                resolve(output);
            });
        });

        
        // 3. Compile code (if C++ or Java)
        if (compileCommand) {
            console.log(`[${submissionId}] Compiling code for ${language}...`);
            console.log(`[${submissionId}] Compile command: ${compileCommand}`); // Log the actual compile command

            const compileExec = await container.exec({
                Cmd: ['sh', '-c', compileCommand],
                AttachStdout: true, // Attach to stdout of the compile command
                AttachStderr: true  // Attach to stderr of the compile command
            });

            // Start the exec command and get its stream
            const compileStream = await compileExec.start({});

            // Wait for the stream to end (meaning the compile command has finished)
            await new Promise((resolve, reject) => {
                let stdoutBuffer = '';
                let stderrBuffer = '';

                compileStream.on('data', (chunk) => {
                    const type = chunk[0];
                    const content = chunk.slice(8).toString('utf8');
                    if (type === 1) { // stdout
                        stdoutBuffer += content;
                    } else if (type === 2) { // stderr
                        stderrBuffer += content;
                    }
                });

                compileStream.on('end', () => {
                    // console.log(`[${submissionId}] Compile stdout:`, stdoutBuffer.trim()); // For debugging compiler's stdout
                    // console.log(`[${submissionId}] Compile stderr:`, stderrBuffer.trim()); // For debugging compiler's stderr
                    resolve();
                });
                compileStream.on('error', (err) => {
                    console.error(`[${submissionId}] Error during compile stream:`, err);
                    reject(err);
                });
            });

            // After the stream ends, inspect the exec instance to get its final exit code
            const compileInspectResult = await compileExec.inspect();
            const compileExitCode = compileInspectResult.ExitCode; // This is how you reliably get the exit code

            console.log(`[${submissionId}] Compilation command exited with code: ${compileExitCode}`);

            // Read compilation errors from the file (compile_err.txt)
            // This is still important as g++ sends errors to stderr, which is redirected to this file
            const readCompileErrorExec = await container.exec({ Cmd: ['cat', `${submissionDirPathInContainer}/compile_err.txt`], AttachStdout: true, AttachStderr: true });
            const compileErrorStream = await readCompileErrorExec.start({});
            const compilationOutput = await new Promise((resolve, reject) => {
                let output = '';
                compileErrorStream.on('data', (chunk) => output += chunk.toString('utf8'));
                compileErrorStream.on('end', () => {
                    console.log(`[${submissionId}] --- Raw Compiler Error Output from ${submissionDirPathInContainer}/compile_err.txt ---`);
                    console.log(output.trim()); // This should now contain detailed errors if any
                    console.log('----------------------------------------------------');
                    resolve(output);
                });
                compileErrorStream.on('error', reject);
            });

            if (compileExitCode !== 0) { // Now this check should be reliable
                finalStatus = 'Compilation Error';
                return res.json({
                    success: true,
                    status: finalStatus,
                    message: 'Compilation failed.',
                    output: compilationOutput.trim(), // Send the actual compiler errors back to the client
                    totalExecutionTime: 0,
                    maxMemoryUsed: 0,
                    testCasesPassed: 0,
                    totalTestCases: testCases.length,
                    testCaseResults: [{ status: 'Compilation Error', output: compilationOutput.trim() }]
                });
            }
            console.log(`[${submissionId}] Compilation successful.`);
        }

        
            
        // 4. Execute code for each test case
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`[${submissionId}] Executing test case ${i + 1} for ${language}...`);
            console.log(`[${submissionId}] Execution command: ${executeCommand}`); // Log execution command

            const executeExec = await container.exec({
                Cmd: ['sh', '-c', executeCommand],
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                Tty: false
            });

            const executeStream = await executeExec.start({ hijack: true, stdin: true });

            const startTime = process.hrtime.bigint(); // High-resolution time start

            // Write input to stdin of the running program
            executeStream.write(testCase.input + '\n'); // Add newline for typical input
            executeStream.end(); // Close stdin after writing

            let executionRawStdout = '';
            let executionRawStderr = ''; // Capture stderr from execution as well

            executeStream.on('data', (chunk) => {
                const type = chunk[0];
                const content = chunk.slice(8).toString('utf8');
                if (type === 1) { // stdout
                    executionRawStdout += content;
                } else if (type === 2) { // stderr
                    executionRawStderr += content;
                }
            });

            const { exitCode: executeExitCode } = await new Promise((resolve, reject) => {
                executeStream.on('end', async () => {
                    const data = await executeExec.inspect();
                    resolve(data);
                });
                executeStream.on('error', (err) => {
                    console.error(`[${submissionId}] Error during execution stream:`, err);
                    reject(err);
                });
            });

            const endTime = process.hrtime.bigint();
            const executionTimeMs = Number(endTime - startTime) / 1_000_000;
            maxExecutionTime = Math.max(maxExecutionTime, executionTimeMs);

            let currentTestCaseStatus = 'Runtime Error';
            let message = 'Runtime Error.';
            let outputForTestCase = executionRawStdout.trim(); // User's program stdout

            console.log(`[${submissionId}] Test Case ${i+1} Exit Code: ${executeExitCode}`);
            console.log(`[${submissionId}] Test Case ${i+1} Raw STDOUT:`, executionRawStdout.trim());
            console.log(`[${submissionId}] Test Case ${i+1} Raw STDERR:`, executionRawStderr.trim());

            if (executeExitCode === 0) {
                const normalizedUserOutput = normalizeOutput(outputForTestCase);
                const normalizedExpectedOutput = normalizeOutput(testCase.output);

                if (normalizedUserOutput === normalizedExpectedOutput) {
                    currentTestCaseStatus = 'Accepted';
                    testCasesPassed++;
                    message = 'Accepted';
                } else {
                    currentTestCaseStatus = 'Wrong Answer';
                    message = 'Wrong Answer. Output mismatch.';
                }
            } else { // Non-zero exit code
                // Check for specific error types based on stderr or exit code
                if (executeExitCode === 137) { // 128 + 9 (SIGKILL), often indicates OOM or forcefully killed
                    currentTestCaseStatus = 'Memory Limit Exceeded';
                    message = 'Memory Limit Exceeded. (Likely SIGKILL)';
                } else if (executionRawStderr.includes('timeout')) { // Custom check if we implement timeout
                    currentTestCaseStatus = 'Time Limit Exceeded';
                    message = 'Time Limit Exceeded.';
                } else {
                    currentTestCaseStatus = 'Runtime Error';
                    message = executionRawStderr.trim() || 'Program terminated with a non-zero exit code.';
                }
            }

            testCaseResults.push({
                testCase: i + 1,
                status: currentTestCaseStatus,
                message: message,
                input: testCase.input,
                expectedOutput: testCase.output,
                userOutput: outputForTestCase, // Still stdout from user's program
                errorOutput: executionRawStderr.trim(), // Capture stderr for runtime errors
                executionTime: executionTimeMs.toFixed(2),
                memoryUsed: 'N/A'
            });

            if (currentTestCaseStatus !== 'Accepted' && currentTestCaseStatus !== 'Wrong Answer') {
                // If it's a critical error (e.g., TLE, MLE, Runtime Error), stop further test cases
                // For 'Wrong Answer', we might want to run all test cases.
                // This is a policy decision. For now, let's process all.
            }
        }

        // Determine final submission status based on all test case results
        if (testCasesPassed === testCases.length) {
            finalStatus = 'Accepted';
        } else if (testCaseResults.some(res => res.status === 'Compilation Error')) {
            finalStatus = 'Compilation Error';
        } else if (testCaseResults.some(res => res.status === 'Time Limit Exceeded')) {
            finalStatus = 'Time Limit Exceeded';
        } else if (testCaseResults.some(res => res.status === 'Memory Limit Exceeded')) {
            finalStatus = 'Memory Limit Exceeded';
        } else if (testCaseResults.some(res => res.status === 'Runtime Error')) {
            finalStatus = 'Runtime Error';
        } else if (testCaseResults.some(res => res.status === 'Wrong Answer')) {
            finalStatus = 'Wrong Answer';
        } else {
            finalStatus = 'Error'; // Fallback
        }

        // Clean up: Remove the submission directory
        console.log(`[${submissionId}] Cleaning up ${submissionDirPathInContainer}...`);
        const cleanupExec = await container.exec({
            Cmd: ['rm', '-rf', submissionDirPathInContainer],
            AttachStdout: true, AttachStderr: true
        });
        const cleanupStream = await cleanupExec.start({});
        await new Promise((resolve, reject) => {
            docker.modem.followProgress(cleanupStream, (err, output) => {
                if (err) {
                    console.error(`[${submissionId}] Error during cleanup:`, err, output);
                    return reject(err);
                }
                console.log(`[${submissionId}] Cleanup output:`, output.toString().trim());
                resolve(output);
            });
        });
        console.log(`[${submissionId}] Cleaned up ${submissionDirPathInContainer} for ${submissionId}`);

        res.json({
            success: true,
            status: finalStatus,
            message: `Judgement complete. ${testCasesPassed}/${testCases.length} test cases passed.`,
            totalExecutionTime: maxExecutionTime.toFixed(2),
            maxMemoryUsed: maxMemoryUsed, // Still N/A for now
            testCasesPassed: testCasesPassed,
            totalTestCases: testCases.length,
            testCaseResults: testCaseResults // Detailed results for frontend display later
        });

    } catch (err) {
        console.error(`[${submissionId}] Judge Service Critical Error:`, err);
        let errorMessage = 'Failed to execute code in judge service due to internal error.';
        let status = 'Error';
        if (err.statusCode === 404 && err.json && err.json.message.includes('No such image')) {
            errorMessage = `Docker image '${imageName}' not found or could not be pulled. Ensure Docker is running and image exists.`;
            status = 'Judge_Setup_Error';
        } else if (err.message.includes('connect ECONNREFUSED')) {
            errorMessage = 'Could not connect to Docker daemon. Is Docker running?';
            status = 'Judge_Setup_Error';
        } else {
            // General catch-all error for unhandled issues in judge service
            errorMessage = `Judge service internal error: ${err.message}`;
            status = 'Judge_Internal_Error';
        }

        res.status(500).json({
            success: false,
            status: status,
            message: errorMessage,
            error: err.message,
            totalExecutionTime: 0,
            maxMemoryUsed: 0,
            testCasesPassed: 0,
            totalTestCases: testCases ? testCases.length : 0,
            testCaseResults: []
        });
    } finally {
        if (container) {
            try {
                // In case AutoRemove: true failed or container got stuck, try to remove
                // This is a safety net
                const containerInfo = await container.inspect().catch(() => null);
                if (containerInfo && (containerInfo.State.Running || containerInfo.State.Paused)) {
                    console.log(`[${submissionId}] Stopping and removing lingering container ${containerName}...`);
                    await container.stop().catch(e => console.error(`[${submissionId}] Error stopping container:`, e.message));
                    await container.remove().catch(e => console.error(`[${submissionId}] Error removing container:`, e.message));
                } else if (containerInfo) {
                     console.log(`[${submissionId}] Container ${containerName} was already stopped/removed.`);
                }
            } catch (cleanupErr) {
                console.error(`[${submissionId}] Unexpected error during final container cleanup:`, cleanupErr.message);
            }
        }
    }
});

const PORT = process.env.JUDGE_PORT || 5001;
app.listen(PORT, () => console.log(`Judge Service running on port ${PORT}`));