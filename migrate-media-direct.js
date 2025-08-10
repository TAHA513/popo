import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import with correct path
import('./server/migrate-media.ts').then(module => {
  return module.migrateMediaToCloud();
}).then(result => {
  console.log('✅ Migration completed successfully:', result);
  process.exit(0);
}).catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});