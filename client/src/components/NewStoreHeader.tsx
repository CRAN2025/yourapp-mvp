// StoreHeader.tsx
import { useEffect, useState } from "react";
import { BadgeCheck, Share2, MessageCircle, Package, CreditCard, Truck } from "lucide-react";

type Props = {
  name: string;
  description?: string;
  logoUrl?: string;
  productsCount: number;
  paymentsCount: number;
  deliveriesCount: number;
  instagramUrl?: string;
  facebookUrl?: string;
  onShare: () => void;      // opens WhatsApp share
  onContact?: () => void;   // optional WhatsApp contact CTA
};

export default function NewStoreHeader({
  name,
  description,
  logoUrl,
  productsCount,
  paymentsCount,
  deliveriesCount,
  instagramUrl,
  facebookUrl,
  onShare,
  onContact,
}: Props) {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="relative">
      {/* compact cover */}
      <div className="h-40 w-full rounded-b-3xl bg-[radial-gradient(1200px_600px_at_10%_-10%,#EAF2FF_0%,transparent_60%),linear-gradient(135deg,#1d4ed8_0%,#2563eb_50%,#3b82f6_100%)]" />

      <div className="-mt-10 px-6">
        <div className="mx-auto max-w-7xl">
          {/* brand bar */}
          <div
            className={[
              "rounded-2xl border bg-white/60 backdrop-blur-2xl",
              "border-white/60 shadow-[0_8px_26px_rgba(2,6,23,.06)]",
              stuck ? "sticky top-4 z-30" : "",
            ].join(" ")}
          >
            <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
              {/* left */}
              <div className="flex min-w-0 items-center gap-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/70 bg-white">
                  {logoUrl ? (
                    <img src={logoUrl} alt={`${name} logo`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-base font-bold text-slate-700">
                      {name?.slice(0, 1) || "S"}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-xl font-black tracking-tight text-slate-900">{name}</h1>
                    <BadgeCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  {description && (
                    <p className="mt-0.5 line-clamp-1 text-sm text-slate-600">{description}</p>
                  )}
                </div>
              </div>

              {/* mid chips */}
              <div className="flex flex-wrap items-center gap-2">
                <GlassChip icon={<Package className="h-4 w-4" />} label={`${productsCount} ${productsCount === 1 ? "Product" : "Products"}`} />
                <GlassChip icon={<CreditCard className="h-4 w-4" />} label={`${paymentsCount} Payment Methods`} />
                <GlassChip icon={<Truck className="h-4 w-4" />} label={`${deliveriesCount} Delivery Options`} />
              </div>

              {/* right: socials (unchanged look) + CTAs */}
              <div className="flex items-center gap-2">
                {instagramUrl && <SocialCircle brand="ig" href={instagramUrl} />}
                {facebookUrl && <SocialCircle brand="fb" href={facebookUrl} />}

                <button
                  onClick={onShare}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                {onContact && (
                  <button
                    onClick={onContact}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-blue-300"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contact
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* — UI bits — */
function GlassChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-3.5 py-2 text-sm font-medium text-slate-800 backdrop-blur-2xl shadow-sm">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function SocialCircle({ brand, href }: { brand: "ig" | "fb"; href: string }) {
  const cls =
    brand === "ig"
      ? "bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285AEB_90%)]"
      : "bg-[#1877F2]";
  const label = brand === "ig" ? "Instagram" : "Facebook";
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={`grid h-10 w-10 place-items-center rounded-full text-white shadow-sm ${cls}`}
    >
      {brand === "ig" ? (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )}
      <span className="sr-only">{label}</span>
    </a>
  );
}