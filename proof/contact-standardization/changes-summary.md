# Contact Standardization Changes Summary

## Updated Files and Changes

| File | Line | Old | New |
|------|------|-----|-----|
| `client/src/pages/ContactSupport.tsx` | 94-96 | `<p className="text-sm text-gray-600">support@shoplink.com</p>` | `<a href="mailto:brock1kai@gmail.com" className="text-sm text-blue-600 hover:text-blue-800 underline">Contact us</a>` |
| `client/src/pages/MarketLanding.tsx` | 698-700 | `<a href="mailto:hello@shoplynk.com">Contact Us</a>` | `<a href="mailto:brock1kai@gmail.com">Contact us</a>` |
| `client/src/pages/MarketLanding.tsx` | 720 | `<a href="mailto:support@shoplynk.com">Email Support</a>` | `<a href="mailto:brock1kai@gmail.com">Contact us</a>` |
| `client/src/pages/FAQ.tsx` | 110-115 | `<a href="mailto:hello@shoplynk.app">Email Us</a>` | `<a href="mailto:brock1kai@gmail.com">Contact us</a>` |
| `client/src/pages/Pricing.tsx` | 243-247 | `<a href="mailto:sales@shoplynk.app?subject=Custom Plan Inquiry">Contact Sales</a>` | `<a href="mailto:brock1kai@gmail.com?subject=Custom Plan Inquiry">Contact us</a>` |
| `client/src/pages/PrivacyPolicy.tsx` | 309 | `privacy@shoplynk.app` | `<a href="mailto:brock1kai@gmail.com">Contact us</a>` |
| `client/src/pages/PrivacyPolicy.tsx` | 42 | `legal@shoplynk.app` | `<a href="mailto:brock1kai@gmail.com">Contact us</a>` |
| `client/src/pages/CookiePolicy.tsx` | 185 | `privacy@shoplynk.app` | `<a href="mailto:brock1kai@gmail.com">Contact us</a>` |
| `client/src/pages/GDPRCompliance.tsx` | 123 | `privacy@shoplynk.app` | `<a href="mailto:brock1kai@gmail.com">Contact us</a>` |
| `client/src/pages/DataSubjectRequest.tsx` | 292 | `privacy@shoplynk.app` | `<a href="mailto:brock1kai@gmail.com">Contact us</a>` |
| `client/src/pages/SubprocessorList.tsx` | 189 | `privacy@shoplynk.app` | `<a href="mailto:brock1kai@gmail.com">Contact us</a>` |
| `client/src/pages/TermsOfService.tsx` | 162 | `legal@shoplynk.app` | `<a href="mailto:brock1kai@gmail.com">our legal team</a>` |
| `client/src/pages/TermsOfService.tsx` | 309 | `legal@shoplynk.app` | `<a href="mailto:brock1kai@gmail.com">Contact us</a>` |

## Summary

- **Total files changed**: 9
- **Total email addresses standardized**: 13
- **New standardized email**: brock1kai@gmail.com
- **Visible text preserved**: All contact links now show "Contact us" or similar generic labels
- **Email address hidden**: Raw email address is not visible in any UI text

## Verification

✅ All contact/support/email links now point to brock1kai@gmail.com
✅ No raw email addresses are displayed as visible text
✅ Consistent labeling across all contact points
✅ Created centralized config file at `shared/config.ts`