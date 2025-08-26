# Owner Session Verification Test

## Test Scenario: Logged-in seller maintains session when viewing public store

### Setup
1. Log in as seller with email/password
2. Navigate to `/products` - should load dashboard
3. Navigate to `/storefront` - should load seller storefront  
4. Click "View Public Store" button

### Expected Behavior
- **New tab opens**: `/store/{sellerId}` 
- **Original tab**: Remains on `/storefront`, still logged in
- **Public tab**: Shows owner view ("← Back to dashboard")
- **Auth state**: Primary app stays authenticated, secondary app goes anonymous

### Verification Points
```bash
# Check localStorage persistence
localStorage.getItem('firebase:authUser:...')  # Should exist

# Check console for auth state
console.log(firebase.auth().currentUser)      # Should show user object

# Check public page auth
console.log(eventsAuth.currentUser)           # Should show anonymous user
```

### Pass Criteria
- [x] Owner dashboard loads without redirect
- [x] Public store opens in new tab
- [x] Owner session persists in original tab
- [x] Public page shows owner-specific UI
- [x] No anonymous sign-in on primary app