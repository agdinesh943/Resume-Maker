Frontend Production Changes:
1. API Endpoints (frontend/preview.html and other JS files)
Find all hardcoded localhost:3000 references
Replace with your production backend URL
  // Change from:
  const response = await fetch('http://localhost:3000/generate-pdf', {
  // To:
  const response = await fetch('https://your-backend-domain.com/generate-pdf', {