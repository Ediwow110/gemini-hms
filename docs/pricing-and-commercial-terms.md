# Pricing & Commercial Terms — Pilot Onboarding Plan

This document outlines the pricing model, GTM commercial terms, pilot-to-paid transition parameters, and support SLA agreements designed for the first 1–3 clinics onboarding onto Gemini-HMS.

---

## 1. Operational Constraints & Value Anchors

To sustain high service quality and ensure commercial success as a dedicated solo founder, we anchor the product's value in critical operational savings rather than behaving like a "cheap SaaS" utility.

### Operational Constraints (Solo-Founder Reality)
*   **Support Footprint**: Business-hours dedicated coverage (08:00 AM – 06:00 PM) to align with clinic hours. No overnight 24/7 call centers.
*   **Deployment Footprint**: Single-tenant isolated servers per clinic (guarantees performance and data isolation, but carries higher compute costs per tenant than shared SaaS).
*   **Customization Boundaries**: Strict caps on custom coding or major integrations in the early phases.

### Clinic Value Anchors (Business Impact)
*   **Zero-Variance Billing Security**: Immutable audit log ledger and cashier session locks prevent leakage, double-charging, or employee financial discrepancies (saves the clinic ₱5,000–₱15,000 monthly in undetected cash errors).
*   **Dedicated Single-Tenant Privacy**: Peace of mind knowing their clinical records are physically isolated from other businesses, resolving local healthcare privacy (Data Privacy Act of 2012) compliance audits.
*   **Direct-to-Engineer SLA**: Unlike legacy software, the clinic deals directly with the author of the code, resulting in instant bug resolution rather than weeks of ticket queues.

---

## 2. Pricing Models (Philippine Peso - PHP)

We offer two simple, value-anchored pricing models structured to support sustainable, dedicated single-tenant operations.

### Option A: Flat Per-Branch Plan
Ideal for single-location diagnostic clinics or independent medical centers.

*   **Monthly Subscription Fee**: **₱15,000 PHP per branch/month** (billed monthly).
*   **Staff User Limit**: Up to 15 concurrent staff users.
*   **Usage Cap**: Up to 350 patient orders per day.
*   **Included Services**:
    *   Dedicated virtual private server (AWS EC2) and private Postgres DB.
    *   Patients, Queueing, Orders, Lab, and Billing/Cashier modules.
    *   Automated daily snapshots and hourly transaction logs stored in a secure S3 vault.
    *   Standard updates and security patches.
    *   Business-hours on-call support SLA (08:00 AM – 06:00 PM).

### Option B: Multi-Branch Bundle
Ideal for growing clinic chains seeking centralized billing and reporting.

*   **Monthly Subscription Fee**: **₱25,000 PHP/month** for a 2-branch bundle (billed monthly).
*   **Staff User Limit**: Up to 30 concurrent staff users total.
*   **Usage Cap**: Up to 600 patient orders per day combined.
*   **Included Services**: Same as Option A, plus cross-branch patient lookup and centralized management views.

---

## 3. Pilot-to-Paid Transition Terms

To make the onboarding process completely frictionless and risk-free for the clinic owner, we enforce clear, gated transition terms:

1.  **30-Day Free Pilot**: The first 30 days are completely free. We will configure your server and database, import your initial catalogs, train your staff, and run the sandbox and shadow phases at no cost.
2.  **Paid Subscription Sign-Off**: Billing commences on **Day 31**. On Day 25, we will present a 30-day operational review. If your clinic manager signs off that the software has met the operational guidelines, we transition to the paid subscription.
3.  **Minimum Term Commitment**: To protect our single-tenant infrastructure setup investment, we require a **6-month minimum subscription term** upon transition to the paid phase, billed on a month-to-month basis.
4.  **Assisted Offboarding Guarantee**: If at any point during the 30-day pilot (or thereafter) you choose to cancel, we guarantee **zero data lock-in**. We will extract and package 100% of your database records into standard, readable Excel/CSV files and assist your IT team in transitioning back to your previous system with zero downtime.

---

## 4. Support & SLA Commitments (Plain Language)

We believe in operational honesty. Since this service is managed by a single principal engineer, we commit only to what we can reliably sustain:

