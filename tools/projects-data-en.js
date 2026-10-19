/**
 * English content for the /en/ pages, keyed by project slug. Same facts as
 * projects-data.js (and the same sources listed there) — translate, never add
 * claims that the Arabic copy doesn't have. Prices, units and counts still come
 * from pricing.json / inventory.json, so they never need translating.
 *
 * areaEn: area name ("New Cairo"); areaDetailEn: the district people search
 *   ("5th Settlement"), empty → areaEn is used.
 * seoTitle / metaDescription: hand-written overrides; empty → generated.
 * distances / phases: same order and length as in projects-data.js; only the
 *   text is here (minutes come from the Arabic entry).
 *
 * After editing, run `node tools/build-pages.js` (it builds both languages).
 */

module.exports = {
  'hyde-park-central': {
    areaEn: 'New Cairo',
    areaDetailEn: '6th Settlement',
    seoTitle: '',
    metaDescription: '',
    finishingLabelEn: 'Core & Shell',
    locationTextEn: 'Hyde Park Central is in the 6th Settlement, New Cairo, directly on the Middle Ring Road and one minute from Hyde Park New Cairo.',
    aboutEn: 'Hyde Park Central is Hyde Park’s fourth project in East Cairo, in the 6th Settlement directly on the Middle Ring Road, one minute from Hyde Park New Cairo. The project covers about 220 feddans, and the master plan leaves around 85% of the land as open and green space. In May 2026 the developer launched the Water Residences phase on 37 feddans inside the project.',
    phases: [
      { note: 'One of the residential phases of the project.' },
      { note: 'A 37-feddan phase launched in May 2026, with down payments from 5% and installments up to 10 years, per the developer’s announcement.' },
    ],
    amenitiesEn: ['Swimming pools', 'Green spaces', 'Security', 'Restaurants & cafés', 'Gym', 'Social club', 'Schools nearby'],
    distances: [
      { place: 'American University in Cairo' },
      { place: 'German University in Cairo' },
      { place: 'Point 90 Mall' },
      { place: 'Air Force Specialized Hospital' },
      { place: 'Hyde Park New Cairo' },
    ],
  },

  'hyde-park-new-cairo': {
    areaEn: 'New Cairo',
    areaDetailEn: '5th Settlement',
    seoTitle: '',
    metaDescription: '',
    finishingLabelEn: 'Core & Shell',
    locationTextEn: 'Hyde Park New Cairo is in the 5th Settlement, New Cairo, on Road 90, one minute from Hyde Park Central.',
    aboutEn: 'Hyde Park New Cairo is Hyde Park Developments’ first project and the brand’s flagship community in New Cairo. It is home to Ryze Club, which also serves residents of the newer projects nearby, and the developer has signed with Safa Hospitals to build a medical complex for the community.',
    phases: [
      { note: 'A gated compound inside Hyde Park New Cairo, launched in September 2026 with apartments, duplexes, sky villas and villas.' },
    ],
    amenitiesEn: ['Swimming pools', 'Green spaces', 'Security', 'Restaurants & cafés', 'Gym', 'Schools nearby'],
    distances: [
      { place: 'American University in Cairo' },
      { place: 'Road 90' },
      { place: 'Hyde Park Central' },
      { place: 'Cairo International Airport' },
    ],
  },

  'one-hyde-park': {
    areaEn: 'New Cairo',
    areaDetailEn: '5th Settlement',
    seoTitle: '',
    metaDescription: '',
    finishingLabelEn: 'Core & Shell',
    locationTextEn: 'One Hyde Park is in the 5th Settlement, New Cairo, inside the Hyde Park New Cairo community, with direct access to the Middle Ring Road.',
    aboutEn: 'One Hyde Park is a gated compound inside Hyde Park New Cairo, launched by Hyde Park Developments in September 2026 on about 240 feddans with around 8,500 homes. It has 6 towers described as the tallest in the 5th Settlement, plus apartments, duplexes, sky villas, garden villas, townhouses, twin houses and standalone villas from 75 to 377 m². Services include two international schools, a main lake for rowing and an internal shuttle, and residents use Ryze Club in Hyde Park New Cairo.',
    phases: [],
    amenitiesEn: ['Rowing lake', 'Two international schools', 'Green spaces', 'Internal shuttle', 'Retail & services', 'Ryze Club access', 'Security'],
    distances: [
      { place: 'Mohamed Naguib Axis' },
      { place: 'Gamal Abdel Nasser Street' },
      { place: 'American University in Cairo' },
      { place: 'New Administrative Capital' },
      { place: 'Ain Sokhna Road' },
      { place: 'Cairo International Airport' },
    ],
  },

  'hyde-park-terraces': {
    areaEn: 'New Cairo',
    areaDetailEn: '',
    seoTitle: '',
    metaDescription: '',
    finishingLabelEn: 'Core & Shell',
    locationTextEn: 'Hyde Park Terraces is in New Cairo at the junction of the Old Sokhna Road and Talaat Harb Road, directly opposite the German University in Cairo and next to Hyde Park Views.',
    aboutEn: 'Hyde Park Terraces is one of Hyde Park’s newest East Cairo launches for 2026, focused on townhouses and standalone villas designed around open terraces. It covers about 102 feddans at the junction of the Old Sokhna Road and Talaat Harb Road, opposite the German University in Cairo and next to Hyde Park Views, with about 85% of the land given to landscaping and open space.',
    phases: [],
    amenitiesEn: ['Swimming pools', 'Green spaces', 'Security', 'Restaurants & cafés', 'Schools nearby'],
    distances: [
      { place: 'German University in Cairo', note: 'Opposite the project' },
      { place: 'Hyde Park Views', note: 'Next to the project' },
      { place: 'American University in Cairo' },
      { place: 'Road 90' },
    ],
  },

  'hyde-park-tawny': {
    areaEn: '6th of October',
    areaDetailEn: '',
    seoTitle: '',
    metaDescription: '',
    finishingLabelEn: 'Core & Shell',
    locationTextEn: 'Hyde Park Tawny is in the heart of 6th of October City, directly opposite Gezira Club and close to the 26th of July Corridor and the Wahat Road.',
    aboutEn: 'Tawny is one of Hyde Park’s first two projects in West Cairo, alongside Garden Lakes, with Signature following later. It is dedicated to townhouses, twin houses and standalone villas, on about 31 feddans directly opposite Gezira Club.',
    phases: [],
    amenitiesEn: ['Swimming pools', 'Green spaces', 'Security', 'Social club', 'Schools nearby'],
    distances: [
      { place: 'Gezira Club', note: 'Opposite the project' },
      { place: 'Mall of Egypt' },
      { place: 'Al Alsun School' },
      { place: 'Wahat Road' },
      { place: '26th of July Corridor' },
      { place: 'Giza Pyramids' },
    ],
  },

  'hyde-park-garden-lake': {
    areaEn: '6th of October',
    areaDetailEn: '',
    seoTitle: '',
    metaDescription: '',
    finishingLabelEn: 'Core & Shell',
    locationTextEn: 'Garden Lakes is in 6th of October City, West Cairo, close to Gezira Club and Mall of Arabia, and minutes from the 26th of July Corridor and the Cairo–Alexandria Desert Road.',
    aboutEn: 'Garden Lakes is one of Hyde Park’s largest projects in West Cairo, designed around man-made lakes and green spaces: about 85% of the land is landscaping and open space, and only 15% is built. Its final phase, Park Residences, is set around a central park and lake.',
    phases: [
      { note: 'The final phase of the project, set around a central park and lake.' },
    ],
    amenitiesEn: ['Man-made lake', 'Green spaces', 'Security', 'Restaurants & cafés', 'Gym', 'Schools nearby'],
    distances: [
      { place: 'Al Alsun School' },
      { place: 'Mall of Egypt' },
      { place: '26th of July Corridor' },
      { place: 'Cairo–Alexandria Desert Road' },
      { place: 'Juhayna Square' },
      { place: 'Giza Pyramids' },
    ],
  },

  'hyde-park-signature': {
    areaEn: '6th of October',
    areaDetailEn: '',
    seoTitle: '',
    metaDescription: '',
    finishingLabelEn: 'Core & Shell',
    locationTextEn: 'Hyde Park Signature is in 6th of October City, West Cairo, next to Garden Lakes and opposite Gezira Club, minutes from the Grand Egyptian Museum.',
    aboutEn: 'Hyde Park Signature is Hyde Park’s third project in West Cairo, after Tawny and Garden Lakes, with about 910 homes set around a 15-feddan central park that includes open co-working spaces, offices and services. The project is next to Gezira Club and minutes from the Grand Egyptian Museum.',
    phases: [],
    amenitiesEn: ['Swimming pools', 'Green spaces', '24-hour security', 'Restaurants & cafés', 'Gym & spa', 'Social club'],
    distances: [
      { place: 'Gezira Club', note: 'Opposite the project' },
      { place: 'Garden Lakes', note: 'Next to the project' },
      { place: 'Hyde Park Tawny', note: 'Nearby' },
      { place: 'Mall of Arabia' },
      { place: 'Grand Egyptian Museum' },
    ],
  },

  'hyde-park-sea-shore': {
    areaEn: 'North Coast',
    areaDetailEn: 'Ras El Hekma',
    seoTitle: '',
    metaDescription: '',
    finishingLabelEn: 'Core & Shell',
    locationTextEn: 'Hyde Park Sea Shore is in Ras El Hekma on Egypt’s North Coast, on the Alexandria–Matrouh Desert Road, the most sought-after area on the coast right now.',
    aboutEn: 'Sea Shore is Hyde Park’s first project on the North Coast, in Ras El Hekma, on 240 feddans with investments of about EGP 32.2 billion according to the developer. The resort has more than 25 swimming pools and has launched in phases including Shore Ville, Lagoon Town and Waterside, most recently Shore Residences in 2026.',
    phases: [
      { note: 'One of the resort’s residential phases.' },
      { note: 'A phase inside Sea Shore announced by the developer in Ras El Hekma.' },
      { note: 'Launched in August 2025, with homes overlooking the beach lagoons.' },
      { note: 'The newest phase, launched in 2026.' },
    ],
    amenitiesEn: ['Private beach', 'Swimming pools', 'Security', 'Restaurants & cafés', 'Beach club'],
    distances: [
      { place: 'El Alamein International Airport' },
      { place: 'Alamein Towers' },
      { place: 'Marsa Matrouh Airport' },
    ],
  },

  'hyde-park-business-district': {
    areaEn: 'New Cairo',
    areaDetailEn: '5th Settlement',
    seoTitle: '',
    metaDescription: '',
    finishingLabelEn: 'Core & Shell',
    locationTextEn: 'Hyde Park Business District is in the 5th Settlement, New Cairo. Its main entrance is on Road 90, which links to the New Ring Road, next to HydeOut mall.',
    aboutEn: 'Hyde Park Business District is the office and commercial area of Hyde Park New Cairo, with administrative offices in a range of sizes, including executive triplex offices over three floors. About 70% of the project is green space and landscaping, the buildings sit over an underground car park, and services include a conference centre and a piazza with water features and seating, with shops, cafés and restaurants within walking distance.',
    phases: [],
    amenitiesEn: ['Conference centre', 'Piazza with water features', 'Underground parking', '24/7 security', 'Backup generator', 'Central A/C', 'Fibre-optic connectivity'],
    distances: [
      { place: 'Road 90', note: 'Main entrance' },
      { place: 'HydeOut mall', note: 'Next to the project' },
      { place: 'New Ring Road' },
      { place: 'New Administrative Capital' },
    ],
  },
};
