import React, { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { getDemoStore, type DemoStore, type DemoProduct } from '@/data/demoStores';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import StoreHeader from '@/components/StoreHeader';
import ProductCard from '@/components/ui/ProductCard';
import { Eye, MessageCircle, Users, AlertTriangle } from 'lucide-react';

interface DemoStorefrontProps {}

export default function DemoStorefront({}: DemoStorefrontProps) {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<DemoStore | null>(null);
  const [products, setProducts] = useState<DemoProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (!slug) return;

    // Load demo store data
    const demoStore = getDemoStore(slug);
    if (demoStore) {
      setStore(demoStore);
      setProducts(demoStore.products);
      
      // Fire telemetry event
      try {
        // TODO: Add analytics tracking for demo_store_view
        console.log('Demo store view:', { slug });
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }
    }
    
    setLoading(false);
  }, [slug]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleContactProduct = (product: DemoProduct) => {
    // Fire telemetry event
    try {
      // TODO: Add analytics tracking for demo_store_click
      console.log('Demo store click:', { slug, productId: product.id });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }

    // Show demo modal instead of opening WhatsApp
    alert('This is a demo store. In a real store, this would open WhatsApp to contact the seller.');
  };

  const handleProductView = (product: DemoProduct) => {
    // Fire telemetry event
    try {
      console.log('Demo product view:', { slug, productId: product.id });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }

    // Show demo modal instead of opening product details
    alert('This is a demo store. In a real store, this would show product details.');
  };

  // Filter products by category
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading demo store...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Demo Store Not Found</h1>
          <p className="text-gray-600 mb-8">The requested demo store could not be found.</p>
          <Button onClick={() => window.location.href = '/'}>
            Return to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{store.storeName} - Demo Store | ShopLynk</title>
        <meta name="description" content={store.description} />
        <meta name="robots" content="noindex,follow" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Demo Banner */}
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              Demo Store - This is a preview of how ShopLynk stores work
            </span>
          </div>
        </div>

        {/* Store Header */}
        <StoreHeader
          name={store.storeName}
          description={store.description}
          onBack={() => window.location.href = '/'}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Store Info */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{store.storeName}</h1>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Demo Store
              </Badge>
            </div>
            <p className="text-lg text-gray-600 mb-4">{store.description}</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Seller: {store.fullName}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>📍 {store.country}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>📂 {store.category}</span>
              </div>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Category Filter */}
          {categories.length > 2 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category === 'all' ? 'All Products' : category}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.name}
                brand={product.brand}
                price={product.price}
                imageUrl={product.images[0]}
                badges={[
                  ...((Date.now() - product.createdAt) < 7 * 24 * 60 * 60 * 1000 ? ['New'] : []),
                  ...(product.quantity < 5 ? ['Limited Stock'] : [])
                ]}
                tags={[
                  product.category,
                  ...(product.subcategory ? [product.subcategory] : []),
                  ...(product.color ? [product.color] : []),
                  ...(product.size ? [product.size] : []),
                  ...(product.material ? [product.material] : []),
                  ...(product.sustainability ? ['Eco-friendly'] : [])
                ]}
                status={product.quantity <= 0 ? 'OUT OF STOCK' : 
                       product.quantity <= 10 ? `ONLY ${product.quantity} LEFT` : null}
                variant="public"
                onContact={() => handleContactProduct(product)}
                onPreview={() => handleProductView(product)}
                className="cursor-pointer"
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <Card className="p-8">
              <CardContent className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  No products match the current category filter.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCategory('all')}
                >
                  Show All Products
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Demo Footer */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <Eye className="h-4 w-4" />
                <span>This is a demo store showcasing ShopLynk's capabilities</span>
              </div>
              <div className="mt-4">
                <Button onClick={() => window.location.href = '/'}>
                  Create Your Own Store
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}