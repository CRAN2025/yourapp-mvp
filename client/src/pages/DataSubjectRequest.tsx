import { ArrowLeft, Shield, User, FileText, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useState } from 'react';

export default function DataSubjectRequest() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    relation: '',
    request_type: [] as string[],
    details: '',
    verification: '',
    agent: false,
    truth: false,
    contact_ok: false
  });

  const handleRequestTypeChange = (value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      request_type: checked 
        ? [...prev.request_type, value]
        : prev.request_type.filter(type => type !== value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would submit to your backend
    alert('Request submitted! You will receive a confirmation email shortly.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-8">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-white hover:text-purple-100 mb-4 transition-colors"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
            <div className="flex items-center mb-4">
              <Shield className="w-8 h-8 text-white mr-3" />
              <h1 className="text-3xl font-bold text-white">Data Subject Rights Request</h1>
            </div>
            <p className="text-purple-100">Last Updated: August 24, 2025</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded mb-8">
              <p className="text-purple-800 leading-relaxed">
                Use this form to request access, correction, deletion, portability, restriction/objection, or opt-out of certain processing. We may need additional information to verify your identity and relationship to ShopLynk.app.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Identity Section */}
              <fieldset className="border border-gray-200 rounded-lg p-6">
                <legend className="px-3 py-1 bg-white text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Identity
                </legend>
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                      Country/Region <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      placeholder="e.g., Canada, Germany"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      data-testid="input-country"
                    />
                  </div>
                  <div>
                    <label htmlFor="relation" className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship to ShopLynk <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="relation"
                      name="relation"
                      required
                      value={formData.relation}
                      onChange={(e) => setFormData(prev => ({ ...prev, relation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      data-testid="select-relation"
                    >
                      <option value="">Select one</option>
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                      <option value="visitor">Visitor</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Request Type Section */}
              <fieldset className="border border-gray-200 rounded-lg p-6">
                <legend className="px-3 py-1 bg-white text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Request Type
                </legend>
                <div className="mt-4 space-y-3">
                  {[
                    { value: 'access', label: 'Access my data' },
                    { value: 'correction', label: 'Correct inaccurate data' },
                    { value: 'deletion', label: 'Delete my data' },
                    { value: 'portability', label: 'Data portability' },
                    { value: 'restriction', label: 'Restrict processing' },
                    { value: 'objection', label: 'Object to processing' },
                    { value: 'optout_ads', label: 'Opt out of targeted advertising / sharing' },
                    { value: 'withdraw_consent', label: 'Withdraw consent' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="request_type"
                        value={option.value}
                        checked={formData.request_type.includes(option.value)}
                        onChange={(e) => handleRequestTypeChange(option.value, e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        data-testid={`checkbox-${option.value}`}
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-6">
                  <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-2">
                    Details of your request
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    rows={4}
                    placeholder="Describe your request (what data, relevant dates, any additional info)"
                    value={formData.details}
                    onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    data-testid="textarea-details"
                  />
                </div>
              </fieldset>

              {/* Verification Section */}
              <fieldset className="border border-gray-200 rounded-lg p-6">
                <legend className="px-3 py-1 bg-white text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Verification & Authorization
                </legend>
                <div className="mt-4">
                  <label htmlFor="verification" className="block text-sm font-medium text-gray-700 mb-2">
                    Identity verification details
                  </label>
                  <textarea
                    id="verification"
                    name="verification"
                    rows={3}
                    placeholder="Provide information to help us verify your identity (do not send full ID numbers)"
                    value={formData.verification}
                    onChange={(e) => setFormData(prev => ({ ...prev, verification: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    data-testid="textarea-verification"
                  />
                </div>
                <div className="mt-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agent"
                      checked={formData.agent}
                      onChange={(e) => setFormData(prev => ({ ...prev, agent: e.target.checked }))}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-0.5"
                      data-testid="checkbox-agent"
                    />
                    <span className="text-sm text-gray-700">
                      I am an authorized agent submitting on behalf of the data subject
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 mt-2 ml-7">
                    If you are an agent, upload the authorization to your request or provide details above. We may contact the data subject to verify.
                  </p>
                </div>
              </fieldset>

              {/* Declarations Section */}
              <fieldset className="border border-gray-200 rounded-lg p-6">
                <legend className="px-3 py-1 bg-white text-lg font-semibold text-gray-900">
                  Declarations
                </legend>
                <div className="mt-4 space-y-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="truth"
                      required
                      checked={formData.truth}
                      onChange={(e) => setFormData(prev => ({ ...prev, truth: e.target.checked }))}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-0.5"
                      data-testid="checkbox-truth"
                    />
                    <span className="text-sm text-gray-700">
                      I declare the information in this request is accurate and that I am entitled to make this request. <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="contact_ok"
                      required
                      checked={formData.contact_ok}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_ok: e.target.checked }))}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-0.5"
                      data-testid="checkbox-contact"
                    />
                    <span className="text-sm text-gray-700">
                      I consent to ShopLynk using the details provided to contact me about this request. <span className="text-red-500">*</span>
                    </span>
                  </label>
                </div>
              </fieldset>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  data-testid="button-submit"
                >
                  Submit Request
                </button>
                <button
                  type="reset"
                  onClick={() => setFormData({
                    name: '', email: '', country: '', relation: '', request_type: [],
                    details: '', verification: '', agent: false, truth: false, contact_ok: false
                  })}
                  className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  data-testid="button-clear"
                >
                  Clear
                </button>
              </div>
            </form>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Need help? <a href="mailto:brock1kai@gmail.com" className="text-purple-600 hover:text-purple-800 underline">Contact us</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}