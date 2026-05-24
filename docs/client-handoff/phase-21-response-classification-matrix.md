# Phase 21: Outreach Response Classification Matrix

Use this matrix to classify every incoming response from prospective clients and determine the appropriate, truthful action path.

| Category | Meaning | Allowed Response | Forbidden Response | Next Action | Owner |
|----------|---------|------------------|--------------------|-------------|-------|
| **Interested** | Wants to learn more. | Schedule discovery call. | Promise specific go-live dates. | Discovery Call | Sales Ops |
| **Demo Requested** | Asks for live walkthrough. | Run no-PHI preflight; book demo. | Use real patient data in demo. | Preflight -> Demo | Demo Operator |
| **Staging Discussion**| Serious intent to validate. | Share Phase 21 Staging Trigger Plan. | Start deployment without funding. | Trigger Review | DevOps Lead |
| **Production Request**| Wants to buy/use now. | Redirect to Staging validation path. | Claim "Production Ready" baseline. | Education | Product Lead |
| **Compliance/HIPAA** | Asks for certification. | "Designed for compliance; audit pending." | Claim "HIPAA/SOC2 Certified." | Share Posture Doc | Compliance |
| **Real Data Request** | Wants to test own data. | Reject; explain synthetic demo policy. | Accept or store real PHI. | Escalation | Cybersecurity |
| **Pricing Question** | Asks for system cost. | Discuss staging infrastructure budget. | Quote final production pricing. | Budget Intro | Sales Ops |
| **Integration** | Asks for legacy sync. | Acknowledge; park for tech discovery. | Promise "custom sync" timeline. | Tech Discovery | Backend Eng |
| **Not Interested** | Negative response. | Acknowledge once; stop outreach. | Persist or argue. | Mark "Nurture" | Sales Ops |
| **Opt-Out** | "Do not contact" / "Unsubscribe".| Immediate confirmation; STOP contact. | Any further marketing/sales. | Mark "DO NOT CONTACT"| CRM Admin |
| **Security Concern** | Reports a bug or vulnerability. | "Thank you; escalating to security team."| Ignore or dismiss. | Escalate | Cybersecurity |
| **Legal/Procurement** | Asks for BAA or contract. | Escalate to legal review. | Sign unreviewed BAAs. | Escalate | Legal/Owner |

## classification Rules
1. **Truth First**: If a prospect's assumption is wrong (e.g., they think we are certified), you MUST correct it in the first response.
2. **Privacy First**: Never ask for or accept real patient data files via email or chat.
3. **Fail Closed**: If a response is ambiguous or high-risk, escalate to the owner before replying.
