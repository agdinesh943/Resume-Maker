# Use Node.js 20 base image
FROM node:20-bookworm

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install Playwright and browsers
RUN npx playwright install chromium

# Copy backend application code
COPY backend/ ./

# Copy frontend files
COPY frontend/ ./frontend

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
