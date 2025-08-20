import React, { useState, useEffect } from 'react';
import {
  Copy, Share2, Eye, ExternalLink, MessageCircle,
  Package, BarChart3, Settings, ShoppingBag, Star, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, off } from 'firebase/database';
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
import { trackCatalogShared } from './track'; // ⬅️ NEW

const StorefrontView = ({ user, userProfile }) => {
  const navigate = useNavigate();

  // -------------------- state --------------------
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

  // -------------------- effects --------------------
  useEffect(() => {
    if (userProfile) {
      const standardized = standardizeSellerData({ userProfile });
      setSellerData(standardized);
    }
  }, [userProfile]);

  useEffect(() => {
    if (sellerData?.whatsappNumber) {
      const needsUpdate = phoneNeedsUpdate(sellerData.whatsappNumber);
      setPhoneWarning(needsUpdate);
    }
  }, [sellerData]);

  useEffect(() => {
    if (user) {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/store/${user.uid}`;
      setStorefrontUrl(url);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const productsRef = ref(db, `users/${user.uid}/products`);

    const handleSnapshot = (snapshot) => {
      if (snapshot.exists()) {
        const productsData = snapshot.val();
        const productsArray = Object.entries(productsData).map(([id, data]) => ({
          productId: id,
          ...formatProductForDisplay(data)
        }));

        const activeProducts = productsArray
          .filter(p => p.status === 'active' && p.quantity > 0)
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setProducts(activeProducts);

        const totalViews = productsArray.reduce((s, p) => s + (p.analytics?.views || 0), 0);
        const totalContacts = productsArray.reduce((s, p) => s + (p.analytics?.contacts || 0), 0);
        const totalOrders = productsArray.reduce((s, p) => s + (p.analytics?.orders || 0), 0);
        const featuredProducts = productsArray.filter(p => p.featured).length;

        const categoryCount = {};
        activeProducts.forEach(p => {
          if (p.category) categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
        });
        const topCategories = Object.entries(categoryCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([category, count]) => ({ category, count }));

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
    };

    onValue(productsRef, handleSnapshot, (error) => {
      console.error('Error loading products:', error);
      setLoading(false);
    });

    return () => off(productsRef, 'value', handleSnapshot);
  }, [user]);

  // -------------------- handlers --------------------
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storefrontUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      // 🔐 analytics
      try { await trackCatalogShared(user?.uid, 'copy'); } catch (e) {}
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWhatsAppShare = async () => {
    const message = createWhatsAppMessage.storeShare(sellerData, storefrontUrl);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    // 🔐 analytics
    try { await trackCatalogShared(user?.uid, 'whatsapp'); } catch (e) {}
    window.open(whatsappUrl, '_blank');
  };

  const handleWhatsAppStatus = async () => {
    const maker =
      typeof createWhatsAppMessage.statusUpdate === 'function'
        ? createWhatsAppMessage.statusUpdate
        : createWhatsAppMessage.storeShare;

    const message = maker(sellerData, storefrontUrl);
    const statusUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    // 🔐 analytics
    try { await trackCatalogShared(user?.uid, 'status'); } catch (e) {}
    window.open(statusUrl, '_blank');
  };

  // -------------------- derived --------------------
  const getConversionRate = () => {
    if (analytics.totalViews === 0) return 0;
    return Math.round((analytics.totalContacts / analytics.totalViews) * 100);
  };

  const getOrderConversionRate = () => {
    if (analytics.totalContacts === 0) return 0;
    return Math.round((analytics.totalOrders / analytics.totalContacts) * 100);
  };

  // -------------------- styles --------------------
  const styles = { /* …unchanged styles… */ };

  // -------------------- render --------------------
  return (
    <>
      <style>{`
        .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .copy-success { background: #22c55e !important; }
        .product-card:hover { transform: translateY(-2px); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* …UNCHANGED JSX CONTENT… */}
      {/* (Everything below remains exactly as you posted, except for the three handlers above) */}
    </>
  );
};

export default StorefrontView;