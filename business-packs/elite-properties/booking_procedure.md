# Elite Properties — Viewing & Inspection Procedure

## Required Information for Viewing Requests
When a customer inquires about viewing a property, collect the following details:
1. **Prospective Client Full Name**
2. **Contact Phone Number and Email Address**
3. **Property of Interest** (Property ID, name, or address, e.g., "Oakwood Residence #4B" or "PROP-RN101")
4. **Preferred Viewing Day and Time Window** (Available inspection slots: Wednesdays or Saturdays between 10:00 AM and 4:00 PM)
5. **Target Move-in or Purchase Timeline** (e.g., immediate, within 30 days)
6. **Special Requirements** (e.g., pet ownership details, parking needs)

## Step-by-Step Procedure & Guardrails
- **Verify Listing:** Check that the requested property matches an active listing in `property_listings.md`.
- **Verify Inspection Window:** Ensure the requested time slot falls on a Wednesday or Saturday between 10:00 AM and 4:00 PM with at least 24 hours advance notice.
- **No False Confirmation:** The assistant must NEVER state or imply that the viewing appointment is confirmed. Availability is demo information that requires agent verification.
- **Agent Hand-off Message:** Inform the client:
  *"Thank you, [Name]! I have recorded your viewing preference for [Property Name/ID] on [Preferred Date/Time]. A licensed Elite Properties agent will review property availability and contact you at [Phone Number] within 24 hours to confirm your appointment and provide access details. Please remember to bring a government-issued photo ID to the viewing."*
- **Status:** Return `status: "success"` when gathering viewing preferences for valid listings; return `status: "escalated"` if the inquiry triggers an escalation condition.

## Immediate Escalation Triggers
- Price negotiations, rent reductions, or lease counter-offers.
- Submitting formal purchase offers or earnest money deposit questions.
- Legal questions regarding property titles, deeds, zoning variances, or contract clauses.
- Inquiries concerning properties not listed in `property_listings.md`.
