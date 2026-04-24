// scripts/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const NUM_USERS   = 20;
const NUM_PRODUCTS = 50;
const NUM_ORDERS   = 30;

async function seed() {
  console.log('🌱 Starting database seed...\n');

  // ─── Clean existing data ──────────────────────────────────────────
  console.log('🗑️  Cleaning existing data...');
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.apiKey.deleteMany(),
    prisma.webhook.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ─── Admin user ───────────────────────────────────────────────────
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('Admin1234!', SALT_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      email:           'admin@enterprise.com',
      username:        'admin',
      passwordHash:    adminPassword,
      firstName:       'System',
      lastName:        'Admin',
      role:            'ADMIN',
      isActive:        true,
      isEmailVerified: true,
    },
  });

  // ─── Regular users ────────────────────────────────────────────────
  console.log(`👥 Creating ${NUM_USERS} regular users...`);
  const userPassword = await bcrypt.hash('User1234!', SALT_ROUNDS);
  const users = await Promise.all(
    Array.from({ length: NUM_USERS }, () =>
      prisma.user.create({
        data: {
          email:           faker.internet.email().toLowerCase(),
          username:        faker.internet.username().toLowerCase().slice(0, 20),
          passwordHash:    userPassword,
          firstName:       faker.person.firstName(),
          lastName:        faker.person.lastName(),
          role:            'USER',
          isActive:        faker.datatype.boolean({ probability: 0.9 }),
          isEmailVerified: faker.datatype.boolean({ probability: 0.7 }),
          avatarUrl:       faker.image.avatar(),
          lastLoginAt:     faker.date.recent({ days: 30 }),
        },
      })
    )
  );

  // ─── API Key for admin ────────────────────────────────────────────
  console.log('🔑 Creating API key...');
  const { randomBytes } = await import('crypto');
  await prisma.apiKey.create({
    data: {
      key:         `sk_dev_${randomBytes(24).toString('hex')}`,
      name:        'Development Key',
      userId:      admin.id,
      permissions: ['read', 'write'],
      isActive:    true,
    },
  });

  // ─── Categories ───────────────────────────────────────────────────
  console.log('📂 Creating categories...');
  const categoryData = [
    { name: 'Electronics',    slug: 'electronics',    description: 'Gadgets and electronic devices' },
    { name: 'Clothing',       slug: 'clothing',       description: 'Apparel and accessories' },
    { name: 'Books',          slug: 'books',          description: 'Physical and digital books' },
    { name: 'Home & Garden',  slug: 'home-garden',    description: 'Furniture and home improvement' },
    { name: 'Sports',         slug: 'sports',         description: 'Sports equipment and gear' },
    { name: 'Toys & Games',   slug: 'toys-games',     description: 'Toys and board games' },
    { name: 'Health',         slug: 'health',         description: 'Health and wellness products' },
    { name: 'Automotive',     slug: 'automotive',     description: 'Car accessories and parts' },
  ];

  const categories = await Promise.all(
    categoryData.map((c) => prisma.category.create({ data: c }))
  );

  // ─── Products ─────────────────────────────────────────────────────
  console.log(`📦 Creating ${NUM_PRODUCTS} products...`);
  const productNames = new Set();
  const products = [];

  for (let i = 0; i < NUM_PRODUCTS; i++) {
    let name;
    do {
      name = `${faker.commerce.productAdjective()} ${faker.commerce.product()}`;
    } while (productNames.has(name));
    productNames.add(name);

    const price = parseFloat(faker.commerce.price({ min: 5, max: 999, dec: 2 }));
    const slug  = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + `-${i}`;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: faker.commerce.productDescription(),
        price,
        comparePrice: faker.datatype.boolean({ probability: 0.4 }) ? price * 1.2 : null,
        stock:        faker.number.int({ min: 0, max: 500 }),
        sku:          `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
        imageUrls:    Array.from({ length: faker.number.int({ min: 1, max: 4 }) },
                       () => `https://picsum.photos/seed/${faker.string.alphanumeric(6)}/400/400`),
        tags:         faker.helpers.arrayElements(
                        ['sale', 'new', 'popular', 'trending', 'limited', 'eco', 'premium'],
                        { min: 0, max: 3 }
                      ),
        categoryId:   faker.helpers.arrayElement(categories).id,
        isActive:     faker.datatype.boolean({ probability: 0.85 }),
        isFeatured:   faker.datatype.boolean({ probability: 0.2 }),
        metadata:     { weight: faker.number.float({ min: 0.1, max: 20, fractionDigits: 2 }), unit: 'kg' },
      },
    });
    products.push(product);
  }

  // ─── Orders ───────────────────────────────────────────────────────
  console.log(`🛒 Creating ${NUM_ORDERS} orders...`);
  const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  for (let i = 0; i < NUM_ORDERS; i++) {
    const user          = faker.helpers.arrayElement(users);
    const selectedProds = faker.helpers.arrayElements(products, { min: 1, max: 5 });
    const status        = faker.helpers.arrayElement(statuses);

    let subtotal = 0;
    const items  = selectedProds.map((p) => {
      const qty        = faker.number.int({ min: 1, max: 3 });
      const unitPrice  = parseFloat(p.price);
      const totalPrice = unitPrice * qty;
      subtotal += totalPrice;
      return { productId: p.id, quantity: qty, unitPrice, totalPrice };
    });

    const tax          = parseFloat((subtotal * 0.1).toFixed(2));
    const shippingCost = subtotal > 100 ? 0 : 9.99;
    const total        = subtotal + tax + shippingCost;

    const ts   = Date.now().toString(36).toUpperCase();
    const rand = faker.string.alphanumeric(4).toUpperCase();

    await prisma.order.create({
      data: {
        orderNumber:     `ORD-${ts}-${rand}-${i}`,
        userId:          user.id,
        status,
        subtotal,
        tax,
        shippingCost,
        total,
        notes:           faker.datatype.boolean({ probability: 0.3 }) ? faker.lorem.sentence() : null,
        shippingAddress: {
          fullName: `${user.firstName} ${user.lastName}`,
          address1: faker.location.streetAddress(),
          city:     faker.location.city(),
          state:    faker.location.state({ abbreviated: true }),
          zip:      faker.location.zipCode(),
          country:  'US',
          phone:    faker.phone.number(),
        },
        paidAt:       ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status) ? faker.date.recent({ days: 60 }) : null,
        shippedAt:    ['SHIPPED', 'DELIVERED'].includes(status) ? faker.date.recent({ days: 30 }) : null,
        deliveredAt:  status === 'DELIVERED' ? faker.date.recent({ days: 10 }) : null,
        cancelledAt:  status === 'CANCELLED' ? faker.date.recent({ days: 20 }) : null,
        items:        { create: items },
      },
    });
  }

  // ─── Webhook ──────────────────────────────────────────────────────
  console.log('🔗 Creating sample webhook...');
  await prisma.webhook.create({
    data: {
      url:      'https://webhook.site/sample-endpoint',
      secret:   randomBytes(32).toString('hex'),
      events:   ['order.created', 'order.paid', 'user.created'],
      isActive: true,
    },
  });

  // ─── Summary ──────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Admin:    admin@enterprise.com / Admin1234!`);
  console.log(`  User:     (any seeded email)   / User1234!`);
  console.log(`  Users:    ${NUM_USERS + 1}`);
  console.log(`  Products: ${NUM_PRODUCTS}`);
  console.log(`  Orders:   ${NUM_ORDERS}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
