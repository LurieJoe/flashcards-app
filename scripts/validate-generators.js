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
  return String(value || '').normalize('NFKC').replace(/\\;/g, ';').trim().toLowerCase().replace(/\s+/g, ' ');
}

function splitListItems(value) {
  const parts = [];
  let buffer = '';
  let depth = 0;
  const text = String(value || '');
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '\\' && text[index + 1] === ';') {
      buffer += ';';
      index++;
      continue;
    }
    if (character === '{' && text[index + 1] === '{') depth++;
    if (character === '}' && text[index + 1] === '}' && depth > 0) depth--;
    if (character === ';' && depth === 0) {
      parts.push(buffer);
      buffer = '';
    } else {
      buffer += character;
    }
  }
  parts.push(buffer);
  return parts.map(part => part.trim()).filter(Boolean);
}

const EXPECTED_PACKS_BY_CATEGORY = {
  'early-learning': [
    ['colors', 'Colors'],
    ['shapes', 'Shapes'],
    ['animals', 'Animals'],
    ['first-words', 'First Words & Sight Words'],
    ['opposites', 'Opposites'],
    ['calendar-time', 'Calendar & Time'],
    ['money-coins', 'Money & Coins'],
    ['telling-time', 'Telling Time with Analog Clocks'],
  ],
  math: [
    ['addition', 'Addition Facts'],
    ['subtraction', 'Subtraction Facts'],
    ['multiplication', 'Multiplication Tables'],
    ['division', 'Division Facts'],
    ['fractions', 'Fractions'],
    ['decimals-percents', 'Decimals & Percents'],
    ['geometry-measurement', 'Geometry & Measurement'],
  ],
  'life-science-health': [
    ['human-body', 'Human Body'],
    ['cells', 'Cells'],
    ['genetics', 'Genetics'],
    ['plants', 'Plants'],
    ['animal-classification', 'Animal Classification'],
    ['ecosystems', 'Ecosystems & Food Webs'],
    ['health-nutrition', 'Health & Nutrition'],
  ],
  'physical-earth-space': [
    ['elements', 'Chemical Elements'],
    ['chemistry-basics', 'Chemistry Basics'],
    ['physics-basics', 'Physics Basics'],
    ['earth-science', 'Earth Science'],
    ['weather-climate', 'Weather & Climate'],
    ['planets', 'Planets & Space'],
    ['scientific-method', 'Scientific Method'],
  ],
  'language-arts': [
    ['parts-speech', 'Parts of Speech'],
    ['grammar', 'Grammar Basics'],
    ['punctuation', 'Punctuation'],
    ['synonyms-antonyms', 'Synonyms & Antonyms'],
    ['roots-prefixes-suffixes', 'Roots, Prefixes & Suffixes'],
    ['commonly-confused', 'Commonly Confused Words'],
    ['literary-terms', 'Literary Terms'],
  ],
  'geography-civics': [
    ['us-capitals', 'US State Capitals'],
    ['world-capitals', 'World Capitals'],
    ['world-flags', 'World Flags'],
    ['us-civics', 'US Civics Basics'],
    ['us-states-abbreviations', 'US States & Abbreviations'],
    ['continents-landforms', 'Continents, Oceans & Landforms'],
    ['world-landmarks', 'World Landmarks'],
  ],
  'history-arts-culture': [
    ['us-presidents', 'US Presidents'],
    ['early-us-history', 'Early US History'],
    ['modern-us-history', 'Modern US History'],
    ['ancient-civilizations', 'Ancient Civilizations'],
    ['world-history', 'World History Milestones'],
    ['inventors-inventions', 'Inventors & Inventions'],
    ['art-music-terms', 'Art & Music Terms'],
  ],
  'world-languages': [
    ['spanish', 'Spanish Vocabulary'],
    ['french', 'French Vocabulary'],
    ['portuguese', 'Portuguese Vocabulary'],
    ['german', 'German Vocabulary'],
    ['italian', 'Italian Vocabulary'],
    ['japanese', 'Japanese Vocabulary'],
    ['mandarin', 'Mandarin Vocabulary'],
  ],
};

const ORIGINAL_PACK_IDS = [
  'animals', 'us-capitals', 'world-capitals', 'world-flags', 'us-presidents',
  'multiplication', 'elements', 'spanish', 'french', 'portuguese', 'planets',
  'us-civics', 'colors', 'shapes',
];
const expectedPacks = Object.entries(EXPECTED_PACKS_BY_CATEGORY)
  .flatMap(([category, entries]) => entries.map(([id, name]) => ({ id, name, category })));
