import { access, cp, copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'preview-dist');

const requiredDirectories = [
  'admin',
  'portal',
  'css',
  'js',
  'icons',
  'homologacao',
];

const optionalFiles = [
  'index.html',
  'manifest.webmanifest',
  'release.json',
];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const directory of requiredDirectories) {
  const source = path.join(root, directory);
  const destination = path.join(out, directory);
  await access(source);
  await cp(source, destination, { recursive: true });
}

for (const file of optionalFiles) {
  const source = path.join(root, file);
  try {
    await access(source);
    await copyFile(source, path.join(out, file));
  } catch {
    // Optional preview asset; ignore when it does not exist.
  }
}

console.log('Preview package ready at preview-dist/');
