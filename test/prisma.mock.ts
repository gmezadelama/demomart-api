// test/utils/prisma.mock.ts
import { PrismaService } from '../src/common/prisma.service';

// Add only the models/methods you actually call in your services.
// You can expand this later if needed.
export function createPrismaMock() {
  return {
    category: {
      findMany: jest.fn(),
    },
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
    },
    wishlistItem: {
      findMany: jest.fn(),
    },
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
