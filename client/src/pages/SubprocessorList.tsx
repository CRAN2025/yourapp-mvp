import { ArrowLeft, Server, Globe, Shield, FileText } from 'lucide-react';
import { useLocation } from 'wouter';

export default function SubprocessorList() {
  const [, navigate] = useLocation();

  const subprocessors = [
    {
      provider: 'Google Cloud / Firebase',
      country: 'USA / Global',
      purpose: 'Hosting, database, storage, auth',
      dataTypes: 'Account data, usage metadata, storefront data',
      transferMechanism: 'SCCs + UK Addendum',
      status: 'example'
    },
    {
      provider: 'Google Analytics',
      country: 'USA / Global', 
      purpose: 'Site analytics',
      dataTypes: 'Usage data, device data',
      transferMechanism: 'SCCs + UK Addendum',
      status: 'example'
    },
    {
      provider: 'SendGrid/Postmark',
      country: 'USA',
      purpose: 'Transactional email',
      dataTypes: 'Email, names',
      transferMechanism: 'SCCs + UK Addendum',
      status: 'example'
    },
    {
      provider: 'Sentry/Log service',
      country: 'USA / EU',
      purpose: 'Error monitoring',
      dataTypes: 'Logs with pseudonymous IDs',
      transferMechanism: 'SCCs + UK Addendum',
      status: 'example'
    },
    {
      provider: 'Intercom/Helpdesk',
      country: 'USA / EU',
      purpose: 'Support & CRM',
      dataTypes: 'Contact details, tickets',
      transferMechanism: 'SCCs + UK Addendum',
      status: 'example'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-8">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-white hover:text-teal-100 mb-4 transition-colors"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
            <div className="flex items-center mb-4">
              <Server className="w-8 h-8 text-white mr-3" />
              <h1 className="text-3xl font-bold text-white">ShopLynk.app — Sub-processor List</h1>
            </div>
            <p className="text-teal-100">Last Updated: August 24, 2025</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            <div className="bg-teal-50 border-l-4 border-teal-400 p-4 rounded">
              <p className="text-teal-800 leading-relaxed">
                ShopLynk uses the following third-party service providers ("<strong>Sub-processors</strong>") to support delivery of our services. We require all Sub-processors to enter into written agreements with data protection commitments.
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-yellow-800 text-sm italic">
                <strong>Note:</strong> Replace placeholders and examples with your actual vendors before publishing.
              </p>
            </div>

            {/* Sub-processors Table */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <FileText className="w-6 h-6 text-teal-600 mr-2" />
                Current Sub-processors
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Purpose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Data Types
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Transfer Mechanism
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {subprocessors.map((processor, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {processor.provider}
                              </div>
                              {processor.status === 'example' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Example
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Globe className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{processor.country}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{processor.purpose}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{processor.dataTypes}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-sm text-gray-900">{processor.transferMechanism}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Notifications Section */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Notifications of Changes</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-blue-800 leading-relaxed">
                  We will update this page for any new Sub-processors and provide Customer notice where contractually required. Customers may object on reasonable data-protection grounds; if unresolved, the affected service can be terminated as set out in the DPA.
                </p>
              </div>
            </section>

            {/* Legend Section */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Transfer Mechanisms</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">SCCs</h3>
                  <p className="text-sm text-green-800">
                    EU Standard Contractual Clauses (2021/914) for lawful data transfers outside the EEA.
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">UK Addendum</h3>
                  <p className="text-sm text-green-800">
                    ICO-approved International Data Transfer Addendum (IDTA) for UK data transfers.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
              <div className="bg-teal-50 p-6 rounded-lg">
                <p className="text-teal-800">
                  <strong>Privacy Team:</strong> <a href="mailto:brock1kai@gmail.com" className="underline hover:text-teal-900">Contact us</a>
                </p>
              </div>
            </section>

            {/* Quick Actions */}
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Related Pages</h3>
              <div className="space-y-2">
                <p className="text-gray-800">
                  <a href="/gdpr" className="inline-flex items-center text-teal-600 hover:text-teal-800 underline">
                    <Shield className="w-4 h-4 mr-1" />
                    GDPR Compliance Statement
                  </a>
                </p>
                <p className="text-gray-800">
                  <a href="/privacy" className="inline-flex items-center text-teal-600 hover:text-teal-800 underline">
                    <FileText className="w-4 h-4 mr-1" />
                    Privacy Policy
                  </a>
                </p>
                <p className="text-gray-800">
                  <a href="/data-request" className="inline-flex items-center text-teal-600 hover:text-teal-800 underline">
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