const addedPackIds = expectedPacks.map(pack => pack.id).filter(id => !ORIGINAL_PACK_IDS.includes(id));

assert(Array.isArray(categories), 'TOPIC_CATEGORIES must be an array.');
assert(categories.length === 8, `Expected 8 categories; found ${categories.length}.`);
assert(Array.isArray(packs), 'TOPIC_PACKS must be an array.');
assert(packs.length === 57, `Expected 57 packs; found ${packs.length}.`);
assert(ORIGINAL_PACK_IDS.length === 14, 'The pre-fc374eb pack list must contain 14 decks.');
assert(addedPackIds.length === 43, 'The fc374eb expansion must contain 43 additional decks.');

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
const expectedPackById = new Map(expectedPacks.map(pack => [pack.id, pack]));
for (const pack of packs) {
  assert(pack && normalize(pack.id), 'Every pack needs a nonempty id.');
  assert(normalize(pack.name), `Pack ${pack.id} needs a nonempty name.`);
  assert(!packIds.has(pack.id), `Duplicate pack id: ${pack.id}`);
  assert(!packNames.has(pack.name), `Duplicate pack name: ${pack.name}`);
  assert(categoryIds.has(pack.category), `${pack.name} references invalid category ${pack.category}.`);
  assert(typeof pack.all === 'function', `${pack.name} must expose all().`);
  const expectedPack = expectedPackById.get(pack.id);
  assert(expectedPack, `Unexpected built-in pack id: ${pack.id}.`);
  assert(pack.name === expectedPack.name, `${pack.id} was renamed from "${expectedPack.name}" to "${pack.name}".`);
  assert(pack.category === expectedPack.category,
    `${pack.name} moved from ${expectedPack.category} to ${pack.category}.`);
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
    assert(typeof card.q === 'string', `${pack.name} card ${index + 1} question must be a string.`);
    assert(typeof card.a === 'string', `${pack.name} card ${index + 1} answer must be a string.`);
    assert(card && normalize(card.q), `${pack.name} card ${index + 1} has an empty question.`);
    assert(normalize(card.a), `${pack.name} card ${index + 1} has an empty answer.`);
    const question = normalize(card.q);
    const answer = normalize(card.a);
    const key = `${question}\u0000${answer}`;
    assert(!pairs.has(key), `${pack.name} has a duplicate Q+A pair at card ${index + 1}.`);
    assert(!questions.has(question), `${pack.name} repeats a normalized question at card ${index + 1}.`);
    assert(question !== answer, `${pack.name} card ${index + 1} repeats the same text as question and answer.`);
    assert(!/key example|which topic (?:fits|matches)/i.test(card.q),
      `${pack.name} card ${index + 1} uses a semantically generic lesson prompt.`);
    assert(splitListItems(card.q).length === 1,
      `${pack.name} card ${index + 1} question is accidentally split into a rendered list.`);
    assert(!/\uFFFD/.test(`${card.q} ${card.a}`),
      `${pack.name} card ${index + 1} contains a replacement character.`);
    assert(!/\b(?:undefined|null)\b/i.test(`${card.q} ${card.a}`),
      `${pack.name} card ${index + 1} contains an unexpanded value.`);
    pairs.add(key);
    questions.add(question);
    answers.add(answer);
  });
  assert(questions.size === cards.length, `${pack.name} needs unique visible questions for Matching Pairs.`);
  assert(answers.size >= 5, `${pack.name} needs at least 5 unique answers for Matching Pairs.`);
}

assert(packIds.size === expectedPacks.length, 'The built-in pack id set changed.');

for (const category of categories) {
  const count = categoryCounts.get(category.id);
  assert(count === (category.id === 'early-learning' ? 8 : 7),
    `${category.name} has ${count} packs; expected ${category.id === 'early-learning' ? 8 : 7}.`);
}

function getCards(id) {
  const pack = packs.find(candidate => candidate.id === id);
  assert(pack, `Missing expected pack ${id}.`);
  return pack.all();
}

console.log(`Validated ${categories.length} categories and ${packs.length} packs.`);
console.log(`Confirmed the original ${ORIGINAL_PACK_IDS.length} packs and the ${addedPackIds.length} packs added in fc374eb.`);
console.log('Every pack has at least 50 nonempty cards, unique normalized questions and Q+A pairs, and valid metadata.');

