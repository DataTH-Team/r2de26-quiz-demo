# Use official Node.js alpine image for a lightweight footprint
FROM node:22-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the application files (except those in .dockerignore)
COPY . .

# Expose port 8080 (Google Cloud Run default port)
EXPOSE 8080

# Environment defaults
ENV PORT=8080
ENV GCP_PROJECT_ID=workshop5-demo
ENV PUBSUB_TOPIC=quiz-events
ENV NODE_ENV=production

# Start the Express server
CMD [ "node", "server.js" ]
