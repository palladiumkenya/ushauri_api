FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

# Install Python and pip, install Python dependencies using pip, and clean up
RUN apt-get update && apt-get install -y  python3-pip && \
    pip3 install gradio_client python-shell --break-system-packages && \
    apt-get clean

# Copy your Node.js application code to the working directory
COPY . .

# Expose any necessary ports
EXPOSE 3000

# Command to run your Node.js application
CMD ["npm", "start"]
