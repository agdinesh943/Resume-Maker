// Global variables for storing uploaded images
let uploadedImages = {
    profilePhoto: null,
    portfolioImage1: null,
    portfolioImage2: null
};

// Global variable for storing selected logos
let selectedLogos = [];

// Persist plain text form fields in localStorage
const FORM_STORAGE_KEY = 'resumeMaker.formData.v1';


function debounce(fn, delay) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), delay);
    };
}

// File upload handlers
document.getElementById('profilePhoto').addEventListener('change', function (e) {
    handleFileUpload(e, 'profilePhoto');
});

document.getElementById('portfolioImage1').addEventListener('change', function (e) {
    handleFileUpload(e, 'portfolioImage1');
});

document.getElementById('portfolioImage2').addEventListener('change', function (e) {
    handleFileUpload(e, 'portfolioImage2');
});

// Logo selection handlers will be attached in the main DOMContentLoaded event

function handleFileUpload(event, imageType) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            uploadedImages[imageType] = e.target.result;
            // Images are not persisted - they will be lost on page refresh
        };
        reader.readAsDataURL(file);
    }
}

function handleLogoSelection(event) {
    const checkbox = event.target;
    const logoValue = checkbox.value;

    if (checkbox.checked) {
        // Add logo to selection if not already present and limit to 4
        if (selectedLogos.length < 4 && !selectedLogos.includes(logoValue)) {
            selectedLogos.push(logoValue);
        } else if (selectedLogos.length >= 4) {
            // Uncheck the checkbox if we already have 4 logos
            checkbox.checked = false;
            alert('You can select a maximum of 4 logos.');
        }
    } else {
        // Remove logo from selection
        const index = selectedLogos.indexOf(logoValue);
        if (index > -1) {
            selectedLogos.splice(index, 1);
        }
    }

    // Update visual feedback
    updateLogoSelectionUI();
}

function updateLogoSelectionUI() {
    const logoCheckboxes = document.querySelectorAll('input[name="selectedLogos"]');
    logoCheckboxes.forEach(checkbox => {
        const logoValue = checkbox.value;
        const isSelected = selectedLogos.includes(logoValue);

        if (isSelected && !checkbox.checked) {
            checkbox.checked = true;
        } else if (!isSelected && checkbox.checked) {
            checkbox.checked = false;
        }
    });
}

// Handle achievement/certification link checkbox toggle
function handleAchievementLinkToggle(event) {
    const checkbox = event.target;
    const isAchievement = checkbox.id.includes('achievementLinkCheck');
    const number = checkbox.id.replace(/.*?(achievementLinkCheck|certLinkCheck)(\d+).*/, '$2');
    const linkGroupId = isAchievement ? `achievementLinkGroup${number}` : `certLinkGroup${number}`;
    const linkInputId = isAchievement ? `achievementLink${number}` : `certLink${number}`;
    const linkGroup = document.getElementById(linkGroupId);
    const linkInput = document.getElementById(linkInputId);

    if (checkbox.checked) {
        linkGroup.style.display = 'block';
        linkInput.required = false; // Make it optional
    } else {
        linkGroup.style.display = 'none';
        linkInput.value = ''; // Clear the input when unchecked
        linkInput.required = false;
    }
}

// Handle link checkbox state changes to restore/clear link fields from localStorage
function handleLinkCheckboxChange(event) {
    const checkbox = event.target;
    const isAchievement = checkbox.id.includes('achievementLinkCheck');
    const number = checkbox.id.replace(/.*?(achievementLinkCheck|certLinkCheck)(\d+).*/, '$2');
    const linkFieldId = isAchievement ? `achievementLink${number}` : `certLink${number}`;
    const linkInput = document.getElementById(linkFieldId);

    if (checkbox.checked) {
        // Restore link field value from localStorage if available
        try {
            const raw = localStorage.getItem(FORM_STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (data[linkFieldId]) {
                    linkInput.value = data[linkFieldId];
                }
            }
        } catch (_) { }
    } else {
        // Clear link field when unchecked
        linkInput.value = '';
    }
}

// Save text inputs to localStorage
const saveFormToStorage = debounce(function () {
    try {
        const form = document.getElementById('resumeForm');
        const fields = Array.from(form.querySelectorAll('input[type="text"], input[type="email"], input[type="url"], input[type="tel"], textarea, select'));
        const data = {};
        fields.forEach(el => { data[el.id] = el.value; });
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
    } catch (_) { }
}, 200);

