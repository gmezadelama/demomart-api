// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

console.log('DB:', process.env.DATABASE_URL?.replace(/:\/\/.*@/, '://***@'));

// Build a simple Picsum URL. Swap later for Cloudinary/local files if you want.
const img = (slug: string, size = 400) =>
  `https://picsum.photos/seed/${encodeURIComponent(slug)}/${size}/${size}`;

// ---- Seed data (edit freely) ----
const categories = [
  { name: 'Desserts', slug: 'desserts', sort: 1 },
  { name: 'Bakery', slug: 'bakery', sort: 2 },
  { name: 'Deli', slug: 'deli', sort: 3 },
] as const;

const products = [
  // Desserts
  {
    category: 'desserts',
    slug: 'classic-cheesecake',
    name: 'Classic Cheesecake',
    priceCents: 499,
    sku: 'DES-CHS-001',
    stockQty: 24,
    description: 'Rich and creamy cheesecake with a buttery crust.',
  },
  {
    category: 'desserts',
    slug: 'chocolate-brownie',
    name: 'Chocolate Brownie',
    priceCents: 299,
    sku: 'DES-CHB-001',
    stockQty: 48,
    description: 'Fudgy brownie, deep cocoa flavor.',
  },
  {
    category: 'desserts',
    slug: 'strawberry-tart',
    name: 'Strawberry Tart',
    priceCents: 449,
    sku: 'DES-STR-001',
    stockQty: 20,
    description: 'Crisp tart shell with fresh strawberries.',
  },
  {
    category: 'desserts',
    slug: 'vanilla-ice-cream',
    name: 'Vanilla Ice Cream',
    priceCents: 399,
    sku: 'DES-VAN-001',
    stockQty: 36,
    description: 'Classic vanilla with Madagascar beans.',
  },
  {
    category: 'desserts',
    slug: 'lemon-mousse',
    name: 'Lemon Mousse',
    priceCents: 429,
    sku: 'DES-LEM-001',
    stockQty: 18,
    description: 'Light, airy, and citrusy.',
  },

  // Bakery
  {
    category: 'bakery',
    slug: 'croissant',
    name: 'Croissant',
    priceCents: 249,
    sku: 'BKR-CRS-001',
    stockQty: 60,
    description: 'Buttery, flaky layers—freshly baked.',
  },
  {
    category: 'bakery',
    slug: 'baguette',
    name: 'Baguette',
    priceCents: 299,
    sku: 'BKR-BAG-001',
    stockQty: 50,
    description: 'Crispy crust, chewy interior.',
  },
  {
    category: 'bakery',
    slug: 'blueberry-muffin',
    name: 'Blueberry Muffin',
    priceCents: 279,
    sku: 'BKR-BLM-001',
    stockQty: 40,
    description: 'Studded with juicy blueberries.',
  },
  {
    category: 'bakery',
    slug: 'sourdough-bread',
    name: 'Sourdough Bread',
    priceCents: 399,
    sku: 'BKR-SDB-001',
    stockQty: 22,
    description: 'Slow-fermented tang, rustic crust.',
  },
  {
    category: 'bakery',
    slug: 'cinnamon-roll',
    name: 'Cinnamon Roll',
    priceCents: 329,
    sku: 'BKR-CIN-001',
    stockQty: 32,
    description: 'Swirls of cinnamon with icing.',
  },

  // Deli
  {
    category: 'deli',
    slug: 'roast-beef-sandwich',
    name: 'Roast Beef Sandwich',
    priceCents: 899,
    sku: 'DEL-RBS-001',
    stockQty: 15,
    description: 'Thin-sliced roast beef, horseradish aioli.',
  },
  {
    category: 'deli',
    slug: 'turkey-club-sandwich',
    name: 'Turkey Club Sandwich',
    priceCents: 849,
    sku: 'DEL-TCS-001',
    stockQty: 18,
    description: 'Turkey, bacon, lettuce, tomato.',
  },
  {
    category: 'deli',
    slug: 'ham-cheese-panini',
    name: 'Ham & Cheese Panini',
    priceCents: 799,
    sku: 'DEL-HCP-001',
    stockQty: 20,
    description: 'Melted Swiss on pressed bread.',
  },
  {
    category: 'deli',
    slug: 'italian-sub',
    name: 'Italian Sub',
    priceCents: 899,
    sku: 'DEL-ITS-001',
    stockQty: 16,
    description: 'Salami, capicola, provolone, vinaigrette.',
  },
  {
    category: 'deli',
    slug: 'smoked-salmon-bagel',
    name: 'Smoked Salmon Bagel',
    priceCents: 999,
    sku: 'DEL-SSB-001',
    stockQty: 12,
    description: 'Lox, cream cheese, capers, red onion.',
  },
] as const;

// ---- Simple, linear seed steps ----
async function seedCategories() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sort: c.sort },
      create: { name: c.name, slug: c.slug, sort: c.sort },
    });
  }
}

async function seedProducts() {
  for (const p of products) {
    // Product (connect category by its unique slug)
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        active: true,
        category: { connect: { slug: p.category } },
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        active: true,
        category: { connect: { slug: p.category } },
      },
    });

    // Variant (connect product by unique slug)
    await prisma.productVariant.upsert({
      where: { sku: p.sku },
      update: {
        priceCents: p.priceCents,
        currency: 'USD',
        stockQty: p.stockQty,
        active: true,
        product: { connect: { slug: p.slug } },
      },
      create: {
        sku: p.sku,
        priceCents: p.priceCents,
        currency: 'USD',
        stockQty: p.stockQty,
        active: true,
        product: { connect: { slug: p.slug } },
      },
    });

    // Asset: keeping it simple — remove existing thumbnail for this product, then create one
    await prisma.asset.deleteMany({
      where: { product: { slug: p.slug }, kind: 'thumbnail' },
    });
    await prisma.asset.create({
      data: {
        product: { connect: { slug: p.slug } },
        url: img(p.slug),
        kind: 'thumbnail',
        sort: 0,
      },
    });
  }
}

