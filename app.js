const express = require("express");
const app = express();
const path = require("path");
const axios = require("axios");
const mongoose = require("mongoose");
const MongoStore = require('connect-mongo');
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("connect-flash");

require("dotenv").config();

// Models
const User = require("./models/user.js");
const Admin = require("./models/admin.js");
const Listing = require("./models/listing.js");
const ZhcetListing = require("./models/zhcetListing.js");
const ZhcetApplication = require("./models/zhcetApplication.js");

// ── MULTER (CV uploads) ──────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "public/uploads/cvs");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") cb(null, true);
        else cb(new Error("Only PDF files allowed"));
    }
});

// ── APP CONFIG ───────────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL, // Ensure this exists in your .env
        touchAfter: 24 * 3600
    }),
    secret: process.env.Admin_Secret_Key,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));
// app.use(session({
//     secret: process.env.Admin_Secret_Key,
//     resave: false,
//     saveUninitialized: false,
//     cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
// }));
app.use(flash());
app.use((req, res, next) => {
    res.locals.currUser = req.session.user_id || null;
    res.locals.currAdmin = req.session.admin_id || null;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});


// ── DB ───────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.atlas_URL)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.log("❌ MongoDB error:", err));

// ── MIDDLEWARE ───────────────────────────────────────────────────────────────
const isLoggedIn = (req, res, next) => {
    if (!req.session.user_id) {
        req.flash("error", "You must be logged in to do that.");
        return res.redirect("/login");
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (!req.session.admin_id) {
        req.flash("error", "Admin access required.");
        return res.redirect("/admin/login");
    }
    next();
};

// ── LANDING PAGE ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.render("landing.ejs");
});

// ── HOME / INTERNSHIPS (3 Sections) ─────────────────────────────────────────
app.get("/home", isLoggedIn, async (req, res) => {
    try {
        const activeTab = req.query.type || "api";

        // API Jobs (always fetch)
        let allJobs = [];
        try {
            const response = await axios.get("https://www.arbeitnow.com/api/job-board-api");
            allJobs = response.data.data.slice(0, 9);
        } catch (e) {
            console.error("API fetch error:", e.message);
        }

        // Community Listings
        const addedListings = await Listing.find().sort({ createdAt: -1 }).limit(20);

        // ZHCET Listings
        const zhcetListings = await ZhcetListing.find({ isActive: true }).sort({ createdAt: -1 });

        res.render("./listings/internships.ejs", { allJobs, addedListings, zhcetListings, activeTab });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading listings.");
    }
});

// ── API JOB SHOW PAGE ────────────────────────────────────────────────────────
app.get("/home/:id", isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get("https://www.arbeitnow.com/api/job-board-api");
        const allJobs = response.data.data;
        const job = allJobs.find(j => j.slug === id);
        if (!job) return res.status(404).send("Job not found");
        res.render("./listings/show.ejs", { job });
    } catch (error) {
        res.status(500).send("Error fetching job details");
    }
});

// ── COMMUNITY LISTINGS ────────────────────────────────────────────────────────
app.get("/listings/:id", async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).populate("addedBy", "name email");
        if (!listing) return res.status(404).send("Listing not found");
        res.render("./listings/listing-show.ejs", { listing });
    } catch (e) {
        res.status(500).send("Error fetching listing");
    }
});

// Add Listing
app.get("/new", isLoggedIn, (req, res) => {
    res.render("./listings/new.ejs");
});
app.post("/new", isLoggedIn, async (req, res) => {
    try {
        const { title, company, description, location, applyUrl } = req.body;
        const newListing = new Listing({ title, company, description, location, applyUrl, addedBy: req.session.user_id });
        await newListing.save();
        req.flash("success", "Listing added successfully!");
        res.redirect("/home?type=added");
    } catch (e) {
        res.status(500).send("Error adding listing: " + e.message);
    }
});

// ── ZHCET LISTINGS ────────────────────────────────────────────────────────────
app.get("/zhcet/:id", async (req, res) => {
    try {
        const listing = await ZhcetListing.findById(req.params.id);
        if (!listing) return res.status(404).send("Listing not found");

        let hasApplied = false;
        if (req.session.user_id) {
            const existing = await ZhcetApplication.findOne({ listing: req.params.id, user: req.session.user_id });
            hasApplied = !!existing;
        }
        res.render("./listings/zhcet-show.ejs", { listing, hasApplied });
    } catch (e) {
        res.status(500).send("Error: " + e.message);
    }
});

// ZHCET Apply (POST with CV upload)
app.post("/zhcet/:id/apply", isLoggedIn, upload.single("cv"), async (req, res) => {
    try {
        const listing = await ZhcetListing.findById(req.params.id);
        if (!listing) return res.status(404).send("Listing not found");

        
        const existing = await ZhcetApplication.findOne({ listing: req.params.id, user: req.session.user_id });
        if (existing) {
            req.flash("error", "You have already applied for this listing.");
            return res.redirect(`/zhcet/${req.params.id}`);
        }

        if (!req.file) {
            req.flash("error", "Please upload your CV (PDF only).");
            return res.redirect(`/zhcet/${req.params.id}`);
        }

        const application = new ZhcetApplication({
            listing: req.params.id,
            user: req.session.user_id,
            coverNote: req.body.coverNote,
            cvPath: req.file.filename,
            cvOriginalName: req.file.originalname,
            status: "pending"
        });
        await application.save();

        // Add to listing's applications array
        listing.applications.push(application._id);
        await listing.save();

        req.flash("success", "Application submitted successfully!");
        res.redirect(`/zhcet/${req.params.id}`);
    } catch (e) {
        console.error(e);
        req.flash("error", "Error submitting application: " + e.message);
        res.redirect(`/zhcet/${req.params.id}`);
    }
});

