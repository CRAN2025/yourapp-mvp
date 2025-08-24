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
            <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
            <p className="text-blue-100 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using ShopLink ("Service"), you accept and agree to be bound by the terms and 
                provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ShopLink provides an e-commerce platform that enables users to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Create and manage online storefronts</li>
                <li>List and sell products or services</li>
                <li>Connect with customers through WhatsApp integration</li>
                <li>Process orders and manage inventory</li>
                <li>Access analytics and reporting tools</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Account Security</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You are responsible for maintaining the confidentiality of your account credentials and for all 
                    activities that occur under your account.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Content Guidelines</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Ensure all product information is accurate and truthful</li>
                    <li>Comply with all applicable laws and regulations</li>
                    <li>Respect intellectual property rights</li>
                    <li>Maintain professional communication with customers</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. WhatsApp Integration</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our WhatsApp integration service provides direct links to initiate conversations with your customers. 
                Please note:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>WhatsApp communications are subject to WhatsApp's terms of service</li>
                <li>We do not store or monitor WhatsApp conversations</li>
                <li>You are responsible for customer service via WhatsApp</li>
                <li>Comply with WhatsApp Business policies when applicable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payment and Pricing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Current pricing information is available on our website. We reserve the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Change pricing with 30 days notice to existing users</li>
                <li>Offer promotional pricing and discounts</li>
                <li>Suspend accounts for non-payment</li>
                <li>Provide refunds according to our refund policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Prohibited Uses</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You may not use our service for:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Illegal activities or promoting illegal products/services</li>
                <li>Spam, phishing, or fraudulent activities</li>
                <li>Infringing on intellectual property rights</li>
                <li>Harmful, offensive, or inappropriate content</li>
                <li>Circumventing our security measures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data and Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
                use, and protect your information. By using our service, you consent to our data practices as 
                described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                While we strive for 99.9% uptime, we cannot guarantee uninterrupted service. We may:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Perform scheduled maintenance with advance notice</li>
                <li>Experience unexpected downtime due to technical issues</li>
                <li>Temporarily suspend service for security reasons</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                ShopLink shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                resulting from your use of the service. Our total liability shall not exceed the amount paid by you 
                for the service in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Either party may terminate this agreement:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>With 30 days written notice</li>
                <li>Immediately for breach of terms</li>
                <li>Immediately for non-payment (after grace period)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of significant changes 
                via email or through our service. Continued use after changes constitutes acceptance of new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                Questions about these Terms of Service should be sent to us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="text-gray-800 font-medium">ShopLink Support</p>
                <p className="text-gray-700">Email: legal@shoplink.com</p>
                <p className="text-gray-700">Address: [Your Business Address]</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}