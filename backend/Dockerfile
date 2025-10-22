# ✅ Use official Playwright image (already has Chromium + deps)
FROM mcr.microsoft.com/playwright:v1.50.0-noble

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# ✅ Add missing Linux dependencies for Chromium (for safety)
RUN npx playwright install-deps

# Optional: ensure Chromium is ready
RUN npx playwright install chromium

# Switch to a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Environment
ENV PORT=5000
EXPOSE 5000

# Start app
CMD ["npm", "start"]
