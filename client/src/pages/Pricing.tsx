import { ArrowLeft, Check, Star, Crown, Zap } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Pricing() {
  const [, navigate] = useLocation();

  const plans = [
    {
      name: 'Free Beta',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started and testing the waters',
      features: [
        'Up to 50 products',
        'WhatsApp integration',
        'Basic analytics',
        'Community support',
        'ShopLynk subdomain',
        'Basic customization',
        'Mobile-responsive design',
        'SSL security included'
      ],
      highlight: false,
      badge: 'Current',
      badgeColor: 'bg-green-500',
      available: true,
      ctaText: 'Start Free',
      popular: false
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/month',
      description: 'For serious sellers ready to scale their business',
      features: [
        'Unlimited products',
        'Advanced WhatsApp integration',
        'Custom branding & logo',
        'Advanced analytics dashboard',
        'Priority email support',
        'Custom domain included',
        'Inventory management',
        'Multi-language support',
        'Export data & reports',
        'Remove ShopLynk branding'
      ],
      highlight: true,
      badge: 'Most Popular',
      badgeColor: 'bg-blue-500',
      available: false,
      ctaText: 'Coming Soon',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      description: 'For large businesses and agencies managing multiple stores',
      features: [
        'Everything in Pro',
        'Multi-store management',
        'API access',
        'Dedicated account manager',
        'Custom integrations',
        'White-label solution',
        'Advanced user roles',
        'Bulk product import/export',
        'Custom reporting',
        'Phone support',
        'SLA guarantee'
      ],
      highlight: false,
      badge: 'Enterprise',
      badgeColor: 'bg-purple-500',
      available: false,
      ctaText: 'Contact Sales',
      popular: false
    }
  ];

  const faqs = [
    {
      q: "What happens after the free beta period?",
      a: "The free beta will transition to our Free plan with slightly reduced features. All existing users will get grandfathered pricing and special discounts on paid plans."
    },
    {
      q: "Can I upgrade or downgrade anytime?",
      a: "Yes! You can change your plan at any time. Upgrades take effect immediately, downgrades take effect at your next billing cycle."
    },
    {
      q: "Do you offer refunds?",
      a: "We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, we'll refund your payment no questions asked."
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit cards, PayPal, and bank transfers for Enterprise plans. All payments are processed securely."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-6 py-12">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-white hover:text-blue-100 mb-6 transition-colors"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Start free, upgrade when you're ready. No hidden fees, no surprises.
              </p>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="px-6 py-12">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border-2 p-8 ${
                    plan.highlight 
                      ? 'border-blue-500 bg-blue-50 transform scale-105' 
                      : 'border-gray-200 bg-white'
                  } transition-all hover:shadow-lg`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${plan.badgeColor} text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1`}>
                      {plan.popular && <Star className="w-4 h-4" />}
                      {plan.name === 'Enterprise' && <Crown className="w-4 h-4" />}
                      {plan.name === 'Free Beta' && <Zap className="w-4 h-4" />}
                      {plan.badge}
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-1">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => {
                      if (plan.available) {
                        navigate('/auth');
                      } else if (plan.name === 'Enterprise') {
                        window.location.href = 'mailto:sales@shoplynk.app?subject=Enterprise Plan Inquiry';
                      }
                    }}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      plan.available 
                        ? plan.highlight
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!plan.available && plan.name !== 'Enterprise'}
                    data-testid={`button-${plan.name.toLowerCase().replace(' ', '-')}`}
                  >
                    {plan.ctaText}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Value Proposition */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Why Businesses Choose ShopLynk</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="font-bold text-gray-900 mb-2">5-Minute Setup</h3>
                  <p className="text-sm text-gray-600">Get online faster than any other platform</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">💬</div>
                  <h3 className="font-bold text-gray-900 mb-2">WhatsApp Native</h3>
                  <p className="text-sm text-gray-600">Built specifically for WhatsApp commerce</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">🚀</div>
                  <h3 className="font-bold text-gray-900 mb-2">No Coding Required</h3>
                  <p className="text-sm text-gray-600">Anyone can create a professional store</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">📱</div>
                  <h3 className="font-bold text-gray-900 mb-2">Mobile First</h3>
                  <p className="text-sm text-gray-600">Optimized for mobile shopping experience</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="px-6 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.q}</h3>
                    <p className="text-gray-700 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-gray-900 text-white px-6 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Need a Custom Solution?</h2>
              <p className="text-xl text-gray-300 mb-8">
                Large business or unique requirements? Let's talk about a custom plan that fits your needs.
              </p>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <a
                  href="mailto:sales@shoplynk.app?subject=Custom Plan Inquiry"
                  className="inline-block w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  data-testid="button-contact-sales"
                >
                  Contact Sales
                </a>
                <button
                  onClick={() => navigate('/support')}
                  className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-gray-900 transition-colors"
                  data-testid="button-support"
                >
                  Get Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}