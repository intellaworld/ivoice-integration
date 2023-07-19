# Use the Node.js Alpine image as the base image
FROM alpine:3.17

ENV NODE_VERSION 18.12.1

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build TypeScript files
RUN npm run build

# Expose the port that the application listens on
# EXPOSE 3000

# Start the application
CMD ["npm","run", "start"]