# Incognito Route Guards Verification Test

## Test Scenario: Anonymous users blocked from seller routes

### Setup
1. Open incognito/private browsing window
2. Navigate to protected seller routes

### Test Cases

#### Test 1: Dashboard Routes (Should Redirect to /auth)
```
GET /products        → 302 redirect to /auth
GET /storefront      → 302 redirect to /auth  
GET /orders          → 302 redirect to /auth
GET /analytics       → 302 redirect to /auth
GET /settings        → 302 redirect to /auth
GET /admin           → 302 redirect to /auth
```

#### Test 2: Public Route (Should Load)
```
GET /store/{sellerId} → 200 OK, loads public storefront
```

### Expected Behavior
- **Protected routes**: Immediate redirect to `/auth`
- **Public route**: Loads normally with buyer UI
- **Auth state**: No authentication on primary app
- **Analytics**: Anonymous auth only on secondary app for events

### Verification Points
```bash
# Check URL after redirect
window.location.pathname === '/auth'

# Check auth state  
firebase.auth().currentUser === null

# Check console for no errors
console.errors.length === 0
```

### Pass Criteria
- [x] All seller routes redirect to /auth
- [x] Public store loads for anonymous users
- [x] Buyer UI shown (WhatsApp + "Create store" CTAs)
- [x] No errors in console
- [x] Anonymous auth only on events app