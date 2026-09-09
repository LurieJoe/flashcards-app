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
    ['Arctic tern', 'Known for one of the longest annual migrations of any animal'],
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
    ['Iraq', 'Baghdad'], ['South Africa', 'Pretoria', 'Executive capital of South Africa?'], ['Kenya', 'Nairobi'], ['Nigeria', 'Abuja'],
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
    ['country', 'país'], ['hello', 'olá'], ['goodbye', 'adeus'], ['please', 'por favor'], ['thank you', 'obrigado (masculine speaker) / obrigada (feminine speaker)'],
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
    ['Which dwarf planet, once classified as the ninth planet, lies in the Kuiper Belt?', 'Pluto'],
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
    ['Which planet has Olympus Mons, the largest volcano in the Solar System?', 'Mars'],
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
    ['What is a meteor?', 'A streak of light produced when a meteoroid passes through an atmosphere'],
    ['What is a meteorite?', 'A space rock that reaches the ground'],
    ['What is an exoplanet?', 'A planet orbiting a star beyond the Solar System'],
    ['What is a constellation?', 'A recognized pattern or region of stars in the sky'],
    ['What is the International Space Station?', 'A research laboratory orbiting Earth'],
    ['What was the first artificial satellite?', 'Sputnik 1'],
    ['Who was the first human in space?', 'Yuri Gagarin'],
    ['Which planet rotates on its side with an axial tilt of about 98 degrees?', 'Uranus'],
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
    ['Circle', 'a round closed shape with every boundary point equally far from its center', 'What shape is the flat face of a round coin?', 'no straight sides'],
    ['Square', 'a quadrilateral with four equal sides and four right angles', 'What shape is a floor tile with four equal sides and four right angles?', 'four straight sides'],
    ['Rectangle', 'a quadrilateral with four right angles', 'What shape is a typical door with four right angles?', 'four straight sides'],
    ['Oval', 'a rounded closed shape longer in one direction', 'What shape resembles the two-dimensional outline of an egg?', 'no straight sides'],
    ['Triangle', 'a polygon with three sides', 'What shape is the outline of a yield sign?', 'three straight sides'],
    ['Diamond', 'a common name for a rhombus standing on a point', 'What common shape name describes the suit symbol ♦?', 'four equal straight sides'],
    ['Pentagon', 'a polygon with five sides', 'What shape is the five-sided outline of home plate?', 'five straight sides'],
    ['Hexagon', 'a polygon with six sides', 'What shape is a six-sided honeycomb cell?', 'six straight sides'],
    ['Star', 'a shape with points radiating from a center', 'What shape is represented by a common five-point symbol?', 'five outer points in the common form'],
    ['Heart', 'a symbol shape with two rounded lobes and a lower point', 'What symbol shape has two rounded upper lobes and one lower point?', 'two rounded lobes and one point'],
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
    ['hot', 'cold', 'temperature'], ['big', 'small', 'size'], ['fast', 'slow', 'speed'], ['up', 'down', 'direction'], ['left', 'right', 'direction'],
    ['day', 'night'], ['happy', 'sad'], ['open', 'closed'], ['full', 'empty'], ['wet', 'dry'],
    ['light', 'dark', 'brightness'], ['near', 'far', 'distance'], ['young', 'old', 'age'], ['hard', 'soft', 'texture'], ['early', 'late', 'time'],
    ['inside', 'outside'], ['above', 'below'], ['start', 'finish'], ['push', 'pull'], ['give', 'take'],
    ['smile', 'frown', 'facial expression'], ['quiet', 'loud', 'sound level'], ['clean', 'dirty'], ['thick', 'thin'], ['smooth', 'rough', 'texture'],
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
    'shì de (是的\\; “that’s right”)', 'bù (不\\; used to negate a verb)', 'dà (大)', 'xiǎo (小)', 'rè (热)', 'lěng (冷)', 'gāoxìng (高兴)', 'nánguò (难过)', 'jīntiān (今天)', 'míngtiān (明天)',
  ];

  const LESSON_DECKS = {
    'geometry-measurement': ['Geometry & Measurement', [
      ['Point', 'an exact location with no size', 'Which geometry concept is represented by a labeled dot on a diagram?'],
      ['Line', 'a straight path extending forever in both directions', 'Which geometry concept is drawn through two points with arrows at both ends?'],
      ['Line segment', 'part of a line with two endpoints', 'Which geometry concept is modeled by the straight edge of a ruler?'],
      ['Ray', 'part of a line with one endpoint', 'Which geometry concept is drawn with one endpoint and one arrow?'],
      ['Right angle', 'an angle measuring 90 degrees', 'What kind of angle appears at the corner of a square?'],
      ['Acute angle', 'an angle smaller than 90 degrees', 'What kind of angle measures 45 degrees?'],
      ['Obtuse angle', 'an angle between 90 and 180 degrees', 'What kind of angle measures 120 degrees?'],
      ['Perimeter', 'the distance around a two-dimensional shape', 'Which measurement is found by adding all four sides of a rectangle?'],
      ['Area', 'the amount of surface inside a two-dimensional shape', 'Which measurement of a rectangle is found by multiplying length by width?'],
      ['Volume', 'the space inside a three-dimensional object', 'Which measurement of a rectangular prism is found by multiplying length, width, and height?'],
      ['Centimeter', 'a metric length unit equal to one hundredth of a meter', 'Which metric length unit is about the width of a small fingernail?'],
      ['Kilogram', 'a metric mass unit equal to 1,000 grams', 'Which metric mass unit could describe a small bag of sugar?'],
      ['Liter', 'a metric volume unit equal to one cubic decimeter', 'Which metric volume unit equals one cubic decimeter?'],
    ]],
    'human-body': ['Human Body', [
      ['Brain', 'the organ that coordinates thought, senses, and body activity', 'Which organ interprets sounds and other sensory information?'],
      ['Heart', 'the muscular organ that pumps blood', 'Which organ sends oxygen-rich blood through arteries?'],
      ['Lungs', 'organs that exchange oxygen and carbon dioxide', 'Which organs transfer oxygen into the blood and remove carbon dioxide?'],
      ['Stomach', 'an organ that mixes food with digestive juices', 'Which organ mixes food with digestive juices and begins most protein digestion?'],
      ['Small intestine', 'the organ where most nutrient absorption occurs', 'Which digestive organ absorbs most nutrients, including glucose after a meal?'],
      ['Large intestine', 'the organ that absorbs water and forms solid waste', 'Which digestive organ recovers water and forms solid waste?'],
      ['Liver', 'an organ that processes nutrients and makes bile', 'Which organ makes bile to help digest fats?'],
      ['Kidneys', 'organs that filter blood and make urine', 'Which organs remove urea from the blood and produce urine?'],
      ['Skeleton', 'the framework of bones supporting and protecting the body', 'Which body framework includes the skull that protects the brain?'],
      ['Muscle', 'tissue that contracts to produce movement', 'Which kind of tissue allows the biceps to bend an elbow?'],
      ['Skin', 'the body’s largest organ and protective outer barrier', 'Which organ forms the outer barrier that helps block germs?'],
      ['Artery', 'a blood vessel carrying blood away from the heart', 'What type of blood vessel is the aorta?'],
      ['Vein', 'a blood vessel carrying blood toward the heart', 'What type of blood vessel returns blood from a leg toward the heart?'],
    ]],
    'cells': ['Cells', [
      ['Cell', 'the smallest unit that can carry out all processes of life', 'A bacterium consists of a single example of what basic unit of life?'],
      ['Cell membrane', 'the selective boundary controlling what enters and leaves a cell', 'Which cell boundary selectively lets needed molecules pass?'],
      ['Cytoplasm', 'the gel-like interior where many cell reactions occur', 'What gel-like cell material surrounds the organelles?'],
      ['Nucleus', 'the organelle containing most DNA in a eukaryotic cell', 'Which organelle houses most chromosomes in an animal cell?'],
      ['Mitochondrion', 'an organelle that releases usable energy from food', 'Which organelle produces most ATP during cellular respiration?'],
      ['Ribosome', 'the cell structure that builds proteins', 'Which cell structure joins amino acids to build proteins?'],
      ['Vacuole', 'a storage sac for water, nutrients, or waste', 'Which storage structure is especially large in many plant cells?'],
      ['Cell wall', 'a rigid layer supporting plant, fungal, and many bacterial cells', 'Which rigid cellulose layer surrounds the membrane of a plant cell?'],
      ['Chloroplast', 'the plant-cell organelle where photosynthesis occurs', 'Which organelle uses light energy to make sugar in plant cells?'],
      ['Prokaryote', 'an organism whose cells lack a membrane-bound nucleus', 'What type of organism is a bacterium whose cell lacks a membrane-bound nucleus?'],
      ['Eukaryote', 'an organism whose cells contain a nucleus', 'What type of organism is an oak tree because its cells contain nuclei?'],
      ['Diffusion', 'movement of particles from higher to lower concentration', 'Which process is illustrated by perfume spreading through a room?'],
      ['Osmosis', 'diffusion of water across a selectively permeable membrane', 'Which process moves water into a plant cell across a selectively permeable membrane?'],
    ]],
    'genetics': ['Genetics', [
      ['DNA', 'the molecule that stores hereditary information', 'Which molecule forms a double helix in chromosomes and stores hereditary information?'],
      ['Gene', 'a DNA sequence that helps determine a functional product or trait', 'What DNA unit can influence a trait such as blood type?'],
      ['Chromosome', 'a packaged DNA molecule carrying many genes', 'What packaged DNA structure occurs in 23 pairs in typical human body cells?'],
      ['Allele', 'an alternative version of a gene', 'What genetics term describes a version of a blood-type gene, such as the version for type A?'],
      ['Genotype', 'the allele combination an organism carries', 'What genetics term describes an allele combination such as Bb?'],
      ['Phenotype', 'an observable trait produced by genes and environment', 'What genetics term describes an observable trait such as purple flower color?'],
      ['Dominant allele', 'in a simple dominant-recessive trait, an allele expressed when at least one copy is present', 'In a simple dominant-recessive trait, what type of allele can determine the phenotype in Bb?'],
      ['Recessive allele', 'in a simple dominant-recessive trait, an allele usually expressed only when two copies are present', 'In a simple dominant-recessive trait, what type of allele can determine the phenotype in bb but not Bb?'],
      ['Homozygous', 'having two identical alleles for a gene', 'What term describes an allele pair such as AA or aa?'],
      ['Heterozygous', 'having two different alleles for a gene', 'What term describes an allele pair such as Aa?'],
      ['Mutation', 'a change in a DNA sequence', 'What genetics term describes one DNA base being replaced by another?'],
      ['Heredity', 'the passing of traits from parents to offspring', 'What process is illustrated when a child inherits a blood-type allele from a parent?'],
      ['Punnett square', 'a diagram used to predict possible allele combinations', 'What diagram uses boxes to predict the outcomes of a monohybrid cross?'],
    ]],
    'plants': ['Plants', [
      ['Root', 'the plant organ that anchors the plant and absorbs water and minerals', 'Which plant organ forms the underground part of a carrot?'],
      ['Stem', 'the organ that supports leaves and transports materials', 'Which plant organ is represented by a sunflower stalk?'],
      ['Leaf', 'the main plant organ for photosynthesis', 'Which plant organ is broad and flat on a maple tree and captures light?'],
      ['Flower', 'the reproductive structure of angiosperms', 'What plant structure is an apple blossom?'],
      ['Fruit', 'a mature ovary that contains seeds', 'Botanically, what plant structure is a tomato?'],
      ['Seed', 'a plant embryo with stored food and a protective coat', 'What plant structure is a bean before it germinates?'],
      ['Photosynthesis', 'the process using light to make sugar from carbon dioxide and water', 'Which process occurs when a leaf uses sunlight to produce glucose?'],
      ['Chlorophyll', 'the green pigment that absorbs light for photosynthesis', 'Which green pigment inside chloroplasts absorbs light?'],
      ['Xylem', 'vascular tissue carrying water and minerals upward', 'Which vascular tissue carries water from roots toward leaves?'],
      ['Phloem', 'vascular tissue transporting sugars through a plant', 'Which vascular tissue can move sugar from a leaf to a root?'],
      ['Pollination', 'the transfer of pollen to a flower’s female reproductive part', 'Which process occurs when a bee carries pollen between flowers?'],
      ['Germination', 'the beginning of growth from a seed', 'Which process begins when a seed sends out its first root?'],
      ['Transpiration', 'the loss of water vapor from plant leaves', 'Which process releases water vapor from leaves through stomata?'],
    ]],
    'animal-classification': ['Animal Classification', [
      ['Vertebrate', 'an animal with a backbone', 'A trout belongs to which broad animal group because it has a backbone?'],
      ['Invertebrate', 'an animal without a backbone', 'An earthworm belongs to which broad animal group because it lacks a backbone?'],
      ['Mammal', 'a vertebrate with hair that feeds milk to its young', 'A dolphin belongs to which vertebrate class whose females produce milk?'],
      ['Bird', 'a feathered vertebrate that lays amniotic eggs', 'An eagle belongs to which feathered vertebrate class?'],
      ['Reptile', 'an ectothermic vertebrate with dry scales', 'A snake belongs to which ectothermic vertebrate class with dry scales?'],
      ['Amphibian', 'a vertebrate with a life cycle often split between water and land', 'A frog belongs to which vertebrate class whose life cycle often spans water and land?'],
      ['Fish', 'an aquatic vertebrate with gills and fins', 'A salmon belongs to which aquatic vertebrate group with gills and fins?'],
      ['Arthropod', 'an invertebrate with an exoskeleton and jointed legs', 'A crab belongs to which broad invertebrate group with an exoskeleton and jointed legs?'],
      ['Insect', 'an arthropod with six legs and three main body sections', 'A beetle belongs to which arthropod class with six legs and three main body sections?'],
      ['Arachnid', 'an arthropod with eight legs and two main body sections', 'A spider belongs to which arthropod class with eight legs and two main body sections?'],
      ['Mollusk', 'a soft-bodied invertebrate, often with a shell', 'A snail belongs to which soft-bodied invertebrate group?'],
      ['Annelid', 'a segmented worm', 'An earthworm belongs to which phylum of segmented worms?'],
      ['Cnidarian', 'an aquatic invertebrate with stinging cells', 'A jellyfish belongs to which aquatic invertebrate phylum with stinging cells?'],
    ]],
    'ecosystems': ['Ecosystems & Food Webs', [
      ['Ecosystem', 'organisms interacting with one another and their environment', 'Which ecological level includes a pond community together with its water, soil, and light?'],
      ['Habitat', 'the place where an organism lives', 'What ecological term describes a hollow tree used as an owl’s home?'],
      ['Population', 'members of one species living in one area', 'What ecological group consists of all deer living in one forest?'],
      ['Community', 'all interacting populations in an area', 'What ecological level includes the plants, animals, fungi, and microbes interacting in a meadow?'],
      ['Producer', 'an organism that makes its own food', 'What role does grass have in a food web when it uses photosynthesis?'],
      ['Consumer', 'an organism that gets energy by eating other organisms', 'What role does a rabbit have in a food web when it eats grass?'],
      ['Decomposer', 'an organism that breaks down dead matter and waste', 'What role does a fungus have when it breaks down a fallen log?'],
      ['Food chain', 'a single pathway of energy transfer through feeding', 'What term describes the single pathway grass → grasshopper → frog?'],
      ['Food web', 'a network of connected food chains', 'What term describes several connected feeding paths among predators and prey in a marsh?'],
      ['Predator', 'an animal that hunts another animal for food', 'What feeding role does an owl have when it catches a mouse?'],
      ['Prey', 'an animal hunted by a predator', 'What feeding role does a mouse have when an owl hunts it?'],
      ['Biotic factor', 'a living part of an ecosystem', 'What kind of ecosystem factor is a living tree?'],
      ['Abiotic factor', 'a nonliving part of an ecosystem', 'What kind of ecosystem factor is sunlight?'],
    ]],
    'health-nutrition': ['Health & Nutrition', [
      ['Carbohydrate', 'a nutrient that is a major source of readily available energy', 'Which energy-providing nutrient is abundant in foods such as oats?'],
      ['Protein', 'a nutrient used to build and repair body tissues', 'Which tissue-building nutrient is found in foods such as beans?'],
      ['Fat', 'a concentrated energy source that also supports cells and vitamin absorption', 'Which concentrated energy nutrient is found in foods such as avocado?'],
      ['Vitamin', 'an organic nutrient needed in small amounts for normal body functions', 'What nutrient category includes C, which oranges provide?'],
      ['Mineral', 'an inorganic nutrient needed for body structure or processes', 'What nutrient category includes calcium found in milk?'],
      ['Fiber', 'plant material that supports healthy digestion', 'Which nondigestible plant material in whole grains supports healthy digestion?'],
      ['Hydration', 'maintaining enough water for normal body function', 'What health practice is supported by drinking water during exercise?'],
      ['Balanced diet', 'a varied eating pattern supplying needed nutrients and energy', 'What eating pattern includes varied fruits, vegetables, grains, protein foods, and dairy or alternatives?'],
      ['Aerobic exercise', 'activity that raises heart rate and breathing for a sustained time', 'What type of exercise is brisk walking that raises heart rate for a sustained time?'],
      ['Strength exercise', 'activity that makes muscles work against resistance', 'What type of exercise is represented by bodyweight squats?'],
      ['Sleep', 'a recurring period of rest important for recovery and learning', 'What form of rest is supported by following a regular bedtime?'],
      ['Food safety', 'practices that reduce foodborne illness', 'What set of practices includes washing hands before preparing food?'],
      ['Serving size', 'a standardized amount used on a nutrition label', 'What nutrition-label term names the standardized amount listed beside calories?'],
    ]],
    'chemistry-basics': ['Chemistry Basics', [
      ['Atom', 'the smallest unit of an element retaining that element’s properties', 'What chemistry term describes one helium unit that still has helium’s properties?'],
      ['Molecule', 'two or more atoms chemically bonded', 'What chemistry term describes O2, in which two oxygen atoms are bonded?'],
      ['Compound', 'a substance made of two or more elements chemically combined', 'What type of substance is H2O because it contains hydrogen and oxygen chemically combined?'],
      ['Element', 'a pure substance made of one kind of atom', 'What type of pure substance is gold because it contains one kind of atom?'],
      ['Proton', 'a positively charged particle in an atomic nucleus', 'Which positively charged nuclear particle determines an element’s atomic number?'],
      ['Neutron', 'an uncharged particle in an atomic nucleus', 'Which uncharged nuclear particle is present in carbon-12?'],
      ['Electron', 'a negatively charged particle found around an atomic nucleus', 'Which negatively charged particle can take part in a chemical bond?'],
      ['Ion', 'an atom or molecule with a net electric charge', 'What chemistry term describes Na+ because it has a net electric charge?'],
      ['Chemical bond', 'an attraction holding atoms together', 'What attraction holds oxygen and hydrogen atoms together in water?'],
      ['Reactant', 'a starting substance in a chemical reaction', 'What role does hydrogen have before it reacts with oxygen?'],
      ['Product', 'a substance formed by a chemical reaction', 'What role does water have when it is formed from reacting hydrogen and oxygen?'],
      ['Acid', 'a substance that donates hydrogen ions or increases them in water', 'What type of substance is the sour compound in citrus fruit based on its hydrogen-ion behavior?'],
      ['Base', 'a substance that accepts hydrogen ions or increases hydroxide ions in water', 'What type of substance is sodium hydroxide based on its hydroxide-ion behavior?'],
    ]],
    'physics-basics': ['Physics Basics', [
      ['Force', 'a push or pull that can change motion', 'What physics term describes a push applied to a cart?'],
      ['Motion', 'a change in position over time', 'What physics term describes a bicycle changing position as it travels down a road?'],
      ['Speed', 'distance traveled per unit of time', 'Which rate could be measured as 60 kilometers per hour without specifying direction?'],
      ['Velocity', 'speed in a specified direction', 'Which quantity could be stated as 20 meters per second north?'],
      ['Acceleration', 'the rate at which velocity changes', 'Which quantity changes when a car speeds up?'],
      ['Mass', 'the amount of matter in an object', 'Which property of a rock could be measured as two kilograms?'],
      ['Weight', 'the gravitational force on an object', 'Which force-related quantity produces a scale reading because of gravity?'],
      ['Gravity', 'the attraction between objects with mass', 'Which force pulls a dropped ball toward Earth?'],
      ['Friction', 'a force opposing motion between surfaces', 'Which force helps bicycle brakes slow a wheel?'],
      ['Energy', 'the capacity to do work or cause change', 'What is stored in a stretched spring and can cause change?'],
      ['Work', 'energy transferred when a force moves an object through a distance', 'What physics quantity occurs when a force lifts a box onto a shelf?'],
      ['Power', 'the rate at which work is done or energy is transferred', 'Which quantity is greater when the same lifting job is completed in less time?'],
      ['Simple machine', 'a device that changes the size or direction of a force', 'What category of device includes a lever?'],
    ]],
    'earth-science': ['Earth Science', [
      ['Crust', 'Earth’s thin outer solid layer', 'Which Earth layer contains the continents and ocean floor?'],
      ['Mantle', 'the thick layer of hot rock beneath Earth’s crust', 'Which Earth layer contains slowly moving hot rock that helps drive plate motion?'],
      ['Outer core', 'Earth’s liquid iron-rich layer surrounding the inner core', 'Which liquid iron-rich Earth layer helps generate the magnetic field?'],
      ['Inner core', 'Earth’s solid iron-rich center', 'Which Earth layer is the hot, solid, iron-rich center?'],
      ['Mineral', 'a naturally occurring inorganic solid with a definite composition and structure', 'What Earth-science category does quartz belong to?'],
      ['Rock', 'a solid mixture of one or more minerals or mineral-like materials', 'What Earth-science category does granite belong to?'],
      ['Igneous rock', 'rock formed when magma or lava cools', 'What type of rock is basalt, which forms from cooled magma or lava?'],
      ['Sedimentary rock', 'rock formed from compacted sediments or chemical deposits', 'What type of rock is sandstone, which forms from sediments?'],
      ['Metamorphic rock', 'rock changed by heat, pressure, or fluids without melting', 'What type of rock is marble, which forms when existing rock is changed by heat and pressure?'],
      ['Plate tectonics', 'the theory that Earth’s lithosphere is divided into moving plates', 'Which theory explains plates separating at a mid-ocean ridge?'],
      ['Earthquake', 'ground shaking caused by sudden energy release in Earth’s crust', 'What event can result from sudden movement along a fault?'],
      ['Volcano', 'an opening where magma, gas, and ash reach the surface', 'What kind of geologic feature is Mount Etna?'],
      ['Erosion', 'the transport of weathered material', 'Which process occurs when a river carries sediment downstream?'],
    ]],
    'weather-climate': ['Weather & Climate', [
      ['Weather', 'short-term atmospheric conditions at a place and time', 'Which term covers today’s rain, wind, and temperature at one place?'],
      ['Climate', 'the long-term pattern of weather in a region', 'Which term describes a region’s long-term pattern of hot, dry summers?'],
      ['Temperature', 'a measure of how hot or cold something is', 'Which atmospheric measurement could be reported as 20 degrees Celsius?'],
      ['Air pressure', 'the force exerted by the weight of air', 'Which atmospheric quantity is measured with a barometer?'],
      ['Humidity', 'the amount of water vapor in the air', 'Which atmospheric quantity is high when the air feels muggy?'],
      ['Precipitation', 'water falling from the atmosphere', 'What general weather term includes rain falling from clouds?'],
      ['Wind', 'air moving from higher pressure toward lower pressure', 'What term describes moving air such as a sea breeze?'],
      ['Cloud', 'visible droplets or ice crystals suspended in the atmosphere', 'What atmospheric feature is a cumulus formation?'],
      ['Cold front', 'the boundary where advancing cold air replaces warmer air', 'Which boundary can bring a line of storms followed by cooler air?'],
      ['Warm front', 'the boundary where advancing warm air rises over cooler air', 'Which boundary can bring steady rain before warmer air arrives?'],
      ['Thunderstorm', 'a storm producing lightning and thunder', 'What kind of storm includes a cumulonimbus cloud, lightning, and thunder?'],
      ['Tornado', 'a violently rotating column of air touching the ground', 'What weather event is a rotating funnel that extends from a storm to the ground?'],
      ['Hurricane', 'a powerful tropical cyclone with sustained rotating winds', 'What term is used for a powerful named Atlantic tropical cyclone?'],
    ]],
    'scientific-method': ['Scientific Method', [
      ['Observation', 'information gathered with senses or instruments', 'Which scientific-method step is illustrated by noting that a plant near a window grows faster?'],
      ['Question', 'a testable problem prompted by observation', 'Which scientific-method step asks whether light duration affects plant growth?'],
      ['Hypothesis', 'a testable proposed explanation or prediction', 'Which scientific-method step proposes, “If light time increases, then the plant will grow taller”?'],
      ['Experiment', 'a controlled procedure used to test a hypothesis', 'Which scientific-method step grows similar plants under different light durations?'],
      ['Independent variable', 'the factor deliberately changed in an experiment', 'In a plant-growth test, what variable is the number of light-hours deliberately changed each day?'],
      ['Dependent variable', 'the measured response in an experiment', 'In a plant-growth test, what variable is the measured plant height?'],
      ['Controlled variable', 'a factor kept the same for a fair test', 'What type of variable is the amount of water when every plant receives the same amount?'],
      ['Control group', 'a comparison group not receiving the tested change', 'What group contains plants kept under the usual light schedule for comparison?'],
      ['Data', 'recorded observations or measurements', 'What scientific-method term describes a table of measured plant heights?'],
      ['Analysis', 'examining data for patterns and meaning', 'Which scientific-method step includes calculating average growth from the measurements?'],
      ['Conclusion', 'a statement explaining what the results show', 'Which scientific-method step states whether the results support the light-growth hypothesis?'],
      ['Replication', 'repeating a study to check whether results are consistent', 'What process occurs when another class repeats the same experiment?'],
      ['Peer review', 'evaluation of scientific work by other experts', 'What process occurs when other researchers evaluate a study before publication?'],
    ]],
    'parts-speech': ['Parts of Speech', [
      ['Noun', 'a word naming a person, place, thing, or idea', 'What part of speech is “river” when it names a thing?'],
      ['Pronoun', 'a word used in place of a noun', 'What part of speech is “they” when it replaces a noun?'],
      ['Verb', 'a word expressing action or a state of being', 'What part of speech is “jump” when it expresses an action?'],
      ['Adjective', 'a word describing a noun or pronoun', 'What part of speech is “bright” when it describes a noun?'],
      ['Adverb', 'a word that tells how, when, where, or to what degree', 'What part of speech is “quickly” when it modifies a verb?'],
      ['Preposition', 'a word showing a relationship in space, time, or direction', 'What part of speech is “under” when it shows a spatial relationship?'],
      ['Conjunction', 'a word joining words, phrases, or clauses', 'What general part of speech is “and” when it joins words or clauses?'],
      ['Interjection', 'a word or phrase expressing sudden feeling', 'What part of speech is “Wow!” when it expresses sudden feeling?'],
      ['Article', 'a word marking a noun as specific or nonspecific', 'What part of speech is “the” when it introduces a specific noun?'],
      ['Proper noun', 'the specific name of a person, place, or organization', 'What kind of noun is “Lake Erie”?'],
      ['Common noun', 'a general name for a person, place, thing, or idea', 'What kind of noun is “city”?'],
      ['Helping verb', 'a verb used with a main verb to express time, possibility, or voice', 'What role does “has” play in the verb phrase “has finished”?'],
      ['Coordinating conjunction', 'a conjunction joining grammatically equal elements', 'What specific kind of conjunction is “but” when it joins equal clauses?'],
    ]],
    'grammar': ['Grammar Basics', [
      ['Subject', 'the sentence part naming who or what the sentence is about', 'In “The dog barked,” what sentence part is “The dog”?'],
      ['Predicate', 'the sentence part telling what the subject does or is', 'In “The dog barked,” what sentence part is “barked”?'],
      ['Sentence', 'a complete thought with a subject and predicate', 'What general grammar term describes “Birds fly.” as a complete thought?'],
      ['Fragment', 'an incomplete group of words presented as a sentence', 'What grammar error is “Because the rain stopped.” when no independent clause follows?'],
      ['Run-on sentence', 'two or more independent clauses joined incorrectly', 'What grammar error appears in “I ran home I ate lunch”?'],
      ['Independent clause', 'a group of words with a subject and verb that can stand alone', 'What kind of clause is “The bell rang” because it can stand alone?'],
      ['Dependent clause', 'a subject-verb group that cannot stand alone as a sentence', 'What kind of clause is “because the bell rang”?'],
      ['Simple sentence', 'a sentence with one independent clause', 'What sentence type is “The child laughed”?'],
      ['Compound sentence', 'a sentence with two or more independent clauses', 'What sentence type is “The child laughed, and the dog barked”?'],
      ['Subject-verb agreement', 'matching a subject and verb in number', 'Which grammar rule is demonstrated by “She runs, but they run”?'],
      ['Verb tense', 'the verb form showing when an action occurs', 'Which grammar feature makes “walked” refer to past time?'],
      ['Active voice', 'a construction in which the subject performs the action', 'Which voice is used in “Maya kicked the ball”?'],
      ['Passive voice', 'a construction in which the subject receives the action', 'Which voice is used in “The ball was kicked by Maya”?'],
    ]],
    'punctuation': ['Punctuation', [
      ['Period', 'a mark ending a statement or mild command', 'Which mark should end the statement “The class begins now”?'],
      ['Question mark', 'a mark ending a direct question', 'Which mark should end the direct question “Where is the library”?'],
      ['Exclamation point', 'a mark showing strong feeling or emphasis', 'Which mark should end the urgent warning “Watch out”?'],
      ['Comma', 'a mark separating items or sentence elements', 'Which mark separates the items in “food, water, and maps”?'],
      ['Semicolon', 'a mark joining closely related independent clauses', 'Which mark can join “The rain ended” and “the game resumed” without a conjunction?'],
      ['Colon', 'a mark introducing a list, explanation, or example', 'Which mark introduces the list in “Bring three items: paper, tape, and scissors”?'],
      ['Apostrophe', 'a mark showing possession or omitted letters', 'Which mark shows possession in “the dog’s leash”?'],
      ['Quotation marks', 'marks enclosing direct speech or quoted words', 'Which marks enclose “Hello” in the sentence “She said, ‘Hello’”?'],
      ['Parentheses', 'marks enclosing extra or clarifying information', 'Which marks enclose the extra information in “The trail (opened in May) is popular”?'],
      ['Hyphen', 'a mark joining parts of a compound word', 'Which mark joins the words in “well-known author”?'],
      ['Dash', 'a mark setting off an interruption or emphasis', 'Which mark sets off “after a long pause” in “The answer—after a long pause—was yes”?'],
      ['Ellipsis', 'three dots showing omitted words or a trailing thought', 'Which mark creates the trailing pause in “I wonder…”?'],
      ['Slash', 'a mark showing alternatives, fractions, or line breaks', 'Which mark shows alternatives in “and/or”?'],
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
      ['bio-', 'a Greek root or combining form meaning life', 'Which root meaning “life” appears in “biology”?'],
      ['geo-', 'a Greek root or combining form meaning earth', 'Which root meaning “earth” appears in “geography”?'],
      ['tele-', 'a Greek root or prefix meaning distant', 'Which root or prefix meaning “distant” appears in “telephone”?'],
      ['micro-', 'a prefix meaning small', 'Which prefix meaning “small” appears in “microscope”?'],
      ['pre-', 'a prefix meaning before', 'Which prefix meaning “before” appears in “preview”?'],
      ['re-', 'a prefix meaning again or back', 'Which prefix meaning “again” appears in “rewrite”?'],
      ['un-', 'a prefix meaning not or the reverse of', 'Which prefix meaning “not” appears in “unhappy”?'],
      ['inter-', 'a prefix meaning between or among', 'Which prefix meaning “between or among” appears in “international”?'],
      ['-ful', 'a suffix meaning full of', 'Which suffix meaning “full of” appears in “helpful”?'],
      ['-less', 'a suffix meaning without', 'Which suffix meaning “without” appears in “careless”?'],
      ['-ology', 'a suffix meaning the study of', 'Which suffix meaning “the study of” appears in “geology”?'],
      ['-ist', 'a suffix meaning a person who practices or specializes in something', 'Which suffix naming a practitioner or specialist appears in “artist”?'],
      ['-able', 'a suffix meaning capable of being', 'Which suffix meaning “capable of being” appears in “washable”?'],
    ]],
    'commonly-confused': ['Commonly Confused Words', [
      ['their / there / they’re', 'their shows possession\\; there refers to a place\\; they’re means they are', 'Their dog is over there, and they’re calling it.'],
      ['your / you’re', 'your shows possession\\; you’re means you are', 'You’re wearing your new coat.'],
      ['its / it’s', 'its shows possession\\; it’s means it is or it has', 'It’s a bird protecting its nest.'],
      ['to / too / two', 'to marks direction or an infinitive\\; too means also or excessive\\; two is a number', 'The two hikers went to the lake too.'],
      ['than / then', 'than makes a comparison\\; then refers to time or consequence', 'She is taller than I am\\; then we measured again.'],
      ['affect / effect', 'affect is usually a verb meaning influence\\; effect is usually a noun meaning result', 'Rain can affect traffic, and delay is one effect.'],
      ['accept / except', 'accept means receive or agree\\; except means excluding', 'Everyone except Lee will accept the award.'],
      ['principal / principle', 'principal can mean leader or main\\; principle means a rule or belief', 'The principal explained the guiding principle.'],
      ['lose / loose', 'lose means misplace or fail to win\\; loose means not tight', 'Do not lose the loose button.'],
      ['weather / whether', 'weather is atmospheric conditions\\; whether introduces alternatives', 'We wondered whether the weather would improve.'],
      ['complement / compliment', 'complement completes or pairs well\\; compliment is praise', 'The scarf complements the coat, and I complimented its designer.'],
      ['stationary / stationery', 'stationary means not moving\\; stationery is writing paper', 'The stationary bicycle stood beside the stationery.'],
      ['who / whom', 'who acts as a subject\\; whom acts as an object', 'Who called, and whom did you call?'],
    ]],
    'literary-terms': ['Literary Terms', [
      ['Plot', 'the sequence of events in a story', 'Which literary term covers a mystery’s sequence from first clue to solution?'],
      ['Setting', 'the time and place of a story', 'Which literary term is established by describing a village during winter?'],
      ['Character', 'a person, animal, or figure in a story', 'What general literary term describes a detective who takes part in a mystery?'],
      ['Protagonist', 'the central character whose goals drive the story', 'Which literary role fits the central hero seeking a lost map?'],
      ['Antagonist', 'the force opposing the protagonist', 'Which literary role fits a rival who blocks the central hero?'],
      ['Theme', 'a central idea explored by a work', 'Which literary term describes a work’s central idea about perseverance?'],
      ['Conflict', 'the struggle between opposing forces', 'Which literary term is illustrated by a character struggling against nature?'],
      ['Point of view', 'the perspective from which a story is told', 'Which literary term identifies first-person narration using “I”?'],
      ['Metaphor', 'a direct comparison saying one thing is another', 'Which figure of speech appears in “Time is a thief”?'],
      ['Simile', 'a comparison using like or as', 'Which figure of speech appears in “The water shone like glass”?'],
      ['Personification', 'giving human qualities to something nonhuman', 'Which figure of speech appears in “The wind whispered”?'],
      ['Foreshadowing', 'a hint about what may happen later', 'Which literary technique is used when dark clouds hint at a later disaster?'],
      ['Irony', 'a contrast between expectation and reality', 'Which literary concept is illustrated by a fire station catching fire?'],
    ]],
    'continents-landforms': ['Continents, Oceans & Landforms', [
      ['Africa', 'the continent crossed by both the equator and prime meridian', 'On which continent is the Sahara located?'],
      ['Antarctica', 'the ice-covered continent surrounding the South Pole', 'Which continent is the coldest and surrounds the South Pole?'],
      ['Asia', 'the largest continent by area', 'On which continent are the Himalayas located?'],
      ['Europe', 'the continent west of Asia and north of Africa', 'On which continent are the Alps located?'],
      ['North America', 'the continent containing Canada, the United States, Mexico, and other countries', 'On which continent are the Great Lakes located?'],
      ['South America', 'the continent containing the Amazon Basin and Andes', 'On which continent is Brazil located?'],
      ['Australia', 'the smallest continent by land area', 'On which continent is the Great Dividing Range located?'],
      ['Pacific Ocean', 'the largest and deepest ocean', 'Which ocean lies between Asia and the Americas and is the world’s largest?'],
      ['Atlantic Ocean', 'the ocean between the Americas and Europe and Africa', 'Which ocean contains the Mid-Atlantic Ridge?'],
      ['Mountain', 'a landform rising prominently above surrounding land', 'What type of landform is Mount Everest?'],
      ['Plateau', 'a broad elevated area with a relatively flat top', 'What type of landform is the broad, elevated Tibetan region?'],
      ['Valley', 'a low area between hills or mountains', 'What type of landform is a low area carved by a river between higher ground?'],
      ['Delta', 'sediment-built land at a river’s mouth', 'What type of landform is built from sediment at the mouth of the Nile?'],
    ]],
    'world-landmarks': ['World Landmarks', [
      ['Great Wall of China', 'a network of historic fortifications across northern China', 'Which landmark includes historic walls and watchtowers across northern China?'],
      ['Pyramids of Giza', 'ancient Egyptian monumental tombs near Cairo', 'Which landmark group includes the Great Pyramid near Cairo?'],
      ['Machu Picchu', 'an Inca site high in the Andes of Peru', 'Which Inca landmark has stone terraces above Peru’s Urubamba Valley?'],
      ['Taj Mahal', 'a white-marble mausoleum in Agra, India', 'Which white-marble landmark in Agra was built by Shah Jahan?'],
      ['Colosseum', 'an ancient Roman amphitheater in Rome', 'At which Roman landmark were gladiatorial contests held?'],
      ['Eiffel Tower', 'an iron lattice tower in Paris', 'Which Paris landmark was built for the 1889 exposition?'],
      ['Statue of Liberty', 'a monument in New York Harbor symbolizing liberty', 'Which copper monument in New York Harbor was gifted by France?'],
      ['Sydney Opera House', 'a performing arts center with sail-like roofs in Sydney', 'Which Australian landmark has sail-like roofs beside Sydney Harbour?'],
      ['Christ the Redeemer', 'a large statue of Jesus overlooking Rio de Janeiro', 'Which landmark statue stands atop Corcovado above Rio de Janeiro?'],
      ['Petra', 'an ancient city carved into rock in Jordan', 'Which Jordanian landmark includes the rock-cut Treasury facade?'],
      ['Angkor Wat', 'a vast temple complex in Cambodia', 'Which Khmer temple complex appears on Cambodia’s flag?'],
      ['Chichén Itzá', 'a major Maya archaeological site in Mexico', 'Which Maya landmark in Mexico includes the El Castillo pyramid?'],
      ['Stonehenge', 'a prehistoric stone circle in southern England', 'Which prehistoric English landmark consists of large standing stones arranged in rings?'],
    ]],
    'early-us-history': ['Early US History', [
      ['Jamestown', 'the first permanent English settlement in what became the United States', 'Which settlement was founded in Virginia in 1607 as the first permanent English settlement in what became the United States?'],
      ['Mayflower Compact', 'an agreement for self-government signed by Plymouth settlers', 'Which self-government agreement did Plymouth settlers sign in 1620?'],
      ['Thirteen Colonies', 'the British colonies that declared independence in 1776', 'What collective name covers Virginia, Massachusetts, and the eleven other British colonies that declared independence?'],
      ['French and Indian War', 'the North American conflict that preceded the American Revolution', 'Which North American war involved British and French competition from 1754 to 1763?'],
      ['Boston Tea Party', 'a 1773 protest against British tea policy', 'Which 1773 protest involved dumping tea into Boston Harbor?'],
      ['Declaration of Independence', 'the document announcing the colonies’ separation from Britain', 'Which founding document was adopted on July 4, 1776?'],
      ['American Revolution', 'the war in which the colonies won independence from Britain', 'Which conflict lasted from 1775 to 1783 and won the colonies independence from Britain?'],
      ['Articles of Confederation', 'the first national governing framework of the United States', 'Which governing framework created a weak central government before the Constitution?'],
      ['Constitutional Convention', 'the 1787 meeting that drafted the U.S. Constitution', 'At which 1787 Philadelphia meeting did delegates draft the U.S. Constitution?'],
      ['Louisiana Purchase', 'the 1803 U.S. acquisition of a vast territory from France', 'Which 1803 acquisition from France roughly doubled the size of the United States?'],
      ['Lewis and Clark Expedition', 'the expedition that explored the Louisiana Purchase and routes west', 'Which 1804–1806 journey by the Corps of Discovery explored routes west?'],
      ['War of 1812', 'a war between the United States and Britain from 1812 to 1815', 'During which U.S.–British war did the defense of Fort McHenry occur?'],
      ['Monroe Doctrine', 'the 1823 policy opposing new European colonization in the Americas', 'Which 1823 policy warned against further European colonization in the Americas?'],
    ]],
    'modern-us-history': ['Modern US History', [
      ['Civil War', 'the 1861–1865 war between the United States and seceded Confederate states', 'During which 1861–1865 conflict was the Battle of Gettysburg fought?'],
      ['Emancipation Proclamation', 'the 1863 order declaring enslaved people free in areas in rebellion', 'Which 1863 order did Abraham Lincoln issue concerning enslaved people in areas in rebellion?'],
      ['Reconstruction', 'the post-Civil War effort to rebuild the South and define freedom and citizenship', 'Which postwar period included the ratification of the 14th Amendment?'],
      ['Industrialization', 'the growth of machine production and large-scale industry', 'What process drove rapid U.S. factory growth in the late 1800s?'],
      ['Progressive Era', 'a reform period addressing problems linked to industrialization and urban growth', 'Which reform period produced major food-safety and voting reforms?'],
      ['Great Migration', 'the movement of millions of Black Americans from the South to other regions', 'What movement brought millions of Black Americans from the South to northern and western cities?'],
      ['World War I', 'the global conflict fought from 1914 to 1918', 'Which global war did the United States enter in 1917?'],
      ['Great Depression', 'the severe economic downturn beginning in 1929', 'Which economic crisis caused widespread unemployment during the 1930s?'],
      ['New Deal', 'federal programs and reforms responding to the Great Depression', 'Which policy program included Social Security and public works during the 1930s?'],
      ['World War II', 'the global conflict fought from 1939 to 1945', 'Which global war did the United States enter after the attack on Pearl Harbor?'],
      ['Civil Rights Movement', 'the movement seeking equal rights and an end to racial segregation', 'Which movement included the Montgomery Bus Boycott?'],
      ['Cold War', 'the prolonged geopolitical rivalry between the United States and Soviet Union', 'During which U.S.–Soviet rivalry did the Cuban Missile Crisis occur?'],
      ['September 11 attacks', 'the 2001 terrorist attacks in New York, Virginia, and Pennsylvania', 'Which terrorist attacks occurred in New York, Virginia, and Pennsylvania on September 11, 2001?'],
    ]],
    'ancient-civilizations': ['Ancient Civilizations', [
      ['Mesopotamia', 'an ancient region between the Tigris and Euphrates rivers', 'In which ancient region did Sumerian city-states develop between the Tigris and Euphrates?'],
      ['Sumer', 'one of the earliest urban civilizations in southern Mesopotamia', 'Which early Mesopotamian civilization developed cuneiform writing?'],
      ['Babylon', 'a major Mesopotamian city and empire', 'Which Mesopotamian city and empire is associated with the Code of Hammurabi?'],
      ['Ancient Egypt', 'a civilization centered on the Nile River', 'Which Nile-centered civilization built pyramids and used hieroglyphs?'],
      ['Indus Valley Civilization', 'an early urban civilization in South Asia', 'Which early South Asian civilization built planned cities such as Mohenjo-daro?'],
      ['Shang dynasty', 'an early Chinese dynasty known from written and archaeological records', 'Which early Chinese dynasty left written records on oracle bones?'],
      ['Ancient Greece', 'a Mediterranean civilization of independent city-states', 'Which Mediterranean civilization included the city-states Athens and Sparta?'],
      ['Roman Republic', 'the period when Rome was governed by elected officials and a senate', 'What period of Roman government came before the empire and used elected officials and a senate?'],
      ['Roman Empire', 'the vast state ruled from Rome and later Constantinople', 'Which ancient state built roads and aqueducts across the Mediterranean and was ruled from Rome and later Constantinople?'],
      ['Maya civilization', 'a Mesoamerican civilization known for cities, writing, and astronomy', 'Which Mesoamerican civilization built the city of Tikal?'],
      ['Aztec Empire', 'a Mesoamerican empire centered on Tenochtitlan', 'Which Mesoamerican empire centered on Tenochtitlan used chinampa farming?'],
      ['Inca Empire', 'an Andean empire connected by roads', 'Which Andean empire built a road network and included Machu Picchu?'],
      ['Phoenicians', 'an eastern Mediterranean people known for seafaring and trade', 'Which seafaring eastern Mediterranean people used an alphabet that influenced Greek writing?'],
    ]],
    'world-history': ['World History Milestones', [
      ['Agricultural Revolution', 'the shift from hunting and gathering toward farming', 'Which major shift led to farming and permanent villages after plant domestication?'],
      ['Silk Roads', 'trade networks connecting East Asia, Central Asia, the Middle East, and Europe', 'Which trade networks carried silk and ideas across Eurasia?'],
      ['Magna Carta', 'the 1215 English charter limiting royal power in specific ways', 'Which 1215 English charter supported the principle that a ruler is subject to law?'],
      ['Renaissance', 'a period of renewed art, learning, and humanism in Europe', 'Which European cultural period included the work of Leonardo da Vinci?'],
      ['Printing press', 'a technology that greatly increased the speed of reproducing texts', 'Which technology used movable type to reproduce texts rapidly in 15th-century Europe?'],
      ['Reformation', 'the 16th-century movement that divided western Christianity', 'Which 16th-century movement included Martin Luther’s challenge to church practices?'],
      ['Scientific Revolution', 'a period emphasizing observation, mathematics, and experimentation', 'Which historical period produced new evidence-based models of the solar system?'],
      ['Enlightenment', 'an intellectual movement emphasizing reason and individual rights', 'Which intellectual movement developed influential ideas about reason, rights, and social contracts?'],
      ['Industrial Revolution', 'the shift to mechanized production beginning in the late 1700s', 'Which major economic shift introduced steam-powered factories beginning in the late 1700s?'],
      ['French Revolution', 'the political and social upheaval beginning in France in 1789', 'Which upheaval began in 1789 and ended France’s old monarchy?'],
      ['Imperialism', 'a policy of extending control over other territories or peoples', 'What policy drove European colonial expansion during the 1800s?'],
      ['World War I', 'a global war fought from 1914 to 1918', 'Which global war featured trench warfare on the Western Front from 1914 to 1918?'],
      ['United Nations', 'an international organization founded in 1945 to promote cooperation and peace', 'Which international organization founded in 1945 includes the General Assembly?'],
    ]],
    'inventors-inventions': ['Inventors & Inventions', [
      ['Johannes Gutenberg', 'the printer associated with movable metal type in 15th-century Europe', 'Which printer associated with movable metal type produced the Gutenberg Bible?'],
      ['James Watt', 'the engineer who greatly improved steam-engine efficiency', 'Which engineer improved steam-engine efficiency by developing a separate condenser?'],
      ['Eli Whitney', 'the inventor associated with the cotton gin', 'Which inventor is associated with a machine that separated cotton fiber from seeds?'],
      ['Samuel Morse', 'a developer of an electric telegraph system and Morse code', 'Which developer helped create a telegraph system for sending coded messages over wires?'],
      ['Alexander Graham Bell', 'an inventor associated with the development of the telephone', 'Which inventor received a major U.S. telephone patent in 1876?'],
      ['Thomas Edison', 'an inventor who developed practical electric-light and sound-recording systems', 'Which inventor developed a practical incandescent lighting system and sound-recording technology?'],
      ['Nikola Tesla', 'an inventor and engineer known for alternating-current power systems', 'Which inventor and engineer developed the induction motor and advanced alternating-current power?'],
      ['George Washington Carver', 'an agricultural scientist who promoted crop rotation and new crop uses', 'Which agricultural scientist researched uses for peanuts and sweet potatoes and promoted crop rotation?'],
      ['Orville and Wilbur Wright', 'aviation pioneers who achieved controlled powered flight', 'Which aviation pioneers flew the 1903 Wright Flyer?'],
      ['Guglielmo Marconi', 'an inventor associated with practical long-distance radio communication', 'Which inventor is associated with wireless telegraphy across the Atlantic?'],
      ['Hedy Lamarr and George Antheil', 'co-inventors of an early frequency-hopping communication method', 'Which pair co-invented a patented early frequency-hopping communication method?'],
      ['Grace Hopper', 'a computer scientist who advanced compilers and machine-independent programming', 'Which computer scientist advanced compilers through work that helped lead toward COBOL?'],
      ['Tim Berners-Lee', 'the inventor of the World Wide Web', 'Who created HTML, HTTP, and the first web browser and server as part of inventing the World Wide Web?'],
    ]],
    'art-music-terms': ['Art & Music Terms', [
      ['Line', 'a continuous mark used to define shapes, edges, or movement in art', 'Which art element is central to a contour drawing?'],
      ['Shape', 'a flat enclosed area in art', 'Which art element is represented by a flat painted circle?'],
      ['Form', 'a three-dimensional object or the illusion of three dimensions', 'Which art element is represented by a three-dimensional sculpture?'],
      ['Color', 'the visual quality produced by reflected or emitted light', 'Which art element is represented by a red area in a painting?'],
      ['Texture', 'the surface quality of an artwork, real or implied', 'Which art element is suggested when paint is made to look rough?'],
      ['Perspective', 'a method for showing depth on a flat surface', 'Which art method uses parallel lines meeting at a vanishing point to show depth?'],
      ['Portrait', 'an artwork representing a person', 'What type of artwork is a painted likeness of a person?'],
      ['Landscape', 'an artwork depicting natural scenery', 'What type of artwork depicts mountains, rivers, or other natural scenery?'],
      ['Rhythm', 'the organization of sounds and silences in time', 'Which music element is created by a repeated drum pattern?'],
      ['Melody', 'a sequence of pitches heard as a musical line', 'Which music element is the tune performed by a singer?'],
      ['Harmony', 'two or more pitches sounding together', 'Which music element is created by a chord accompanying a melody?'],
      ['Tempo', 'the speed of music', 'Which music element is marked by “allegro” to indicate a fast pace?'],
      ['Dynamics', 'the relative loudness or softness of music', 'Which music element uses “piano” for soft and “forte” for loud?'],
    ]],
  };

  const COMMONLY_CONFUSED_CLOZES = {
    'their / there / they’re': ['___ dog is over ___, and ___ calling it.', 'Their; there; they’re'],
    'your / you’re': ['___ wearing ___ new coat.', 'You’re; your'],
    'its / it’s': ['___ a bird protecting ___ nest.', 'It’s; its'],
    'to / too / two': ['The ___ hikers went ___ the lake ___.', 'two; to; too'],
    'than / then': ['She is taller ___ I am\\; ___ we measured again.', 'than; then'],
    'affect / effect': ['Rain can ___ traffic, and delay is one ___.', 'affect; effect'],
    'accept / except': ['Everyone ___ Lee will ___ the award.', 'except; accept'],
    'principal / principle': ['The school ___ explained the guiding ___.', 'principal; principle'],
    'lose / loose': ['Do not ___ the ___ button.', 'lose; loose'],
    'weather / whether': ['We wondered ___ the ___ would improve.', 'whether; weather'],
    'complement / compliment': ['The scarf will ___ the coat, and I will ___ its designer.', 'complement; compliment'],
    'stationary / stationery': ['The ___ bicycle stood beside the ___.', 'stationary; stationery'],
    'who / whom': ['___ called, and ___ did you call?', 'Who; whom'],
  };

  /* ---------- Card builders ---------- */
  const pairQA = (data) => data.map(([q, a]) => ({ q, a }));
  const capitalQA = (data) => data.map(([country, cap, question]) => ({ q: question || `Capital of ${country}?`, a: cap }));
  const presidentQA = (data) => data.map(([n, name, yrs]) => ({ q: `Who was U.S. President #${n}?`, a: `${name} (${yrs})` }));
  const elementQA = (data) => data.map(([name, sym, z]) => ({ q: `Chemical symbol for ${name}?`, a: `${sym} (atomic number ${z})` }));
  const langQA = (lang, data) => data.map(([en, tr]) => ({ q: `${lang}: ${en}`, a: tr }));
  const colorQA = (data) => data.map(([name, hex]) => ({ q: `{{shape:square|${hex}|130}}`, a: `**${name}**\n${hex}` }));
  const shapeQA = (data) => data.map(([kind, name]) => ({ q: `{{shape:${kind}|#4f46e5|130}}`, a: name }));
  const flagQA = (data) => data.map(([code, country]) => ({ q: `{{flag:${code}}}`, a: country }));

  function lessonQA(data) {
    const conceptCards = data.flatMap(([term, definition, practiceQuestion]) => [
      { q: `Define “${term}”.`, a: definition },
      { q: `Which term is defined as “${definition}”?`, a: term },
      { q: practiceQuestion, a: `${term} — ${definition}` },
    ]);
    const comparisonCards = data.slice(0, 11).map(([term, definition], index) => {
      const [nextTerm, nextDefinition] = data[index + 1];
      return {
        q: `Match each term to its definition: “${term}” and “${nextTerm}”.`,
        a: `${term}: ${definition}\n${nextTerm}: ${nextDefinition}`,
      };
    });
    return conceptCards.concat(comparisonCards);
  }

  function synonymAntonymCards() {
    const [, records] = LESSON_DECKS['synonyms-antonyms'];
    return records.flatMap(([term, definition, example]) => {
      const relationship = example.match(/^(.+?) is an? (synonym|antonym) of (.+)$/i);
      if (relationship) {
        const [, word, kind, counterpart] = relationship;
        const label = kind === 'synonym' ? 'Synonym' : 'Antonym';
        const meaningRelationship = kind === 'synonym' ? 'Similar meanings' : 'Opposite meanings';
        const kindArticle = kind === 'synonym' ? 'a' : 'an';
        return [
          { q: `What does ${word} mean?`, a: definition },
          { q: `How are ${word} and ${counterpart} related?`, a: `They have ${meaningRelationship.toLowerCase()}.` },
          { q: `What is ${kindArticle} ${kind} for ${word}?`, a: counterpart },
          { q: `Which word meaning “${definition}” is ${kindArticle} ${kind} of ${counterpart}?`, a: word },
        ];
      }

      const [first, second] = example.split(' and ');
      const relationshipName = `${term.toLowerCase()}s`;
      const article = term === 'Antonym' ? 'an' : 'a';
      return [
        { q: `What is ${article} ${term.toLowerCase()}?`, a: definition },
        { q: `Which word-relationship term is defined as “${definition}”?`, a: term },
        { q: `Example pair of ${relationshipName}:`, a: example },
        { q: `What relationship do ${first} and ${second} have?`, a: `They are ${relationshipName}.` },
      ];
    });
  }

  function commonlyConfusedCards() {
    const [, records] = LESSON_DECKS['commonly-confused'];
    return records.flatMap(([terms, explanation, example]) => {
      const [cloze, answer] = COMMONLY_CONFUSED_CLOZES[terms];
      return [
        { q: `How do ${terms} differ?`, a: explanation },
        { q: `Which commonly confused group is explained as “${explanation}”?`, a: terms },
        { q: `Correct-use example — ${terms}:`, a: example },
        { q: `Fill in the blanks: ${cloze}`, a: answer },
      ];
    });
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
          q: `Write the fraction for ${numerator} selected part${numerator === 1 ? '' : 's'} out of ${denominator} equal parts.`,
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
    return OPPOSITES.flatMap(([a, b, context]) => [
      { q: `What is the opposite of “${a}”${context ? ` in ${context}` : ''}?`, a: b },
      { q: `What is the opposite of “${b}”${context ? ` in ${context}` : ''}?`, a },
    ]);
  }

  function calendarCards() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const out = [];
    days.forEach((day, i) => {
      out.push({ q: `Which day comes after ${day}?`, a: days[(i + 1) % days.length] });
      out.push({ q: `Which day comes before ${day}?`, a: days[(i + days.length - 1) % days.length] });
    });
    months.forEach((month, i) => {
      out.push({ q: `Which month is month number ${i + 1}?`, a: month });
      out.push({ q: `What number month is ${month}?`, a: String(i + 1) });
      out.push({ q: `Which month comes after ${month}?`, a: months[(i + 1) % months.length] });
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
    const out = [];
    for (const [coin, cents] of coins) {
      for (let count = 1; count <= 10; count++) {
        const total = count * cents;
        const coinLabel = count === 1 ? coin : (coin === 'penny' ? 'pennies' : `${coin}s`);
        const countLabel = count === 1 ? 'one' : String(count);
        out.push({ q: `What is the value of ${countLabel} ${coinLabel}?`, a: `${total} cent${total === 1 ? '' : 's'}` });
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
      { q: `What time is one hour after ${emoji}?`, a: formatTime(hour + 1, minute) },
      { q: `What time is thirty minutes after ${emoji}?`, a: formatTime(hour + (minute === 30 ? 1 : 0), minute === 30 ? 0 : 30) },
    ]);
  }

  function colorCards() {
    return colorQA(COLORS).concat(
      COLORS.map(([name, hex]) => ({ q: `Which color has hex code ${hex}?`, a: name })),
      [
        { q: 'What are the traditional primary colors in basic paint mixing?', a: 'Red, yellow, and blue' },
        { q: 'What are the additive primary colors of light?', a: 'Red, green, and blue' },
        { q: 'Mix red and yellow paint.', a: 'Orange' },
        { q: 'Mix blue and yellow paint.', a: 'Green' },
        { q: 'Mix red and blue paint.', a: 'Purple' },
        { q: 'Mix red and white paint.', a: 'Pink' },
        { q: 'Mix black and white.', a: 'Gray' },
        { q: 'What is a color made by mixing a primary color with a neighboring secondary color called?', a: 'Tertiary color' },
        { q: 'What are colors opposite each other on a color wheel called?', a: 'Complementary colors' },
        { q: 'What are colors next to each other on a color wheel called?', a: 'Analogous colors' },
      ],
    );
  }

  function shapeCards() {
    return shapeQA(SHAPES).concat(SHAPE_FACTS.flatMap(([name, definition, practiceQuestion, structure]) => [
      { q: `Shape clue: ${definition}`, a: `${name} — ${definition}` },
      { q: `What is the basic description of ${name}?`, a: definition },
      { q: practiceQuestion, a: `${name} (${structure})` },
      { q: `What side or point structure does ${name} have?`, a: `${name}: ${structure}` },
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
    const promptOverrides = {
      Japanese: { hot: 'hot weather', cold: 'cold weather' },
      Mandarin: { yes: 'yes / that is correct', no: 'no / not' },
    };
    return SPANISH.map(([english], i) => ({
      q: `${lang}: ${(promptOverrides[lang] && promptOverrides[lang][english]) || english}`,
      a: translations[i],
    }));
  }

  function lessonCards(id) {
    const [, records] = LESSON_DECKS[id];
    return lessonQA(records);
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
    pack('first-words', 'First Words & Sight Words', 'early-learning', ['first words', 'sight words', 'reading'], () => FIRST_WORDS.map(([word, clue]) => ({ q: `What does the sight word “${word}” mean or do?`, a: clue }))),
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
    pack('synonyms-antonyms', 'Synonyms & Antonyms', 'language-arts', ['synonyms', 'antonyms', 'word meanings'], synonymAntonymCards),
    pack('roots-prefixes-suffixes', 'Roots, Prefixes & Suffixes', 'language-arts', ['word roots', 'prefixes', 'suffixes'], () => lessonCards('roots-prefixes-suffixes')),
    pack('commonly-confused', 'Commonly Confused Words', 'language-arts', ['confused words', 'homophones'], commonlyConfusedCards),
    pack('literary-terms', 'Literary Terms', 'language-arts', ['literature', 'figurative language'], () => lessonCards('literary-terms')),

    pack('us-capitals', 'US State Capitals', 'geography-civics', ['state capitals', 'us capitals', 'state capital', 'states'], () => capitalQA(US_CAPITALS)),
    pack('world-capitals', 'World Capitals', 'geography-civics', ['capitals', 'capital', 'countries', 'country capitals'], () => capitalQA(WORLD_CAPITALS)),
    pack('world-flags', 'World Flags', 'geography-civics', ['country flags', 'flags', 'flag'], () => flagQA(WORLD_FLAGS)),
    pack('us-civics', 'US Civics Basics', 'geography-civics', ['civics', 'citizenship', 'government'], () => pairQA(CIVICS)),
    pack('us-states-abbreviations', 'US States & Abbreviations', 'geography-civics', ['state abbreviations', 'postal abbreviations'], () => US_STATES.map(([state, abbreviation]) => ({ q: `What is the postal abbreviation for ${state}?`, a: abbreviation }))),
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
