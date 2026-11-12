/**
 * Divide os tópicos em blocos contínuos e equilibrados entre os personagens.
 * Quando a divisão não é exata, os primeiros personagens recebem um tópico a mais.
 *
 * Exemplo: 10 tópicos e 4 personagens => [3, 3, 2, 2].
 */
export function distributeCharactersAcrossTopics(topics, characters) {
  if (!Array.isArray(topics) || !Array.isArray(characters) || !topics.length || !characters.length) {
    return [];
  }

  // Não há como dar ao menos um tópico para cada personagem quando há mais
  // personagens do que tópicos; nesse caso, usamos os primeiros da lista.
  const activeCharacterCount = Math.min(topics.length, characters.length);
  const topicsPerCharacter = Math.floor(topics.length / activeCharacterCount);
  const remainder = topics.length % activeCharacterCount;
  const assignments = [];
  let topicIndex = 0;

  for (let characterIndex = 0; characterIndex < activeCharacterCount; characterIndex += 1) {
    const blockSize = topicsPerCharacter + (characterIndex < remainder ? 1 : 0);
    const blockStart = topicIndex;
    const blockEnd = blockStart + blockSize - 1;
    const character = characters[characterIndex];

    for (; topicIndex <= blockEnd; topicIndex += 1) {
      assignments.push({
        topic: topics[topicIndex],
        topicIndex,
        character,
        characterIndex,
        isAnchorTopic: topicIndex === blockStart,
        blockStart,
        blockEnd
      });
    }
  }

  return assignments;
}

export function characterAssignmentForTopic(topics, characters, targetTopic) {
  if (!targetTopic) return null;
  const targetId = targetTopic.id;
  return distributeCharactersAcrossTopics(topics, characters)
    .find(({ topic }) => topic === targetTopic || (targetId && topic.id === targetId)) || null;
}
