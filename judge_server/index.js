// // online_judge/judge_server/index.js
// import express from 'express';
// import { exec } from 'child_process';
// import path from 'path';
// import fs from 'fs/promises'; // Use fs.promises for async file operations
// import { fileURLToPath } from 'url';
// import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs


// // Resolve __dirname in ES module
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// app.use(express.json());

// const TEMP_CODE_DIR = path.join(__dirname, 'temp_submissions');

// // Ensure the temporary directory exists
// fs.mkdir(TEMP_CODE_DIR, { recursive: true }).catch(console.error);

// // Helper function to execute shell commands
// const executeShellCommand = (command, options = {}) => {
//     return new Promise((resolve, reject) => {
//         exec(command, options, (error, stdout, stderr) => {
//             if (error) {
//                 // If the command itself failed (e.g., docker not found, syntax error in command)
//                 // console.error(`Command Error: ${error.message}`);
//                 // console.error(`Stderr: ${stderr}`);
//                 // console.error(`Stdout: ${stdout}`);
//                 reject(new Error(`Command failed: ${command}\nError: ${error.message}\nStderr: ${stderr}\nStdout: ${stdout}`));
//             } else {
//                 resolve({ stdout, stderr });
//             }
//         });
//     });
// };

// app.post('/judge/:language', async (req, res) => {
//     const { submissionId, code, language, testCases, timeLimit, memoryLimit } = req.body;

//     // Use submissionId if provided, otherwise generate a new one
//     const submissionIdToUse = submissionId || uuidv4();
//     const submissionTempDir = path.join(TEMP_CODE_DIR, submissionIdToUse);

//     try {
//         await fs.mkdir(submissionTempDir, { recursive: true });

//         let filename, compileCommand, runCommand, dockerImage;

//         switch (language) {
//             case 'cpp':
//                 filename = 'user_code.cpp';
//                 dockerImage = 'cpp-judge-runner'; // Make sure this Docker image is built
//                 compileCommand = `g++ /usr/src/app/${filename} -o /usr/src/app/exec_code -std=c++17 -O2`;
//                 runCommand = `/usr/src/app/exec_code`; // Input/Output handled by redirection in Docker command
//                 break;
//             case 'python':
//                 filename = 'user_code.py';
//                 dockerImage = 'python-judge-runner'; // You'll need to build this
//                 compileCommand = ''; // Python is interpreted, no explicit compile step
//                 runCommand = `python3 /usr/src/app/${filename}`;
//                 break;
//             case 'java':
//                 filename = 'Main.java'; // Assuming main class is Main
//                 dockerImage = 'java-judge-runner'; // You'll need to build this
//                 compileCommand = `javac /usr/src/app/${filename}`;
//                 runCommand = `java -classpath /usr/src/app Main`;
//                 break;
//             default:
//                 return res.status(400).json({ status: 'failed', verdict: 'Invalid Language', error: `Language ${language} not supported.` });
//         }

//         await fs.writeFile(path.join(submissionTempDir, filename), code);

//         const results = [];
//         let overallVerdict = 'Accepted';
//         let overallExecutionTime = 0;
//         let overallMemoryUsed = 0;
//         let testCasesPassedCount = 0;
//         let compilerOutput = '';

