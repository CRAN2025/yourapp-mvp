import { useState, useEffect, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ref, get } from 'firebase/database';
import { Search, Heart, MessageCircle, ChevronDown, X, ArrowLeft, CreditCard, Truck, MapPin, Phone, Info } from 'lucide-react';
import { database } from '@/lib/firebase';
import { formatPrice, getProductImageUrl } from '@/lib/utils/formatting';
import { trackInteraction } from '@/lib/utils/analytics';
import { openWhatsApp, createWhatsAppMessage } from '@/lib/utils/whatsapp';
import type { Product, Seller } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PublicLayout from '@/components/Layout/PublicLayout';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

export default function StorefrontPublic() {
  const [, params] = useRoute('/store/:sellerId');
  const { toast } = useToast();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showChatFab, setShowChatFab] = useState(false);
  const [contactNotification, setContactNotification] = useState<{show: boolean, product: Product | null}>({show: false, product: null});

  const sellerId = params?.sellerId;
  const [location] = useLocation();

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('favorites');
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch (e) {
      console.error('Error loading favorites:', e);
    }
  }, []);

  // Handle floating chat button visibility
  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 300 || window.innerWidth > 768;
      setShowChatFab(shouldShow);
    };
    
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Handle product deep linking
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && products.length > 0) {
      const product = products.find(p => p.id === hash);
      if (product) {
        setSelectedProduct(product);
        setShowProductModal(true);
      }
    }
  }, [products]);

  // Handle ESC key for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProductModal(false);
        setShowPaymentModal(false);
        setShowDeliveryModal(false);
        setContactNotification({show: false, product: null});
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load seller and products data
  useEffect(() => {
    if (!sellerId) return;

    const loadStoreData = async () => {
      try {
        setLoading(true);

        // Load seller data
        const sellerRef = ref(database, `sellers/${sellerId}`);
        const sellerSnapshot = await get(sellerRef);
        
        if (!sellerSnapshot.exists()) {
          throw new Error('Store not found');
        }

        const sellerData = sellerSnapshot.val();
        setSeller(sellerData);

        // Load products
        const productsRef = ref(database, `sellers/${sellerId}/products`);
        const productsSnapshot = await get(productsRef);

        if (productsSnapshot.exists()) {
          const data = productsSnapshot.val();
          const productsList = Object.entries(data).map(([id, productData]) => ({
            id,
            ...(productData as Omit<Product, 'id'>),
          })).filter(product => product.isActive);
          setProducts(productsList);
        }

        // Track store view
        await trackInteraction({
          type: 'store_view',
          sellerId,
        });

      } catch (error) {
        console.error('Error loading store:', error);
        toast({
          title: 'Store not found',
          description: 'The store you are looking for does not exist.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [sellerId, toast]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesFavorites = !showFavorites || favorites.has(product.id);
      
      return matchesSearch && matchesCategory && matchesFavorites;
    });

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'popular':
        // Sort by views if available, otherwise by creation date
        filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
    }

    return filtered;
  }, [products, searchQuery, categoryFilter, showFavorites, favorites, sortBy]);

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category)));

  const toggleFavorite = (productId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
    
    // Save to localStorage
    try {
      localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
    } catch (e) {
      console.error('Error saving favorites:', e);
    }
  };

  const handleProductView = async (product: Product) => {
    try {
      await trackInteraction({
        type: 'product_view',
        sellerId: sellerId!,
        productId: product.id,
        metadata: {
          productName: product.name,
          productPrice: product.price,
        },
      });
      
      setSelectedProduct(product);
      setShowProductModal(true);
      
      // Update URL hash for deep linking
      window.history.pushState(null, '', `#${product.id}`);
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  const handleFloatingChatClick = async () => {
    if (!seller?.whatsappNumber || !sellerId) return;
    
    const storeUrl = `${window.location.origin}/store/${sellerId}`;
    const message = `👋 Hi! I'm interested in your products at *${seller.storeName}*.\nCould you share availability, payment, and delivery options?\n\n🔗 ${storeUrl}`;
    
    openWhatsApp(seller.whatsappNumber, message);
  };

  const handleContactProduct = async (product: Product) => {
    if (!seller?.whatsappNumber || !sellerId) return;
    
    try {
      await trackInteraction({
        type: 'wa_click',
        sellerId,
        productId: product.id,
        metadata: {
          productName: product.name,
          productPrice: product.price,
        },
      });
      
      const message = createWhatsAppMessage({
        storeName: seller.storeName,
        productName: product.name,
        productId: product.id,
        url: `${window.location.origin}/store/${sellerId}`,
      });
      
      const productUrl = `${window.location.origin}/store/${sellerId}#${product.id}`;
      const fullMessage = `${message}\n\n🔗 ${productUrl}`;
      
      openWhatsApp(seller.whatsappNumber, fullMessage);
      
      // Show notification on mobile
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          setContactNotification({show: true, product});
          setTimeout(() => setContactNotification({show: false, product: null}), 3000);
        }, 1000);
      }
    } catch (error) {
      console.error('Error contacting seller:', error);
    }
  };

  // Helper functions for payment and delivery
  const paymentMethods = useMemo(() => {
    if (!seller?.paymentMethods) return [];
    return Array.isArray(seller.paymentMethods) ? seller.paymentMethods : [];
  }, [seller?.paymentMethods]);

  const deliveryOptions = useMemo(() => {
    if (!seller?.deliveryOptions) return [];
    return Array.isArray(seller.deliveryOptions) ? seller.deliveryOptions : [];
  }, [seller?.deliveryOptions]);

  const getPaymentIcon = (method: string) => {
    const key = method.toLowerCase();
    if (key.includes('mobile') || key.includes('momo')) return '📱';
    if (key.includes('card')) return '💳';
    if (key.includes('bank')) return '🏦';
    if (key.includes('cash')) return '💵';
    if (key.includes('paypal')) return '🔵';
    return '💳';
  };

  const getDeliveryIcon = (option: string) => {
    const key = option.toLowerCase();
    if (key.includes('pickup')) return '🏪';
    if (key.includes('delivery')) return '🚚';
    if (key.includes('shipping')) return '📦';
    if (key.includes('post')) return '📮';
    return '🚚';
  };

  const handleWhatsAppContact = async (product: Product) => {
    if (!seller || !sellerId) return;

    try {
      // Use the new contact handler
      await handleContactProduct(product);
    } catch (error) {
      console.error('Error contacting seller:', error);
      toast({
        title: 'Error',
        description: 'Failed to contact seller. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </PublicLayout>
    );
  }

  if (!seller) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <EmptyState
            title="Store not found"
            description="The store you are looking for does not exist or has been removed."
            action={{
              label: "Browse Other Stores",
              onClick: () => window.location.href = '/',
            }}
          />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Store Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shadow-soft">
                  {seller.logoUrl ? (
                    <img
                      src={seller.logoUrl}
                      alt={seller.storeName}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {seller.storeName[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {seller.storeName}
                </h1>
                {seller.storeDescription && (
                  <p className="text-muted-foreground mb-4">{seller.storeDescription}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  {(seller.city || seller.country) && (
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      📍 {seller.city ? `${seller.city}, ${seller.country}` : seller.country}
                    </Badge>
                  )}
                  
                  {/* Payment Methods */}
                  {paymentMethods.length > 0 && (
                    <Badge 
                      variant="outline" 
                      className="bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      💳 Payment Methods
                    </Badge>
                  )}
                  
                  {/* Delivery Options */}
                  {deliveryOptions.length > 0 && (
                    <Badge 
                      variant="outline" 
                      className="bg-green-50 text-green-700 cursor-pointer hover:bg-green-100"
                      onClick={() => setShowDeliveryModal(true)}
                    >
                      🚚 Delivery Options
                    </Badge>
                  )}
                  
                  <Badge variant="outline" className="bg-success/10 text-success">
                    🕒 Usually responds in 1 hour
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Card className="p-6 mb-8 shadow-soft">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-products"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant={showFavorites ? 'default' : 'outline'}
                onClick={() => setShowFavorites(!showFavorites)}
                data-testid="button-favorites"
              >
                <Heart className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Favorites</span>
              </Button>
            </div>
          </Card>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <EmptyState
              title="No products found"
              description={
                products.length === 0
                  ? "This store doesn't have any products yet."
                  : "Try adjusting your search or filter criteria."
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                  onClick={() => handleProductView(product)}
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="relative">
                    <img
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      className="w-full h-64 object-cover"
                      loading="lazy"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity ${
                        favorites.has(product.id) ? 'text-red-500' : 'text-gray-400'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                      data-testid={`button-favorite-${product.id}`}
                    >
                      <Heart className="w-4 h-4" fill={favorites.has(product.id) ? 'currentColor' : 'none'} />
                    </Button>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">
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
                        {product.chainLength && (
                          <Badge variant="secondary" className="text-xs">Length: {product.chainLength}</Badge>
                        )}
                        {product.pendantSize && (
                          <Badge variant="secondary" className="text-xs">Size: {product.pendantSize}</Badge>
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
                          <Badge variant="outline" className="text-xs">🎁 Gift Wrap Available</Badge>
                        )}
                      </div>
                      {(product.style || product.occasion || product.targetAgeGroup) && (
                        <div className="flex flex-wrap gap-1">
                          {product.style && (
                            <Badge variant="secondary" className="text-xs">{product.style} Style</Badge>
                          )}
                          {product.occasion && (
                            <Badge variant="secondary" className="text-xs">Perfect for {product.occasion}</Badge>
                          )}
                          {product.targetAgeGroup && (
                            <Badge variant="secondary" className="text-xs">For {product.targetAgeGroup}</Badge>
                          )}
                        </div>
                      )}
                      {(product.processingTime || product.shipsFrom) && (
                        <div className="flex flex-wrap gap-1">
                          {product.processingTime && (
                            <Badge variant="outline" className="text-xs">⏱️ {product.processingTime}</Badge>
                          )}
                          {product.shipsFrom && (
                            <Badge variant="outline" className="text-xs">✈️ Ships from {product.shipsFrom}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xl font-bold text-foreground">
                        {formatPrice(product.price)}
                      </span>
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                    
                    {/* WhatsApp Button */}
                    <Button
                      className="w-full bg-success text-success-foreground hover:bg-success/90 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsAppContact(product);
                      }}
                      data-testid={`button-whatsapp-${product.id}`}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact on WhatsApp
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Floating Chat Button */}
        {seller.whatsappNumber && (
          <button
            onClick={handleFloatingChatClick}
            className="fixed bottom-6 right-6 w-14 h-14 bg-success hover:bg-success/90 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-300 hover:scale-105"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        )}
        
        {/* Contact Notification */}
        {contactNotification.show && (
          <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
            <p className="text-sm font-medium">
              💬 Message sent! Check WhatsApp to continue your conversation about {contactNotification.product?.name}.
            </p>
          </div>
        )}
        
        {/* Payment Methods Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
            <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Methods
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowPaymentModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <span className="text-xl">{getPaymentIcon(method)}</span>
                      <span className="font-medium">{method}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Delivery Options Modal */}
        {showDeliveryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeliveryModal(false)}>
            <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Delivery Options
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowDeliveryModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {deliveryOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <span className="text-xl">{getDeliveryIcon(option)}</span>
                      <span className="font-medium">{option}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Product Detail Modal */}
        {showProductModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowProductModal(false)}>
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <img
                  src={getProductImageUrl(selectedProduct)}
                  alt={selectedProduct.name}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProductModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => toggleFavorite(selectedProduct.id, e)}
                  className={`absolute top-4 left-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full ${
                    favorites.has(selectedProduct.id) ? 'text-red-500' : 'text-gray-400'
                  }`}
                >
                  <Heart className="w-4 h-4" fill={favorites.has(selectedProduct.id) ? 'currentColor' : 'none'} />
                </Button>
              </div>
              
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">{selectedProduct.name}</h2>
                <p className="text-3xl font-bold text-success mb-4">{formatPrice(selectedProduct.price)}</p>
                
                {selectedProduct.description && (
                  <p className="text-muted-foreground mb-6">{selectedProduct.description}</p>
                )}
                
                {/* Product Attributes */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {selectedProduct.brand && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Brand:</span>
                      <p className="font-medium">{selectedProduct.brand}</p>
                    </div>
                  )}
                  {selectedProduct.condition && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Condition:</span>
                      <p className="font-medium capitalize">{selectedProduct.condition}</p>
                    </div>
                  )}
                  {selectedProduct.size && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Size:</span>
                      <p className="font-medium">{selectedProduct.size}</p>
                    </div>
                  )}
                  {selectedProduct.color && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Color:</span>
                      <p className="font-medium">{selectedProduct.color}</p>
                    </div>
                  )}
                  {selectedProduct.material && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Material:</span>
                      <p className="font-medium">{selectedProduct.material}</p>
                    </div>
                  )}
                  {selectedProduct.chainLength && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Chain Length:</span>
                      <p className="font-medium">{selectedProduct.chainLength}</p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleContactProduct(selectedProduct)}
                    className="flex-1 bg-success hover:bg-success/90"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Seller
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => toggleFavorite(selectedProduct.id, e)}
                  >
                    <Heart className={`w-4 h-4 ${favorites.has(selectedProduct.id) ? 'fill-current text-red-500' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
    </PublicLayout>
  );
}
