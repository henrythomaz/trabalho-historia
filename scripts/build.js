import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(projectRoot, 'dist');

// O jogo não precisa ser compilado: este script só reúne os arquivos estáticos
// necessários para o GitHub Pages, sem incluir testes, Git ou documentação.
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const file of ['index.html', '.nojekyll']) {
  await cp(resolve(projectRoot, file), resolve(outputDirectory, file));
}

for (const directory of ['assets', 'css', 'js', 'personagens', 'player']) {
  await cp(resolve(projectRoot, directory), resolve(outputDirectory, directory), { recursive: true });
}

console.log(`Arquivos estáticos preparados em ${outputDirectory}`);