//         // --- Compilation Step (for compiled languages like C++, Java) ---
//         if (compileCommand) {
//             try {
//                 const dockerCompileCommand = `docker run --rm -v "${submissionTempDir}:/usr/src/app" ${dockerImage} /bin/bash -c "${compileCommand} 2> /usr/src/app/compiler_errors.txt"`;
//                 await executeShellCommand(dockerCompileCommand);
//                 compilerOutput = await fs.readFile(path.join(submissionTempDir, 'compiler_errors.txt'), 'utf8');
//                 if (compilerOutput.trim() !== '') {
//                     overallVerdict = 'Compilation Error';
//                     // No need to run test cases if compilation fails
//                     return res.json({
//                         submissionId: submissionIdToUse,
//                         status: 'completed',
//                         verdict: overallVerdict,
//                         compilerOutput: compilerOutput.trim(),
//                         detail: 'Compilation failed.',
//                         testCasesPassed: 0,
//                         totalTestCases: testCases.length,
//                         detailedResults: results
//                     });
//                 }
//             } catch (compileErr) {
//                 // This catch handles errors from `docker run` itself or severe compilation issues
//                 console.error(`Compilation Docker Command Error: ${compileErr.message}`);
//                 compilerOutput = compileErr.message; // Capture the error message
//                 overallVerdict = 'Compilation Error';
//                  return res.json({
//                     submissionId: submissionIdToUse,
//                     status: 'completed',
//                     verdict: overallVerdict,
//                     compilerOutput: compilerOutput.trim(),
//                     detail: 'Compilation failed due to an internal error or syntax issues.',
//                     testCasesPassed: 0,
//                     totalTestCases: testCases.length,
//                     detailedResults: results
//                 });
//             }
//         }


//         // --- Test Case Execution ---
//         if (!testCases || testCases.length === 0) {
//             overallVerdict = 'No Test Cases';
//             return res.json({
//                 submissionId: submissionIdToUse,
//                 status: 'completed',
//                 verdict: overallVerdict,
//                 detail: 'No test cases provided for judging.',
//                 testCasesPassed: 0,
//                 totalTestCases: 0,
//                 detailedResults: []
//             });
//         }


//         for (let i = 0; i < testCases.length; i++) {
//             const { input, expectedOutput, isSample } = testCases[i];
//             const inputFilePath = path.join(submissionTempDir, `input_${i}.txt`);
//             const outputFilePath = path.join(submissionTempDir, `output_${i}.txt`);
//             const errorFilePath = path.join(submissionTempDir, `error_${i}.txt`);

//             await fs.writeFile(inputFilePath, input);

//             const dockerRunCmd = `docker run --rm -v "${submissionTempDir}:/usr/src/app" ${dockerImage} /bin/bash -c "timeout ${timeLimit / 1000} ${runCommand} < /usr/src/app/input_${i}.txt > /usr/src/app/output_${i}.txt 2> /usr/src/app/error_${i}.txt"`;

//             let userOutput = '';
//             let stderrOutput = '';
//             let testVerdict = 'Accepted';
//             let message = '';
//             let executionTime = 0; // Placeholder for now, actual measurement is complex
//             let memoryUsed = 'N/A'; // Placeholder for now, actual measurement is complex

//             try {
//                 // Measure execution time (simple approach, for more accurate, use `time` command inside container)
//                 const startTime = process.hrtime.bigint();
//                 await executeShellCommand(dockerRunCmd);
//                 const endTime = process.hrtime.bigint();
//                 executionTime = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds

//                 userOutput = await fs.readFile(outputFilePath, 'utf8');
//                 stderrOutput = await fs.readFile(errorFilePath, 'utf8');

//                 // Basic output comparison
//                 if (stderrOutput.trim() !== '') {
//                     testVerdict = 'Runtime Error';
//                     message = 'Program terminated with runtime errors.';
//                     overallVerdict = overallVerdict === 'Accepted' ? testVerdict : overallVerdict; // Prioritize worse verdict
//                 } else if (userOutput.trim() !== expectedOutput.trim()) {
//                     testVerdict = 'Wrong Answer';
//                     message = 'Output does not match expected output.';
//                     overallVerdict = overallVerdict === 'Accepted' ? testVerdict : overallVerdict; // Prioritize worse verdict
//                 } else {
//                     testCasesPassedCount++;
//                 }

//             } catch (runErr) {
//                 userOutput = await fs.readFile(outputFilePath, 'utf8').catch(() => ''); // Try to read output even on error
//                 stderrOutput = await fs.readFile(errorFilePath, 'utf8').catch(() => ''); // Try to read stderr even on error

