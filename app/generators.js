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
    ['Red panda', 'A tree-dwelling mammal native to the Himalayas and nearby mountains'],
    ['Sea turtle', 'A marine reptile that returns to land to lay eggs'],
    ['Axolotl', 'An amphibian that keeps many larval features as an adult'],
    ['Rhinoceros', 'A large herbivore with one or two horns on its snout'],
    ['Meerkat', 'A social mongoose that often stands upright to watch for danger'],
    ['Orangutan', 'A great ape native to the rainforests of Borneo and Sumatra'],
    ['Narwhal', 'An Arctic whale whose males often have a long spiral tusk'],
    ['Albatross', 'A seabird known for long-distance gliding'],
    ['Beaver', 'A rodent that builds dams and lodges'],
    ['Capybara', 'The largest living rodent'],
    ['Clownfish', 'A reef fish that can live among sea anemone tentacles'],
    ['Echidna', 'A spiny, egg-laying mammal'],
    ['Flamingo', 'A wading bird whose pink color comes from pigments in its food'],
    ['Gecko', 'A lizard known for climbing smooth surfaces'],
    ['Jellyfish', 'A soft-bodied aquatic animal with stinging tentacles'],
    ['Lemur', 'A primate native mainly to Madagascar'],
    ['Manatee', 'A slow-moving aquatic mammal that eats plants'],
    ['Peacock', 'A male peafowl known for its colorful train of feathers'],
    ['Raccoon', 'A nocturnal mammal with a dark mask-like face pattern'],
    ['Walrus', 'A large Arctic marine mammal with tusks'],
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

  const WORLD_FLAGS = [
    ['AF', 'Afghanistan'], ['AL', 'Albania'], ['DZ', 'Algeria'], ['AD', 'Andorra'],
    ['AO', 'Angola'], ['AG', 'Antigua and Barbuda'], ['AR', 'Argentina'], ['AM', 'Armenia'],
    ['AU', 'Australia'], ['AT', 'Austria'], ['AZ', 'Azerbaijan'], ['BS', 'Bahamas'],
    ['BH', 'Bahrain'], ['BD', 'Bangladesh'], ['BB', 'Barbados'], ['BY', 'Belarus'],
    ['BE', 'Belgium'], ['BZ', 'Belize'], ['BJ', 'Benin'], ['BT', 'Bhutan'],
    ['BO', 'Bolivia'], ['BA', 'Bosnia and Herzegovina'], ['BW', 'Botswana'], ['BR', 'Brazil'],
    ['BN', 'Brunei'], ['BG', 'Bulgaria'], ['BF', 'Burkina Faso'], ['BI', 'Burundi'],
    ['CV', 'Cabo Verde'], ['KH', 'Cambodia'], ['CM', 'Cameroon'], ['CA', 'Canada'],
    ['CF', 'Central African Republic'], ['TD', 'Chad'], ['CL', 'Chile'], ['CN', 'China'],
    ['CO', 'Colombia'], ['KM', 'Comoros'], ['CG', 'Republic of the Congo'],
    ['CD', 'Democratic Republic of the Congo'], ['CR', 'Costa Rica'], ['CI', 'Côte d’Ivoire'],
    ['HR', 'Croatia'], ['CU', 'Cuba'], ['CY', 'Cyprus'], ['CZ', 'Czechia'],
    ['DK', 'Denmark'], ['DJ', 'Djibouti'], ['DM', 'Dominica'], ['DO', 'Dominican Republic'],
    ['EC', 'Ecuador'], ['EG', 'Egypt'], ['SV', 'El Salvador'], ['GQ', 'Equatorial Guinea'],
    ['ER', 'Eritrea'], ['EE', 'Estonia'], ['SZ', 'Eswatini'], ['ET', 'Ethiopia'],
    ['FJ', 'Fiji'], ['FI', 'Finland'], ['FR', 'France'], ['GA', 'Gabon'],
    ['GM', 'Gambia'], ['GE', 'Georgia'], ['DE', 'Germany'], ['GH', 'Ghana'],
    ['GR', 'Greece'], ['GD', 'Grenada'], ['GT', 'Guatemala'], ['GN', 'Guinea'],
    ['GW', 'Guinea-Bissau'], ['GY', 'Guyana'], ['HT', 'Haiti'], ['HN', 'Honduras'],
    ['HU', 'Hungary'], ['IS', 'Iceland'], ['IN', 'India'], ['ID', 'Indonesia'],
    ['IR', 'Iran'], ['IQ', 'Iraq'], ['IE', 'Ireland'], ['IL', 'Israel'],
    ['IT', 'Italy'], ['JM', 'Jamaica'], ['JP', 'Japan'], ['JO', 'Jordan'],
    ['KZ', 'Kazakhstan'], ['KE', 'Kenya'], ['KI', 'Kiribati'], ['KW', 'Kuwait'],
    ['KG', 'Kyrgyzstan'], ['LA', 'Laos'], ['LV', 'Latvia'], ['LB', 'Lebanon'],
    ['LS', 'Lesotho'], ['LR', 'Liberia'], ['LY', 'Libya'], ['LI', 'Liechtenstein'],
    ['LT', 'Lithuania'], ['LU', 'Luxembourg'], ['MG', 'Madagascar'], ['MW', 'Malawi'],
    ['MY', 'Malaysia'], ['MV', 'Maldives'], ['ML', 'Mali'], ['MT', 'Malta'],
    ['MH', 'Marshall Islands'], ['MR', 'Mauritania'], ['MU', 'Mauritius'], ['MX', 'Mexico'],
    ['FM', 'Micronesia'], ['MD', 'Moldova'], ['MC', 'Monaco'], ['MN', 'Mongolia'],
    ['ME', 'Montenegro'], ['MA', 'Morocco'], ['MZ', 'Mozambique'], ['MM', 'Myanmar'],
    ['NA', 'Namibia'], ['NR', 'Nauru'], ['NP', 'Nepal'], ['NL', 'Netherlands'],
    ['NZ', 'New Zealand'], ['NI', 'Nicaragua'], ['NE', 'Niger'], ['NG', 'Nigeria'],
    ['KP', 'North Korea'], ['MK', 'North Macedonia'], ['NO', 'Norway'], ['OM', 'Oman'],
    ['PK', 'Pakistan'], ['PW', 'Palau'], ['PS', 'Palestine'], ['PA', 'Panama'],
    ['PG', 'Papua New Guinea'], ['PY', 'Paraguay'], ['PE', 'Peru'], ['PH', 'Philippines'],
    ['PL', 'Poland'], ['PT', 'Portugal'], ['QA', 'Qatar'], ['RO', 'Romania'],
    ['RU', 'Russia'], ['RW', 'Rwanda'], ['KN', 'Saint Kitts and Nevis'], ['LC', 'Saint Lucia'],
    ['VC', 'Saint Vincent and the Grenadines'], ['WS', 'Samoa'], ['SM', 'San Marino'],
    ['ST', 'São Tomé and Príncipe'], ['SA', 'Saudi Arabia'], ['SN', 'Senegal'],
    ['RS', 'Serbia'], ['SC', 'Seychelles'], ['SL', 'Sierra Leone'], ['SG', 'Singapore'],
    ['SK', 'Slovakia'], ['SI', 'Slovenia'], ['SB', 'Solomon Islands'], ['SO', 'Somalia'],
    ['ZA', 'South Africa'], ['KR', 'South Korea'], ['SS', 'South Sudan'], ['ES', 'Spain'],
    ['LK', 'Sri Lanka'], ['SD', 'Sudan'], ['SR', 'Suriname'], ['SE', 'Sweden'],
    ['CH', 'Switzerland'], ['SY', 'Syria'], ['TJ', 'Tajikistan'], ['TZ', 'Tanzania'],
    ['TH', 'Thailand'], ['TL', 'Timor-Leste'], ['TG', 'Togo'], ['TO', 'Tonga'],
    ['TT', 'Trinidad and Tobago'], ['TN', 'Tunisia'], ['TR', 'Türkiye'], ['TM', 'Turkmenistan'],
    ['TV', 'Tuvalu'], ['UG', 'Uganda'], ['UA', 'Ukraine'], ['AE', 'United Arab Emirates'],
    ['GB', 'United Kingdom'], ['US', 'United States'], ['UY', 'Uruguay'], ['UZ', 'Uzbekistan'],
    ['VU', 'Vanuatu'], ['VA', 'Vatican City'], ['VE', 'Venezuela'], ['VN', 'Vietnam'],
    ['YE', 'Yemen'], ['ZM', 'Zambia'], ['ZW', 'Zimbabwe'],
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
    ['Scandium', 'Sc', 21], ['Titanium', 'Ti', 22], ['Vanadium', 'V', 23], ['Chromium', 'Cr', 24], ['Manganese', 'Mn', 25],
    ['Iron', 'Fe', 26], ['Cobalt', 'Co', 27], ['Nickel', 'Ni', 28], ['Copper', 'Cu', 29], ['Zinc', 'Zn', 30],
    ['Gallium', 'Ga', 31], ['Germanium', 'Ge', 32], ['Arsenic', 'As', 33], ['Selenium', 'Se', 34], ['Bromine', 'Br', 35],
    ['Krypton', 'Kr', 36], ['Rubidium', 'Rb', 37], ['Strontium', 'Sr', 38], ['Yttrium', 'Y', 39], ['Zirconium', 'Zr', 40],
    ['Niobium', 'Nb', 41], ['Molybdenum', 'Mo', 42], ['Technetium', 'Tc', 43], ['Ruthenium', 'Ru', 44], ['Rhodium', 'Rh', 45],
    ['Palladium', 'Pd', 46], ['Silver', 'Ag', 47], ['Cadmium', 'Cd', 48], ['Indium', 'In', 49], ['Tin', 'Sn', 50],
    ['Antimony', 'Sb', 51], ['Tellurium', 'Te', 52], ['Iodine', 'I', 53], ['Xenon', 'Xe', 54], ['Cesium', 'Cs', 55],
    ['Barium', 'Ba', 56], ['Lanthanum', 'La', 57], ['Cerium', 'Ce', 58], ['Praseodymium', 'Pr', 59], ['Neodymium', 'Nd', 60],
    ['Promethium', 'Pm', 61], ['Samarium', 'Sm', 62], ['Europium', 'Eu', 63], ['Gadolinium', 'Gd', 64], ['Terbium', 'Tb', 65],
    ['Dysprosium', 'Dy', 66], ['Holmium', 'Ho', 67], ['Erbium', 'Er', 68], ['Thulium', 'Tm', 69], ['Ytterbium', 'Yb', 70],
    ['Lutetium', 'Lu', 71], ['Hafnium', 'Hf', 72], ['Tantalum', 'Ta', 73], ['Tungsten', 'W', 74], ['Rhenium', 'Re', 75],
    ['Osmium', 'Os', 76], ['Iridium', 'Ir', 77], ['Platinum', 'Pt', 78], ['Gold', 'Au', 79], ['Mercury', 'Hg', 80],
    ['Thallium', 'Tl', 81], ['Lead', 'Pb', 82], ['Bismuth', 'Bi', 83], ['Polonium', 'Po', 84], ['Astatine', 'At', 85],
    ['Radon', 'Rn', 86], ['Francium', 'Fr', 87], ['Radium', 'Ra', 88], ['Actinium', 'Ac', 89], ['Thorium', 'Th', 90],
    ['Protactinium', 'Pa', 91], ['Uranium', 'U', 92], ['Neptunium', 'Np', 93], ['Plutonium', 'Pu', 94], ['Americium', 'Am', 95],
    ['Curium', 'Cm', 96], ['Berkelium', 'Bk', 97], ['Californium', 'Cf', 98], ['Einsteinium', 'Es', 99], ['Fermium', 'Fm', 100],
    ['Mendelevium', 'Md', 101], ['Nobelium', 'No', 102], ['Lawrencium', 'Lr', 103], ['Rutherfordium', 'Rf', 104],
    ['Dubnium', 'Db', 105], ['Seaborgium', 'Sg', 106], ['Bohrium', 'Bh', 107], ['Hassium', 'Hs', 108],
    ['Meitnerium', 'Mt', 109], ['Darmstadtium', 'Ds', 110], ['Roentgenium', 'Rg', 111], ['Copernicium', 'Cn', 112],
    ['Nihonium', 'Nh', 113], ['Flerovium', 'Fl', 114], ['Moscovium', 'Mc', 115], ['Livermorium', 'Lv', 116],
    ['Tennessine', 'Ts', 117], ['Oganesson', 'Og', 118],
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
    ['Which planet has the shortest year?', 'Mercury'],
    ['Which planet has the Great Red Spot?', 'Jupiter'],
    ['Which planet has the largest known volcano, Olympus Mons?', 'Mars'],
    ['Which planet is sometimes called Earth’s twin because of its similar size?', 'Venus'],
    ['What is the name of our galaxy’s central supermassive black hole?', 'Sagittarius A*'],
    ['What causes day and night on Earth?', 'Earth rotating on its axis'],
    ['What causes Earth’s seasons?', 'Earth’s tilted axis as it orbits the Sun'],
    ['About how long does Earth take to orbit the Sun?', 'One year'],
    ['About how long does the Moon take to orbit Earth?', 'About 27 days'],
    ['What is a lunar eclipse?', 'Earth’s shadow falling on the Moon'],
    ['What is a solar eclipse?', 'The Moon blocking some or all of the Sun'],
    ['What is a nebula?', 'A cloud of gas and dust in space'],
    ['What is a galaxy?', 'A vast group of stars, gas, dust, and dark matter'],
    ['What is an asteroid?', 'A rocky body orbiting the Sun'],
    ['What is a meteoroid?', 'A small rocky or metallic body traveling through space'],
    ['What is a meteor?', 'A streak of light from a space rock burning in an atmosphere'],
    ['What is a meteorite?', 'A space rock that reaches the ground'],
    ['What is an exoplanet?', 'A planet orbiting a star beyond the Solar System'],
    ['What is a constellation?', 'A recognized pattern or region of stars in the sky'],
    ['What is the International Space Station?', 'A research laboratory orbiting Earth'],
    ['What was the first artificial satellite?', 'Sputnik 1'],
    ['Who was the first human in space?', 'Yuri Gagarin'],
    ['Which planet has the most extreme axial tilt?', 'Uranus'],
    ['Which two planets are called ice giants?', 'Uranus and Neptune'],
    ['What is the heliosphere?', 'The region influenced by the solar wind'],
    ['What is the photosphere?', 'The visible surface layer of the Sun'],
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
    ['What are the first words of the Constitution?', 'We the People'],
    ['What is an amendment?', 'A change or addition to the Constitution'],
    ['How many amendments does the Constitution have?', 'Twenty-seven (27)'],
    ['What is federalism?', 'Power shared by the national and state governments'],
    ['What is the purpose of the Preamble?', 'It states the Constitution’s goals'],
    ['What is a veto?', 'A rejection of a bill by the President'],
    ['What can Congress do after a presidential veto?', 'Override it with a two-thirds vote in each chamber'],
    ['What is judicial review?', 'The power to decide whether laws follow the Constitution'],
    ['What is due process?', 'Fair legal procedures before government may take life, liberty, or property'],
    ['What is the right to petition?', 'The right to ask government to address a concern'],
    ['What is freedom of assembly?', 'The right to gather peacefully'],
    ['What is freedom of the press?', 'The right to publish news and opinions'],
    ['What is the minimum voting age in federal elections?', 'Eighteen (18)'],
    ['What does the census count?', 'The population of the United States'],
    ['How often is the U.S. census conducted?', 'Every ten years'],
    ['What is a jury?', 'A group of citizens that decides facts in a court case'],
    ['What is a citizen’s civic duty when summoned?', 'Serve on a jury'],
    ['What does the legislative branch do?', 'Makes laws'],
    ['What does the executive branch do?', 'Carries out laws'],
    ['What does the Constitution establish?', 'The structure and powers of the federal government'],
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

  const SHAPE_FACTS = [
    ['Circle', 'a round closed shape with every boundary point equally far from its center', 'a coin', 'no straight sides'],
    ['Square', 'a quadrilateral with four equal sides and four right angles', 'a square floor tile', 'four straight sides'],
    ['Rectangle', 'a quadrilateral with four right angles', 'a door', 'four straight sides'],
    ['Oval', 'a rounded closed shape longer in one direction', 'an egg outline', 'no straight sides'],
    ['Triangle', 'a polygon with three sides', 'a yield sign outline', 'three straight sides'],
    ['Diamond', 'a common name for a rhombus standing on a point', 'a playing-card diamond', 'four equal straight sides'],
    ['Pentagon', 'a polygon with five sides', 'the outline of a home plate', 'five straight sides'],
    ['Hexagon', 'a polygon with six sides', 'a honeycomb cell', 'six straight sides'],
    ['Star', 'a shape with points radiating from a center', 'a five-point star symbol', 'five outer points in the common form'],
    ['Heart', 'a symbol shape with two rounded lobes and a lower point', 'a heart icon', 'two rounded lobes and one point'],
  ];

  const FIRST_WORDS = [
    ['the', 'a word used before a specific noun'], ['and', 'a word that joins ideas'],
    ['is', 'a form of the verb be'], ['it', 'a pronoun for a thing'],
    ['in', 'inside or within'], ['you', 'the person being spoken to'],
    ['that', 'a word pointing to something'], ['of', 'a word showing relation or belonging'],
    ['to', 'toward a place or action'], ['a', 'a word used before one nonspecific noun'],
    ['I', 'the word a speaker uses for themself'], ['was', 'a past-tense form of be'],
    ['for', 'intended to benefit or reach'], ['on', 'touching or supported by a surface'],
    ['are', 'a present-tense form of be'], ['as', 'in the same way or role'],
    ['with', 'together or accompanied by'], ['his', 'belonging to a male person'],
    ['they', 'a pronoun for more than one person or a person of unspecified gender'],
    ['at', 'in or near a place or time'], ['be', 'to exist or have a state'],
    ['this', 'a word pointing to something nearby'], ['have', 'to own, hold, or experience'],
    ['from', 'showing a starting place'], ['or', 'a word that presents a choice'],
    ['one', 'the number after zero'], ['had', 'the past tense of have'],
    ['by', 'near, beside, or through the action of'], ['word', 'a unit of language with meaning'],
    ['but', 'a word that shows contrast'], ['not', 'a word that makes an idea negative'],
    ['what', 'a question word asking for information'], ['all', 'the whole amount or every one'],
    ['were', 'a past-tense plural form of be'], ['we', 'the speaker together with others'],
    ['when', 'a question word about time'], ['your', 'belonging to the person being spoken to'],
    ['can', 'to be able to'], ['said', 'the past tense of say'],
    ['there', 'in or at that place'], ['use', 'to put something into action'],
    ['an', 'a word used before a vowel sound'], ['each', 'every one considered separately'],
    ['which', 'a question word asking for a choice'], ['she', 'a pronoun for a female person'],
    ['do', 'to perform an action'], ['how', 'a question word asking about method or condition'],
    ['their', 'belonging to them'], ['if', 'a word introducing a condition'],
    ['will', 'a helping verb used for future action'],
  ];

  const OPPOSITES = [
    ['hot', 'cold'], ['big', 'small'], ['fast', 'slow'], ['up', 'down'], ['left', 'right'],
    ['day', 'night'], ['happy', 'sad'], ['open', 'closed'], ['full', 'empty'], ['wet', 'dry'],
    ['light', 'dark'], ['near', 'far'], ['young', 'old'], ['hard', 'soft'], ['early', 'late'],
    ['inside', 'outside'], ['above', 'below'], ['start', 'finish'], ['push', 'pull'], ['give', 'take'],
    ['laugh', 'cry'], ['quiet', 'loud'], ['clean', 'dirty'], ['thick', 'thin'], ['smooth', 'rough'],
    ['strong', 'weak'], ['same', 'different'], ['always', 'never'], ['more', 'less'], ['before', 'after'],
  ];

  const CLOCKS = [
    ['🕐', 1, 0], ['🕜', 1, 30], ['🕑', 2, 0], ['🕝', 2, 30],
    ['🕒', 3, 0], ['🕞', 3, 30], ['🕓', 4, 0], ['🕟', 4, 30],
    ['🕔', 5, 0], ['🕠', 5, 30], ['🕕', 6, 0], ['🕡', 6, 30],
    ['🕖', 7, 0], ['🕢', 7, 30], ['🕗', 8, 0], ['🕣', 8, 30],
    ['🕘', 9, 0], ['🕤', 9, 30], ['🕙', 10, 0], ['🕥', 10, 30],
    ['🕚', 11, 0], ['🕦', 11, 30], ['🕛', 12, 0], ['🕧', 12, 30],
  ];

  const US_STATES = [
    ['Alabama', 'AL'], ['Alaska', 'AK'], ['Arizona', 'AZ'], ['Arkansas', 'AR'], ['California', 'CA'],
    ['Colorado', 'CO'], ['Connecticut', 'CT'], ['Delaware', 'DE'], ['Florida', 'FL'], ['Georgia', 'GA'],
    ['Hawaii', 'HI'], ['Idaho', 'ID'], ['Illinois', 'IL'], ['Indiana', 'IN'], ['Iowa', 'IA'],
    ['Kansas', 'KS'], ['Kentucky', 'KY'], ['Louisiana', 'LA'], ['Maine', 'ME'], ['Maryland', 'MD'],
    ['Massachusetts', 'MA'], ['Michigan', 'MI'], ['Minnesota', 'MN'], ['Mississippi', 'MS'], ['Missouri', 'MO'],
    ['Montana', 'MT'], ['Nebraska', 'NE'], ['Nevada', 'NV'], ['New Hampshire', 'NH'], ['New Jersey', 'NJ'],
    ['New Mexico', 'NM'], ['New York', 'NY'], ['North Carolina', 'NC'], ['North Dakota', 'ND'], ['Ohio', 'OH'],
    ['Oklahoma', 'OK'], ['Oregon', 'OR'], ['Pennsylvania', 'PA'], ['Rhode Island', 'RI'], ['South Carolina', 'SC'],
    ['South Dakota', 'SD'], ['Tennessee', 'TN'], ['Texas', 'TX'], ['Utah', 'UT'], ['Vermont', 'VT'],
    ['Virginia', 'VA'], ['Washington', 'WA'], ['West Virginia', 'WV'], ['Wisconsin', 'WI'], ['Wyoming', 'WY'],
  ];

  const GERMAN = [
    'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
    'Hund', 'Katze', 'Haus', 'Wasser', 'Essen', 'Freund', 'Liebe', 'Tag', 'Nacht', 'Sonne',
    'Mond', 'rot', 'blau', 'grün', 'gelb', 'schwarz', 'weiß', 'Mann', 'Frau', 'Junge',
    'Mädchen', 'Buch', 'Schule', 'Auto', 'Stadt', 'Land', 'hallo', 'auf Wiedersehen', 'bitte', 'danke',
    'ja', 'nein', 'groß', 'klein', 'heiß', 'kalt', 'glücklich', 'traurig', 'heute', 'morgen',
  ];
  const ITALIAN = [
    'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci',
    'cane', 'gatto', 'casa', 'acqua', 'cibo', 'amico', 'amore', 'giorno', 'notte', 'sole',
    'luna', 'rosso', 'blu', 'verde', 'giallo', 'nero', 'bianco', 'uomo', 'donna', 'ragazzo',
    'ragazza', 'libro', 'scuola', 'auto', 'città', 'paese', 'ciao', 'arrivederci', 'per favore', 'grazie',
    'sì', 'no', 'grande', 'piccolo', 'caldo', 'freddo', 'felice', 'triste', 'oggi', 'domani',
  ];
  const JAPANESE = [
    'ichi (一)', 'ni (二)', 'san (三)', 'yon (四)', 'go (五)', 'roku (六)', 'nana (七)', 'hachi (八)', 'kyū (九)', 'jū (十)',
    'inu (犬)', 'neko (猫)', 'ie (家)', 'mizu (水)', 'tabemono (食べ物)', 'tomodachi (友達)', 'ai (愛)', 'hi (日)', 'yoru (夜)', 'taiyō (太陽)',
    'tsuki (月)', 'aka (赤)', 'ao (青)', 'midori (緑)', 'kiiro (黄色)', 'kuro (黒)', 'shiro (白)', 'otoko (男)', 'onna (女)', 'otokonoko (男の子)',
    'onnanoko (女の子)', 'hon (本)', 'gakkō (学校)', 'kuruma (車)', 'machi (町)', 'kuni (国)', 'konnichiwa (こんにちは)', 'sayōnara (さようなら)', 'onegaishimasu (お願いします)', 'arigatō (ありがとう)',
    'hai (はい)', 'iie (いいえ)', 'ōkii (大きい)', 'chiisai (小さい)', 'atsui (暑い)', 'samui (寒い)', 'ureshii (嬉しい)', 'kanashii (悲しい)', 'kyō (今日)', 'ashita (明日)',
  ];
  const MANDARIN = [
    'yī (一)', 'èr (二)', 'sān (三)', 'sì (四)', 'wǔ (五)', 'liù (六)', 'qī (七)', 'bā (八)', 'jiǔ (九)', 'shí (十)',
    'gǒu (狗)', 'māo (猫)', 'fángzi (房子)', 'shuǐ (水)', 'shíwù (食物)', 'péngyou (朋友)', 'ài (爱)', 'tiān (天)', 'yèwǎn (夜晚)', 'tàiyáng (太阳)',
    'yuèliang (月亮)', 'hóngsè (红色)', 'lánsè (蓝色)', 'lǜsè (绿色)', 'huángsè (黄色)', 'hēisè (黑色)', 'báisè (白色)', 'nánrén (男人)', 'nǚrén (女人)', 'nánhái (男孩)',
    'nǚhái (女孩)', 'shū (书)', 'xuéxiào (学校)', 'qìchē (汽车)', 'chéngshì (城市)', 'guójiā (国家)', 'nǐ hǎo (你好)', 'zàijiàn (再见)', 'qǐng (请)', 'xièxie (谢谢)',
    'shì (是)', 'bù (不)', 'dà (大)', 'xiǎo (小)', 'rè (热)', 'lěng (冷)', 'gāoxìng (高兴)', 'nánguò (难过)', 'jīntiān (今天)', 'míngtiān (明天)',
  ];

  const LESSON_DECKS = {
    'geometry-measurement': ['Geometry & Measurement', [
      ['Point', 'an exact location with no size', 'a labeled dot on a diagram'],
      ['Line', 'a straight path extending forever in both directions', 'the path through two points with arrows at both ends'],
      ['Line segment', 'part of a line with two endpoints', 'the edge of a ruler'],
      ['Ray', 'part of a line with one endpoint', 'a sunbeam drawn with one endpoint and one arrow'],
      ['Right angle', 'an angle measuring 90 degrees', 'the corner of a square'],
      ['Acute angle', 'an angle smaller than 90 degrees', 'a 45-degree angle'],
      ['Obtuse angle', 'an angle between 90 and 180 degrees', 'a 120-degree angle'],
      ['Perimeter', 'the distance around a two-dimensional shape', 'adding all four sides of a rectangle'],
      ['Area', 'the amount of surface inside a two-dimensional shape', 'length times width for a rectangle'],
      ['Volume', 'the space inside a three-dimensional object', 'length times width times height for a rectangular prism'],
      ['Centimeter', 'a metric length unit equal to one hundredth of a meter', 'the width of a small fingernail is about one centimeter'],
      ['Kilogram', 'a metric mass unit equal to 1,000 grams', 'a small bag of sugar may have a mass of one kilogram'],
      ['Liter', 'a metric volume unit equal to 1,000 milliliters', 'a bottle holding one liter of water'],
    ]],
    'human-body': ['Human Body', [
      ['Brain', 'the organ that coordinates thought, senses, and body activity', 'interpreting a sound'],
      ['Heart', 'the muscular organ that pumps blood', 'sending oxygen-rich blood through arteries'],
      ['Lungs', 'organs that exchange oxygen and carbon dioxide', 'taking oxygen into the blood'],
      ['Stomach', 'an organ that mixes food with digestive juices', 'beginning protein digestion'],
      ['Small intestine', 'the organ where most nutrient absorption occurs', 'absorbing glucose after a meal'],
      ['Large intestine', 'the organ that absorbs water and forms solid waste', 'recovering water from digested material'],
      ['Liver', 'an organ that processes nutrients and makes bile', 'helping digest fats with bile'],
      ['Kidneys', 'organs that filter blood and make urine', 'removing urea from the blood'],
      ['Skeleton', 'the framework of bones supporting and protecting the body', 'the skull protecting the brain'],
      ['Muscle', 'tissue that contracts to produce movement', 'the biceps bending an elbow'],
      ['Skin', 'the body’s largest organ and protective outer barrier', 'helping block germs'],
      ['Artery', 'a blood vessel carrying blood away from the heart', 'the aorta'],
      ['Vein', 'a blood vessel carrying blood toward the heart', 'a vein returning blood from a leg'],
    ]],
    'cells': ['Cells', [
      ['Cell', 'the smallest unit that can carry out all processes of life', 'a single bacterium'],
      ['Cell membrane', 'the selective boundary controlling what enters and leaves a cell', 'letting needed molecules pass'],
      ['Cytoplasm', 'the gel-like interior where many cell reactions occur', 'the material surrounding organelles'],
      ['Nucleus', 'the organelle containing most DNA in a eukaryotic cell', 'the control center of an animal cell'],
      ['Mitochondrion', 'an organelle that releases usable energy from food', 'producing ATP during cellular respiration'],
      ['Ribosome', 'the cell structure that builds proteins', 'joining amino acids'],
      ['Vacuole', 'a storage sac for water, nutrients, or waste', 'the large central storage space in a plant cell'],
      ['Cell wall', 'a rigid layer supporting plant, fungal, and many bacterial cells', 'the cellulose layer around a plant cell'],
      ['Chloroplast', 'the plant-cell organelle where photosynthesis occurs', 'using light energy to make sugar'],
      ['Prokaryote', 'an organism whose cells lack a membrane-bound nucleus', 'a bacterium'],
      ['Eukaryote', 'an organism whose cells contain a nucleus', 'an oak tree'],
      ['Diffusion', 'movement of particles from higher to lower concentration', 'perfume spreading through a room'],
      ['Osmosis', 'diffusion of water across a selectively permeable membrane', 'water entering a plant cell'],
    ]],
    'genetics': ['Genetics', [
      ['DNA', 'the molecule that stores hereditary information', 'the double helix in chromosomes'],
      ['Gene', 'a DNA sequence that helps determine a functional product or trait', 'a gene affecting blood type'],
      ['Chromosome', 'a packaged DNA molecule carrying many genes', 'one of the 23 chromosome pairs in typical human cells'],
      ['Allele', 'an alternative version of a gene', 'an allele for type A blood'],
      ['Genotype', 'the allele combination an organism carries', 'Bb for a particular gene'],
      ['Phenotype', 'an observable trait produced by genes and environment', 'purple flower color'],
      ['Dominant allele', 'an allele expressed when at least one copy is present', 'B showing in Bb'],
      ['Recessive allele', 'an allele usually expressed only when two copies are present', 'b showing in bb'],
      ['Homozygous', 'having two identical alleles for a gene', 'AA or aa'],
      ['Heterozygous', 'having two different alleles for a gene', 'Aa'],
      ['Mutation', 'a change in a DNA sequence', 'one DNA base being replaced'],
      ['Heredity', 'the passing of traits from parents to offspring', 'a child inheriting a blood-type allele'],
      ['Punnett square', 'a diagram used to predict possible allele combinations', 'a four-box monohybrid cross'],
    ]],
    'plants': ['Plants', [
      ['Root', 'the plant organ that anchors the plant and absorbs water and minerals', 'a carrot’s underground root'],
      ['Stem', 'the organ that supports leaves and transports materials', 'a sunflower stalk'],
      ['Leaf', 'the main plant organ for photosynthesis', 'a broad maple leaf capturing light'],
      ['Flower', 'the reproductive structure of flowering plants', 'an apple blossom'],
      ['Fruit', 'a mature ovary that contains seeds', 'a tomato'],
      ['Seed', 'a plant embryo with stored food and a protective coat', 'a bean seed'],
      ['Photosynthesis', 'the process using light to make sugar from carbon dioxide and water', 'a leaf producing glucose in sunlight'],
      ['Chlorophyll', 'the green pigment that absorbs light for photosynthesis', 'pigment inside chloroplasts'],
      ['Xylem', 'vascular tissue carrying water and minerals upward', 'water moving from roots to leaves'],
      ['Phloem', 'vascular tissue transporting sugars through a plant', 'sugar moving from a leaf to a root'],
      ['Pollination', 'the transfer of pollen to a flower’s female reproductive part', 'a bee carrying pollen between flowers'],
      ['Germination', 'the beginning of growth from a seed', 'a seed sending out its first root'],
      ['Transpiration', 'the loss of water vapor from plant leaves', 'water vapor leaving through stomata'],
    ]],
    'animal-classification': ['Animal Classification', [
      ['Vertebrate', 'an animal with a backbone', 'a trout'],
      ['Invertebrate', 'an animal without a backbone', 'an earthworm'],
      ['Mammal', 'a vertebrate with hair that feeds milk to its young', 'a dolphin'],
      ['Bird', 'a feathered vertebrate that lays amniotic eggs', 'an eagle'],
      ['Reptile', 'an ectothermic vertebrate with dry scales', 'a snake'],
      ['Amphibian', 'a vertebrate with a life cycle often split between water and land', 'a frog'],
      ['Fish', 'an aquatic vertebrate with gills and fins', 'a salmon'],
      ['Arthropod', 'an invertebrate with an exoskeleton and jointed legs', 'a crab'],
      ['Insect', 'an arthropod with six legs and three main body sections', 'a beetle'],
      ['Arachnid', 'an arthropod with eight legs and two main body sections', 'a spider'],
      ['Mollusk', 'a soft-bodied invertebrate, often with a shell', 'a snail'],
      ['Annelid', 'a segmented worm', 'an earthworm'],
      ['Cnidarian', 'an aquatic invertebrate with stinging cells', 'a jellyfish'],
    ]],
    'ecosystems': ['Ecosystems & Food Webs', [
      ['Ecosystem', 'organisms interacting with one another and their environment', 'a pond community and its water, soil, and light'],
      ['Habitat', 'the place where an organism lives', 'a hollow tree used by an owl'],
      ['Population', 'members of one species living in one area', 'all deer in a forest'],
      ['Community', 'all interacting populations in an area', 'plants, animals, fungi, and microbes in a meadow'],
      ['Producer', 'an organism that makes its own food', 'grass using photosynthesis'],
      ['Consumer', 'an organism that gets energy by eating other organisms', 'a rabbit eating grass'],
      ['Decomposer', 'an organism that breaks down dead matter and waste', 'a fungus on a fallen log'],
      ['Food chain', 'a single pathway of energy transfer through feeding', 'grass to grasshopper to frog'],
      ['Food web', 'a network of connected food chains', 'several predators sharing prey in a marsh'],
      ['Predator', 'an animal that hunts another animal for food', 'an owl catching a mouse'],
      ['Prey', 'an animal hunted by a predator', 'a mouse hunted by an owl'],
      ['Biotic factor', 'a living part of an ecosystem', 'a tree'],
      ['Abiotic factor', 'a nonliving part of an ecosystem', 'sunlight'],
    ]],
    'health-nutrition': ['Health & Nutrition', [
      ['Carbohydrate', 'a nutrient that is a major source of readily available energy', 'oats'],
      ['Protein', 'a nutrient used to build and repair body tissues', 'beans'],
      ['Fat', 'a concentrated energy source that also supports cells and vitamin absorption', 'avocado'],
      ['Vitamin', 'an organic nutrient needed in small amounts for normal body functions', 'vitamin C in an orange'],
      ['Mineral', 'an inorganic nutrient needed for body structure or processes', 'calcium in milk'],
      ['Fiber', 'plant material that supports healthy digestion', 'fiber in whole grains'],
      ['Hydration', 'maintaining enough water for normal body function', 'drinking water during exercise'],
      ['Balanced diet', 'a varied eating pattern supplying needed nutrients and energy', 'including fruits, vegetables, grains, protein foods, and dairy or alternatives'],
      ['Aerobic exercise', 'activity that raises heart rate and breathing for a sustained time', 'brisk walking'],
      ['Strength exercise', 'activity that makes muscles work against resistance', 'bodyweight squats'],
      ['Sleep', 'a recurring period of rest important for recovery and learning', 'following a regular bedtime'],
      ['Food safety', 'practices that reduce foodborne illness', 'washing hands before preparing food'],
      ['Serving size', 'a standardized amount used on a nutrition label', 'the amount listed beside calories'],
    ]],
    'chemistry-basics': ['Chemistry Basics', [
      ['Atom', 'the smallest unit of an element retaining that element’s properties', 'one helium atom'],
      ['Molecule', 'two or more atoms chemically bonded', 'an oxygen molecule, O2'],
      ['Compound', 'a substance made of two or more elements chemically combined', 'water, H2O'],
      ['Element', 'a pure substance made of one kind of atom', 'gold'],
      ['Proton', 'a positively charged particle in an atomic nucleus', 'the particle count that defines atomic number'],
      ['Neutron', 'an uncharged particle in an atomic nucleus', 'a neutron in carbon-12'],
      ['Electron', 'a negatively charged particle found around an atomic nucleus', 'an electron involved in a chemical bond'],
      ['Ion', 'an atom or molecule with a net electric charge', 'Na+'],
      ['Chemical bond', 'an attraction holding atoms together', 'the O-H bonds in water'],
      ['Reactant', 'a starting substance in a chemical reaction', 'hydrogen before it reacts with oxygen'],
      ['Product', 'a substance formed by a chemical reaction', 'water formed from hydrogen and oxygen'],
      ['Acid', 'a substance that donates hydrogen ions or increases them in water', 'citric acid'],
      ['Base', 'a substance that accepts hydrogen ions or increases hydroxide ions in water', 'sodium hydroxide'],
    ]],
    'physics-basics': ['Physics Basics', [
      ['Force', 'a push or pull that can change motion', 'pushing a cart'],
      ['Motion', 'a change in position over time', 'a bicycle moving down a road'],
      ['Speed', 'distance traveled per unit of time', '60 kilometers per hour'],
      ['Velocity', 'speed in a specified direction', '20 meters per second north'],
      ['Acceleration', 'the rate at which velocity changes', 'a car speeding up'],
      ['Mass', 'the amount of matter in an object', 'a rock having a mass of two kilograms'],
      ['Weight', 'the gravitational force on an object', 'a scale reading caused by gravity'],
      ['Gravity', 'the attraction between objects with mass', 'Earth pulling a dropped ball downward'],
      ['Friction', 'a force opposing motion between surfaces', 'brakes slowing a bicycle wheel'],
      ['Energy', 'the capacity to do work or cause change', 'stored energy in a stretched spring'],
      ['Work', 'energy transferred when a force moves an object through a distance', 'lifting a box onto a shelf'],
      ['Power', 'the rate at which work is done or energy is transferred', 'doing the same lifting job in less time'],
      ['Simple machine', 'a device that changes the size or direction of a force', 'a lever'],
    ]],
    'earth-science': ['Earth Science', [
      ['Crust', 'Earth’s thin outer solid layer', 'the layer containing continents and ocean floor'],
      ['Mantle', 'the thick layer of hot rock beneath Earth’s crust', 'slowly flowing rock that drives plate motion'],
      ['Outer core', 'Earth’s liquid iron-rich layer surrounding the inner core', 'the layer helping generate Earth’s magnetic field'],
      ['Inner core', 'Earth’s solid iron-rich center', 'the hottest central layer'],
      ['Mineral', 'a naturally occurring inorganic solid with a definite composition and structure', 'quartz'],
      ['Rock', 'a solid mixture of one or more minerals or mineral-like materials', 'granite'],
      ['Igneous rock', 'rock formed when magma or lava cools', 'basalt'],
      ['Sedimentary rock', 'rock formed from compacted sediments or chemical deposits', 'sandstone'],
      ['Metamorphic rock', 'rock changed by heat, pressure, or fluids without melting', 'marble'],
      ['Plate tectonics', 'the theory that Earth’s lithosphere is divided into moving plates', 'plates separating at a mid-ocean ridge'],
      ['Earthquake', 'ground shaking caused by sudden energy release in Earth’s crust', 'movement along a fault'],
      ['Volcano', 'an opening where magma, gas, and ash reach the surface', 'Mount Etna'],
      ['Erosion', 'the transport of weathered material', 'a river carrying sediment downstream'],
    ]],
    'weather-climate': ['Weather & Climate', [
      ['Weather', 'short-term atmospheric conditions at a place and time', 'today’s rain and temperature'],
      ['Climate', 'the long-term pattern of weather in a region', 'hot, dry summers typical of a Mediterranean climate'],
      ['Temperature', 'a measure of how hot or cold something is', '20 degrees Celsius'],
      ['Air pressure', 'the force exerted by the weight of air', 'a barometer reading'],
      ['Humidity', 'the amount of water vapor in the air', 'muggy air before a storm'],
      ['Precipitation', 'water falling from the atmosphere', 'rain'],
      ['Wind', 'air moving from higher pressure toward lower pressure', 'a sea breeze'],
      ['Cloud', 'visible droplets or ice crystals suspended in the atmosphere', 'a cumulus cloud'],
      ['Cold front', 'the boundary where advancing cold air replaces warmer air', 'a line of storms followed by cooler air'],
      ['Warm front', 'the boundary where advancing warm air rises over cooler air', 'steady rain before warmer air arrives'],
      ['Thunderstorm', 'a storm producing lightning and thunder', 'a cumulonimbus cloud with lightning'],
      ['Tornado', 'a violently rotating column of air touching the ground', 'a funnel extending from a thunderstorm'],
      ['Hurricane', 'a powerful tropical cyclone with sustained rotating winds', 'a named Atlantic tropical cyclone'],
    ]],
    'scientific-method': ['Scientific Method', [
      ['Observation', 'information gathered with senses or instruments', 'noting that a plant near a window grows faster'],
      ['Question', 'a testable problem prompted by observation', 'does light duration affect plant growth'],
      ['Hypothesis', 'a testable proposed explanation or prediction', 'if light time increases, then the plant will grow taller'],
      ['Experiment', 'a controlled procedure used to test a hypothesis', 'growing similar plants under different light durations'],
      ['Independent variable', 'the factor deliberately changed in an experiment', 'hours of light per day'],
      ['Dependent variable', 'the measured response in an experiment', 'plant height'],
      ['Controlled variable', 'a factor kept the same for a fair test', 'using the same amount of water'],
      ['Control group', 'a comparison group not receiving the tested change', 'plants kept under the usual light schedule'],
      ['Data', 'recorded observations or measurements', 'a table of plant heights'],
      ['Analysis', 'examining data for patterns and meaning', 'calculating average growth'],
      ['Conclusion', 'a statement explaining what the results show', 'the results supported the light-growth hypothesis'],
      ['Replication', 'repeating a study to check whether results are consistent', 'another class performing the same experiment'],
      ['Peer review', 'evaluation of scientific work by other experts', 'researchers checking a study before publication'],
    ]],
    'parts-speech': ['Parts of Speech', [
      ['Noun', 'a word naming a person, place, thing, or idea', 'river'],
      ['Pronoun', 'a word used in place of a noun', 'they'],
      ['Verb', 'a word expressing action or a state of being', 'jump'],
      ['Adjective', 'a word describing a noun or pronoun', 'bright'],
      ['Adverb', 'a word modifying a verb, adjective, or another adverb', 'quickly'],
      ['Preposition', 'a word showing a relationship in space, time, or direction', 'under'],
      ['Conjunction', 'a word joining words, phrases, or clauses', 'and'],
      ['Interjection', 'a word or phrase expressing sudden feeling', 'Wow!'],
      ['Article', 'a word marking a noun as specific or nonspecific', 'the'],
      ['Proper noun', 'the specific name of a person, place, or organization', 'Lake Erie'],
      ['Common noun', 'a general name for a person, place, thing, or idea', 'city'],
      ['Helping verb', 'a verb used with a main verb to express time, possibility, or voice', 'has in "has finished"'],
      ['Coordinating conjunction', 'a conjunction joining grammatically equal elements', 'but'],
    ]],
    'grammar': ['Grammar Basics', [
      ['Subject', 'the sentence part naming who or what the sentence is about', 'The dog in "The dog barked."'],
      ['Predicate', 'the sentence part telling what the subject does or is', 'barked in "The dog barked."'],
      ['Sentence', 'a complete thought with a subject and predicate', 'Birds fly.'],
      ['Fragment', 'an incomplete group of words presented as a sentence', 'Because the rain stopped.'],
      ['Run-on sentence', 'two or more independent clauses joined incorrectly', 'I ran home I ate lunch.'],
      ['Independent clause', 'a group of words with a subject and verb that can stand alone', 'The bell rang.'],
      ['Dependent clause', 'a subject-verb group that cannot stand alone as a sentence', 'because the bell rang'],
      ['Simple sentence', 'a sentence with one independent clause', 'The child laughed.'],
      ['Compound sentence', 'a sentence with two or more independent clauses', 'The child laughed, and the dog barked.'],
      ['Subject-verb agreement', 'matching a subject and verb in number', 'She runs, but they run.'],
      ['Verb tense', 'the verb form showing when an action occurs', 'walked for past time'],
      ['Active voice', 'a construction in which the subject performs the action', 'Maya kicked the ball.'],
      ['Passive voice', 'a construction in which the subject receives the action', 'The ball was kicked by Maya.'],
    ]],
    'punctuation': ['Punctuation', [
      ['Period', 'a mark ending a statement or mild command', 'The class begins now.'],
      ['Question mark', 'a mark ending a direct question', 'Where is the library?'],
      ['Exclamation point', 'a mark showing strong feeling or emphasis', 'Watch out!'],
      ['Comma', 'a mark separating items or sentence elements', 'We packed food, water, and maps.'],
      ['Semicolon', 'a mark joining closely related independent clauses', 'The rain ended\\; the game resumed.'],
      ['Colon', 'a mark introducing a list, explanation, or example', 'Bring three items: paper, tape, and scissors.'],
      ['Apostrophe', 'a mark showing possession or omitted letters', 'the dog’s leash'],
      ['Quotation marks', 'marks enclosing direct speech or quoted words', 'She said, "Hello."'],
      ['Parentheses', 'marks enclosing extra or clarifying information', 'The trail (opened in May) is popular.'],
      ['Hyphen', 'a mark joining parts of a compound word', 'well-known author'],
      ['Dash', 'a mark setting off an interruption or emphasis', 'The answer—after a long pause—was yes.'],
      ['Ellipsis', 'three dots showing omitted words or a trailing thought', 'I wonder...'],
      ['Slash', 'a mark showing alternatives, fractions, or line breaks', 'and/or'],
    ]],
    'synonyms-antonyms': ['Synonyms & Antonyms', [
      ['Synonym', 'a word with the same or nearly the same meaning as another word', 'rapid and fast'],
      ['Antonym', 'a word with an opposite meaning', 'ancient and modern'],
      ['Rapid', 'happening at high speed', 'rapid is a synonym of quick'],
      ['Enormous', 'very large', 'enormous is a synonym of huge'],
      ['Silent', 'making little or no sound', 'silent is an antonym of noisy'],
      ['Scarce', 'in short supply', 'scarce is an antonym of plentiful'],
      ['Ancient', 'belonging to the distant past', 'ancient is an antonym of modern'],
      ['Brave', 'showing courage', 'brave is a synonym of courageous'],
      ['Fragile', 'easily broken or damaged', 'fragile is an antonym of sturdy'],
      ['Generous', 'willing to give or share', 'generous is an antonym of selfish'],
      ['Drowsy', 'sleepy', 'drowsy is a synonym of tired'],
      ['Permit', 'to allow', 'permit is an antonym of forbid'],
      ['Expand', 'to become or make larger', 'expand is an antonym of contract'],
    ]],
    'roots-prefixes-suffixes': ['Roots, Prefixes & Suffixes', [
      ['bio-', 'a Greek root or combining form meaning life', 'biology'],
      ['geo-', 'a Greek root or combining form meaning earth', 'geography'],
      ['tele-', 'a Greek root or prefix meaning distant', 'telephone'],
      ['micro-', 'a prefix meaning small', 'microscope'],
      ['pre-', 'a prefix meaning before', 'preview'],
      ['re-', 'a prefix meaning again or back', 'rewrite'],
      ['un-', 'a prefix meaning not or the reverse of', 'unhappy'],
      ['inter-', 'a prefix meaning between or among', 'international'],
      ['-ful', 'a suffix meaning full of', 'helpful'],
      ['-less', 'a suffix meaning without', 'careless'],
      ['-ology', 'a suffix meaning the study of', 'geology'],
      ['-ist', 'a suffix meaning a person who practices or specializes in something', 'artist'],
      ['-able', 'a suffix meaning capable of being', 'washable'],
    ]],
    'commonly-confused': ['Commonly Confused Words', [
      ['their / there / they’re', 'their shows possession\\; there refers to a place\\; they’re means they are', 'Their dog is over there, and they’re calling it.'],
      ['your / you’re', 'your shows possession\\; you’re means you are', 'You’re wearing your new coat.'],
      ['its / it’s', 'its shows possession\\; it’s means it is or it has', 'It’s a bird protecting its nest.'],
      ['to / too / two', 'to marks direction or an infinitive\\; too means also or excessive\\; two is a number', 'The two hikers went to the lake too.'],
      ['than / then', 'than makes a comparison\\; then refers to time or consequence', 'She is taller than I am\\; then we measured again.'],
      ['affect / effect', 'affect is usually a verb meaning influence\\; effect is usually a noun meaning result', 'Rain can affect traffic, and delay is one effect.'],
      ['accept / except', 'accept means receive or agree\\; except means excluding', 'Everyone except Lee will accept the award.'],
      ['principal / principle', 'principal can mean leader or main\\; principle means a rule or belief', 'The principal explained the school principle.'],
      ['lose / loose', 'lose means misplace or fail to win\\; loose means not tight', 'Do not lose the loose button.'],
      ['weather / whether', 'weather is atmospheric conditions\\; whether introduces alternatives', 'We wondered whether the weather would improve.'],
      ['complement / compliment', 'complement completes or pairs well\\; compliment is praise', 'The scarf complements the coat, and I complimented it.'],
      ['stationary / stationery', 'stationary means not moving\\; stationery is writing paper', 'The stationary bicycle stood beside the stationery.'],
      ['who / whom', 'who acts as a subject\\; whom acts as an object', 'Who called, and whom did you call?'],
    ]],
    'literary-terms': ['Literary Terms', [
      ['Plot', 'the sequence of events in a story', 'a mystery unfolding from clue to solution'],
      ['Setting', 'the time and place of a story', 'a village during winter'],
      ['Character', 'a person, animal, or figure in a story', 'the detective in a mystery'],
      ['Protagonist', 'the central character whose goals drive the story', 'the hero seeking a lost map'],
      ['Antagonist', 'the force opposing the protagonist', 'a rival blocking the hero'],
      ['Theme', 'a central idea explored by a work', 'the importance of perseverance'],
      ['Conflict', 'the struggle between opposing forces', 'a character versus nature'],
      ['Point of view', 'the perspective from which a story is told', 'first-person narration using I'],
      ['Metaphor', 'a direct comparison saying one thing is another', 'Time is a thief.'],
      ['Simile', 'a comparison using like or as', 'The water shone like glass.'],
      ['Personification', 'giving human qualities to something nonhuman', 'The wind whispered.'],
      ['Foreshadowing', 'a hint about what may happen later', 'dark clouds appearing before a disaster'],
      ['Irony', 'a contrast between expectation and reality', 'a fire station catching fire'],
    ]],
    'continents-landforms': ['Continents, Oceans & Landforms', [
      ['Africa', 'the continent crossed by both the equator and prime meridian', 'the Sahara is located there'],
      ['Antarctica', 'the ice-covered continent surrounding the South Pole', 'the coldest continent'],
      ['Asia', 'the largest continent by area', 'the Himalayas are located there'],
      ['Europe', 'the continent west of Asia and north of Africa', 'the Alps are located there'],
      ['North America', 'the continent containing Canada, the United States, Mexico, and other countries', 'the Great Lakes are located there'],
      ['South America', 'the continent containing the Amazon Basin and Andes', 'Brazil is located there'],
      ['Australia', 'the smallest continent by land area', 'the Great Dividing Range is located there'],
      ['Pacific Ocean', 'the largest and deepest ocean', 'the ocean between Asia and the Americas'],
      ['Atlantic Ocean', 'the ocean between the Americas and Europe and Africa', 'the Mid-Atlantic Ridge lies within it'],
      ['Mountain', 'a landform rising prominently above surrounding land', 'Mount Everest'],
      ['Plateau', 'a broad elevated area with a relatively flat top', 'the Tibetan Plateau'],
      ['Valley', 'a low area between hills or mountains', 'a river valley'],
      ['Delta', 'sediment-built land at a river’s mouth', 'the Nile Delta'],
    ]],
    'world-landmarks': ['World Landmarks', [
      ['Great Wall of China', 'a network of historic fortifications across northern China', 'watchtowers and walls near Beijing'],
      ['Pyramids of Giza', 'ancient Egyptian monumental tombs near Cairo', 'the Great Pyramid'],
      ['Machu Picchu', 'an Inca site high in the Andes of Peru', 'stone terraces above the Urubamba Valley'],
      ['Taj Mahal', 'a white-marble mausoleum in Agra, India', 'the monument built by Shah Jahan'],
      ['Colosseum', 'an ancient Roman amphitheater in Rome', 'gladiatorial contests were held there'],
      ['Eiffel Tower', 'an iron lattice tower in Paris', 'the tower built for the 1889 exposition'],
      ['Statue of Liberty', 'a monument in New York Harbor symbolizing liberty', 'the copper statue gifted by France'],
      ['Sydney Opera House', 'a performing arts center with sail-like roofs in Sydney', 'the harbor-side Australian landmark'],
      ['Christ the Redeemer', 'a large statue of Jesus overlooking Rio de Janeiro', 'the statue atop Corcovado'],
      ['Petra', 'an ancient city carved into rock in Jordan', 'the Treasury facade'],
      ['Angkor Wat', 'a vast temple complex in Cambodia', 'the Khmer temple shown on Cambodia’s flag'],
      ['Chichén Itzá', 'a major Maya archaeological site in Mexico', 'the El Castillo pyramid'],
      ['Stonehenge', 'a prehistoric stone circle in southern England', 'large standing stones arranged in rings'],
    ]],
    'early-us-history': ['Early US History', [
      ['Jamestown', 'the first permanent English settlement in what became the United States', 'founded in Virginia in 1607'],
      ['Mayflower Compact', 'an agreement for self-government signed by Plymouth settlers', 'signed in 1620'],
      ['Thirteen Colonies', 'the British colonies that declared independence in 1776', 'Virginia, Massachusetts, and eleven others'],
      ['French and Indian War', 'the North American conflict that preceded the American Revolution', 'Britain and France competing in 1754–1763'],
      ['Boston Tea Party', 'a 1773 protest against British tea policy', 'tea dumped into Boston Harbor'],
      ['Declaration of Independence', 'the document announcing the colonies’ separation from Britain', 'adopted July 4, 1776'],
      ['American Revolution', 'the war in which the colonies won independence from Britain', 'the conflict from 1775 to 1783'],
      ['Articles of Confederation', 'the first national governing framework of the United States', 'a weak central government before the Constitution'],
      ['Constitutional Convention', 'the 1787 meeting that drafted the U.S. Constitution', 'delegates meeting in Philadelphia'],
      ['Louisiana Purchase', 'the 1803 U.S. acquisition of a vast territory from France', 'land that roughly doubled the nation’s size'],
      ['Lewis and Clark Expedition', 'the expedition that explored the Louisiana Purchase and routes west', 'the Corps of Discovery, 1804–1806'],
      ['War of 1812', 'a war between the United States and Britain from 1812 to 1815', 'the defense of Fort McHenry'],
      ['Monroe Doctrine', 'the 1823 policy opposing new European colonization in the Americas', 'a warning against further European intervention'],
    ]],
    'modern-us-history': ['Modern US History', [
      ['Civil War', 'the 1861–1865 war between the United States and seceded Confederate states', 'the Battle of Gettysburg'],
      ['Emancipation Proclamation', 'the 1863 order declaring enslaved people free in areas in rebellion', 'issued by Abraham Lincoln'],
      ['Reconstruction', 'the post-Civil War effort to rebuild the South and define freedom and citizenship', 'ratification of the 14th Amendment'],
      ['Industrialization', 'the growth of machine production and large-scale industry', 'rapid factory growth in the late 1800s'],
      ['Progressive Era', 'a reform period addressing problems linked to industrialization and urban growth', 'food-safety and voting reforms'],
      ['Great Migration', 'the movement of millions of Black Americans from the South to other regions', 'migration to northern cities in the 20th century'],
      ['World War I', 'the global conflict fought from 1914 to 1918', 'the United States entered in 1917'],
      ['Great Depression', 'the severe economic downturn beginning in 1929', 'widespread unemployment in the 1930s'],
      ['New Deal', 'federal programs and reforms responding to the Great Depression', 'Social Security and public works programs'],
      ['World War II', 'the global conflict fought from 1939 to 1945', 'the United States entered after Pearl Harbor'],
      ['Civil Rights Movement', 'the movement seeking equal rights and an end to racial segregation', 'the Montgomery Bus Boycott'],
      ['Cold War', 'the prolonged geopolitical rivalry between the United States and Soviet Union', 'the Cuban Missile Crisis'],
      ['September 11 attacks', 'the 2001 terrorist attacks in New York, Virginia, and Pennsylvania', 'attacks on September 11, 2001'],
    ]],
    'ancient-civilizations': ['Ancient Civilizations', [
      ['Mesopotamia', 'an ancient region between the Tigris and Euphrates rivers', 'Sumerian city-states'],
      ['Sumer', 'one of the earliest urban civilizations in southern Mesopotamia', 'cuneiform writing'],
      ['Babylon', 'a major Mesopotamian city and empire', 'the Code of Hammurabi'],
      ['Ancient Egypt', 'a civilization centered on the Nile River', 'pyramids and hieroglyphs'],
      ['Indus Valley Civilization', 'an early urban civilization in South Asia', 'planned cities such as Mohenjo-daro'],
      ['Shang dynasty', 'an early Chinese dynasty known from written and archaeological records', 'oracle bones'],
      ['Ancient Greece', 'a Mediterranean civilization of independent city-states', 'Athens and Sparta'],
      ['Roman Republic', 'the period when Rome was governed by elected officials and a senate', 'government before the Roman Empire'],
      ['Roman Empire', 'the vast state ruled from Rome and later Constantinople', 'roads and aqueducts across the Mediterranean'],
      ['Maya civilization', 'a Mesoamerican civilization known for cities, writing, and astronomy', 'Tikal'],
      ['Aztec Empire', 'a Mesoamerican empire centered on Tenochtitlan', 'chinampa farming'],
      ['Inca Empire', 'an Andean empire connected by roads', 'Machu Picchu'],
      ['Phoenicians', 'an eastern Mediterranean people known for seafaring and trade', 'an alphabet that influenced Greek writing'],
    ]],
    'world-history': ['World History Milestones', [
      ['Agricultural Revolution', 'the shift from hunting and gathering toward farming', 'permanent villages developing after plant domestication'],
      ['Silk Roads', 'trade networks connecting East Asia, Central Asia, the Middle East, and Europe', 'silk and ideas moving across Eurasia'],
      ['Magna Carta', 'the 1215 English charter limiting royal power in specific ways', 'the principle that a ruler is subject to law'],
      ['Renaissance', 'a period of renewed art, learning, and humanism in Europe', 'Leonardo da Vinci’s work'],
      ['Printing press', 'a technology that greatly increased the speed of reproducing texts', 'movable-type printing in 15th-century Europe'],
      ['Reformation', 'the 16th-century movement that divided western Christianity', 'Martin Luther’s challenge to church practices'],
      ['Scientific Revolution', 'a period emphasizing observation, mathematics, and experimentation', 'new models of the solar system'],
      ['Enlightenment', 'an intellectual movement emphasizing reason and individual rights', 'ideas about social contracts'],
      ['Industrial Revolution', 'the shift to mechanized production beginning in the late 1700s', 'steam-powered factories'],
      ['French Revolution', 'the political and social upheaval beginning in France in 1789', 'the end of the old monarchy'],
      ['Imperialism', 'a policy of extending control over other territories or peoples', 'European colonial expansion in the 1800s'],
      ['World War I', 'a global war fought from 1914 to 1918', 'trench warfare on the Western Front'],
      ['United Nations', 'an international organization founded in 1945 to promote cooperation and peace', 'the General Assembly'],
    ]],
    'inventors-inventions': ['Inventors & Inventions', [
      ['Johannes Gutenberg', 'the printer associated with movable metal type in 15th-century Europe', 'the Gutenberg Bible'],
      ['James Watt', 'the engineer who greatly improved steam-engine efficiency', 'a separate condenser for steam engines'],
      ['Eli Whitney', 'the inventor associated with the cotton gin', 'a machine separating cotton fiber from seeds'],
      ['Samuel Morse', 'a developer of an electric telegraph system and Morse code', 'coded messages sent over wires'],
      ['Alexander Graham Bell', 'an inventor associated with the development of the telephone', 'an 1876 telephone patent'],
      ['Thomas Edison', 'an inventor who developed practical electric-light and sound-recording systems', 'a practical incandescent lighting system'],
      ['Nikola Tesla', 'an inventor and engineer known for alternating-current power systems', 'the induction motor'],
      ['George Washington Carver', 'an agricultural scientist who promoted crop rotation and new crop uses', 'research on peanuts and sweet potatoes'],
      ['Orville and Wilbur Wright', 'aviation pioneers who achieved controlled powered flight', 'the 1903 Wright Flyer'],
      ['Guglielmo Marconi', 'an inventor associated with practical long-distance radio communication', 'wireless telegraphy across the Atlantic'],
      ['Hedy Lamarr and George Antheil', 'co-inventors of an early frequency-hopping communication method', 'a patented spread-spectrum concept'],
      ['Grace Hopper', 'a computer scientist who advanced compilers and machine-independent programming', 'work leading toward COBOL'],
      ['Tim Berners-Lee', 'the inventor of the World Wide Web', 'HTML, HTTP, and the first web browser and server'],
    ]],
    'art-music-terms': ['Art & Music Terms', [
      ['Line', 'a continuous mark used to define shapes, edges, or movement in art', 'a contour drawing'],
      ['Shape', 'a flat enclosed area in art', 'a painted circle'],
      ['Form', 'a three-dimensional object or the illusion of three dimensions', 'a sculpture'],
      ['Color', 'the visual quality produced by reflected or emitted light', 'a red area in a painting'],
      ['Texture', 'the surface quality of an artwork, real or implied', 'paint made to look rough'],
      ['Perspective', 'a method for showing depth on a flat surface', 'parallel lines meeting at a vanishing point'],
      ['Portrait', 'an artwork representing a person', 'a painted likeness'],
      ['Landscape', 'an artwork depicting natural scenery', 'a painting of mountains and a river'],
      ['Rhythm', 'the organization of sounds and silences in time', 'a repeated drum pattern'],
      ['Melody', 'a sequence of pitches heard as a musical line', 'the tune a singer performs'],
      ['Harmony', 'two or more pitches sounding together', 'a chord accompanying a melody'],
      ['Tempo', 'the speed of music', 'allegro indicating a fast pace'],
      ['Dynamics', 'the relative loudness or softness of music', 'piano for soft and forte for loud'],
    ]],
  };

  /* ---------- Card builders ---------- */
  const pairQA = (data) => data.map(([q, a]) => ({ q, a }));
  const capitalQA = (data) => data.map(([country, cap]) => ({ q: `Capital of ${country}?`, a: cap }));
  const presidentQA = (data) => data.map(([n, name, yrs]) => ({ q: `Who was U.S. President #${n}?`, a: `${name} (${yrs})` }));
  const elementQA = (data) => data.map(([name, sym, z]) => ({ q: `Chemical symbol for ${name}?`, a: `${sym} (atomic number ${z})` }));
  const langQA = (lang, data) => data.map(([en, tr]) => ({ q: `${lang}: ${en}`, a: tr }));
  const colorQA = (data) => data.map(([name, hex]) => ({ q: `{{shape:square|${hex}|130}}`, a: `**${name}**\n${hex}` }));
  const shapeQA = (data) => data.map(([kind, name]) => ({ q: `{{shape:${kind}|#4f46e5|130}}`, a: name }));
  const flagQA = (data) => data.map(([code, country]) => ({ q: `{{flag:${code}}}`, a: country }));

  function lessonQA(subject, data) {
    return data.flatMap(([term, definition, example]) => [
      { q: `${subject}: What is ${term}?`, a: definition },
      { q: `${subject}: Which topic matches "${definition}"?`, a: term },
      { q: `${subject}: Key example for ${term}?`, a: example },
      { q: `${subject}: Which topic fits "${example}"?`, a: term },
    ]);
  }

  function additionCards() {
    const out = [];
    for (let a = 0; a <= 12; a++) for (let b = 0; b <= 12; b++) out.push({ q: `${a} + ${b}`, a: String(a + b) });
    return out;
  }

  function subtractionCards() {
    const out = [];
    for (let a = 0; a <= 15; a++) for (let b = 0; b <= a; b++) out.push({ q: `${a} − ${b}`, a: String(a - b) });
    return out;
  }

  function multiplicationCards() {
    const out = [];
    for (let a = 2; a <= 12; a++) for (let b = 2; b <= 12; b++) out.push({ q: `${a} × ${b}`, a: String(a * b) });
    return out;
  }

  function divisionCards() {
    const out = [];
    for (let divisor = 2; divisor <= 12; divisor++) {
      for (let quotient = 1; quotient <= 12; quotient++) {
        out.push({ q: `${divisor * quotient} ÷ ${divisor}`, a: String(quotient) });
      }
    }
    return out;
  }

  function fractionCards() {
    const out = [];
    for (let denominator = 2; denominator <= 12; denominator++) {
      for (let numerator = 1; numerator < denominator; numerator++) {
        out.push({
          q: `${numerator} selected part${numerator === 1 ? '' : 's'} out of ${denominator} equal parts`,
          a: `${numerator}/${denominator}`,
        });
      }
    }
    return out;
  }

  function decimalPercentCards() {
    return Array.from({ length: 50 }, (_, i) => {
      const percent = i + 1;
      return { q: `Write ${percent}% as a decimal.`, a: (percent / 100).toFixed(2) };
    });
  }

  function oppositeCards() {
    return OPPOSITES.flatMap(([a, b]) => [
      { q: `Opposite of "${a}"?`, a: b },
      { q: `Opposite of "${b}"?`, a },
    ]);
  }

  function calendarCards() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const out = [];
    days.forEach((day, i) => {
      out.push({ q: `Day after ${day}?`, a: days[(i + 1) % days.length] });
      out.push({ q: `Day before ${day}?`, a: days[(i + days.length - 1) % days.length] });
    });
    months.forEach((month, i) => {
      out.push({ q: `Month number ${i + 1}?`, a: month });
      out.push({ q: `${month} is which month number?`, a: String(i + 1) });
      out.push({ q: `Month after ${month}?`, a: months[(i + 1) % months.length] });
    });
    out.push(
      { q: 'How many days are in a common year?', a: '365' },
      { q: 'How many days are in a leap year?', a: '366' },
      { q: 'How many months are in a year?', a: '12' },
      { q: 'How many days are in a week?', a: '7' },
    );
    return out;
  }

  function moneyCards() {
    const coins = [
      ['penny', 1], ['nickel', 5], ['dime', 10],
      ['quarter', 25], ['half-dollar', 50], ['dollar coin', 100],
    ];
    const out = coins.map(([coin, cents]) => ({ q: `Value of one ${coin}?`, a: `${cents} cent${cents === 1 ? '' : 's'}` }));
    for (const [coin, cents] of coins) {
      for (let count = 1; count <= 10; count++) {
        const total = count * cents;
        out.push({ q: `Value of ${count} ${coin}${count === 1 ? '' : 's'}?`, a: `${total} cent${total === 1 ? '' : 's'}` });
      }
    }
    return out;
  }

  function formatTime(hour, minute) {
    const h = ((hour - 1) % 12) + 1;
    return `${h}:${String(minute).padStart(2, '0')}`;
  }

  function clockCards() {
    return CLOCKS.flatMap(([emoji, hour, minute]) => [
      { q: `Read this clock: ${emoji}`, a: formatTime(hour, minute) },
      { q: `One hour after ${emoji}?`, a: formatTime(hour + 1, minute) },
      { q: `Thirty minutes after ${emoji}?`, a: formatTime(hour + (minute === 30 ? 1 : 0), minute === 30 ? 0 : 30) },
    ]);
  }

  function colorCards() {
    return colorQA(COLORS).concat(
      COLORS.map(([name, hex]) => ({ q: `Which color has hex code ${hex}?`, a: name })),
      [
        { q: 'Traditional paint primary colors?', a: 'Red, yellow, and blue' },
        { q: 'Additive light primary colors?', a: 'Red, green, and blue' },
        { q: 'Mix red and yellow paint.', a: 'Orange' },
        { q: 'Mix blue and yellow paint.', a: 'Green' },
        { q: 'Mix red and blue paint.', a: 'Purple' },
        { q: 'Mix red and white paint.', a: 'Pink' },
        { q: 'Mix black and white.', a: 'Gray' },
        { q: 'A color made by mixing a primary and a neighboring secondary color?', a: 'Tertiary color' },
        { q: 'Colors opposite each other on a color wheel?', a: 'Complementary colors' },
        { q: 'Colors next to each other on a color wheel?', a: 'Analogous colors' },
      ],
    );
  }

  function shapeCards() {
    return shapeQA(SHAPES).concat(SHAPE_FACTS.flatMap(([name, definition, example, structure]) => [
      { q: `Shape clue: ${definition}`, a: name },
      { q: `${name}: basic description?`, a: definition },
      { q: `Everyday example of a ${name.toLowerCase()}?`, a: example },
      { q: `${name}: sides or points?`, a: structure },
    ]));
  }

  function presidentCards() {
    return presidentQA(PRESIDENTS).concat([
      { q: 'Who was the first U.S. President?', a: 'George Washington' },
      { q: 'Which U.S. President served four elected terms?', a: 'Franklin D. Roosevelt' },
      { q: 'Which President issued the Emancipation Proclamation?', a: 'Abraham Lincoln' },
      { q: 'Which President was also Chief Justice of the United States?', a: 'William Howard Taft' },
      { q: 'Which President completed the Louisiana Purchase?', a: 'Thomas Jefferson' },
    ]);
  }

  function translatedCards(lang, translations) {
    return SPANISH.map(([english], i) => ({ q: `${lang}: ${english}`, a: translations[i] }));
  }

  function lessonCards(id) {
    const [subject, records] = LESSON_DECKS[id];
    return lessonQA(subject, records);
  }

  const CATEGORIES = [
    { id: 'early-learning', name: 'Early Learning & Everyday Basics' },
    { id: 'math', name: 'Math' },
    { id: 'life-science-health', name: 'Life Science & Health' },
    { id: 'physical-earth-space', name: 'Physical, Earth & Space Science' },
    { id: 'language-arts', name: 'Language Arts' },
    { id: 'geography-civics', name: 'Geography & Civics' },
    { id: 'history-arts-culture', name: 'History, Arts & Culture' },
    { id: 'world-languages', name: 'World Languages' },
  ];

  function pack(id, name, category, keywords, all) {
    return { id, name, category, keywords: [name].concat(keywords || []), all };
  }

  /* ---------- Packs ---------- */
  const PACKS = [
    pack('colors', 'Colors', 'early-learning', ['colours', 'color', 'colour'], colorCards),
    pack('shapes', 'Shapes', 'early-learning', ['shape', 'basic shapes'], shapeCards),
    pack('animals', 'Animals', 'early-learning', ['animal', 'wildlife', 'creatures'], () => pairQA(ANIMALS)),
    pack('first-words', 'First Words & Sight Words', 'early-learning', ['first words', 'sight words', 'reading'], () => FIRST_WORDS.map(([word, clue]) => ({ q: `Sight word meaning "${clue}"?`, a: word }))),
    pack('opposites', 'Opposites', 'early-learning', ['opposite words'], oppositeCards),
    pack('calendar-time', 'Calendar & Time', 'early-learning', ['calendar', 'days', 'months'], calendarCards),
    pack('money-coins', 'Money & Coins', 'early-learning', ['money', 'coins', 'coin values'], moneyCards),
    pack('telling-time', 'Telling Time with Analog Clocks', 'early-learning', ['telling time', 'analog clocks', 'clock emoji'], clockCards),

    pack('addition', 'Addition Facts', 'math', ['addition', 'add'], additionCards),
    pack('subtraction', 'Subtraction Facts', 'math', ['subtraction', 'subtract'], subtractionCards),
    pack('multiplication', 'Multiplication Tables', 'math', ['multiplication', 'times tables', 'times table', 'multiply', 'maths'], multiplicationCards),
    pack('division', 'Division Facts', 'math', ['division', 'divide'], divisionCards),
    pack('fractions', 'Fractions', 'math', ['fraction', 'equal parts'], fractionCards),
    pack('decimals-percents', 'Decimals & Percents', 'math', ['decimals', 'percent', 'percentages'], decimalPercentCards),
    pack('geometry-measurement', 'Geometry & Measurement', 'math', ['geometry', 'measurement'], () => lessonCards('geometry-measurement')),

    pack('human-body', 'Human Body', 'life-science-health', ['anatomy', 'body systems'], () => lessonCards('human-body')),
    pack('cells', 'Cells', 'life-science-health', ['cell biology', 'organelles'], () => lessonCards('cells')),
    pack('genetics', 'Genetics', 'life-science-health', ['genes', 'dna', 'heredity'], () => lessonCards('genetics')),
    pack('plants', 'Plants', 'life-science-health', ['plant biology', 'botany'], () => lessonCards('plants')),
    pack('animal-classification', 'Animal Classification', 'life-science-health', ['taxonomy', 'vertebrates', 'invertebrates'], () => lessonCards('animal-classification')),
    pack('ecosystems', 'Ecosystems & Food Webs', 'life-science-health', ['ecosystem', 'food webs', 'ecology'], () => lessonCards('ecosystems')),
    pack('health-nutrition', 'Health & Nutrition', 'life-science-health', ['health', 'nutrition', 'nutrients'], () => lessonCards('health-nutrition')),

    pack('elements', 'Chemical Elements', 'physical-earth-space', ['elements', 'periodic table', 'chemistry'], () => elementQA(ELEMENTS)),
    pack('chemistry-basics', 'Chemistry Basics', 'physical-earth-space', ['chemistry', 'atoms', 'molecules'], () => lessonCards('chemistry-basics')),
    pack('physics-basics', 'Physics Basics', 'physical-earth-space', ['physics', 'forces', 'motion'], () => lessonCards('physics-basics')),
    pack('earth-science', 'Earth Science', 'physical-earth-space', ['geology', 'rocks', 'earth'], () => lessonCards('earth-science')),
    pack('weather-climate', 'Weather & Climate', 'physical-earth-space', ['weather', 'climate', 'meteorology'], () => lessonCards('weather-climate')),
    pack('planets', 'Planets & Space', 'physical-earth-space', ['planets', 'planet', 'space', 'solar system', 'astronomy'], () => pairQA(PLANETS)),
    pack('scientific-method', 'Scientific Method', 'physical-earth-space', ['science method', 'experiments'], () => lessonCards('scientific-method')),

    pack('parts-speech', 'Parts of Speech', 'language-arts', ['grammar', 'nouns', 'verbs'], () => lessonCards('parts-speech')),
    pack('grammar', 'Grammar Basics', 'language-arts', ['sentences', 'clauses'], () => lessonCards('grammar')),
    pack('punctuation', 'Punctuation', 'language-arts', ['punctuation marks'], () => lessonCards('punctuation')),
    pack('synonyms-antonyms', 'Synonyms & Antonyms', 'language-arts', ['synonyms', 'antonyms', 'word meanings'], () => lessonCards('synonyms-antonyms')),
    pack('roots-prefixes-suffixes', 'Roots, Prefixes & Suffixes', 'language-arts', ['word roots', 'prefixes', 'suffixes'], () => lessonCards('roots-prefixes-suffixes')),
    pack('commonly-confused', 'Commonly Confused Words', 'language-arts', ['confused words', 'homophones'], () => lessonCards('commonly-confused')),
    pack('literary-terms', 'Literary Terms', 'language-arts', ['literature', 'figurative language'], () => lessonCards('literary-terms')),

    pack('us-capitals', 'US State Capitals', 'geography-civics', ['state capitals', 'us capitals', 'state capital', 'states'], () => capitalQA(US_CAPITALS)),
    pack('world-capitals', 'World Capitals', 'geography-civics', ['capitals', 'capital', 'countries', 'country capitals'], () => capitalQA(WORLD_CAPITALS)),
    pack('world-flags', 'World Flags', 'geography-civics', ['country flags', 'flags', 'flag'], () => flagQA(WORLD_FLAGS)),
    pack('us-civics', 'US Civics Basics', 'geography-civics', ['civics', 'citizenship', 'government'], () => pairQA(CIVICS)),
    pack('us-states-abbreviations', 'US States & Abbreviations', 'geography-civics', ['state abbreviations', 'postal abbreviations'], () => US_STATES.map(([state, abbreviation]) => ({ q: `Postal abbreviation for ${state}?`, a: abbreviation }))),
    pack('continents-landforms', 'Continents, Oceans & Landforms', 'geography-civics', ['continents', 'oceans', 'landforms'], () => lessonCards('continents-landforms')),
    pack('world-landmarks', 'World Landmarks', 'geography-civics', ['landmarks', 'famous places'], () => lessonCards('world-landmarks')),

    pack('us-presidents', 'US Presidents', 'history-arts-culture', ['presidents', 'president', 'potus'], presidentCards),
    pack('early-us-history', 'Early US History', 'history-arts-culture', ['colonial america', 'american revolution'], () => lessonCards('early-us-history')),
    pack('modern-us-history', 'Modern US History', 'history-arts-culture', ['civil war', 'modern america'], () => lessonCards('modern-us-history')),
    pack('ancient-civilizations', 'Ancient Civilizations', 'history-arts-culture', ['ancient history', 'civilizations'], () => lessonCards('ancient-civilizations')),
    pack('world-history', 'World History Milestones', 'history-arts-culture', ['world history', 'history milestones'], () => lessonCards('world-history')),
    pack('inventors-inventions', 'Inventors & Inventions', 'history-arts-culture', ['inventors', 'inventions'], () => lessonCards('inventors-inventions')),
    pack('art-music-terms', 'Art & Music Terms', 'history-arts-culture', ['art terms', 'music terms'], () => lessonCards('art-music-terms')),

    pack('spanish', 'Spanish Vocabulary', 'world-languages', ['spanish', 'español', 'espanol'], () => langQA('Spanish', SPANISH)),
    pack('french', 'French Vocabulary', 'world-languages', ['french', 'français', 'francais'], () => langQA('French', FRENCH)),
    pack('portuguese', 'Portuguese Vocabulary', 'world-languages', ['portuguese', 'português', 'portugues'], () => langQA('Portuguese', PORTUGUESE)),
    pack('german', 'German Vocabulary', 'world-languages', ['german', 'deutsch'], () => translatedCards('German', GERMAN)),
    pack('italian', 'Italian Vocabulary', 'world-languages', ['italian', 'italiano'], () => translatedCards('Italian', ITALIAN)),
    pack('japanese', 'Japanese Vocabulary', 'world-languages', ['japanese', 'nihongo'], () => translatedCards('Japanese', JAPANESE)),
    pack('mandarin', 'Mandarin Vocabulary', 'world-languages', ['mandarin', 'chinese', 'putonghua'], () => translatedCards('Mandarin', MANDARIN)),
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

  window.TOPIC_CATEGORIES = CATEGORIES;
  window.TOPIC_PACKS = PACKS;
  window.TOPIC_MODEL = { categories: CATEGORIES, packs: PACKS };
  window.matchTopic = matchTopic;
})();
