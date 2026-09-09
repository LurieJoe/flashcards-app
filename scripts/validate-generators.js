'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.join(__dirname, '..', 'app', 'generators.js');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(sourcePath, 'utf8'), sandbox, { filename: sourcePath });

const categories = sandbox.window.TOPIC_CATEGORIES;
const packs = sandbox.window.TOPIC_PACKS;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

assert(Array.isArray(categories), 'TOPIC_CATEGORIES must be an array.');
assert(categories.length === 8, `Expected 8 categories; found ${categories.length}.`);
assert(Array.isArray(packs), 'TOPIC_PACKS must be an array.');
assert(packs.length === 57, `Expected 57 packs; found ${packs.length}.`);

const categoryIds = new Set();
const categoryNames = new Set();
for (const category of categories) {
  assert(category && normalize(category.id), 'Every category needs a nonempty id.');
  assert(normalize(category.name), `Category ${category.id} needs a nonempty name.`);
  assert(!categoryIds.has(category.id), `Duplicate category id: ${category.id}`);
  assert(!categoryNames.has(category.name), `Duplicate category name: ${category.name}`);
  categoryIds.add(category.id);
  categoryNames.add(category.name);
}

const packIds = new Set();
const packNames = new Set();
const categoryCounts = new Map(categories.map(category => [category.id, 0]));
for (const pack of packs) {
  assert(pack && normalize(pack.id), 'Every pack needs a nonempty id.');
  assert(normalize(pack.name), `Pack ${pack.id} needs a nonempty name.`);
  assert(!packIds.has(pack.id), `Duplicate pack id: ${pack.id}`);
  assert(!packNames.has(pack.name), `Duplicate pack name: ${pack.name}`);
  assert(categoryIds.has(pack.category), `${pack.name} references invalid category ${pack.category}.`);
  assert(typeof pack.all === 'function', `${pack.name} must expose all().`);
  packIds.add(pack.id);
  packNames.add(pack.name);
  categoryCounts.set(pack.category, categoryCounts.get(pack.category) + 1);

  const cards = pack.all();
  assert(Array.isArray(cards), `${pack.name}.all() must return an array.`);
  assert(cards.length >= 50, `${pack.name} has only ${cards.length} cards.`);
  const pairs = new Set();
  const questions = new Set();
  const answers = new Set();
  cards.forEach((card, index) => {
    assert(card && normalize(card.q), `${pack.name} card ${index + 1} has an empty question.`);
    assert(normalize(card.a), `${pack.name} card ${index + 1} has an empty answer.`);
    const question = normalize(card.q);
    const answer = normalize(card.a);
    const key = `${question}\u0000${answer}`;
    assert(!pairs.has(key), `${pack.name} has a duplicate Q+A pair at card ${index + 1}.`);
    pairs.add(key);
    questions.add(question);
    answers.add(answer);
  });
  assert(questions.size >= 5, `${pack.name} needs at least 5 unique questions for Matching Pairs.`);
  assert(answers.size >= 5, `${pack.name} needs at least 5 unique answers for Matching Pairs.`);
}

for (const category of categories) {
  const count = categoryCounts.get(category.id);
  assert(count === (category.id === 'early-learning' ? 8 : 7),
    `${category.name} has ${count} packs; expected ${category.id === 'early-learning' ? 8 : 7}.`);
}

console.log(`Validated ${categories.length} categories and ${packs.length} packs.`);
console.log('Every pack has at least 50 nonempty, unique Q+A cards and a valid category.');

const clockPack = packs.find(pack => pack.id === 'telling-time');
const clockCards = clockPack.all();
const clockEmoji = new Set(
  clockCards.flatMap(card => [...`${card.q} ${card.a}`].filter(char => /\p{Extended_Pictographic}/u.test(char)))
);
assert(clockCards.length >= 50, 'Telling Time with Analog Clocks needs at least 50 cards.');
assert(clockEmoji.size === 24, `Expected all 24 clock emojis; found ${clockEmoji.size}.`);
console.log(`Telling Time uses all ${clockEmoji.size} clock emojis across ${clockCards.length} cards.`);