function restoreFormFromStorage() {
    try {
        const raw = localStorage.getItem(FORM_STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        Object.keys(data).forEach(id => {
            const el = document.getElementById(id);
            if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
                // Check if this is a link field that should only be filled if checkbox is checked
                if (id.includes('achievementLink') || id.includes('certLink')) {
                    const linkNumber = id.replace(/.*?(achievementLink|certLink)(\d+).*/, '$2');
                    const checkboxId = id.includes('achievementLink') ?
                        `achievementLinkCheck${linkNumber}` :
                        `certLinkCheck${linkNumber}`;
                    const checkbox = document.getElementById(checkboxId);

                    // Only fill link field if checkbox exists and is checked
                    if (checkbox && checkbox.checked) {
                        el.value = data[id];
                    }
                } else {
                    el.value = data[id];
                }
            }
        });
    } catch (_) { }
}

// Image restoration function removed - images are no longer persisted

function attachPersistenceHandlers() {
    const form = document.getElementById('resumeForm');
    const fields = Array.from(form.querySelectorAll('input[type="text"], input[type="email"], input[type="url"], input[type="tel"], textarea, select'));
    fields.forEach(el => {
        el.addEventListener('input', saveFormToStorage);
        el.addEventListener('change', saveFormToStorage);
    });
}

// Initialize persistence on load
window.addEventListener('DOMContentLoaded', function () {
    restoreFormFromStorage();
    attachPersistenceHandlers();
    initProjectDescriptionCounters();

    // Attach logo selection handlers
    const logoCheckboxes = document.querySelectorAll('input[name="selectedLogos"]');
    logoCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleLogoSelection);
    });

    // Add event listeners for achievement link checkboxes
    document.querySelectorAll('.link-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleAchievementLinkToggle);
    });

    // Add event listeners for checkbox state changes to restore/clear link fields
    document.querySelectorAll('.link-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleLinkCheckboxChange);
    });
    // Add dynamic project add button
    const addBtn = document.getElementById('addProjectBtn');
    const extraContainer = document.getElementById('extraProjectsContainer');
    let extraProjectCount = 0; // allows up to 2 extras (Projects 4 and 5) - total 5 projects (3 required + 2 optional)
    function createProjectGroup(index) {
        const group = document.createElement('div');
        group.className = 'project-group';
        group.dataset.index = String(index);
        group.innerHTML = `
            <h3>Project ${index}</h3>
            <div class="form-row">
                <div class="form-group">
                    <label for="projectTitle${index}">Project Title</label>
                    <input type="text" id="projectTitle${index}" name="projectTitle${index}">
                </div>
                <div class="form-group">
                    <label for="projectTech${index}">Technologies Used</label>
                    <input type="text" id="projectTech${index}" name="projectTech${index}" placeholder="e.g., Python, OpenCV, Flask">
                </div>
            </div>
            <div class="form-group">
                <label for="projectDescription${index}">Project Description</label>
                <textarea id="projectDescription${index}" name="projectDescription${index}" rows="3"></textarea>
                <div class="char-counter" id="pd${index}Counter">0/45 words</div>
            </div>
            <div class="form-actions" style="justify-content:flex-start; margin-top: 6px; border-top:none; padding-top:0;">
                <button type="button" class="btn-remove-project preview-btn" data-remove-index="${index}" style="min-width:auto;background:linear-gradient(135deg,#ef4444 0%,#b91c1c 100%);"><ion-icon name="trash"></ion-icon> Remove project</button>
            </div>
        `;
        return group;
    }
    function updateAddButtonState() {
        if (!addBtn) return;
        const remaining = 2 - extraProjectCount; // 2 slots: 4 and 5
        if (remaining <= 0) {
            addBtn.disabled = true;
            addBtn.textContent = 'Max 5 projects reached';
        } else {
            addBtn.disabled = false;
            addBtn.textContent = `+ Add another project (${remaining} left)`;
        }
    }

    if (addBtn && extraContainer) {
        updateAddButtonState();
        addBtn.addEventListener('click', function () {
            if (extraProjectCount >= 2) return; // cap at 5 total
            extraProjectCount += 1;
            const index = 2 + extraProjectCount + 1; // start from 4 if only 2 mandatory
            const group = createProjectGroup(index);
            extraContainer.appendChild(group);
            // attach counter for new textarea
            const el = group.querySelector(`#projectDescription${index}`);
            const c = group.querySelector(`#pd${index}Counter`);
            if (el && c) {
                const max = 45;
                const update = () => {
                    const val = el.value || '';
                    const words = val.trim().split(/\s+/).filter(word => word.length > 0);
                    const wordCount = words.length;

                    // If word count exceeds limit, truncate to the last valid word
                    if (wordCount > max) {
                        const truncatedWords = words.slice(0, max);
                        el.value = truncatedWords.join(' ');
                    }

                    c.textContent = `${wordCount}/${max} words`;
                };
                el.addEventListener('input', update);
                el.addEventListener('change', update);
                update();
            }
            // wire remove button
            const removeBtn = group.querySelector('.btn-remove-project');
            if (removeBtn) {
                removeBtn.addEventListener('click', function () {
                    group.remove();
                    extraProjectCount = Math.max(0, extraProjectCount - 1);
                    updateAddButtonState();
                });
            }
            updateAddButtonState();
        });
    }

    // Add dynamic certification add button
    const addCertBtn = document.getElementById('addCertificationBtn');
    const extraCertContainer = document.getElementById('extraCertificationsContainer');
    let extraCertCount = 0; // allows up to 2 extras (Certifications 4 and 5)

    function createCertificationGroup(index) {
        const group = document.createElement('div');
        group.className = 'cert-group';
        group.dataset.index = String(index);
        group.innerHTML = `
            <h3>Certification ${index}</h3>
            <div class="form-row">
                <div class="form-group">
                    <label for="certName${index}">Certification Name *</label>
                    <input type="text" id="certName${index}" name="certName${index}" required>
                </div>
                <div class="form-group">
                    <label for="certPlatform${index}">Platform/Issuer *</label>
                    <input type="text" id="certPlatform${index}" name="certPlatform${index}" placeholder="e.g., Platform Name - Year" required>
                </div>
            </div>
            <div class="checkbox-container">
                <input type="checkbox" id="certLinkCheck${index}" class="link-checkbox">
                <label for="certLinkCheck${index}" class="checkbox-label">Add Link</label>
            </div>
            <div class="form-group link-input" id="certLinkGroup${index}" style="display: none;">
                <label for="certLink${index}">Certification Link</label>
                <input type="url" id="certLink${index}" name="certLink${index}" placeholder="https://example.com/certificate">
            </div>
            <div class="form-actions" style="justify-content:flex-start; margin-top: 6px; border-top:none; padding-top:0;">
                <button type="button" class="btn-remove-cert preview-btn" data-remove-index="${index}" style="min-width:auto;background:linear-gradient(135deg,#ef4444 0%,#b91c1c 100%);">
                    <ion-icon name="trash"></ion-icon> Remove Certification
                </button>
            </div>
        `;
        return group;
    }

    function updateCertAddButtonState() {
        if (addCertBtn) {
            addCertBtn.disabled = extraCertCount >= 2;
            if (extraCertCount >= 2) {
                addCertBtn.innerHTML = '<ion-icon name="checkmark-circle"></ion-icon> Maximum Reached (5 Total)';
            } else {
                addCertBtn.innerHTML = '<ion-icon name="add-circle"></ion-icon> Add another certification';
            }
        }
    }

    if (addCertBtn && extraCertContainer) {
        updateCertAddButtonState();
        addCertBtn.addEventListener('click', function () {
            if (extraCertCount >= 2) return; // cap at 5 total
            extraCertCount += 1;
            const index = 3 + extraCertCount; // start from 4
            const group = createCertificationGroup(index);
            extraCertContainer.appendChild(group);

            // wire remove button
            const removeBtn = group.querySelector('.btn-remove-cert');
            if (removeBtn) {
                removeBtn.addEventListener('click', function () {
                    group.remove();
                    extraCertCount = Math.max(0, extraCertCount - 1);
                    updateCertAddButtonState();
                });
            }

            // wire checkbox for link toggle
            const checkbox = group.querySelector('.link-checkbox');
            if (checkbox) {
                checkbox.addEventListener('change', handleAchievementLinkToggle);
                checkbox.addEventListener('change', handleLinkCheckboxChange);
            }

            updateCertAddButtonState();
        });
    }
});

