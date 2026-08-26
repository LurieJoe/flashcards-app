'use strict';
/* Offline deck generators. Builds flashcards from bundled data — fully on-device. */

(function () {
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- Raw data ---------- */
  const ANIMALS = [
    ['Blue whale', 'The largest animal that has ever lived'],
    ['Cheetah', 'The fastest land animal'],
    ['Peregrine falcon', 'The fastest bird (in a dive)'],
    ['Giraffe', 'The tallest land animal'],
    ['African elephant', 'The largest land animal'],
    ['Hummingbird', 'The only bird that can fly backwards'],
    ['Kangaroo', 'A marsupial that carries its young in a pouch'],
    ['Octopus', 'An animal with three hearts and blue blood'],
    ['Koala', 'A marsupial that eats eucalyptus leaves'],
    ['Emperor penguin', 'The largest species of penguin'],
    ['Ostrich', 'The largest living bird (it cannot fly)'],
    ['Bat', 'The only mammal capable of true flight'],
    ['Dolphin', 'A highly intelligent marine mammal'],
    ['Chameleon', 'A lizard that can change color'],
    ['Sloth', 'The slowest-moving mammal'],
    ['Honey bee', 'An insect that makes honey and pollinates plants'],
    ['Monarch butterfly', 'Known for its long annual migration'],
    ['Komodo dragon', 'The largest living lizard'],
    ['Polar bear', 'The largest land carnivore'],
    ['Platypus', 'An egg-laying mammal (a monotreme)'],
    ['Arctic tern', 'Migrates farther than any other animal'],
    ['Tiger', 'The largest wild cat'],
    ['Gorilla', 'The largest living primate'],
    ['Crocodile', 'A large reptile with an extremely strong bite'],
    ['Seahorse', 'A fish in which the males carry the young'],
    ['Owl', 'A nocturnal bird of prey'],
    ['Frog', 'An amphibian that begins life as a tadpole'],
    ['Snail', 'A mollusk that carries a spiral shell'],
    ['Great white shark', 'A large predatory fish'],
    ['Hedgehog', 'A small mammal covered in protective spines'],
  ];

  const WORLD_CAPITALS = [
    ['France', 'Paris'], ['Japan', 'Tokyo'], ['Canada', 'Ottawa'], ['Australia', 'Canberra'],
    ['Brazil', 'Brasília'], ['Germany', 'Berlin'], ['Italy', 'Rome'], ['Spain', 'Madrid'],
    ['Portugal', 'Lisbon'], ['Russia', 'Moscow'], ['China', 'Beijing'], ['India', 'New Delhi'],
    ['Egypt', 'Cairo'], ['Mexico', 'Mexico City'], ['Argentina', 'Buenos Aires'], ['Greece', 'Athens'],
    ['Turkey', 'Ankara'], ['Netherlands', 'Amsterdam'], ['Belgium', 'Brussels'], ['Sweden', 'Stockholm'],
    ['Norway', 'Oslo'], ['Denmark', 'Copenhagen'], ['Finland', 'Helsinki'], ['Poland', 'Warsaw'],
    ['Austria', 'Vienna'], ['Switzerland', 'Bern'], ['Ireland', 'Dublin'], ['South Korea', 'Seoul'],
    ['North Korea', 'Pyongyang'], ['Thailand', 'Bangkok'], ['Vietnam', 'Hanoi'], ['Indonesia', 'Jakarta'],
    ['Philippines', 'Manila'], ['Malaysia', 'Kuala Lumpur'], ['Saudi Arabia', 'Riyadh'], ['Iran', 'Tehran'],
    ['Iraq', 'Baghdad'], ['South Africa', 'Pretoria'], ['Kenya', 'Nairobi'], ['Nigeria', 'Abuja'],
    ['Morocco', 'Rabat'], ['Chile', 'Santiago'], ['Peru', 'Lima'], ['Colombia', 'Bogotá'],
    ['Cuba', 'Havana'], ['New Zealand', 'Wellington'], ['United Kingdom', 'London'],
    ['United States', 'Washington, D.C.'], ['Ukraine', 'Kyiv'], ['Czech Republic', 'Prague'],
    ['Hungary', 'Budapest'], ['Iceland', 'Reykjavík'], ['Cambodia', 'Phnom Penh'], ['Pakistan', 'Islamabad'],
    ['Bangladesh', 'Dhaka'], ['Ethiopia', 'Addis Ababa'], ['Ghana', 'Accra'], ['Kazakhstan', 'Astana'],
  ];

  const US_CAPITALS = [
    ['Alabama', 'Montgomery'], ['Alaska', 'Juneau'], ['Arizona', 'Phoenix'], ['Arkansas', 'Little Rock'],
    ['California', 'Sacramento'], ['Colorado', 'Denver'], ['Connecticut', 'Hartford'], ['Delaware', 'Dover'],
    ['Florida', 'Tallahassee'], ['Georgia', 'Atlanta'], ['Hawaii', 'Honolulu'], ['Idaho', 'Boise'],
    ['Illinois', 'Springfield'], ['Indiana', 'Indianapolis'], ['Iowa', 'Des Moines'], ['Kansas', 'Topeka'],
    ['Kentucky', 'Frankfort'], ['Louisiana', 'Baton Rouge'], ['Maine', 'Augusta'], ['Maryland', 'Annapolis'],
    ['Massachusetts', 'Boston'], ['Michigan', 'Lansing'], ['Minnesota', 'Saint Paul'], ['Mississippi', 'Jackson'],
    ['Missouri', 'Jefferson City'], ['Montana', 'Helena'], ['Nebraska', 'Lincoln'], ['Nevada', 'Carson City'],
    ['New Hampshire', 'Concord'], ['New Jersey', 'Trenton'], ['New Mexico', 'Santa Fe'], ['New York', 'Albany'],
    ['North Carolina', 'Raleigh'], ['North Dakota', 'Bismarck'], ['Ohio', 'Columbus'], ['Oklahoma', 'Oklahoma City'],
    ['Oregon', 'Salem'], ['Pennsylvania', 'Harrisburg'], ['Rhode Island', 'Providence'], ['South Carolina', 'Columbia'],
    ['South Dakota', 'Pierre'], ['Tennessee', 'Nashville'], ['Texas', 'Austin'], ['Utah', 'Salt Lake City'],
    ['Vermont', 'Montpelier'], ['Virginia', 'Richmond'], ['Washington', 'Olympia'], ['West Virginia', 'Charleston'],
    ['Wisconsin', 'Madison'], ['Wyoming', 'Cheyenne'],
  ];

  const PRESIDENTS = [
    [1, 'George Washington', '1789–1797'], [2, 'John Adams', '1797–1801'], [3, 'Thomas Jefferson', '1801–1809'],
    [4, 'James Madison', '1809–1817'], [5, 'James Monroe', '1817–1825'], [6, 'John Quincy Adams', '1825–1829'],
    [7, 'Andrew Jackson', '1829–1837'], [8, 'Martin Van Buren', '1837–1841'], [9, 'William Henry Harrison', '1841'],
    [10, 'John Tyler', '1841–1845'], [11, 'James K. Polk', '1845–1849'], [12, 'Zachary Taylor', '1849–1850'],
    [13, 'Millard Fillmore', '1850–1853'], [14, 'Franklin Pierce', '1853–1857'], [15, 'James Buchanan', '1857–1861'],
    [16, 'Abraham Lincoln', '1861–1865'], [17, 'Andrew Johnson', '1865–1869'], [18, 'Ulysses S. Grant', '1869–1877'],
    [19, 'Rutherford B. Hayes', '1877–1881'], [20, 'James A. Garfield', '1881'], [21, 'Chester A. Arthur', '1881–1885'],
    [22, 'Grover Cleveland', '1885–1889'], [23, 'Benjamin Harrison', '1889–1893'], [24, 'Grover Cleveland', '1893–1897'],
    [25, 'William McKinley', '1897–1901'], [26, 'Theodore Roosevelt', '1901–1909'], [27, 'William Howard Taft', '1909–1913'],
    [28, 'Woodrow Wilson', '1913–1921'], [29, 'Warren G. Harding', '1921–1923'], [30, 'Calvin Coolidge', '1923–1929'],
    [31, 'Herbert Hoover', '1929–1933'], [32, 'Franklin D. Roosevelt', '1933–1945'], [33, 'Harry S. Truman', '1945–1953'],
    [34, 'Dwight D. Eisenhower', '1953–1961'], [35, 'John F. Kennedy', '1961–1963'], [36, 'Lyndon B. Johnson', '1963–1969'],
    [37, 'Richard Nixon', '1969–1974'], [38, 'Gerald Ford', '1974–1977'], [39, 'Jimmy Carter', '1977–1981'],
    [40, 'Ronald Reagan', '1981–1989'], [41, 'George H. W. Bush', '1989–1993'], [42, 'Bill Clinton', '1993–2001'],
    [43, 'George W. Bush', '2001–2009'], [44, 'Barack Obama', '2009–2017'], [45, 'Donald Trump', '2017–2021'],
    [46, 'Joe Biden', '2021–2025'], [47, 'Donald Trump', '2025–present'],
  ];

  const ELEMENTS = [
    ['Hydrogen', 'H', 1], ['Helium', 'He', 2], ['Lithium', 'Li', 3], ['Beryllium', 'Be', 4], ['Boron', 'B', 5],
    ['Carbon', 'C', 6], ['Nitrogen', 'N', 7], ['Oxygen', 'O', 8], ['Fluorine', 'F', 9], ['Neon', 'Ne', 10],
    ['Sodium', 'Na', 11], ['Magnesium', 'Mg', 12], ['Aluminium', 'Al', 13], ['Silicon', 'Si', 14], ['Phosphorus', 'P', 15],
    ['Sulfur', 'S', 16], ['Chlorine', 'Cl', 17], ['Argon', 'Ar', 18], ['Potassium', 'K', 19], ['Calcium', 'Ca', 20],
    ['Titanium', 'Ti', 22], ['Chromium', 'Cr', 24], ['Manganese', 'Mn', 25], ['Iron', 'Fe', 26], ['Cobalt', 'Co', 27],
    ['Nickel', 'Ni', 28], ['Copper', 'Cu', 29], ['Zinc', 'Zn', 30], ['Bromine', 'Br', 35], ['Krypton', 'Kr', 36],
    ['Silver', 'Ag', 47], ['Tin', 'Sn', 50], ['Iodine', 'I', 53], ['Xenon', 'Xe', 54], ['Barium', 'Ba', 56],
    ['Tungsten', 'W', 74], ['Platinum', 'Pt', 78], ['Gold', 'Au', 79], ['Mercury', 'Hg', 80], ['Lead', 'Pb', 82],
    ['Uranium', 'U', 92],
  ];

  const SPANISH = [
    ['one', 'uno'], ['two', 'dos'], ['three', 'tres'], ['four', 'cuatro'], ['five', 'cinco'], ['six', 'seis'],
    ['seven', 'siete'], ['eight', 'ocho'], ['nine', 'nueve'], ['ten', 'diez'], ['dog', 'perro'], ['cat', 'gato'],
    ['house', 'casa'], ['water', 'agua'], ['food', 'comida'], ['friend', 'amigo'], ['love', 'amor'], ['day', 'día'],
    ['night', 'noche'], ['sun', 'sol'], ['moon', 'luna'], ['red', 'rojo'], ['blue', 'azul'], ['green', 'verde'],
    ['yellow', 'amarillo'], ['black', 'negro'], ['white', 'blanco'], ['man', 'hombre'], ['woman', 'mujer'],
    ['boy', 'niño'], ['girl', 'niña'], ['book', 'libro'], ['school', 'escuela'], ['car', 'coche'], ['city', 'ciudad'],
    ['country', 'país'], ['hello', 'hola'], ['goodbye', 'adiós'], ['please', 'por favor'], ['thank you', 'gracias'],
    ['yes', 'sí'], ['no', 'no'], ['big', 'grande'], ['small', 'pequeño'], ['hot', 'caliente'], ['cold', 'frío'],
    ['happy', 'feliz'], ['sad', 'triste'], ['today', 'hoy'], ['tomorrow', 'mañana'],
  ];

  const FRENCH = [
    ['one', 'un'], ['two', 'deux'], ['three', 'trois'], ['four', 'quatre'], ['five', 'cinq'], ['six', 'six'],
    ['seven', 'sept'], ['eight', 'huit'], ['nine', 'neuf'], ['ten', 'dix'], ['dog', 'chien'], ['cat', 'chat'],
    ['house', 'maison'], ['water', 'eau'], ['food', 'nourriture'], ['friend', 'ami'], ['love', 'amour'], ['day', 'jour'],
    ['night', 'nuit'], ['sun', 'soleil'], ['moon', 'lune'], ['red', 'rouge'], ['blue', 'bleu'], ['green', 'vert'],
    ['yellow', 'jaune'], ['black', 'noir'], ['white', 'blanc'], ['man', 'homme'], ['woman', 'femme'],
    ['boy', 'garçon'], ['girl', 'fille'], ['book', 'livre'], ['school', 'école'], ['car', 'voiture'], ['city', 'ville'],
    ['country', 'pays'], ['hello', 'bonjour'], ['goodbye', 'au revoir'], ['please', 's’il vous plaît'], ['thank you', 'merci'],
    ['yes', 'oui'], ['no', 'non'], ['big', 'grand'], ['small', 'petit'], ['hot', 'chaud'], ['cold', 'froid'],
    ['happy', 'heureux'], ['sad', 'triste'], ['today', 'aujourd’hui'], ['tomorrow', 'demain'],
  ];

  const PORTUGUESE = [
    ['one', 'um'], ['two', 'dois'], ['three', 'três'], ['four', 'quatro'], ['five', 'cinco'], ['six', 'seis'],
    ['seven', 'sete'], ['eight', 'oito'], ['nine', 'nove'], ['ten', 'dez'], ['dog', 'cão'], ['cat', 'gato'],
    ['house', 'casa'], ['water', 'água'], ['food', 'comida'], ['friend', 'amigo'], ['love', 'amor'], ['day', 'dia'],
    ['night', 'noite'], ['sun', 'sol'], ['moon', 'lua'], ['red', 'vermelho'], ['blue', 'azul'], ['green', 'verde'],
    ['yellow', 'amarelo'], ['black', 'preto'], ['white', 'branco'], ['man', 'homem'], ['woman', 'mulher'],
    ['boy', 'menino'], ['girl', 'menina'], ['book', 'livro'], ['school', 'escola'], ['car', 'carro'], ['city', 'cidade'],
    ['country', 'país'], ['hello', 'olá'], ['goodbye', 'adeus'], ['please', 'por favor'], ['thank you', 'obrigado'],
    ['yes', 'sim'], ['no', 'não'], ['big', 'grande'], ['small', 'pequeno'], ['hot', 'quente'], ['cold', 'frio'],
    ['happy', 'feliz'], ['sad', 'triste'], ['today', 'hoje'], ['tomorrow', 'amanhã'],
  ];

  const PLANETS = [
    ['Which planet is closest to the Sun?', 'Mercury'],
    ['Which planet is the hottest?', 'Venus'],
    ['Which is the only planet known to support life?', 'Earth'],
    ['Which planet is known as the "Red Planet"?', 'Mars'],
    ['Which is the largest planet in the Solar System?', 'Jupiter'],
    ['Which planet is famous for its prominent rings?', 'Saturn'],
    ['Which ice giant rotates on its side?', 'Uranus'],
    ['Which is the farthest planet from the Sun?', 'Neptune'],
    ['Which dwarf planet lies in the Kuiper Belt?', 'Pluto'],
    ['What is the star at the center of our Solar System?', 'The Sun'],
    ['What is Earth’s only natural satellite?', 'The Moon'],
    ['How many planets are in the Solar System?', 'Eight'],
    ['What galaxy do we live in?', 'The Milky Way'],
    ['What is the largest moon of Jupiter?', 'Ganymede'],
    ['The Sun is mostly made of which two elements?', 'Hydrogen and helium'],
    ['What is a light-year?', 'The distance light travels in one year'],
    ['Where is the asteroid belt located?', 'Between Mars and Jupiter'],
    ['What is a comet?', 'An icy body that forms a tail near the Sun'],
    ['What is a black hole?', 'A region where gravity prevents even light from escaping'],
    ['Who was the first person to walk on the Moon?', 'Neil Armstrong (1969)'],
    ['What force keeps planets orbiting the Sun?', 'Gravity'],
    ['Saturn’s rings are made mostly of what?', 'Ice and rock'],
    ['What is the closest star to Earth?', 'The Sun'],
    ['What instrument is used to observe distant objects in space?', 'A telescope'],
  ];

  const CIVICS = [
    ['What is the supreme law of the land?', 'The Constitution'],
    ['What do we call the first ten amendments to the Constitution?', 'The Bill of Rights'],
    ['How many U.S. senators are there?', 'One hundred (100)'],
    ['How many voting members are in the House of Representatives?', '435'],
    ['We elect a U.S. senator for how many years?', 'Six (6)'],
    ['We elect a U.S. representative for how many years?', 'Two (2)'],
    ['How many years is a presidential term?', 'Four (4)'],
    ['What are the three branches of government?', 'Legislative, executive, and judicial'],
    ['Who is in charge of the executive branch?', 'The President'],
    ['Who makes federal laws?', 'Congress'],
    ['What are the two parts of the U.S. Congress?', 'The Senate and the House of Representatives'],
    ['Who is the Commander in Chief of the military?', 'The President'],
    ['Who signs bills to become laws?', 'The President'],
    ['Who vetoes bills?', 'The President'],
    ['What does the judicial branch do?', 'Reviews and explains laws'],
    ['What is the highest court in the United States?', 'The Supreme Court'],
    ['How many justices are on the Supreme Court?', 'Nine (9)'],
    ['What is the "rule of law"?', 'Everyone must follow the law'],
    ['What stops one branch of government from becoming too powerful?', 'Checks and balances'],
    ['What is the capital of the United States?', 'Washington, D.C.'],
    ['Where is the Statue of Liberty?', 'New York (Harbor)'],
    ['Why does the flag have 13 stripes?', 'They represent the original 13 colonies'],
    ['Why does the flag have 50 stars?', 'There is one star for each state'],
    ['What is the name of the national anthem?', 'The Star-Spangled Banner'],
    ['When do we celebrate Independence Day?', 'July 4th'],
    ['Who was the first President?', 'George Washington'],
    ['Who is called the "Father of Our Country"?', 'George Washington'],
    ['Who wrote the Declaration of Independence?', 'Thomas Jefferson'],
    ['When was the Declaration of Independence adopted?', 'July 4, 1776'],
    ['What is one right in the First Amendment?', 'Freedom of speech (also religion, press, assembly, petition)'],
  ];

  const COLORS = [
    ['Red', '#ef4444'], ['Orange', '#f97316'], ['Yellow', '#eab308'],
    ['Green', '#22c55e'], ['Blue', '#3b82f6'], ['Indigo', '#4f46e5'],
    ['Purple', '#8b5cf6'], ['Pink', '#ec4899'], ['Magenta', '#d946ef'],
    ['Cyan', '#06b6d4'], ['Teal', '#14b8a6'], ['Lime', '#84cc16'],
    ['Brown', '#92400e'], ['Maroon', '#7f1d1d'], ['Navy', '#1e3a8a'],
    ['Gold', '#d4af37'], ['Silver', '#c0c0c0'], ['Gray', '#6b7280'],
    ['Black', '#111111'], ['White', '#f8fafc'],
  ];

  const SHAPES = [
    ['circle', 'Circle'], ['square', 'Square'], ['rectangle', 'Rectangle'],
    ['oval', 'Oval'], ['triangle', 'Triangle'], ['diamond', 'Diamond'],
    ['pentagon', 'Pentagon'], ['hexagon', 'Hexagon'], ['star', 'Star'],
    ['heart', 'Heart'],
  ];

  /* ---------- Card builders ---------- */
  const pairQA = (data) => data.map(([q, a]) => ({ q, a }));
  const capitalQA = (data) => data.map(([country, cap]) => ({ q: `Capital of ${country}?`, a: cap }));
  const presidentQA = (data) => data.map(([n, name, yrs]) => ({ q: `Who was U.S. President #${n}?`, a: `${name} (${yrs})` }));
  const elementQA = (data) => data.map(([name, sym, z]) => ({ q: `Chemical symbol for ${name}?`, a: `${sym} (atomic number ${z})` }));
  const langQA = (lang, data) => data.map(([en, tr]) => ({ q: `${lang}: ${en}`, a: tr }));
  const colorQA = (data) => data.map(([name, hex]) => ({ q: `{{shape:square|${hex}|130}}`, a: `**${name}**\n${hex}` }));
  const shapeQA = (data) => data.map(([kind, name]) => ({ q: `{{shape:${kind}|#4f46e5|130}}`, a: name }));

  function multiplicationCards() {
    const out = [];
    for (let a = 2; a <= 12; a++) for (let b = 2; b <= 12; b++) out.push({ q: `${a} × ${b}`, a: String(a * b) });
    return out;
  }

  /* ---------- Packs ---------- */
  const PACKS = [
    { id: 'animals', name: 'Animals', keywords: ['animals', 'animal', 'wildlife', 'creatures'], all: () => pairQA(ANIMALS) },
    { id: 'us-capitals', name: 'US State Capitals', keywords: ['us state capitals', 'state capitals', 'us capitals', 'state capital', 'states'], all: () => capitalQA(US_CAPITALS) },
    { id: 'world-capitals', name: 'World Capitals', keywords: ['world capitals', 'capitals', 'capital', 'countries', 'country capitals'], all: () => capitalQA(WORLD_CAPITALS) },
    { id: 'us-presidents', name: 'US Presidents', keywords: ['us presidents', 'presidents', 'president', 'potus'], all: () => presidentQA(PRESIDENTS) },
    { id: 'multiplication', name: 'Multiplication Tables', keywords: ['multiplication', 'times tables', 'times table', 'multiply', 'math', 'maths'], all: multiplicationCards },
    { id: 'elements', name: 'Chemical Elements', keywords: ['elements', 'chemical elements', 'periodic table', 'chemistry'], all: () => elementQA(ELEMENTS) },
    { id: 'spanish', name: 'Spanish Vocabulary', keywords: ['spanish', 'español', 'espanol'], all: () => langQA('Spanish', SPANISH) },
    { id: 'french', name: 'French Vocabulary', keywords: ['french', 'français', 'francais'], all: () => langQA('French', FRENCH) },
    { id: 'portuguese', name: 'Portuguese Vocabulary', keywords: ['portuguese', 'português', 'portugues'], all: () => langQA('Portuguese', PORTUGUESE) },
    { id: 'planets', name: 'Planets & Space', keywords: ['planets', 'planet', 'space', 'solar system', 'astronomy'], all: () => pairQA(PLANETS) },
    { id: 'us-civics', name: 'US Civics Basics', keywords: ['us civics', 'civics', 'citizenship', 'government'], all: () => pairQA(CIVICS) },
    { id: 'colors', name: 'Colors', keywords: ['colors', 'colours', 'color', 'colour'], all: () => colorQA(COLORS) },
    { id: 'shapes', name: 'Shapes', keywords: ['shapes', 'shape', 'geometry'], all: () => shapeQA(SHAPES) },
  ];

  // Attach a cardsFor(n) helper to each pack (n<=0 means "all").
  PACKS.forEach(p => {
    p.cardsFor = (n) => {
      const deck = shuffle(p.all());
      return (n && n > 0) ? deck.slice(0, n) : deck;
    };
  });

  function normalize(s) { return (s || '').toLowerCase().trim().replace(/\s+/g, ' '); }

  // Match a free-text topic to the best pack (or null).
  function matchTopic(topic) {
    const t = normalize(topic);
    if (!t) return null;
    let best = null, bestScore = 0;
    for (const p of PACKS) {
      let score = 0;
      for (const kw of p.keywords) {
        const k = normalize(kw);
        if (t === k) score = Math.max(score, 3);
        else if (t.includes(k)) score = Math.max(score, 2);
        else if (k.includes(t) && t.length >= 3) score = Math.max(score, 1);
      }
      if (score > bestScore) { bestScore = score; best = p; } // ties keep earlier (more specific) pack
    }
    return best;
  }

  window.TOPIC_PACKS = PACKS;
  window.matchTopic = matchTopic;
})();
