import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Eye, Search, X, Heart, MessageCircle, Filter, CreditCard, Truck, Globe, Loader2, Info, Sparkles } from "lucide-react";
import { db } from "@/lib/firebase";
import type { Product, Seller } from "@shared/schema";
import { formatPrice, getProductImageUrl } from "@/lib/utils/formatting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/** ——— helpers ——— */
const PLACEHOLDER_IMAGE = "/placeholder-product.png";
const isNew = (p: Product) => Date.now() - (p.createdAt || 0) < 7 * 24 * 60 * 60 * 1000;
const normList = (v: any): string[] => (Array.isArray(v) ? v : Object.entries(v || {}).filter(([, x]) => !!x).map(([k]) => k));

const normalizeSocialUrl = (value?: string, platform?: "instagram" | "facebook" | "tiktok") => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || /^javascript:|^data:/i.test(trimmed)) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  if (platform === "instagram") return `https://instagram.com/${encodeURIComponent(handle)}`;
  if (platform === "facebook") return `https://facebook.com/${encodeURIComponent(handle)}`;
  if (platform === "tiktok") return `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
  return trimmed;
};

const waUrl = (phone?: string, msg?: string) => {
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d+]/g, "");
  return `https://wa.me/${digits.replace(/^\+/, "")}?text=${encodeURIComponent(msg || "")}`;
};

