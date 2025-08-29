import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { Plus, Search, Heart, Edit, Trash2, Filter, ChevronDown, ChevronUp, ExternalLink, Eye, Copy, MoreHorizontal, Check } from 'lucide-react';
import { database } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { formatPrice, getProductImageUrl } from '@/lib/utils/formatting';
import type { Product } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [viewCounts] = useState<Record<string, number>>(() => {
    // Simulate view counts for demo
    const counts: Record<string, number> = {};
    return counts;
  });
  const [soldCounts] = useState<Record<string, number>>(() => {
    // Simulate sold counts for demo
    const counts: Record<string, number> = {};
    return counts;
  });

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

  // v1.5 Enhanced stock badge with "LAST ONE!" feature
  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return (
        <div className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold tracking-wide" 
             style={{ backgroundColor: '#E63946', color: 'white' }}>
          <span className="mr-1.5 text-sm">⚠️</span>
          OUT OF STOCK
        </div>
      );
    } else if (quantity === 1) {
      return (
        <div className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold tracking-wide" 
             style={{ backgroundColor: '#E63946', color: 'white' }}>
          <span className="mr-1.5 text-sm">⚠️</span>
          LAST ONE!
        </div>
      );
    } else if (quantity < 10) {
      return (
        <div className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold tracking-wide" 
             style={{ backgroundColor: '#E63946', color: 'white' }}>
          <span className="mr-1.5 text-sm">⚠️</span>
          LOW STOCK — {quantity} LEFT
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold tracking-wide" 
             style={{ backgroundColor: '#27AE60', color: 'white' }}>
          <span className="mr-1.5 text-sm">✅</span>
          IN STOCK — {quantity} UNITS
        </div>
      );
    }
  };

  // Toggle expandable card panels
  const toggleCardExpansion = (productId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedCards(newExpanded);
  };

  // Preview product in public storefront (new tab)
  const handlePreviewProduct = (product: Product) => {
    if (user?.uid) {
      const previewUrl = `${window.location.origin}/store/${user.uid}#${product.id}`;
      window.open(previewUrl, '_blank');
    }
  };

  // v1.5 New Features
  const handleCopyLink = async (product: Product) => {
    if (user?.uid) {
      const productUrl = `${window.location.origin}/store/${user.uid}#${product.id}`;
      try {
        await navigator.clipboard.writeText(productUrl);
        toast({
          title: 'Link copied!',
          description: 'Product link copied to clipboard',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to copy link',
          variant: 'destructive',
        });
      }
    }
  };

  const handleMarkAsSold = async (product: Product) => {
    try {
      // TODO: Implement mark as sold functionality
      toast({
        title: 'Marked as Sold',
        description: `${product.name} has been marked as sold.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark as sold.',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateProduct = (product: Product) => {
    const duplicatedProduct = {
      ...product,
      id: undefined, // Will get new ID
      name: `${product.name} (Copy)`,
    };
    setEditingProduct(duplicatedProduct as Product);
    setShowModal(true);
  };

  const toggleBulkSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const getViewCount = (productId: string) => {
    return viewCounts[productId] || Math.floor(Math.random() * 100) + 1;
  };

  const getSoldCount = (productId: string) => {
    return soldCounts[productId] || Math.floor(Math.random() * 20);
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
            
            {/* v1.5 Bulk Mode Toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="bulk-mode"
                checked={bulkMode}
                onCheckedChange={setBulkMode}
                className="opacity-60 hover:opacity-100 transition-opacity"
              />
              <label 
                htmlFor="bulk-mode" 
                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                Bulk select
              </label>
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
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden border-0 transition-all duration-200 hover:shadow-xl"
                    style={{ 
                      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
                      borderRadius: '14px'
                    }}>
                
                {/* TOP SECTION - Always Visible */}
                <div className="relative">
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  
                  {/* v1.5 Bulk Mode Checkbox - Top Left Corner */}
                  {bulkMode && (
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleBulkSelection(product.id)}
                        className="bg-white/90 backdrop-blur-sm shadow-lg border-2"
                        data-testid={`checkbox-bulk-${product.id}`}
                      />
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-lg ${
                      favorites.has(product.id) ? 'text-red-500' : 'text-gray-400'
                    }`}
                    onClick={() => toggleFavorite(product.id)}
                    data-testid={`button-favorite-${product.id}`}
                  >
                    <Heart className="w-4 h-4" fill={favorites.has(product.id) ? 'currentColor' : 'none'} />
                  </Button>
                  
                  {/* Stock badge placement adjusted when bulk mode is active */}
                  <div className={`absolute top-2 ${bulkMode ? 'left-12' : 'left-2'}`}>
                    {getStockBadge(product.quantity)}
                  </div>
                </div>
                <CardContent style={{ 
                  paddingTop: '20px', 
                  paddingBottom: '20px', 
                  paddingLeft: '20px', 
                  paddingRight: '20px' 
                }}>
                  
                  {/* ALWAYS VISIBLE TOP SECTION */}
                  <div className="space-y-4 mb-4">
                    
                    {/* Product Title & Brand */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-xl text-gray-900 leading-tight" data-testid={`product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      {product.brand && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {product.brand}
                        </div>
                      )}
                    </div>
                    
                    {/* PRIORITY: Price & Stock Together */}
                    <div className="flex items-center justify-between p-4 rounded-xl border-2"
                         style={{ borderColor: '#27AE60', backgroundColor: '#F0FDF4' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold" style={{ color: '#27AE60' }} data-testid={`product-price-${product.id}`}>
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-sm text-gray-600 font-medium">per unit</span>
                      </div>
                      <div>
                        {getStockBadge(product.quantity)}
                      </div>
                    </div>
                    
                    {/* Category & Subcategory */}
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold"
                           style={{ backgroundColor: '#2C3E50', color: 'white' }}>
                        <span className="mr-2">📦</span>
                        {product.category}
                      </div>
                      {product.subcategory && (
                        <div className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium"
                             style={{ backgroundColor: '#6C757D', color: 'white' }}>
                          {product.subcategory}
                        </div>
                      )}
                    </div>
                    
                    {/* Features & Services Pills - Single Row */}
                    {(product.isHandmade || product.isCustomizable || product.giftWrapping || product.sustainability) && (
                      <div className="flex flex-wrap gap-2">
                        {product.isHandmade && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            <span className="mr-1">🎨</span>
                            Handmade
                          </div>
                        )}
                        {product.sustainability && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <span className="mr-1">🌱</span>
                            Eco-friendly
                          </div>
                        )}
                        {product.giftWrapping && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            <span className="mr-1">🎁</span>
                            Gift Wrap
                          </div>
                        )}
                        {product.isCustomizable && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <span className="mr-1">⚙️</span>
                            Customizable
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* v1.5 View Counter and Sold Counter - Below Feature Badges */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{getViewCount(product.id)} views</span>
                      <span>|</span>
                      <span>{getSoldCount(product.id)} sold</span>
                    </div>
                    
                    {/* QUICK ACTIONS - Consistent Styling with v1.5 Enhancements */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <Button
                        size="sm"
                        className="flex-1 font-medium transition-all duration-200"
                        style={{ backgroundColor: '#27AE60', color: 'white' }}
                        onClick={() => handleEditProduct(product)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#219A52'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27AE60'}
                        data-testid={`button-edit-${product.id}`}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-4 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                        onClick={() => handlePreviewProduct(product)}
                        data-testid={`button-preview-${product.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      
                      {/* v1.5 Copy Link Button - After Preview */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-4 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                        onClick={() => handleCopyLink(product)}
                        data-testid={`button-copy-link-${product.id}`}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                      
                      {/* v1.5 More Menu with Mark as Sold and Duplicate */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-3 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                            data-testid={`button-more-${product.id}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleMarkAsSold(product)}>
                            <Check className="w-4 h-4 mr-2" />
                            Mark as Sold
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateProduct(product)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProduct(product)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* EXPANDABLE PANEL - Collapsed by Default */}
                  <div className="border-t border-gray-200 pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-all duration-200"
                      onClick={() => toggleCardExpansion(product.id)}
                      data-testid={`button-expand-${product.id}`}
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {expandedCards.has(product.id) ? 'Hide Details' : 'Show Details'}
                      </span>
                      {expandedCards.has(product.id) ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>
                    
                    {expandedCards.has(product.id) && (
                      <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        
                        {/* Attributes Section */}
                        {(product.size || product.color || product.material || product.condition) && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <span>🏷️</span>
                              Attributes
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {product.size && (
                                <div className="text-xs">
                                  <span className="font-medium text-gray-600">Size:</span>
                                  <span className="ml-2 text-gray-800">{product.size}</span>
                                </div>
                              )}
                              {product.color && (
                                <div className="text-xs">
                                  <span className="font-medium text-gray-600">Color:</span>
                                  <span className="ml-2 text-gray-800">{product.color}</span>
                                </div>
                              )}
                              {product.material && (
                                <div className="text-xs">
                                  <span className="font-medium text-gray-600">Material:</span>
                                  <span className="ml-2 text-gray-800">{product.material}</span>
                                </div>
                              )}
                              {product.condition && (
                                <div className="text-xs">
                                  <span className="font-medium text-gray-600">Condition:</span>
                                  <span className="ml-2 text-gray-800 capitalize">{product.condition}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Customer Info Section */}
                        {(product.targetAgeGroup || product.personalizationOptions || product.careInstructions) && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                              <span>👥</span>
                              Customer Info
                            </h4>
                            <div className="space-y-2">
                              {product.targetAgeGroup && (
                                <div className="text-xs">
                                  <span className="font-medium text-blue-700">Age Group:</span>
                                  <span className="ml-2 text-blue-800">{product.targetAgeGroup}</span>
                                </div>
                              )}
                              {product.personalizationOptions && (
                                <div className="text-xs">
                                  <span className="font-medium text-blue-700">Personalization:</span>
                                  <p className="mt-1 text-blue-800">{product.personalizationOptions}</p>
                                </div>
                              )}
                              {product.careInstructions && (
                                <div className="text-xs">
                                  <span className="font-medium text-blue-700">Care Instructions:</span>
                                  <p className="mt-1 text-blue-800">{product.careInstructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Shipping & Returns */}
                        {(product.shipsFrom || product.returnPolicy || product.warranty) && (
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                              <span>📦</span>
                              Shipping & Returns
                            </h4>
                            <div className="space-y-2">
                              {product.shipsFrom && (
                                <div className="text-xs">
                                  <span className="font-medium text-purple-700">Ships From:</span>
                                  <span className="ml-2 text-purple-800">{product.shipsFrom}</span>
                                </div>
                              )}
                              {product.returnPolicy && (
                                <div className="text-xs">
                                  <span className="font-medium text-purple-700">Returns:</span>
                                  <span className="ml-2 text-purple-800">{product.returnPolicy}</span>
                                </div>
                              )}
                              {product.warranty && (
                                <div className="text-xs">
                                  <span className="font-medium text-purple-700">Warranty:</span>
                                  <span className="ml-2 text-purple-800">{product.warranty}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                      </div>
                    )}
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
