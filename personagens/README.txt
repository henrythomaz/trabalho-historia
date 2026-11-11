ARTE DOS PERSONAGENS — DUAS VERSÕES INDEPENDENTES

Cada personagem possui seis imagens: três poses para o mapa/cenário e três
poses para o retrato dos diálogos. Coloque os arquivos nestas pastas:

personagens/personagem1/cenario/pose1.png
personagens/personagem1/cenario/pose2.png
personagens/personagem1/cenario/pose3.png
personagens/personagem1/dialogo/pose1.png
personagens/personagem1/dialogo/pose2.png
personagens/personagem1/dialogo/pose3.png

Repita a mesma estrutura para personagem2, personagem3, personagem4,
personagem5, personagem6 e personagem7.

USO DAS POSES DO CENÁRIO:
- cenario/pose1.png: NPC parado.
- cenario/pose2.png: jogador próximo.
- cenario/pose3.png: NPC que está participando do diálogo.

USO DAS POSES DO DIÁLOGO:
- dialogo/pose1.png: primeira página da conversa.
- dialogo/pose2.png: segunda página.
- dialogo/pose3.png: terceira página e páginas seguintes.

As imagens precisam ser PNG. Quando algum arquivo novo não existir, o jogo
procura automaticamente os arquivos antigos pose1.png, pose2.png e pose3.png
na pasta principal do personagem. Isso permite atualizar os personagens aos
poucos, sem quebrar os que ainda usam o formato anterior.


OBSERVAÇÃO DA PERSONAGEM 7:
A personagem7 já possui pose1.png e pose2.png em cenario/ e as três poses em dialogo/.
Enquanto cenario/pose3.png não for adicionado, o jogo reutiliza cenario/pose2.png
quando ela estiver participando de um diálogo no mapa. Isso não interrompe o jogo.
