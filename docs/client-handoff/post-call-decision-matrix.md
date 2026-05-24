# Post-Call Decision Matrix — Gemini-HMS

Use this matrix after every discovery call, demo, or follow-up to determine the next step.

## Possible Outcomes

| Outcome | When to Use | Next Action |
| :--- | :--- | :--- |
| **Proceed to Demo** | Discovery call confirmed fit. Prospect interested, no disqualifying signals. | Schedule demo using `demo-scheduling-checklist.md`. |
| **Proceed to Staging Proposal** | Demo completed. Prospect engaged. Budget and staging willingness confirmed. | Send staging proposal using `staging-proposal-checklist.md`. |
| **Need Technical Deep Dive** | Prospect wants architecture, security, or integration details before committing. | Schedule dedicated technical call. Share `security-privacy-posture.md` and `technical-architecture.md` in advance. |
| **Need Compliance / Legal Review** | Prospect requires HIPAA/SOC2 documentation, BAA, or data processing agreement. | Share `security-privacy-posture.md`. Explain certification timeline (post-staging, not pre-demo). If they insist on certification proof before demo, mark as "Not a Fit." |
| **Not a Fit** | Disqualifying signal present: needs production immediately, HIPAA cert pre-demo, no budget for staging, needs eRx/clearinghouse. | Close politely. Do not re-contact. |
| **Park for Later** | Prospect interested but timeline > 6 months, or budget not yet allocated. | Set follow-up reminder in 3 months. Add to nurture cadence. |

## Decision Criteria Reference

| Criterion | Proceed to Demo | Proceed to Staging | Need Deep Dive | Not a Fit | Park |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Budget available** | Not yet confirmed | Yes | Not yet confirmed | No | Not yet decided |
| **Urgency (need within 3 months)** | Yes | Yes | Yes | N/A | No |
| **Workflow fit matches top-3 modules** | Yes | Confirmed | Needs validation | No | Possibly |
| **Willing to fund staging** | Not yet confirmed | Yes | Not yet confirmed | No | Not yet decided |
| **Compliance needs match Gemini-HMS stage** | Understands Local Green | Understands Local Green | Needs details | Demands cert pre-demo | Not yet discussed |
| **Integration demands within scope** | Likely | Confirmed | Needs validation | Out of scope (eRx, clearinghouse) | Unknown |
| **Cloud account / IT capability** | Not yet confirmed | Likely | Not yet confirmed | No | Unknown |

## Decision Flow

```
Discovery Call
  ├─ Fit clear, engaged ──────► Proceed to Demo
  ├─ Needs more info ─────────► Need Technical Deep Dive
  ├─ Compliance concerns ─────► Need Compliance/Legal Review
  ├─ Budget/timing long ──────► Park for Later
  └─ Disqualifying signal ────► Not a Fit

Demo
  ├─ Engaged, budget ready ───► Proceed to Staging Proposal
  ├─ Needs more info ─────────► Need Technical Deep Dive
  ├─ Not convinced ───────────► Park for Later / Not a Fit
  └─ Disqualified ────────────► Not a Fit
```

---

**Owner**: Sales Lead
**Last Updated**: 2026-05-24
