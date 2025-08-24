import { ArrowLeft, Cookie, Settings, Eye, Shield } from 'lucide-react';
import { useLocation } from 'wouter';

export default function CookiePolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-8">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-white hover:text-orange-100 mb-4 transition-colors"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
            <div className="flex items-center mb-4">
              <Cookie className="w-8 h-8 text-white mr-3" />
              <h1 className="text-3xl font-bold text-white">ShopLynk.app — Cookie & Similar Technologies Policy</h1>
            </div>
            <p className="text-orange-100">Last Updated: August 24, 2025</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
              <p className="text-orange-800 leading-relaxed">
                This Cookie Policy explains how ShopLynk.app ("ShopLynk", "we", "us") uses cookies, SDKs, pixels, and similar technologies on our websites and services ("Sites"). It should be read with our <strong>Privacy Policy</strong>.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="w-6 h-6 text-blue-600 mr-2" />
                What Are Cookies?
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Cookies are small files stored on your device. Similar technologies (pixels, local storage, SDKs) help us recognize your device, remember preferences, and measure usage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-6 h-6 text-purple-600 mr-2" />
                Why We Use Them
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2">Strictly Necessary</h3>
                  <p className="text-sm text-red-800">
                    Required for core functionality (e.g., login, load balancing, security).
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Functional/Preferences</h3>
                  <p className="text-sm text-blue-800">
                    Remember choices (e.g., language).
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Analytics/Performance</h3>
                  <p className="text-sm text-green-800">
                    Understand how Sites are used to improve them.
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">Advertising/Marketing</h3>
                  <p className="text-sm text-purple-800">
                    Measure campaigns and, where permitted, show relevant ads about our services; we do not permit third parties to advertise their products to your users through our Platform.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookie Table (Examples)</h2>
              <p className="text-gray-600 text-sm mb-4 italic">
                Replace or supplement with the cookies/SDKs you actually use.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Name / Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Purpose</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Strictly Necessary</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">session_id (ShopLynk)</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Maintain session/login</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Session</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Strictly Necessary</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">csrf_token (ShopLynk)</td>
                      <td className="px-6 py-4 text-sm text-gray-700">CSRF protection</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Session</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Functional</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">locale (ShopLynk)</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Store language</td>
                      <td className="px-6 py-4 text-sm text-gray-700">6 months</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Analytics</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">_ga / Google Analytics [example]</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Site analytics</td>
                      <td className="px-6 py-4 text-sm text-gray-700">13 months</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Analytics</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">_gid / Google Analytics [example]</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Site analytics</td>
                      <td className="px-6 py-4 text-sm text-gray-700">24 hours</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Marketing</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">fbp / Meta Pixel [example]</td>
                      <td className="px-6 py-4 text-sm text-gray-700">Campaign measurement</td>
                      <td className="px-6 py-4 text-sm text-gray-700">90 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mt-6">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> If you use Firebase/Google Analytics or similar SDKs in apps, disclose them here and in the Privacy Policy. Ensure you have consent where required.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 text-green-600 mr-2" />
                Consent & Cookie Preferences
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Where required (e.g., EU/UK), we obtain <strong>consent</strong> before setting non-essential cookies/SDKs. You can change or withdraw consent at any time using <strong>Cookie Preferences</strong>. Essential cookies cannot be disabled.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We also honor browser-based <strong>Global Privacy Control (GPC)</strong> signals for opt-outs where required.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                You can manage cookies in your browser settings. Blocking essential cookies may break certain features. We provide a Cookie Preferences panel to adjust Analytics/Marketing settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Cookie Policy. The "Last Updated" date shows the latest revision.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
              <div className="bg-gray-50 p-6 rounded-lg space-y-2">
                <p className="font-semibold text-gray-900">ShopLynk.app Privacy Team</p>
                <p className="text-gray-700"><strong>Email:</strong> privacy@shoplynk.app</p>
                <p className="text-gray-700"><strong>Address:</strong> [registered address, city, country]</p>
              </div>
            </section>

            <div className="bg-orange-50 border-l-4 border-orange-400 p-6 rounded">
              <h3 className="text-lg font-semibold text-orange-900 mb-4">Consent Banner Copy (Paste-Ready)</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-orange-900 mb-2">Short banner:</h4>
                  <div className="bg-white p-3 rounded border text-sm">
                    We use cookies to run our site, improve performance, and, with your consent, for analytics and marketing. Click "Accept all" to consent or "Cookie settings" to manage your choices.
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-orange-900 mb-2">Buttons:</h4>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-green-600 text-white text-sm rounded">Accept all</span>
                    <span className="px-3 py-1 bg-gray-600 text-white text-sm rounded">Reject non-essential</span>
                    <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded">Cookie settings</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-orange-900 mb-2">Granular panel labels:</h4>
                  <ul className="list-disc list-inside text-orange-800 space-y-1 ml-4 text-sm">
                    <li>Strictly necessary (always on)</li>
                    <li>Functional (on/off)</li>
                    <li>Analytics (on/off)</li>
                    <li>Marketing (on/off)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-orange-900 mb-2">GPC notice (EU/UK):</h4>
                  <div className="bg-white p-3 rounded border text-sm">
                    We honor Global Privacy Control (GPC) signals. If detected, we will treat it as a request to opt out of advertising cookies.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}