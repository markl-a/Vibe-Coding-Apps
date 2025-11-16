FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Initialize database
RUN node src/database/init.js

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