async function seedUsersAndOrders() {
  // Alice
  const alice = await prisma.user.upsert({
    where: { email: 'alice@demo.local' },
    update: { name: 'Alice', isDemo: true },
    create: {
      email: 'alice@demo.local',
      name: 'Alice',
      isDemo: true,
    },
  });

  // Seed Alice address
  const aliceDefaultAddress = await prisma.address.findFirst({
    where: { userId: alice.id, isDefaultShipping: true },
  });

  await prisma.address.upsert({
    where: aliceDefaultAddress ? { id: aliceDefaultAddress.id } : { id: '' }, // Use empty string if not found, will trigger create
    update: {
      line1: '123 Demo Street',
      city: 'Sampleville',
      region: 'CA',
      postalCode: '90001',
      country: 'US',
      isDefaultShipping: true,
    },
    create: {
      userId: alice.id,
      line1: '123 Demo Street',
      city: 'Sampleville',
      region: 'CA',
      postalCode: '90001',
      country: 'US',
      isDefaultShipping: true,
    },
  });

  // Bob
  await prisma.user.upsert({
    where: { email: 'bob@demo.local' },
    update: { name: 'Bob', isDemo: true },
    create: {
      email: 'bob@demo.local',
      name: 'Bob',
      isDemo: true,
    },
  });

  // Seed Bob address
  const bob = await prisma.user.findUnique({
    where: { email: 'bob@demo.local' },
  });
  if (bob) {
    // Find Bob's default shipping address (if any)
    const bobDefaultAddress = await prisma.address.findFirst({
      where: { userId: bob.id, isDefaultShipping: true },
    });

    await prisma.address.upsert({
      where: bobDefaultAddress ? { id: bobDefaultAddress.id } : { id: '' }, // Use empty string if not found, will trigger create
      update: {
        line1: '456 Example Avenue',
        city: 'Testtown',
        region: 'NY',
        postalCode: '10001',
        country: 'US',
        isDefaultShipping: true,
      },
      create: {
        userId: bob.id,
        line1: '456 Example Avenue',
        city: 'Testtown',
        region: 'NY',
        postalCode: '10001',
        country: 'US',
        isDefaultShipping: true,
      },
    });
  }

  // Clean old Alice orders
  await prisma.order.deleteMany({ where: { userId: alice.id, isDemo: true } });

  // Seed 3 orders for Alice
  const variant1 = await prisma.productVariant.findUnique({
    where: { sku: 'DES-CHS-001' },
  });
  const variant2 = await prisma.productVariant.findUnique({
    where: { sku: 'BKR-CRS-001' },
  });
  const variant3 = await prisma.productVariant.findUnique({
    where: { sku: 'DEL-RBS-001' },
  });

  if (!variant1 || !variant2 || !variant3)
    throw new Error('Variants not found for Alice orders');

  // Helper to create order
  async function makeOrder(
    num: string,
    variants: { v: typeof variant1; qty: number }[],
  ) {
    const items = variants
      .filter(({ v }) => v !== null)
      .map(({ v, qty }) => ({
        product: { connect: { id: v!.productId } },
        variant: { connect: { id: v!.id } },
        nameSnapshot: v!.sku,
        skuSnapshot: v!.sku,
        quantity: qty,
        unitPriceCents: v!.priceCents,
        currency: v!.currency,
        lineTotalCents: v!.priceCents * qty,
      }));
    const subtotal = items.reduce((sum, i) => sum + i.lineTotalCents, 0);

    // Find Alice's default address for shipping and billing
    const shippingAddress = await prisma.address.findFirst({
      where: { userId: alice.id, isDefaultShipping: true },
    });

    if (!shippingAddress)
      throw new Error('Shipping address not found for Alice');

    const order = await prisma.order.create({
      data: {
        number: num,
        status: 'paid',
        subtotalCents: subtotal,
        totalCents: subtotal,
        currency: 'USD',
        user: { connect: { id: alice.id } },
        isDemo: true,
        items: { create: items },
        shippingAddress: { connect: { id: shippingAddress.id } },
        billingAddress: { connect: { id: shippingAddress.id } }, // Use same address for billing
      },
    });

    await prisma.order.updateMany({
      where: { isDemo: true },
      data: { paymentStatus: 'unpaid' },
    });

    return order;
  }

  await makeOrder('ORD-1001', [{ v: variant1, qty: 1 }]);
  await makeOrder('ORD-1002', [
    { v: variant2, qty: 2 },
    { v: variant1, qty: 1 },
  ]);
  await makeOrder('ORD-1003', [
    { v: variant3, qty: 1 },
    { v: variant2, qty: 2 },
  ]);
}

async function main() {
  console.log('Seeding categories…');
  await seedCategories();

  console.log('Seeding products, variants, and thumbnails…');
  await seedProducts();

  console.log('Seeding users and demo orders…');
  await seedUsersAndOrders();

  console.log('Seed complete ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch((err) => {
      console.error('Error disconnecting Prisma:', err);
    });
  });
