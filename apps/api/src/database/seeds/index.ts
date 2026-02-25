import 'reflect-metadata';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

import { runSeed } from './initial-data.seed';

runSeed()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