//                 if (runErr.message.includes('Command failed: docker run') && runErr.message.includes('timeout')) {
//                     testVerdict = 'Time Limit Exceeded';
//                     message = `Execution exceeded time limit of ${timeLimit / 1000} seconds.`;
//                     overallVerdict = overallVerdict === 'Accepted' ? testVerdict : overallVerdict;
//                 } else if (runErr.message.includes('Memory Limit Exceeded')) { // You'd need specific Docker resource limits for this
//                     testVerdict = 'Memory Limit Exceeded';
//                     message = 'Execution exceeded memory limit.';
//                     overallVerdict = overallVerdict === 'Accepted' ? testVerdict : overallVerdict;
//                 } else {
//                     testVerdict = 'Runtime Error';
//                     message = `An error occurred during execution: ${runErr.message.split('\n')[0]}`;
//                     overallVerdict = overallVerdict === 'Accepted' ? testVerdict : overallVerdict;
//                 }
//             } finally {
//                 results.push({
//                     testCase: i + 1,
//                     status: testVerdict,
//                     message: message,
//                     executionTime: executionTime,
//                     memoryUsed: memoryUsed,
//                     expectedOutput: expectedOutput.trim(),
//                     userOutput: userOutput.trim(),
//                     stderr: stderrOutput.trim(),
//                     isSample: isSample
//                 });
//                 // Clean up files for this test case (optional, can clean all at once at the end)
//                 await fs.unlink(inputFilePath).catch(() => {});
//                 await fs.unlink(outputFilePath).catch(() => {});
//                 await fs.unlink(errorFilePath).catch(() => {});
//             }
//         }

//         console.log('Judge Server: Final overallVerdict:', overallVerdict);
//         console.log('Judge Server: Final detailedResults:', detailedResults);
//         console.log('Judge Server: Final testCasesPassedCount:', testCasesPassedCount);

//         // Final response
//         res.json({
//             submissionId: submissionIdToUse,
//             status: 'completed', // Judge server completed its work
//             verdict: overallVerdict,
//             compilerOutput: compilerOutput.trim(),
//             executionTime: overallExecutionTime, // Max time across all test cases
//             memoryUsed: overallMemoryUsed, // Max memory across all test cases
//             testCasesPassed: testCasesPassedCount,
//             totalTestCases: testCases.length,
//             detailedResults: results,
//             detail: overallVerdict === 'Accepted' ? 'Solution accepted!' : `Solution failed: ${overallVerdict}`
//         });

//     } catch (error) {
//         console.error('Judge Server Internal Error:', error);
//         res.status(500).json({
//             submissionId: submissionIdToUse,
//             status: 'failed',
//             verdict: 'Internal Error',
//             error: 'An unexpected error occurred during judging.',
//             details: error.message, // Provide more details for debugging
//             cmd: error.command || '' // If executeShellCommand provided a command field
//         });
//     } finally {
//         // Clean up the temporary submission directory
//         if (submissionTempDir && submissionTempDir.startsWith(TEMP_CODE_DIR)) { // Safety check
//             await fs.rm(submissionTempDir, { recursive: true, force: true }).catch(console.error);
//         }
//     }
// });

// const JUDGE_PORT = process.env.JUDGE_PORT || 3001; // Ensure this matches your backend's proxy target
// app.listen(JUDGE_PORT, () => {
//     console.log(`Judge Server listening on port ${JUDGE_PORT}!`);
// });


// online_judge/judge_server/index.js
import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises'; // Use fs.promises for async file operations
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs


// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const TEMP_CODE_DIR = path.join(__dirname, 'temp_submissions');

// Ensure the temporary directory exists
fs.mkdir(TEMP_CODE_DIR, { recursive: true }).catch(console.error);

