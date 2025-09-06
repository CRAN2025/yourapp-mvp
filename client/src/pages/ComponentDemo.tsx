import React, { useState } from 'react'
import { ProductCard, PillFilter, CategoryPill, FeaturePill, StatusPill, AppNavBar } from '@/components/seller'
import { Button } from '@/components/ui/button'
import { Container, Section } from '@/components/ui/ResponsiveGrid'

/**
 * Component Demo Page
 * Showcases standardized seller UI components in action
 */
export default function ComponentDemo() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [favoriteProducts, setFavoriteProducts] = useState<Set<string>>(new Set())

  // Sample product data
  const sampleProducts = [
    {
      id: '1',
      name: 'Organic Cotton T-Shirt',
      price: 29.99,
      imageUrl: '/api/placeholder/400/300',
      category: 'Clothing',
      subcategory: 'T-Shirts',
      brand: 'EcoWear',
      quantity: 15,
      isActive: true,
      isHandmade: true,
      sustainability: true,
    },
    {
      id: '2',
      name: 'Handcrafted Wooden Bowl',
      price: 45.00,
      category: 'Home & Garden',
      subcategory: 'Kitchen',
      quantity: 3,
      isActive: true,
      isHandmade: true,
      isCustomizable: true,
    },
    {
      id: '3',
      name: 'Premium Coffee Beans',
      price: 18.50,
      category: 'Food & Beverage',
      quantity: 0,
      isActive: false,
      sustainability: true,
    },
  ]

  const categories = ['All', 'Clothing', 'Home & Garden', 'Food & Beverage']
  const features = ['Handmade', 'Eco-friendly', 'Customizable', 'Gift Wrap']

  const handleSignOut = () => {
    console.log('Sign out clicked')
  }

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favoriteProducts)
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId)
    } else {
      newFavorites.add(productId)
    }
    setFavoriteProducts(newFavorites)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Navigation */}
      <AppNavBar onSignOut={handleSignOut} />

      <Container className="py-8">
        <Section>
          <div className="text-center mb-12">
            <h1 className="heading-h1 mb-4">ShopLynk Seller UI Components</h1>
            <p className="text-gray-600 text-lg">
              Standardized components for consistent experience across Products, Storefront, Settings, Orders, and Analytics
            </p>
          </div>

          {/* Filter Pills Demo */}
          <div className="mb-8">
            <h2 className="heading-h3 mb-4">Filter & Category Pills</h2>
            
            <div className="space-y-4">
              {/* Category Pills */}
              <div>
                <h3 className="font-medium mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <CategoryPill
                      key={category}
                      category={category}
                      isActive={selectedCategory === category.toLowerCase()}
                      onClick={() => setSelectedCategory(category.toLowerCase())}
                      count={category === 'All' ? sampleProducts.length : sampleProducts.filter(p => p.category === category).length}
                    />
                  ))}
                </div>
              </div>

              {/* Feature Pills */}
              <div>
                <h3 className="font-medium mb-2">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {features.map((feature) => (
                    <FeaturePill
                      key={feature}
                      feature={feature}
                      onClick={() => console.log(`Filter by ${feature}`)}
                    />
                  ))}
                </div>
              </div>

              {/* Status Pills */}
              <div>
                <h3 className="font-medium mb-2">Stock Status</h3>
                <div className="flex flex-wrap gap-2">
                  <StatusPill status="in-stock" count={12} />
                  <StatusPill status="low-stock" count={3} />
                  <StatusPill status="out-of-stock" count={1} />
                </div>
              </div>
            </div>
          </div>

          {/* Button Variants Demo */}
          <div className="mb-8">
            <h2 className="heading-h3 mb-4">Button Variants</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="success">Success</Button>
              <Button variant="accent">Accent</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Product Cards Demo */}
          <div className="mb-8">
            <h2 className="heading-h3 mb-4">Product Cards</h2>
            
            {/* Seller Context */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Seller Dashboard Context</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sampleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    context="seller"
                    onEdit={(id) => console.log('Edit product:', id)}
                    onDelete={(id) => console.log('Delete product:', id)}
                    onPreview={(id) => console.log('Preview product:', id)}
                    onFavorite={toggleFavorite}
                    isFavorited={favoriteProducts.has(product.id)}
                  />
                ))}
              </div>
            </div>

            {/* Storefront Context */}
            <div>
              <h3 className="font-medium mb-3">Public Storefront Context</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sampleProducts.slice(0, 2).map((product) => (
                  <ProductCard
                    key={`storefront-${product.id}`}
                    product={product}
                    context="storefront"
                    onContact={(id) => console.log('Contact seller for product:', id)}
                    onPreview={(id) => console.log('View product details:', id)}
                    onFavorite={toggleFavorite}
                    isFavorited={favoriteProducts.has(product.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Usage Guidelines */}
          <div className="bg-white rounded-xl p-6 border">
            <h2 className="heading-h3 mb-4">Usage Guidelines</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <strong className="text-gray-900">ProductCard:</strong> Fixed aspect-[4/3] image ratio, standardized CTAs, 
                consistent price positioning (right-aligned), badges below title
              </div>
              <div>
                <strong className="text-gray-900">PillFilter:</strong> Rounded-full design, consistent px-3 py-1 spacing, 
                color-coded by variant, hover animations
              </div>
              <div>
                <strong className="text-gray-900">Button:</strong> Enhanced variants with ShopLynk design tokens, 
                consistent animations, proper focus states
              </div>
              <div>
                <strong className="text-gray-900">AppNavBar:</strong> Left-aligned logo, right-aligned nav links, 
                active route indicators, responsive mobile layout
              </div>
            </div>
          </div>
        </Section>
      </Container>
    </div>
  )
}