export default function PublicStorefrontAligned() {
  // /store-aligned/:sellerId  (works with wouter; if you pass sellerId as a prop, you can swap this out)
  const [, params] = useRoute("/store-aligned/:sellerId");
  const sellerId = params?.sellerId;

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "name" | "popular">("newest");

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  // localStorage key
  const favKey = `shoplink_public_favs_${sellerId || "anon"}`;

  // Load seller + products from Firestore
  useEffect(() => {
    if (!sellerId) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load seller data from Firestore
        const sellerRef = doc(db, 'sellers', sellerId);
        const sellerSnap = await getDoc(sellerRef);
        
        if (sellerSnap.exists()) {
          const sellerData = { id: sellerId, ...sellerSnap.data() } as Seller;
          setSeller(sellerData);

          // Load products from Firestore subcollection
          const productsRef = collection(db, 'sellers', sellerId, 'products');
          const productsSnap = await getDocs(productsRef);
          
          const productsList: Product[] = [];
          productsSnap.forEach((doc) => {
            const productData = doc.data() as Omit<Product, 'id'>;
            if (productData.isActive !== false) { // Include products that are active or undefined
              productsList.push({ id: doc.id, ...productData });
            }
          });
          
          setProducts(productsList);
        } else {
          setSeller(null);
          setProducts([]);
        }
      } catch (error) {
        console.error('Error loading store data:', error);
        setSeller(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sellerId]);

  // Load favorites
  useEffect(() => {
    try {
      const saved = localStorage.getItem(favKey);
      setFavorites(saved ? new Set(JSON.parse(saved)) : new Set());
    } catch {
      setFavorites(new Set());
    }
  }, [favKey]);

  const toggleFavorite = (id: string) => {
    const next = new Set(favorites);
    next.has(id) ? next.delete(id) : next.add(id);
    setFavorites(next);
    try {
      localStorage.setItem(favKey, JSON.stringify(Array.from(next)));
    } catch {}
  };

  // Categories
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c);
  }, [products]);

  // Filter/sort
  const filtered = useMemo(() => {
    const terms = searchQuery.toLowerCase().split(" ").filter(Boolean);
    let list = products.filter((p) => {
      const text = [p.name, p.description, p.category, p.brand, p.color, (p as any).tags?.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        terms.length === 0 || terms.every((t) => text.includes(t) || text.split(" ").some((w) => w.includes(t)));
      const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCat;
    });

    switch (sortBy) {
      case "price-low":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        list.sort((a, b) => b.price - a.price);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "popular": {
        const score = (p: Product) =>
          ((p as any).analytics?.views || 0) + ((p as any).analytics?.favorites || 0);
        list.sort((a, b) => score(b) - score(a));
        break;
      }
      case "newest":
      default:
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return list;
  }, [products, searchQuery, categoryFilter, sortBy]);

  const onImageStart = (id: string) => setImageLoading((s) => ({ ...s, [id]: true }));
  const onImageLoad = (id: string) => setImageLoading((s) => ({ ...s, [id]: false }));
  const onImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const id = e.currentTarget.getAttribute("data-product-id") || "";
    setImageLoading((s) => ({ ...s, [id]: false }));
    e.currentTarget.src = PLACEHOLDER_IMAGE;
  };

  const openProduct = (p: Product) => {
    setSelectedProduct(p);
    setShowProductModal(true);
    window.history.pushState(null, "", `#${p.id}`);
  };

  const contactNow = (p: Product) => {
    const number = seller?.whatsappNumber;
    const message = `Hi ${seller?.storeName || "there"}! I'm interested in "${p.name}" (${formatPrice(
      p.price
    )}).`;
    const url = waUrl(number, message);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  /** ——— UI ——— */
  if (!sellerId) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background:'#f6f9ff' }}>
        <div className="glass card" style={{ padding:20 }}>
          <p style={{ color:'var(--ink-light)' }}>Invalid store link.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background:'#f6f9ff' }}>
        <div className="flex items-center gap-3" style={{ color:'var(--ink-light)' }}>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-medium">Loading store…</span>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background:'#f6f9ff' }}>
        <div className="glass card" style={{ padding:20 }}>
          <p style={{ color:'var(--ink-light)' }}>Store not found.</p>
        </div>
      </div>
    );
  }

  const payments = normList(seller.paymentMethods);
  const deliveries = normList(seller.deliveryOptions);
  const ig = normalizeSocialUrl(seller.socialMedia?.instagram, "instagram");
  const fb = normalizeSocialUrl(seller.socialMedia?.facebook, "facebook");
  const tk = normalizeSocialUrl(seller.socialMedia?.tiktok, "tiktok");

  return (
    <div style={{ minHeight:'100vh', position:'relative', overflowX:'hidden', background:'#f6f9ff' }}>
      {/* Enterprise design system CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        :root{
          --font:'Inter',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial;
          --ink:#0f172a; --ink-2:#334155; --ink-3:#64748b;
          --surface:rgba(255,255,255,.78); --surface-strong:rgba(255,255,255,.86);
          --border:rgba(2,6,23,.08);
          --shadow: 0 5px 14px rgba(2,6,23,.06);
          --shadow-strong: 0 12px 28px rgba(2,6,23,.10);
          --accent:#5b7cff; --grad-soft:linear-gradient(180deg,#eef5ff 0%,#ffffff 100%);
          --radius-hero:20px; --radius-card:14px; --radius-btn:14px;
        }
        *{box-sizing:border-box}
        body{font-family:var(--font)}
        .container{max-width:1200px;margin:0 auto;padding:0 clamp(16px,4vw,28px)}
        .glass{
          background:var(--surface);
          border:1px solid rgba(2,6,23,.07);
          backdrop-filter:saturate(140%) blur(10px);
          -webkit-backdrop-filter:saturate(140%) blur(10px);
          box-shadow:var(--shadow);
        }
        .card{border-radius:var(--radius-card)}
        .hero{
          border-radius:var(--radius-hero);
          background:var(--grad-soft);
          border:1px solid rgba(2,6,23,.06);
        }
        .btn{
          height:52px; padding:0 22px; border-radius:var(--radius-btn);
          font-weight:700; font-size:16px; border:1px solid rgba(2,6,23,.06);
          cursor:pointer; transition:box-shadow .15s ease, transform .08s ease, background .2s ease;
        }
        .btn:active{ transform:translateY(1px) }
        .btnPrimary{
          color:#0f172a;
          background: linear-gradient(180deg,#ffffff 0%, #f7faff 100%);
          box-shadow: 0 5px 14px rgba(2,6,23,.07);
        }
        .btnPrimary:hover{ box-shadow: 0 8px 20px rgba(2,6,23,.09); }
        .btnSecondary{
          background:#ffffff; color:#0f172a; border:1px solid rgba(2,6,23,.10);
          box-shadow:0 4px 12px rgba(2,6,23,.06);
        }
        .grid{display:grid;gap:22px}
        .pill{
          border-radius:var(--radius-btn);
          padding:10px 18px;
          font-weight:600;
          font-size:14px;
          transition:all .15s ease;
          cursor:pointer;
          border:1px solid rgba(2,6,23,.07);
        }
        .pill.active{
          background:var(--accent);
          color:#ffffff;
          border-color:var(--accent);
        }
        .pill:not(.active){
          background:#ffffff;
          color:var(--ink-2);
        }
        .pill:not(.active):hover{
          background:rgba(91,124,255,.05);
          border-color:rgba(91,124,255,.2);
        }
        .mono{font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;}
      `}</style>

      {/* soft background accents */}
      <div style={{
        position:'absolute', top:'-12%', left:'-8%', width:'34%', height:'44%',
        background:'radial-gradient(circle, rgba(147,197,253,0.18) 0%, transparent 70%)',
        borderRadius:'50%', filter:'blur(36px)', zIndex:0
      }} />
      <div style={{
        position:'absolute', bottom:'-12%', right:'-10%', width:'28%', height:'38%',
        background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        borderRadius:'50%', filter:'blur(38px)', zIndex:0
      }} />

      <div style={{ position:'relative', zIndex:1 }}>
        {/* Official banner */}
        <div style={{ background:'linear-gradient(135deg,#5b7cff 0%, #4f46e5 100%)', color:'#ffffff' }}>
          <div className="container" style={{ padding:'12px clamp(16px,4vw,28px)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <Globe className="h-4 w-4" />
            <span style={{ fontWeight:700 }}>Official Storefront</span>
            <span style={{ opacity:.8 }}>• {seller.storeName || "Store"}</span>
          </div>
        </div>

        {/* Header */}
        <div className="container" style={{ paddingTop:28, paddingBottom:24 }}>
          <div className="glass hero" style={{ padding:28 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:20 }}>
              <div style={{ 
                width:96, height:96, borderRadius:'50%', 
                background:'#ffffff', border:'1px solid rgba(2,6,23,.06)', 
                boxShadow:'var(--shadow)', overflow:'hidden', display:'grid', placeItems:'center' 
              }}>
                {seller.logoUrl ? (
                  <img src={seller.logoUrl} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  <div style={{ 
                    width:72, height:72, borderRadius:'50%', 
                    background:'var(--accent)', display:'grid', placeItems:'center', 
                    color:'#ffffff', fontSize:28, fontWeight:900 
                  }}>
                    {(seller.storeName || "S").slice(0, 1)}
                  </div>
                )}
              </div>

              <div>
                <h1 style={{
                  fontSize:'clamp(32px, 5vw, 48px)', lineHeight:1.06, margin:'0 0 8px',
                  fontWeight:900, letterSpacing:'-0.015em', color:'var(--ink)'
                }}>
                  {seller.storeName || "Store"}
                </h1>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:14, fontWeight:700, color:'var(--accent)' }}>
                  <Sparkles className="h-4 w-4" />
                  Powered by ShopLynk
                </div>
                {seller.storeDescription && (
                  <p style={{ marginTop:12, maxWidth:600, color:'var(--ink-2)', lineHeight:1.5 }}>{seller.storeDescription}</p>
                )}
              </div>

              <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:12 }}>
                <Chip icon={<Globe className="h-4 w-4" />} label={`${products.length} ${products.length === 1 ? "Product" : "Products"}`} />
                <Chip icon={<CreditCard className="h-4 w-4" />} label={`${payments.length} Payment Methods`} />
                <Chip icon={<Truck className="h-4 w-4" />} label={`${deliveries.length} Delivery Options`} />
              </div>

              {/* Socials */}
              {(ig || fb || tk) && (
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {ig && (
                    <a href={ig} target="_blank" rel="noreferrer" className="btnSecondary btn" style={{ height:44, padding:'0 16px' }}>
                      Instagram
                    </a>
                  )}
                  {fb && (
                    <a href={fb} target="_blank" rel="noreferrer" className="btnSecondary btn" style={{ height:44, padding:'0 16px' }}>
                      Facebook
                    </a>
                  )}
                  {tk && (
                    <a href={tk} target="_blank" rel="noreferrer" className="btnSecondary btn" style={{ height:44, padding:'0 16px' }}>
                      TikTok
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search & filters */}
        <div className="container" style={{ paddingBottom:6 }}>
          <div className="glass card" style={{ padding:20 }}>
            <div style={{ position:'relative' }}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color:'var(--ink-3)' }} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, categories…"
                style={{
                  paddingLeft:48, paddingRight:40, height:52,
                  borderRadius:'var(--radius-btn)', border:'1px solid rgba(2,6,23,.07)',
                  background:'#ffffff', fontSize:16
                }}
                className="focus-visible:ring-0 focus-visible:border-blue-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" style={{ color:'var(--ink-3)' }} />
                </button>
              )}
            </div>

            <div style={{ marginTop:18, display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:12 }}>
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, fontWeight:700, color:'var(--ink)' }}>
                  <Filter className="h-4 w-4" /> Categories
                </span>
                <Pill active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")} label={`All (${products.length})`} />
                {categories.map((c) => (
                  <Pill
                    key={c}
                    active={categoryFilter === c}
                    onClick={() => setCategoryFilter(categoryFilter === c ? "all" : c)}
                    label={`${c} (${products.filter((p) => p.category === c).length})`}
                  />
                ))}
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'flex-end' }}>
                <span style={{ fontSize:14, color:'var(--ink-2)' }}>Sort by:</span>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger style={{ height:44, width:200, borderRadius:'var(--radius-btn)', border:'1px solid rgba(2,6,23,.07)' }}>
                    <SelectValue placeholder="Newest first" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="popular">Most popular</SelectItem>
                    <SelectItem value="price-low">Price: low to high</SelectItem>
                    <SelectItem value="price-high">Price: high to low</SelectItem>
                    <SelectItem value="name">Name A–Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="container" style={{ paddingTop:6, paddingBottom:40 }}>
          {filtered.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:20 }}>
              {filtered.map((p) => {
                const fav = favorites.has(p.id);
                return (
                  <Card key={p.id} className="glass card" style={{ overflow:'hidden', transition:'box-shadow .18s ease, transform .12s ease' }}>
                    <div style={{ position:'relative' }}>
                      <div style={{ aspectRatio:'1/1', background:'#f8fafc' }}>
                        <img
                          src={getProductImageUrl(p) || PLACEHOLDER_IMAGE}
                          alt={p.name}
                          data-product-id={p.id}
                          style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onLoad={() => onImageLoad(p.id)}
                          onError={onImageError}
                          onLoadStart={() => onImageStart(p.id)}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>

                      {imageLoading[p.id] && (
                        <div className="absolute inset-0 grid place-items-center" style={{ background:'rgba(255,255,255,.5)', backdropFilter:'blur(4px)' }}>
                          <Loader2 className="h-6 w-6 animate-spin" style={{ color:'var(--ink-3)' }} />
                        </div>
                      )}

                      {/* favorite */}
                      <button
                        onClick={() => toggleFavorite(p.id)}
                        className="absolute right-3 top-3"
                        style={{
                          width:36, height:36, borderRadius:'50%',
                          border:'1px solid rgba(2,6,23,.07)', background:'rgba(255,255,255,.9)',
                          boxShadow:'var(--shadow)', display:'grid', placeItems:'center',
                          color: fav ? '#dc2626' : 'var(--ink-3)'
                        }}
                        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
                      </button>

                      {/* overlays */}
                      <div className="absolute left-3 bottom-3 flex flex-wrap gap-2">
                        {isNew(p) && <SoftBadge color="emerald">New</SoftBadge>}
                        {p.quantity > 0 && p.quantity <= 5 && <SoftBadge color="rose">Limited</SoftBadge>}
                        {(p as any).features?.includes("featured") && <SoftBadge color="violet">Featured</SoftBadge>}
                      </div>
                    </div>

                    <CardContent style={{ padding:18 }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                        <h3 style={{ fontSize:16, fontWeight:700, color:'var(--ink)', lineHeight:1.4, minHeight:44, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.name}</h3>
                        {p.brand && <div style={{ fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--ink-3)' }}>{p.brand}</div>}

                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ fontSize:18, fontWeight:900, color:'#10b981' }}>{formatPrice(p.price)}</div>
                          {(p as any).compareAtPrice && (p as any).compareAtPrice > p.price && (
                            <>
                              <div style={{ fontSize:14, color:'var(--ink-3)', textDecoration:'line-through' }}>
                                {formatPrice((p as any).compareAtPrice)}
                              </div>
                              <Badge style={{ background:'#dc2626', color:'#ffffff' }}>
                                -
                                {Math.round((((p as any).compareAtPrice - p.price) / (p as any).compareAtPrice) * 100)}%
                              </Badge>
                            </>
                          )}
                        </div>

                        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                          <Tag>{p.category}</Tag>
                          {p.subcategory && <Tag>{p.subcategory}</Tag>}
                        </div>

                        {p.quantity > 0 && p.quantity <= 10 && (
                          <div>
                            <Badge style={{ background:'#dc2626', color:'#ffffff' }}>Only {p.quantity} left</Badge>
                          </div>
                        )}

                        <div style={{ display:'flex', gap:8, marginTop:6 }}>
                          <Button
                            variant="outline"
                            className="btnSecondary"
                            style={{ flex:1, height:44, borderRadius:'var(--radius-btn)' }}
                            onClick={() => openProduct(p)}
                          >
                            View details
                          </Button>

                          <Button
                            disabled={!seller.whatsappNumber}
                            className="btnPrimary"
                            style={{ flex:1, height:44, borderRadius:'var(--radius-btn)', background:'#10b981', border:'1px solid #10b981' }}
                            onClick={() => contactNow(p)}
                            title={seller.whatsappNumber ? "Contact seller on WhatsApp" : "Seller has not enabled WhatsApp"}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Product modal */}
        {showProductModal && selectedProduct && (
          <div className="fixed inset-0 z-50" style={{ background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)' }} onClick={() => setShowProductModal(false)}>
            <div className="mx-auto mt-6 max-w-5xl overflow-hidden" style={{ borderRadius:'var(--radius-hero)', background:'#ffffff', boxShadow:'var(--shadow-strong)' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ position:'relative' }}>
                <div style={{ aspectRatio:'21/9', background:'#f8fafc' }}>
                  <img
                    src={getProductImageUrl(selectedProduct) || PLACEHOLDER_IMAGE}
                    alt={selectedProduct.name}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  />
                </div>
                <Button variant="ghost" className="absolute right-3 top-3" style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,.9)' }} onClick={() => setShowProductModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
                <div className="absolute left-3 bottom-3 flex flex-wrap gap-2">
                  <SoftBadge color="slate">{selectedProduct.category}</SoftBadge>
                  {selectedProduct.subcategory && <SoftBadge color="slate">{selectedProduct.subcategory}</SoftBadge>}
                  {isNew(selectedProduct) && <SoftBadge color="emerald">New</SoftBadge>}
                </div>
              </div>

              <div style={{ padding:24 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div style={{ display:'flex', flexWrap:'wrap', alignItems:'start', justifyContent:'space-between', gap:20 }}>
                    <div style={{ maxWidth:600 }}>
                      <h2 style={{ fontSize:28, fontWeight:900, color:'var(--ink)', margin:'0 0 6px' }}>{selectedProduct.name}</h2>
                      {selectedProduct.brand && (
                        <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--ink-3)' }}>
                          {selectedProduct.brand}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:32, fontWeight:900, color:'#10b981' }}>{formatPrice(selectedProduct.price)}</div>
                      {(selectedProduct as any).compareAtPrice && (selectedProduct as any).compareAtPrice > selectedProduct.price && (
                        <div style={{ marginTop:4, display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
                          <div style={{ color:'var(--ink-3)', textDecoration:'line-through' }}>{formatPrice((selectedProduct as any).compareAtPrice)}</div>
                          <Badge style={{ background:'#dc2626', color:'#ffffff' }}>
                            -
                            {Math.round(
                              (((selectedProduct as any).compareAtPrice - selectedProduct.price) /
                                (selectedProduct as any).compareAtPrice) *
                                100
                            )}
                            %
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedProduct.description && (
                    <div className="glass card" style={{ padding:16 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, color:'var(--ink)' }}>
                        <Info className="h-4 w-4" />
                        <span style={{ fontSize:14, fontWeight:700 }}>Product description</span>
                      </div>
                      <p style={{ color:'var(--ink-2)', lineHeight:1.5 }}>{selectedProduct.description}</p>
                    </div>
                  )}

                  <div className="grid" style={{ gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
                    {row("Condition", selectedProduct.condition)}
                    {row("Size", selectedProduct.size)}
                    {row("Color", selectedProduct.color)}
                    {row("Material", selectedProduct.material)}
                  </div>

                  <div
                    className="card"
                    style={{
                      padding:16,
                      border:'1px solid',
                      borderColor: selectedProduct.quantity > 10 ? '#10b981' : selectedProduct.quantity > 0 ? '#f59e0b' : '#dc2626',
                      background: selectedProduct.quantity > 10 ? '#ecfdf5' : selectedProduct.quantity > 0 ? '#fef3c7' : '#fef2f2',
                      color: selectedProduct.quantity > 10 ? '#065f46' : selectedProduct.quantity > 0 ? '#92400e' : '#991b1b'
                    }}
                  >
                    {selectedProduct.quantity > 10
                      ? "In stock & ready to ship"
                      : selectedProduct.quantity > 0
                      ? `Limited stock — only ${selectedProduct.quantity} left`
                      : "Currently out of stock"}
                  </div>

                  <div style={{ display:'flex', flexDirection:'column-reverse', gap:12, alignItems:'stretch' }}>
                    <Button variant="outline" className="btnSecondary" style={{ height:52 }} onClick={() => setShowProductModal(false)}>
                      Close
                    </Button>
                    <Button
                      disabled={!seller.whatsappNumber}
                      className="btnPrimary"
                      style={{ height:52, background:'#10b981', border:'1px solid #10b981', opacity: !seller.whatsappNumber ? .6 : 1 }}
                      onClick={() => contactNow(selectedProduct)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Contact seller
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** ——— UI bits reused from preview ——— */
function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ 
      display:'inline-flex', alignItems:'center', gap:6, 
      borderRadius:'var(--radius-btn)', border:'1px solid rgba(2,6,23,.07)', 
      background:'#ffffff', padding:'10px 16px', 
      fontSize:14, fontWeight:600, color:'var(--ink-2)', 
      boxShadow:'var(--shadow)' 
    }}>
      {icon}
      {label}
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`pill ${active ? 'active' : ''}`}
    >
      {label}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ 
      display:'inline-flex', alignItems:'center', 
      borderRadius:'var(--radius-btn)', border:'1px solid rgba(91,124,255,.2)', 
      background:'rgba(91,124,255,.1)', padding:'6px 12px', 
      fontSize:12, fontWeight:600, color:'var(--accent)' 
    }}>
      {children}
    </span>
  );
}

function SoftBadge({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "emerald" | "rose" | "violet" }) {
  const map: Record<string, string> = {
    slate: "background:rgba(15,23,42,.8);color:#ffffff",
    emerald: "background:#10b981;color:#ffffff",
    rose: "background:#dc2626;color:#ffffff",
    violet: "background:#8b5cf6;color:#ffffff"
  };
  return <span style={{ borderRadius:'var(--radius-btn)', padding:'6px 12px', fontSize:12, fontWeight:700, ...parseStyle(map[color]) }}>{children}</span>;
}

function parseStyle(styleStr: string) {
  return styleStr.split(';').reduce((acc, rule) => {
    const [prop, value] = rule.split(':');
    if (prop && value) acc[prop.trim()] = value.trim();
    return acc;
  }, {} as any);
}

function row(label?: string, value?: string) {
  if (!value) return null;
  return (
    <div className="glass card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px' }}>
      <span style={{ fontSize:14, fontWeight:600, color:'var(--ink-2)' }}>{label}</span>
      <span style={{ fontSize:14, fontWeight:700, color:'var(--ink)' }}>{value}</span>
    </div>
  );
}

function Empty() {
  return (
    <div className="glass card" style={{ padding:40, textAlign:'center' }}>
      <Search className="mx-auto h-10 w-10" style={{ color:'var(--ink-3)' }} />
      <h3 style={{ marginTop:12, fontSize:20, fontWeight:700, color:'var(--ink)' }}>No products found</h3>
      <p style={{ marginTop:4, color:'var(--ink-2)' }}>Try a different search or adjust your filters.</p>
    </div>
  );
}