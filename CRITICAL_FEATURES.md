# ⚠️ CRITICAL FEATURES - DO NOT MODIFY

This document lists the critical features of Reputa Score that must NEVER be broken or modified without explicit user approval.

---

## 1. Pi Browser Login/Authentication

### Purpose
Allows users to login with their Pi Network account using the Pi SDK.

### Files
- `src/app/services/piSdk.ts` - Main SDK wrapper

### Key Functions
```typescript
isPiBrowser()          // Detects if running in Pi Browser
waitForPiSDK()         // Waits for SDK to load
initializePiSDK()      // Initializes the SDK
authenticateUser()     // Authenticates user with Pi SDK
```

### Scopes Required
- `username` - User's Pi username
- `payments` - Payment permissions
- `wallet_address` - User's wallet address

### Protection Rules
- NEVER remove or modify `isPiBrowser()` function
- NEVER remove authentication scopes
- NEVER modify the SDK initialization flow

---

## 2. User-to-App (U2A) Payments

### Purpose
Allows users to pay for VIP subscription using Pi cryptocurrency.

### Files
- `src/app/services/piPayments.ts` - Frontend payment flow
- `api/payments.ts` - Backend approve/complete handlers

### Key Functions

**Frontend:**
```typescript
createVIPPayment(uid, onSuccess)  // Creates VIP payment
```

**Backend:**
```typescript
handleApprove(paymentId, res)     // Approves payment with Pi API
handleComplete(body, res)         // Completes payment and updates VIP status
```

### Payment Flow
1. User clicks VIP button → `createVIPPayment()`
2. SDK shows payment dialog
3. User approves → `onReadyForServerApproval` → API `/api/payments?action=approve`
4. User pays → `onReadyForServerCompletion` → API `/api/payments?action=complete`
5. VIP status updated → Success callback

### Protection Rules
- NEVER remove `createVIPPayment()` function
- NEVER modify the callback structure
- NEVER change the API endpoints without updating frontend

---

## 3. App-to-User (A2U) Payments

### Purpose
Allows the app to send Pi rewards to users from the app wallet.

### Files
- `api/payments.ts` - All A2U logic

### Key Functions
```typescript
submitA2UTransaction()    // Submits blockchain transaction
completeA2UPayment()      // Completes payment with Pi API
handleSendPi()            // Main A2U handler (action=send-pi)
```

### Environment Variables Required
- `APP_WALLET_SEED` - App wallet secret key (NEVER expose)
- `PI_API_KEY` - Pi Network API key
- `PI_NETWORK` - Network mode (testnet/mainnet)

### A2U Flow
1. User triggers reward → API `/api/payments?action=send-pi`
2. Create A2U payment with Pi API
3. Approve payment
4. Submit blockchain transaction using Stellar SDK
5. Complete payment with txid
6. Record in Redis

### Protection Rules
- NEVER expose `APP_WALLET_SEED` in client code
- NEVER modify the transaction signing logic
- NEVER remove the A2U payment flow

---

## Quick Reference

| Feature | Primary File | Backend API |
|---------|-------------|-------------|
| Login | `piSdk.ts` | `api/auth.ts` |
| U2A Payment | `piPayments.ts` | `api/payments.ts` (approve, complete) |
| A2U Payment | - | `api/payments.ts` (send-pi) |

---

## Before Modifying These Files

1. **Ask the user first** - Get explicit approval
2. **Backup the code** - Copy the working version
3. **Test after changes** - Verify login and payments work
4. **Document changes** - Update this file

---

## Emergency Recovery

If these features break, restore from the last working commit:

```bash
git log --oneline  # Find last working commit
git checkout <commit> -- src/app/services/piSdk.ts
git checkout <commit> -- src/app/services/piPayments.ts
git checkout <commit> -- api/payments.ts
```

---

Last Updated: January 2026
