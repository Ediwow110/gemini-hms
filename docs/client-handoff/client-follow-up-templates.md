# Client Follow-Up Templates

## 1. Post-Demo Thank You (General)
**Subject**: Follow-up: Gemini-HMS Demo & Next Steps

Hi [Name],

Thank you for the opportunity to show you Gemini-HMS today. It was great to discuss how our integrated lab and pharmacy workflows can solve [Pain Point Identified].

As discussed, we are currently in our "Local Green" phase, with 1000+ verified checks. To move forward, we suggest transitioning to a dedicated **Staging Environment** to validate the system on your cloud infrastructure.

I've attached our **Product Overview** and **Technical Architecture** summary for your team's review.

Best regards,
[Name]

---

## 2. Staging Proposal (Technical/Admin)
**Subject**: Proposal: Phase 21 Staging Deployment for [Clinic Name]

Hi [Name],

Based on our demo, we are ready to proceed to the **Staging Deployment Phase**. This will move the Gemini-HMS baseline from our local verified environment to your dedicated [GCP/AWS] cloud.

**Phase 21 Scope**:
- Provisioning Staging VM and Cloud SQL.
- Applying security hardening baseline.
- Live "Smoke Tests" and baseline load testing.
- Verification using your custom Lab/Pharmacy catalogs.

This phase requires a monthly cloud budget of approximately $[50-150]. Please let us know if you'd like to proceed with the IAM access setup.

---

## 3. Security/Compliance Follow-up
**Subject**: Technical Deep-Dive: Gemini-HMS Security & Audit Integrity

Hi [Name],

Per our conversation regarding HIPAA/SOC2 alignment, I wanted to share our **Security & Privacy Posture** document. 

Key highlights:
- Forensic HMAC-SHA256 audit signing.
- httpOnly cookie session management.
- Strict 13-mutation clinical allowlist.

We look forward to performing a formal 3rd-party audit once the system is live in your staging environment.
