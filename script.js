const sections = document.querySelectorAll('.section');
const navItems = document.querySelectorAll('.nav-item');
const topTabs = document.querySelectorAll('.top-tab');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${current}`) {
            item.classList.add('active');
        }
    });
    
    topTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('href') === `#${current}`) {
            tab.classList.add('active');
        }
    });
});

// Countdown to Hackathon Date: 26 October 2026
const countDownDate = new Date("October 26, 2026 09:30:00").getTime();

function selectProblem(problemValue) {
    const select = document.getElementById('problemStatement');
    if (select) {
        select.value = problemValue;
    }
    const registerSection = document.getElementById('register');
    if (registerSection) {
        registerSection.scrollIntoView({ behavior: 'smooth' });
    }
}

const updateCountdown = () => {
    const now = new Date().getTime();
    const distance = countDownDate - now;

    if (distance < 0) return;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const dEl = document.getElementById("days");
    if(dEl) {
        dEl.innerText = days.toString().padStart(2, '0');
        document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
        document.getElementById("minutes").innerText = minutes.toString().padStart(2, '0');
        document.getElementById("seconds").innerText = seconds.toString().padStart(2, '0');
    }
};

updateCountdown();
setInterval(updateCountdown, 1000);

// UPI Copy Helper
function copyUPI() {
    navigator.clipboard.writeText("9389981575@okbizaxis");
    const btn = document.querySelector('.btn-copy-upi');
    if (btn) {
        const orig = btn.innerText;
        btn.innerText = "COPIED!";
        setTimeout(() => btn.innerText = orig, 2000);
    }
}

// Payment Screenshot Preview Helper
function handleScreenshotPreview(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.getElementById('screenshotPreview');
            const fileNameEl = document.getElementById('screenshotFileName');
            const previewBox = document.getElementById('previewThumbBox');
            const promptBox = document.getElementById('fileUploadPrompt');

            if (previewImg && previewBox) {
                previewImg.src = e.target.result;
                fileNameEl.innerText = `${file.name} (${Math.round(file.size / 1024)} KB)`;
                previewBox.style.display = 'block';
                if (promptBox) promptBox.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }
}

// Live Team Academic Year Diversity Verification
function checkDiversity() {
    const leaderYearEl = document.getElementById('leaderYear');
    const leaderYear = leaderYearEl ? leaderYearEl.value : '';
    const statusBadge = document.getElementById('diversityLiveStatus');
    if (!statusBadge) return true;

    const memberYearSelects = document.querySelectorAll('.member-year-select');
    const memberYears = Array.from(memberYearSelects).map(s => s.value).filter(Boolean);

    // If selections are incomplete
    if (!leaderYear || memberYears.length < memberYearSelects.length) {
        statusBadge.className = 'diversity-status-badge invalid';
        statusBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Year variation: Select academic years for all team members';
        return false;
    }

    const allYears = [leaderYear, ...memberYears];
    const uniqueYears = [...new Set(allYears)];

    if (uniqueYears.length >= 2) {
        statusBadge.className = 'diversity-status-badge valid';
        statusBadge.innerHTML = `<i class="fas fa-check-circle"></i> Year variation verified! (${uniqueYears.join(' + ')})`;
        return true;
    } else {
        statusBadge.className = 'diversity-status-badge invalid';
        statusBadge.innerHTML = `<i class="fas fa-times-circle"></i> Invalid: All members are ${uniqueYears[0]}. At least one member must be from a different year.`;
        return false;
    }
}

// Dynamic Team Members Generator
const teamSizeSelect = document.getElementById('teamSize');
const membersContainer = document.getElementById('dynamic-team-members');

if (teamSizeSelect && membersContainer) {
    teamSizeSelect.addEventListener('change', (e) => {
        const size = parseInt(e.target.value);
        membersContainer.innerHTML = '';
        
        // Loop from 2 up to the selected size (Team Leader is member 1)
        for (let i = 2; i <= size; i++) {
            membersContainer.innerHTML += `
                <div class="member-input-group p-3" style="border-left: 2px solid var(--accent); background: rgba(0,0,0,0.25); padding: 15px; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span class="cyber-text" style="font-size: 0.85rem; color: var(--accent); font-weight: 700;">TEAM MEMBER #${i}</span>
                        <span style="font-size: 0.75rem; color: #8496a8;">*Different year recommended</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <input type="text" class="member-name" placeholder="MEMBER ${i} FULL NAME" required>
                        <select class="member-year-select" required onchange="checkDiversity()">
                            <option value="" disabled selected>MEMBER ${i} - YEAR OF STUDY</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                            <option value="Post Graduate">Post Graduate / Masters</option>
                        </select>
                        <input type="email" class="member-email" placeholder="MEMBER ${i} EMAIL" required>
                        <input type="tel" class="member-phone" placeholder="MEMBER ${i} PHONE" required>
                    </div>
                </div>
            `;
        }
        checkDiversity();
    });
}

