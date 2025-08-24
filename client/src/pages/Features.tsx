import { ArrowLeft, MessageCircle, Smartphone, BarChart3, Palette, Globe, Shield, Zap, Users, Store, Settings, TrendingUp } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Features() {
  const [, navigate] = useLocation();

  const featureCategories = [
    {
      title: "Store Creation & Management",
      icon: <Store className="w-8 h-8" />,
      color: "blue",
      features: [
        {
          icon: <Zap className="w-6 h-6" />,
          title: "5-Minute Setup",
          description: "Get your store online in minutes, not days. No technical skills required."
        },
        {
          icon: <Palette className="w-6 h-6" />,
          title: "Custom Branding",
          description: "Upload your logo, choose colors, add cover images, and match your brand perfectly."
        },
        {
          icon: <Settings className="w-6 h-6" />,
          title: "Unlimited Products",
          description: "Add unlimited products, categories, and images during our free beta period."
        },
        {
          icon: <Globe className="w-6 h-6" />,
          title: "Custom Domains",
          description: "Use your own domain name with Pro plans (coming soon). Currently includes shoplink.com subdomain."
        }
      ]
    },
    {
      title: "WhatsApp Integration",
      icon: <MessageCircle className="w-8 h-8" />,
      color: "green",
      features: [
        {
          icon: <Smartphone className="w-6 h-6" />,
          title: "Direct WhatsApp Links",
          description: "Every product gets a direct WhatsApp link that opens a pre-filled chat with product details."
        },
        {
          icon: <Users className="w-6 h-6" />,
          title: "Personal Customer Service",
          description: "Build relationships with direct customer communication through WhatsApp messaging."
        },
        {
          icon: <MessageCircle className="w-6 h-6" />,
          title: "Order Management",
          description: "Receive and manage orders directly through WhatsApp conversations."
        },
        {
          icon: <Globe className="w-6 h-6" />,
          title: "Global Reach",
          description: "WhatsApp is used worldwide - reach customers in any country with instant messaging."
        }
      ]
    },
    {
      title: "Analytics & Insights",
      icon: <BarChart3 className="w-8 h-8" />,
      color: "purple",
      features: [
        {
          icon: <TrendingUp className="w-6 h-6" />,
          title: "Real-time Analytics",
          description: "Track page views, product popularity, customer interactions, and sales performance."
        },
        {
          icon: <BarChart3 className="w-6 h-6" />,
          title: "Customer Insights",
          description: "Understand your customers better with detailed interaction and behavior analytics."
        },
        {
          icon: <Store className="w-6 h-6" />,
          title: "Product Performance",
          description: "See which products are most popular and optimize your inventory accordingly."
        },
        {
          icon: <Users className="w-6 h-6" />,
          title: "Visitor Tracking",
          description: "Monitor visitor traffic patterns and optimize your store for better conversion."
        }
      ]
    },
    {
      title: "Business Management",
      icon: <Settings className="w-8 h-8" />,
      color: "orange",
      features: [
        {
          icon: <Settings className="w-6 h-6" />,
          title: "Inventory Management",
          description: "Track stock levels, mark items as out of stock, and get low inventory notifications."
        },
        {
          icon: <Globe className="w-6 h-6" />,
          title: "Multi-language Support",
          description: "Create your store in any language. Platform supports English with more languages coming."
        },
        {
          icon: <Shield className="w-6 h-6" />,
          title: "Secure & Reliable",
          description: "Industry-standard security with reliable hosting and automated backups."
        },
        {
          icon: <Users className="w-6 h-6" />,
          title: "Customer Support",
          description: "Email support, help center, and upcoming live chat to help you succeed."
        }
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "from-blue-500 to-blue-600 text-blue-600 bg-blue-50 border-blue-200",
      green: "from-green-500 to-green-600 text-green-600 bg-green-50 border-green-200",
      purple: "from-purple-500 to-purple-600 text-purple-600 bg-purple-50 border-purple-200",
      orange: "from-orange-500 to-orange-600 text-orange-600 bg-orange-50 border-orange-200"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-12">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-white hover:text-blue-100 mb-6 transition-colors"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">Powerful Features for Your Business</h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Everything you need to create, manage, and grow your WhatsApp-integrated online store
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="px-6 py-12 space-y-16">
            {featureCategories.map((category, categoryIndex) => {
              const colorClasses = getColorClasses(category.color);
              const [gradientClass, iconColorClass, bgClass, borderClass] = colorClasses.split(' ');
              
              return (
                <section key={categoryIndex} className="space-y-8">
                  {/* Category Header */}
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${gradientClass} text-white mb-4`}>
                      {category.icon}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{category.title}</h2>
                  </div>

                  {/* Features Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {category.features.map((feature, featureIndex) => (
                      <div 
                        key={featureIndex}
                        className={`p-6 rounded-lg border-2 ${bgClass} ${borderClass} hover:shadow-lg transition-shadow`}
                      >
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${iconColorClass} bg-white mb-4`}>
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                        <p className="text-gray-700 leading-relaxed">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Integration Highlights */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose ShopLynk?</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <div className="text-4xl">🚀</div>
                  <h3 className="text-xl font-bold text-gray-900">Lightning Fast</h3>
                  <p className="text-gray-700">Get your store online in 5 minutes with our intuitive setup process.</p>
                </div>
                <div className="space-y-3">
                  <div className="text-4xl">💬</div>
                  <h3 className="text-xl font-bold text-gray-900">WhatsApp Native</h3>
                  <p className="text-gray-700">Built specifically for WhatsApp commerce with seamless integration.</p>
                </div>
                <div className="space-y-3">
                  <div className="text-4xl">📈</div>
                  <h3 className="text-xl font-bold text-gray-900">Grow Your Business</h3>
                  <p className="text-gray-700">Powerful analytics and tools to scale your business effectively.</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="px-6 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of businesses already selling through WhatsApp with ShopLynk
              </p>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  data-testid="button-create-store"
                >
                  Create Your Store Free
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                  data-testid="button-view-pricing"
                >
                  View Pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}