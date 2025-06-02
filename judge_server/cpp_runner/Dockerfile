# ONLINE_JUDGE/judge_server/cpp_runner/Dockerfile

# Use a minimal base image with GCC installed
FROM gcc:latest

# Set a working directory inside the container
WORKDIR /usr/src/app

# We no longer copy main.cpp or compile here.
# These will be mounted/executed by the judge_coordinator.js at runtime.

# Just define a general entry point, which will be overridden or appended to
# by the judge_coordinator.js using the 'docker run' command.
# For example, we could set a default shell.
CMD ["/bin/bash"]