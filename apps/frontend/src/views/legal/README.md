# Obsrvr Legal Architecture

This directory contains the legal baseline architecture for all Obsrvr products.

## Overview

Obsrvr uses a **Master Terms + Product Addenda** approach to legal documentation. This provides:

- Consistency across all Obsrvr products
- Faster product launches (reuse master terms)
- Easier enterprise review (single master agreement)
- Clear separation of concerns (global vs. product-specific)

## Document Hierarchy

When documents conflict, the following order applies (highest to lowest):

1. **Obsrvr Master Terms of Service** - Global rules for all Obsrvr services
2. **Product-Specific Addenda** - Additional terms for individual products
3. **Service Level Agreements** - Performance guarantees (if applicable)
4. **Order Forms / SOWs** - Specific service engagements
5. **Privacy Policy** - Data handling practices (applies globally)

## Current Documents

### Core Documents

- **`ObsrvrMasterTerms.vue`** - Master Terms of Service v1.0
  - Applies to: All Obsrvr services
  - Covers: Legal identity, acceptable use, IP, disclaimers, liability, governing law
  - Governing Law: **Ohio, United States**
  - Arbitration: **American Arbitration Association (AAA)**
  - Liability Cap: **Conservative (12 months of fees or $100)**

- **`PrivacyPolicy.vue`** - Unified Privacy Policy
  - Applies to: All Obsrvr services
  - GDPR & CCPA compliant
  - Includes data stewardship philosophy
  - Covers encryption specifics (sodium-native)

### Product Addenda

- **`RadarProductAddendum.vue`** - Radar-Specific Terms v1.0
  - Applies to: Obsrvr Radar service only
  - Focus: Observability disclaimers, no operational reliance, notification services
  - Key Points:
    - Radar is observational, not authoritative
    - No uptime guarantees (unless separate SLA)
    - Email notifications are best-effort
    - Separate terms for validator hosting services

## Adding a New Product

When launching a new Obsrvr product (e.g., Gateway, Nodes, Flow), follow this process:

### 1. Create Product Addendum

Create a new file: `[ProductName]ProductAddendum.vue`

**Template Structure:**
```vue
<template>
  <div class="legal-content">
    <section>
      <h2>Obsrvr [Product] – Product Addendum</h2>
      <p class="text-muted">Version 1.0 | Effective: [DATE]</p>

      <div class="alert alert-info mt-3">
        <strong>Note:</strong> This Product Addendum supplements the Obsrvr Master
        Terms of Service. In case of conflict, the Master Terms control unless
        explicitly stated otherwise below.
      </div>
    </section>

    <!-- Product-specific sections -->
    <section>
      <h3>1. Service Description</h3>
      <!-- What does this product do? -->
    </section>

    <section>
      <h3>2. Service Levels and Availability</h3>
      <!-- Uptime guarantees, if any -->
    </section>

    <section>
      <h3>3. Data and Liability</h3>
      <!-- Product-specific disclaimers -->
    </section>

    <!-- Additional product-specific sections as needed -->
  </div>
</template>
```

### 2. Focus on Product-Specific Terms

**Include:**
- Service description and intended use
- Product-specific disclaimers
- Unique features or limitations
- Pricing or metering (if applicable)
- SLA references (if applicable)

**Do NOT duplicate:**
- Acceptable use policies (already in Master Terms)
- General liability limitations (already in Master Terms)
- Governing law or arbitration (already in Master Terms)
- Privacy practices (in Privacy Policy)

### 3. Create Product ToS Container

Create a view file for the combined terms:

```vue
<!-- src/views/[Product]TermsOfService.vue -->
<template>
  <div class="container mt-4 mb-5">
    <div class="card">
      <div class="card-header">
        <h1>[Product Name] Terms of Service</h1>
        <p class="text-muted mb-0">Effective: [DATE]</p>
      </div>
      <div class="card-body">
        <ObsrvrMasterTerms />
        <div class="section-divider my-5">
          <hr class="thick-divider" />
          <p class="text-center text-muted my-3">
            <strong>End of Master Terms | Beginning of [Product] Addendum</strong>
          </p>
          <hr class="thick-divider" />
        </div>
        <[Product]ProductAddendum />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ObsrvrMasterTerms from './legal/ObsrvrMasterTerms.vue';
import [Product]ProductAddendum from './legal/[Product]ProductAddendum.vue';
</script>
```

