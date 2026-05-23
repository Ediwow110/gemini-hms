# Gemini-HMS Product Overview

## What Gemini-HMS is
Gemini-HMS is a modern, security-hardened Hospital Management System designed for multi-tenant, multi-branch healthcare environments. It provides a comprehensive suite of modules for clinical workflows, patient management, laboratory operations, pharmacy dispensing, and administrative governance.

## Who it is for
- Small to large clinic networks.
- Multi-branch hospitals.
- Diagnostic and laboratory centers.
- Healthcare administrators requiring strict audit trails and role-based access control.

## Core Modules
- **Clinical EMR**: Vitals, Triage, and SOAP notes.
- **Laboratory Information System (LIS)**: Test encoding, validation, and release workflows.
- **Pharmacy Hub**: Prescription queue management and atomic inventory dispensing.
- **Patient Portal**: Self-service access for patients to view medical records and lab results.
- **Billing & Finance**: Concurrency-protected refund and void management.
- **Administrative Governance**: Granular RBAC, tenant isolation, and forensic audit logging.

## Business Value
- **Security-First Design**: Built with modern security patterns (httpOnly cookies, double-submit CSRF, forensic audit trails).
- **Process Integrity**: Clinical and financial workflows are guarded by strict verifiers and optimistic locking to prevent data corruption.
- **Scalability**: Multi-tenant architecture allows for rapid onboarding of new branches and clinics.
- **Transparency**: Every sensitive action is signed and hashed in an immutable audit chain.

## Current Verified Status
Gemini-HMS is currently in a **"Local Green"** baseline. 
- **CI-green main branch**: All automated tests (1000+) and security verifiers pass.
- **Demo-ready with synthetic data**: The system is fully functional for demonstration using synthetic datasets.
- **Hardened Baseline**: Core security and clinical guardrails are implemented and verified.

## What is Demo-Ready
- Staff and Patient login flows.
- Complete Clinical EMR lifecycle (Triage -> SOAP -> Orders).
- Lab result encoding and multi-stage approval.
- Pharmacy dispensing and inventory integration.
- Role-based navigation and portal isolation.

## What is NOT yet Production-Ready
- **Not yet production deployed**: The system is currently validated in local and CI environments.
- **Not certified until formal compliance audit**: While designed with HIPAA and SOC2 principles, formal certification requires a live production environment audit.
- **Requires client-funded staging**: Real-world load testing and final infrastructure hardening require a provisioned cloud environment.

## Deployment Roadmap
To move from demo to live operations, a client-funded staging environment is required to perform:
1. Cloud infrastructure provisioning (GCP/AWS).
2. Production-grade secret management.
3. Formal backup/restore drills.
4. Final compliance legal review.
