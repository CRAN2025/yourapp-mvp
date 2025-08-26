# Deep Link Product Modal Verification Test

## Test Scenario: URL hash opens product modal automatically

### Test URL Format
```
https://yourapp.com/store/{sellerId}#{productId}
```

### Test Cases

#### Test 1: Direct Deep Link Access
1. **Open URL**: `/store/seller123#product-abc`
2. **Expected**: Product modal opens automatically
3. **Verify**: URL hash remains `#product-abc`

#### Test 2: Modal Interaction
1. **Close modal**: Click X or ESC key
2. **Expected**: Hash clears from URL
3. **Verify**: URL becomes `/store/seller123` (no hash)

#### Test 3: Modal Navigation
1. **Open product**: Click any product card
2. **Expected**: URL updates to `#product-xyz`
3. **Navigate**: Use arrow keys to browse products
4. **Expected**: Hash updates as products change

### Implementation Verification
```typescript
// Deep link effect in StorefrontPublic.tsx
useEffect(() => {
  if (!filteredProducts?.length) return;
  const id = window.location.hash?.slice(1);
  if (!id) return;
  const product = filteredProducts.find(p => p.id === id);
  if (product) {
    setSelectedProduct(product);
    setShowProductModal(true);
    // Track deep link access
    trackInteraction({
      type: 'product_view',
      sellerId: sellerId!,
      productId: product.id,
      metadata: { source: 'deeplink' },
    });
  }
}, [filteredProducts, sellerId]);
```

### Pass Criteria
- [x] Deep link opens correct product modal
- [x] Hash is maintained in URL
- [x] Modal closure clears hash
- [x] Product navigation updates hash
- [x] Analytics track deep link source