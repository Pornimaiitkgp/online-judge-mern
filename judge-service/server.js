
require('dotenv').config();
const express = require('express');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json()); // For parsing JSON body

// Connect to Docker daemon
const docker = new Docker(); // Connects to /var/run/docker.sock by default on Linux/macOS
                              // On Windows, you might need: new Docker({ host: 'http://localhost', port: 2375 });
                              // Or use the DOCKER_HOST environment variable.

app.get('/', (req, res) => {
    res.send('Judge Service is running!');
});

// This endpoint will be called by your MERN backend (server/controllers/submissionController.js)
// In a real system, this would receive submission details (code, problemId, test cases).
app.post('/execute', async (req, res) => {
    const { code, language, problemId } = req.body; // Later: pass problemId to get test cases

    if (!code || !language) {
        return res.status(400).json({ success: false, message: 'Code and language are required.' });
    }

    // For now, let's just simulate running a fixed 'hello world' in a container
    // We'll make this dynamic to run user code later in 4.2
    let imageName;
    let command;
    let fileName; // Name of the file to save user's code

    if (language === 'cpp') {
        imageName = 'gcc:latest'; // A Docker image with GCC compiler
        fileName = 'main.cpp';
        // Command to compile and run C++ code
        command = ['/bin/sh', '-c', `g++ /tmp/${fileName} -o /tmp/a.out && /tmp/a.out`];
    } else if (language === 'python') {
        imageName = 'python:3.9-slim-buster'; // A Docker image with Python interpreter
        fileName = 'main.py';
        command = ['python', `/tmp/${fileName}`];
    } else {
        return res.status(400).json({ success: false, message: 'Unsupported language.' });
    }

    const containerName = `judge-${Date.now()}`;
    const codeFilePath = path.join('/tmp', fileName); // Path inside the container

    try {
        console.log(`Pulling image: ${imageName}`);
        await docker.pull(imageName); // Ensure the image is available

        console.log(`Creating container: ${containerName}`);
        const container = await docker.createContainer({
            Image: imageName,
            name: containerName,
            Tty: false, // Don't allocate a pseudo-TTY
            OpenStdin: false, // Don't keep stdin open
            AttachStdout: true,
            AttachStderr: true,
            // Mount a volume or use bind mount to pass code into container
            // For now, we'll write content directly, or you can use bind mounts.
            // Using `cp` to copy file into container is also an option for simplicity
            // or dynamically creating containers with a command that includes the code.
            // But a temp file/mount is cleaner. Let's simplify by creating the file inside.
            Cmd: command,
            HostConfig: {
                AutoRemove: true, // Automatically remove container after it exits
                Memory: 128 * 1024 * 1024, // 128 MB memory limit (example)
                CpuPeriod: 100000,
                CpuQuota: 50000 // 0.5 CPU share (example)
            }
        });

        console.log(`Starting container: ${containerName}`);
        await container.start();

        // **IMPORTANT**: For Part 4.1, we are NOT passing user code directly to the container yet.
        // We'll simulate execution with a simple 'hello world'
        // In 4.2, we'll modify this to pass user's `code` dynamically.

        // For now, let's just assume a successful run if the container starts.
        // We'll read logs and check exit code in 4.2.

        // Get logs (stdout + stderr)
        const stream = await container.logs({
            follow: true,
            stdout: true,
            stderr: true
        });

        let output = '';
        stream.on('data', (chunk) => {
            output += chunk.toString('utf8');
        });

        await new Promise((resolve, reject) => {
            stream.on('end', async () => {
                const data = await container.wait(); // Wait for container to exit
                console.log(`Container ${containerName} exited with status:`, data.StatusCode);
                resolve();
            });
            stream.on('error', (err) => {
                console.error(`Error streaming logs for ${containerName}:`, err);
                reject(err);
            });
        });

        // Placeholder for actual judging logic
        res.json({
            success: true,
            message: `Code executed successfully in container ${containerName}.`,
            rawOutput: output,
            status: 'Pending (Judge Service)', // Still Pending from main server perspective
            // Later: actual judge result, time, memory
        });

    } catch (err) {
        console.error('Docker execution error:', err);
        let errorMessage = 'Failed to execute code.';
        if (err.statusCode === 404 && err.json && err.json.message.includes('No such image')) {
            errorMessage = `Docker image '${imageName}' not found or could not be pulled. Ensure Docker is running and image exists.`;
        } else if (err.message.includes('connect ECONNREFUSED')) {
            errorMessage = 'Could not connect to Docker daemon. Is Docker running?';
        }
        res.status(500).json({ success: false, message: errorMessage, error: err.message });
    }
});

const PORT = process.env.JUDGE_PORT || 5001; // Use a different port than MERN backend
app.listen(PORT, () => console.log(`Judge Service running on port ${PORT}`));