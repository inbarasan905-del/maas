# MAAS Group of Companies – Employee Management & 8H Working System

A full-stack, enterprise-grade **Employee Management and Admin Dashboard** designed for **MAAS Group of Companies**, featuring a multi-method secure login, role-based dashboards (Admin, Manager, Employee), and an automatic **8-hour working-hours tracking system**.

Styled in the official **MAAS Pink & Royal Blue** theme with the fixed corporate logo, and fully optimized for both desktop/laptop web browsers and standalone mobile PWA installation on Android and iOS.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application
```bash
npm start
```
The application will launch at **[http://localhost:5000](http://localhost:5000)**.

---

## 🔑 Pre-Configured Demo Credentials

For quick evaluation, click any role button on the login screen or enter the credentials below:

| Role | Email / Gmail | Mobile Phone | Password | Key Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@company.com` | `+1 555-0101` | `admin123` | Full control, add/edit/deactivate employees, approve all leaves, company-wide reports, audit logs. |
| **👔 Manager** | `manager@company.com` | `+1 555-0102` | `manager123` | Department team oversight, live team 8h tracking, approve department leaves, department reports. |
| **💼 Employee** | `alex@company.com` | `+1 555-0103` | `employee123` | Personal 8h live timer, circular dial, break management, attendance history, apply for leave. |

*Additional sample employees included: `elena@company.com`, `marcus@company.com`, `priya@company.com`, `james@company.com`, `aaliyah@company.com` (all with password `password123`).*

---

## 🌟 Core Features & Modules

### 1. Unified Authentication & Login
- **Email or Mobile Login:** Switch between email address and mobile phone number with one click.
- **Show/Hide Password:** Interactive eye toggle to view password while typing.
- **Forgot Password with OTP:** Simulated instant 6-digit OTP delivery to email/phone and secure password reset.
- **Automatic 8-Hour Work Session on Login:** Logging in automatically records the Check In timestamp, marks the employee as **Present**, and initiates the 8-hour daily tracker.

### 2. 8-Hour Working Hours Tracking Engine
- **Automatic Clock-in & Clock-out:** Starts upon login and finalizes upon logout (or via explicit Check In / Check Out buttons).
- **Live Circular Progress Dial:** Real-time ticking SVG dial showing seconds elapsed, percentage towards 8 hours, and time remaining.
- **Break Management:** "Take Break" and "Resume Work" controls to exclude meal and personal pauses from billable working hours.
- **Overtime Tracking:** Automatic visual indicators when total hours exceed the standard 8-hour requirement.
- **Status Classification:** `In Progress`, `Completed` (8+ hours), `Short Hours` (< 8 hours), `On Break`, `Absent`, or `On Leave`.

### 3. Administrator Dashboard
- **Live KPI Metrics:** Total Employees, Present Today, Currently Working, Absent Today, On Leave, 8h Compliance.
- **Real-Time Active Sessions Monitor:** Live table showing all clocked-in staff with ticking hours and break status.
- **Employee Directory (CRUD):** Add new employees with custom roles, departments, salaries, and phone numbers.
- **Leave Management:** 1-Click Approve or Reject for submitted employee leaves with reviewer remarks.
- **Attendance & Hour Reports:** Date-filtered logs with 1-click **Export to CSV** and **Print Report** views.
- **Security Audit Logs:** Chronological record of logins, session events, and administrative changes.

### 4. Department Manager Dashboard
- **Department Metrics:** Team size, present today in department, active working hours.
- **Direct Reports Monitoring:** Live tracking of team members' 8-hour progress.
- **Department Leave Approvals:** Review and decide on time-off requests within the department.

### 5. Employee Dashboard
- **Profile Card:** Employee ID, photo, department, designation, phone, email, and joining date.
- **Hero 8-Hour Workstation:** Interactive circular dial, countdown timer, break toggling, and check-out button.
- **Attendance History:** Daily and monthly breakdown of check-ins, check-outs, break lengths, and total net hours.
- **Leave Applications:** Form to request Annual, Casual, Sick, or Unpaid leave with live status tracking.

### 6. Mobile Application (PWA)
- **Standalone Mobile Display:** Full-screen experience on Android and iOS when added to home screen.
- **Mobile Bottom Navigation:** Thumb-friendly quick bar (Admin / Team / 8h Tracker / Exit).
- **Service Worker:** Offline caching for fast page loading and low latency.
- **Dark & Light Mode:** Built-in theme switcher with smooth transitions.

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js, JSON-based persistent ACID database, JWT authentication, bcryptjs.
- **Frontend:** HTML5, CSS3 Custom Properties Design System, Vanilla ES Modules, Lucide Icons, SVG circular gauges.
- **Mobile:** Progressive Web App (PWA) with Web App Manifest and Service Worker.
