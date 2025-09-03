import { useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/context/AuthContext';
import { Store, Package, BarChart3, Settings, Users, Eye, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout, { PageContainer } from '@/components/Layout/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function SellerDashboard() {
  const { user, seller, loading } = useAuthContext();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?mode=signin&redirect=/seller-dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !seller) return null;

  /** Subtle accent classes for quick actions (kept explicit for Tailwind purge) */
  const tones = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
  } as const;

  const quickActions = [
    {
      title: 'Manage Products',
      description: 'Add, edit, or remove products from your store',
      icon: Package,
      href: '/products',
      tone: 'blue' as const,
    },
    {
      title: 'View Storefront',
      description: 'See how your store looks to customers',
      icon: Eye,
      href: '/storefront',
      tone: 'green' as const,
    },
    {
      title: 'Analytics',
      description: 'Track views, clicks, and performance',
      icon: BarChart3,
      href: '/analytics',
      tone: 'purple' as const,
    },
    {
      title: 'Store Settings',
      description: 'Update store info, categories, and preferences',
      icon: Settings,
      href: '/settings',
      tone: 'orange' as const,
    },
  ];

  const publicUrl = `${window.location.origin}/store/${seller.id}`;
  const shareText = `Check out my ${seller.storeName || 'ShopLynk'} store: ${publicUrl}`;

  const shareViaWhatsApp = () => {
    // Try the native share sheet first (best on mobile)
    if (navigator.share && typeof navigator.share === 'function') {
      navigator
        .share({ title: seller.storeName || 'My Store', text: shareText, url: publicUrl })
        .catch(() => {
          // If user cancels or it fails, silently ignore
        });
      return;
    }
    // Fallback to WhatsApp share
    const wa = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(wa, '_blank', 'noopener,noreferrer');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      // Fallback: open a prompt if clipboard fails
      window.prompt('Copy your store link:', publicUrl);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-8">
          {/* Onboarding hint (non-blocking) */}
          {!seller.onboardingCompleted && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 grid place-items-center">
                  <Settings className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800">Complete your store setup</h3>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Finish onboarding to unlock all features and publish confidently.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/onboarding/step-1')}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Continue setup
                </Button>
              </div>
            </div>
          )}

          {/* Welcome / hero card (subtle gradient & border, not loud) */}
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-8 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                Welcome, {seller.storeName || 'Your Store'}!
              </h1>
              <p className="text-slate-600">
                Manage everything in one place. Keep it simple, ship fast.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                <Store className="h-4 w-4" />
                {seller.category || 'General Store'}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                <Users className="h-4 w-4" />
                {seller.country || 'Unknown'}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                <span className="font-medium">User ID:</span>
                <span className="font-mono text-slate-500">{seller.id}</span>
              </div>
              {!seller.onboardingCompleted ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-amber-800">
                  <Settings className="h-4 w-4" />
                  Setup incomplete
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Onboarding complete
                </div>
              )}
            </div>
          </div>

          {/* Quick actions (calm icons, neutral shells, soft motion) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const toneClass =
                action.tone === 'blue'
                  ? tones.blue
                  : action.tone === 'green'
                  ? tones.green
                  : action.tone === 'purple'
                  ? tones.purple
                  : tones.orange;

              return (
                <Card
                  key={action.href}
                  onClick={() => navigate(action.href)}
                  className="group cursor-pointer border-slate-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(16,24,40,.12)] transition"
                  role="link"
                  aria-label={action.title}
                >
                  <CardHeader className="pb-4">
                    <div
                      className={`h-12 w-12 rounded-xl grid place-items-center ${toneClass} mb-3 group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button className="w-full" variant="outline">
                      Open
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Lightweight stats (placeholders until wired to analytics) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-slate-500">Total products in your store</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Store Views</CardTitle>
                <Eye className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-slate-500">Total storefront views</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">WhatsApp Clicks</CardTitle>
                <BarChart3 className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-slate-500">Customer contact attempts</p>
              </CardContent>
            </Card>
          </div>

          {/* Public link (calm, copy + preview) */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Your public store</CardTitle>
              <CardDescription>Share this link with your customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-700 select-all overflow-x-auto whitespace-nowrap">
                  {publicUrl}
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyLink} variant="outline">
                    Copy link
                  </Button>
                  <Button
                    onClick={shareViaWhatsApp}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}