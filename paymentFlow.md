# Project & Payment Workflow Roadmap

This document outlines the detailed architecture, workflow, and roadmap for the project bidding and escrow-style payment system. 

## 1. Complete Workflow Description

1. **Project Posting:** Client posts a project requirement.
2. **Proposal Submission:** Freelancers submit proposals including a specific **bid amount**.
3. **Negotiation (Counter-Offers):** 
   - The Client reviews proposals and can either **accept** the original bid or **counter-offer** with a different amount.
   - The Freelancer can then **accept** the counter-offer, **counter-bid** again, or **deny/withdraw**.
4. **Agreement & Acceptance:** Once an amount is mutually agreed upon, the Client officially accepts the proposal, and the Freelancer confirms the acceptance of the work.
5. **Payment (Escrow Allocation):** The Client pays the agreed amount upfront.
6. **Funds Held in Escrow:** The payment is secured and held in a centralized holding account (Cashfree nodal/escrow account).
7. **Work Execution & Submission:** The Freelancer works on the project. Once done, they submit the final work/presentation through the platform's delivery system.
8. **Client Approval:** The Client reviews the submitted work and either formally **approves** it or requests revisions.
9. **Fund Disbursement:** Upon mutual approval, the held funds are released. **3%** of the total amount is deducted as a platform fee and routed to the admin/revenue account. The remaining **97%** is transferred to the Freelancer's registered bank account.
10. **Review & Rating:** The project is marked as "Completed." Both the Client and Freelancer leave reviews and ratings for each other.

---

## 2. Implementation Roadmap

### Phase 1: Database & Bidding Engine (No Real Payments Yet)
* **Objective:** Update models and create the negotiation loop.
* **Tasks:**
  - Update `Project` model to handle new statuses (`OPEN`, `NEGOTIATING`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`).
  - Update `Proposal` model to support an array of `bids/negotiations` (tracking who offered what amount and the timeline).
  - Build UI for Clients to Accept/Counter, and Freelancers to Accept/Counter/Deny.
  - Build UI for the "Work Room" where deliverables are submitted and approved.

### Phase 2: Mock/Development Payment System
* **Objective:** Build the internal ledger and escrow logic without hitting a real payment gateway (allows rapid testing).
* **Tasks:**
  - Create a internal `Wallet` or `Escrow` model to track balances.
  - When the client "pays", deduct from a fake "Test Balance" and move it to "Escrow Balance".
  - Upon work approval, calculate the 3% platform commission, add it to the Admin account, and add the 97% to the Freelancer's account.
  - Create webhook simulators to trigger success/failure events.

### Phase 3: Cashfree Integration (Production Readiness)
* **Objective:** Swap out the mock payment gateway with Cashfree.
* **Tasks:**
  - **Pay-in (Client to Escrow):** Integrate Cashfree Payment Gateway (PG). When the client pays, funds land in your Cashfree Nodal/Escrow account.
  - **Payout (Escrow to Freelancer):** Integrate Cashfree Payouts. Once work is approved, trigger an API call to transfer 97% to the freelancer's verified bank account and 3% to your primary revenue account.
  - Set up required webhooks from Cashfree to update payment statuses (e.g., `PAYMENT_SUCCESS`, `PAYOUT_SUCCESS`) asynchronously.
  - Handle split payments automatically if Cashfree Easy Split is supported, or manage manually via Nodal account routing.

---

## 3. Data Models Alterations Required

### **Proposal Schema**
- `bidAmount`: *Number*
- `status`: *['PENDING', 'CLIENT_COUNTERED', 'FREELANCER_COUNTERED', 'ACCEPTED', 'REJECTED']*
- `negotiationHistory`: *Array* of objects `{ amount, proposedBy (user_id), createdAt, note }`

### **Order / Contract Schema**
- `projectId`: *Ref*
- `freelancerId`: *Ref*
- `clientId`: *Ref*
- `agreedAmount`: *Number*
- `platformFee`: *Number* (3%)
- `freelancerPayout`: *Number* (97%)
- `status`: *['AWAITING_PAYMENT', 'IN_PROGRESS', 'WORK_SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'COMPLETED', 'CANCELLED']*

### **Payment / Transaction Schema**
- `orderId`: *Ref*
- `amount`: *Number*
- `type`: *['ESCROW_DEPOSIT', 'PAYOUT_FREELANCER', 'PLATFORM_FEE', 'REFUND']*
- `gatewayTxnId`: *String* (Cashfree Order ID)
- `status`: *['PENDING', 'SUCCESS', 'FAILED']*

---

## 4. Security & Edge Cases

1. **Concurrent Modification (Double Spending/Bidding):**
   - Implement database transactions (`mongoose.startSession()`) or atomic operators when changing proposal statuses or moving funds.
2. **Webhook Security:**
   - Verify signatures of all Cashfree webhooks using your Cashfree secret key to prevent malicious actors from triggering fake payment successes.
3. **API Rate Limiting & Authorization:**
   - Ensure only the assigned Client can approve the work.
   - Ensure only the assigned Freelancer can submit the work.
4. **Dispute Resolution (Optional but Recommended):**
   - Add a fallback state (`IN_DISPUTE`) in case the client rejects the work maliciously or the freelancer goes missing. Admin arbitration will be required to release or refund funds.
5. **Idempotent Payouts:**
   - Ensure payout scripts generate a unique idempotency key (often the internal `Transaction ID`) so that retries or network failures don't result in double payouts to the freelancer.

   ## 5. Revision Workflow
- Client can request revisions up to [N] times
- Each revision request moves Order status 
  back to `IN_PROGRESS`
- Freelancer resubmits through same delivery system
- Escrow remains held during entire revision cycle

## 6. Cancellation & Refund Policy
- BEFORE payment: Either party can cancel freely
- AFTER payment, BEFORE submission: 
  Full refund to client, Order marked CANCELLED
- AFTER submission, client disputes: 
  Goes to IN_DISPUTE, admin decides
- Platform fee (3%) is NON-REFUNDABLE 
  once work is approved

## 7. Notification Triggers
| Event                    | Notify        |
|--------------------------|---------------|
| Proposal submitted       | Client        |
| Counter offer sent       | Freelancer    |
| Proposal accepted        | Freelancer    |
| Payment received         | Both          |
| Work submitted           | Client        |
| Work approved            | Freelancer    |
| Payout sent              | Freelancer    |
| Review requested         | Both          |

## 8. Freelancer Payout Prerequisites
- Freelancer must add & verify bank account
  before they can accept any contract
- Payout fails → retry 3 times → 
  flag for manual admin review
- Idempotency key = internal Transaction ID

## 9. Contract Creation Trigger
- Order/Contract is created ONLY after:
  1. Both parties agree on amount
  2. Client formally accepts proposal
  3. Freelancer confirms acceptance
- Payment link is generated from this Order