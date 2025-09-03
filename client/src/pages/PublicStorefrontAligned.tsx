import { useEffect, useMemo, useState, useCallback } from "react";
import { useRoute } from "wouter";
import { ref, onValue, off } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import {
  Globe,
  Search,
  X,
  Heart,
  MessageCircle,
  Filter,
  CreditCard,
  Truck,
  Loader2,
  Info,
  Sparkles,
  Share2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { database, db } from "@/lib/firebase";
import type { Product, Seller } from "@shared/schema";
import { formatPrice, getProductImageUrl } from "@/lib/utils/formatting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/** ——— constants & helpers ——— */
const PLACEHOLDER_IMAGE = "/placeholder-product.png";
const isNew = (p: Product) => Date.now() - (p.createdAt || 0) < 7 * 24 * 60 * 60 * 1000;
const normList = (v: any): string[] =>
  Array.isArray(v) ? v.filter(Boolean) : Object.entries(v || {}).filter(([, x]) => !!x).map(([k]) => k);

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

const getCategoryIcon = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    '💄 Beauty & Cosmetics': '💄',
    '📱 Electronics': '📱',
    '💍 Jewelry & Accessories': '💍',
    '🏡 Home & Garden': '🏡',
    '👕 Clothing': '👕',
    '📚 Books': '📚',
    '⚽ Sports': '⚽',
    '🧸 Toys': '🧸',
    '🍎 Food': '🍎',
    '💊 Health': '💊',
    '🎨 Art': '🎨',
    '🎵 Music': '🎵',
    '🚗 Automotive': '🚗',
    '✈️ Travel': '✈️',
    '📸 Photography': '📸',
    '👗 Fashion': '👗',
    '👜 Accessories': '👜',
    '👟 Footwear': '👟',
    '⌚ Watches': '⌚',
    '🎮 Gaming': '🎮',
    '🪑 Furniture': '🪑',
    '🔌 Appliances': '🔌',
    '🔧 Tools': '🔧',
    '📊 Office': '📊',
    '🧒 Kids': '🧒',
    '🐾 Pet Supplies': '🐾',
    '🏕️ Outdoor': '🏕️',
    '✂️ Crafts': '✂️',
    '🕰️ Vintage': '🕰️',
    '🤲 Handmade': '🤲'
  };
  
  // Try exact match first
  if (iconMap[category]) return iconMap[category];
  
  // Try partial match by checking if category contains key words
  for (const [key, icon] of Object.entries(iconMap)) {
    const cleanKey = key.replace(/[💄📱💍🏡👕📚⚽🧸🍎💊🎨🎵🚗✈️📸👗👜👟⌚🎮🪑🔌🔧📊🧒🐾🏕️✂️🕰️🤲]/g, '').trim().toLowerCase();
    if (category.toLowerCase().includes(cleanKey)) return icon;
  }
  
  return '📦';
};

