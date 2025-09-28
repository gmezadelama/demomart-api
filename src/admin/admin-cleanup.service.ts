import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AdminCleanupService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Wipes demo data across tables where `isDemo = true`.
   */
  async wipeDemoData(): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const tryDelete = async (modelName: string) => {
        const model: any = tx[modelName];
        if (model?.deleteMany) {
          try {
            await model.deleteMany({ where: { isDemo: true } });
          } catch {
            // Model may not exist or lacks isDemo; ignore.
          }
        }
      };

      // Children first
      await tryDelete('orderItem');
      await tryDelete('wishlistItem');

      // Parents
      await tryDelete('order');
      await tryDelete('wishlist');
      await tryDelete('product');
      await tryDelete('category');
      await tryDelete('user');
    });
  }
}