// ── USER AUTH ─────────────────────────────────────────────────────────────────
app.get("/signup", (req, res) => res.render("./users/signup.ejs"));
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password, course, year, branch } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, course, year, branch });
        await newUser.save();
        req.session.user_id = newUser._id;
        res.redirect("/home");
    } catch (e) {
        req.flash("error", "Registration error: " + e.message);
        res.redirect("/signup");
    }
});

app.get("/login", (req, res) => res.render("./users/login.ejs"));
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user_id = user._id;
        return res.redirect("/home");
    }
    req.flash("error", "Invalid email or password.");
    res.redirect("/login");
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────
const ADMIN_SECRET = process.env.Admin_Secret_Key;

app.get("/admin/login", (req, res) => res.render("./admin/login.ejs"));
app.post("/admin/login", async (req, res) => {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (admin && await bcrypt.compare(password, admin.password)) {
        req.session.admin_id = admin._id;
        return res.redirect("/admin/dashboard");
    }
    req.flash("error", "Invalid admin credentials.");
    res.redirect("/admin/login");
});

app.get("/admin/signup", (req, res) => res.render("./admin/signup.ejs"));
app.post("/admin/signup", async (req, res) => {
    try {
        const { name, email, password, department, secretKey } = req.body;
        if (secretKey !== ADMIN_SECRET) {
            req.flash("error", "Invalid admin secret key.");
            return res.redirect("/admin/signup");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({ name, email, password: hashedPassword, department });
        await admin.save();
        req.session.admin_id = admin._id;
        res.redirect("/admin/dashboard");
    } catch (e) {
        req.flash("error", "Error: " + e.message);
        res.redirect("/admin/signup");
    }
});

app.get("/admin/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/admin/login"));
});

// Admin Dashboard
app.get("/admin/dashboard", isAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.admin_id);
        const zhcetListings = await ZhcetListing.find().sort({ createdAt: -1 });
        const applications = await ZhcetApplication.find()
            .populate("user", "name email year branch")
            .populate("listing", "title department")
            .sort({ appliedAt: -1 });

        const stats = {
            totalListings: zhcetListings.length,
            totalApplications: applications.length,
            accepted: applications.filter(a => a.status === "accepted").length,
            pending: applications.filter(a => a.status === "pending").length
        };

        res.render("./admin/dashboard.ejs", { admin, zhcetListings, applications, stats });
    } catch (e) {
        res.status(500).send("Dashboard error: " + e.message);
    }
});

// Admin: New ZHCET Listing
app.get("/admin/zhcet/new", isAdmin, (req, res) => res.render("./admin/new-zhcet.ejs"));
app.post("/admin/zhcet/new", isAdmin, async (req, res) => {
    try {
        const { title, department, description, requirements, seats, duration, stipend, eligibility, deadline } = req.body;
        const listing = new ZhcetListing({
            title, department, description, requirements,
            seats: seats || null,
            duration, stipend, eligibility,
            deadline: deadline || null,
            createdBy: req.session.admin_id
        });
        await listing.save();
        req.flash("success", "ZHCET listing created!");
        res.redirect("/admin/dashboard");
    } catch (e) {
        req.flash("error", "Error: " + e.message);
        res.redirect("/admin/zhcet/new");
    }
});

// Admin: Delete ZHCET Listing
app.get("/admin/zhcet/:id/delete", isAdmin, async (req, res) => {
    try {
        await ZhcetListing.findByIdAndDelete(req.params.id);
        await ZhcetApplication.deleteMany({ listing: req.params.id });
        res.redirect("/admin/dashboard");
    } catch (e) {
        res.status(500).send("Error deleting listing");
    }
});

// Admin: View Applicants for a specific listing
app.get("/admin/zhcet/:id/applicants", isAdmin, async (req, res) => {
    try {
        const listing = await ZhcetListing.findById(req.params.id);
        const applications = await ZhcetApplication.find({ listing: req.params.id })
            .populate("user", "name email year branch")
            .sort({ appliedAt: -1 });
        const admin = await Admin.findById(req.session.admin_id);
        res.render("./admin/applicants.ejs", { listing, applications, admin });
    } catch (e) {
        res.status(500).send("Error: " + e.message);
    }
});

// Admin: Serve CV
app.get("/admin/cv/:appId", isAdmin, async (req, res) => {
    try {
        const app = await ZhcetApplication.findById(req.params.appId);
        if (!app || !app.cvPath) return res.status(404).send("CV not found");
        const filePath = path.join(__dirname, "public/uploads/cvs", app.cvPath);
        res.download(filePath, app.cvOriginalName || "cv.pdf");
    } catch (e) {
        res.status(500).send("Error downloading CV");
    }
});

// Admin: Update application status
app.post("/admin/applications/:id/status", isAdmin, async (req, res) => {
    try {
        await ZhcetApplication.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.redirect("/admin/dashboard");
    } catch (e) {
        res.status(500).send("Error updating status");
    }
});

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8085;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
