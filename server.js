const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads directory
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage for payment receipts
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const cleanTeam = (req.body.teamName || 'team').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `pay_${cleanTeam}_${Date.now()}${ext}`;
        cb(null, filename);
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 16 * 1024 * 1024 } });

// Database initialization
const dbPath = path.join(__dirname, 'registrations.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database at', dbPath);
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS teams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                leader_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                college TEXT NOT NULL,
                team_name TEXT NOT NULL,
                problem_statement TEXT NOT NULL,
                proposed_solution TEXT NOT NULL DEFAULT "",
                team_size INTEGER NOT NULL,
                members TEXT NOT NULL,
                leader_year TEXT NOT NULL DEFAULT "1st Year",
                transaction_id TEXT NOT NULL DEFAULT "",
                payment_screenshot TEXT NOT NULL DEFAULT "",
                payment_status TEXT NOT NULL DEFAULT "Pending",
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Safe column additions for older schemas
        const cols = [
            ['proposed_solution', 'TEXT NOT NULL DEFAULT ""'],
            ['leader_year', 'TEXT NOT NULL DEFAULT "1st Year"'],
            ['transaction_id', 'TEXT NOT NULL DEFAULT ""'],
            ['payment_screenshot', 'TEXT NOT NULL DEFAULT ""'],
            ['payment_status', 'TEXT NOT NULL DEFAULT "Pending"']
        ];

        cols.forEach(([col, colType]) => {
            db.run(`ALTER TABLE teams ADD COLUMN ${col} ${colType}`, () => {
                // Ignore if column already exists
            });
        });
    });
}

// Static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOAD_DIR));

