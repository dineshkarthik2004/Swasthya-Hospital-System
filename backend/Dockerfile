# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Install OpenSSL (required for Prisma)
RUN apk add --no-cache openssl

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy the prisma directory (contains schema.prisma)
COPY prisma ./prisma/

# Install app dependencies
# This will trigger the postinstall script: npx prisma generate
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD [ "npm", "start" ]
