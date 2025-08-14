import React from 'react';
import { useState, useEffect } from 'react';
import { Copy, Share2, Eye, ExternalLink, MessageCircle, Package, BarChart3, Settings, ShoppingBag, Star, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ref, get, onValue, off, update } from 'firebase/database';
import { db } from './firebase';
import {
  standardizeSellerData,
  getProductImageUrl,
  formatProductForDisplay,
  formatPrice,
  formatPhoneForDisplay,
  isValidPhoneE164,
  phoneNeedsUpdate,
  createWhatsAppMessage
} from './sharedUtils';

const StorefrontView = ({ user, userProfile }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storefrontUrl, setStorefrontUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState(false);
  const [sellerData, setSellerData] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalContacts: 0,
    totalOrders: 0,
    activeProducts: 0,
    featuredProducts: 0,
    topCategories: [],
    recentActivity: []
  });

  // Standardize seller data structure on load
  useEffect(() => {
    if (userProfile) {
      const standardized = standardizeSellerData({ userProfile });
      setSellerData(standardized);
    }
  }, [userProfile]);

  // Check phone number validity on profile load using shared utility
  useEffect(() => {
    if (sellerData?.whatsappNumber) {
      const needsUpdate = phoneNeedsUpdate(sellerData.whatsappNumber);
      setPhoneWarning(needsUpdate);
    }
  }, [sellerData]);

  // Generate storefront URL
  useEffect(() => {
    if (user) {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/store/${user.uid}`;
      setStorefrontUrl(url);
    }
  }, [user]);

  // Load products with real-time updates using shared utilities
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const productsRef = ref(db, `users/${user.uid}/products`);
    
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const productsData = snapshot.val();
        const productsArray = Object.entries(productsData).map(([id, data]) => ({
          productId: id,
          ...formatProductForDisplay(data)
        }));
        
        // Sort by creation date and only show active products for preview
        const activeProducts = productsArray
          .filter(p => p.status === 'active' && p.quantity > 0)
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          
        setProducts(activeProducts);
        
        // Calculate enhanced analytics
        const totalViews = productsArray.reduce((sum, p) => sum + (p.analytics?.views || 0), 0);
        const totalContacts = productsArray.reduce((sum, p) => sum + (p.analytics?.contacts || 0), 0);
        const totalOrders = productsArray.reduce((sum, p) => sum + (p.analytics?.orders || 0), 0);
        const featuredProducts = productsArray.filter(p => p.featured).length;
        
        // Get top categories
        const categoryCount = {};
        activeProducts.forEach(p => {
          if (p.category) {
            categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
          }
        });
        
        const topCategories = Object.entries(categoryCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 4)
          .map(([category, count]) => ({ category, count }));
        
        // Get recent activity (products with engagement)
        const recentActivity = productsArray
          .filter(p => (p.analytics?.views || 0) > 0 || (p.analytics?.contacts || 0) > 0 || (p.analytics?.orders || 0) > 0)
          .sort((a, b) => {
            const aScore = (a.analytics?.views || 0) + (a.analytics?.contacts || 0) * 2 + (a.analytics?.orders || 0) * 3;
            const bScore = (b.analytics?.views || 0) + (b.analytics?.contacts || 0) * 2 + (b.analytics?.orders || 0) * 3;
            return bScore - aScore;
          })
          .slice(0, 5);
        
        setAnalytics({
          totalViews,
          totalContacts,
          totalOrders,
          activeProducts: activeProducts.length,
          featuredProducts,
          topCategories,
          recentActivity
        });
      } else {
        setProducts([]);
        setAnalytics({
          totalViews: 0,
          totalContacts: 0,
          totalOrders: 0,
          activeProducts: 0,
          featuredProducts: 0,
          topCategories: [],
          recentActivity: []
        });
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading products:', error);
      setLoading(false);
    });

    return () => off(productsRef, 'value', unsubscribe);
  }, [user]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storefrontUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWhatsAppShare = () => {
    // Use standardized message creation
    const message = createWhatsAppMessage.storeShare(sellerData, storefrontUrl);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleWhatsAppStatus = () => {
    // Use standardized message creation
    const message = createWhatsAppMessage.statusUpdate(sellerData, storefrontUrl);
    const statusUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    window.open(statusUrl, '_blank');
  };

  const getConversionRate = () => {
    if (analytics.totalViews === 0) return 0;
    return Math.round((analytics.totalContacts / analytics.totalViews) * 100);
  };

  const getOrderConversionRate = () => {
    if (analytics.totalContacts === 0) return 0;
    return Math.round((analytics.totalOrders / analytics.totalContacts) * 100);
  };

  const styles = {
    container: { position:'relative', minHeight:'100vh', width:'100vw', display:'flex', flexDirection:'column', overflow:'hidden' },
    bgGradient: { position:'absolute', inset:0, background:'radial-gradient(1200px 800px at 10% 10%, rgba(255,255,255,0.18), transparent 50%), linear-gradient(135deg, #6a5cff 0%, #7aa0ff 40%, #67d1ff 100%)', opacity:.8 },
    header: { position:'relative', zIndex:2, background:'rgba(255,255,255,0.86)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(255,255,255,0.2)', padding:'16px 20px' },
    headerContent: { display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:'1200px', margin:'0 auto' },
    title: { fontSize:24, fontWeight:800, background:'linear-gradient(135deg, #5a6bff, #67d1ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:0 },
    nav: { display:'flex', gap:8 },
    navButton: { display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.3)', color:'#374151', fontSize:14, fontWeight:600, cursor:'pointer', transition:'all 0.2s', textDecoration:'none' },
    navButtonActive: { background:'linear-gradient(135deg, #5a6bff, #67d1ff)', color:'white', border:'1px solid transparent' },
    content: { position:'relative', zIndex:1, flex:1, maxWidth:'1200px', margin:'0 auto', padding:'20px', width:'100%' },
    card: { background:'rgba(255,255,255,0.8)', backdropFilter:'blur(10px)', borderRadius:16, padding:24, marginBottom:20, border:'1px solid rgba(255,255,255,0.2)' },
    urlSection: { background:'rgba(255,255,255,0.9)', borderRadius:12, padding:16, marginBottom:20, border:'1px solid rgba(0,0,0,0.1)' },
    urlInput: { width:'100%', padding:'12px 16px', border:'1px solid rgba(0,0,0,0.1)', borderRadius:8, background:'#f8f9fa', fontSize:14, fontFamily:'monospace' },
    buttonRow: { display:'flex', gap:12, marginTop:12, flexWrap:'wrap' },
    button: { display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:14, fontWeight:600, transition:'all 0.2s' },
    primaryButton: { background:'linear-gradient(135deg, #5a6bff, #67d1ff)', color:'white' },
    secondaryButton: { background:'rgba(0,0,0,0.05)', color:'#374151', border:'1px solid rgba(0,0,0,0.1)' },
    whatsappButton: { background:'#25D366', color:'white' },
    statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:16, marginBottom:24 },
    statCard: { background:'rgba(255,255,255,0.9)', borderRadius:12, padding:16, textAlign:'center', border:'1px solid rgba(0,0,0,0.1)' },
    statNumber: { fontSize:24, fontWeight:800, margin:'0 0 4px 0' },
    statLabel: { fontSize:12, opacity:0.7, margin:0 },
    previewSection: { marginTop:24 },
    previewGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16, marginTop:16 },
    productCard: { background:'rgba(255,255,255,0.9)', borderRadius:12, overflow:'hidden', border:'1px solid rgba(0,0,0,0.1)', transition:'transform 0.2s' },
    productImage: { width:'100%', height:150, objectFit:'cover' },
    productInfo: { padding:12 },
    productName: { fontSize:14, fontWeight:600, margin:'0 0 4px 0' },
    productPrice: { fontSize:16, fontWeight:700, color:'#059669', margin:0 },
    emptyState: { textAlign:'center', padding:40, opacity:0.7 },
    modal: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 },
    modalContent: { background:'white', borderRadius:16, padding:24, maxWidth:400, width:'100%' },
    analyticsCard: { background:'rgba(255,255,255,0.9)', borderRadius:12, padding:16, border:'1px solid rgba(0,0,0,0.1)' },
    activityItem: { display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(0,0,0,0.05)' },
    activityImage: { width:40, height:40, borderRadius:8, objectFit:'cover' },
    activityInfo: { flex:1 },
    activityStats: { display:'flex', gap:8, fontSize:12, opacity:0.7 },
    warningBanner: { background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:12, padding:16, marginBottom:20, display:'flex', alignItems:'center', gap:12 }
  };

  return (
    <>
      <style>{`
        .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .copy-success { background: #22c55e !important; }
        .product-card:hover { transform: translateY(-2px); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={styles.container}>
        <div style={styles.bgGradient} />

        <header style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>🔗 My Storefront</h1>
            
            <nav style={styles.nav}>
              <button
                onClick={() => navigate('/catalog')}
                style={styles.navButton}
                className="btn-hover"
              >
                <Package size={16} />
                Catalog
              </button>
              <button
                onClick={() => navigate('/storefront')}
                style={{...styles.navButton, ...styles.navButtonActive}}
              >
                <ExternalLink size={16} />
                Storefront
              </button>
              <button
                onClick={() => navigate('/orders')}
                style={styles.navButton}
                className="btn-hover"
              >
                <ShoppingBag size={16} />
                Orders
              </button>
              <button
                onClick={() => navigate('/analytics')}
                style={styles.navButton}
                className="btn-hover"
              >
                <BarChart3 size={16} />
                Analytics
              </button>
              <button
                onClick={() => navigate('/settings')}
                style={styles.navButton}
                className="btn-hover"
              >
                <Settings size={16} />
                Settings
              </button>
            </nav>
          </div>
        </header>

        <div style={styles.content}>
          {phoneWarning && (
            <div style={styles.warningBanner}>
              <AlertCircle size={20} style={{ color:'#f59e0b', flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, color:'#92400e', marginBottom:4 }}>
                  WhatsApp Number Needs Updating
                </div>
                <div style={{ fontSize:14, color:'#a16207' }}>
                  Your WhatsApp number isn't in the correct format. Customers may not be able to contact you.
                </div>
              </div>
              <button
                onClick={() => navigate('/settings')}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                className="btn-hover"
              >
                Fix Now
              </button>
            </div>
          )}

          <div style={styles.card}>
            <h2 style={{ margin:'0 0 16px', fontSize:20, fontWeight:700 }}>
              🛍️ Your Store Link
            </h2>
            <p style={{ margin:'0 0 16px', opacity:0.7 }}>
              Share this link with customers to showcase your products
            </p>
            
            <div style={styles.urlSection}>
              <input 
                type="text" 
                value={storefrontUrl} 
                readOnly 
                style={styles.urlInput}
              />
              
              <div style={styles.buttonRow}>
                <button 
                  onClick={handleCopyLink}
                  style={{
                    ...styles.button,
                    ...(copied ? { background: '#22c55e', color: 'white' } : styles.secondaryButton)
                  }}
                  className="btn-hover"
                >
                  {copied ? '✅ Copied!' : <><Copy size={16} /> Copy Link</>}
                </button>
                
                <button 
                  onClick={() => window.open(storefrontUrl, '_blank')}
                  style={{...styles.button, ...styles.primaryButton}}
                  className="btn-hover"
                >
                  <Eye size={16} /> Preview Store
                </button>
                
                <button 
                  onClick={() => setShareModalOpen(true)}
                  style={{...styles.button, ...styles.secondaryButton}}
                  className="btn-hover"
                >
                  <Share2 size={16} /> Share Options
                </button>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={{ margin:'0 0 16px', fontSize:18, fontWeight:700 }}>
              📊 Store Performance
            </h3>
            
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color:'#059669'}}>{analytics.activeProducts}</div>
                <div style={styles.statLabel}>Active Products</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color:'#f59e0b'}}>{analytics.featuredProducts}</div>
                <div style={styles.statLabel}>Featured Products</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color:'#6366f1'}}>{analytics.totalViews}</div>
                <div style={styles.statLabel}>Total Views</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color:'#ec4899'}}>{analytics.totalContacts}</div>
                <div style={styles.statLabel}>WhatsApp Contacts</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color:'#10b981'}}>{analytics.totalOrders}</div>
                <div style={styles.statLabel}>Order Attempts</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color:'#8b5cf6'}}>{getConversionRate()}%</div>
                <div style={styles.statLabel}>View → Contact</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color:'#f97316'}}>{getOrderConversionRate()}%</div>
                <div style={styles.statLabel}>Contact → Order</div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginTop:20 }}>
              <div style={styles.analyticsCard}>
                <h4 style={{ margin:'0 0 12px', fontSize:16, fontWeight:600 }}>
                  📈 Top Categories
                </h4>
                {analytics.topCategories.length > 0 ? (
                  <div>
                    {analytics.topCategories.map(({ category, count }, index) => (
                      <div key={category} style={{ 
                        display:'flex', 
                        justifyContent:'space-between', 
                        alignItems:'center',
                        padding:'8px 0',
                        borderBottom: index < analytics.topCategories.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none'
                      }}>
                        <span style={{ fontSize:14 }}>{category}</span>
                        <span style={{ fontSize:14, fontWeight:600, color:'#059669' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin:0, opacity:0.6, fontSize:14 }}>No categories yet</p>
                )}
              </div>

              <div style={styles.analyticsCard}>
                <h4 style={{ margin:'0 0 12px', fontSize:16, fontWeight:600 }}>
                  🔥 Top Performing Products
                </h4>
                {analytics.recentActivity.length > 0 ? (
                  <div>
                    {analytics.recentActivity.map(product => (
                      <div key={product.productId} style={styles.activityItem}>
                        <img 
                          src={getProductImageUrl(product)} 
                          alt={product.name}
                          style={styles.activityImage}
                        />
                        <div style={styles.activityInfo}>
                          <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>
                            {product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name}
                          </div>
                          <div style={styles.activityStats}>
                            <span><Eye size={10} /> {product.analytics?.views || 0}</span>
                            <span><MessageCircle size={10} /> {product.analytics?.contacts || 0}</span>
                            {(product.analytics?.orders || 0) > 0 && (
                              <span><ShoppingBag size={10} /> {product.analytics?.orders || 0}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin:0, opacity:0.6, fontSize:14 }}>No activity yet</p>
                )}
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:700 }}>
              📱 Store Preview
            </h3>
            <p style={{ margin:'0 0 16px', opacity:0.7, fontSize:14 }}>
              This is how customers will see your store
            </p>

            {loading ? (
              <div style={{ textAlign:'center', padding:40 }}>
                <div style={{ width:32, height:32, border:'3px solid #eee', borderTop:'3px solid #5a6bff', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
                <p>Loading products...</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <div style={{ background:'rgba(90,107,255,0.05)', borderRadius:12, padding:16, marginBottom:16 }}>
                  <h4 style={{ margin:'0 0 4px', fontSize:16, fontWeight:700 }}>
                    {sellerData?.storeName || 'My Store'}
                  </h4>
                  <p style={{ margin:0, fontSize:14, opacity:0.8 }}>
                    {sellerData?.storeDescription || 'Welcome to my store!'}
                  </p>
                </div>
                
                <div style={styles.previewGrid}>
                  {products.slice(0, 6).map(product => (
                    <div key={product.productId} style={styles.productCard} className="product-card">
                      <div style={{ position: 'relative' }}>
                        <img 
                          src={getProductImageUrl(product)} 
                          alt={product.name}
                          style={styles.productImage}
                        />
                        {product.featured && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Star size={8} />
                            Featured
                          </div>
                        )}
                        {product.isLowStock && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(245, 158, 11, 0.9)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            Low Stock
                          </div>
                        )}
                      </div>
                      <div style={styles.productInfo}>
                        <h5 style={styles.productName}>{product.name}</h5>
                        <p style={styles.productPrice}>{formatPrice(product.price, sellerData?.currency)}</p>
                        {product.analytics && (product.analytics.views > 0 || product.analytics.contacts > 0 || product.analytics.orders > 0) && (
                          <div style={{ display: 'flex', gap: '8px', fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                            <span><Eye size={8} /> {product.analytics.views || 0}</span>
                            <span><MessageCircle size={8} /> {product.analytics.contacts || 0}</span>
                            {(product.analytics.orders || 0) > 0 && (
                              <span><ShoppingBag size={8} /> {product.analytics.orders || 0}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {products.length > 6 && (
                  <p style={{ textAlign:'center', marginTop:16, opacity:0.7, fontSize:14 }}>
                    + {products.length - 6} more products in your store
                  </p>
                )}
              </>
            ) : (
              <div style={styles.emptyState}>
                <h4>No active products</h4>
                <p>Add some products to your catalog to populate your storefront</p>
                <button
                  onClick={() => navigate('/catalog')}
                  style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #5a6bff, #67d1ff)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  className="btn-hover"
                >
                  Go to Catalog
                </button>
              </div>
            )}
          </div>

          <div style={styles.card}>
            <h3 style={{ margin:'0 0 16px', fontSize:18, fontWeight:700 }}>
              🏪 Store Information
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16 }}>
              <div>
                <div style={{ fontSize:12, opacity:0.7, marginBottom:4 }}>Store Name</div>
                <div style={{ fontSize:16, fontWeight:600 }}>
                  {sellerData?.storeName || 'Not set'}
                </div>
              </div>
              <div>
                <div style={{ fontSize:12, opacity:0.7, marginBottom:4 }}>Business Category</div>
                <div style={{ fontSize:16, fontWeight:600 }}>
                  {sellerData?.businessCategory || 'Not set'}
                </div>
              </div>
              <div>
                <div style={{ fontSize:12, opacity:0.7, marginBottom:4 }}>WhatsApp Number</div>
                <div style={{ fontSize:16, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                  {sellerData?.whatsappNumber ? (
                    <>
                      {formatPhoneForDisplay(sellerData.whatsappNumber)}
                      {!isValidPhoneE164(sellerData.whatsappNumber) && (
                        <span style={{ 
                          fontSize:10, 
                          background:'rgba(245,158,11,0.1)', 
                          color:'#d97706', 
                          padding:'2px 6px', 
                          borderRadius:'4px',
                          fontWeight:500
                        }}>
                          Needs update
                        </span>
                      )}
                    </>
                  ) : (
                    'Not set'
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize:12, opacity:0.7, marginBottom:4 }}>Location</div>
                <div style={{ fontSize:16, fontWeight:600 }}>
                  {sellerData?.location || 'Not set'}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize:12, opacity:0.7, marginBottom:4 }}>Store Description</div>
                <div style={{ fontSize:14, lineHeight:1.5 }}>
                  {sellerData?.storeDescription || 'No description added yet'}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin:'0 0 16px', fontSize:20, fontWeight:700 }}>
              🚀 Quick Actions
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16 }}>
              <button 
                onClick={() => window.open(storefrontUrl, '_blank')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                className="btn-hover"
              >
                <Eye size={20} style={{ marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '600' }}>Preview Store</h4>
                <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>See how customers view your store</p>
              </button>
              
              <button 
                onClick={() => setShareModalOpen(true)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                className="btn-hover"
              >
                <Share2 size={20} style={{ marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '600' }}>Share Store</h4>
                <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Promote your marketplace</p>
              </button>
              
              <button 
                onClick={() => navigate('/catalog')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                className="btn-hover"
              >
                <Package size={20} style={{ marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '600' }}>Manage Products</h4>
                <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Add and edit your catalog</p>
              </button>
              
              <button 
                onClick={() => navigate('/analytics')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                className="btn-hover"
              >
                <BarChart3 size={20} style={{ marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '600' }}>View Analytics</h4>
                <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Track your performance</p>
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={{ margin:'0 0 16px', fontSize:18, fontWeight:700 }}>
              💡 Store Optimization Tips
            </h3>
            <div style={{ display:'grid', gap:12 }}>
              <div style={{
                padding: '12px',
                background: (!phoneWarning && sellerData?.whatsappNumber) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ 
                  fontSize: '20px',
                  background: (!phoneWarning && sellerData?.whatsappNumber) ? '#22c55e' : '#f59e0b',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {(!phoneWarning && sellerData?.whatsappNumber) ? '✓' : '!'}
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {(!phoneWarning && sellerData?.whatsappNumber)
                      ? 'WhatsApp number is properly configured'
                      : 'Set up your WhatsApp number correctly'
                    }
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    {(!phoneWarning && sellerData?.whatsappNumber)
                      ? `Customers can reach you at ${formatPhoneForDisplay(sellerData.whatsappNumber)}`
                      : 'Add your WhatsApp number in international format to receive customer messages'
                    }
                  </div>
                </div>
              </div>

              <div style={{
                padding: '12px',
                background: analytics.featuredProducts > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ 
                  fontSize: '20px',
                  background: analytics.featuredProducts > 0 ? '#22c55e' : '#f59e0b',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {analytics.featuredProducts > 0 ? '✓' : '!'}
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {analytics.featuredProducts > 0 
                      ? `Great! You have ${analytics.featuredProducts} featured products`
                      : 'Feature your best products'
                    }
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    {analytics.featuredProducts > 0 
                      ? 'Featured products get more visibility and drive more sales'
                      : 'Mark your best-selling or newest products as featured to boost visibility'
                    }
                  </div>
                </div>
              </div>

              <div style={{
                padding: '12px',
                background: analytics.totalViews > 10 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ 
                  fontSize: '20px',
                  background: analytics.totalViews > 10 ? '#22c55e' : '#f59e0b',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {analytics.totalViews > 10 ? '✓' : '!'}
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {analytics.totalViews > 10 
                      ? `Excellent! ${analytics.totalViews} total product views`
                      : 'Start promoting your store'
                    }
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    {analytics.totalViews > 10 
                      ? 'Your products are getting good visibility. Keep promoting!'
                      : 'Share your store link on WhatsApp, social media, and with friends'
                    }
                  </div>
                </div>
              </div>

              <div style={{
                padding: '12px',
                background: getConversionRate() > 10 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ 
                  fontSize: '20px',
                  background: getConversionRate() > 10 ? '#22c55e' : '#f59e0b',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getConversionRate() > 10 ? '✓' : '!'}
                </div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {getConversionRate() > 10 
                      ? `Great conversion rate: ${getConversionRate()}%`
                      : 'Optimize your product descriptions'
                    }
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    {getConversionRate() > 10 
                      ? 'Customers are engaging well with your products'
                      : 'Add detailed descriptions, multiple images, and competitive pricing'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {shareModalOpen && (
          <div style={styles.modal} onClick={() => setShareModalOpen(false)}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin:'0 0 16px', fontSize:20, fontWeight:700 }}>
                📤 Share Your Store
              </h3>
              
              <div style={{ display:'grid', gap:12 }}>
                <button 
                  onClick={handleWhatsAppShare}
                  style={{...styles.button, ...styles.whatsappButton, justifyContent:'flex-start'}}
                  className="btn-hover"
                >
                  <MessageCircle size={16} /> Share via WhatsApp Chat
                </button>
                
                <button 
                  onClick={handleWhatsAppStatus}
                  style={{...styles.button, background:'#128C7E', color:'white', justifyContent:'flex-start'}}
                  className="btn-hover"
                >
                  <Share2 size={16} /> Post to WhatsApp Status
                </button>
                
                <button 
                  onClick={handleCopyLink}
                  style={{...styles.button, ...styles.secondaryButton, justifyContent:'flex-start'}}
                  className="btn-hover"
                >
                  <Copy size={16} /> Copy Store Link
                </button>
              </div>
              
              <button 
                onClick={() => setShareModalOpen(false)}
                style={{...styles.button, ...styles.secondaryButton, width:'100%', marginTop:16, justifyContent:'center'}}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StorefrontView;