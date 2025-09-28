// test/utils/prisma.mock.ts
import { PrismaService } from '../src/common/prisma.service';

// Add only the models/methods you actually call in your services.
// You can expand this later if needed.
export function createPrismaMock(): PrismaService {
  return {
    category: {
      findMany: jest.fn(),
    },
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    wishlistItem: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(async (ops: any): Promise<any> => {
      // Support both array-of-promises and callback forms
      if (typeof ops === 'function') return await ops(createPrismaMock());
      return Promise.all(ops.map((p: Promise<any>) => p));
    }),
  } as unknown as PrismaService;
}

// Reset all jest.fn() inside the mock recursively
export function resetPrismaMock(mock: any) {
  for (const key of Object.keys(mock)) {
    const val = mock[key];
    if (typeof val === 'function' && 'mockReset' in val) {
      (val as jest.Mock).mockReset();
    } else if (val && typeof val === 'object') {
      resetPrismaMock(val);
    }
  }
}