const clockCards = getCards('telling-time');
const clockEmoji = new Set(
  clockCards.flatMap(card => [...`${card.q} ${card.a}`].filter(char => /\p{Extended_Pictographic}/u.test(char)))
);
assert(clockCards.length >= 50, 'Telling Time with Analog Clocks needs at least 50 cards.');
assert(clockEmoji.size === 24, `Expected all 24 clock emojis; found ${clockEmoji.size}.`);
console.log(`Telling Time uses all ${clockEmoji.size} clock emojis across ${clockCards.length} cards.`);

const structuredLessonIds = [
  'geometry-measurement', 'human-body', 'cells', 'genetics', 'plants',
  'animal-classification', 'ecosystems', 'health-nutrition', 'chemistry-basics',
  'physics-basics', 'earth-science', 'weather-climate', 'scientific-method',
  'parts-speech', 'grammar', 'punctuation', 'roots-prefixes-suffixes',
  'literary-terms', 'continents-landforms', 'world-landmarks', 'early-us-history',
  'modern-us-history', 'ancient-civilizations', 'world-history',
  'inventors-inventions', 'art-music-terms',
];
for (const id of structuredLessonIds) {
  const cards = getCards(id);
  assert(cards.length === 50, `${id} should contain 50 focused lesson cards.`);
  assert(cards.filter(card => normalize(card.q).startsWith('define “')).length === 13,
    `${id} should contain 13 direct definition prompts.`);
  assert(cards.filter(card => normalize(card.q).startsWith('which term is defined as “')).length === 13,
    `${id} should contain 13 definition-to-term prompts.`);
  assert(cards.filter(card => normalize(card.q).startsWith('match each term to its definition:')).length === 11,
    `${id} should contain 11 two-term review prompts.`);
  const practiceCards = cards.filter(card => {
    const question = normalize(card.q);
    return !question.startsWith('define “')
      && !question.startsWith('which term is defined as “')
      && !question.startsWith('match each term to its definition:');
  });
  assert(practiceCards.length === 13 && practiceCards.every(card => card.q.endsWith('?')),
    `${id} should contain 13 deck-specific practice questions.`);
  assert(new Set(cards.map(card => normalize(card.a))).size === cards.length,
    `${id} should use unique visible answers so all 50 cards can be scheduled in Matching Pairs.`);
}
console.log(`Validated explicit practice questions and review cards for ${structuredLessonIds.length} lesson decks.`);

const firstWordCards = getCards('first-words');
assert(firstWordCards.every(card => normalize(card.q).startsWith('what does the sight word “')),
  'First Words must ask about a visible sight word instead of making learners guess from an ambiguous definition.');
assert(!firstWordCards.some(card => normalize(card.q).startsWith('sight word meaning ')),
  'First Words must not use the old definition-to-word prompt.');

const oppositeCards = getCards('opposites');
assert(oppositeCards.some(card => normalize(card.q).includes('“light” in brightness') && normalize(card.a) === 'dark'),
  'Opposites must disambiguate the brightness sense of light.');
assert(oppositeCards.some(card => normalize(card.q).includes('“hard” in texture') && normalize(card.a) === 'soft'),
  'Opposites must disambiguate the texture sense of hard.');
assert(!oppositeCards.some(card => /\b(?:laugh|cry)\b/i.test(`${card.q} ${card.a}`)),
  'Opposites must use a clearer pair than laugh/cry.');

const moneyCards = getCards('money-coins');
assert(moneyCards.length === 60, `Money & Coins should have 60 nonredundant cards; found ${moneyCards.length}.`);
assert(moneyCards.some(card => normalize(card.q).includes('2 pennies') && normalize(card.a) === '2 cents'),
  'Money & Coins must pluralize penny as pennies.');
assert(!moneyCards.some(card => /\bpennys\b/i.test(card.q)), 'Money & Coins contains the malformed plural "pennys".');

const shapeCards = getCards('shapes');
assert(!shapeCards.some(card => /everyday example of/i.test(card.q)),
  'Shapes must use constrained recognition questions instead of open-ended example prompts.');
assert(shapeCards.some(card => card.q.includes('♦') && normalize(card.a).startsWith('diamond')),
  'Shapes must include a constrained diamond recognition card.');
assert(new Set(shapeCards.map(card => normalize(card.a))).size === shapeCards.length,
  'Shapes must use unique visible answers so all 50 cards can be scheduled in Matching Pairs.');