*   **Standard Support Hours**: **08:00 AM to 06:00 PM (Monday to Saturday)**.
*   **Critical Severity (SEV-1) Response SLA**: **Within 15 minutes** during support hours. A critical issue is defined as the system being completely offline, cashiers unable to collect payments, or doctors unable to input orders.
*   **Non-Critical Response SLA**: **Within 4 hours** during support hours. This includes minor UI glitches, report formatting updates, or user creation requests.
*   **Disaster Recovery Guarantee**: In the event of a catastrophic server hardware failure, we guarantee a **Recovery Time Objective (RTO) of 2 hours** or less from our offline S3 secure vault backups, with a maximum possible data loss (**Recovery Point Objective / RPO**) of **1 hour** of transactions.

---

## 5. Explicit Out-of-Scope Items

To prevent scope creep and protect our focus on core software reliability, the following items are **strictly excluded** from the subscription and will require separate custom integration contracts if needed:

*   **PhilHealth / National Insurance Clearing System Integration**: We do not integrate directly with national insurance platforms in the baseline version.
*   **Legacy Data Cleansing**: We import clean catalogs (staff rosters, test lists, price points) via Excel/CSV templates. We do *not* clean corrupted, duplicate, or unformatted legacy databases.
*   **Third-Party Lab Device Direct API Integration**: Lab result entry is manually encoded and locked by your medical technologists. Automated hardware analyzer integrations are out-of-scope.
*   **24/7 Phone Support**: Support phone calls outside of 08:00 AM – 06:00 PM are strictly best-effort.
*   **On-Site IT Network Maintenance**: We manage the cloud application and database server. The clinic's local physical internet, router configurations, and desktop computer hardware are the responsibility of the clinic’s local IT provider.

---

## 6. Commercial Proposal Template (Email-Ready)

This template is formatted and ready to be customized and sent to the clinic owner:

***

**Subject: Commercial Proposal: Operational Modernization & Hardening — [Clinic Name]**

Dear [Clinic Owner Name],

Thank you for your interest in Gemini-HMS. Following our recent discussion regarding Metro Health Diagnostic Center’s operational scaling, I am pleased to present our official commercial proposal for a secure, single-tenant deployment of Gemini-HMS.

### 1. The Operational Package & Pricing
We propose our **Flat Per-Branch Plan** deployed on a dedicated, isolated server:
*   **Monthly Subscription Fee**: **₱15,000 PHP per branch/month** (billed monthly).
*   **In-Scope Modules**: Patients, Queueing, Orders, Laboratory, and Billing/Cashier register.
*   **Included Limits**: Up to 15 concurrent staff users and up to 350 orders/day.
*   **Infrastructure**: Dedicated virtual private server, automated 4-hour database snapshots, and hourly transaction backups stored in a secure Amazon S3 vault.

### 2. 30-Day Risk-Free Pilot Terms
To prove the platform’s security and value to your team, we invite you to participate in our gated onboarding pilot:
*   **First 30 Days Free**: We deploy your server, load your catalogs, train your staff, and validate transaction totals at no software cost.
*   **Billing Commencement**: Day 31 (subject to your clinic manager signing off on system reliability at the end of Week 4).
*   **Contract Commitment**: 6-month minimum term upon paid transition, billed monthly.
*   **Offboarding Guarantee**: If you choose not to proceed, I will personally export 100% of your records into standard CSV/Excel format and assist your team in reverting back to your legacy system with zero data loss and zero downtime.

### 3. Support SLA Commitments
*   **Active Support Hours**: Monday to Saturday, 08:00 AM – 06:00 PM.
*   **Critical Severity Response SLA**: **Within 15 minutes** (system down or payment billing blocked).
*   **Catastrophic Restore SLA**: In a hardware crash, we guarantee to restore your server in **under 2 hours** with at most **1 hour** of transaction data loss.

### 4. Scope Boundaries
To maintain core stability, direct integrations with legacy hardware analyzers, PhilHealth clearing systems, legacy data cleansing services, and on-site local desktop IT network support are out-of-scope for the standard subscription.

Please let me know if these terms align with your operational timeline, and I will prepare the lightweight service agreement so we can begin Week 1 Setup.

Best regards,  
**[Your Name]**  
Founder & Principal Engineer, Gemini-HMS  
[Your Contact Details]
***
