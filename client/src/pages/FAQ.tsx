import { ArrowLeft, HelpCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useState } from 'react';

export default function FAQ() {
  const [, navigate] = useLocation();
  const [showFAQ, setShowFAQ] = useState(-1);

  const faqs = [
    { q: "How quickly can I set up my store?", a: "Most users have their store ready in under 5 minutes. Just add your products, customize your storefront, and share your link!" },
    { q: "Is WhatsApp integration really free?", a: "Yes! WhatsApp integration is completely free. We simply provide direct links to start conversations with your customers." },
    { q: "Do I need technical skills?", a: "Not at all! Our platform is designed for everyone. If you can send a text message, you can create a store." },
    { q: "How does WhatsApp integration work?", a: "We generate direct WhatsApp links for each product. When customers click 'Order via WhatsApp', it opens a chat with you pre-filled with product details." },
    { q: "Can I customize my store design?", a: "Yes! Upload your logo, choose colors, add cover images, and personalize your store description to match your brand." },
    { q: "What payment methods can I accept?", a: "You can arrange payment directly with customers via WhatsApp - cash on delivery, bank transfer, mobile money, or any method you prefer." },
    { q: "Can I track my orders and analytics?", a: "Absolutely! Get detailed insights on page views, product popularity, customer interactions, and order tracking through our dashboard." },
    { q: "Is there a limit to products I can add?", a: "No limits during beta! Add unlimited products, categories, and images to showcase your full catalog." },
    { q: "Can I use my own domain?", a: "Custom domains are available with our Pro plan, coming soon. For now, you get a shoplink.com subdomain." },
    { q: "What happens after the beta period?", a: "We'll offer affordable pricing plans starting at just $9/month. Early users get exclusive discounts and priority support." },
    { q: "Do you support multiple languages?", a: "Currently we support English, with Spanish, French, and Arabic coming soon. Your store content can be in any language." },
    { q: "Can I manage inventory?", a: "Yes! Track stock levels, mark items as out of stock, and get notifications when inventory is low." },
    { q: "What about customer support?", a: "We provide email support, live chat (coming soon), and a comprehensive help center. Pro users get priority support." },
    { q: "Is my data secure?", a: "Absolutely! We use industry-standard encryption, secure hosting, and follow strict privacy policies to protect your business data." },
    { q: "Can I export my data?", a: "Yes! You can export your products, orders, and customer data anytime. We believe your data belongs to you." },
    { q: "Do you offer refunds?", a: "We offer a 30-day money-back guarantee on all paid plans. No questions asked if you're not satisfied." }
  ];

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
            <div className="flex items-center mb-4">
              <HelpCircle className="w-8 h-8 text-white mr-3" />
              <h1 className="text-3xl font-bold text-white">Frequently Asked Questions</h1>
            </div>
            <p className="text-blue-100">Everything you need to know about ShopLynk</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-8">
              <p className="text-blue-800 leading-relaxed">
                Can't find what you're looking for? <a href="/support" className="underline hover:text-blue-900 font-medium">Contact our support team</a> and we'll be happy to help!
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div 
                  key={i} 
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setShowFAQ(showFAQ === i ? -1 : i)}
                    onKeyDown={(e) => e.key === 'Enter' && setShowFAQ(showFAQ === i ? -1 : i)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={showFAQ === i}
                    data-testid={`faq-question-${i}`}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900 pr-4">
                        {faq.q}
                      </h3>
                      <span 
                        className="text-2xl text-blue-600 transition-transform duration-200 flex-shrink-0"
                        style={{ transform: showFAQ === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
                      >
                        +
                      </span>
                    </div>
                    {showFAQ === i && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-gray-700 leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Section */}
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h2>
              <p className="text-gray-700 mb-6">
                Our support team is here to help you succeed. Get in touch and we'll respond within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="/support" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  data-testid="button-contact-support"
                >
                  Contact Support
                </a>
                <a 
                  href="mailto:brock1kai@gmail.com" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                  data-testid="button-email-support"
                >
                  Contact us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}