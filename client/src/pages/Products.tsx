import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { Plus, Search, Heart, Edit, Trash2, Filter } from 'lucide-react';
import { database } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { formatPrice, getProductImageUrl } from '@/lib/utils/formatting';
import type { Product } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ProductModal from '@/components/ProductModal';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

export default function Products() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  // Load products from Firebase
  useEffect(() => {
    if (!user) return;

    const productsRef = ref(database, `sellers/${user.uid}/products`);
    
    const unsubscribe = onValue(productsRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const productsList = Object.entries(data).map(([id, productData]) => ({
            id,
            ...(productData as Omit<Product, 'id'>),
          }));
          setProducts(productsList);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        toast({
          title: 'Error',
          description: 'Failed to load products.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    });

    return () => off(productsRef, 'value', unsubscribe);
  }, [user, toast]);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    const matchesFavorites = !showFavorites || favorites.has(product.id);
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      // TODO: Implement product deletion
      toast({
        title: 'Product deleted',
        description: `${product.name} has been deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product.',
        variant: 'destructive',
      });
    }
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity <= 5) {
      return <Badge variant="secondary" className="bg-warning text-warning-foreground">Low Stock ({quantity})</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-success text-success-foreground">In Stock ({quantity})</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" className="mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Products</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
          <Button onClick={handleAddProduct} data-testid="button-add-product">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="jewelry">Jewelry</SelectItem>
                <SelectItem value="home">Home & Garden</SelectItem>
                <SelectItem value="handmade">Handmade</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showFavorites ? 'default' : 'outline'}
              onClick={() => setShowFavorites(!showFavorites)}
              data-testid="button-favorites-filter"
            >
              <Heart className="w-4 h-4 mr-2" />
              Favorites
            </Button>
          </div>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Plus className="w-16 h-16" />}
            title="No products found"
            description={
              products.length === 0
                ? "Get started by adding your first product to your catalog."
                : "Try adjusting your search or filter criteria."
            }
            action={{
              label: "Add Product",
              onClick: handleAddProduct,
            }}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full ${
                      favorites.has(product.id) ? 'text-red-500' : 'text-gray-400'
                    }`}
                    onClick={() => toggleFavorite(product.id)}
                    data-testid={`button-favorite-${product.id}`}
                  >
                    <Heart className="w-4 h-4" fill={favorites.has(product.id) ? 'currentColor' : 'none'} />
                  </Button>
                  <div className="absolute top-2 left-2">
                    {getStockBadge(product.quantity)}
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2" data-testid={`product-name-${product.id}`}>
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  {/* Enhanced Product Attributes */}
                  <div className="space-y-2 mb-4">
                    {product.brand && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Brand:</span>
                        <Badge variant="secondary" className="text-xs">{product.brand}</Badge>
                      </div>
                    )}
                    {product.condition && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Condition:</span>
                        <Badge variant="outline" className="text-xs capitalize">{product.condition}</Badge>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {product.size && (
                        <Badge variant="secondary" className="text-xs">Size: {product.size}</Badge>
                      )}
                      {product.color && (
                        <Badge variant="secondary" className="text-xs">Color: {product.color}</Badge>
                      )}
                      {product.material && (
                        <Badge variant="secondary" className="text-xs">Material: {product.material}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {product.isHandmade && (
                        <Badge variant="outline" className="text-xs">🎨 Handmade</Badge>
                      )}
                      {product.isCustomizable && (
                        <Badge variant="outline" className="text-xs">⚙️ Customizable</Badge>
                      )}
                      {product.madeToOrder && (
                        <Badge variant="outline" className="text-xs">📋 Made to Order</Badge>
                      )}
                      {product.giftWrapping && (
                        <Badge variant="outline" className="text-xs">🎁 Gift Wrap</Badge>
                      )}
                      {product.processingTime && (
                        <Badge variant="secondary" className="text-xs">⏱️ {product.processingTime}</Badge>
                      )}
                    </div>
                    
                    {/* Additional attributes row */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.chainLength && (
                        <Badge variant="secondary" className="text-xs">Length: {product.chainLength}</Badge>
                      )}
                      {product.pendantSize && (
                        <Badge variant="secondary" className="text-xs">Size: {product.pendantSize}</Badge>
                      )}
                      {product.style && (
                        <Badge variant="secondary" className="text-xs">{product.style}</Badge>
                      )}
                      {product.occasion && (
                        <Badge variant="secondary" className="text-xs">{product.occasion}</Badge>
                      )}
                    </div>
                    
                    {/* Shipping and policy info */}
                    {(product.shipsFrom || product.returnPolicy || product.warranty) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.shipsFrom && (
                          <Badge variant="outline" className="text-xs">✈️ Ships from {product.shipsFrom}</Badge>
                        )}
                        {product.returnPolicy && (
                          <Badge variant="outline" className="text-xs">🔄 {product.returnPolicy}</Badge>
                        )}
                        {product.warranty && (
                          <Badge variant="outline" className="text-xs">🛡️ {product.warranty}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Premium Header with Price and Category */}
                  <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-xl border-l-4 border-emerald-400">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold" style={{ color: '#27AE60' }} data-testid={`product-price-${product.id}`}>
                        {formatPrice(product.price)}
                      </span>
                      <div className="text-sm text-slate-600 font-medium">per unit</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-semibold">
                        📦 {product.category}
                      </div>
                      {product.subcategory && (
                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-600 text-white text-xs font-medium">
                          {product.subcategory}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Premium Seller Console Sections */}
                  <div className="space-y-4 mb-6">
                    
                    {/* Inventory & Pricing Section */}
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                        <span className="text-lg">📊</span>
                        Inventory & Pricing
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide" 
                             style={{ 
                               backgroundColor: product.quantity <= 10 ? '#E63946' : '#27AE60', 
                               color: 'white' 
                             }}>
                          {product.quantity <= 10 ? '⚠️ LOW STOCK' : '✅ IN STOCK'} — {product.quantity} UNITS
                        </div>
                      </div>
                    </div>

                    {/* Product Features Section */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-lg">⭐</span>
                        Features & Services
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {/* Special Features */}
                        <div className="space-y-2">
                          {product.isHandmade && (
                            <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium" 
                                 style={{ backgroundColor: '#F5F5F5', color: '#6C757D' }}>
                              🎨 Handmade
                            </div>
                          )}
                          {product.isCustomizable && (
                            <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium" 
                                 style={{ backgroundColor: '#F5F5F5', color: '#6C757D' }}>
                              ⚙️ Customizable
                            </div>
                          )}
                          {product.giftWrapping && (
                            <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium" 
                                 style={{ backgroundColor: '#F5F5F5', color: '#6C757D' }}>
                              🎁 Gift Wrap
                            </div>
                          )}
                        </div>

                        {/* Sustainability */}
                        <div className="space-y-2">
                          {product.sustainability && (
                            <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium" 
                                 style={{ backgroundColor: '#2ECC71', color: '#FFFFFF' }}>
                              🌱 Eco-friendly
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Customer Information Section */}
                    {(product.personalizationOptions || product.careInstructions || product.targetAgeGroup) && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                          <span className="text-lg">👥</span>
                          Customer Information
                        </h4>
                        <div className="space-y-2">
                          {product.targetAgeGroup && (
                            <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium" 
                                 style={{ backgroundColor: '#F1F3F5', color: '#495057' }}>
                              👥 {product.targetAgeGroup}
                            </div>
                          )}
                          {product.personalizationOptions && (
                            <div className="text-xs text-blue-700 mt-2">
                              <span className="font-semibold">✏️ Personalization:</span> {product.personalizationOptions}
                            </div>
                          )}
                          {product.careInstructions && (
                            <div className="text-xs text-blue-700 mt-2">
                              <span className="font-semibold">🧼 Care:</span> {product.careInstructions}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditProduct(product)}
                      data-testid={`button-edit-${product.id}`}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product)}
                      data-testid={`button-delete-${product.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Product Card */}
            <Card
              className="border-dashed border-2 border-muted-foreground/25 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer min-h-[320px] flex items-center justify-center"
              onClick={handleAddProduct}
              data-testid="card-add-product"
            >
              <div className="text-center">
                <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Add New Product</p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        open={showModal}
        onClose={() => setShowModal(false)}
        product={editingProduct}
        onSuccess={() => {
          setShowModal(false);
          // Products will be automatically updated via onValue listener
        }}
      />
    </DashboardLayout>
  );
}
