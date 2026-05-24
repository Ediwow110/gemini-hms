# Client Qualification Questions — Gemini-HMS

Use these questions during initial discovery calls to determine fit and readiness for demo → staging progression.

## Group 1: Current Workflow / System

1. What system do you currently use for patient records and clinical workflow?
2. Do you have a separate laboratory information system (LIS)? Which one?
3. How do you manage pharmacy dispensing today — integrated or separate?
4. Do you currently offer a patient portal? How do patients get lab results?
5. How do you handle corrections or amendments to clinical records?

## Group 2: Number of Branches / Users

6. How many physical locations (branches, clinics) do you operate?
7. How many active clinical staff (doctors, nurses, lab techs, pharmacists)?
8. How many administrative staff need system access?
9. Do you need role-specific views (doctor vs. nurse vs. admin vs. patient)?

## Group 3: Clinical / Lab / Pharmacy Needs

10. Which clinical modules are your top priority? (Vitals, Triage, SOAP, Lab, Pharmacy, All?)
11. Do you need multi-stage lab result validation (encoded → validated → released)?
12. How many lab tests / pharmacy prescriptions do you handle per day?
13. Do you require pharmacist-only dispensing authorization?

## Group 4: Billing / Inventory Needs

14. Do you need integrated inventory management for pharmacy stock?
15. What is your current billing workflow? (We should clarify that billing has limitations — see known-limitations.)
16. Do you require insurance claim submission or clearinghouse integration? (Note: not available.)

## Group 5: Compliance / Security Expectations

17. Are you currently HIPAA-compliant in your paper/software workflows?
18. Do you require formal HIPAA or SOC2 certification documentation from vendors?
19. Do you need a Business Associate Agreement (BAA) before evaluation?
20. Are there specific data residency or local regulatory requirements?

## Group 6: Data Migration Expectations

21. Do you expect to migrate existing patient data into a new system?
22. If yes, what format is your current data in? (PDF, CSV, proprietary EHR export, paper?)
23. What is the approximate volume of historical records?

## Group 7: Budget and Timeline

24. Do you have an allocated budget for software and infrastructure improvements this year?
25. Would you be able to fund a small cloud staging environment (~$50–150/month)?
26. What is your desired timeline for going live with a new system?

## Group 8: Cloud / Account Ownership

27. Does your organization have an existing Google Cloud or AWS account?
28. Do you have IT staff who can manage cloud IAM and infrastructure?
29. Are you willing to grant IAM roles for deployment (Service Usage Admin, Compute Admin, Cloud SQL Admin)?

## Group 9: Decision Process

30. Who is the primary decision-maker for this evaluation?
31. Who else needs to be involved in the decision? (IT, Compliance, Operations, Finance?)
32. What is your purchasing process? (PO, procurement review, board approval?)
33. Do you have a preferred timeline for making a decision?

## Group 10: Required Integrations

34. Which external systems must Gemini-HMS connect to? (Lab machines, EHRs, billing, etc.)
35. Do you need eRx (electronic prescribing)? (Note: not available beyond stubs.)
36. Do you need insurance eligibility verification? (Note: not available.)
37. Are you willing to adapt workflows to Gemini-HMS capabilities, or must it match your current process exactly?

## Decision Criteria

| Answer Pattern | Signal | Action |
| :--- | :--- | :--- |
| Has cloud account, IT staff, budget, and top-3 module needs match. | **High Fit** | Proceed to demo → staging proposal. |
| Has budget and need but no cloud account or IT staff. | **Medium Fit** | Offer Option B (vendor-managed staging). |
| Needs immediate production, HIPAA cert pre-demo, or eRx. | **Disqualified** | Stop. Do not proceed. |
| Unclear budget, no decision process mapped. | **Park** | Revisit in 3 months. |
| All needs align but timeline > 6 months. | **Nurture** | Add to nurture cadence. |

---

**Note**: These questions are a guide, not a script. Adapt language to the conversation. Do not interrogate — listen and learn.
