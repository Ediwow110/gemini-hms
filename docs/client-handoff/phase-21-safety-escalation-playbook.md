# Phase 21: Safety Escalation Playbook

Establishing the internal protocol for high-risk client inquiries and operational errors.

## 1. Real Patient Data Request
- **Scenario**: Prospect asks to upload their own database for a "trial."
- **Immediate Response**: "We strictly demo with synthetic data to maintain privacy. Local verification is limited to non-PHI scenarios."
- **Do NOT say**: "We'll try to find a way" or "You can do it at your own risk."
- **Owner**: Cybersecurity Lead.
- **Stop Condition**: Do not proceed with demo if they insist on real PHI.

## 2. HIPAA / SOC2 Certificate Request
- **Scenario**: Prospect asks to see our official audit report.
- **Immediate Response**: "We are architected for compliance; formal certification is a future milestone in the cloud-staging phase."
- **Do NOT say**: "We are already certified" or "Audit is done."
- **Owner**: Compliance Lead.
- **Required Doc**: `security-privacy-posture.md`.

## 3. Production Go-Live Pressure
- **Scenario**: Prospect wants to use the system for real patients immediately.
- **Immediate Response**: "We require a staging validation phase first to ensure system reliability at your specific scale."
- **Do NOT say**: "You can go live tomorrow."
- **Owner**: Product Lead.

## 4. Source Code / Security Evidence Request
- **Scenario**: Technical lead asks for deep implementation details or code access.
- **Immediate Response**: "We can share our technical architecture summary and security verifier logs. Deep source review is available for vetted technical partners."
- **Owner**: Backend Engineering / Cybersecurity.

## 5. Privacy Concern / Operator Error
- **Scenario**: Operator accidentally sees real patient data or a secret is exposed.
- **Immediate Response**: Terminate screen share immediately. Record the incident.
- **Do NOT say**: "Oops, ignore that."
- **Owner**: Cybersecurity Lead.
- **Required Doc**: Incident report in `demo-risk-register.md`.

## 6. Procurement / Legal Review
- **Scenario**: Prospect asks for a BAA or Master Service Agreement.
- **Immediate Response**: "I am escalating this to our project owners for legal review."
- **Owner**: Project Owner / Legal.