// Form submission handler
document.getElementById('resumeForm').addEventListener('submit', function (e) {
    e.preventDefault();
    // Ensure latest values are saved before generating
    saveFormToStorage();
    generateResume();
});

// Preview button handler
// document.getElementById('previewBtn').addEventListener('click', function () {
//     previewResume();
// });

// Modal close handler
document.querySelector('.close').addEventListener('click', function () {
    document.getElementById('resumeModal').style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', function (event) {
    const modal = document.getElementById('resumeModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

function previewResume() {
    const formData = getFormData();
    if (!validateForm(formData)) {
        return;
    }

    const resumeHTML = generateResumeHTML(formData, uploadedImages, selectedLogos);
    document.getElementById('resumePreview').innerHTML = resumeHTML;
    document.getElementById('resumeModal').style.display = 'block';

    // Wire preview modal export buttons
    const previewRoot = document;
    const pdfBtn = previewRoot.getElementById('previewPdfBtn');
    const docBtn = previewRoot.getElementById('previewDocBtn');
    if (pdfBtn) {
        pdfBtn.onclick = function () {
            const element = previewRoot.getElementById('resume-content');
            const dpr = Math.max(2, (window.devicePixelRatio || 1)); // Match backend deviceScaleFactor: 2
            const opt = {
                margin: [0, 0, 0, 0], // Match backend margin: 0
                filename: (document.getElementById('studentName').value || 'Resume').replace(/\s+/g, '_') + '_Resume.pdf',
                image: { type: 'jpeg', quality: 1.0 },
                html2canvas: {
                    scale: dpr, // Match backend scale
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    allowTaint: true,
                    letterRendering: true,
                    width: 794, // A4 width in pixels at 96 DPI (210mm)
                    height: 1123 // A4 height in pixels at 96 DPI (297mm)
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait',
                    compress: true
                },
                pagebreak: { mode: ['css', 'legacy'] }
            };
            html2pdf().set(opt).from(element).save();
        };
    }
    // Word download removed per latest request
}

function generateResume() {
    const formData = getFormData();
    if (!validateForm(formData)) {
        return;
    }

    // Store form data and images in sessionStorage for preview page
    const resumeData = {
        formData: formData,
        uploadedImages: uploadedImages,
        selectedLogos: selectedLogos,
        resumeHTML: generateResumeHTML(formData, uploadedImages, selectedLogos)
    };

    sessionStorage.setItem('resumeData', JSON.stringify(resumeData));

    // Open preview page in new tab
    window.open('/preview', '_blank');
}

// Live word counters for project descriptions
function initProjectDescriptionCounters() {
    console.log('Initializing project description word counters...');
    const inputs = [
        { id: 'projectDescription1', counter: 'pd1Counter', max: 45 },
        { id: 'projectDescription2', counter: 'pd2Counter', max: 45 },
        { id: 'projectDescription3', counter: 'pd3Counter', max: 45 }
    ];
    inputs.forEach(({ id, counter, max }) => {
        const el = document.getElementById(id);
        const c = document.getElementById(counter);
        console.log(`Setting up counter for ${id}:`, { element: !!el, counter: !!c });
        if (!el || !c) return;
        const update = () => {
            const val = el.value || '';
            const words = val.trim().split(/\s+/).filter(word => word.length > 0);
            const wordCount = words.length;

            // If word count exceeds limit, truncate to the last valid word
            if (wordCount > max) {
                const truncatedWords = words.slice(0, max);
                el.value = truncatedWords.join(' ');
            }

            c.textContent = `${wordCount}/${max} words`;
        };
        el.addEventListener('input', update);
        el.addEventListener('change', update);
        update();
    });
}


function getFormData() {
    const base = {
        studentName: document.getElementById('studentName').value,
        personalEmail: document.getElementById('personalEmail').value,
        officialEmail: document.getElementById('officialEmail').value,
        phone: document.getElementById('phone').value,
        linkedin: document.getElementById('linkedin').value,
        github: document.getElementById('github').value,
        leetcode: document.getElementById('leetcode').value,
        hackerrank: document.getElementById('hackerrank').value,

        // Education
        degree1: document.getElementById('degree1').value,
        specialization1: document.getElementById('specialization1') ? document.getElementById('specialization1').value : '',
        year1: document.getElementById('year1').value,
        gpa1: document.getElementById('gpa1').value,
        degree2: document.getElementById('degree2').value,
        board_of_education1: document.getElementById('university2').value,
        year2: document.getElementById('year2').value,
        gpa2: document.getElementById('gpa2').value,
        degree3: document.getElementById('degree3').value,
        coll_city2: document.getElementById('coll-city2').value,
        coll_city3: document.getElementById('coll-city3').value,
        board_of_education2: document.getElementById('university3').value,
        year3: document.getElementById('year3').value,
        gpa3: document.getElementById('gpa3').value,

        // Skills
        programmingLanguages: document.getElementById('programmingLanguages').value,
        webTechnologies: document.getElementById('webTechnologies').value,
        databaseTechnologies: document.getElementById('databaseTechnologies').value,
        toolsPlatforms: document.getElementById('toolsPlatforms').value,
        others: document.getElementById('others').value,

        // Projects
        projectTitle1: document.getElementById('projectTitle1').value,
        projectTech1: document.getElementById('projectTech1').value,
        projectDescription1: document.getElementById('projectDescription1').value,
        projectTitle2: document.getElementById('projectTitle2').value,
        projectTech2: document.getElementById('projectTech2').value,
        projectDescription2: document.getElementById('projectDescription2').value,
        projectTitle3: document.getElementById('projectTitle3').value,
        projectTech3: document.getElementById('projectTech3').value,
        projectDescription3: document.getElementById('projectDescription3').value,
        // Additional projects will be read dynamically below

        // Experience
        jobTitle: document.getElementById('jobTitle').value,
        company: document.getElementById('company').value,
        duration: document.getElementById('duration').value,
        jobDescription: document.getElementById('jobDescription').value,

        // Certifications
        certName1: document.getElementById('certName1').value,
        certPlatform1: document.getElementById('certPlatform1').value,
        certLink1: document.getElementById('certLink1').value,
        certName2: document.getElementById('certName2').value,
        certPlatform2: document.getElementById('certPlatform2').value,
        certLink2: document.getElementById('certLink2').value,
        certName3: document.getElementById('certName3').value,
        certPlatform3: document.getElementById('certPlatform3').value,
        certLink3: document.getElementById('certLink3').value,

        // Dynamic Certifications (4 and 5)
        certName4: document.getElementById('certName4')?.value || '',
        certPlatform4: document.getElementById('certPlatform4')?.value || '',
        certLink4: document.getElementById('certLink4')?.value || '',
        certName5: document.getElementById('certName5')?.value || '',
        certPlatform5: document.getElementById('certPlatform5')?.value || '',
        certLink5: document.getElementById('certLink5')?.value || '',

        // Achievements
        achievement1: document.getElementById('achievement1').value,
        achievementLink1: document.getElementById('achievementLink1').value,
        achievement2: document.getElementById('achievement2').value,
        achievementLink2: document.getElementById('achievementLink2').value,
        achievement3: document.getElementById('achievement3').value,
        achievementLink3: document.getElementById('achievementLink3').value,
        achievement4: document.getElementById('achievement4').value,
        achievementLink4: document.getElementById('achievementLink4').value,
        achievement5: document.getElementById('achievement5').value,
        achievementLink5: document.getElementById('achievementLink5').value,

        // Portfolio (durations are static in template)
    };
    // Collect dynamic extra projects (4 and 5 only)
    const extras = [];
    for (let idx = 4; idx <= 5; idx++) {
        const t = document.getElementById(`projectTitle${idx}`);
        const tech = document.getElementById(`projectTech${idx}`);
        const desc = document.getElementById(`projectDescription${idx}`);
        if (!t && !tech && !desc) continue;
        const title = t ? t.value : '';
        const techVal = tech ? tech.value : '';
        const descVal = desc ? desc.value : '';
        if (title || techVal || descVal) {
            extras.push({ title, tech: techVal, description: descVal, idx });
        }
    }
    return { ...base, extraProjects: extras };
}

function validateForm(formData) {
    const requiredFields = [
        'studentName', 'personalEmail', 'officialEmail', 'phone', 'linkedin', 'github', 'leetcode', 'hackerrank',
        'degree1', 'specialization1', 'board_of_education1', 'board_of_education2', 'year1', 'gpa1', 'year2', 'gpa2', 'year3', 'gpa3',
        'programmingLanguages', 'webTechnologies', 'databaseTechnologies', 'toolsPlatforms', 'others',
        'projectTitle1', 'projectTech1', 'projectDescription1',
        'projectTitle2', 'projectTech2', 'projectDescription2',
        'projectTitle3', 'projectTech3', 'projectDescription3',
        'jobTitle', 'company', 'duration', 'jobDescription',
        'certName1', 'certPlatform1', 'certName2', 'certPlatform2', 'certName3', 'certPlatform3',
        'achievement1', 'achievement2', 'achievement3'
    ];

    for (let field of requiredFields) {
        if (!formData[field] || formData[field].trim() === '') {
            alert(`Please fill in all required fields. Missing: ${field}`);
            return false;
        }
    }

    // Check if required images are uploaded
    const requiredImages = ['profilePhoto', 'portfolioImage1', 'portfolioImage2'];
    for (let image of requiredImages) {
        if (!uploadedImages[image]) {
            alert(`Please upload ${image.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            return false;
        }
    }

    // Check if at least 4 logos are selected
    if (selectedLogos.length < 4) {
        alert('Please select at least 4 logos from the available options.');
        return false;
    }

    return true;
}

function generateResumeHTML(data, uploadedImages, selectedLogos) {
    return `
    <div class="resume-container" id="resume-content">
        <!-- Header -->
        <div class="header-container">
            <div class="header">
                <img src="./images/logo.png" alt="logo" class="logo-au">
            </div>
            <div class="logo-container">
                ${selectedLogos.map((logo, index) => `<img src="./images/${logo}" alt="logo${index + 1}" class="hackerrank-logo">`).join('')}
            </div>
        </div>
        
        <!-- Profile Section -->
        <div class="profile-section">
            <div class="profile-left">
                <div class="profile-photo-bg" style="background-image: url('${uploadedImages.profilePhoto}');"></div>
                <div class="student-name">${data.studentName.toUpperCase()}</div>
            </div>
            <div class="profile-right">
                <div class="contact-info">
                    <div class="contact-item">
                        <img src="./images/email.png" alt="Email" class="contact-icon">
                        <div class="email-container">
                            <div class="email-item">
                                <span class="email-label">P:</span>
                                <a class="email-link" href="mailto:${data.personalEmail}">${data.personalEmail}</a>
                            </div>
                            <div class="email-item">
                                <span class="email-label">O:</span>
                                <a class="email-link" href="mailto:${data.officialEmail}">${data.officialEmail}</a>
                            </div>
                        </div>
                    </div>
                    <div class="contact-item">
                        <img src="./images/phone.png" alt="Phone" class="contact-icon">
                        <a href="tel:${data.phone}">${data.phone}</a>
                    </div>
                    <div class="contact-item">
                        <img src="./images/linkedin.png" alt="LinkedIn" class="contact-icon">
                        <a href="${data.linkedin}" target="_blank">${data.linkedin}</a>
                    </div>
                    <div class="contact-item">
                        <img src="./images/github.png" alt="GitHub" class="contact-icon">
                        <a href="${data.github}" target="_blank">${data.github}</a>
                    </div>
                    <div class="contact-item">
                        <img src="./images/leetcode.png" alt="Leetcode" class="contact-icon">
                        <a href="${data.leetcode}" target="_blank">${data.leetcode}</a>
                    </div>
                    <div class="contact-item">
                        <img src="./images/hackerrank.png" alt="HackerRank" class="contact-icon">
                        <a href="${data.hackerrank}" target="_blank">${data.hackerrank}</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Left Column -->
            <div class="left-column">
                <!-- Education -->
                <div class="section">
                    <h2 class="section-title">Education</h2>
                    <div class="section-content">
                        <div class="education-item">
                            <div class="edu-header">
                                <div class="degree-line"><div class="degree">${data.degree1}</div>${data.specialization1 ? `<div class="specialization">(${data.specialization1})</div>` : ''}</div>
                            </div>
                            <div class="year-gpa">
                                <span>Year of Graduation: ${data.year1}</span>
                                <span> | </span>
                                <span>CGPA: ${data.gpa1}</span>
                            </div>
                        </div>
                        ${data.degree2 ? `
                        <div class="education-item">
                            <div class="edu-header">
                                <div class="degree-12">${data.degree2}</div>
                                <div class="education-details">
                                    ${data.coll_city2 ? `${data.coll_city2} | ` : ''}${data.board_of_education1} | Year: ${data.year2} | Percentage: ${data.gpa2}
                            </div>
                            </div>
                        </div>
                        ` : ''}
                        ${data.degree3 ? `
                        <div class="education-item">
                            <div class="edu-header">
                                <div class="degree">${data.degree3}</div>
                                <div class="education-details">
                                    ${data.coll_city3 ? `${data.coll_city3} | ` : ''}${data.board_of_education2} | Year: ${data.year3} | Percentage: ${data.gpa3}
                            </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Technical Skills -->
                <div class="section">
                    <h2 class="section-title">Technical Skills</h2>
                    <div class="section-content">
                        <div class="skills-list">
                            <div class="skill-item"><span><b class="bold-title"> 1. Programming Languages:</b></span> ${data.programmingLanguages}</div>
                            <div class="skill-item"><span><b class="bold-title"> 2. Web Technologies:</b></span> ${data.webTechnologies}</div>
                            <div class="skill-item"><span><b class="bold-title"> 3. Database Technologies:</b></span> ${data.databaseTechnologies}</div>
                            <div class="skill-item"><span><b class="bold-title"> 4. Tools/Platforms:</b></span> ${data.toolsPlatforms}</div>
                            <div class="skill-item"><span><b class="bold-title"> 5. Others:</b></span> ${data.others}</div>
                        </div>
                    </div>
                </div>

                <!-- Projects -->
                <div class="section">
                    <h2 class="section-title">Academic Projects</h2>
                    <div class="section-content">
                        <div class="project-item">
                            <div class="project-header">
                                <div class="project-title">1.${data.projectTitle1}</div>
                                <span class="project-sep">-</span>
                                <div class="project-tech"><b>${data.projectTech1}</b></div>
                            </div>
                            <div class="project-description">${data.projectDescription1}</div>
                        </div>
                        <div class="project-item">
                            <div class="project-header">
                                <div class="project-title">2.${data.projectTitle2}</div>
                                <span class="project-sep">-</span>
                                <div class="project-tech"><b>${data.projectTech2}</b></div>
                            </div>
                            <div class="project-description">${data.projectDescription2}</div>
                        </div>
                        ${data.projectTitle3 || data.projectTech3 || data.projectDescription3 ? `
                        <div class="project-item">
                            <div class="project-header">
                                <div class="project-title">3.${data.projectTitle3}</div>
                                <span class="project-sep">-</span>
                                <div class="project-tech"><b>${data.projectTech3}</b></div>
                            </div>
                            <div class="project-description">${data.projectDescription3}</div>
                        </div>` : ''}
                        ${Array.isArray(data.extraProjects) && data.extraProjects.length ? data.extraProjects.map((p, i) => `
                        <div class="project-item">
                            <div class="project-header">
                                <div class="project-title">${3 + i + 1}.${p.title || ''}</div>
                                <span class="project-sep">-</span>
                                <div class="project-tech"><b>${p.tech || ''}</b></div>
                            </div>
                            <div class="project-description">${p.description || ''}</div>
                        </div>
                        `).join('') : ''}
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="right-column">
                <!-- Internships -->
                <div class="section">
                    <h2 class="section-title">INTERNSHIPS/TRAINING</h2>
                    <div class="section-content">
                        <div class="experience-item">
                            <div class="job-title">${data.jobTitle}</div>
                            <div class="company">
                                <b>${data.company}</b>
                                <div class="duration"><b>${data.duration}</b></div>
                            </div>
                            <div class="job-description">${data.jobDescription}</div>
                        </div>
                    </div>
                </div>

                <!-- Certifications -->
                <div class="section">
                    <h2 class="section-title">Certifications</h2>
                    <div class="section-content">
                        <div class="cert-item">
                            <div class="cert-combined"><b>1.</b>${data.certName1} - ${data.certPlatform1}${data.certLink1 ? ` <a href="${data.certLink1}" target="_blank" class="cert-link">Link</a>` : ''}</div>
                        </div>
                        <div class="cert-item">
                            <div class="cert-combined"><b>2.</b>${data.certName2} - ${data.certPlatform2}${data.certLink2 ? ` <a href="${data.certLink2}" target="_blank" class="cert-link">Link</a>` : ''}</div>
                        </div>
                        <div class="cert-item">
                            <div class="cert-combined"><b>3.</b>${data.certName3} - ${data.certPlatform3}${data.certLink3 ? ` <a href="${data.certLink3}" target="_blank" class="cert-link">Link</a>` : ''}</div>
                        </div>
                        ${data.certName4 ? `<div class="cert-item">
                            <div class="cert-combined"><b>4.</b>${data.certName4} - ${data.certPlatform4}${data.certLink4 ? ` <a href="${data.certLink4}" target="_blank" class="cert-link">Link</a>` : ''}</div>
                        </div>` : ''}
                        ${data.certName5 ? `<div class="cert-item">
                            <div class="cert-combined"><b>5.</b>${data.certName5} - ${data.certPlatform5}${data.certLink5 ? ` <a href="${data.certLink5}" target="_blank" class="cert-link">Link</a>` : ''}</div>
                        </div>` : ''}
                    </div>
                </div>

                <!-- Achievements -->
                <div class="section">
                    <h2 class="section-title">Achievements</h2>
                    <div class="section-content">
                        <ul class="achievements-list" style="list-style: none;">
                            <li><b>1.</b> ${data.achievement1}${data.achievementLink1 ? ` <a href="${data.achievementLink1}" target="_blank" class="achievement-link">Link</a>` : ''}</li>
                            <li><b>2.</b> ${data.achievement2}${data.achievementLink2 ? ` <a href="${data.achievementLink2}" target="_blank" class="achievement-link">Link</a>` : ''}</li>
                            <li><b>3.</b> ${data.achievement3}${data.achievementLink3 ? ` <a href="${data.achievementLink3}" target="_blank" class="achievement-link">Link</a>` : ''}</li>
                            ${data.achievement4 ? `<li><b>4.</b> ${data.achievement4}${data.achievementLink4 ? ` <a href="${data.achievementLink4}" target="_blank" class="achievement-link">Link</a>` : ''}</li>` : ''}
                            ${data.achievement5 ? `<li><b>5.</b> ${data.achievement5}${data.achievementLink5 ? ` <a href="${data.achievementLink5}" target="_blank" class="achievement-link">Link</a>` : ''}</li>` : ''}
                        </ul>
                    </div>
                </div>

                <div class="section">
                    <h2 class="section-title">PORTFOLIO & VIDEO RESUME</h2>
                    <div class="section-content">
                        <ul class="achievements-img">
                            <img src="${uploadedImages.portfolioImage1}" alt="qr" class="qr">
                            <img src="${uploadedImages.portfolioImage2}" alt="qr" class="qr">
                        </ul>
                <div class="duration-list">
                    <p>~1 min</p>
                    <p>~3 min</p>
                </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <div class="footer-bold">Alliance School of Advanced Computing </div>
                <div>Alliance University - Central Campus, Chikkahadage Cross Chandapura-Anekal, Main Road, Bengaluru,
                    Karnataka 562106</div>
                <div>www.alliance.edu.in</div>
            </div>
        </div>
    </div>
    `;
}

// Add some sample data for testing (optional)
function fillSampleData() {
    document.getElementById('studentName').value = 'DINESH A G';
    document.getElementById('personalEmail').value = 'agdinesh123@gmail.com';
    document.getElementById('officialEmail').value = 'adineshBTECH23@ced.alliance.edu.in';
    document.getElementById('phone').value = '+91 9000000001';
    document.getElementById('linkedin').value = 'www.linkedin.com/in/dinesh-a-g';
    document.getElementById('github').value = 'https://github.com/agdinesh943';
    document.getElementById('leetcode').value = 'https://leetcode.com/johndoe';
    document.getElementById('hackerrank').value = 'https://hackerrank.com/johndoe';

    // Education
    document.getElementById('degree1').value = 'Bachelor of Science in Computer Science';
    document.getElementById('university1').value = 'University of California, Berkeley';
    document.getElementById('year1').value = '2020 - 2024';
    document.getElementById('gpa1').value = 'CGPA: 7.5/10.0';

    // Skills
    document.getElementById('programmingLanguages').value = 'C, C++, Python, Java';
    document.getElementById('webTechnologies').value = 'HTML, CSS, JavaScript, React, Node.js';
    document.getElementById('databaseTechnologies').value = 'MySQL, MongoDB';
    document.getElementById('toolsPlatforms').value = 'Git, GitHub, Linux, VS Code';
    document.getElementById('others').value = 'Microsoft Azure, AWS (Basics), Figma (UI/UX), Data Structures, OOPs';

    // Projects
    document.getElementById('projectTitle1').value = 'E-commerce Platform';
    document.getElementById('projectTech1').value = 'React, Node.js, MongoDB, Stripe API';
    document.getElementById('projectDescription1').value = 'Developed a full-stack e-commerce platform with user authentication, product catalog, shopping cart, and payment integration.';

    document.getElementById('projectTitle2').value = 'Task Management App';
    document.getElementById('projectTech2').value = 'Vue.js, Express.js, PostgreSQL';
    document.getElementById('projectDescription2').value = 'Built a collaborative task management application with real-time updates, team collaboration features, and progress tracking.';

    document.getElementById('projectTitle3').value = 'Smart Attendance System';
    document.getElementById('projectTech3').value = 'Python, OpenCV, Flask, SQLite';
    document.getElementById('projectDescription3').value = 'Implemented a face-recognition based attendance system with live camera feed, student enrollment, daily reports, and admin dashboard.';

    // Experience
    document.getElementById('jobTitle').value = 'Software Development Intern';
    document.getElementById('company').value = 'Tech Solutions Inc.';
    document.getElementById('duration').value = 'June 2023 - August 2023';
    document.getElementById('jobDescription').value = 'Developed and maintained web applications using React and Node.js. Collaborated with senior developers on feature implementation and bug fixes.';

    // Certifications
    document.getElementById('certName1').value = 'AWS Certified Developer';
    document.getElementById('certPlatform1').value = 'Amazon Web Services - 2023';
    document.getElementById('certLink1').value = 'https://aws.amazon.com/certification/';
    document.getElementById('certName2').value = 'Google Cloud Professional';
    document.getElementById('certPlatform2').value = 'Google Cloud - 2023';
    document.getElementById('certLink2').value = 'https://cloud.google.com/certification/';
    document.getElementById('certName3').value = 'React Developer Certification';
    document.getElementById('certPlatform3').value = 'Meta - 2022';
    document.getElementById('certLink3').value = 'https://react.dev/';

    // Achievements
    document.getElementById('achievement1').value = 'Won 1st place in University Hackathon 2023';
    document.getElementById('achievementLink1').value = 'https://hackathon-results.com/winner';
    document.getElementById('achievement2').value = 'Dean\'s List for 4 consecutive semesters';
    document.getElementById('achievementLink2').value = 'https://university.edu/deans-list';
    document.getElementById('achievement3').value = 'Published research paper on Machine Learning';
    document.getElementById('achievementLink3').value = 'https://research-paper.com/ml-study';
    document.getElementById('achievement4').value = 'Volunteer at local coding bootcamp';
    document.getElementById('achievementLink4').value = 'https://bootcamp-volunteer.org';
    document.getElementById('achievement5').value = 'Member of Computer Science Honor Society';
    document.getElementById('achievementLink5').value = 'https://honor-society.edu/cs';

    // Portfolio
    // durations are static now
}

// Uncomment the line below to fill sample data for testing
// fillSampleData();