// Registration Form Handler
const form = document.getElementById('registrationForm');
if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = this.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;

        // 1. Validate Academic Year Diversity Rule
        const leaderYear = document.getElementById('leaderYear').value;
        const memberYearSelects = document.querySelectorAll('.member-year-select');
        const memberYears = Array.from(memberYearSelects).map(s => s.value);
        const allYears = [leaderYear, ...memberYears];
        const uniqueYears = [...new Set(allYears)];

        if (uniqueYears.length < 2) {
            alert("⚠️ TEAM DIVERSITY REQUIREMENT NOT MET:\n\nAll members currently belong to " + uniqueYears[0] + ".\nIn Aharada Kaushal Kumbh, every team must include members from at least two different academic years (e.g. 1st year + 2nd year).\n\nPlease adjust your team composition to proceed.");
            document.getElementById('leaderYear').focus();
            return;
        }

        // 2. Validate Payment Screenshot
        const screenshotInput = document.getElementById('paymentScreenshot');
        if (!screenshotInput.files || !screenshotInput.files[0]) {
            alert("⚠️ PAYMENT CONFIRMATION REQUIRED:\n\nPlease upload the screenshot of your ₹500 UPI registration fee payment.");
            screenshotInput.focus();
            return;
        }

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> TRANSMITTING &amp; VERIFYING...';
        btn.disabled = true;

        try {
            // Collect member objects
            const members = [];
            const memberGroups = document.querySelectorAll('.member-input-group');
            memberGroups.forEach(group => {
                const name = group.querySelector('.member-name').value.trim();
                const year = group.querySelector('.member-year-select').value;
                const email = group.querySelector('.member-email').value.trim();
                const phone = group.querySelector('.member-phone').value.trim();
                if (name && email && phone) {
                    members.push({ name, year, email, phone });
                }
            });

            // Construct FormData for multipart upload
            const formData = new FormData();
            formData.append('leaderName', document.getElementById('leaderName').value.trim());
            formData.append('leaderYear', leaderYear);
            formData.append('email', document.getElementById('email').value.trim());
            formData.append('phone', document.getElementById('phone').value.trim());
            formData.append('college', document.getElementById('college').value.trim());
            formData.append('teamName', document.getElementById('teamName').value.trim());
            formData.append('problemStatement', document.getElementById('problemStatement').value);
            formData.append('proposedSolution', document.getElementById('proposedSolution').value.trim());
            formData.append('teamSize', document.getElementById('teamSize').value);
            formData.append('members', JSON.stringify(members));
            formData.append('transactionId', document.getElementById('transactionId').value.trim());
            formData.append('paymentScreenshot', screenshotInput.files[0]);

            // Submit to local backend server
            const response = await fetch('/api/register', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Server returned an error.');
            }

            // Also send payload to Google Script in background if available
            try {
                const googleScriptURL = 'https://script.google.com/macros/s/AKfycbyI8tyKxhvzIDPFqxXc0m9B5-nvA7gDbwRfuDGMB5GMyCkwAcZ-F1t_pE74D9QpqyDwVQ/exec';
                const googlePayload = {
                    leaderName: document.getElementById('leaderName').value.trim(),
                    leaderYear: leaderYear,
                    email: document.getElementById('email').value.trim(),
                    phone: document.getElementById('phone').value.trim(),
                    college: document.getElementById('college').value.trim(),
                    teamName: document.getElementById('teamName').value.trim(),
                    problemStatement: document.getElementById('problemStatement').value,
                    proposedSolution: document.getElementById('proposedSolution').value.trim(),
                    teamSize: parseInt(document.getElementById('teamSize').value),
                    transactionId: document.getElementById('transactionId').value.trim(),
                    members: members
                };
                fetch(googleScriptURL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(googlePayload)
                }).catch(() => {});
            } catch(e) {}

            btn.innerHTML = '<i class="fas fa-check-circle"></i> REGISTRATION SUCCESSFUL!';
            btn.style.borderColor = "#00e676";
            btn.style.color = "#00e676";
            btn.style.background = "rgba(0, 230, 118, 0.15)";

            alert(`✅ REGISTRATION COMPLETED!\n\nTeam "${document.getElementById('teamName').value}" has been registered successfully with ₹500 fee submission.\n\nTransaction ID: ${document.getElementById('transactionId').value}\n\nOur Event Head Mr. Kunal Rawat and team will verify the payment and email you confirmation details.`);

            form.reset();
            document.getElementById('dynamic-team-members').innerHTML = '';
            document.getElementById('previewThumbBox').style.display = 'none';
            document.getElementById('fileUploadPrompt').style.display = 'block';
            checkDiversity();

        } catch (error) {
            console.error("Submission error:", error);
            btn.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + (error.message || 'ERROR - TRY AGAIN');
            btn.style.borderColor = "#ff4444";
            btn.style.color = "#ff4444";
            alert("❌ SUBMISSION FAILED:\n\n" + (error.message || "Could not connect to the server. Please check your inputs and try again."));
        } finally {
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.borderColor = "";
                btn.style.color = "";
                btn.style.background = "";
                btn.disabled = false;
            }, 3500);
        }
    });
}

// FAQ Accordion Logic
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
        question.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    }
});
