import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema'),
  migrations: { path: path.join(__dirname, 'prisma', 'migrations'), seed: 'tsx prisma/seed/index.ts' },
});
