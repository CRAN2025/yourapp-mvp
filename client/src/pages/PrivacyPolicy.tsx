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
              <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
            </div>
            <p className="text-green-100">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="w-6 h-6 text-blue-600 mr-2" />
                1. Information We Collect
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Account Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Email address and phone number (for account creation)</li>
                    <li>Profile information (name, business details)</li>
                    <li>Authentication credentials (securely hashed)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Store and Product Data</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Product listings, descriptions, and images</li>
                    <li>Store configuration and branding</li>
                    <li>Order and inventory information</li>
                    <li>Customer communication preferences</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Usage Analytics</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Page views and user interactions</li>
                    <li>Feature usage patterns</li>
                    <li>Performance metrics and error logs</li>
                    <li>Device and browser information</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-6 h-6 text-purple-600 mr-2" />
                2. How We Use Your Information
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">We use collected information to:</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Service Delivery</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Provide and maintain your storefront</li>
                      <li>• Process orders and transactions</li>
                      <li>• Enable WhatsApp integration</li>
                      <li>• Provide customer analytics</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Communication</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Send service notifications</li>
                      <li>• Provide technical support</li>
                      <li>• Share product updates</li>
                      <li>• Respond to inquiries</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Improvement</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Analyze service usage</li>
                      <li>• Develop new features</li>
                      <li>• Fix bugs and issues</li>
                      <li>• Optimize performance</li>
                    </ul>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">Legal Compliance</h4>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• Prevent fraud and abuse</li>
                      <li>• Comply with regulations</li>
                      <li>• Enforce terms of service</li>
                      <li>• Protect user rights</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. WhatsApp Integration Privacy</h2>
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <p className="text-green-800 leading-relaxed mb-3">
                  <strong>Important:</strong> Our WhatsApp integration creates direct links between you and your customers. 
                  We do not store, monitor, or have access to your WhatsApp conversations.
                </p>
                <ul className="list-disc list-inside text-green-700 space-y-1 ml-4">
                  <li>All WhatsApp messages remain private between you and your customers</li>
                  <li>We only provide the technical link to initiate conversations</li>
                  <li>WhatsApp's own privacy policy governs all message content</li>
                  <li>You control all customer communications directly</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="w-6 h-6 text-red-600 mr-2" />
                4. Data Security
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  We implement industry-standard security measures to protect your data:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Encryption</h4>
                    <p className="text-sm text-gray-700">All data transmitted using TLS encryption. Sensitive data encrypted at rest.</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Access Control</h4>
                    <p className="text-sm text-gray-700">Role-based access with multi-factor authentication for admin functions.</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Monitoring</h4>
                    <p className="text-sm text-gray-700">24/7 security monitoring and automated threat detection systems.</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Backups</h4>
                    <p className="text-sm text-gray-700">Regular encrypted backups with disaster recovery procedures.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, rent, or trade your personal information. We may share data only in these limited circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Trusted third parties who help operate our service (cloud hosting, analytics)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect rights and safety</li>
                <li><strong>Business Transfer:</strong> In case of merger, acquisition, or sale of business assets</li>
                <li><strong>With Consent:</strong> When you explicitly authorize sharing for specific purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Privacy Rights</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">You have the right to:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-blue-800">
                    <li>• <strong>Access</strong> your personal data</li>
                    <li>• <strong>Correct</strong> inaccurate information</li>
                    <li>• <strong>Delete</strong> your account and data</li>
                    <li>• <strong>Export</strong> your data</li>
                  </ul>
                  <ul className="space-y-2 text-blue-800">
                    <li>• <strong>Restrict</strong> data processing</li>
                    <li>• <strong>Object</strong> to certain uses</li>
                    <li>• <strong>Withdraw</strong> consent</li>
                    <li>• <strong>File</strong> a complaint with authorities</li>
                  </ul>
                </div>
                <p className="text-blue-700 mt-4 text-sm">
                  To exercise these rights, contact us at privacy@shoplink.com
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We retain your data for different periods:</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Account Data</span>
                  <span className="text-sm text-gray-600">Until account deletion + 30 days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Transaction Records</span>
                  <span className="text-sm text-gray-600">7 years (legal requirement)</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Analytics Data</span>
                  <span className="text-sm text-gray-600">Anonymized, 2 years</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Support Communications</span>
                  <span className="text-sm text-gray-600">3 years</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your data may be processed in countries other than your residence. We ensure adequate protection 
                through appropriate safeguards such as standard contractual clauses and adequacy decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our service is not intended for children under 16. We do not knowingly collect personal information 
                from children. If you believe we have collected data from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Policy Updates</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this privacy policy to reflect changes in our practices or for legal, operational, 
                or regulatory reasons. We will notify you of significant changes via email or through our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For privacy-related questions or concerns, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg space-y-2">
                <p className="font-semibold text-gray-900">Privacy Team</p>
                <p className="text-gray-700">Email: privacy@shoplink.com</p>
                <p className="text-gray-700">Address: [Your Business Address]</p>
                <p className="text-gray-700">Response Time: Within 48 hours</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}