const wordRelationshipCards = getCards('synonyms-antonyms');
assert(
  !wordRelationshipCards.some(card => /which word means|a antonym/i.test(card.q)),
  'Synonyms & Antonyms must avoid ambiguous definition reversal and malformed articles.'
);
assert(
  wordRelationshipCards.some(card => normalize(card.q) === 'what is an antonym for scarce?' && normalize(card.a) === 'plentiful'),
  'Synonyms & Antonyms must ask directly for the antonym of scarce.'
);
assert(
  wordRelationshipCards.some(card => normalize(card.q) === 'what is a synonym for rapid?' && normalize(card.a) === 'quick'),
  'Synonyms & Antonyms must ask directly for the synonym of rapid.'
);
console.log('Synonyms & Antonyms uses direct synonym and antonym recall prompts.');

const confusedCards = getCards('commonly-confused');
assert(confusedCards.filter(card => normalize(card.q).startsWith('fill in the blanks:')).length === 13,
  'Commonly Confused Words must include one cloze exercise per word group.');
assert(confusedCards.some(card => normalize(card.q).includes('school ___ explained the guiding ___')
  && normalize(card.a) === 'principal; principle'),
  'Commonly Confused Words must practice principal and principle in a natural sentence.');
assert(confusedCards.some(card => normalize(card.a).includes('complimented its designer')),
  'Commonly Confused Words must use compliment with a natural object.');
confusedCards.forEach((card, index) => {
  const answerItems = splitListItems(card.a);
  if (index % 4 === 3) {
    assert(answerItems.length >= 2,
      `Commonly Confused Words cloze card ${index + 1} must retain its intentional multi-answer list.`);
  } else {
    assert(answerItems.length === 1,
      `Commonly Confused Words card ${index + 1} contains a prose semicolon interpreted as a list.`);
  }
});

const worldCapitalCards = getCards('world-capitals');
assert(worldCapitalCards.some(card => normalize(card.q) === 'executive capital of south africa?'
  && normalize(card.a) === 'pretoria'),
  'World Capitals must identify Pretoria specifically as South Africa’s executive capital.');
assert(!worldCapitalCards.some(card => normalize(card.q) === 'capital of south africa?'),
  'World Capitals must not imply that South Africa has only one undifferentiated capital.');

const planetCards = getCards('planets');
assert(!planetCards.some(card => /most extreme axial tilt|largest known volcano/i.test(card.q)),
  'Planets & Space must avoid ambiguous superlatives.');
assert(planetCards.some(card => /once classified as the ninth planet/i.test(card.q) && normalize(card.a) === 'pluto'),
  'Planets & Space must distinguish Pluto from other Kuiper Belt dwarf planets.');
assert(planetCards.some(card => /axial tilt of about 98 degrees/i.test(card.q) && normalize(card.a) === 'uranus'),
  'Planets & Space must describe Uranus’s sideways rotation precisely.');
assert(planetCards.some(card => /largest volcano in the solar system/i.test(card.q) && normalize(card.a) === 'mars'),
  'Planets & Space must scope the Olympus Mons superlative to the Solar System.');

const animalCards = getCards('animals');
assert(animalCards.some(card => normalize(card.q) === 'arctic tern'
  && normalize(card.a).includes('one of the longest annual migrations')),
  'Animals must avoid an unsupported absolute migration superlative.');

const portugueseCards = getCards('portuguese');
assert(portugueseCards.some(card => normalize(card.q) === 'portuguese: thank you'
  && /obrigado.*obrigada/i.test(card.a)),
  'Portuguese Vocabulary must represent both common gendered forms of "thank you".');

const japaneseCards = getCards('japanese');
assert(japaneseCards.some(card => normalize(card.q) === 'japanese: hot weather'
  && normalize(card.a).includes('暑い')),
  'Japanese Vocabulary must identify the weather sense of atsui.');
assert(japaneseCards.some(card => normalize(card.q) === 'japanese: cold weather'
  && normalize(card.a).includes('寒い')),
  'Japanese Vocabulary must identify the weather sense of samui.');

const mandarinCards = getCards('mandarin');
assert(mandarinCards.some(card => normalize(card.q) === 'mandarin: yes / that is correct'
  && normalize(card.a).includes('是的')),
  'Mandarin Vocabulary must qualify the context-dependent affirmative.');
assert(mandarinCards.some(card => normalize(card.q) === 'mandarin: no / not'
  && normalize(card.a).includes('used to negate a verb')),
  'Mandarin Vocabulary must explain that bù is a negator rather than a universal standalone "no".');
assert(mandarinCards.filter(card => /mandarin: (?:yes|no)/i.test(card.q))
  .every(card => splitListItems(card.a).length === 1),
  'Mandarin explanations must escape prose semicolons so they remain single answers.');

console.log('Validated targeted semantic regressions for prompts, facts, grammar, escaping, and language context.');
