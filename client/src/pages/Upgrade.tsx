import { useState } from 'react';
import { Link } from 'wouter';
import { Check, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function Upgrade() {
  const { toast } = useToast();

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      description: 'Perfect for getting started',
      features: [
        'Up to 10 products',
        'Basic storefront',
        'WhatsApp integration',
        'Basic analytics',
        'Community support',
      ],
      limitations: [
        'Limited customization',
        'ShopLink branding',
      ],
      cta: 'Current Plan',
      popular: false,
      disabled: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19,
      description: 'For growing businesses',
      features: [
        'Unlimited products',
        'Custom branding',
        'Advanced analytics',
        'Custom domain',
        'Priority support',
        'Bulk product import',
        'Advanced SEO tools',
      ],
      cta: 'Coming Soon',
      popular: true,
      disabled: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      description: 'For large organizations',
      features: [
        'Everything in Pro',
        'Multi-store management',
        'API access',
        'White-label solution',
        'Dedicated support',
        'Custom integrations',
        'Advanced permissions',
        'Analytics export',
      ],
      cta: 'Contact Sales',
      popular: false,
      disabled: true,
    },
  ];

  const handlePlanSelect = (planId: string) => {
    toast({
      title: 'Coming in Phase 1.5',
      description: 'Billing and subscriptions will be available soon. Stay tuned!',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <span className="text-xl font-bold text-primary cursor-pointer">ShopLink</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/app">
                <Button variant="outline" data-testid="button-sign-in">
                  Sign In
                </Button>
              </Link>
              <Link href="/app">
                <Button data-testid="button-get-started">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Choose the perfect plan for your business
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include our core features to help you succeed.
          </p>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            💳 Billing coming in Phase 1.5
          </Badge>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular
                    ? 'border-primary shadow-lg transform scale-105'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-success mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {plan.limitations && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Limitations:</p>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Button
                    className={`w-full ${plan.popular ? 'bg-primary' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled={plan.disabled}
                    onClick={() => handlePlanSelect(plan.id)}
                    data-testid={`button-plan-${plan.id}`}
                  >
                    {plan.cta}
                    {!plan.disabled && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything you need to build and grow
            </h2>
            <p className="text-xl text-muted-foreground">
              Compare features across all plans
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border rounded-lg">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-4 border-b border-border">Feature</th>
                  <th className="text-center p-4 border-b border-border">Free</th>
                  <th className="text-center p-4 border-b border-border">Pro</th>
                  <th className="text-center p-4 border-b border-border">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-4 border-b border-border font-medium">Products</td>
                  <td className="text-center p-4 border-b border-border">10</td>
                  <td className="text-center p-4 border-b border-border">Unlimited</td>
                  <td className="text-center p-4 border-b border-border">Unlimited</td>
                </tr>
                <tr className="bg-muted/20">
                  <td className="p-4 border-b border-border font-medium">WhatsApp Integration</td>
                  <td className="text-center p-4 border-b border-border">
                    <Check className="w-5 h-5 text-success mx-auto" />
                  </td>
                  <td className="text-center p-4 border-b border-border">
                    <Check className="w-5 h-5 text-success mx-auto" />
                  </td>
                  <td className="text-center p-4 border-b border-border">
                    <Check className="w-5 h-5 text-success mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="p-4 border-b border-border font-medium">Custom Branding</td>
                  <td className="text-center p-4 border-b border-border">❌</td>
                  <td className="text-center p-4 border-b border-border">
                    <Check className="w-5 h-5 text-success mx-auto" />
                  </td>
                  <td className="text-center p-4 border-b border-border">
                    <Check className="w-5 h-5 text-success mx-auto" />
                  </td>
                </tr>
                <tr className="bg-muted/20">
                  <td className="p-4 border-b border-border font-medium">Analytics</td>
                  <td className="text-center p-4 border-b border-border">Basic</td>
                  <td className="text-center p-4 border-b border-border">Advanced</td>
                  <td className="text-center p-4 border-b border-border">Advanced + Export</td>
                </tr>
                <tr>
                  <td className="p-4 border-b border-border font-medium">API Access</td>
                  <td className="text-center p-4 border-b border-border">❌</td>
                  <td className="text-center p-4 border-b border-border">❌</td>
                  <td className="text-center p-4 border-b border-border">
                    <Check className="w-5 h-5 text-success mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                When will paid plans be available?
              </h3>
              <p className="text-muted-foreground">
                Paid plans and billing functionality will be available in Phase 1.5 of our roadmap. 
                For now, enjoy full access to all features with the free plan.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                What happens to my data when I upgrade?
              </h3>
              <p className="text-muted-foreground">
                All your data will be preserved when you upgrade. You'll gain access to additional 
                features without losing any of your existing products, customers, or analytics.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Can I change plans later?
              </h3>
              <p className="text-muted-foreground">
                Yes, you'll be able to upgrade or downgrade your plan at any time. Changes will be 
                reflected in your next billing cycle.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Do you offer custom enterprise solutions?
              </h3>
              <p className="text-muted-foreground">
                Yes, we'll offer custom enterprise solutions with dedicated support, custom integrations, 
                and white-label options. Contact us for more information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of sellers already using ShopLink to grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/app">
              <Button size="lg" variant="secondary" data-testid="button-start-free">
                Start Free Today
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
