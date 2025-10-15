const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');


const app = express();
const PORT = process.env.PORT || 3000;
// Azure-specific configuration
const isAzure = process.env.WEBSITE_SITE_NAME !== undefined;
const baseUrl = isAzure
    ? `https://${process.env.WEBSITE_SITE_NAME}.azurewebsites.net`
    : `http://localhost:${PORT}`;

app.use(cors({
    origin: [
        'https://au-resume-maker.netlify.app',  // Your actual frontend URL
        'https://resume-backend-07-dkawbthjh0b5hdeb.centralindia-01'    // Your actual backend URL
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
}));
// app.use(cors({
//     origin: true, // Allow all origins temporarily
//     credentials: true
// }));

// Additional CORS handling for preflight requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from parent directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.post('/generate-pdf', async (req, res) => {
    // Add CORS headers manually as backup
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');

    console.log('PDF generation request received from origin:', req.headers.origin);
    console.log('Request headers:', req.headers);

    let browser;
    try {
        const { html, username = 'Resume' } = req.body;

        if (!html) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        // Launch Puppeteer with high DPI settings
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--font-render-hinting=none',
                '--disable-font-subpixel-positioning'
            ]
        });

        const page = await browser.newPage();

        // Set viewport for exact A4 dimensions - no gaps
        await page.setViewport({
            width: 794, // A4 width in pixels at 96 DPI (210mm)
            height: 1123, // A4 height in pixels at 96 DPI (297mm)
            deviceScaleFactor: 1, // Use 1x to match exact A4 size
            isMobile: false,
            hasTouch: false
        });

        // Read the template and inject the HTML content
        const templatePath = path.join(__dirname, 'templates', 'resume.html');
        let templateHtml = fs.readFileSync(templatePath, 'utf8');

        // Read the CSS file and inject it directly
        const cssPath = path.join(__dirname, '..', 'frontend', 'index.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');

        // Inject CSS content before the existing style tag
        templateHtml = templateHtml.replace('<!-- CSS will be injected by server -->', `<style>${cssContent}</style>`);

        // Fix image paths to use absolute URLs for proper loading
        let processedHtml = html;
        // Current: 
        // processedHtml = processedHtml.replace(/src="\.\/images\//g, 'src="http://localhost:3000/images/');
        // Change to your production domain:
        processedHtml = processedHtml.replace(/src="\.\/images\//g, 'src="https://resume-backend-07-dkawbthjh0b5hdeb.centralindia-01.azurewebsites.net/images/');

        // Replace the placeholder with actual resume content
        templateHtml = templateHtml.replace('<!-- Resume content will be injected here -->', processedHtml);

        // Debug: Log the HTML length to ensure content is being injected
        console.log('HTML content length:', html.length);
        console.log('Processed HTML length:', processedHtml.length);
        console.log('Template HTML length:', templateHtml.length);

        // Set content with network idle wait for images
        await page.setContent(templateHtml, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for all images to load
        await page.evaluate(() => {
            return Promise.all(
                Array.from(document.images).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                    });
                })
            );
        });

        // Wait for fonts to load
        await page.evaluateHandle('document.fonts.ready');

        // Generate PDF with exact A4 dimensions - no gaps
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm'
            },
            preferCSSPageSize: true,
            displayHeaderFooter: false,
            scale: 1,
            width: '210mm',
            height: '297mm'
        });

        // Set response headers
        const filename = `resume_${username.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            error: 'Failed to generate PDF',
            details: error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});


// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main landing page at /landing
app.get('/landing-page', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});


// Resume form endpoint
app.get('/resume-form', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'resume-form.html'));
});

// Resume preview endpoint
app.get('/preview', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'preview.html'));
});

app.get('/api/test', (req, res) => {
    res.json({ status: "Backend is live!" });
});


app.listen(PORT, () => {
    console.log(`PDF generation server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Root (redirects to login): http://localhost:${PORT}/`);
    // console.log(`Student login: http://localhost:${PORT}/login`);
    console.log(`Landing page: http://localhost:${PORT}/landing`);
    console.log(`Resume form: http://localhost:${PORT}/resume-form`);
    console.log(`Resume preview: http://localhost:${PORT}/preview`);
});