// Page routes
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/healthz', (req, res) => res.status(200).send('OK'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// API: Team Registration with Payment & Academic Year Diversity Validation
app.post('/api/register', upload.single('paymentScreenshot'), (req, res) => {
    try {
        const body = req.body || {};
        let members = [];

        try {
            members = typeof body.members === 'string' ? JSON.parse(body.members) : (body.members || []);
        } catch (e) {
            members = [];
        }

        const leaderName = (body.leaderName || '').trim();
        const leaderYear = (body.leaderYear || '1st Year').trim();
        const email = (body.email || '').trim();
        const phone = (body.phone || '').trim();
        const college = (body.college || '').trim();
        const teamName = (body.teamName || '').trim();
        const problemStatement = (body.problemStatement || '').trim();
        const proposedSolution = (body.proposedSolution || '').trim();
        const teamSize = parseInt(body.teamSize || 3);
        const transactionId = (body.transactionId || 'FREE').trim();
        const screenshotFilename = req.file ? req.file.filename : (body.paymentScreenshot || '');

        if (!leaderName || !email || !phone || !college || !teamName || !problemStatement) {
            return res.status(400).json({ status: 'error', message: 'All required team details must be filled out.' });
        }

        // Validate Year Diversity Rule
        const allYears = [leaderYear];
        members.forEach(m => {
            if (m.year && m.year.trim()) allYears.push(m.year.trim());
        });

        const uniqueYears = [...new Set(allYears)];
        if (uniqueYears.length < 2) {
            return res.status(400).json({
                status: 'error',
                message: 'Team variation requirement not met: At least one member must be from a different academic year (e.g. 1st year + 2nd year).'
            });
        }

        const query = `
            INSERT INTO teams (
                leader_name, email, phone, college, team_name, problem_statement,
                proposed_solution, team_size, members, leader_year, transaction_id,
                payment_screenshot, payment_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(query, [
            leaderName, email, phone, college, teamName, problemStatement,
            proposedSolution, teamSize, JSON.stringify(members), leaderYear,
            transactionId, screenshotFilename, 'Free'
        ], function (err) {
            if (err) {
                console.error('Insert error:', err.message);
                return res.status(500).json({ status: 'error', message: err.message });
            }
            res.status(201).json({
                status: 'success',
                message: 'Registration completed successfully!',
                teamId: this.lastID
            });
        });

    } catch (err) {
        console.error('Registration processing error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// API: View all registrations (backward-compatible)
app.get('/api/view-registrations', (req, res) => {
    db.all('SELECT * FROM teams ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const registrations = rows.map(r => {
            try { r.members = JSON.parse(r.members); } catch (e) { r.members = []; }
            return r;
        });
        res.json({ total: registrations.length, data: registrations });
    });
});

// API: Admin Dashboard registrations with KPI metrics
app.get('/api/admin/registrations', (req, res) => {
    db.all('SELECT * FROM teams ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ status: 'error', message: err.message });

        let totalParticipants = 0;
        let verifiedCount = 0;
        let pendingCount = 0;
        const tracks = {};
        const colleges = {};

        const teams = rows.map(r => {
            try { r.members = JSON.parse(r.members); } catch (e) { r.members = []; }
            totalParticipants += parseInt(r.team_size || 3);
            if (r.payment_status === 'Verified') verifiedCount++;
            else pendingCount++;

            const track = r.problem_statement || 'Unspecified';
            tracks[track] = (tracks[track] || 0) + 1;

            const coll = r.college || 'Unknown';
            colleges[coll] = (colleges[coll] || 0) + 1;

            return r;
        });

        res.json({
            status: 'success',
            stats: {
                total_teams: teams.length,
                total_participants: totalParticipants,
                verified_payments: verifiedCount,
                pending_payments: pendingCount,
                total_revenue: 0,
                verified_revenue: 0,
                tracks: tracks,
                colleges: colleges
            },
            data: teams
        });
    });
});

// API: Admin verify payment status
app.post('/api/admin/verify-payment', (req, res) => {
    const { teamId, status } = req.body || {};
    if (!teamId) return res.status(400).json({ status: 'error', message: 'teamId is required' });

    db.run('UPDATE teams SET payment_status = ? WHERE id = ?', [status || 'Verified', teamId], function (err) {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        res.json({ status: 'success', message: `Payment marked as ${status || 'Verified'}` });
    });
});

// API: Admin delete team
app.delete('/api/admin/delete-team/:id', (req, res) => {
    const teamId = req.params.id;
    db.run('DELETE FROM teams WHERE id = ?', [teamId], function (err) {
        if (err) return res.status(500).json({ status: 'error', message: err.message });
        res.json({ status: 'success', message: 'Team deleted successfully' });
    });
});

// API: Admin export CSV
app.get('/api/admin/export-csv', (req, res) => {
    db.all('SELECT * FROM teams ORDER BY id ASC', [], (err, rows) => {
        if (err) return res.status(500).send('Error generating CSV');

        const headers = [
            'Team ID', 'Team Name', 'Team Size', 'Problem Statement',
            'Leader Name', 'Leader Year', 'Leader Email', 'Leader Phone', 'College',
            'Member 2 Name', 'Member 2 Year', 'Member 2 Email', 'Member 2 Phone',
            'Member 3 Name', 'Member 3 Year', 'Member 3 Email', 'Member 3 Phone',
            'Member 4 Name', 'Member 4 Year', 'Member 4 Email', 'Member 4 Phone',
            'Member 5 Name', 'Member 5 Year', 'Member 5 Email', 'Member 5 Phone',
            'Transaction ID (UTR)', 'Payment Screenshot File', 'Payment Status',
            'Proposed Solution', 'Registration Timestamp'
        ];

        const escapeCsv = (str) => {
            if (str === null || str === undefined) return '""';
            return `"${String(str).replace(/"/g, '""')}"`;
        };

        const lines = [headers.map(escapeCsv).join(',')];

        rows.forEach(r => {
            let members = [];
            try { members = JSON.parse(r.members); } catch (e) { members = []; }

            const memberCols = [];
            for (let i = 0; i < 4; i++) {
                if (i < members.length) {
                    const m = members[i];
                    memberCols.push(m.name || '', m.year || '', m.email || '', m.phone || '');
                } else {
                    memberCols.push('', '', '', '');
                }
            }

            const row = [
                r.id, r.team_name, r.team_size, r.problem_statement,
                r.leader_name, r.leader_year, r.email, r.phone, r.college,
                ...memberCols,
                r.transaction_id, r.payment_screenshot, r.payment_status,
                r.proposed_solution, r.registration_date
            ];

            lines.push(row.map(escapeCsv).join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=aharada_hackathon_registrations.csv');
        res.send(lines.join('\n'));
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Aharada Hackathon Server running on port ${PORT}`);
});
