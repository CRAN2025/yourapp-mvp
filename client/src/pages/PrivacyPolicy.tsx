import React from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Shield, Lock, Eye, Users } from 'lucide-react';

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-white hover:text-green-100 mb-4 transition-colors"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
            <div className="flex items-center mb-4">
              <Shield className="w-8 h-8 text-white mr-3" />
              <h1 className="text-3xl font-bold text-white">ShopLynk.app — Privacy Policy</h1>
            </div>
            <p className="text-green-100">Last Updated: August 24, 2025</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <p className="text-green-800 leading-relaxed">
                This Privacy Policy explains how <strong>ShopLynk.app</strong> ("<strong>ShopLynk</strong>," "<strong>Company</strong>," "<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>") collects, uses, discloses, and safeguards personal information when you use our websites, dashboards, and services that enable sellers to create message‑based storefronts and interact with buyers via WhatsApp or other messaging channels (collectively, the "<strong>Platform</strong>").
              </p>
              <p className="text-green-800 leading-relaxed mt-3">
                By using the Platform, you agree to this Privacy Policy and to any region‑specific notices referenced here. If you do not agree, please do not use the Platform.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 leading-relaxed">
                <strong>Controller / Contact.</strong> Unless stated otherwise, <strong>ShopLynk</strong> is a controller of personal information it collects via the Platform. Contact: <strong>[ShopLynk Technologies Inc./Ltd.]</strong>, <strong>[registered address, city, country]</strong>, <a href="mailto:brock1kai@gmail.com" className="text-blue-600 hover:text-blue-800 underline">Contact us</a>. If you are in the EEA/UK, we may appoint an EU/UK representative (see regional addendum).
              </p>
              <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <p className="text-blue-800 text-sm italic">
                  This document is a strong baseline for global compliance (Canada/US/EU/UK/Brazil and more) and should be tailored by qualified counsel for the markets you target.
                </p>
              </div>
            </div>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-6 h-6 text-purple-600 mr-2" />
                1. Who This Policy Covers & Our Roles
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-3 ml-4">
                <li><strong>Sellers (Merchants):</strong> Individuals or businesses that create storefronts and message with Buyers. Sellers are <strong>independent controllers</strong> of Buyer data they collect directly (e.g., via WhatsApp). ShopLynk may also act as a <strong>processor/service provider</strong> for certain features (e.g., hosting your product catalog, analytics about your storefront). See Section 10 and the <strong>Data Processing Addendum (DPA)</strong> if we process data on your behalf.</li>
                <li><strong>Buyers:</strong> Individuals who browse storefronts and contact Sellers.</li>
                <li><strong>Visitors:</strong> Individuals who visit our sites or marketing pages.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="w-6 h-6 text-blue-600 mr-2" />
                2. Personal Information We Collect
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect the following categories of personal information, which may vary by user type and region:
              </p>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">1. Account & Profile Data</h3>
                  <p className="text-sm text-blue-800">
                    (Sellers and, if applicable, Buyers): name, email, phone, username, business details (legal name, address, tax numbers), role, profile photo, storefront name/URL, and preferences.
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">2. Storefront Content</h3>
                  <p className="text-sm text-green-800">
                    (Sellers): product listings, images, descriptions, pricing, inventory, shipping options, return policies, branding (logos, trade names), and any content you upload.
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">3. Communications & Support</h3>
                  <p className="text-sm text-purple-800">
                    emails, chat messages with us, support tickets, feedback, surveys, and related metadata.
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-900 mb-2">4. Messaging Events (WhatsApp or similar)</h3>
                  <p className="text-sm text-orange-800">
                    click‑to‑message events, timestamps, and routing metadata generated through our buttons or links. <strong>We do not read or store your message content</strong> exchanged on third‑party services like WhatsApp unless we explicitly provide an in‑app messaging feature.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">5. Device/Usage Data</h3>
                  <p className="text-sm text-gray-700">
                    IP address, device/browser type, OS version, language, referral URLs, pages viewed, session data, approximate location (from IP), identifiers (e.g., cookies, SDK IDs), and diagnostics/analytics about how you use the Platform.
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2">6. Payments & Billing (Sellers)</h3>
                  <p className="text-sm text-red-800">
                    If we provide paid subscriptions or services, we collect billing details (billing contact, address, VAT/GST IDs). If a third‑party processor is used, your payment card details are collected <strong>directly</strong> by that processor (we do not store full card numbers).
                  </p>
                </div>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-6">
                <p className="text-yellow-800 leading-relaxed">
                  <strong>Sensitive Personal Information.</strong> We do not seek to collect sensitive information (e.g., government ID numbers, precise geolocation, health/biometric data). Do not send sensitive data over messaging unless required by law and appropriately secured.
                </p>
                <p className="text-yellow-800 leading-relaxed mt-2">
                  <strong>Children.</strong> The Platform is not intended for children under 13 (or older, where local law requires). We do not knowingly collect personal information from children. See Section 12.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Sources of Personal Information</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Directly from you:</strong> registration, storefront setup, uploads, communications.</li>
                <li><strong>Automatically:</strong> cookies, SDKs, server logs, analytics.</li>
                <li><strong>From third parties:</strong> identity verification vendors, payment processors, fraud prevention partners, advertising/analytics partners (where permitted), and messaging platforms (event metadata only).</li>
                <li><strong>From Sellers:</strong> if you are a Buyer and a Seller provides information to us for a feature we power on the Seller's behalf (see Section 10).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Use Personal Information (Purposes & Legal Bases)</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-400 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Providing and improving the Platform</h3>
                  <p className="text-gray-700 text-sm mb-1">(account creation, hosting, catalog tools, analytics, troubleshooting, personalization)</p>
                  <p className="text-blue-700 text-sm italic">Legal bases (EEA/UK): Contract; Legitimate interests (to run and improve services)</p>
                </div>
                
                <div className="border-l-4 border-green-400 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Security, fraud prevention, and integrity</h3>
                  <p className="text-gray-700 text-sm mb-1">(monitoring abuse, protecting accounts and Platform, enforcing policies)</p>
                  <p className="text-green-700 text-sm italic">Legal bases: Legitimate interests; Legal obligation</p>
                </div>
                
                <div className="border-l-4 border-purple-400 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Communications</h3>
                  <p className="text-gray-700 text-sm mb-1">(service/transactional emails, onboarding messages, important updates)</p>
                  <p className="text-purple-700 text-sm italic">Legal bases: Contract; Legitimate interests</p>
                </div>
                
                <div className="border-l-4 border-orange-400 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Marketing (our services)</h3>
                  <p className="text-gray-700 text-sm mb-1">such as newsletters or promotions, subject to consent requirements (e.g., <strong>CASL</strong> in Canada, <strong>ePrivacy</strong> in EEA). You can unsubscribe at any time.</p>
                  <p className="text-orange-700 text-sm italic">Legal bases: Consent; Legitimate interests where permitted</p>
                </div>
                
                <div className="border-l-4 border-red-400 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Compliance with laws</h3>
                  <p className="text-gray-700 text-sm mb-1">(tax, accounting, regulatory inquiries, sanctions/export controls)</p>
                  <p className="text-red-700 text-sm italic">Legal bases: Legal obligation</p>
                </div>
                
                <div className="border-l-4 border-gray-400 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Business operations</h3>
                  <p className="text-gray-700 text-sm mb-1">(billing, audits, mergers/acquisitions)</p>
                  <p className="text-gray-700 text-sm italic">Legal bases: Legitimate interests; Legal obligation (as applicable)</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mt-6">
                <p className="text-blue-800 text-sm">
                  When we rely on <strong>consent</strong>, you may withdraw it at any time (this does not affect processing before withdrawal). When we rely on <strong>legitimate interests</strong>, we balance our interests against your rights and freedoms.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookies, SDKs & Analytics</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar technologies (pixels, SDKs, local storage) to: keep you signed in, remember preferences, measure performance, and, where permitted, help us market our services. You can manage cookies in your browser settings and (where available) via our <strong>Cookie Preferences</strong> link. Some features may not function without certain cookies.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We may use analytics services to understand usage trends. Where required, we obtain consent before setting non‑essential cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Disclosures of Personal Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We disclose personal information to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Service Providers / Processors:</strong> hosting, storage, analytics, email/messaging, customer support, fraud prevention, security, identity verification, payment processing, and professional advisors. These providers are bound by contracts limiting their use of your information.</li>
                <li><strong>Sellers:</strong> If you are a Buyer and interact with a Seller, we may pass along necessary information that you intentionally submit for that interaction (e.g., your contact details when you request contact). <strong>Sellers are independent controllers</strong> of the data they receive.</li>
                <li><strong>Affiliates:</strong> within our corporate group for purposes consistent with this Policy.</li>
                <li><strong>Legal/Compliance:</strong> to comply with law, respond to lawful requests, protect rights, safety, and property, and enforce our agreements/policies.</li>
                <li><strong>Business Transfers:</strong> as part of a merger, financing, acquisition, or sale of assets. We will notify you where required.</li>
                <li><strong>With Consent:</strong> where you direct us to share information.</li>
              </ul>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mt-6">
                <p className="text-green-800 leading-relaxed">
                  We do <strong>not</strong> sell your personal information for money. We may engage in <strong>"sharing"</strong> for cross‑context behavioral advertising as defined under the California Privacy Rights Act (CPRA); see Section 11 and the California Notice for opt‑out rights.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                We operate globally. Your personal information may be transferred to and processed in countries other than your own, which may have different data protection laws. Where required, we use lawful transfer mechanisms (e.g., <strong>Standard Contractual Clauses</strong>) and implement appropriate safeguards. Details may be provided upon request.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain personal information as long as needed for the purposes described here, to comply with legal obligations, resolve disputes, and enforce agreements. Retention periods vary based on data type, account status, legal requirements, and our legitimate business needs. When no longer needed, data is deleted or anonymized.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="w-6 h-6 text-red-600 mr-2" />
                9. Security
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We implement technical and organizational measures designed to protect personal information (e.g., encryption in transit, access controls, audit logging). However, no system is 100% secure. You are responsible for maintaining the confidentiality of your account credentials and for securing your devices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Our Role to Sellers: Processor / Service Provider</h2>
              <p className="text-gray-700 leading-relaxed">
                For certain features, ShopLynk acts as a <strong>processor</strong> (EU/UK) or <strong>service provider/contractor</strong> (US/California) on behalf of Sellers, who are controllers of their Buyer data. When acting as a processor, we process personal information <strong>solely</strong> under the Seller's instructions and our <strong>Data Processing Addendum (DPA)</strong>, which includes required terms (e.g., SCCs for international transfers). If you are a Seller, ensure your own privacy notice accurately describes your processing activities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Your Privacy Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your privacy rights depend on your location and applicable law. Subject to exceptions, you may have the right to:
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-blue-800">
                    <li>• <strong>Access</strong> your personal information and obtain a copy</li>
                    <li>• <strong>Correct</strong> inaccurate information</li>
                    <li>• <strong>Delete</strong> (erasure) your information</li>
                    <li>• <strong>Portability</strong> of certain information</li>
                  </ul>
                  <ul className="space-y-2 text-blue-800">
                    <li>• <strong>Restrict</strong> or <strong>object</strong> to certain processing</li>
                    <li>• <strong>Withdraw consent</strong> at any time</li>
                    <li>• <strong>Opt out of targeted advertising</strong> / "sharing"</li>
                    <li>• <strong>Opt out of marketing</strong> communications</li>
                  </ul>
                </div>
                
                <div className="mt-6 p-4 bg-blue-100 rounded">
                  <h4 className="font-semibold text-blue-900 mb-2">How to Exercise</h4>
                  <p className="text-blue-800 text-sm">
                    Contact <strong>privacy@shoplynk.app</strong> or use in‑product controls where available. We may verify your request (including authorized agent requests). We will not discriminate against you for exercising your rights.
                  </p>
                  <p className="text-blue-800 text-sm mt-2">
                    <strong>Global Privacy Control (GPC).</strong> Where required by law, we honor browser‑based opt‑out signals (e.g., GPC) for "selling"/"sharing" as defined by CPRA when detected on our web properties.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                The Platform is not directed to children under 13 (or a higher minimum age where applicable). If we learn we have collected personal information from a child without verifiable parental consent, we will delete it. Parents who believe their child provided information can contact us at <strong>privacy@shoplynk.app</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Marketing & Messaging (CASL, ePrivacy, TCPA/CAN‑SPAM)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We send service/transactional communications as necessary to operate your account. We send marketing communications only with appropriate consent or as otherwise permitted by law. You can unsubscribe via the message or by contacting us.
              </p>
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <p className="text-green-800 leading-relaxed">
                  <strong>WhatsApp & Third‑Party Messaging.</strong> Messages exchanged between Buyers and Sellers occur on third‑party services (e.g., WhatsApp) governed by those services' terms and privacy policies. ShopLynk may log click‑to‑message events and related metadata but does not read or store the message content unless we clearly provide an in‑app feature for it.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Third‑Party Links & Services</h2>
              <p className="text-gray-700 leading-relaxed">
                The Platform may link to third‑party sites or integrate with third‑party services. We are not responsible for their privacy practices. Review their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Policy from time to time. If we make material changes, we will provide notice (e.g., by email, in‑app notice, or posting). The "Last Updated" date shows when it was last revised. Continued use of the Platform indicates acceptance of the updated Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Contact Us</h2>
              <div className="bg-gray-50 p-6 rounded-lg space-y-2">
                <p className="font-semibold text-gray-900">ShopLynk.app Privacy</p>
                <p className="text-gray-700"><strong>Company:</strong> [ShopLynk Technologies Inc./Ltd.]</p>
                <p className="text-gray-700"><strong>Address:</strong> [registered address, city, country]</p>
                <p className="text-gray-700"><strong>Email:</strong> <a href="mailto:brock1kai@gmail.com" className="text-blue-600 hover:text-blue-800 underline">Contact us</a></p>
              </div>
            </section>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Regional Notices & Addenda</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-blue-900">A) EEA/UK Addendum (GDPR/UK GDPR)</h4>
                  <p className="text-blue-800 text-sm">
                    <strong>Controller.</strong> For personal information we collect as a controller, ShopLynk is the controller. For processing we perform on behalf of Sellers, the Seller is the controller and ShopLynk is the processor; the DPA governs those activities.
                  </p>
                </div>
                <p className="text-blue-700 text-sm italic">
                  Additional regional notices and compliance information available upon request for specific jurisdictions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}