export default function PublicStorefrontAligned() {
  // Route: /store-aligned/:sellerId
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
  const [sharePulseId, setSharePulseId] = useState<string | null>(null); // brief "copied" pulse

  // localStorage key
  const favKey = `shoplink_public_favs_${sellerId || "anon"}`;

  /** ——— data: seller (Firestore) ——— */
  useEffect(() => {
    if (!sellerId) return;

    const loadSeller = async () => {
      try {
        const sellerRef = doc(db, "sellers", sellerId);
        const sellerSnap = await getDoc(sellerRef);
        setSeller(sellerSnap.exists() ? ({ id: sellerId, ...(sellerSnap.data() as any) } as Seller) : null);
      } catch {
        setSeller(null);
      }
    };

    loadSeller();
  }, [sellerId]);

  /** ——— data: products (RTDB) ——— */
  useEffect(() => {
    if (!sellerId) return;

    setLoading(true);
    const productsRef = ref(database, `sellers/${sellerId}/products`);

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const list = Object.entries(data)
              .map(([id, productData]) => ({ id, ...(productData as Omit<Product, "id">) }))
              .filter((p) => p.isActive !== false);
            setProducts(list);
          } else {
            setProducts([]);
          }
        } finally {
          setLoading(false);
        }
      },
      () => setLoading(false)
    );

    return () => off(productsRef, "value", unsubscribe);
  }, [sellerId]);

  /** ——— favorites ——— */
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

  /** ——— categories ——— */
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c);
  }, [products]);

  /** ——— filter/sort ——— */
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
        const score = (p: Product) => ((p as any).analytics?.views || 0) + ((p as any).analytics?.favorites || 0);
        list.sort((a, b) => score(b) - score(a));
        break;
      }
      case "newest":
      default:
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return list;
  }, [products, searchQuery, categoryFilter, sortBy]);

  /** ——— images ——— */
  const onImageStart = (id: string) => setImageLoading((s) => ({ ...s, [id]: true }));
  const onImageLoad = (id: string) => setImageLoading((s) => ({ ...s, [id]: false }));
  const onImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const id = e.currentTarget.getAttribute("data-product-id") || "";
    setImageLoading((s) => ({ ...s, [id]: false }));
    e.currentTarget.src = PLACEHOLDER_IMAGE;
  };

  /** ——— product open/close + deep link ——— */
  const openProduct = (p: Product) => {
    setSelectedProduct(p);
    setShowProductModal(true);
    window.history.pushState(null, "", `#${p.id}`);
    document.body.classList.add("overflow-hidden");
  };

  const closeModal = useCallback(() => {
    setShowProductModal(false);
    setSelectedProduct(null);
    document.body.classList.remove("overflow-hidden");
    // preserve route; only clear hash
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);
  }, []);

  // deep-link support: open #product-id if present
  useEffect(() => {
    const hash = window.location.hash?.replace("#", "");
    if (!hash || !filtered.length) return;
    const p = filtered.find((x) => x.id === hash);
    if (p) setTimeout(() => openProduct(p), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length]);

  // respond to hashchange directly (e.g., back/forward)
  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash?.replace("#", "");
      if (!id) return closeModal();
      const p = filtered.find((x) => x.id === id);
      if (p) openProduct(p);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [filtered, closeModal]);

  /** ——— keyboard nav inside modal ——— */
  useEffect(() => {
    if (!showProductModal || !selectedProduct) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return closeModal();
      const idx = filtered.findIndex((p) => p.id === selectedProduct.id);
      if (e.key === "ArrowLeft" && idx > 0) {
        const prev = filtered[idx - 1];
        if (prev) openProduct(prev);
      }
      if (e.key === "ArrowRight" && idx < filtered.length - 1) {
        const next = filtered[idx + 1];
        if (next) openProduct(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showProductModal, selectedProduct, filtered]);

  /** ——— contact & share ——— */
  const contactNow = (p: Product) => {
    const number = seller?.whatsappNumber;
    const message = `Hi ${seller?.storeName || "there"}! I'm interested in "${p.name}" (${formatPrice(p.price)}).`;
    const url = waUrl(number, message);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareProduct = async (p: Product) => {
    const url = `${window.location.origin}/store-aligned/${sellerId}#${p.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: p.name, text: `${p.name} • ${formatPrice(p.price)}`, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setSharePulseId(p.id);
        setTimeout(() => setSharePulseId((v) => (v === p.id ? null : v)), 1500);
      } else {
        // minimal fallback
        window.open(url, "_blank");
      }
    } catch {
      // ignore user cancel
    }
  };

  /** ——— UI states (guard rails) ——— */
  if (!sellerId) {
    return (
      <Shell>
        <CenterCard>Invalid store link.</CenterCard>
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-3 text-slate-600 py-24">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-medium">Loading store…</span>
        </div>
      </Shell>
    );
  }

  if (!seller) {
    return (
      <Shell>
        <CenterCard>Store not found.</CenterCard>
      </Shell>
    );
  }

  const payments = normList(seller.paymentMethods);
  const deliveries = normList(seller.deliveryOptions);
  const ig = normalizeSocialUrl(seller.socialMedia?.instagram, "instagram");
  const fb = normalizeSocialUrl(seller.socialMedia?.facebook, "facebook");
  const tk = normalizeSocialUrl(seller.socialMedia?.tiktok, "tiktok");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 py-3 flex items-center justify-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="font-semibold">Official Storefront</span>
          <span className="opacity-80">• {seller.storeName || "Store"}</span>
        </div>
      </div>

      {/* header */}
      <div className="mx-auto max-w-6xl px-6 lg:px-8 pt-10 pb-8">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="h-24 w-24 rounded-full bg-white border border-slate-200 shadow-sm overflow-hidden grid place-items-center">
              {seller.logoUrl ? (
                <img src={seller.logoUrl} alt={`${seller.storeName || "Store"} logo`} className="h-full w-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-blue-600 grid place-items-center text-white text-2xl font-bold">
                  {(seller.storeName || "S").slice(0, 1)}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">{seller.storeName || "Store"}</h1>
              <div className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-blue-700">
                <Sparkles className="h-4 w-4" />
                Powered by ShopLynk
              </div>
              {seller.storeDescription && <p className="mt-3 max-w-2xl text-slate-600">{seller.storeDescription}</p>}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Chip icon={<Globe className="h-4 w-4" />} label={`${products.length} ${products.length === 1 ? "Product" : "Products"}`} />
              <Chip icon={<CreditCard className="h-4 w-4" />} label={`${payments.length} Payment Methods`} />
              <Chip icon={<Truck className="h-4 w-4" />} label={`${deliveries.length} Delivery Options`} />
            </div>

            {(ig || fb || tk) && (
              <div className="flex items-center gap-3">
                {ig && (
                  <a
                    href={ig}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300"
                  >
                    Instagram
                  </a>
                )}
                {fb && (
                  <a
                    href={fb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300"
                  >
                    Facebook
                  </a>
                )}
                {tk && (
                  <a
                    href={tk}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300"
                  >
                    TikTok
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* search & filters */}
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, categories…"
              className="h-14 pl-12 pr-10 rounded-xl border-slate-200 focus-visible:ring-0 focus-visible:border-blue-600 shadow-[0_1px_2px_rgba(16,24,40,.04)]"
              aria-label="Search products"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-slate-100"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Filter className="h-4 w-4" />
                Smart Filters
                <span className="inline-flex items-center justify-center h-6 w-auto min-w-[24px] px-2 bg-blue-600 text-white text-xs font-bold rounded-full">
                  {filtered.length} Result{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <SmartPill 
                icon="❤️" 
                label={`Show All`} 
                count={products.length}
                active={categoryFilter === "all"} 
                onClick={() => setCategoryFilter("all")} 
                variant="dark"
              />
              
              {categories.map((c) => {
                const categoryIcon = getCategoryIcon(c);
                const count = products.filter((p) => p.category === c).length;
                return (
                  <SmartPill
                    key={c}
                    icon={categoryIcon}
                    label={c.replace(/💄|📱|💍|🏡|👕/g, '').trim() || c}
                    count={count}
                    active={categoryFilter === c}
                    onClick={() => setCategoryFilter(categoryFilter === c ? "all" : c)}
                    variant="light"
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Sort by:</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="h-10 w-48 rounded-lg border-slate-200">
                  <SelectValue placeholder="🔽 Newest First" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">🔽 Newest First</SelectItem>
                  <SelectItem value="popular">⭐ Most Popular</SelectItem>
                  <SelectItem value="price-low">💰 Price: Low to High</SelectItem>
                  <SelectItem value="price-high">💰 Price: High to Low</SelectItem>
                  <SelectItem value="name">🔤 Name A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* grid */}
      <div className="mx-auto max-w-6xl px-6 lg:px-8 py-6">
        {filtered.length === 0 ? (
          <Empty />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => {
              const fav = favorites.has(p.id);
              return (
                <Card key={p.id} className="group rounded-2xl overflow-hidden border border-slate-200 shadow-[0_1px_2px_rgba(16,24,40,.06)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(16,24,40,.12)] transition">
                  <div className="relative">
                    <div className="aspect-square bg-slate-100">
                      <img
                        src={getProductImageUrl(p) || PLACEHOLDER_IMAGE}
                        alt={p.name}
                        data-product-id={p.id}
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                        onLoad={() => onImageLoad(p.id)}
                        onError={onImageError}
                        onLoadStart={() => onImageStart(p.id)}
                        loading="lazy"
                        decoding="async"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>

                    {imageLoading[p.id] && (
                      <div className="absolute inset-0 grid place-items-center bg-white/50 backdrop-blur-sm">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                      </div>
                    )}

                    {/* favorite */}
                    <button
                      onClick={() => toggleFavorite(p.id)}
                      className={[
                        "absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 border border-slate-200 hover:ring-1 hover:ring-slate-200 transition-transform active:scale-95",
                        fav ? "text-rose-600" : "text-slate-400",
                      ].join(" ")}
                      aria-pressed={fav}
                      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
                      <span className="sr-only">{fav ? "Favorited" : "Not favorited"}</span>
                    </button>

                    {/* overlays */}
                    <div className="absolute left-3 bottom-3 flex flex-wrap gap-2">
                      {isNew(p) && <SoftBadge color="emerald">New</SoftBadge>}
                      {p.quantity > 0 && p.quantity <= 5 && <SoftBadge color="rose">Limited</SoftBadge>}
                      {(p as any).features?.includes("featured") && <SoftBadge color="violet">Featured</SoftBadge>}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{p.name}</h3>
                      {p.brand && <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{p.brand}</div>}

                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-emerald-600">{formatPrice(p.price)}</div>
                        {(p as any).compareAtPrice && (p as any).compareAtPrice > p.price && (
                          <>
                            <div className="text-sm text-slate-400 line-through">{formatPrice((p as any).compareAtPrice)}</div>
                            <Badge className="bg-rose-600 text-white">
                              -{Math.round((((p as any).compareAtPrice - p.price) / (p as any).compareAtPrice) * 100)}%
                            </Badge>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Tag>{p.category}</Tag>
                        {p.subcategory && <Tag>{p.subcategory}</Tag>}
                      </div>

                      {p.quantity > 0 && p.quantity <= 10 && (
                        <div className="pt-1">
                          <Badge className="border border-rose-200 bg-rose-50 text-rose-700">Only {p.quantity} left</Badge>
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button variant="outline" className="border-slate-200 hover:bg-slate-50" onClick={() => openProduct(p)}>
                          View details
                        </Button>
                        <Button
                          disabled={!seller.whatsappNumber}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                          onClick={() => contactNow(p)}
                          title={seller.whatsappNumber ? "Contact seller on WhatsApp" : "Seller has not enabled WhatsApp"}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Contact
                        </Button>
                        <Button
                          variant="outline"
                          className={`col-span-2 border-slate-200 hover:bg-slate-50 ${sharePulseId === p.id ? "border-blue-500 text-blue-700" : ""}`}
                          onClick={() => shareProduct(p)}
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          {sharePulseId === p.id ? "Link copied" : "Share"}
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

      {/* modal */}
      {showProductModal && selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedProduct.name} details`}
        >
          <div className="mx-auto mt-6 max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <div className="aspect-[21/9] bg-slate-100">
                <img
                  src={getProductImageUrl(selectedProduct) || PLACEHOLDER_IMAGE}
                  alt={selectedProduct.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="absolute left-3 top-3 flex items-center gap-2">
                <Button variant="ghost" className="h-9 rounded-full bg-white/90" onClick={closeModal}>
                  <ArrowLeft className="h-5 w-5" />
                  <span className="ml-2 hidden sm:inline">Back</span>
                </Button>
              </div>

              {/* next/prev */}
              {filtered.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
                    onClick={() => {
                      const idx = filtered.findIndex((p) => p.id === selectedProduct.id);
                      if (idx > 0) openProduct(filtered[idx - 1]);
                    }}
                    aria-label="Previous product"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
                    onClick={() => {
                      const idx = filtered.findIndex((p) => p.id === selectedProduct.id);
                      if (idx < filtered.length - 1) openProduct(filtered[idx + 1]);
                    }}
                    aria-label="Next product"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div className="absolute left-3 bottom-3 flex flex-wrap gap-2">
                <SoftBadge color="slate">{selectedProduct.category}</SoftBadge>
                {selectedProduct.subcategory && <SoftBadge color="slate">{selectedProduct.subcategory}</SoftBadge>}
                {isNew(selectedProduct) && <SoftBadge color="emerald">New</SoftBadge>}
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedProduct.name}</h2>
                  {selectedProduct.brand && (
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{selectedProduct.brand}</div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-emerald-600">{formatPrice(selectedProduct.price)}</div>
                  {(selectedProduct as any).compareAtPrice && (selectedProduct as any).compareAtPrice > selectedProduct.price && (
                    <div className="mt-1 flex items-center gap-2 justify-end">
                      <div className="text-slate-400 line-through">{formatPrice((selectedProduct as any).compareAtPrice)}</div>
                      <Badge className="bg-rose-600 text-white">
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
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-700">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-semibold">Product description</span>
                  </div>
                  <p className="text-slate-700">{selectedProduct.description}</p>
                </div>
              )}

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                {row("Condition", selectedProduct.condition)}
                {row("Size", selectedProduct.size)}
                {row("Color", selectedProduct.color)}
                {row("Material", selectedProduct.material)}
              </div>

              <div
                className={[
                  "mt-6 rounded-xl border p-4",
                  selectedProduct.quantity > 10
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : selectedProduct.quantity > 0
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-rose-200 bg-rose-50 text-rose-800",
                ].join(" ")}
              >
                {selectedProduct.quantity > 10
                  ? "In stock & ready to ship"
                  : selectedProduct.quantity > 0
                  ? `Limited stock — only ${selectedProduct.quantity} left`
                  : "Currently out of stock"}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className={`border-slate-200 hover:bg-slate-50 ${sharePulseId === selectedProduct.id ? "border-blue-500 text-blue-700" : ""}`}
                  onClick={() => shareProduct(selectedProduct)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {sharePulseId === selectedProduct.id ? "Link copied" : "Share"}
                </Button>
                <Button
                  disabled={!seller.whatsappNumber}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                  onClick={() => contactNow(selectedProduct)}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact seller
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** ——— UI components ——— */
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">{children}</div>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
      {icon}
      {label}
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  const basePill = "h-8 px-3.5 text-sm font-semibold rounded-full border transition-colors";
  const pillInactive = `${basePill} bg-white text-slate-700 border-slate-200 hover:border-blue-300`;
  const pillActive = `${basePill} bg-blue-600 text-white border-blue-600`;
  
  return (
    <button
      onClick={onClick}
      className={active ? pillActive : pillInactive}
    >
      {label}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
      {children}
    </span>
  );
}

function SoftBadge({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "emerald" | "rose" | "violet" }) {
  const map: Record<string, string> = {
    slate: "bg-slate-900/80 text-white",
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border border-rose-200",
    violet: "bg-violet-600 text-white",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${map[color]}`}>{children}</span>;
}

function row(label?: string, value?: string) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function SmartPill({ 
  icon, 
  label, 
  count, 
  active, 
  onClick, 
  variant = "light" 
}: { 
  icon: string; 
  label: string; 
  count: number; 
  active?: boolean; 
  onClick: () => void; 
  variant?: "light" | "dark"; 
}) {
  const baseClasses = "h-8 px-3 text-sm font-semibold rounded-full border transition-colors inline-flex items-center gap-1.5";
  
  if (variant === "dark" && active) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} bg-slate-800 text-white border-slate-800`}
      >
        <span className="text-sm">{icon}</span>
        <span>{label}</span>
        <span className="text-xs opacity-80">{count}</span>
      </button>
    );
  }
  
  if (variant === "dark") {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} bg-slate-200 text-slate-700 border-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-800`}
      >
        <span className="text-sm">{icon}</span>
        <span>{label}</span>
        <span className="text-xs opacity-70">{count}</span>
      </button>
    );
  }
  
  // Light variant
  if (active) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} bg-blue-600 text-white border-blue-600`}
      >
        <span className="text-sm">{icon}</span>
        <span>{label}</span>
        <span className="text-xs opacity-90">{count}</span>
      </button>
    );
  }
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50`}
    >
      <span className="text-sm">{icon}</span>
      <span>{label}</span>
      <span className="text-xs opacity-70">{count}</span>
    </button>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <Search className="mx-auto h-10 w-10 text-slate-300" />
      <h3 className="mt-3 text-xl font-semibold text-slate-900">No products found</h3>
      <p className="mt-1 text-slate-600">Try a different search or adjust your filters.</p>
    </div>
  );
}