FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for OpenCV and dlib
RUN apt-get update -y && apt-get install -y \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# THE MAGIC FIX FOR THE OOM ERROR:
# Limit the C++ compiler to 2 threads. Hugging Face provides 16 cores, and dlib tries to use all of them by default, which spikes memory over 16GB and crashes. 
# By limiting to 2 threads, memory stays well under 2GB, allowing a safe compile!
ENV MAKEFLAGS="-j2"

# Install dlib first so it compiles safely
RUN pip install --no-cache-dir dlib

# Now copy requirements and install everything purely through standard pip!
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Expose the port for Hugging Face Spaces
ENV PORT=7860
EXPOSE 7860

# Run the app
CMD ["gunicorn", "-b", "0.0.0.0:7860", "app:app"]
