export type Product = {
  id: string; name: string; subtitle: string; description: string; category: string;
  price: number; image: string; tag: string; allergens: string; storage: string;
  unit?: 'ml'; baseWeight?: number; packs?: number[]; sale?: 'pairs' | 'pieces'; basePieces?: number; hot?: boolean; special?: string; soldOut?: boolean; hidden?: boolean; custom?: boolean;
};
export const products: Product[] = [
  { id: 'poothrekulu', name: 'Bellam Dryfruit Poothrekulu', subtitle: 'Paper-thin layers. Rich jaggery. A nutty little surprise.', description: 'Delicate rice-paper sheets wrapped around jaggery, ghee and crunchy dry fruits. Light, flaky and beautifully indulgent, with a little treasure in every fold.', category: 'Traditional', price: 420, sale: 'pieces', basePieces: 6, packs: [6,12], special: 'MAHIMA SPECIAL', image: '/images/poothrekulu.webp', tag: 'A delicate southern favourite', allergens: 'Milk (ghee), almonds, cashews and other nuts. Confirm actual ingredients with the shop.', storage: 'Handle gently and store airtight in a cool, dry place. Confirm shelf life with the shop.' },
  { id: 'dharwad', name: 'Dharwad Peda', subtitle: 'Caramel notes. Rustic charm. Karnataka in a bite.', description: 'A Karnataka favourite with a deep caramelised milk flavour, a gently grainy centre and a fine sugar finish. Small, rich and full of character.', category: 'Milk sweets', price: 340, special: 'KARNATAKA SPECIAL', image: '/images/dharwad.webp', tag: 'A taste of Karnataka', allergens: 'Milk. May contain nuts and gluten.', storage: 'Keep sealed in a cool, dry place. Confirm ingredients and shelf life with the shop.' },
  { id: 'ladoo', name: 'Motichoor Ladoo', subtitle: 'Little pearls. Big happy.', description: 'Delicate boondi pearls come together in a soft, saffron-kissed ladoo, finished with crunchy pistachios. A cheerful classic for every celebration.', category: 'Traditional', price: 240, image: '/images/ladoo.webp', tag: 'Celebration favourite', allergens: 'Milk, pistachios. May contain other nuts and gluten.', storage: 'Keep in an airtight container in a cool, dry place. Confirm shelf life with the shop.' },
  { id: 'katli', special: 'MAHIMA FAVOURITE', name: 'Kaju Burfi', subtitle: 'Silver on top. Soft spot secured.', description: 'Silky cashew fudge, delicately sweet and cut into elegant diamonds. A beautiful little indulgence, finished with edible silver leaf.', category: 'Dry fruit', price: 460, image: '/images/katli.webp', tag: 'Signature selection', allergens: 'Cashews. May contain milk and other nuts.', storage: 'Store airtight in a cool, dry place. Confirm shelf life with the shop.' },
  { id: 'mysore', special: 'GHEE CLASSIC', name: 'Ghee Mysore Pak', subtitle: 'Melts away. Stays on your mind.', description: 'Golden gram-flour squares with a rich ghee aroma and a tender, melt-away texture. Our tribute to a much-loved Karnataka sweet.', category: 'Traditional', price: 280, image: '/images/mysore.webp', tag: 'Karnataka classic', allergens: 'Milk (ghee), chickpea flour. May contain nuts and gluten.', storage: 'Keep away from direct sunlight in an airtight container. Confirm shelf life with the shop.' },
  { id: 'jamun', name: 'Gulab Jamun', subtitle: 'One spoon. Instant good mood.', description: 'Soft khoya dumplings, golden on the outside and soaked in fragrant cardamom syrup. Best enjoyed slowly, with a little extra syrup.', category: 'Syrupy', price: 220, image: '/images/jamun.webp', tag: 'Comfort in every bite', allergens: 'Milk, wheat, pistachios. May contain other nuts.', storage: 'Refrigerate promptly. Confirm serving and shelf-life guidance with the shop.' },
  { id: 'jalebi', name: 'Crispy Jalebi', subtitle: 'Your sweetest snack-time spiral.', description: 'Bright golden spirals with a delicate crunch and a juicy syrup centre. A nostalgic favourite that makes ordinary afternoons feel special.', category: 'Syrupy', price: 180, image: '/images/jalebi.webp', tag: 'Golden & crisp', allergens: 'Wheat. May contain milk and nuts.', storage: 'Best enjoyed fresh. Confirm storage and shelf life with the shop.' },
  { id: 'peda', name: 'Kesar Peda', subtitle: 'Saffron-rich. Blissfully soft.', description: 'Slow-cooked milk fudge scented with saffron and cardamom, shaped into soft little rounds and topped with pistachio.', category: 'Milk sweets', price: 300, image: '/images/peda.webp', tag: 'Saffron-kissed', allergens: 'Milk, pistachios. May contain other nuts.', storage: 'Keep refrigerated in an airtight container. Confirm shelf life with the shop.' },
  { id: 'rasmalai', name: 'Kesar Rasmalai', subtitle: 'Cloud-soft. Saffron-soaked. Gone in seconds.', description: 'Soft chenna dumplings take a slow soak in saffron milk, finished with pistachio slivers. Creamy, fragrant and made for the last spoonful.', category: 'Milk sweets', price: 320, image: '/images/rasmalai.webp', tag: 'The creamy craving', allergens: 'Milk, pistachios. May contain other nuts.', storage: 'Keep refrigerated. Confirm shelf life and cold-chain handling with the shop.' },
  { id: 'halwa', name: 'Badam Halwa', subtitle: 'Rich almonds. Big celebration energy.', description: 'A rich almond halwa with a glossy ghee finish and a gentle hint of cardamom. One spoonful, and an ordinary day feels like a festival.', category: 'Dry fruit', price: 480, image: '/images/halwa.webp', tag: 'Spoonful of indulgence', allergens: 'Almonds, milk (ghee). May contain other nuts.', storage: 'Store as advised by the shop. Confirm shelf life and ingredients before ordering.' },
  { id: 'burfi', name: 'Coconut Burfi', subtitle: 'A little tropical. A lot irresistible.', description: 'Tender coconut squares with a soft bite and a pretty rose-pink layer. A familiar favourite that always earns another piece.', category: 'Traditional', price: 250, image: '/images/burfi.webp', tag: 'One more piece?', allergens: 'Coconut, milk. May contain nuts and gluten.', storage: 'Keep refrigerated in an airtight container. Confirm shelf life with the shop.' },
];
export const namkeens: Product[] = [
  { id: 'murukku', name: 'Crispy Murukku', subtitle: 'Twist. Crunch. Repeat.', description: 'Golden rice-flour spirals with a satisfying snap and a scattering of sesame. The kind of crunch that makes your tea break last a little longer.', category: 'Namkeens', price: 120, baseWeight: 250, packs: [100,250,500], image: '/images/murukku.webp', tag: 'The classic crunch', allergens: 'Sesame, chickpea flour. May contain wheat, nuts and milk.', storage: 'Keep sealed in a cool, dry place. Confirm ingredients and shelf life with the shop.' },
  { id: 'mixture', name: 'Masala Mixture', subtitle: 'A handful of mischief.', description: 'Sev, boondi, crunchy peanuts, lentils and curry leaves in one lively mix. Sweet break? Salty break? This is your spicy little plot twist.', category: 'Namkeens', price: 110, baseWeight: 250, packs: [100,250,500], image: '/images/mixture.webp', tag: 'Spice up snack time', allergens: 'Peanuts, chickpea flour. May contain wheat, sesame and milk.', storage: 'Store airtight away from moisture. Confirm shelf life with the shop.' },
  { id: 'bhujia', name: 'Aloo Bhujia', subtitle: 'Fine strands. Serious crunch.', description: 'Delicate potato-and-gram-flour strands with a savoury spice kick. Scatter over chaat or sneak a handful straight from the bowl.', category: 'Namkeens', price: 100, baseWeight: 250, packs: [100,250,500], image: '/images/bhujia.webp', tag: 'Chai’s plus-one', allergens: 'Chickpea flour. May contain wheat, peanuts, sesame and milk.', storage: 'Keep in an airtight container in a cool, dry place. Confirm shelf life with the shop.' },
  { id: 'groundnuts', name: 'Roasted Cornflour Ground Nuts', subtitle: 'Roasted peanuts. A crisp cornflour crunch.', description: 'Roasted groundnuts with a crisp cornflour coating. A crunchy companion for tea breaks, sharing and snacking on the go.', category: 'Namkeens', price: 140, baseWeight: 250, packs: [100,250,500], image: '/images/groundnuts.webp', tag: 'Roasted & crunchy', allergens: 'Contains peanuts. Shared preparation may involve other nuts, sesame, milk and wheat. Confirm all ingredients with the shop.', storage: 'Keep sealed, cool and dry. Confirm ingredients and shelf life with the shop.' },
];
export const hotItems: Product[] = [
  { id: 'samosa', name: 'Punjabi Samosa', subtitle: 'Golden outside. Full-on flavour inside.', description: 'Crisp pastry pockets filled with spiced potatoes and peas. Add a little chutney, take that first crunchy bite, and let chai time begin. Serving imagery is illustrative.', category: 'Hot & Crispy', price: 40, sale: 'pairs', packs: [1,2,3], hot: true, image: '/images/samosa.webp', tag: 'The chai-time hero', allergens: 'Wheat. May contain peanuts, milk, sesame and other nuts.', storage: 'Best enjoyed hot. Confirm preparation time, availability and safe holding instructions with the shop.' },
  { id: 'pakodi', name: 'Onion Pakodi', subtitle: 'Rainy-day mood. Any-day crunch.', description: 'Onion ribbons, gram flour, curry leaves and a little green chilli, fried into craggy golden bites. The perfect excuse to put the kettle on.', category: 'Hot & Crispy', price: 70, baseWeight: 100, packs: [100,250,500], hot: true, image: '/images/pakodi.webp', tag: 'Bring on the crunch', allergens: 'Chickpea flour. May contain wheat, peanuts, sesame and milk.', storage: 'Best enjoyed hot. Confirm preparation time, availability and safe holding instructions with the shop.' },
];
export const gift: Product = { id: 'gift', name: 'The Mahima Celebration Box', subtitle: 'Six favourites. One thoughtful gift.', description: 'A curated 1 kg assortment of our six featured sweets in a celebration-ready box. The selection shown is illustrative; confirm availability and ingredients before ordering.', category: 'Gifting', price: 790, image: '/images/hero.webp', tag: '1 kg assorted gift box', allergens: 'Milk, cashews, pistachios, wheat. May contain other nuts.', storage: 'Mixed sweets have different storage needs. Confirm handling and shelf life with the shop.' };
export const badam: Product = {id:'badam-geer',name:'Badam Geer',subtitle:'Sip slow. Stay golden.',description:'A rich almond-milk drink with a saffron glow, finished with almond and pistachio slivers. A creamy companion to your favourite hot snacks. Ingredients and serving image are illustrative; confirm with the shop.',category:'Signature Drinks',price:90,unit:'ml',baseWeight:250,packs:[250,500],image:'/images/badam-geer-refined.webp',tag:'The golden finish',allergens:'Milk, almonds and pistachios. May contain other nuts.',storage:'Confirm serving temperature, availability and storage with the shop. Refrigerate promptly if supplied chilled.'};
export const catalog = [...products, ...namkeens, ...hotItems, badam, gift];
export const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
export type CartItem = { id: string; grams: number; quantity: number };
export const defaultPack = (p: Product) => p.id === 'gift' ? 1000 : p.sale === 'pairs' ? 1 : p.sale === 'pieces' ? p.basePieces || 1 : p.baseWeight || 1000;
/* Keep stored prices on their original basis; display and edit weight-based sweets per kilogram. */
export const defaultPriceScale = (p: Product) => p.id === 'gift' || p.sale ? 1 : defaultPack(p) / (p.baseWeight || 500);
export const packOptions = (p: Product) => p.id === 'gift' ? [1000] : p.packs || [250,500,1000];
export const packLabel = (p: Product, size: number) => p.id === 'gift' ? '1 kg assorted box' : p.sale === 'pairs' ? `${size * 2} pieces` : p.sale === 'pieces' ? `${size} pieces` : p.unit === 'ml' ? `${size} ml` : size === 1000 ? '1 kg' : `${size} g`;
export const priceFor = (p: Product, size: number) => Math.round(p.price * (p.id === 'gift' ? 1 : p.sale === 'pairs' ? size : p.sale === 'pieces' ? size / (p.basePieces || 1) : size / (p.baseWeight || 500)));
export function linePrice(item: CartItem, list: Product[] = catalog) { const p = list.find(p => p.id === item.id); return p ? priceFor(p,item.grams) : 0; }
/* Live shop state from /api/shop/: sold-out flags, price changes, product edits, added items, favourites and the notice banner. */
export type Section = 'sweets' | 'namkeens' | 'hot' | 'drink' | 'gift';
export type Sell = { type: 'large' | 'small' | 'pieces'; pieces?: number };
export type ProductData = {
  name?: string; subtitle?: string; description?: string; tag?: string; special?: boolean; allergens?: string; storage?: string;
  category?: string; section?: 'sweets' | 'namkeens' | 'hot'; sell?: Sell; price?: number; image?: string;
};
export type ProductRecord = { id: string; custom: boolean; hidden: boolean; data: ProductData };
/* Shop details from /admin → Shop details. Shown on bills and policy pages and used for UPI payment. */
export type Business = {
  legalName: string; ownerName: string; fssai: string; email: string;
  grievanceName: string; grievancePhone: string; grievanceEmail: string;
  upiId: string; payeeName: string; qrImageId: string; qrImage: string; advancePercent: number; prepMinutes: number;
};
export const businessDefaults: Business = {
  legalName: 'Mahima Sweets', ownerName: '', fssai: '', email: '', grievanceName: '', grievancePhone: '', grievanceEmail: '',
  upiId: '', payeeName: 'Mahima Sweets', qrImageId: '', qrImage: '', advancePercent: 25, prepMinutes: 60,
};
export type HeroStyle = 'classic' | 'diwali';
export type ShopState = {
  hero?: HeroStyle;
  items: Record<string, { soldOut: boolean; price: number | null }>;
  notice: { text: string } | null;
  products?: ProductRecord[];
  favourites?: string[] | null;
  business?: Business;
};
export const applyShopState = (p: Product, state: ShopState | null): Product => {
  const live = state?.items[p.id];
  return live ? { ...p, price: live.price ?? p.price, soldOut: live.soldOut } : p;
};

