import { Link } from 'wouter';
import { Store, MessageCircle, BarChart3, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function MarketLanding() {
  const features = [
    {
      icon: Store,
      title: 'Beautiful Storefronts',
      description: 'Create stunning product showcases with our easy-to-use design tools. No technical skills required.',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Integration',
      description: 'Connect directly with customers through WhatsApp. Seamless communication for better sales.',
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Track your store performance with detailed insights and grow your business faster.',
    },
  ];

  const plans = [
    {
      name: 'Free',
      price: 0,
      description: 'Perfect for getting started',
      features: [
        'Up to 10 products',
        'Basic storefront',
        'WhatsApp integration',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: 19,
      description: 'For growing businesses',
      features: [
        'Unlimited products',
        'Custom branding',
        'Advanced analytics',
        'Priority support',
      ],
      cta: 'Start Pro Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 99,
      description: 'For large organizations',
      features: [
        'Everything in Pro',
        'Multi-store management',
        'API access',
        'Dedicated support',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-primary">ShopLink</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#pricing"
                className="text-gray-600 hover:text-primary transition-colors"
                data-testid="nav-pricing"
              >
                Pricing
              </a>
              <Link href="/auth">
                <Button data-testid="header-create-store">
                  Create your free store
                </Button>
              </Link>
            </div>
            <div className="md:hidden">
              <Button variant="ghost" size="sm">
                <span className="sr-only">Open menu</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Create Your Online Store in{' '}
            <span className="text-primary">Minutes</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Build a beautiful storefront, showcase your products, and connect with customers through WhatsApp. No coding required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
            <Link href="/auth">
              <Button size="lg" className="w-full sm:w-auto" data-testid="hero-create-store">
                Create your free store
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/store/demo">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                data-testid="hero-view-demo"
              >
                View Demo Store
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            Already have a store?{' '}
            <Link href="/auth">
              <span className="text-primary hover:underline cursor-pointer font-medium">
                Sign in
              </span>
            </Link>
          </p>

          {/* Hero Image */}
          <div className="mt-16">
            <img
              src="https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080"
              alt="ShopLink dashboard interface preview"
              className="rounded-2xl shadow-2xl w-full max-w-5xl mx-auto"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Everything you need to sell online
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="bg-white shadow-soft">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16">
            Start free, upgrade when you're ready
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.popular
                    ? 'bg-primary text-white transform scale-105 shadow-xl'
                    : 'bg-white shadow-soft'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className={`mb-6 ${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className={plan.popular ? 'text-blue-100' : 'text-gray-600'}>
                      /month
                    </span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className={`w-5 h-5 mr-3 ${plan.popular ? 'text-white' : 'text-success'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-white text-primary hover:bg-gray-50'
                        : plan.price === 0
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
                    }`}
                    variant={plan.popular ? 'secondary' : plan.price === 0 ? 'secondary' : 'outline'}
                    data-testid={`plan-${plan.name.toLowerCase()}`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="text-2xl font-bold text-primary">ShopLink</span>
              <p className="text-gray-400 mt-4">
                Create beautiful online stores and connect with customers through WhatsApp.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Templates
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ShopLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
