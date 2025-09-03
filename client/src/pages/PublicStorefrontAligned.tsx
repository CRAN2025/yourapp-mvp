import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { ref, onValue, off } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import {
  Eye,
  Search,
  X,
  Heart,
  MessageCircle,
  Filter,
  CreditCard,
  Truck,
  Globe,
  Loader2,
  Info,
  Sparkles
} from "lucide-react";
import { database, db } from "@/lib/firebase";
import type { Product, Seller } from "@shared/schema";
import { formatPrice, getProductImageUrl } from "@/lib/utils/formatting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/** ——— helpers ——— */
const PLACEHOLDER_IMAGE = "/placeholder-product.png";
const isNew = (p: Product) =>
  Date.now() - (p.createdAt || 0) < 7 * 24 * 60 * 60 * 1000;
const normList = (v: any): string[] =>
  Array.isArray(v)
    ? v
    : Object.entries(v || {})
        .filter(([, x]) => !!x)
        .map(([k]) => k);

const normalizeSocialUrl = (
  value?: string,
  platform?: "instagram" | "facebook" | "tiktok"
) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || /^javascript:|^data:/i.test(trimmed)) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  if (platform === "instagram")
    return `https://instagram.com/${encodeURIComponent(handle)}`;
  if (platform === "facebook")
    return `https://facebook.com/${encodeURIComponent(handle)}`;
  if (platform === "tiktok")
    return `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
  return trimmed;
};

const waUrl = (phone?: string, msg?: string) => {
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d+]/g, "");
  return `https://wa.me/${digits.replace(/^\+/, "")}?text=${encodeURIComponent(
    msg || ""
  )}`;
};

/** ——— main ——— */
export default function PublicStorefrontAligned() {
  // /store-aligned/:sellerId
  const [, params] = useRoute("/store-aligned/:sellerId");
  const sellerId = params?.sellerId;

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "price-low" | "price-high" | "name" | "popular"
  >("newest");

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  // localStorage key
  const favKey = `shoplink_public_favs_${sellerId || "anon"}`;

  // Load seller from Firestore
  useEffect(() => {
    if (!sellerId) return;

    const loadSeller = async () => {
      try {
        const sellerRef = doc(db, "sellers", sellerId);
        const sellerSnap = await getDoc(sellerRef);

        if (sellerSnap.exists()) {
          const sellerData = { id: sellerId, ...sellerSnap.data() } as Seller;
          setSeller(sellerData);
        } else {
          setSeller(null);
        }
      } catch {
        setSeller(null);
      }
    };

    loadSeller();
  }, [sellerId]);

  // Load products from Realtime Database
  useEffect(() => {
    if (!sellerId) return;

    setLoading(true);
    const productsRef = ref(database, `sellers/${sellerId}/products`);

    const unsubscribe = onValue(productsRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const productsList = Object.entries(data)
            .map(([id, productData]) => ({
              id,
              ...(productData as Omit<Product, "id">)
            }))
            .filter((p) => p.isActive !== false);

          setProducts(productsList);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    });

    return () => off(productsRef, "value", unsubscribe);
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
    products.forEach(
      (p) => (counts[p.category] = (counts[p.category] || 0) + 1)
    );
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c);
  }, [products]);

  // Filter/sort
  const filtered = useMemo(() => {
    const terms = searchQuery.toLowerCase().split(" ").filter(Boolean);
    let list = products.filter((p) => {
      const text = [
        p.name,
        p.description,
        p.category,
        p.brand,
        p.color,
        (p as any).tags?.join(" ")
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        terms.length === 0 ||
        terms.every(
          (t) => text.includes(t) || text.split(" ").some((w) => w.includes(t))
        );
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
          ((p as any).analytics?.views || 0) +
          ((p as any).analytics?.favorites || 0);
        list.sort((a, b) => score(b) - score(a));
        break;
      }
      case "newest":
      default:
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return list;
  }, [products, searchQuery, categoryFilter, sortBy]);

  const onImageStart = (id: string) =>
    setImageLoading((s) => ({ ...s, [id]: true }));
  const onImageLoad = (id: string) =>
    setImageLoading((s) => ({ ...s, [id]: false }));
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
    const message = `Hi ${
      seller?.storeName || "there"
    }! I'm interested in "${p.name}" (${formatPrice(p.price)}).`;
    const url = waUrl(number, message);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  /** ——— UI ——— */
  if (!sellerId) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
          Invalid store link.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-medium">Loading store…</span>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
          Store not found.
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
    <div className="min-h-screen bg-slate-50">
      {/* slim top ribbon */}
      <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 text-white">
        <div className="mx-auto max-w-7xl px-6 py-2 flex items-center justify-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="font-semibold">Official Storefront</span>
          <span className="opacity-80">• {seller.storeName || "Store"}</span>
        </div>
      </div>

      {/* Hero: brand gradient + glass panel */}
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_500px_at_20%_-10%,rgba(59,130,246,0.25),transparent),radial-gradient(1200px_500px_at_80%_-10%,rgba(99,102,241,0.25),transparent)]" />
        <div className="mx-auto max-w-7xl px-6 pt-8 pb-6 relative">
          <div className="rounded-3xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6 md:p-8">
            <div className="flex flex-col items-center text-center gap-6">
              {/* logo */}
              <div className="h-28 w-28 rounded-full grid place-items-center bg-gradient-to-br from-indigo-500 to-violet-600 p-[2px] shadow-lg">
                <div className="h-full w-full rounded-full overflow-hidden bg-white">
                  {seller.logoUrl ? (
                    <img
                      src={seller.logoUrl}
                      alt="logo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-indigo-600 text-3xl font-black">
                      {(seller.storeName || "S").slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>

              {/* title */}
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                  {seller.storeName || "Store"}
                </h1>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/70 px-3 py-1 text-sm font-semibold text-indigo-700 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  Powered by ShopLynk
                </div>
                {seller.storeDescription && (
                  <p className="mt-3 max-w-2xl text-slate-600">
                    {seller.storeDescription}
                  </p>
                )}
              </div>

              {/* stat chips */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <GlassChip
                  icon={<Eye className="h-4 w-4" />}
                  label={`${products.length} ${
                    products.length === 1 ? "Product" : "Products"
                  }`}
                />
                <GlassChip
                  icon={<CreditCard className="h-4 w-4" />}
                  label={`${payments.length} Payment Methods`}
                />
                <GlassChip
                  icon={<Truck className="h-4 w-4" />}
                  label={`${deliveries.length} Delivery Options`}
                />
              </div>

              {/* Socials: keep as icons (your preference) */}
              {(ig || fb || tk) && (
                <div className="flex items-center gap-3">
                  {ig && (
                    <a
                      href={ig}
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 w-10 rounded-full bg-gradient-to-br from-[#F56040] to-[#E1306C] grid place-items-center text-white shadow-md"
                      aria-label="Instagram"
                      title="Instagram"
                    >
                      {/* simple IG glyph */}
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="currentColor"
                      >
                        <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm0 2h10c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3zm5 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm0 2a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm5.75-.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" />
                      </svg>
                    </a>
                  )}
                  {fb && (
                    <a
                      href={fb}
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 w-10 rounded-full bg-[#1877F2] grid place-items-center text-white shadow-md"
                      aria-label="Facebook"
                      title="Facebook"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="currentColor"
                      >
                        <path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07C2 17.1 5.66 21.22 10.44 22v-7.03H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.22.2 2.22.2v2.43h-1.25c-1.23 0-1.61.77-1.61 1.56v1.87h2.73l-.44 2.9h-2.29V22C18.34 21.22 22 17.1 22 12.07z" />
                      </svg>
                    </a>
                  )}
                  {tk && (
                    <a
                      href={tk}
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 w-10 rounded-full bg-black grid place-items-center text-white shadow-md"
                      aria-label="TikTok"
                      title="TikTok"
                    >
                      <svg
                        viewBox="0 0 48 48"
                        className="h-5 w-5"
                        fill="currentColor"
                      >
                        <path d="M33.94 18.02a13 13 0 01-4.21-8.35h-.03v-1.6h-4.41v21.33a5.43 5.43 0 11-5.43-5.43c.37 0 .73.04 1.07.12v-4.5a9.93 9.93 0 00-1.07-.06 9.93 9.93 0 109.93 9.93V15.5a17.43 17.43 0 009.93 3.09v-4.1a13.3 13.3 0 01-5.78-1.47z" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Filters — single source of truth (removed any secondary/duplicate section) */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-5 md:p-6">
          {/* search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products, brands, categories…"
              className="pl-12 pr-10 h-12 rounded-xl border-slate-200 focus-visible:ring-0 focus-visible:border-indigo-600 bg-white"
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

          {/* row */}
          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* left: filter chips */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Filter className="h-4 w-4" />
                  Smart Filters
                </span>

                <span className="rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 px-3 py-1 text-white text-sm font-semibold shadow-sm">
                  {filtered.length} {filtered.length === 1 ? "Result" : "Results"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Pill
                  active={categoryFilter === "all"}
                  onClick={() => setCategoryFilter("all")}
                  label={
                    <div className="flex items-center gap-2">
                      <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-slate-800 text-white text-[10px]">
                        🎯
                      </span>
                      <span>Show All</span>
                      <span className="ml-1 rounded-full bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {products.length}
                      </span>
                    </div>
                  }
                />
                {categories.map((c) => (
                  <Pill
                    key={c}
                    active={categoryFilter === c}
                    onClick={() =>
                      setCategoryFilter(categoryFilter === c ? "all" : c)
                    }
                    label={
                      <div className="flex items-center gap-2">
                        <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-white text-slate-700 border border-slate-200">
                          📦
                        </span>
                        <span>{c}</span>
                        <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                          {products.filter((p) => p.category === c).length}
                        </span>
                      </div>
                    }
                  />
                ))}

                {/* Favorites (preview-only counter) */}
                <div className="ml-1 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-400 opacity-70">
                  <Heart className="h-4 w-4" />
                  Favorites (Preview)
                  <span className="ml-1 inline-grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                    {favorites.size}
                  </span>
                </div>
              </div>
            </div>

            {/* right: sort */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Sort by:</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="h-10 w-52 rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Newest first" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-grid h-5 w-5 place-items-center rounded-md bg-sky-100 text-[10px] font-bold text-sky-700">
                        NEW
                      </span>
                      Newest First
                    </span>
                  </SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid — product card content unchanged */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        {filtered.length === 0 ? (
          <Empty />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => {
              const fav = favorites.has(p.id);
              return (
                <Card
                  key={p.id}
                  className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <div className="aspect-square bg-slate-100">
                      <img
                        src={getProductImageUrl(p) || PLACEHOLDER_IMAGE}
                        alt={p.name}
                        data-product-id={p.id}
                        className="h-full w-full object-cover"
                        onLoad={() => onImageLoad(p.id)}
                        onError={onImageError}
                        onLoadStart={() => onImageStart(p.id)}
                        loading="lazy"
                        decoding="async"
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
                        "absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/90 shadow-sm",
                        fav
                          ? "border-rose-300 text-rose-600"
                          : "border-slate-200 text-slate-400"
                      ].join(" ")}
                      aria-label={
                        fav ? "Remove from favorites" : "Add to favorites"
                      }
                    >
                      <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
                    </button>

                    {/* badges */}
                    <div className="absolute left-3 top-3 flex flex-col gap-2">
                      {isNew(p) && (
                        <Badge className="bg-emerald-500 text-white">New</Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="line-clamp-2 text-base font-semibold text-slate-900">
                        {p.name}
                      </h3>
                      <p className="line-clamp-3 text-sm text-slate-600">
                        {p.description}
                      </p>
                      <div className="pt-2">
                        <p className="text-2xl font-bold text-slate-900">
                          {formatPrice(p.price)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 space-y-2">
                      <Button
                        onClick={() => openProduct(p)}
                        variant="outline"
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        onClick={() => contactNow(p)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Seller
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          seller={seller}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
            window.history.pushState(null, "", window.location.pathname);
          }}
          onContact={() => contactNow(selectedProduct)}
        />
      )}
    </div>
  );
}

// Helper components
function GlassChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function Pill({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all",
        active
          ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Empty() {
  return (
    <div className="grid place-items-center py-12">
      <div className="text-center">
        <div className="mx-auto h-24 w-24 rounded-full bg-slate-100 grid place-items-center">
          <Search className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          No products found
        </h3>
        <p className="mt-2 text-slate-600">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    </div>
  );
}

function ProductModal({
  product,
  seller,
  onClose,
  onContact
}: {
  product: Product;
  seller: Seller;
  onClose: () => void;
  onContact: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-slate-900">{product.name}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="aspect-square bg-slate-100 rounded-xl mb-4 overflow-hidden">
            <img
              src={getProductImageUrl(product) || PLACEHOLDER_IMAGE}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-slate-900">
                {formatPrice(product.price)}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-600">{product.description}</p>
            </div>

            {product.category && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Category</h3>
                <Badge variant="secondary">{product.category}</Badge>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button onClick={onContact} className="w-full bg-green-600 hover:bg-green-700">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact {seller.storeName || "Seller"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}