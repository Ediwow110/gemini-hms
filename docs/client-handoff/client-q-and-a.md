# Gemini-HMS Client Q&A / Objection Handling

## Q1: Is the system production-ready?
**Answer**: Gemini-HMS is currently in a "Local Green" verified state. The core logic, security hardening, and clinical workflows are complete and passing 1000+ tests. To reach production status, we require a final phase of cloud-based validation, which includes load testing and a formal 3rd-party security audit.

## Q2: Is it HIPAA or SOC2 certified?
**Answer**: Certification is a legal/operational process that requires an audit of a live, running environment. Gemini-HMS is *designed* for HIPAA and SOC2 compliance (using httpOnly cookies, forensic audit trails, and strict data isolation), but we cannot claim formal certification until the final deployment is audited by an authorized body.

## Q3: Can we use real patient data during the demo?
**Answer**: No. We strictly use synthetic/demo data for all demonstrations to ensure privacy and security. The demo environment is not yet cleared for real Protected Health Information (PHI).

## Q4: What is needed to deploy this to our clinic?
**Answer**: Deployment requires a provisioned cloud environment (such as Google Cloud or AWS). We need 1x VM for the application runtime and 1x Cloud SQL instance for the database. Once infrastructure is provisioned, we can perform the final deployment hardening.

## Q5: How much will the cloud infrastructure cost?
**Answer**: For a staging environment, costs are typically between $50–$150 USD per month. Production costs scale based on patient volume and data retention requirements.

## Q6: Can we run this on our own existing cloud account?
**Answer**: Yes. Gemini-HMS is Dockerized and can be deployed to any major cloud provider or on-premise hardware that supports containerized workloads and PostgreSQL.

## Q7: How do you handle security breaches?
**Answer**: We use forensic audit logging with HMAC-SHA256 signing. This means even if a breach occurs, we have an immutable trail of every data access or modification. Our httpOnly cookie and CSRF protections significantly reduce the attack surface for session hijacking.

## Q8: What happens after we approve the demo?
**Answer**: We move to Phase 21: Staging Deployment. This involves provisioning your cloud resources, applying the security baseline, and performing "Smoke Tests" to verify the system works at scale before any real patient data is introduced.

## Q9: Can this be customized for our specific laboratory tests?
**Answer**: Yes. The system includes a flexible Lab Information System (LIS) where you can define custom test parameters, reference ranges, and validation logic via our administrative interface.