export const sweetCategories = ['Traditional', 'Dry fruit', 'Milk sweets', 'Syrupy'];
export const sectionOf = (p: Product): Section =>
  p.id === 'gift' ? 'gift' : p.id === 'badam-geer' ? 'drink' : p.category === 'Namkeens' ? 'namkeens' : p.category === 'Hot & Crispy' ? 'hot' : 'sweets';
export const sectionNames: Record<Section, string> = { sweets: 'Sweets', namkeens: 'Namkeens', hot: 'Hot & Crispy', drink: 'Drink', gift: 'Gift box' };
export const defaultFavourites = ['poothrekulu', 'katli', 'dharwad', 'mysore'];
const DEFAULT_ALLERGENS = 'Please ask the shop about ingredients and allergens.';
const DEFAULT_STORAGE = 'Please ask the shop about storage and shelf life.';

/* How an added item is sold → pack sizes. Prices are always for the first (default) pack shown. */
export const sellPacks = (sell: Sell): Pick<Product, 'packs' | 'baseWeight' | 'sale' | 'basePieces'> =>
  sell.type === 'pieces'
    ? { sale: 'pieces', basePieces: sell.pieces || 1, packs: [sell.pieces || 1, (sell.pieces || 1) * 2] }
    : sell.type === 'small'
      ? { baseWeight: 250, packs: [100, 250, 500] }
      : { baseWeight: 1000, packs: [250, 500, 1000] };
