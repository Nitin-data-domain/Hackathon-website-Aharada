# Aharada Kaushal Kumbh 2026 - Hackathon Web Platform

Official website and team registration portal for **Aharada Kaushal Kumbh 2026**, an Inter-University AI & Machine Learning hackathon hosted by [Aharada Education](https://aharadaedu.com/).

---

## 📅 Event Overview
- **Event Finale Date:** 26 October 2026
- **Prize Pool:** ₹10,000 (1st: ₹5,000 | 2nd: ₹3,000 | 3rd: ₹2,000)
- **Team Size:** 3 to 5 Members per team
- **Registration Fee:** FREE (No registration fee required)
- **Event Head:** Mr. Kunal Rawat (📞 +91 8299729308 | ✉️ kunal@aharadaedu.in)

---

## 🎯 Official Problem Statements

1. **PS1: Campus Lost & Found System** *(Easy)*
   - A platform for students to report, search, and recover lost campus valuables.
2. **PS2: Smart Student Planner** *(Easy)*
   - Academic organizer dashboard for tracking assignments, deadlines, and timetables.
3. **PS3: Green Campus Challenge** *(Easy)*
   - Gamified platform fostering eco-friendly actions and campus waste segregation.
4. **PS4: Student Placement Prediction System** *(Best Choice — Featured)*
   - Machine learning and data analytics system to predict placement outcomes and readiness factors.
5. **PS5: Student Dropout Risk Analysis** *(Beginner to Intermediate)*
   - Predictive analytics to identify retention risks and recommend early academic support.

---

## 👥 Team Diversity & Variation Requirement
To encourage cross-batch collaboration and peer learning:
- Every team **must include members from at least two different academic years** (e.g., 1st Year + 2nd Year).
- Teams composed entirely of members from the same academic year will not be accepted.
- Automated validation checks are built into both the frontend registration form and backend server.

---

## 🎁 Registration
- **Registration Fee:** FREE for all participating teams.
- **Eligibility:** College students from all universities.
- **Requirements:** Complete team registration form with 3-5 members respecting academic year diversity. No payment or transaction ID required.

## 🛡️ Admin Portal (`/admin`)
The platform includes an administrative dashboard:
- **URL:** `http://localhost:5000/admin`
- **Access:** Protected by admin passkey (`admin123` / `akk2026`).
- **Features:**
  - Real-time KPI metrics (Total Teams, Participants, Estimated Revenue, Payment Verification counts).
  - Search by team name, leader name, college, email, or transaction ID.
  - Filter by problem statement track and payment status.
  - View full team details and academic year diversity verification.
  - Payment receipt lightbox with image zoom and one-click verification.
  - Export all registrations into an Excel-compatible `.csv` file.

---

## 🚀 Getting Started Locally

### Prerequisites
- Python 3.8+
- Flask (`pip install -r requirements.txt`)

### Installation & Execution
```bash
# Clone the repository
git clone https://github.com/Nitin-data-domain/Hackathon-website-Aharada.git
cd Hackathon-website-Aharada

# Install dependencies
pip install -r requirements.txt

# Start the Flask backend server
python app.py
```

Open your browser at:
- **Main Website:** `http://localhost:5000`
- **Admin Portal:** `http://localhost:5000/admin`