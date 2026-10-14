import { defineConfig } from 'vite';

// base './' garante que o build funcione em subcaminhos,
// como https://usuario.github.io/nome-do-repositorio/
export default defineConfig({
  base: '/trabalho-historia',
  build: {
    target: 'es2019',
    chunkSizeWarningLimit: 900
  }
});