// Helper function to execute shell commands
const executeShellCommand = (command, options = {}) => {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                // If the command itself failed (e.g., docker not found, syntax error in command)
                // console.error(`Command Error: ${error.message}`);
                // console.error(`Stderr: ${stderr}`);
                // console.error(`Stdout: ${stdout}`);
                reject(new Error(`Command failed: ${command}\nError: ${error.message}\nStderr: ${stderr}\nStdout: ${stdout}`));
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
};

app.post('/judge/:language', async (req, res) => {
    const { submissionId, code, language, testCases, timeLimit, memoryLimit } = req.body;

    // Use submissionId if provided, otherwise generate a new one
    const submissionIdToUse = submissionId || uuidv4();
    const submissionTempDir = path.join(TEMP_CODE_DIR, submissionIdToUse);

    try {
        await fs.mkdir(submissionTempDir, { recursive: true });

        let filename, compileCommand, runCommand, dockerImage;

        switch (language) {
            case 'cpp':
                filename = 'user_code.cpp';
                dockerImage = 'cpp-judge-runner'; // Make sure this Docker image is built
                compileCommand = `g++ /usr/src/app/${filename} -o /usr/src/app/exec_code -std=c++17 -O2`;
                runCommand = `/usr/src/app/exec_code`; // Input/Output handled by redirection in Docker command
                break;
            case 'python':
                filename = 'user_code.py';
                dockerImage = 'python-judge-runner'; // You'll need to build this
                compileCommand = ''; // Python is interpreted, no explicit compile step
                runCommand = `python3 /usr/src/app/${filename}`;
                break;
            case 'java':
                filename = 'Main.java'; // Assuming main class is Main
                dockerImage = 'java-judge-runner'; // You'll need to build this
                compileCommand = `javac /usr/src/app/${filename}`;
                runCommand = `java -classpath /usr/src/app Main`;
                break;
            default:
                return res.status(400).json({ status: 'failed', verdict: 'Invalid Language', error: `Language ${language} not supported.` });
        }

        await fs.writeFile(path.join(submissionTempDir, filename), code);

        const detailedResults = []; // Renamed from 'results' for clarity
        let overallVerdict = 'Accepted';
        let totalExecutionTime = 0; // Sum of execution times, or max
        let maxMemoryUsed = 0; // Max memory across test cases
        let testCasesPassedCount = 0;
        let compilerOutput = '';
        let submissionStatus = 'completed'; // Default status

        // --- Compilation Step (for compiled languages like C++, Java) ---
        if (compileCommand) {
            try {
                // Ensure compiler_errors.txt exists even if empty, before reading
                await fs.writeFile(path.join(submissionTempDir, 'compiler_errors.txt'), '');
                const dockerCompileCommand = `docker run --rm -v "${submissionTempDir}:/usr/src/app" ${dockerImage} /bin/bash -c "${compileCommand} 2> /usr/src/app/compiler_errors.txt"`;
                await executeShellCommand(dockerCompileCommand);
                compilerOutput = await fs.readFile(path.join(submissionTempDir, 'compiler_errors.txt'), 'utf8');

                if (compilerOutput.trim() !== '') {
                    overallVerdict = 'Compilation Error';
                    submissionStatus = 'failed'; // Mark as failed due to compilation
                    // No need to run test cases if compilation fails
                    console.log('Judge Server: Final overallVerdict (Compilation Error):', overallVerdict);
                    console.log('Judge Server: Final detailedResults (Compilation Error):', detailedResults);
                    console.log('Judge Server: Final testCasesPassedCount (Compilation Error):', 0);
                    return res.json({
                        submissionId: submissionIdToUse,
                        status: submissionStatus,
                        verdict: overallVerdict,
                        compilerOutput: compilerOutput.trim(),
                        detail: 'Compilation failed.',
                        testCasesPassed: 0,
                        totalTestCases: testCases.length, // Still show total test cases available
                        detailedResults: detailedResults // Empty, as no tests were run
                    });
                }
            } catch (compileErr) {
                console.error(`Compilation Docker Command Error: ${compileErr.message}`);
                compilerOutput = compileErr.message; // Capture the error message
                overallVerdict = 'Compilation Error';
                submissionStatus = 'failed';
                console.log('Judge Server: Final overallVerdict (Compilation Error Catch):', overallVerdict);
                console.log('Judge Server: Final detailedResults (Compilation Error Catch):', detailedResults);
                console.log('Judge Server: Final testCasesPassedCount (Compilation Error Catch):', 0);
                 return res.json({
                    submissionId: submissionIdToUse,
                    status: submissionStatus,
                    verdict: overallVerdict,
                    compilerOutput: compilerOutput.trim(),
                    detail: 'Compilation failed due to an internal error or syntax issues.',
                    testCasesPassed: 0,
                    totalTestCases: testCases.length,
                    detailedResults: detailedResults
                });
            }
        }


        // --- Test Case Execution ---
        if (!testCases || testCases.length === 0) {
            overallVerdict = 'No Test Cases';
            submissionStatus = 'completed'; // Or 'skipped' depending on desired status
            console.log('Judge Server: Final overallVerdict (No Test Cases):', overallVerdict);
            console.log('Judge Server: Final detailedResults (No Test Cases):', detailedResults);
            console.log('Judge Server: Final testCasesPassedCount (No Test Cases):', 0);
            return res.json({
                submissionId: submissionIdToUse,
                status: submissionStatus,
                verdict: overallVerdict,
                detail: 'No test cases provided for judging.',
                testCasesPassed: 0,
                totalTestCases: 0,
                detailedResults: []
            });
        }


        for (let i = 0; i < testCases.length; i++) {
            const { input, expectedOutput, isSample } = testCases[i];
            const inputFilePath = path.join(submissionTempDir, `input_${i}.txt`);
            const outputFilePath = path.join(submissionTempDir, `output_${i}.txt`);
            const errorFilePath = path.join(submissionTempDir, `error_${i}.txt`);

            await fs.writeFile(inputFilePath, input);
            await fs.writeFile(outputFilePath, ''); // Ensure output file exists and is empty before run
            await fs.writeFile(errorFilePath, ''); // Ensure error file exists and is empty before run

            // Docker command to run the code with input/output redirection and timeout
            const dockerRunCmd = `docker run --rm -v "${submissionTempDir}:/usr/src/app" ${dockerImage} /bin/bash -c "timeout ${timeLimit / 1000} ${runCommand} < /usr/src/app/input_${i}.txt > /usr/src/app/output_${i}.txt 2> /usr/src/app/error_${i}.txt"`;

            let actualOutput = ''; // Renamed from userOutput for clarity and consistency with frontend
            let stderrOutput = '';
            let testVerdict = 'Accepted'; // Default for this test case
            let message = '';
            let executionTime = 0;
            let memoryUsed = 'N/A'; // For proper memory measurement, cgroup v2 limits are needed
            let passedThisTestCase = false; // <-- NEW: Flag for this specific test case

            try {
                const startTime = process.hrtime.bigint();
                await executeShellCommand(dockerRunCmd);
                const endTime = process.hrtime.bigint();
                executionTime = Number(endTime - startTime) / 1_000_000; // ms

                actualOutput = (await fs.readFile(outputFilePath, 'utf8')).trim(); // Read actual output, trim whitespace
                stderrOutput = (await fs.readFile(errorFilePath, 'utf8')).trim(); // Read stderr, trim whitespace

                if (stderrOutput !== '') {
                    testVerdict = 'Runtime Error';
                    message = 'Program terminated with runtime errors.';
                    // If a test case fails, the overall verdict should reflect the worst outcome
                    if (overallVerdict === 'Accepted') overallVerdict = testVerdict;
                } else if (actualOutput !== expectedOutput.trim()) { // Compare trimmed outputs
                    testVerdict = 'Wrong Answer';
                    message = 'Output does not match expected output.';
                    if (overallVerdict === 'Accepted' || overallVerdict === 'Runtime Error') overallVerdict = testVerdict; // Wrong Answer is typically worse than RTE for judging
                } else {
                    testVerdict = 'Accepted'; // This test case passed
                    passedThisTestCase = true; // Mark as passed
                    testCasesPassedCount++; // Increment overall count
                }

            } catch (runErr) {
                // Read outputs even if command failed, they might contain partial data
                actualOutput = await fs.readFile(outputFilePath, 'utf8').catch(() => '').trim();
                stderrOutput = await fs.readFile(errorFilePath, 'utf8').catch(() => '').trim();

                if (runErr.message.includes('timeout')) {
                    testVerdict = 'Time Limit Exceeded';
                    message = `Execution exceeded time limit of ${timeLimit / 1000} seconds.`;
                    if (overallVerdict === 'Accepted') overallVerdict = testVerdict;
                } else if (runErr.message.includes('Memory Limit Exceeded')) {
                    testVerdict = 'Memory Limit Exceeded';
                    message = 'Execution exceeded memory limit.';
                    if (overallVerdict === 'Accepted') overallVerdict = testVerdict;
                } else {
                    testVerdict = 'Runtime Error';
                    message = `An error occurred during execution: ${runErr.message.split('\n')[0]} - Stderr: ${stderrOutput}`;
                    if (overallVerdict === 'Accepted') overallVerdict = testVerdict;
                }
            } finally {
                detailedResults.push({
                    testCase: i + 1,
                    status: testVerdict,       // The verdict for this specific test case (e.g., "Accepted", "Wrong Answer")
                    passed: passedThisTestCase, // <-- NEW: Boolean flag for frontend
                    message: message,
                    executionTime: executionTime,
                    memoryUsed: memoryUsed,
                    input: input,              // <-- NEW: Store original input
                    expectedOutput: expectedOutput.trim(),
                    actualOutput: actualOutput, // <-- Renamed and ensured it's captured
                    stderr: stderrOutput,
                    isSample: isSample
                });
                // Update overall execution time (e.g., take the max or sum)
                totalExecutionTime += executionTime; // Sum for simplicity, could be max
                // Max memory is harder without proper cgroup integration, keeping as N/A for now
            }
        }


        // Final response
        console.log('Judge Server: Final overallVerdict:', overallVerdict);
        console.log('Judge Server: Final detailedResults:', detailedResults);
        console.log('Judge Server: Final testCasesPassedCount:', testCasesPassedCount);

        res.json({
            submissionId: submissionIdToUse,
            status: 'completed', // Judge server completed its work
            verdict: overallVerdict,
            compilerOutput: compilerOutput.trim(),
            executionTime: totalExecutionTime, // Or max execution time across tests
            memoryUsed: maxMemoryUsed, // Max memory across tests
            testCasesPassed: testCasesPassedCount,
            totalTestCases: testCases.length,
            detailedResults: detailedResults, // Send the array with 'passed' boolean
            detail: overallVerdict === 'Accepted' ? 'Solution accepted!' : `Solution failed: ${overallVerdict}`
        });

    } catch (error) {
        console.error('Judge Server Internal Error:', error);
        res.status(500).json({
            submissionId: submissionIdToUse,
            status: 'failed',
            verdict: 'Internal Error',
            error: 'An unexpected error occurred during judging.',
            details: error.message, // Provide more details for debugging
            cmd: error.command || ''
        });
    } finally {
        // Clean up the temporary submission directory
        if (submissionTempDir && submissionTempDir.startsWith(TEMP_CODE_DIR)) { // Safety check
            await fs.rm(submissionTempDir, { recursive: true, force: true }).catch(console.error);
        }
    }
});

const JUDGE_PORT = process.env.JUDGE_PORT || 3001;
app.listen(JUDGE_PORT, () => {
    console.log(`Judge Server listening on port ${JUDGE_PORT}!`);
});