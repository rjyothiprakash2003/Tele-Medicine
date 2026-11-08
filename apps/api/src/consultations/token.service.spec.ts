import { TokenService } from './token.service';

describe('TokenService', () => {
  it('formats sequential tokens with date key', async () => {
    const prisma = {
      $transaction: async (fn: (tx: unknown) => Promise<number>) =>
        fn({
          tokenCounter: {
            findUnique: async () => null,
            create: async () => ({ lastValue: 1 }),
            update: async () => ({ lastValue: 2 }),
          },
        }),
    } as never;

    const service = new TokenService(prisma);
    const token = await service.nextToken();
    expect(token).toMatch(/^TM-\d{8}-00001$/);
  });
});
