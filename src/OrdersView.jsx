import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Clock, CheckCircle, Package, ExternalLink, BarChart3, Settings } from 'lucide-react';

const OrdersView = ({ user, userProfile }) => {
  const navigate = useNavigate();
  
  // Mock orders data - will be replaced with Firebase
  const [orders] = useState([
    {
      orderId: '1',
      customerName: 'John Doe',
      customerPhone: '+233240123456',
      productName: 'African Print Dress',
      quantity: 1,
      price: 45000,
      status: 'new',
      orderDate: new Date('2025-08-09'),
      notes: 'Size Medium please'
    },
    {
      orderId: '2',
      customerName: 'Jane Smith',
      customerPhone: '+233241234567',
      productName: 'Handmade Jewelry Set',
      quantity: 2,
      price: 30000,
      status: 'paid',
      orderDate: new Date('2025-08-08'),
      notes: ''
    }
  ]);

  const formatPrice = (price) => {
    const currency = userProfile?.currency || 'GHS';
    return new Intl.NumberFormat('en-NG', { 
      style:'currency', 
      currency: currency, 
      minimumFractionDigits:0 
    }).format(price);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'new': return <Clock size={16} style={{ color: '#f59e0b' }} />;
      case 'paid': return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      case 'fulfilled': return <Package size={16} style={{ color: '#6366f1' }} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return { background: 'rgba(245,158,11,0.1)', color: '#d97706' };
      case 'paid': return { background: 'rgba(16,185,129,0.1)', color: '#059669' };
      case 'fulfilled': return { background: 'rgba(99,102,241,0.1)', color: '#4f46e5' };
      default: return { background: 'rgba(156,163,175,0.1)', color: '#6b7280' };
    }
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
    statsRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:16, marginBottom:24 },
    statCard: { background:'rgba(255,255,255,0.8)', backdropFilter:'blur(10px)', borderRadius:12, padding:20, textAlign:'center', border:'1px solid rgba(255,255,255,0.2)' },
    statNumber: { fontSize:28, fontWeight:800, margin:'0 0 4px 0' },
    statLabel: { fontSize:12, opacity:.7, margin:0 },
    ordersGrid: { display:'grid', gap:16 },
    orderCard: { background:'rgba(255,255,255,0.8)', backdropFilter:'blur(10px)', borderRadius:16, padding:20, border:'1px solid rgba(255,255,255,0.2)' },
    orderHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 },
    orderInfo: { flex:1 },
    orderMeta: { textAlign:'right' },
    customerName: { fontSize:18, fontWeight:700, margin:'0 0 4px 0' },
    productName: { fontSize:14, opacity:.8, margin:'0 0 8px 0' },
    orderDetails: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:16, marginTop:16 },
    detailItem: { textAlign:'center' },
    detailLabel: { fontSize:12, opacity:.6, marginBottom:4 },
    detailValue: { fontSize:14, fontWeight:600 },
    statusBadge: { display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:600 },
    emptyState: { textAlign:'center', padding:60, background:'rgba(255,255,255,0.7)', backdropFilter:'blur(10px)', borderRadius:16, border:'1px solid rgba(255,255,255,0.2)' }
  };

  const newOrders = orders.filter(o => o.status === 'new').length;
  const paidOrders = orders.filter(o => o.status === 'paid').length;
  const fulfilledOrders = orders.filter(o => o.status === 'fulfilled').length;
  const totalRevenue = orders.filter(o => o.status !== 'new').reduce((sum, o) => sum + o.price, 0);

  return (
    <>
      <style>{`
        .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      `}</style>

      <div style={styles.container}>
        <div style={styles.bgGradient} />

        <header style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>📋 Orders</h1>
            
            {/* Navigation */}
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
                style={styles.navButton}
                className="btn-hover"
              >
                <ExternalLink size={16} />
                Storefront
              </button>
              <button
                onClick={() => navigate('/orders')}
                style={{...styles.navButton, ...styles.navButtonActive}}
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
          {/* Stats */}
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{newOrders}</div>
              <div style={styles.statLabel}>New Orders</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: '#10b981' }}>{paidOrders}</div>
              <div style={styles.statLabel}>Paid Orders</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: '#6366f1' }}>{fulfilledOrders}</div>
              <div style={styles.statLabel}>Fulfilled</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: '#059669' }}>{formatPrice(totalRevenue)}</div>
              <div style={styles.statLabel}>Revenue</div>
            </div>
          </div>

          {/* Orders List */}
          {orders.length > 0 ? (
            <div style={styles.ordersGrid}>
              {orders.map(order => (
                <div key={order.orderId} style={styles.orderCard}>
                  <div style={styles.orderHeader}>
                    <div style={styles.orderInfo}>
                      <h3 style={styles.customerName}>{order.customerName}</h3>
                      <p style={styles.productName}>{order.productName} × {order.quantity}</p>
                      <div style={{ fontSize:20, fontWeight:800, color:'#059669' }}>
                        {formatPrice(order.price)}
                      </div>
                    </div>
                    <div style={styles.orderMeta}>
                      <div style={{...styles.statusBadge, ...getStatusColor(order.status)}}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </div>
                      <div style={{ fontSize:12, opacity:.6, marginTop:8 }}>
                        {order.orderDate.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.orderDetails}>
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Customer Phone</div>
                      <div style={styles.detailValue}>{order.customerPhone}</div>
                    </div>
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Quantity</div>
                      <div style={styles.detailValue}>{order.quantity} items</div>
                    </div>
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Order ID</div>
                      <div style={styles.detailValue}>#{order.orderId}</div>
                    </div>
                  </div>

                  {order.notes && (
                    <div style={{ marginTop:16, padding:12, background:'rgba(0,0,0,0.05)', borderRadius:8 }}>
                      <div style={{ fontSize:12, opacity:.6, marginBottom:4 }}>Customer Notes:</div>
                      <div style={{ fontSize:14 }}>"{order.notes}"</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <ShoppingBag size={64} style={{ opacity:.3, marginBottom:16 }} />
              <h3>No orders yet</h3>
              <p>Orders will appear here when customers place them via your storefront</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrdersView;