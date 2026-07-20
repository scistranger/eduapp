import { cp, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const distDirectory = path.resolve('dist');
const clientDirectory = path.join(distDirectory, 'client');

await mkdir(clientDirectory, { recursive: true });

for (const entry of await readdir(distDirectory, { withFileTypes: true })) {
  if (['client', 'server', '.openai'].includes(entry.name)) continue;

  await cp(
    path.join(distDirectory, entry.name),
    path.join(clientDirectory, entry.name),
    { recursive: entry.isDirectory() },
  );
}
