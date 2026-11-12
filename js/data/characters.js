/**
 * Personagens ficcionais compostos, inspirados em grupos sociais de cada época.
 * Cada personagem usa personagens/<pasta>/cenario/pose1..3.png e
 * personagens/<pasta>/dialogo/pose1..3.png. Arquivos antigos na raiz da pasta
 * continuam funcionando como fallback durante a substituição gradual.
 * A ordem dos itens define a ordem dos blocos de tópicos atribuídos a cada NPC.
 */
export const CHARACTERS = {
  france: [
    { id: 'personagem1', folder: 'personagem1', name: 'Luiza', role: 'Artesã parisiense', color: '#a94e3e', accent: '#e6b46a', symbol: '⚒' },
    { id: 'personagem2', folder: 'personagem2', name: 'Henry', role: 'Aprendiz de tipógrafo', color: '#526d78', accent: '#d8b77a', symbol: '✒' },
    { id: 'personagem3', folder: 'personagem3', name: 'Letícia', role: 'Vendedora do mercado', color: '#6e7958', accent: '#dba66b', symbol: '✦' }
  ],
  russia: [
    { id: 'personagem4', folder: 'personagem4', name: 'Beatriz', role: 'Trabalhadora têxtil', color: '#a34c3c', accent: '#e1c28e', symbol: '⚙' },
    { id: 'personagem5', folder: 'personagem5', name: 'Julia', role: 'Trabalhadora ', color: '#300f50', accent: '#e1c28e', symbol: '⚙' },
    { id: 'personagem6', folder: 'personagem6', name: 'Guedes', role: 'Soldado camponês', color: '#526b59', accent: '#d8b77a', symbol: '★' },
    { id: 'personagem7', folder: 'personagem7', name: 'Yasmin', role: 'Operária metalúrgica', color: '#536e84', accent: '#dfb76e', symbol: '⚒' }
  ]
};
