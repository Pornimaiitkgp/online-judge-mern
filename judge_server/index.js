
// online_judge/judge_server/index.js
import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import * as fs from 'fs'; // Use fs.promises for async file operations
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs


// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const TEMP_CODE_DIR = path.join(__dirname, 'temp_submissions');

// Ensure the temporary directory exists
fs.mkdirSync(TEMP_CODE_DIR, { recursive: true });

// Helper function to execute shell commands
const executeShellCommand = (command, options = {}) => {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
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


    try{
         fs.mkdirSync(submissionTempDir, { recursive: true });
        let fileName,filePath, compileCommand, runCommand, outputPath;

        switch (language) {
            case 'cpp': 
                fileName=  'code.cpp';
                filePath = path.join(submissionTempDir, fileName);
                outputPath =  path.join(submissionTempDir, 'code.out');
                compileCommand = `g++ ${filePath} -o ${outputPath} -std=c++17 -O2`;
                break;
            case 'python':
                fileName = 'code.py';
                filePath = path.join(submissionTempDir, fileName);
                compileCommand = ''; // No compilation needed for Python
                break;
            case 'java':
                fileName = 'Main.java';
                filePath = path.join(submissionTempDir, fileName);
                compileCommand = `javac ${filePath} -d ${submissionTempDir}`;
                break;

        }
         fs.writeFileSync(filePath, code);
        const detailedResults = []; // Renamed from 'results' for clarity
        let overallVerdict = 'Accepted';
        let totalExecutionTime = 0; // Sum of execution times, or max
        let maxMemoryUsed = 0; // Max memory across test cases
        let testCasesPassedCount = 0;
        let compilerOutput = '';
        let submissionStatus = 'completed';
        if (compileCommand !== '') {
            compilerOutput=await executeShellCommand(compileCommand);
            if (compilerOutput.stderr !== '') {
                overallVerdict = 'Compilation Error';
                submissionStatus = 'failed'; // Mark as failed due to compilation
                console.log('Judge Server: Final overallVerdict (Compilation Error):', overallVerdict);
                console.log('Judge Server: Final detailedResults (Compilation Error):', detailedResults);
                console.log('Judge Server: Final testCasesPassedCount (Compilation Error):', 0);
                console.log('Judge Server: Compiler Output:', compilerOutput.stderr);
                return res.json({
                    submissionId: submissionIdToUse,
                    status: submissionStatus,
                    verdict: overallVerdict,
                    compilerOutput: compilerOutput, // Already trimmed by helper
                    detail: 'Compilation failed.',
                    testCasesPassed: 0,
                    totalTestCases: testCases.length,
                    detailedResults: detailedResults
                });
            }
        }
       

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

             fs.writeFileSync(inputFilePath, input);
             fs.writeFileSync(outputFilePath, ''); // Ensure output file exists and is empty before run

            // Docker command to run the code with input/output redirection and timeout
            switch (language){
                case "cpp":
                    runCommand = `cd ${submissionTempDir} && ./code.out < ${inputFilePath}`;
                    break
                case "python":
                    runCommand = `cd ${submissionTempDir} && python3 code.py ${inputFilePath}`;
                    break;
                case "java":
                    runCommand = `cd ${submissionTempDir} && java Main < ${inputFilePath}`;
                    break;
                 

            }
            

            let executionOutput; // To store the output of the command execution
            let stderrOutput = ''; // To capture any stderr output during execution
            let actualOutput = ''; // Renamed from userOutput for clarity and consistency with frontend
            let testVerdict = 'Accepted'; // Default for this test case
            let message = '';
            let executionTime = 0;
            let memoryUsed = 'N/A'; // For proper memory measurement, cgroup v2 limits are needed
            let passedThisTestCase = false; // Flag for this specific test case

            try {
                const startTime = process.hrtime.bigint();
                executionOutput=await executeShellCommand(runCommand);
                const endTime = process.hrtime.bigint();
                executionTime = Number(endTime - startTime) / 1_000_000; // ms

                actualOutput= executionOutput.stdout.trim(); // Get the actual output from the command execution
                stderrOutput = executionOutput.stderr.trim(); // Capture any stderr output
                // --- START DEBUG LOGS: Read outputs ---
                console.log(`DEBUG: Test Case ${i + 1} - Raw actualOutput from file: '${actualOutput}'`);
                console.log(`DEBUG: Test Case ${i + 1} - Raw stderrOutput from file: '${stderrOutput}'`);
                // --- END DEBUG LOGS ---

                if (stderrOutput !== '') {
                    testVerdict = 'Runtime Error';
                    message = 'Program terminated with runtime errors.';
                    if (overallVerdict === 'Accepted') overallVerdict = testVerdict;
                } else if (actualOutput.trim().replace(/\r\n/g, '\n') !== expectedOutput.trim().replace(/\r\n/g, '\n')) {
                    testVerdict = 'Wrong Answer';
                    message = 'Output does not match expected output.';
                    if (overallVerdict === 'Accepted' || overallVerdict === 'Runtime Error') overallVerdict = testVerdict;
                } else {
                    testVerdict = 'Accepted'; // This test case passed
                    passedThisTestCase = true; // Mark as passed
                    testCasesPassedCount++; // Increment overall count
                }

            } 
            finally {
                detailedResults.push({
                    testCase: i + 1,
                    status: testVerdict,
                    passed: passedThisTestCase,
                    message: message,
                    executionTime: executionTime,
                    memoryUsed: memoryUsed,
                    input: input,
                    expectedOutput: expectedOutput.trim(),
                    actualOutput: actualOutput,
                    isSample: isSample
                });
                totalExecutionTime += executionTime;
            }
        }


        // Final response
        console.log('Judge Server: Final overallVerdict:', overallVerdict);
        console.log('Judge Server: Final detailedResults:', detailedResults);
        console.log('Judge Server: Final testCasesPassedCount:', testCasesPassedCount);

        res.json({
            submissionId: submissionIdToUse,
            status: 'completed',
            verdict: overallVerdict,
            compilerOutput: compilerOutput, // Already trimmed by helper
            executionTime: totalExecutionTime,
            memoryUsed: maxMemoryUsed,
            testCasesPassed: testCasesPassedCount,
            totalTestCases: testCases.length,
            detailedResults: detailedResults,
            detail: overallVerdict === 'Accepted' ? 'Solution accepted!' : `Solution failed: ${overallVerdict}`
        });

    } catch (error) {
        console.error('Judge Server Internal Error:', error);
        res.status(500).json({
            submissionId: submissionIdToUse,
            status: 'failed',
            verdict: 'Internal Error',
            error: 'An unexpected error occurred during judging.',
            details: error.message,
            cmd: error.command || ''
        });
    } finally {
        if (submissionTempDir && submissionTempDir.startsWith(TEMP_CODE_DIR)) {
             fs.rmSync(submissionTempDir, { recursive: true, force: true });
        }
    }
});




const JUDGE_PORT = process.env.JUDGE_PORT || 3001;
app.listen(JUDGE_PORT, () => {
    console.log(`Judge Server listening on port ${JUDGE_PORT}!`);
});

