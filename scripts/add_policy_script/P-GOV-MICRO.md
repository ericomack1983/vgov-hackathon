# ============================================================
# AP POLICY — GOVERNMENT CONTRACTOR MICRO-INVOICES
# Policy ID : P-GOV-MICRO
# Created   : 2026-04-13
# Applies to: sup-001-rfp-001 and similar vendor profiles
# ============================================================


# ── WHAT THIS POLICY COVERS ──────────────────────────────────

This policy governs invoices from government-affiliated or
federal contractor vendors where the invoice amount is under
$50 USD and the invoice description lacks itemized line items,
a purchase order reference, or a clear description of services.

Trigger conditions (ALL must match to apply this policy):
  - Vendor name contains "Federal", "Gov", "Federal Solutions",
    "Government", "Defense", or "Public Sector"
  - Invoice amount is between $0.01 and $50.00 USD
  - No PO reference number present in the invoice body
  - No itemized line items present
  - Vendor has fewer than 3 prior paid invoices on record


# ── DECISION RULE ────────────────────────────────────────────

  DEFAULT ACTION: review_required

  Reason: Government contractor invoices — even micro-amounts —
  carry compliance, regulatory, and audit obligations that
  standard low-value auto-approval does not account for.
  A $13 invoice from a federal contractor may represent:

    1. A nominal fee tied to a larger contract obligation
    2. A test invoice before a large billing cycle begins
    3. A compliance filing fee with legal implications
    4. An error or duplicate from a billing system

  None of these should be auto-approved without a human
  confirming the context.


# ── REQUIRED FIELDS BEFORE APPROVAL ─────────────────────────

  A human reviewer must confirm ALL of the following before
  approving payment:

  [ ] Valid PO reference number from the procurement system
  [ ] Description of services rendered (minimum 1 sentence)
  [ ] Contract number or RFP reference (e.g. RFP-001)
  [ ] Confirmation the vendor is registered in the supplier DB
  [ ] Confirmation no SAM.gov exclusion applies to this vendor
  [ ] Approval from the contract owner or project lead


# ── RISK FLAGS TO CHECK ───────────────────────────────────────

  The AI engine must raise these flags for this invoice type:

  FLAG: GOVERNMENT_CONTRACTOR_UNVERIFIED
    → Vendor name suggests federal affiliation but is not
      registered in the approved government vendor list.

  FLAG: MISSING_CONTRACT_REFERENCE
    → Invoice does not reference a contract number, RFP ID,
      or statement of work. Payment cannot be traced to
      an approved procurement event.

  FLAG: INCOMPLETE_INVOICE
    → Invoice body contains fewer than 3 meaningful fields.
      Minimum required: vendor, amount, description, date.

  FLAG: MICRO_AMOUNT_NEW_VENDOR
    → Very low amounts from new vendors are a known fraud
      vector (testing if payments process before submitting
      larger invoices). Verify vendor identity independently.


# ── BUDGET CODE ───────────────────────────────────────────────

  Suggested: GOV-CONTRACT-MISC
  Only assign after human review confirms the contract context.
  Do not auto-assign for this policy.


# ── ESCALATION PATH ──────────────────────────────────────────

  Step 1 → Procurement officer reviews invoice in inbox
  Step 2 → Confirms vendor registration and contract reference
  Step 3 → Requests missing fields from vendor if needed:

    Reply template to vendor:
    ─────────────────────────────────────────────────────────
    Subject: Additional information required — INV-001-2026

    Dear Apex Federal Solutions,

    Thank you for submitting invoice INV-001-2026.

    Before we can process this payment, please provide:
      1. The contract or RFP reference number this
         invoice relates to (e.g. RFP-001)
      2. A brief description of the services or fees
         covered by this invoice
      3. Your registered SAM.gov UEI number

    Please resubmit with these details included.

    Thank you,
    Procurement Team
    ─────────────────────────────────────────────────────────

  Step 4 → Once vendor responds, re-run through AI engine
  Step 5 → If all fields present and verified → approve


# ── CHROMADB ENTRY (add to seed_chroma.py) ───────────────────

# Copy this block into the POLICIES list in scripts/seed_chroma.py
# then run: python3 scripts/seed_chroma.py --reset

{
    "id": "P-GOV-MICRO",
    "title": "Government contractor micro-invoice review",
    "category": "require_review",
    "threshold_usd": 50,
    "content": (
        "Invoices from vendors with 'Federal', 'Government', 'Defense', or "
        "'Public Sector' in their name where the amount is under $50 USD "
        "and no PO reference or service description is present must be flagged "
        "as review_required. These invoices carry compliance and audit obligations "
        "regardless of the low amount. Required before approval: valid PO reference, "
        "contract or RFP number, SAM.gov vendor verification, and description of "
        "services. Assign budget code GOV-CONTRACT-MISC only after human review. "
        "Risk flags: GOVERNMENT_CONTRACTOR_UNVERIFIED, MISSING_CONTRACT_REFERENCE, "
        "INCOMPLETE_INVOICE, MICRO_AMOUNT_NEW_VENDOR."
    ),
    "keywords": [
        "federal", "government", "defense", "public sector", "contractor",
        "rfp", "contract", "sam.gov", "micro invoice", "nominal fee",
        "apex", "federal solutions", "compliance", "regulatory"
    ],
},


# ── TEST CASE FOR THIS POLICY ────────────────────────────────

# Run this curl to verify the policy works after seeding:

curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "email_id":    "sup-001-rfp-001",
    "vendor_email": "invoices@apexfederalsolutions.com",
    "email_body":  "Invoice INV-001-2026 from Apex Federal Solutions for $13 USD. Invoice from Apex Federal Solutions"
  }'

# Expected response:
# {
#   "decision":          "review_required",
#   "confidence":        75,
#   "vendor":            "Apex Federal Solutions",
#   "amount":            "$13.00",
#   "matched_policies":  ["P-GOV-MICRO", "P-NEW-VENDOR", "P-PO-REQUIRED"],
#   "risk_flags":        [
#                          "GOVERNMENT_CONTRACTOR_UNVERIFIED",
#                          "MISSING_CONTRACT_REFERENCE",
#                          "INCOMPLETE_INVOICE",
#                          "MICRO_AMOUNT_NEW_VENDOR"
#                        ],
#   "reasoning":         "Per policy P-GOV-MICRO, government contractor invoices
#                         require manual review regardless of amount. This invoice
#                         is missing a PO reference, contract number, and service
#                         description. Per P-NEW-VENDOR, this vendor has no prior
#                         payment history. Routed to procurement officer for
#                         verification before any payment is processed."
# }
