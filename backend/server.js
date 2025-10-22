const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');


const app = express();
const PORT = process.env.PORT || 3000;




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
app.use(cors({
    origin: true, // Allow all origins temporarily
    credentials: true
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

// Serve static files from parent directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.post('/generate-pdf', async (req, res) => {
    // Add CORS headers manually as backup
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');

    console.log('PDF generation request received from origin:', req.headers.origin);
    console.log('Request headers:', req.headers);
    console.log('Current working directory:', process.cwd());
    console.log('__dirname:', __dirname);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    let browser;
    try {
        const { html, username = 'Resume' } = req.body;

        if (!html) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        // Launch Puppeteer with high DPI settings
        const isProduction = process.env.NODE_ENV === 'production' || process.env.PORT;
        const puppeteerArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--font-render-hinting=none',
            '--disable-font-subpixel-positioning'
        ];

        // Add production-specific args
        if (isProduction) {
            puppeteerArgs.push('--disable-web-security');
            puppeteerArgs.push('--disable-features=VizDisplayCompositor');
        }

        browser = await puppeteer.launch({
            headless: 'new',
            args: puppeteerArgs
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

        // Check if template file exists
        if (!fs.existsSync(templatePath)) {
            console.error('Template file not found:', templatePath);
            return res.status(500).json({ error: 'Template file not found' });
        }

        let templateHtml = fs.readFileSync(templatePath, 'utf8');

        // Read the CSS file and inject it directly
        const cssPath = path.join(__dirname, '..', 'frontend', 'index.css');

        // Check if CSS file exists
        if (!fs.existsSync(cssPath)) {
            console.error('CSS file not found:', cssPath);
            return res.status(500).json({ error: 'CSS file not found' });
        }

        const cssContent = fs.readFileSync(cssPath, 'utf8');

        // Inject CSS content before the existing style tag
        templateHtml = templateHtml.replace('<!-- CSS will be injected by server -->', `<style>${cssContent}</style>`);

        // Fix image paths to use absolute URLs for proper loading
        let processedHtml = html;

        // Use production URL if not on localhost, otherwise use localhost
        const baseUrl = isProduction
            ? 'https://resume-maker-3-fdbj.onrender.com'
            : 'http://localhost:3000';

        processedHtml = processedHtml.replace(/src="\.\/images\//g, `src="${baseUrl}/images/`);

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
                        img.onerror = (error) => {
                            console.error('Image failed to load:', img.src, error);
                            resolve(); // Continue even if some images fail
                        };
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
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to generate PDF',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
    res.sendFile(path.resolve(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'frontend', 'index.html'));
});


// Resume form endpoint
app.get('/resume-form', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'frontend', 'resume-form.html'));
});

// Resume preview endpoint
app.get('/preview', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'frontend', 'preview.html'));
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
                path: path.join(__dirname, '..', 'frontend', 'index.css'),
                exists: fs.existsSync(path.join(__dirname, '..', 'frontend', 'index.css'))
            },
            frontendDir: {
                path: path.join(__dirname, '..', 'frontend'),
                exists: fs.existsSync(path.join(__dirname, '..', 'frontend'))
            }
        }
    };

    // Try to list directory contents
    try {
        debugInfo.frontendContents = fs.readdirSync(path.join(__dirname, '..', 'frontend'));
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


app.listen(PORT, () => {
    console.log(`PDF generation server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Root (redirects to login): http://localhost:${PORT}/`);
    // console.log(`Student login: http://localhost:${PORT}/login`);
    console.log(`Landing page: http://localhost:${PORT}/landing`);
    console.log(`Resume form: http://localhost:${PORT}/resume-form`);
    console.log(`Resume preview: http://localhost:${PORT}/preview`);
});
