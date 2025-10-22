// Landing Page JavaScript
document.addEventListener('DOMContentLoaded', function () {
    const agreementCheckbox = document.getElementById('agreementCheckbox');
    const proceedBtn = document.getElementById('proceedBtn');

    // Function to update button state based on checkbox
    function updateButtonState() {
        if (agreementCheckbox.checked) {
            proceedBtn.disabled = false;
            proceedBtn.style.opacity = '1';
            proceedBtn.style.cursor = 'pointer';
        } else {
            proceedBtn.disabled = true;
            proceedBtn.style.opacity = '0.6';
            proceedBtn.style.cursor = 'not-allowed';
        }
    }

    // Add event listener to checkbox
    agreementCheckbox.addEventListener('change', updateButtonState);

    // Add click event to proceed button
    proceedBtn.addEventListener('click', function () {
        if (!agreementCheckbox.checked) {
            // This shouldn't happen due to disabled state, but just in case
            alert('Please agree to the terms and conditions before proceeding.');
            return;
        }

        // Add loading state to button
        const originalContent = proceedBtn.innerHTML;
        proceedBtn.innerHTML = '<ion-icon name="hourglass"></ion-icon> Redirecting...';
        proceedBtn.disabled = true;

        // Navigate to resume form after a short delay for UX
        setTimeout(() => {
            window.location.href = '/resume-form';
        }, 500);
    });

    // Add smooth scroll behavior for better UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add animation on scroll for cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards for animation
    document.querySelectorAll('.guidelines-card, .requirement-item').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Add keyboard accessibility
    agreementCheckbox.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.checked = !this.checked;
            updateButtonState();
        }
    });

    // Add keyboard support for proceed button
    proceedBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !this.disabled) {
            e.preventDefault();
            this.click();
        }
    });

    // Initialize button state
    updateButtonState();

    // Add some interactive feedback
    const cards = document.querySelectorAll('.guidelines-card, .requirement-item');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add form validation feedback
    const checkboxLabel = document.querySelector('.agreement-label');
    checkboxLabel.addEventListener('click', function () {
        // Add a subtle animation when clicked
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });

    // Console welcome message
    console.log('%c🎉 Welcome to AU Resume Maker 1.0!', 'color: #667eea; font-size: 16px; font-weight: bold;');
    console.log('%cReady to create your professional resume?', 'color: #7f8c8d; font-size: 14px;');
});
