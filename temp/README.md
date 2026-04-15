# CareerPortal — ZHCET, AMU

A full-stack internship & job listing platform for AMU students with global job feed, community listings, and ZHCET-exclusive opportunities with CV-based applications.

---

## 📁 Folder Structure

Place all files in your project root exactly like this:

```
minorproject/
├── app.js                          ← Main server (UPDATED)
├── package.json                    ← Dependencies (UPDATED — added multer)
│
├── models/
│   ├── user.js                     ← Student user model
│   ├── admin.js                    ← Admin model (NEW)
│   ├── listing.js                  ← Community listing model (NEW)
│   ├── zhcetListing.js             ← ZHCET listing model (NEW)
│   └── zhcetApplication.js         ← ZHCET application model (NEW)
│
├── public/
│   ├── style.css                   ← Updated styles
│   ├── images/
│   │   └── logo.png                ← Your existing logo
│   └── uploads/
│       └── cvs/                    ← Auto-created by multer (CV files stored here)
│
└── views/
    ├── landing.ejs                 ← NEW: Landing/home page
    │
    ├── includes/
    │   └── navbar.ejs              ← UPDATED: New navbar with 3 section links
    │
    ├── users/
    │   ├── login.ejs               ← UPDATED: Split-panel design
    │   └── signup.ejs              ← UPDATED: Split-panel design
    │
    ├── listings/
    │   ├── internships.ejs         ← UPDATED: 3-tab home page
    │   ├── show.ejs                ← UPDATED: API job detail page
    │   ├── listing-show.ejs        ← NEW: Community listing detail
    │   ├── new.ejs                 ← UPDATED: Add community listing form
    │   └── zhcet-show.ejs          ← NEW: ZHCET listing detail + CV apply form
    │
    └── admin/
        ├── login.ejs               ← NEW: Admin login page
        ├── signup.ejs              ← NEW: Admin registration page
        ├── dashboard.ejs           ← NEW: Admin dashboard
        ├── new-zhcet.ejs           ← NEW: Create ZHCET listing form
        └── applicants.ejs          ← NEW: Per-listing applicant table
```

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```
> `multer` is the new package added for CV uploads.

### 2. Start MongoDB
```bash
mongod
```

### 3. Run the server
```bash
node app.js
# or for auto-reload:
npx nodemon app.js
```

### 4. Visit the app
- **Landing Page:** http://localhost:8085/
- **Browse Jobs:** http://localhost:8085/home
- **Admin:** http://localhost:8085/admin/login

---

## 🔐 Admin Setup

### First time: Create an admin account
1. Go to http://localhost:8085/admin/signup
2. Fill in your name, email, department, password
3. For **"Admin Secret Key"** enter: `zhcet-admin-2025`

> ⚠️ **Important:** Change the secret key in `app.js` before deploying:
> ```js
> const ADMIN_SECRET = process.env.ADMIN_SECRET || "your-new-secret-here";
> ```

### Admin capabilities:
- ✅ Create/delete ZHCET listings
- ✅ View all applicants per listing
- ✅ Download applicant CVs
- ✅ Update application status (Pending → Reviewed → Accepted/Rejected)
- ✅ Dashboard with stats

---

## 🏠 Page Descriptions

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, listing type overview |
| `/home` | 3-tab job browser (Global / Community / ZHCET) |
| `/home?type=api` | Shows only global API jobs |
| `/home?type=added` | Shows only community listings |
| `/home?type=zhcet` | Shows only ZHCET listings |
| `/home/:slug` | API job detail page |
| `/listings/:id` | Community listing detail |
| `/zhcet/:id` | ZHCET listing detail with CV apply form |
| `/zhcet/:id/apply` | POST: Submit ZHCET application with CV |
| `/new` | Add a community listing (login required) |
| `/login` | Student login |
| `/signup` | Student signup |
| `/logout` | Logout |
| `/admin/login` | Admin login |
| `/admin/signup` | Admin registration |
| `/admin/dashboard` | Admin panel |
| `/admin/zhcet/new` | Create new ZHCET listing |
| `/admin/zhcet/:id/delete` | Delete ZHCET listing |
| `/admin/zhcet/:id/applicants` | View applicants for one listing |
| `/admin/applications/:id/status` | Update application status |
| `/admin/cv/:appId` | Download applicant CV |

---

## 📦 Environment Variables (optional)

Create a `.env` file for production:
```
SESSION_SECRET=your-random-session-secret
ADMIN_SECRET=your-admin-registration-key
PORT=8085
```

---

## ✨ Features Summary

| Feature | Status |
|---------|--------|
| Landing page with animated hero | ✅ |
| 3-section home (API / Community / ZHCET) | ✅ |
| Tab switching with URL update | ✅ |
| Global job feed (arbeitnow API) | ✅ |
| Community listing add/view | ✅ |
| ZHCET listing view with CV apply | ✅ |
| PDF CV upload (multer, 5MB limit) | ✅ |
| Duplicate application prevention | ✅ |
| Admin login/signup with secret key | ✅ |
| Admin dashboard with stats | ✅ |
| Per-listing applicant table | ✅ |
| Application status management | ✅ |
| Admin CV download | ✅ |
| Flash messages (success/error) | ✅ |
| Session-based auth (student + admin) | ✅ |
| bcrypt password hashing | ✅ |
| Responsive design | ✅ |
