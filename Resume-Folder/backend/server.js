const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');


const app = express();
const PORT = process.env.PORT || 3001;




// Email configuration (you'll need to set up your SMTP credentials)
// For testing purposes, we'll use a mock transporter


// const isTestingMode = process.env.NODE_ENV === 'development' || process.env.TESTING === 'true';

// let transporter;
// if (isTestingMode) {
//     // Mock transporter for testing
//     transporter = {
//         sendMail: async (mailOptions) => {
//             console.log('TESTING MODE: Email would be sent to:', mailOptions.to);
//             console.log('TESTING MODE: Subject:', mailOptions.subject);
//             console.log('TESTING MODE: Magic link:', mailOptions.html.match(/href="([^"]+)"/)?.[1] || 'No link found');
//             return { messageId: 'test-message-id' };
//         }
//     };
// } else {
//     transporter = nodemailer.createTransport({
//         service: 'gmail', // or your preferred email service
//         auth: {
//             user: process.env.EMAIL_USER || 'your-email@gmail.com',
//             pass: process.env.EMAIL_PASS || 'your-app-password'
//         }
//     });
// }

// Email validation function
// function validateEmail(email) {
//     const emailRegex = /^[^\s@]+@ced\.alliance\.edu\.in$/;
//     return emailRegex.test(email);
// }

// Generate magic link token
// function generateMagicLinkToken() {
//     return crypto.randomBytes(32).toString('hex');
// }

// Send magic link email
// async function sendMagicLinkEmail(email, token) {
//     const magicLink = `http://localhost:${PORT}/login?token=${token}&email=${encodeURIComponent(email)}`;

//     const mailOptions = {
//         from: process.env.EMAIL_USER || 'your-email@gmail.com',
//         to: email,
//         subject: 'Access Your Resume Maker - Magic Link',
//         html: `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//                 <h2 style="color: #008cff;">Alliance University Resume Maker</h2>
//                 <p>Hello!</p>
//                 <p>You requested access to the Alliance University Resume Maker. Click the button below to access the platform:</p>
//                 <div style="text-align: center; margin: 30px 0;">
//                     <a href="${magicLink}" style="background-color: #008cff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Access Resume Maker</a>
//                 </div>
//                 <p>Or copy and paste this link into your browser:</p>
//                 <p style="word-break: break-all; color: #666;">${magicLink}</p>
//                 <p><strong>Note:</strong> This link will expire in 15 minutes for security reasons.</p>
//                 <p>If you didn't request this access, please ignore this email.</p>
//                 <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
//                 <p style="color: #666; font-size: 12px;">This is an automated message from Alliance University Resume Maker.</p>
//             </div>
//         `
//     };

//     try {
//         await transporter.sendMail(mailOptions);
//         return true;
//     } catch (error) {
//         console.error('Error sending email:', error);
//         return false;
//     }
// }

// Middleware
// app.use(cors({
//     origin: [
//         'https://au-resume-maker.netlify.app',
//         'http://localhost:3000',
//         'http://localhost:5500',
//         'http://127.0.0.1:5500'
//     ],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
//     optionsSuccessStatus: 200
// }));
// app.use(cors({
//     origin: true, // Allow all origins temporarily
//     credentials: true
// }));
app.use(cors({
    origin: [
        'https://au-resume-maker.netlify.app',
        'https://au-resume-maker.netlify.app/',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));


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

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

app.post('/generate-pdf', async (req, res) => {
    const puppeteer = require('puppeteer');
    const path = require('path');
    const fs = require('fs');

    let browser;

    try {
        const { html, username = 'Resume' } = req.body;

        if (!html) return res.status(400).json({ error: 'HTML content is required' });

        // Launch Puppeteer
        const isProduction = process.env.NODE_ENV === 'production';
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Inject template
        const templatePath = path.join(__dirname, 'templates', 'resume.html');
        if (!fs.existsSync(templatePath)) {
            return res.status(500).json({ error: 'Template file not found' });
        }
        let templateHtml = fs.readFileSync(templatePath, 'utf8');

        // Inject CSS inline
        const cssPath = path.join(__dirname, 'frontend', 'index.css');
        if (!fs.existsSync(cssPath)) {
            return res.status(500).json({ error: 'CSS file not found' });
        }
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        templateHtml = templateHtml.replace('<!-- CSS will be injected by server -->', `<style>${cssContent}</style>`);

        // Replace relative image paths with absolute URLs
        const baseUrl = isProduction
            ? 'https://resume-maker-3-4n85.onrender.com'
            : 'http://localhost:3001';
        let processedHtml = html.replace(/src="\.\/images\//g, `src="${baseUrl}/images/`);

        // Inject resume content into template
        templateHtml = templateHtml.replace('<!-- Resume content will be injected here -->', processedHtml);

        // Set page content and wait until all resources load
        await page.setContent(templateHtml, { waitUntil: 'networkidle0', timeout: 30000 });

        // Wait for fonts/images (optional safety)
        try {
            await page.evaluate(() =>
                Promise.all(
                    Array.from(document.images).map(img => {
                        if (img.complete) return Promise.resolve();
                        return new Promise(resolve => {
                            img.onload = resolve;
                            img.onerror = resolve;
                            setTimeout(resolve, 3000);
                        });
                    })
                )
            );
        } catch (err) {
            console.warn('Image load warning:', err.message);
        }

        // Generate PDF (use either format or width/height, not both)
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
        });

        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Generated PDF buffer is empty or invalid');
        }

        // Send PDF response
        const filename = `resume_${username.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer); // ✅ Use end instead of send

        console.log('PDF generated and sent successfully');

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            error: 'Failed to generate PDF',
            details: error.message
        });
    } finally {
        if (browser) await browser.close();
    }
});


// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main landing page at /landing
app.get('/landing-page', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'index.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'index.html'));
});


// Resume form endpoint
app.get('/resume-form', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'resume-form.html'));
});

// Resume preview endpoint
app.get('/preview', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'preview.html'));
});

app.get('/api/test', (req, res) => {
    res.json({ status: "Backend is live!" });
});

// Debug endpoint to check file structure
app.get('/api/debug', (req, res) => {
    const fs = require('fs');
    const path = require('path');

    const debugInfo = {
        cwd: process.cwd(),
        __dirname: __dirname,
        nodeEnv: process.env.NODE_ENV,
        files: {
            template: {
                path: path.join(__dirname, 'templates', 'resume.html'),
                exists: fs.existsSync(path.join(__dirname, 'templates', 'resume.html'))
            },
            css: {
                path: path.join(__dirname, 'frontend', 'index.css'),
                exists: fs.existsSync(path.join(__dirname, 'frontend', 'index.css'))
            },
            frontendDir: {
                path: path.join(__dirname, 'frontend'),
                exists: fs.existsSync(path.join(__dirname, 'frontend'))
            }
        }
    };

    // Try to list directory contents
    try {
        debugInfo.frontendContents = fs.readdirSync(path.join(__dirname, 'frontend'));
    } catch (e) {
        debugInfo.frontendContents = `Error: ${e.message}`;
    }

    try {
        debugInfo.templatesContents = fs.readdirSync(path.join(__dirname, 'templates'));
    } catch (e) {
        debugInfo.templatesContents = `Error: ${e.message}`;
    }

    res.json(debugInfo);
});

// Catch-all handler: send back index.html for any non-API routes (SPA behavior)
app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/generate-pdf')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }

    // Serve index.html for all other routes
    res.sendFile(path.resolve(__dirname, 'frontend', 'index.html'));
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
