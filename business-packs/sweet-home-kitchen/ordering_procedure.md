# Sweet Home Kitchen — Ordering Procedure

## Information to Collect from Customers
When a customer wishes to place a cake or bakery order, collect the following details in order:
1. **Customer Full Name**
2. **Contact Phone Number**
3. **Selected Item & Size** (e.g., 1 kg Belgian Chocolate Truffle Cake)
4. **Desired Pickup or Delivery Date and Time Window**
5. **Delivery Address** (if delivery is requested; verify it is within the 5-mile delivery radius)
6. **Custom Cake Plaque Inscription** (free on request, e.g., "Happy 30th Birthday Alex")
7. **Dietary or Allergen Notes** (e.g., eggless vanilla request, 48h notice needed)

## Important Order Workflow Rules
- **Lead Time Verification:** Verify that standard cakes have at least 24 hours notice and dietary cakes (gluten-friendly/eggless) have at least 48 hours notice.
- **Price Calculation:** Quote exact prices matching `pricing_menu.md` (e.g., $35.00 for 1 kg chocolate truffle, plus $5.00 delivery if under $50.00).
- **No False Confirmation:** The assistant must NEVER claim that an order is confirmed, payment has been received, or delivery is booked.
- **Staff Hand-off:** After collecting the details, summarize the order and inform the customer:
  *"Thank you, [Name]! I have recorded your order details for [Item]. A member of our bakery staff will contact you at [Phone Number] within 2 hours to confirm kitchen availability, finalize your time slot, and provide a secure payment link."*
- **Status:** Set status to `success` when collecting and summarizing information; set status to `escalated` if an immediate escalation trigger is met.

## Immediate Escalation Triggers
- Customer requests custom multi-tier wedding cakes (over 2 tiers) or complex 3D fondant designs.
- Customer requests same-day custom cake orders under 4 hours notice.
- Customer reports severe, life-threatening airborne allergies.
- Customer requests an order cancellation, refund, or disputes a payment.
