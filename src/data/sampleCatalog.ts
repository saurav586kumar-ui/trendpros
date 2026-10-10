import { Product, Category, Banner, Voucher, StoreAnnouncementConfig } from '../types';

export const SAMPLE_CATEGORIES: Category[] = [
  {
    id: 'cat-electronics',
    name: 'Electronics & Mobiles',
    slug: 'electronics',
    icon: 'Smartphone',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80',
    subCategories: ['Smartphones', 'Laptops', 'Audio & Headphones', 'Smartwatches', 'Cameras'],
    description: 'Top-tier tech, flagship mobiles, wireless audio, and computing gear.'
  },
  {
    id: 'cat-fashion',
    name: 'Fashion & Apparel',
    slug: 'fashion',
    icon: 'Shirt',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&q=80',
    subCategories: ['Men Clothing', 'Women Ethnic & Western', 'Footwear', 'Watches & Bags'],
    description: 'Trendsetting designer wear, premium cottons, and streetwear.'
  },
  {
    id: 'cat-home',
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    icon: 'Home',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&q=80',
    subCategories: ['Kitchen Appliances', 'Home Decor', 'Bedding', 'Cookware'],
    description: 'Elevate your living space with smart kitchenware and cozy decor.'
  },
  {
    id: 'cat-beauty',
    name: 'Beauty & Grooming',
    slug: 'beauty',
    icon: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&q=80',
    subCategories: ['Skincare', 'Fragrances', 'Haircare', 'Men Grooming'],
    description: 'Dermatologist-approved botanicals, luxury perfumes, and serums.'
  },
  {
    id: 'cat-grocery',
    name: 'Gourmet & Grocery',
    slug: 'grocery',
    icon: 'ShoppingBag',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
    subCategories: ['Dry Fruits & Nuts', 'Artisanal Coffee', 'Organic Staples', 'Chocolates'],
    description: 'Farm-fresh organic staples, single-origin roasts, and superfoods.'
  },
  {
    id: 'cat-accessories',
    name: 'Accessories & Travel',
    slug: 'accessories',
    icon: 'Watch',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80',
    subCategories: ['Backpacks', 'Sunglasses', 'Wallets', 'Luggage'],
    description: 'Ergonomic urban backpacks, polarized sunglasses, and durable luggage.'
  },
  {
    id: 'cat-giftcards',
    name: 'Gift Cards & Vouchers',
    slug: 'gift-cards',
    icon: 'Gift',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&q=80',
    subCategories: ['Digital Gift Cards', 'Shopping Vouchers', 'Festival Cards'],
    description: 'Digital gift cards deliverable instantly with unique code & PIN for instant wallet redemption.'
  }
];

export const DEFAULT_ANNOUNCEMENT: StoreAnnouncementConfig = {
  isEnabled: true,
  badge: 'MEGA FESTIVE SALE',
  headline: 'Get up to 60% OFF on Top Tech & Autumn Fashion!',
  couponCode: 'WELCOME500',
  discountText: 'for ₹500 OFF',
  shippingNote: 'Free Express Delivery on orders over ₹999'
};

