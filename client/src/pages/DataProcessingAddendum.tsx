import { ArrowLeft, FileText, Shield, Users, Lock, Globe } from 'lucide-react';
import { useLocation } from 'wouter';

export default function DataProcessingAddendum() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-8">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-white hover:text-slate-100 mb-4 transition-colors"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
            <div className="flex items-center mb-4">
              <FileText className="w-8 h-8 text-white mr-3" />
              <h1 className="text-3xl font-bold text-white">ShopLynk.app — Data Processing Addendum (DPA)</h1>
            </div>
            <p className="text-slate-100">Last Updated: August 24, 2025</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            <div className="bg-slate-50 border-l-4 border-slate-400 p-4 rounded">
              <p className="text-slate-800 leading-relaxed">
                This Data Processing Addendum ("<strong>DPA</strong>") forms part of the Terms of Use or other agreement between <strong>[ShopLynk Technologies Inc./Ltd.]</strong> ("<strong>ShopLynk</strong>", "<strong>Processor</strong>") and <strong>[Seller legal name]</strong> ("<strong>Customer</strong>", "<strong>Controller</strong>") governing Customer's use of ShopLynk's services (the "<strong>Agreement</strong>").
              </p>
              <p className="text-slate-800 leading-relaxed mt-3">
                If there is a conflict between this DPA and the Agreement, this DPA controls to the extent of the conflict regarding processing of Personal Data.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Definitions</h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  "<strong>Data Protection Laws</strong>" means all laws and regulations applicable to the processing of Personal Data under this DPA, including GDPR (EU/UK), LGPD (Brazil), and applicable US state laws.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  "<strong>Personal Data</strong>" means any information relating to an identified or identifiable natural person processed by ShopLynk on behalf of Customer.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  "<strong>Sub-processor</strong>" means a third party engaged by ShopLynk to process Personal Data.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Other capitalized terms have the meanings in the Agreement or Data Protection Laws.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-6 h-6 text-blue-600 mr-2" />
                2. Scope & Roles
              </h2>
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  (a) ShopLynk will process Personal Data <strong>solely</strong> on documented instructions from Customer to provide the services described in the Agreement.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  (b) Customer is the <strong>Controller</strong> and ShopLynk is the <strong>Processor</strong> (or <strong>Service Provider/Contractor</strong> under US state laws).
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Customer Instructions</h2>
              <p className="text-gray-700 leading-relaxed">
                ShopLynk will process Personal Data only: (i) to provide and improve the services; (ii) as documented in this DPA; (iii) as further instructed in writing by Customer (provided such instructions are lawful). ShopLynk will promptly inform Customer if it cannot follow an instruction due to legal or practical reasons.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Confidentiality</h2>
              <p className="text-gray-700 leading-relaxed">
                ShopLynk will ensure persons authorized to process Personal Data are bound by confidentiality obligations and receive appropriate privacy/security training.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="w-6 h-6 text-red-600 mr-2" />
                5. Security
              </h2>
              <p className="text-gray-700 leading-relaxed">
                ShopLynk implements appropriate technical and organizational measures to protect Personal Data (encryption in transit, access controls, logging, backups, vulnerability management, employee access on least-privilege). A current overview of measures is provided in <strong>Annex II</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Sub-processing</h2>
              <p className="text-gray-700 leading-relaxed">
                Customer authorizes ShopLynk to use Sub-processors listed at <a href="/subprocessors" className="text-slate-600 hover:text-slate-800 underline"><strong>Sub-processor List</strong></a> and to engage replacements/additions with prior notice. ShopLynk will impose data protection terms no less protective than this DPA and remains responsible for Sub-processors' performance. Customer may subscribe to change notices and object on reasonable grounds related to data protection; if unresolved, Customer may terminate the affected service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Subject Requests</h2>
              <p className="text-gray-700 leading-relaxed">
                Taking into account the nature of processing, ShopLynk will assist Customer by appropriate technical and organizational measures in fulfilling data subject requests (access, correction, deletion, portability, restriction/objection) under applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Assistance & DPIAs</h2>
              <p className="text-gray-700 leading-relaxed">
                ShopLynk will provide reasonable assistance to Customer with data protection impact assessments (DPIAs) and consultations with supervisory authorities, considering the nature of processing and information available to ShopLynk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 text-orange-600 mr-2" />
                9. Personal Data Breach
              </h2>
              <p className="text-gray-700 leading-relaxed">
                ShopLynk will notify Customer <strong>without undue delay</strong> after becoming aware of a Personal Data Breach affecting Customer Personal Data and provide information reasonably required for Customer to meet its breach notification obligations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="w-6 h-6 text-green-600 mr-2" />
                10. International Transfers
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Where ShopLynk or its Sub-processors transfer Personal Data outside the EEA/UK, ShopLynk will ensure a lawful transfer mechanism is in place (e.g., <strong>EU SCCs (2021/914)</strong> Module 2/3, and for the UK, the <strong>ICO Addendum</strong> or <strong>IDTA</strong>). The SCCs and UK Addendum are incorporated by reference and will prevail to the extent of conflict.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Return & Deletion</h2>
              <p className="text-gray-700 leading-relaxed">
                Upon termination or expiry of the services, upon Customer request, ShopLynk will return or delete Customer Personal Data, unless storage is required by law. If deletion is not feasible, ShopLynk will securely isolate and protect the data from further processing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Audits</h2>
              <p className="text-gray-700 leading-relaxed">
                ShopLynk will make available information necessary to demonstrate compliance with this DPA and will allow for <strong>reasonable</strong> audits by Customer or an independent auditor under appropriate confidentiality, not more than once annually (unless required by a regulator or after a material incident). ShopLynk may satisfy this obligation by providing industry-standard third-party reports (e.g., SOC 2, ISO 27001) where available.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                The liability provisions of the Agreement apply to this DPA. To the extent permitted by law, any liability arising under this DPA is subject to the limitations and exclusions set out in the Agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Duration</h2>
              <p className="text-gray-700 leading-relaxed">
                This DPA remains in effect while ShopLynk processes Personal Data on behalf of Customer.
              </p>
            </section>

            {/* Annexes */}
            <div className="space-y-8 pt-8 border-t border-gray-200">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Annex I — Processing Details</h2>
                <div className="bg-blue-50 p-6 rounded-lg space-y-3">
                  <p className="text-blue-800"><strong>Subject Matter:</strong> Provision of the ShopLynk marketplace storefront and related services.</p>
                  <p className="text-blue-800"><strong>Nature & Purpose:</strong> Hosting product catalogs, enabling buyer-seller interactions (metadata), analytics, support, and security.</p>
                  <p className="text-blue-800"><strong>Categories of Data Subjects:</strong> Customer's end users (buyers), Customer personnel (seller admins), site visitors.</p>
                  <p className="text-blue-800"><strong>Categories of Personal Data:</strong> Contact details (name, email, phone), identifiers, device/usage data, storefront data. <strong>No special categories</strong> are intended.</p>
                  <p className="text-blue-800"><strong>Retention:</strong> As set out in the Privacy Policy and Agreement, or as instructed by Customer.</p>
                  <p className="text-blue-800"><strong>Instructions:</strong> Processing only as necessary to provide the services and as documented in the Agreement and this DPA.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Annex II — Security Measures (Overview)</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">Access Control</h3>
                    <p className="text-sm text-red-800">Role-based access, MFA for admin access, least-privilege, regular access reviews.</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Data Security</h3>
                    <p className="text-sm text-green-800">Encryption in transit (TLS), backups, key management with restricted access.</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">Application Security</h3>
                    <p className="text-sm text-purple-800">Secure SDLC, code reviews, dependency scanning, vulnerability management.</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-900 mb-2">Infrastructure Security</h3>
                    <p className="text-sm text-orange-800">Network segmentation, firewalls, DDoS protections, monitoring and logging.</p>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-teal-900 mb-2">Operational Security</h3>
                    <p className="text-sm text-teal-800">Incident response plan, change management, staff training, vendor risk management.</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-indigo-900 mb-2">Business Continuity</h3>
                    <p className="text-sm text-indigo-800">Regular backups, tested recovery procedures.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Annex III — Sub-processors</h2>
                <div className="bg-teal-50 p-4 rounded-lg">
                  <p className="text-teal-800">
                    See <a href="/subprocessors" className="underline hover:text-teal-900"><strong>Sub-processor List</strong></a> (kept up to date).
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Signatures</h2>
                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <div className="flex justify-between items-center border-b pb-4">
                    <span className="font-medium">Customer (Controller):</span>
                    <span className="text-gray-500">______________________ Date: ____________</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">ShopLynk (Processor):</span>
                    <span className="text-gray-500">______________________ Date: ____________</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Quick Links */}
            <div className="bg-slate-50 border-l-4 border-slate-400 p-4 rounded">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Related Documents</h3>
              <div className="space-y-2">
                <p className="text-slate-800">
                  <a href="/gdpr" className="inline-flex items-center text-slate-600 hover:text-slate-800 underline">
                    <Shield className="w-4 h-4 mr-1" />
                    GDPR Compliance Statement
                  </a>
                </p>
                <p className="text-slate-800">
                  <a href="/subprocessors" className="inline-flex items-center text-slate-600 hover:text-slate-800 underline">
                    <Users className="w-4 h-4 mr-1" />
                    Sub-processor List
                  </a>
                </p>
                <p className="text-slate-800">
                  <a href="/privacy" className="inline-flex items-center text-slate-600 hover:text-slate-800 underline">
                    <FileText className="w-4 h-4 mr-1" />
                    Privacy Policy
                  </a>
                </p>
                <p className="text-slate-800">
                  <a href="/data-request" className="inline-flex items-center text-slate-600 hover:text-slate-800 underline">
                    <FileText className="w-4 h-4 mr-1" />
                    Submit Data Request
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