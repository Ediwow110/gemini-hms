# Phase 21: Batch 1 Research Rules

Establishing the ethical and technical boundaries for the first prospect research sprint.

## 1. Target Scope
- **Geography**: Southeast Asia (Philippines, Vietnam, Indonesia).
- **Facility Type**: Multi-branch Specialized Clinics (e.g., Eye Centers, Dermatology Chains, Large Dental Groups).
- **Batch Size**: 10 Prospects.
- **Goal**: Identify organizations with complex workflow needs (Clinical + Lab/Pharmacy) who are likely to value a "Local Green" hardened baseline.

## 2. Allowed Source Types
- **Official Website**: The organization’s primary domain and public "Contact Us" or "Branches" pages.
- **Public Directories**: Government-registered clinic listings or healthcare association directories.
- **Official LinkedIn**: The organization's company page (for headcount and facility count).
- **Public News/PR**: Announcements regarding expansion, digital transformation, or branch openings.

## 3. Forbidden Sources
- **Scraped Data**: No use of automated tools to harvest personal contact details.
- **Personal Profiles**: Do not collect data from individual LinkedIn/Social profiles of employees.
- **Purchased Lists**: No use of third-party lead databases or "ZoomInfo" style contact lists.
- **Patient Data**: Never record patient reviews, testimonials containing health info, or any PHI.

## 4. Data Minimization (The Only Allowed Fields)
- `Organization Name`: Legal or brand name.
- `Public Website`: Main URL.
- `Facility Type`: Specialty/Category.
- `Branch Count`: Evidence of multi-branch complexity.
- `Public Contact`: Official info@, admin@, or web contact form link.
- `Target Role`: The generic role (e.g., Medical Director, IT Head) we intend to message.

## 5. Stop Rules
- **No Public Contact**: If an organization has no public contact channel, **DISQUALIFY**.
- **Private Data Leak**: If a team member accidentally finds private contact info, **PURGE** it immediately; do not add to tracker.
- **PHI Presence**: If a source contains patient identifiers, **EXIT** that source and mark as unusable.