### 4. Add Router Configuration

Add routes in `router.ts`:

```typescript
{
  name: "[product]-terms",
  path: "/[product]/terms",
  component: () => import("@/views/[Product]TermsOfService.vue"),
}
```

## Product-Specific Guidance

### For Observability Products (like Radar)

**Key clauses to include:**
- "Informational purposes only" disclaimers
- "No operational reliance" warnings
- Data accuracy limitations
- Best-effort delivery language
- No uptime guarantees (unless SLA exists)

**Example (from Radar):**
> "Radar is an observability and decision-support tool, not an operational control system."

### For Infrastructure Services (like Nodes, Gateway)

**Key clauses to include:**
- Service scope definition
- Shared responsibility model
- Dependency disclaimers (cloud providers, networks)
- Explicit SLA reference (if applicable)
- Metering and billing terms

**Example structure:**
> "Obsrvr is responsible for: [list]
> You are responsible for: [list]
> Neither party is responsible for: [list]"

### For Data Pipeline Tools (like Flow)

**Key clauses to include:**
- Pipeline correctness disclaimers
- Data loss boundaries
- Third-party integration disclaimers
- Open-source vs. managed service distinction
- Idempotency expectations

## When to Update Master Terms

**Update Master Terms when:**
- Adding new global acceptable use rules
- Changing governing law or arbitration provider
- Modifying liability caps
- Adding new universal disclaimers

**Version incrementing:**
- Minor changes (clarifications): increment patch (1.0 → 1.0.1)
- New sections: increment minor (1.0 → 1.1)
- Major restructuring: increment major (1.0 → 2.0)

**Always provide 30 days notice for material changes.**

## Enterprise Customers

For enterprise customers with custom agreements:

1. Master Terms still apply as baseline
2. Enterprise Order Form can modify specific sections
3. Clearly mark any overrides: "Notwithstanding Section X of Master Terms..."
4. Never weaken liability protections without legal review

## Compliance Notes

### GDPR (EU Customers)
- Privacy Policy covers all requirements
- DPA (Data Processing Addendum) may be needed for enterprise customers
- Standard Contractual Clauses (SCCs) are referenced for international transfers

### CCPA (California Customers)
- Privacy Policy includes California-specific rights
- No selling of personal data (explicitly stated)
- Deletion rights clearly explained

### Export Control
- Section 10.6 of Master Terms covers export compliance
- Update if Obsrvr expands to restricted countries

## Legal Review Checklist

Before finalizing any product addendum:

- [ ] Does NOT contradict Master Terms
- [ ] Clearly states which product it applies to
- [ ] Includes effective date and version number
- [ ] References Master Terms and document hierarchy
- [ ] Reviewed by legal counsel (recommended)
- [ ] No over-promises on availability or accuracy
- [ ] Liability disclaimers are clear but not reckless
- [ ] Product-specific risks are addressed
- [ ] SLA references are correct (if applicable)
- [ ] Contact information is up to date

## Version Control

| Document | Version | Date | Changes |
|----------|---------|------|---------|
| Master Terms | 1.0 | 2025-12-29 | Initial release |
| Privacy Policy | 1.0 | 2025-12-29 | Initial release, GDPR/CCPA compliant |
| Radar Addendum | 1.0 | 2025-12-29 | Initial release |

## Future Product Addenda (Planned)

- **Gateway Addendum** - API access, rate limiting, metering
- **Nodes Addendum** - Validator hosting, SLA commitments
- **Flow Addendum** - Data pipelines, third-party integrations

## Contact

Legal questions: hello@withobsrvr.com
Subject: "Legal Architecture - [Your Question]"

---

**Important:** This architecture is designed for consistency and scalability. Before making changes that affect multiple products, consult this document and consider the downstream impact.
