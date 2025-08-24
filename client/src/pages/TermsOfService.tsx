import React from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-white hover:text-blue-100 mb-4 transition-colors"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
            <h1 className="text-3xl font-bold text-white">ShopLynk.app — Terms of Use</h1>
            <p className="text-blue-100 mt-2">Last Updated: August 24, 2025</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-blue-800 leading-relaxed">
                These Terms of Use ("<strong>Terms</strong>") govern your access to and use of ShopLynk.app's websites, dashboards, tools, and services that enable sellers to create message-based storefronts and interact with buyers via WhatsApp or other messaging channels (collectively, the "<strong>Platform</strong>"). By accessing or using the Platform, you agree to these Terms and policies incorporated by reference (the "<strong>Agreement</strong>"). If you do not agree, do not use the Platform.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 leading-relaxed">
                <strong>Parties.</strong> "<strong>Company</strong>," "<strong>ShopLynk.app</strong>," "<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>" means <strong>[ShopLynk Technologies Inc./Ltd.]</strong>, <strong>[registered address, city, country]</strong>. "<strong>You</strong>" means the person or entity using the Platform. "<strong>Seller</strong>" means an account that lists or sells goods/services. "<strong>Buyer</strong>" means an account that browses or purchases from a Seller.
              </p>
              <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-yellow-800 text-sm italic">
                  <strong>Note:</strong> This template is a strong baseline but not legal advice. Have qualified counsel adapt it for every country/region you target.
                </p>
              </div>
            </div>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Eligibility & Accounts</h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>1.1 Age.</strong> You must be the age of majority where you live, and in any case not younger than 13. Where required by law (e.g., EEA/UK), the minimum may be 16 unless parental consent is obtained.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>1.2 Accuracy.</strong> Provide accurate, complete registration information and keep it current. You are responsible for your credentials and all activity on your account.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>1.3 Business Use.</strong> If registering for a business, you represent you're authorized to bind that entity.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Nature of the Service; Our Role</h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>2.1 Marketplace Facilitator.</strong> The Platform provides tools for Sellers to showcase products/services and communicate with Buyers (e.g., via WhatsApp). <strong>We are not a party</strong> to any transaction between Buyer and Seller unless expressly stated in writing for a specific transaction.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>2.2 Payments Off-Platform (By Default).</strong> Unless we clearly provide and label a ShopLynk-operated payment service, <strong>payments occur off-Platform</strong> (e.g., cash, bank transfer, third-party processors). We don't control, hold, or guarantee funds unless we say otherwise for a specific feature.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>2.3 No Endorsement.</strong> We don't guarantee or endorse Sellers, Buyers, listings, or messages. Transact at your own risk.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Third-Party Services (WhatsApp, etc.)</h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>3.1 Independent Providers.</strong> WhatsApp and other connected services are provided by third parties we don't control. Your use of them is governed by their terms and policies.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>3.2 Compliance.</strong> You must comply with all channel rules (e.g., opt-in/consent requirements, anti-spam, template usage, rate limits) and all applicable laws (e.g., <strong>CASL</strong> in Canada, <strong>GDPR/ePrivacy</strong> in the EEA, <strong>TCPA</strong>/<strong>CAN-SPAM</strong> in the US).
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>3.3 No Affiliation.</strong> ShopLynk.app is not affiliated with or endorsed by WhatsApp or Meta.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Listings, Orders, Fulfillment</h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>4.1 Accuracy & Lawfulness.</strong> Sellers must ensure listings are accurate, complete, and lawful (price, taxes, shipping, delivery times, warranties, return policy).
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>4.2 Inventory.</strong> Keep inventory accurate; promptly delist unavailable items.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>4.3 Order Formation.</strong> Orders are formed directly between Buyer and Seller via messaging or Seller-provided checkout.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>4.4 Shipping & Import.</strong> Sellers are solely responsible for packing, shipping, customs/export/import compliance, timely delivery, and transit risk.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>4.5 Returns/Refunds.</strong> Sellers must publish and honor clear return/refund policies consistent with applicable consumer laws in each destination market.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>4.6 Support.</strong> Sellers handle all post-sale support and legal obligations (returns, exchanges, warranties).
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>4.7 Records.</strong> Provide legally required invoices/receipts and keep records as required by law.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Fees, Billing & Taxes</h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>5.1 Fees.</strong> We may charge subscription, service, and/or usage fees ("<strong>Fees</strong>"). Current Fees and billing terms appear in your account or applicable order form. Fees are non-refundable unless we state otherwise.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>5.2 Taxes.</strong> Sellers are solely responsible for determining, collecting, remitting, and reporting all taxes, duties, and similar charges (e.g., <strong>GST/HST/QST/PST</strong> in Canada; <strong>VAT</strong>; <strong>sales/use tax</strong>). We don't provide tax advice.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>5.3 Setoff/Withholding.</strong> Where permitted by law or to satisfy overdue amounts, we may withhold or set off sums you owe to us.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Acceptable Use; Prohibited Activities</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You agree <strong>not</strong> to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>violate laws (consumer, privacy, product safety, export/sanctions, anti-spam, anti-bribery, AML/KYC);</li>
                <li>list/sell illegal, unsafe, counterfeit, stolen, misleading, or restricted items (e.g., weapons, narcotics, unapproved medical devices, endangered species, extremist content, explicit sexual content involving minors or non-consensual acts);</li>
                <li>spam, harass, deceive, or impersonate;</li>
                <li>scrape, harvest, reverse engineer, probe, or disrupt the Platform or others' use;</li>
                <li>post or transmit content that infringes IP or rights of others or is defamatory, obscene, or invasive of privacy;</li>
                <li>circumvent Fees, controls, or security;</li>
                <li>use the Platform to process payments where we haven't provided such a feature.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We may remove content, limit features, and/or suspend or terminate accounts for violations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>7.1 Our IP.</strong> The Platform (software, UI, text, graphics, data) is owned by us or our licensors and protected by IP laws. We grant you a limited, revocable, non-transferable license to use the Platform as permitted by these Terms.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>7.2 Your Content.</strong> You retain ownership of content you submit (e.g., listings, images, trademarks). You grant us a worldwide, non-exclusive, royalty-free license to host, reproduce, display, distribute, and modify your content as needed to operate, improve, and promote the Platform and your storefront.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>7.3 Feedback.</strong> You assign to us all rights in feedback/suggestions without obligation to you.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>7.4 IP Complaints.</strong> Send notices to <strong>legal@shoplynk.app</strong> with (a) identification of the protected work; (b) the allegedly infringing material and location; (c) your contact details; (d) a good-faith statement; and (e) a statement, under penalty of perjury, of accuracy and authority to act. We may remove/disable content and suspend repeat infringers.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Protection & Privacy</h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>8.1 Privacy Policy.</strong> Our <strong>Privacy Policy</strong> (incorporated by reference) explains how we collect, use, and share personal data.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>8.2 Seller as Independent Controller.</strong> Sellers act as independent data controllers for Buyer data they collect. Sellers must publish their own privacy notices and comply with applicable laws (e.g., <strong>GDPR/UK GDPR</strong>, <strong>PIPEDA</strong>, <strong>CCPA/CPRA</strong>, <strong>LGPD</strong>), obtain valid consent where required, honor data subject requests, and implement appropriate security.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>8.3 Messaging Data.</strong> Messaging content may be processed by WhatsApp and other third parties outside our control. Do not transmit sensitive data (e.g., full payment card details, health data, government IDs) unless legally permitted and appropriately secured.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>8.4 Security & Incidents.</strong> Maintain appropriate technical/organizational measures. Notify affected users and us of data incidents as required by law.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>8.5 International Transfers.</strong> Where applicable, we rely on lawful transfer mechanisms (e.g., <strong>Standard Contractual Clauses</strong>) and may implement additional safeguards.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Service Changes; Beta; Availability</h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>9.1 Beta/Experimental.</strong> We may offer alpha/beta features "as is," which may change or end at any time.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>9.2 Modifications.</strong> We may modify or discontinue functionality, impose limits, or suspend the Platform for maintenance, security, or legal reasons.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>9.3 Third-Party Outages.</strong> We are not responsible for outages or policy changes by WhatsApp or other third-party services.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Warranties & Disclaimers</h2>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-red-800 leading-relaxed">
                  THE PLATFORM IS PROVIDED <strong>"AS IS"</strong> AND <strong>"AS AVAILABLE."</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE SALES, LEADS, RANKING, UPTIME, MESSAGE DELIVERY, OR FREEDOM FROM ERRORS OR HARMFUL COMPONENTS.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Limitation of Liability</h2>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-red-800 leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES; LOST PROFITS/REVENUE/GOODWILL; OR LOSS/COMPROMISE OF DATA, EVEN IF ADVISED OF THE POSSIBILITY. OUR TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE PLATFORM SHALL NOT EXCEED THE GREATER OF <strong>(A) AMOUNTS YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM</strong> OR <strong>(B) USD/CAD $100</strong>. SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS; SOME OF THE ABOVE MAY NOT APPLY TO YOU.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You will defend, indemnify, and hold harmless ShopLynk.app and its affiliates, officers, directors, employees, and agents from claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising from: (a) your use of the Platform; (b) your listings/products/services/content; (c) your breach of these Terms or law; (d) any transaction between you and a Buyer/Seller; or (e) your use of third-party services (e.g., WhatsApp).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Term; Suspension; Termination</h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>13.1 Term.</strong> These Terms apply from your first use and continue until terminated.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>13.2 Our Rights.</strong> We may suspend or terminate access immediately for any reason, including suspected fraud, policy violations, IP infringement, or legal/regulatory requests.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>13.3 Your Rights.</strong> You may stop using the Platform at any time.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>13.4 Survival.</strong> Sections 5–17 survive termination.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Global Compliance</h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>14.1 Sanctions/Export.</strong> You represent you are not located in, under control of, or a national/resident of any sanctioned territory or listed person; you will not use the Platform in violation of <strong>OFAC</strong>, <strong>EU/UK</strong>, <strong>Canadian</strong>, or other applicable sanctions/export laws.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>14.2 Anti-Corruption.</strong> You will comply with anti-bribery laws (e.g., <strong>CFPOA</strong>, <strong>FCPA</strong>, <strong>UK Bribery Act</strong>).
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>14.3 Consumer Law.</strong> Sellers must comply with local consumer protection and product safety laws in every market they sell into; nothing in these Terms limits non-waivable consumer rights.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Communications; E-Signatures</h2>
              <p className="text-gray-700 leading-relaxed">
                By creating an account, you consent to receive service, transactional, and legal notices electronically (email, in-app, or messaging). Electronic signatures and records associated with the Platform are legally binding to the extent permitted by law. Marketing communications require appropriate consent; you may opt out as provided in those messages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. App Stores, APIs & Rate Limits</h2>
              <p className="text-gray-700 leading-relaxed">
                If you access any app store or use our APIs/SDKs, you agree to their additional terms. We may set rate limits, revoke keys, or audit usage for compliance and security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Dispute Resolution; Governing Law</h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Default (Canada).</strong> These Terms are governed by the laws of <strong>Alberta, Canada</strong>, without regard to conflicts of laws. The courts of <strong>Calgary, Alberta</strong> have exclusive jurisdiction, <strong>or</strong> disputes may be finally resolved by binding arbitration under the rules of the <strong>ADR Institute of Canada</strong> seated in <strong>Calgary, Alberta</strong>. <strong>You waive any right to a jury trial and to participate in class actions</strong>, to the extent permitted by law.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Injunctive Relief.</strong> Either party may seek injunctive relief in court for actual or threatened misuse of IP or confidential information.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Miscellaneous</h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>18.1 Entire Agreement.</strong> These Terms and referenced policies are the entire agreement between you and us.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>18.2 Updates.</strong> We may update these Terms by posting the revised version with a new "Last Updated" date. For material changes, we will provide reasonable notice. Continued use means acceptance.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>18.3 Assignment.</strong> You may not assign without our consent. We may assign to an affiliate or in connection with a merger/acquisition/sale.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>18.4 Severability.</strong> If any provision is unenforceable, the remainder remains in effect.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>18.5 No Waiver.</strong> A failure to enforce is not a waiver.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>18.6 Force Majeure.</strong> We are not liable for delays/failures due to events beyond reasonable control (e.g., outages, strikes, acts of God, war, regulatory actions).
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>18.7 Contact.</strong> <strong>ShopLynk.app Legal</strong> — <strong>legal@shoplynk.app</strong> — <strong>[address]</strong>.
                </p>
              </div>
            </section>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">19. Policies Incorporated by Reference</h3>
              <p className="text-blue-800 text-sm">
                Additional policies may be published separately and are incorporated by reference into these Terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}