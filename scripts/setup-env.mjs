import { constants, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const templatePath = fileURLToPath(new URL('../.env.example', import.meta.url));
const localPath = fileURLToPath(new URL('../.env.local', import.meta.url));

try {
  copyFileSync(templatePath, localPath, constants.COPYFILE_EXCL);
  console.log('Created .env.local from .env.example.');
} catch (error) {
  if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
    console.log('.env.local already exists; left it unchanged.');
  } else {
    throw error;
  }
}