export const sellDefault = (section: 'sweets' | 'namkeens' | 'hot'): Sell =>
  section === 'sweets' ? { type: 'large' } : section === 'namkeens' ? { type: 'small' } : { type: 'pieces', pieces: 2 };

/* Owner text edits on a built-in item. Empty fields keep the original wording. */
function applyEdits(p: Product, d: ProductData): Product {
  const label = d.tag || p.special || p.tag;
  return {
    ...p,
    name: d.name || p.name,
    subtitle: d.subtitle || p.subtitle,
    description: d.description || p.description,
    allergens: d.allergens || p.allergens,
    storage: d.storage || p.storage,
    category: sectionOf(p) === 'sweets' && d.category && sweetCategories.includes(d.category) ? d.category : p.category,
    image: d.image || p.image,
    ...(d.tag !== undefined || d.special !== undefined
      ? (d.special ? { special: label.toUpperCase(), tag: label } : { special: undefined, tag: label || p.tag })
      : {}),
  };
}

/* An item the owner added. */
export function customProduct(r: ProductRecord): Product {
  const d = r.data, section = d.section || 'sweets';
  const subtitle = d.subtitle || 'Fresh from Mahima Sweets.';
  const label = d.tag || (section === 'hot' ? 'Fresh & hot' : 'New at Mahima');
  return {
    id: r.id,
    name: d.name || 'New item',
    subtitle,
    description: d.description || subtitle,
    category: section === 'sweets' ? d.category || 'Traditional' : section === 'namkeens' ? 'Namkeens' : 'Hot & Crispy',
    price: d.price || 1,
    image: d.image || '/images/hero.webp',
    tag: label,
    special: d.special ? label.toUpperCase() : undefined,
    allergens: d.allergens || DEFAULT_ALLERGENS,
    storage: d.storage || DEFAULT_STORAGE,
    hot: section === 'hot' || undefined,
    custom: true,
    ...sellPacks(d.sell || sellDefault(section)),
  };
}

/* The full menu: built-in items with owner edits, then added items, with live stock and prices. Hidden items stay in the list (flagged) so bags can be checked. */
export function buildCatalog(state: ShopState | null): Product[] {
  const records = state?.products || [];
  const byId = new Map(records.map(r => [r.id, r]));
  const builtins = catalog.map(p => {
    const r = byId.get(p.id);
    return applyShopState(r ? { ...applyEdits(p, r.data), hidden: r.hidden } : p, state);
  });
  const added = records.filter(r => r.custom).map(r => applyShopState({ ...customProduct(r), hidden: r.hidden }, state));
  return [...builtins, ...added];
}

/* The four items in "Our favourites": the owner's picks, topped up with the originals, skipping hidden items. */
export function pickFavourites(list: Product[], state: ShopState | null): Product[] {
  const visible = list.filter(p => !p.hidden);
  const out: Product[] = [];
  for (const id of [...(state?.favourites || []), ...defaultFavourites, ...visible.map(p => p.id)]) {
    const p = visible.find(x => x.id === id);
    if (p && !out.includes(p)) out.push(p);
    if (out.length === 4) break;
  }
  return out;
}