export const SAMPLE_BANNERS: Banner[] = [
  {
    id: 'banner-festive',
    title: 'The Great TrendPro Festival',
    subtitle: 'Up to 65% OFF on Flagship Smartphones & ANC Headphones',
    badge: 'LIMITED TIME DEAL',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=80',
    link: '/products?category=electronics',
    ctaText: 'Shop Tech Deals',
    order: 1,
    isActive: true,
    backgroundColor: 'from-indigo-900 via-slate-900 to-indigo-950'
  },
  {
    id: 'banner-fashion',
    title: 'Autumn Style Edit 2026',
    subtitle: 'Elevate your wardrobe with minimalist premium outerwear & sneakers',
    badge: 'NEW ARRIVALS',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
    link: '/products?category=fashion',
    ctaText: 'Explore Collection',
    order: 2,
    isActive: true,
    backgroundColor: 'from-amber-950 via-stone-900 to-amber-900'
  },
  {
    id: 'banner-home',
    title: 'Smart Living & Artisan Kitchen',
    subtitle: 'Precision espresso machines, non-stick cookware & ambient lighting',
    badge: 'HOME MAKEOVER',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&q=80',
    link: '/products?category=home-kitchen',
    ctaText: 'Upgrade Your Home',
    order: 3,
    isActive: true,
    backgroundColor: 'from-emerald-950 via-slate-900 to-teal-950'
  }
];

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'tp-gift-01',
    sku: 'TP-GIFT-ECOM',
    name: 'TrendPro Official E-Gift Card (Instant Digital Delivery)',
    slug: 'trendpro-official-e-gift-card',
    brand: 'TrendPro',
    category: 'gift-cards',
    subCategory: 'Digital Gift Cards',
    description: 'The ultimate gift of choice! Purchase a TrendPro digital gift card with your desired value. Receive an instant card number and secure PIN to redeem directly into your TrendPro wallet balance or gift to family and friends. Payment strictly online.',
    highlights: [
      'Instant digital generation upon successful payment',
      'Downloadable & printable gift voucher card with secure PIN',
      '100% redeemable into TrendPro Wallet to purchase any products',
      'Valid for 1 full year from issuance with zero transaction fees'
    ],
    mainImage: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80',
      'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&q=80'
    ],
    originalPrice: 1000,
    sellingPrice: 1000,
    discountPercent: 0,
    stock: 999,
    rating: 5.0,
    ratingCount: 340,
    isActive: true,
    isFeatured: true,
    isTrending: true,
    isGiftVoucher: true,
    giftCardDenominations: [500, 1000, 2000, 5000, 10000],
    variants: [
      {
        type: 'denomination',
        options: ['₹500', '₹1,000', '₹2,000', '₹5,000', '₹10,000']
      }
    ],
    specs: {
      'Card Format': 'Digital E-Gift Card with Unique Serial & PIN',
      'Delivery Speed': 'Instant post-payment delivery in My Orders',
      'Eligible Products': 'All products across TrendPro Marketplace',
      'Redemption Method': 'Add to TrendPro Wallet via Card Number'
    },
    inTheBox: 'Digital Gift Card Certificate with 16-digit Card Number & 4-digit PIN',
    warranty: '100% Guaranteed Balance Credited to Wallet',
    deliveryDays: 0,
    returnPolicyDays: 0,
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'tp-elec-01',
    sku: 'TP-AUD-NC900',
    name: 'AcousticPro Studio Wireless Noise-Cancelling Headphones',
    slug: 'acousticpro-studio-wireless-headphones',
    brand: 'AcousticPro',
    category: 'electronics',
    subCategory: 'Audio & Headphones',
    description: 'Experience studio-mastered acoustic clarity with industry-leading hybrid Active Noise Cancellation, 40mm beryllium drivers, and up to 45 hours of uninterrupted battery life.',
    highlights: [
      'Hybrid ANC with Transparency Ambient mode',
      'High-Res Wireless Audio with LDAC support',
      'Plush memory foam protein leather earcups',
      '45-Hour Battery Life with Fast Charge (10 mins = 5 hrs)'
    ],
    mainImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80'
    ],
    originalPrice: 19999,
    sellingPrice: 12999,
    discountPercent: 35,
    stock: 24,
    rating: 4.8,
    ratingCount: 1420,
    isActive: true,
    isFeatured: true,
    isTrending: true,
    variants: [
      { type: 'color', options: ['Midnight Black', 'Platinum Silver', 'Navy Blue'] }
    ],
    specs: {
      'Driver Size': '40mm Custom Beryllium',
      'Bluetooth Version': '5.3 Multipoint',
      'Battery Life': '45 Hours (ANC On)',
      'Weight': '254 grams',
      'Charging Port': 'USB Type-C'
    },
    inTheBox: 'Headphones, Hard Shell Travel Case, USB-C Cable, 3.5mm Audio Cable, Flight Adapter',
    warranty: '2 Year Comprehensive Brand Warranty',
    deliveryDays: 2,
    returnPolicyDays: 7,
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'tp-elec-02',
    sku: 'TP-WCH-ULT4',
    name: 'TitanApex Ultra Smartwatch with AMOLED Always-On Display',
    slug: 'titanapex-ultra-smartwatch-amoled',
    brand: 'TitanApex',
    category: 'electronics',
    subCategory: 'Smartwatches',
    description: 'Rugged aerospace-grade titanium frame featuring sapphire crystal glass, precision dual-frequency GPS, heart-rate variability and blood oxygen tracking, and 100m water resistance.',
    highlights: [
      '1.43-inch Ultra Bright AMOLED (1500 nits)',
      'Dual-Frequency L1+L5 GPS Navigation',
      'ECG, SPO2, HRV & Stress Tracking',
      '12-Day Battery Life on normal usage'
    ],
    mainImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80'
    ],
    originalPrice: 24999,
    sellingPrice: 14999,
    discountPercent: 40,
    stock: 18,
    rating: 4.7,
    ratingCount: 890,
    isActive: true,
    isFeatured: true,
    isTrending: true,
    variants: [
      { type: 'color', options: ['Titanium Gray', 'Carbon Black', 'Alpine Orange'] }
    ],
    specs: {
      'Display': '1.43" AMOLED 466x466',
      'Water Resistance': '10 ATM (100 meters)',
      'Sensors': 'Optical PPG, ECG, Barometer, Compass',
      'Battery': '500 mAh (12 days)'
    },
    inTheBox: 'TitanApex Ultra Smartwatch, Magnetic Fast Charger, Extra Silicone Band, Manual',
    warranty: '1 Year Manufacturer Replacement Guarantee',
    deliveryDays: 2,
    returnPolicyDays: 7,
    createdAt: '2026-03-02T00:00:00.000Z'
  },
  {
    id: 'tp-elec-03',
    sku: 'TP-PHN-NEO12',
    name: 'Nexis Neo 5G Pro Flagship Smartphone (12GB RAM, 256GB)',
    slug: 'nexis-neo-5g-pro-flagship-smartphone',
    brand: 'Nexis',
    category: 'electronics',
    subCategory: 'Smartphones',
    description: 'Powered by the 4nm flagship processor with 120Hz LTPO AMOLED panel, 50MP Sony IMX sensor with OIS, and ultra-fast 120W HyperCharge that tops up in 19 minutes.',
    highlights: [
      'Snapdragon Flagship 4nm Processor',
      '50MP OIS Triple Camera with 4K HDR video',
      '120W HyperCharge (0-100% in 19 mins)',
      'Stereo Dual Speakers tuned by Dolby Atmos'
    ],
    mainImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80'
    ],
    originalPrice: 49999,
    sellingPrice: 38999,
    discountPercent: 22,
    stock: 12,
    rating: 4.9,
    ratingCount: 2310,
    isActive: true,
    isFeatured: true,
    isTrending: true,
    variants: [
      { type: 'color', options: ['Emerald Green', 'Obsidian Black', 'Aurora Blue'] },
      { type: 'storage', options: ['256GB', '512GB'] }
    ],
    specs: {
      'Display': '6.74" 1.5K LTPO 120Hz AMOLED',
      'RAM & Storage': '12GB LPDDR5X + 256GB UFS 4.0',
      'Rear Camera': '50MP OIS + 8MP Ultra-wide + 2MP Macro',
      'Battery': '5000 mAh with 120W In-box charger'
    },
    inTheBox: 'Handset, 120W Power Adapter, Type-C Cable, Protective Case, SIM Ejector, Screen Guard',
    warranty: '1 Year Handset & 6 Months In-box Accessories',
    deliveryDays: 1,
    returnPolicyDays: 7,
    createdAt: '2026-03-03T00:00:00.000Z'
  },
  {
    id: 'tp-fash-01',
    sku: 'TP-JKT-LUM1',
    name: 'Vanguard Tailored Minimalist Wool Blend Overcoat',
    slug: 'vanguard-tailored-wool-blend-overcoat',
    brand: 'Vanguard Studio',
    category: 'fashion',
    subCategory: 'Men Clothing',
    description: 'An enduring outerwear staple crafted from Italian wool blend fabric. Features sharp notch lapels, structured shoulders, horn buttons, and silky cupro interior lining.',
    highlights: [
      '70% Pure Wool / 30% Cashmere feel blend',
      'Double breasted with interior security pockets',
      'Wind-resistant and naturally temperature regulating',
      'Hand-stitched lapel contouring'
    ],
    mainImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80',
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80'
    ],
    originalPrice: 8999,
    sellingPrice: 4799,
    discountPercent: 46,
    stock: 35,
    rating: 4.6,
    ratingCount: 420,
    isActive: true,
    isFeatured: true,
    variants: [
      { type: 'size', options: ['M', 'L', 'XL', 'XXL'] },
      { type: 'color', options: ['Camel Tan', 'Charcoal Grey', 'Deep Navy'] }
    ],
    specs: {
      'Material': '70% Wool, 30% Polyamide',
      'Fit': 'Modern Tailored Fit',
      'Care': 'Dry Clean Only',
      'Length': 'Mid-Thigh'
    },
    inTheBox: '1 x Overcoat, Garment Bag, Wooden Hanger',
    warranty: '30-Day Fabric Integrity Warranty',
    deliveryDays: 3,
    returnPolicyDays: 10,
    createdAt: '2026-03-04T00:00:00.000Z'
  },
  {
    id: 'tp-fash-02',
    sku: 'TP-SNK-AER9',
    name: 'StridePro Primeknit Cloudfoam Urban Sneakers',
    slug: 'stridepro-primeknit-cloudfoam-sneakers',
    brand: 'StridePro',
    category: 'fashion',
    subCategory: 'Footwear',
    description: 'Seamless breathable engineered mesh upper combined with high-rebound Cloudfoam midsole cushioning. Perfect for daily commutes, light running, and smart casual outfits.',
    highlights: [
      'Adaptive knit collar that hugs your ankle',
      'Super lightweight dual-density responsive sole',
      'Ortholite antimicrobial sweat-wicking insole',
      'Slip-resistant textured rubber tread'
    ],
    mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80'
    ],
    originalPrice: 4999,
    sellingPrice: 2499,
    discountPercent: 50,
    stock: 50,
    rating: 4.8,
    ratingCount: 3120,
    isActive: true,
    isFeatured: true,
    isTrending: true,
    variants: [
      { type: 'size', options: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'] },
      { type: 'color', options: ['Racing Red', 'Stealth Black', 'Pure White'] }
    ],
    specs: {
      'Upper Material': 'Engineered Primeknit Mesh',
      'Sole': 'High-Rebound TPU & Rubber Outsole',
      'Weight': '280g per shoe',
      'Fastening': 'Lace-Up'
    },
    inTheBox: '1 Pair of Sneakers, Extra Shoelaces, Shoe Care Guide',
    warranty: '3 Months Sole & Stitching Guarantee',
    deliveryDays: 2,
    returnPolicyDays: 10,
    createdAt: '2026-03-05T00:00:00.000Z'
  },
  {
    id: 'tp-home-01',
    sku: 'TP-COF-BARIS',
    name: 'BaristaTouch 15-Bar Precision Italian Espresso Machine',
    slug: 'baristatouch-15bar-precision-espresso-machine',
    brand: 'AromaCraft',
    category: 'home-kitchen',
    subCategory: 'Kitchen Appliances',
    description: 'Brew cafe-quality velvety espresso, silky lattes, and cappuccinos in seconds. Features an Italian 15-bar electromagnetic pump, stainless steel steam wand, and thermoblock heating.',
    highlights: [
      'Authentic 15-Bar Italian high-pressure pump',
      'Commercial swivel steam wand for microfoam latte art',
      'Instant 45-second preheat with ThermoBlock technology',
      'Removable 1.5L BPA-free transparent water reservoir'
    ],
    mainImage: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80'
    ],
    originalPrice: 18999,
    sellingPrice: 11499,
    discountPercent: 39,
    stock: 14,
    rating: 4.9,
    ratingCount: 760,
    isActive: true,
    isFeatured: true,
    variants: [
      { type: 'color', options: ['Brushed Steel', 'Matte Black', 'Retro Cream'] }
    ],
    specs: {
      'Pump Pressure': '15 Bar High Pressure',
      'Power': '1350 Watts',
      'Water Tank Capacity': '1.5 Litres',
      'Body Material': 'Brushed Food-Grade Stainless Steel'
    },
    inTheBox: 'Espresso Machine, Portafilter, Single & Double Cup Filters, Measuring Scoop & Tamper',
    warranty: '2 Year On-site Manufacturer Warranty',
    deliveryDays: 3,
    returnPolicyDays: 7,
    createdAt: '2026-03-06T00:00:00.000Z'
  },
  {
    id: 'tp-home-02',
    sku: 'TP-PAN-GRAN7',
    name: 'CastIron Master 3-Piece Pre-Seasoned Skillet & Pan Set',
    slug: 'castiron-master-3piece-skillet-set',
    brand: 'IronHeritage',
    category: 'home-kitchen',
    subCategory: 'Cookware',
    description: 'Triple-seasoned with 100% natural organic flaxseed oil for natural chemical-free non-stick performance. Ideal for searing steaks, baking bread, and traditional stir-fries.',
    highlights: [
      '100% Natural Pre-Seasoned Cast Iron (Teflon & PFOA free)',
      'Compatible with Gas, Induction, Oven, and Campfire',
      'Superior even heat retention and crust development',
      'Heavy-duty dual assist handles and pour spouts'
    ],
    mainImage: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&q=80'
    ],
    originalPrice: 5999,
    sellingPrice: 2999,
    discountPercent: 50,
    stock: 40,
    rating: 4.7,
    ratingCount: 1180,
    isActive: true,
    isFeatured: false,
    specs: {
      'Sizes Included': '8-inch, 10-inch, 12-inch Skillets',
      'Coating': '100% Organic Flaxseed Pre-Seasoned',
      'Weight': '5.8 kg (Total Set)'
    },
    inTheBox: '3 x Skillets, 2 x Heat-resistant Silicone Handle Grips, Cast Iron Care Manual',
    warranty: 'Lifetime Heirloom Warranty',
    deliveryDays: 2,
    returnPolicyDays: 7,
    createdAt: '2026-03-07T00:00:00.000Z'
  },
  {
    id: 'tp-beau-01',
    sku: 'TP-SER-VITC',
    name: 'Lumiere Botanical 15% Vitamin C + Ferulic Radiance Serum (30ml)',
    slug: 'lumiere-botanical-vitamin-c-radiance-serum',
    brand: 'Lumiere Botanics',
    category: 'beauty',
    subCategory: 'Skincare',
    description: 'Formulated with stabilized L-Ascorbic Acid, Ferulic Acid, and Hyaluronic Acid to fade stubborn dark spots, boost collagen, and protect against environmental oxidative damage.',
    highlights: [
      'Clinically tested 15% Pure Vitamin C formula',
      'Fades pigmentation and evens skin tone in 3 weeks',
      'Fragrance-free, paraben-free, and cruelty-free',
      'Dark amber glass bottle to prevent oxidation'
    ],
    mainImage: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80'
    ],
    originalPrice: 1699,
    sellingPrice: 999,
    discountPercent: 41,
    stock: 65,
    rating: 4.9,
    ratingCount: 1840,
    isActive: true,
    isFeatured: true,
    isTrending: true,
    specs: {
      'Volume': '30ml / 1.0 fl oz',
      'Key Ingredients': '15% L-Ascorbic Acid, Ferulic Acid, Hyaluronic Acid',
      'Skin Type': 'All Skin Types (including sensitive)'
    },
    inTheBox: '1 x 30ml Dropper Bottle in Sealed Box',
    warranty: 'Dermatologically Tested & Certified',
    deliveryDays: 2,
    returnPolicyDays: 5,
    createdAt: '2026-03-08T00:00:00.000Z'
  },
  {
    id: 'tp-groc-01',
    sku: 'TP-NUT-ALM1KG',
    name: 'Himalayan Organic California Jumbo Almonds (100% Raw, 1 kg)',
    slug: 'himalayan-organic-california-jumbo-almonds-1kg',
    brand: 'NutriHarvest',
    category: 'grocery',
    subCategory: 'Dry Fruits & Nuts',
    description: 'Handpicked Grade-A California almonds bursting with plant protein, vitamin E, and heart-healthy dietary fiber. Vacuum packed at origin to ensure fresh crunchiness in every bite.',
    highlights: [
      '100% Natural, zero preservatives or additives',
      'Rich in natural Vitamin E, Magnesium, and Antioxidants',
      'Aroma-sealed nitrogen flushed pouch for prolonged freshness',
      'Gluten-free and vegan'
    ],
    mainImage: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&q=80'
    ],
    originalPrice: 1399,
    sellingPrice: 849,
    discountPercent: 39,
    stock: 80,
    rating: 4.8,
    ratingCount: 2950,
    isActive: true,
    isFeatured: false,
    specs: {
      'Net Weight': '1000g (1 kg)',
      'Origin': 'California, USA',
      'Packaging': 'Resealable Zip-Lock Stand-up Pouch',
      'Shelf Life': '12 Months'
    },
    inTheBox: '1 x 1kg Nitrogen-Flushed Resealable Pouch',
    warranty: '100% Freshness or Free Replacement Guarantee',
    deliveryDays: 1,
    returnPolicyDays: 3,
    createdAt: '2026-03-09T00:00:00.000Z'
  },
  {
    id: 'tp-acc-01',
    sku: 'TP-BAG-NOMAD35',
    name: 'NomadPro Weatherproof 35L Laptop Travel Backpack',
    slug: 'nomadpro-weatherproof-35l-travel-backpack',
    brand: 'NomadPro Gear',
    category: 'accessories',
    subCategory: 'Backpacks',
    description: 'Engineered for digital nomads and daily executives. Built from ballistic Cordura waterproof nylon with TSA checkpoint-friendly 16" laptop sleeve, USB pass-through, and hidden RFID pocket.',
    highlights: [
      'Waterproof Cordura 840D nylon with taped YKK zippers',
      'Dedicated padded pocket for up to 16-inch laptops',
      'Ergonomic breathable air-mesh back panel & chest strap',
      'Anti-theft concealed passport and card pocket'
    ],
    mainImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80'
    ],
    originalPrice: 5999,
    sellingPrice: 3299,
    discountPercent: 45,
    stock: 28,
    rating: 4.8,
    ratingCount: 920,
    isActive: true,
    isFeatured: true,
    variants: [
      { type: 'color', options: ['Stealth Charcoal', 'Forest Green', 'Matte Black'] }
    ],
    specs: {
      'Capacity': '35 Litres',
      'Laptop Compartment': 'Fits up to 16" MacBook Pro / Gaming Laptops',
      'Weight': '1.1 kg',
      'Material': '840D Ballistic Waterproof Nylon'
    },
    inTheBox: '1 x NomadPro 35L Backpack, Detachable Sternum Strap',
    warranty: '3 Year International Guarantee',
    deliveryDays: 2,
    returnPolicyDays: 7,
    createdAt: '2026-03-10T00:00:00.000Z'
  },
  {
    id: 'tp-elec-04',
    sku: 'TP-SPK-BEATX',
    name: 'PulseBlast 360 Waterproof Portable Bluetooth Speaker',
    slug: 'pulseblast-360-waterproof-bluetooth-speaker',
    brand: 'AcousticPro',
    category: 'electronics',
    subCategory: 'Audio & Headphones',
    description: 'Omnidirectional 360-degree sound with deep passive radiator bass. IPX7 waterproof rating ensures it withstands pool dips, rainy hikes, and beach parties.',
    highlights: [
      '30W RMS Room-filling 360-degree acoustic projection',
      'IPX7 Complete Waterproof & Dustproof protection',
      '20 Hours Playtime with 5200mAh power bank capability',
      'True Wireless Stereo pairing to link 2 speakers'
    ],
    mainImage: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80'],
    originalPrice: 6999,
    sellingPrice: 3499,
    discountPercent: 50,
    stock: 30,
    rating: 4.7,
    ratingCount: 1530,
    isActive: true,
    isFeatured: false,
    variants: [
      { type: 'color', options: ['Teal Ocean', 'Matte Black', 'Sunset Orange'] }
    ],
    specs: {
      'Output Power': '30 Watts RMS',
      'Bluetooth': '5.3 (30m range)',
      'Waterproof': 'IPX7 certified',
      'Battery Life': '20 hours'
    },
    inTheBox: 'Speaker, USB-C Charging Cable, Carabiner Clip, User Manual',
    warranty: '1 Year Brand Replacement Warranty',
    deliveryDays: 2,
    returnPolicyDays: 7,
    createdAt: '2026-03-11T00:00:00.000Z'
  },
  {
    id: 'tp-fash-03',
    sku: 'TP-GLS-AVIA',
    name: 'AeroClassic Polarized Titanium Aviator Sunglasses',
    slug: 'aeroclassic-polarized-titanium-aviators',
    brand: 'Vanguard Studio',
    category: 'accessories',
    subCategory: 'Sunglasses',
    description: 'Timeless aviator styling crafted with featherweight beta-titanium wireframes and Japanese polarized TAC lenses offering 100% UVA/UVB 400 protection.',
    highlights: [
      'Ultra-light 16g Beta-Titanium frame',
      'Japanese Triacetate Polarized Lenses (Anti-Glare)',
      'Hydrophobic and Oleophobic fingerprint-resistant coating',
      'Silicone hypoallergenic nose pads'
    ],
    mainImage: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80'],
    originalPrice: 4499,
    sellingPrice: 2199,
    discountPercent: 51,
    stock: 45,
    rating: 4.6,
    ratingCount: 680,
    isActive: true,
    isFeatured: false,
    variants: [
      { type: 'color', options: ['Gold / Forest Green', 'Gunmetal / Smoke Black', 'Silver / Ocean Blue'] }
    ],
    specs: {
      'Frame Material': 'Beta Titanium Alloy',
      'Lens': 'TAC Polarized UV400',
      'Lens Width': '58 mm',
      'Bridge': '14 mm'
    },
    inTheBox: 'Sunglasses, Hard Leather Case, Microfiber Cleaning Cloth, Polarization Test Card',
    warranty: '1 Year Lens & Frame Warranty',
    deliveryDays: 2,
    returnPolicyDays: 7,
    createdAt: '2026-03-12T00:00:00.000Z'
  }
];

export const SAMPLE_VOUCHERS: Voucher[] = [
  {
    id: 'vouch-welcome',
    code: 'WELCOME500',
    description: 'Flat ₹500 off on your first order above ₹2,000',
    discountType: 'flat',
    discountValue: 500,
    minOrderValue: 2000,
    expiryDate: '2026-12-31',
    isActive: true,
    usedCount: 38
  },
  {
    id: 'vouch-festive10',
    code: 'TRENDPRO15',
    description: '15% instant discount up to ₹1,500 on all orders above ₹3,000',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 3000,
    maxDiscount: 1500,
    expiryDate: '2026-12-31',
    isActive: true,
    usedCount: 112
  },
  {
    id: 'vouch-super',
    code: 'FREEDEL',
    description: 'Free expedited delivery on any order',
    discountType: 'flat',
    discountValue: 99,
    minOrderValue: 499,
    expiryDate: '2026-12-31',
    isActive: true,
    usedCount: 240
  }
];
