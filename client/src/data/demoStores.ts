export interface DemoStore {
  slug: string;
  storeName: string;
  fullName: string;
  country: string;
  whatsappNumber: string;
  category: string;
  description: string;
  bannerUrl?: string;
  logoUrl?: string;
  products: DemoProduct[];
}

export interface DemoProduct {
  id: string;
  name: string;
  brand?: string;
  price: number;
  images: string[];
  category: string;
  subcategory?: string;
  description: string;
  quantity: number;
  color?: string;
  size?: string;
  material?: string;
  sustainability?: boolean;
  createdAt: number;
}

export const demoStores: DemoStore[] = [
  {
    slug: "artisan-ceramics",
    storeName: "Artisan Ceramics Co.",
    fullName: "Maya Patel",
    country: "IN",
    whatsappNumber: "+91-98765-43210",
    category: "Home & Garden",
    description: "Handcrafted ceramic pieces inspired by traditional Indian pottery techniques",
    products: [
      {
        id: "ceramic-001",
        name: "Handmade Terra Cotta Vase",
        price: 45,
        images: ["/api/placeholder/400/300"],
        category: "Home & Garden",
        subcategory: "Decor",
        description: "Beautiful handcrafted terra cotta vase with traditional patterns",
        quantity: 12,
        color: "Terracotta",
        material: "Clay",
        sustainability: true,
        createdAt: Date.now() - 86400000 * 3
      },
      {
        id: "ceramic-002",
        name: "Ceramic Bowl Set",
        price: 32,
        images: ["/api/placeholder/400/300"],
        category: "Home & Garden",
        subcategory: "Kitchen",
        description: "Set of 4 handcrafted ceramic bowls perfect for serving",
        quantity: 8,
        color: "Blue",
        material: "Ceramic",
        sustainability: true,
        createdAt: Date.now() - 86400000 * 5
      }
    ]
  },
  {
    slug: "coastal-jewelry",
    storeName: "Coastal Treasures",
    fullName: "Sofia Rodriguez",
    country: "MX",
    whatsappNumber: "+52-555-123-4567",
    category: "Fashion & Jewelry",
    description: "Ocean-inspired jewelry made from sustainable materials",
    products: [
      {
        id: "jewelry-001",
        name: "Pearl Drop Earrings",
        price: 68,
        images: ["/api/placeholder/400/300"],
        category: "Fashion & Jewelry",
        subcategory: "Earrings",
        description: "Elegant freshwater pearl earrings with sterling silver hooks",
        quantity: 15,
        material: "Sterling Silver",
        sustainability: true,
        createdAt: Date.now() - 86400000 * 2
      },
      {
        id: "jewelry-002",
        name: "Sea Glass Bracelet",
        price: 42,
        images: ["/api/placeholder/400/300"],
        category: "Fashion & Jewelry",
        subcategory: "Bracelets",
        description: "Beautiful bracelet made from authentic sea glass pieces",
        quantity: 6,
        color: "Aqua",
        material: "Sea Glass",
        sustainability: true,
        createdAt: Date.now() - 86400000 * 1
      }
    ]
  },
  {
    slug: "organic-soaps",
    storeName: "Pure Earth Soaps",
    fullName: "James Wilson",
    country: "CA",
    whatsappNumber: "+1-416-555-0123",
    category: "Health & Beauty",
    description: "Natural, organic soaps made with plant-based ingredients",
    products: [
      {
        id: "soap-001",
        name: "Lavender Mint Soap Bar",
        price: 12,
        images: ["/api/placeholder/400/300"],
        category: "Health & Beauty",
        subcategory: "Bath & Body",
        description: "Soothing lavender and refreshing mint in an organic soap bar",
        quantity: 25,
        material: "Organic Oils",
        sustainability: true,
        createdAt: Date.now() - 86400000 * 4
      },
      {
        id: "soap-002",
        name: "Charcoal Detox Bar",
        price: 15,
        images: ["/api/placeholder/400/300"],
        category: "Health & Beauty",
        subcategory: "Bath & Body", 
        description: "Deep cleansing activated charcoal soap for all skin types",
        quantity: 18,
        color: "Black",
        material: "Activated Charcoal",
        sustainability: true,
        createdAt: Date.now() - 86400000 * 6
      }
    ]
  },
  {
    slug: "vintage-books",
    storeName: "Vintage Volumes",
    fullName: "Emma Thompson",
    country: "GB",
    whatsappNumber: "+44-20-7946-0958",
    category: "Books & Media",
    description: "Carefully curated collection of vintage and rare books",
    products: [
      {
        id: "book-001",
        name: "1950s Poetry Collection",
        price: 85,
        images: ["/api/placeholder/400/300"],
        category: "Books & Media",
        subcategory: "Literature",
        description: "Rare collection of mid-century poetry in excellent condition",
        quantity: 3,
        material: "Paper",
        createdAt: Date.now() - 86400000 * 8
      },
      {
        id: "book-002",
        name: "Vintage Travel Guide Set",
        price: 125,
        images: ["/api/placeholder/400/300"],
        category: "Books & Media",
        subcategory: "Reference",
        description: "Complete set of 1960s European travel guides with original maps",
        quantity: 2,
        material: "Paper",
        createdAt: Date.now() - 86400000 * 10
      }
    ]
  }
];

export const getDemoStore = (slug: string): DemoStore | null => {
  return demoStores.find(store => store.slug === slug) || null;
};

export const getAllDemoStoreSlugs = (): string[] => {
  return demoStores.map(store => store.slug);
};