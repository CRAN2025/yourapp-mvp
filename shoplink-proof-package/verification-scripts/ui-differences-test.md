# Owner vs Buyer UI Verification Test

## Test Scenario: Different UI based on authentication status

### Owner View (Authenticated as Store Owner)
**Access**: Log in as seller, then visit `/store/{own-seller-id}`

**Expected UI Elements**:
- ✅ "← Back to dashboard" button (blue styling)
- ❌ NO WhatsApp contact button
- ❌ NO "Create your free store" CTA  
- ❌ NO favorite buttons on products
- ✅ "View Details" only on product cards (no WhatsApp)

**Code Implementation**:
```typescript
{isOwner ? (
  <a href="/products" 
     className="inline-flex items-center gap-2 px-4 py-2 rounded-full border font-bold"
     style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
    ← Back to dashboard
  </a>
) : (
  <>
    <button onClick={handleFloatingChatClick} 
            style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}>
      <MessageCircle className="h-4 w-4" />
      Chat with seller on WhatsApp
    </button>
    <a href={SHOPLINK_MARKETING_URL}
       style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
      ✨ Create your free store
    </a>
  </>
)}
```

### Buyer View (Anonymous or Different User)
**Access**: Incognito window or different user visiting `/store/{seller-id}`

**Expected UI Elements**:
- ✅ "Chat with seller on WhatsApp" button (green styling)
- ✅ "✨ Create your free store" CTA (blue styling)
- ✅ Favorite heart buttons on products
- ✅ "WhatsApp" + "View" buttons on product cards

### Owner Detection Logic
```typescript
const unsubscribe = onAuthStateChanged(primaryAuth, (user) => {
  setIsOwner(!!user && user.uid === sellerId);
});
```

### Pass Criteria
- [x] Owner sees read-only dashboard link
- [x] Buyer sees purchase/contact CTAs
- [x] Product interactions differ by user type
- [x] UI styling matches expected colors
- [x] No WhatsApp buttons for owners