import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Package, Users, MessageCircle, ExternalLink, BarChart3, ShoppingBag, Settings, Eye } from 'lucide-react';

const AnalyticsView = ({ user, userProfile }) => {
  const navigate = useNavigate();
  
  // Mock analytics data - updated for contact/inquiry tracking
  const [timeframe, setTimeframe] = useState('7days');
  
  const analytics = {
    '7days': {
      totalViews: 142,
      totalContacts: 18,
      uniqueVisitors: 35,
      topProducts: [
        { name: 'African Print Dress', views: 45, contacts: 8, contactRate: '17.8%' },
        { name: 'Handmade Jewelry Set', views: 32, contacts: 5, contactRate: '15.6%' },
        { name: 'Kente Cloth Bag', views: 28, contacts: 3, contactRate: '10.7%' }
      ],
      dailyViews: [22, 18, 25, 30, 19, 16, 12],
      dailyContacts: [3, 2, 4, 5, 2, 1, 1]
    },
    '30days': {
      totalViews: 587,
      totalContacts: 76,
      uniqueVisitors: 142,
      topProducts: [
        { name: 'African Print Dress', views: 156, contacts: 28, contactRate: '17.9%' },
        { name: 'Handmade Jewelry Set', views: 134, contacts: 22, contactRate: '16.4%' },
        { name: 'Plantain Chips', views: 98, contacts: 12, contactRate: '12.2%' }
      ],
      dailyViews: Array(30).fill(0).map(() => Math.floor(Math.random() * 35) + 10),
      dailyContacts: Array(30).fill(0).map(() => Math.floor(Math.random() * 8) + 1)
    }
  };

  const currentData = analytics[timeframe];

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
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
    timeframePicker: { display:'flex', gap:8, marginBottom:24 },
    timeframeBtn: { padding:'8px 16px', borderRadius:20, border:'1px solid rgba(0,0,0,0.1)', background:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:12, fontWeight:600 },
    timeframeBtnActive: { background:'linear-gradient(135deg, #5a6bff, #67d1ff)', color:'#fff', border:'1px solid transparent' },
    metricsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:20, marginBottom:32 },
    metricCard: { background:'rgba(255,255,255,0.8)', backdropFilter:'blur(10px)', borderRadius:16, padding:24, border:'1px solid rgba(255,255,255,0.2)' },
    metricIcon: { width:48, height:48, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 },
    metricValue: { fontSize:32, fontWeight:800, margin:'0 0 4px 0' },
    metricLabel: { fontSize:14, opacity:.7, margin:0 },
    chartCard: { background:'rgba(255,255,255,0.8)', backdropFilter:'blur(10px)', borderRadius:16, padding:24, marginBottom:24, border:'1px solid rgba(255,255,255,0.2)' },
    chartTitle: { fontSize:18, fontWeight:700, marginBottom:16 },
    chart: { height:200, background:'rgba(90,107,255,0.05)', borderRadius:8, display:'flex', alignItems:'end', gap:4, padding:16 },
    chartBar: { flex:1, borderRadius:'2px 2px 0 0', minHeight:10 },
    topProductsCard: { background:'rgba(255,255,255,0.8)', backdropFilter:'blur(10px)', borderRadius:16, padding:24, border:'1px solid rgba(255,255,255,0.2)' },
    productRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid rgba(0,0,0,0.05)' },
    productName: { fontWeight:600 },
    productStats: { display:'flex', gap:16, fontSize:14, opacity:.8 },
    dualChart: { display:'flex', gap:8 },
    dualChartBar: { flex:1, display:'flex', flexDirection:'column', justifyContent:'end', gap:2 }
  };

  const maxViews = Math.max(...currentData.dailyViews);
  const maxContacts = Math.max(...currentData.dailyContacts);

  return (
    <>
      <style>{`
        .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      `}</style>

      <div style={styles.container}>
        <div style={styles.bgGradient} />

        <header style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>📊 Analytics</h1>
            
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
                style={styles.navButton}
                className="btn-hover"
              >
                <ShoppingBag size={16} />
                Inquiries
              </button>
              <button
                onClick={() => navigate('/analytics')}
                style={{...styles.navButton, ...styles.navButtonActive}}
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
          {/* Timeframe Picker */}
          <div style={styles.timeframePicker}>
            {[
              { key: '7days', label: 'Last 7 Days' },
              { key: '30days', label: 'Last 30 Days' }
            ].map(option => (
              <button
                key={option.key}
                onClick={() => setTimeframe(option.key)}
                style={{
                  ...styles.timeframeBtn,
                  ...(timeframe === option.key ? styles.timeframeBtnActive : {})
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Key Metrics */}
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <div style={{...styles.metricIcon, background:'rgba(59,130,246,0.1)'}}>
                <Eye size={24} style={{color:'#3b82f6'}} />
              </div>
              <div style={{...styles.metricValue, color:'#3b82f6'}}>
                {formatNumber(currentData.totalViews)}
              </div>
              <div style={styles.metricLabel}>Total Product Views</div>
            </div>

            <div style={styles.metricCard}>
              <div style={{...styles.metricIcon, background:'rgba(34,197,94,0.1)'}}>
                <MessageCircle size={24} style={{color:'#059669'}} />
              </div>
              <div style={{...styles.metricValue, color:'#059669'}}>
                {formatNumber(currentData.totalContacts)}
              </div>
              <div style={styles.metricLabel}>Seller Contacts</div>
            </div>

            <div style={styles.metricCard}>
              <div style={{...styles.metricIcon, background:'rgba(168,85,247,0.1)'}}>
                <Users size={24} style={{color:'#a855f7'}} />
              </div>
              <div style={{...styles.metricValue, color:'#a855f7'}}>
                {formatNumber(currentData.uniqueVisitors)}
              </div>
              <div style={styles.metricLabel}>Unique Visitors</div>
            </div>

            <div style={styles.metricCard}>
              <div style={{...styles.metricIcon, background:'rgba(245,158,11,0.1)'}}>
                <TrendingUp size={24} style={{color:'#d97706'}} />
              </div>
              <div style={{...styles.metricValue, color:'#d97706'}}>
                {((currentData.totalContacts / currentData.totalViews) * 100).toFixed(1)}%
              </div>
              <div style={styles.metricLabel}>Contact Conversion Rate</div>
            </div>
          </div>

          {/* Daily Activity Chart */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Daily Activity</h3>
            <div style={styles.chart}>
              {currentData.dailyViews.map((views, index) => (
                <div key={index} style={styles.dualChartBar}>
                  <div
                    style={{
                      ...styles.chartBar,
                      background: 'linear-gradient(to top, #3b82f6, #60a5fa)',
                      height: `${Math.max((views / maxViews) * 120, 8)}px`,
                      marginBottom: '2px'
                    }}
                    title={`${views} views`}
                  />
                  <div
                    style={{
                      ...styles.chartBar,
                      background: 'linear-gradient(to top, #059669, #10b981)',
                      height: `${Math.max((currentData.dailyContacts[index] / maxContacts) * 60, 4)}px`
                    }}
                    title={`${currentData.dailyContacts[index]} contacts`}
                  />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:16, fontSize:12 }}>
              <div style={{ display:'flex', gap:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{ width:12, height:12, background:'#3b82f6', borderRadius:2 }} />
                  <span style={{ opacity:.7 }}>Views</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{ width:12, height:12, background:'#059669', borderRadius:2 }} />
                  <span style={{ opacity:.7 }}>Contacts</span>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', width:'100%', opacity:.6 }}>
                <span>Start</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Top Products Performance */}
          <div style={styles.topProductsCard}>
            <h3 style={styles.chartTitle}>Product Performance</h3>
            {currentData.topProducts.map((product, index) => (
              <div key={index} style={styles.productRow}>
                <div>
                  <div style={styles.productName}>#{index + 1} {product.name}</div>
                </div>
                <div style={styles.productStats}>
                  <span>{product.views} views</span>
                  <span>{product.contacts} contacts</span>
                  <span style={{ color:'#059669', fontWeight:'600' }}>{product.contactRate}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>📈 Insights</h3>
            <div style={{ display:'grid', gap:12 }}>
              <div style={{ padding:12, background:'rgba(59,130,246,0.1)', borderRadius:8, borderLeft:'4px solid #3b82f6' }}>
                <strong style={{ color:'#3b82f6' }}>Product Interest:</strong> Your products are getting {formatNumber(currentData.totalViews)} views with a {((currentData.totalContacts / currentData.totalViews) * 100).toFixed(1)}% contact rate.
              </div>
              <div style={{ padding:12, background:'rgba(34,197,94,0.1)', borderRadius:8, borderLeft:'4px solid #22c55e' }}>
                <strong style={{ color:'#059669' }}>Best Performer:</strong> {currentData.topProducts[0]?.name} has the highest engagement with {currentData.topProducts[0]?.contacts} contacts from {currentData.topProducts[0]?.views} views.
              </div>
              <div style={{ padding:12, background:'rgba(168,85,247,0.1)', borderRadius:8, borderLeft:'4px solid #a855f7' }}>
                <strong style={{ color:'#a855f7' }}>Store Traffic:</strong> You've had {formatNumber(currentData.uniqueVisitors)} unique visitors browsing your store in this period.
              </div>
              <div style={{ padding:12, background:'rgba(245,158,11,0.1)', borderRadius:8, borderLeft:'4px solid #f59e0b' }}>
                <strong style={{ color:'#d97706' }}>Growth Tip:</strong> Products with higher contact rates tend to have clear descriptions and competitive pricing. Consider optimizing underperforming listings.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsView;