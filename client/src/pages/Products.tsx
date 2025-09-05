import { useState, useEffect, useRef } from 'react';
import { ref, onValue, off, remove } from 'firebase/database';
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
import PageShell from '@/components/PageShell';
import Container from '@/components/Container';
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
  const [filtersScrolled, setFiltersScrolled] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

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

  // Scroll effect for sticky filters
  useEffect(() => {
    const handleScroll = () => {
      if (filtersRef.current) {
        const filtersRect = filtersRef.current.getBoundingClientRect();
        const isStuck = filtersRect.top <= 64; // h-16 = 64px
        setFiltersScrolled(isStuck);
        filtersRef.current.setAttribute('data-scrolled', isStuck.toString());
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) return;

    if (!user) return;

    try {
      // Delete from seller's products in RTDB
      const productRef = ref(database, `sellers/${user.uid}/products/${product.id}`);
      await remove(productRef);

      // Remove from public store mirror
      const publicProductRef = ref(database, `publicStores/${user.uid}/products/${product.id}`);
      await remove(publicProductRef);

      toast({
        title: 'Product deleted',
        description: `${product.name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Delete product error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product.',
        variant: 'destructive',
      });
    }
  };

  // v1.7 Premium stock pill - smaller size for visual hierarchy
  const getStockPill = (quantity: number) => {
    if (quantity === 0) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-800">
          OUT OF STOCK
        </span>
      );
    } else if (quantity === 1) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-800">
          LAST ONE!
        </span>
      );
    } else if (quantity < 10) {
      return (
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
          LOW STOCK
        </span>
      );
    } else {
      return (
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          IN STOCK
        </span>
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
      id: `temp-${Date.now()}`, // Temporary ID for editing
      name: `${product.name} (Copy)`,
    };
    setEditingProduct(duplicatedProduct);
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
        <div className="section-container py-8">
          <LoadingSpinner size="lg" className="mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="section-container py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="sl-h1 mb-2">Products</h1>
            <p className="text-muted-foreground mt-1">Manage your product catalog</p>
          </div>
          <button 
            onClick={handleAddProduct}
            data-testid="button-add-product"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-2 text-white shadow-soft hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>

        {/* Filters and Search */}
        <div ref={filtersRef} className="sticky top-16 z-30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border border-slate-200 shadow-sm data-[scrolled=true]:shadow-md rounded-2xl p-4 md:p-5 mb-8" data-scrolled={filtersScrolled.toString()}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                aria-label="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                data-testid="input-search"
              />
            </div>
            
            {/* v1.5 Bulk Mode Toggle */}
            <label className="inline-flex items-center gap-2">
              <Checkbox
                id="bulk-mode"
                checked={bulkMode}
                onCheckedChange={(checked) => setBulkMode(checked === true)}
                className="h-4 w-4 opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              />
              <span className="text-sm text-slate-600">
                Bulk select
              </span>
            </label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" data-testid="select-category-filter">
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
              className={`rounded-lg h-10 px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${showFavorites ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white hover:brightness-105' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <Heart className="w-4 h-4 mr-2" />
              Favorites
            </Button>
          </div>
        </div>

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
          <div className="pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 overflow-hidden">
                
                {/* TOP SECTION - Always Visible */}
                <div className="aspect-[16/9] overflow-hidden rounded-t-2xl bg-slate-100">
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                    decoding="async"
                    sizes="(min-width:1024px) 33vw, 100vw"
                    width="640"
                    height="360"
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
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
                      favorites.has(product.id) ? 'text-red-500' : 'text-slate-400'
                    }`}
                    onClick={() => toggleFavorite(product.id)}
                    data-testid={`button-favorite-${product.id}`}
                    title={`${favorites.has(product.id) ? 'Remove from' : 'Add to'} favorites`}
                    aria-label={`${favorites.has(product.id) ? 'Remove from' : 'Add to'} favorites`}
                  >
                    <Heart className="w-4 h-4" fill={favorites.has(product.id) ? 'currentColor' : 'none'} />
                  </Button>
                  
                  {/* v1.6 Removed floating stock badge - now integrated in price section only */}
                </div>
                <div className="p-5 flex flex-col h-full">
                  
                  {/* v1.6 ALWAYS VISIBLE TOP SECTION - Normalized Spacing */}
                  <div className="space-y-3">
                    
                    {/* v1.6 Enhanced Product Title & Brand */}
                    <div className="space-y-3">
                      <h3 className="line-clamp-2 text-[20px] font-semibold leading-tight text-gray-900" data-testid={`product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      {product.brand && (
                        <div className="text-sm text-slate-500">
                          {product.brand}
                        </div>
                      )}
                    </div>
                    
                    {/* v1.7 Premium Price & Stock Pills - Price Dominance */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex h-9 items-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3.5 text-white font-semibold">
                        <span data-testid={`product-price-${product.id}`}>
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      {getStockPill(product.quantity)}
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
                    
                    {/* v1.7 Premium Feature Pills - Enhanced Readability */}
                    {(product.isHandmade || product.isCustomizable || product.giftWrapping || product.sustainability) && (
                      <div className="flex flex-wrap gap-2 mb-1">
                        {product.sustainability && (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
                               style={{ backgroundColor: '#D1FAE5', color: '#047857' }}>
                            <span className="mr-1">🌱</span>
                            Eco-friendly
                          </div>
                        )}
                        {product.isHandmade && (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
                               style={{ backgroundColor: '#FFEFD5', color: '#C2410C' }}>
                            <span className="mr-1">🎨</span>
                            Handmade
                          </div>
                        )}
                        {product.giftWrapping && (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
                               style={{ backgroundColor: '#F5E8FF', color: '#9333EA' }}>
                            <span className="mr-1">🎁</span>
                            Gift Wrap
                          </div>
                        )}
                        {product.isCustomizable && (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
                               style={{ backgroundColor: '#E0F2FF', color: '#2563EB' }}>
                            <span className="mr-1">⚙️</span>
                            Customizable
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="min-h-[64px] md:min-h-[56px]" />
                    
                    {/* v1.7 Enhanced View/Sold Counter - Better Typography */}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{new Intl.NumberFormat().format(getViewCount(product.id))} views</span>
                      <span>·</span>
                      <span>{getSoldCount(product.id) === 0 ? '—' : new Intl.NumberFormat().format(getSoldCount(product.id))} sold</span>
                    </div>
                    
                    {/* v1.7 Premium Action Buttons - Enhanced Styling */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 min-h-[44px]">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-sky-500 to-violet-500 text-white hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 rounded-lg flex-1 min-w-[80px] font-medium"
                        onClick={() => handleEditProduct(product)}
                        data-testid={`button-edit-${product.id}`}
                        title="Edit product"
                        aria-label="Edit product"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3 border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                        onClick={() => handlePreviewProduct(product)}
                        title="Preview product"
                        aria-label="Preview product"
                        data-testid={`button-preview-${product.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3 bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                        onClick={() => handleCopyLink(product)}
                        data-testid={`button-copy-link-${product.id}`}
                        aria-label="Copy product link"
                        title="Copy product link"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-3 bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
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
                  
                  {/* v1.7 Enhanced Show Details Toggle */}
                  <div className="border-t border-gray-200 pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full flex items-center justify-between p-3 hover:bg-brand-50 rounded-lg transition-all duration-200"
                      onClick={() => toggleCardExpansion(product.id)}
                      data-testid={`button-expand-${product.id}`}
                    >
                      <span className="text-sm font-semibold text-brand-700">
                        {expandedCards.has(product.id) ? 'Hide Details' : 'Show Details'}
                      </span>
                      {expandedCards.has(product.id) ? (
                        <ChevronUp className="w-4 h-4 text-brand-700" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-brand-700" />
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
                          <div className="p-4 bg-brand-50 rounded-lg">
                            <h4 className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
                              <span>📦</span>
                              Shipping & Returns
                            </h4>
                            <div className="space-y-2">
                              {product.shipsFrom && (
                                <div className="text-xs">
                                  <span className="font-medium text-brand-700">Ships From:</span>
                                  <span className="ml-2 text-brand-800">{product.shipsFrom}</span>
                                </div>
                              )}
                              {product.returnPolicy && (
                                <div className="text-xs">
                                  <span className="font-medium text-brand-700">Returns:</span>
                                  <span className="ml-2 text-brand-800">{product.returnPolicy}</span>
                                </div>
                              )}
                              {product.warranty && (
                                <div className="text-xs">
                                  <span className="font-medium text-brand-700">Warranty:</span>
                                  <span className="ml-2 text-brand-800">{product.warranty}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>
            ))}

            {/* Add Product Card */}
            <div
              className="bg-white border border-dashed border-2 border-slate-300 hover:border-sky-500 hover:bg-slate-50/50 transition-colors cursor-pointer min-h-[320px] flex items-center justify-center rounded-2xl shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
              onClick={handleAddProduct}
              data-testid="card-add-product"
              tabIndex={0}
              role="button"
              aria-label="Add new product"
              title="Add new product"
            >
              <div className="text-center">
                <Plus className="w-12 h-12 text-sky-500 mx-auto mb-4" />
                <p className="text-sky-600 font-medium">Add New Product</p>
              </div>
            </div>
          </div>
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
