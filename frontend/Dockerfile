# Stage 1: Build the Vite application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Accept VITE_API_URL as a build argument
ARG VITE_API_URL
# Set as environment variable for the build process
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Stage 2: Serve the application
FROM node:20-alpine

WORKDIR /app

# Install 'serve', a static file server
RUN npm install -g serve

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /app/dist

# Expose the default port for serve (3000)
EXPOSE 3000

# Serve the 'dist' directory as a Single Page Application (-s) on all network interfaces
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3000"]
