import { ArrowLeft, Shield, Users, Lock, FileText, Globe } from 'lucide-react';
import { useLocation } from 'wouter';

export default function GDPRCompliance() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-8">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-white hover:text-indigo-100 mb-4 transition-colors"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
            <div className="flex items-center mb-4">
              <Shield className="w-8 h-8 text-white mr-3" />
              <h1 className="text-3xl font-bold text-white">ShopLynk.app — GDPR/UK GDPR Compliance Statement</h1>
            </div>
            <p className="text-indigo-100">Last Updated: August 24, 2025</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded">
              <p className="text-indigo-800 leading-relaxed">
                ShopLynk.app ("<strong>ShopLynk</strong>", "<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>") is committed to protecting personal data and complying with the EU General Data Protection Regulation (GDPR) and the UK GDPR.
              </p>
              <p className="text-indigo-800 leading-relaxed mt-3">
                This page summarizes how we meet key GDPR obligations. It should be read together with our <a href="/privacy" className="underline hover:text-indigo-900"><strong>Privacy Policy</strong></a>, <a href="/cookies" className="underline hover:text-indigo-900"><strong>Cookie Policy</strong></a>, and <strong>Data Processing Addendum (DPA)</strong>.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-6 h-6 text-blue-600 mr-2" />
                Roles
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Controller</strong> — ShopLynk acts as a controller for the personal data we collect to operate our Platform (e.g., account data, security logs, billing for subscriptions).</li>
                <li><strong>Processor/Service Provider</strong> — For certain features provided to Sellers (e.g., hosting product catalogs, analytics about storefront usage), ShopLynk acts on the Seller's instructions and under the <strong>DPA</strong>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-6 h-6 text-green-600 mr-2" />
                Lawful Bases
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We process personal data under the following legal bases: <strong>contract</strong>, <strong>legitimate interests</strong>, <strong>consent</strong>, and <strong>legal obligation</strong> (see our Privacy Policy for details).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 text-purple-600 mr-2" />
                Data Subject Rights
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                EU/UK users may request: <strong>access</strong>, <strong>correction</strong>, <strong>deletion</strong>, <strong>restriction</strong>, <strong>portability</strong>, and <strong>objection</strong> to certain processing. Where processing relies on <strong>consent</strong>, it may be withdrawn at any time.
              </p>
              <div className="bg-purple-50 p-4 rounded-lg">
                <ul className="list-disc list-inside text-purple-800 space-y-2 ml-4">
                  <li>Submit requests to <strong>privacy@shoplynk.app</strong> or via our <a href="/data-request" className="underline hover:text-purple-900"><strong>Data Subject Request Form</strong></a>.</li>
                  <li>We will verify identity and respond within the time limits required by law.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="w-6 h-6 text-orange-600 mr-2" />
                International Transfers
              </h2>
              <p className="text-gray-700 leading-relaxed">
                When personal data is transferred outside the EEA/UK, we use lawful transfer tools such as the <strong>EU Standard Contractual Clauses (SCCs, 2021/914)</strong> and, for the UK, the <strong>ICO-approved International Data Transfer Addendum</strong> (or IDTA), plus supplementary safeguards where appropriate.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Processors (Sub-processors)</h2>
              <p className="text-gray-700 leading-relaxed">
                We use vetted service providers for hosting, storage, analytics, support, and security. See our <strong>Sub-processor List</strong>. We require data protection terms and confidentiality commitments from all providers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="w-6 h-6 text-red-600 mr-2" />
                Security & Breach Response
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We implement technical and organizational measures appropriate to the risk (encryption in transit, access controls, logging, backup strategy). We follow an incident response plan and will notify regulators and affected individuals of data breaches as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies & Consent</h2>
              <p className="text-gray-700 leading-relaxed">
                We honor EU/UK cookie/ePrivacy rules. We obtain <strong>consent</strong> for non-essential cookies and support withdrawal via <strong>Cookie Preferences</strong>. We also honor <strong>Global Privacy Control (GPC)</strong> signals on our web properties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">EU/UK Representatives & DPO</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-gray-700"><strong>Data Protection Officer (if appointed):</strong> [Name / Contact]</p>
                <p className="text-gray-700"><strong>EU Representative (if applicable):</strong> [Company, Address, Email]</p>
                <p className="text-gray-700"><strong>UK Representative (if applicable):</strong> [Company, Address, Email]</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
              <div className="bg-indigo-50 p-6 rounded-lg space-y-2">
                <p className="font-semibold text-indigo-900">ShopLynk.app Privacy</p>
                <p className="text-indigo-800"><strong>Email:</strong> privacy@shoplynk.app</p>
                <p className="text-indigo-800"><strong>Address:</strong> [registered address, city, country]</p>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                You may lodge a complaint with your local supervisory authority (e.g., the <strong>ICO</strong> in the UK or the authority in your EEA member state).
              </p>
            </section>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <p className="text-blue-800">
                  <a href="/data-request" className="inline-flex items-center text-blue-600 hover:text-blue-800 underline">
                    <FileText className="w-4 h-4 mr-1" />
                    Submit Data Subject Request
                  </a>
                </p>
                <p className="text-blue-800">
                  <a href="/privacy" className="inline-flex items-center text-blue-600 hover:text-blue-800 underline">
                    <Shield className="w-4 h-4 mr-1" />
                    Read Privacy Policy
                  </a>
                </p>
                <p className="text-blue-800">
                  <a href="/cookies" className="inline-flex items-center text-blue-600 hover:text-blue-800 underline">
                    <Globe className="w-4 h-4 mr-1" />
                    Manage Cookie Preferences
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}