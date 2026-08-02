/* A place sits inside a country. Journal entries and stays both point at
   places by slug, so a place page can gather everything about it. */
export default [
  { slug: "santorini", country: "greece", name: "Santorini", kind: "Island",
    blurb: "The rim of a volcano that collapsed into the sea, so the whole west face looks down into the drop. Oia takes the crowd. Imerovigli has the same view.",
    gettingThere: "Fly to JTR in season, or the ferry from Piraeus in five to eight hours.",
    bestTime: "May, and the second half of September." },

  { slug: "naxos", country: "greece", name: "Naxos", kind: "Island",
    blurb: "The largest of the Cyclades and the one people actually live on year round. Mountains in the middle, a working town, and beaches on the west coast that go on for miles.",
    gettingThere: "Ferry from Piraeus or Santorini. Small airport with Athens connections.",
    bestTime: "June and September." },

  { slug: "nydri", country: "greece", name: "Nydri", kind: "Resort town",
    image: "nydri-harbour",
    gallery: ["nydri-harbour", "lefkada-cove", "lefkada-beach-above", "lefkada-boat",
              "lefkada-taverna", "lefkada-beachclub", "lefkada-sunset-sea",
              "lefkada-rings-close", "lefkada-beach-portrait",
              "lefkada-terrace-sun", "lefkada-terrace-night", "lefkada-dinner"],
    blurb: "The east coast of Lefkada, sheltered by a string of small islands, with a harbour full of day boats and the best beaches on the island a half hour drive west over the ridge.",
    gettingThere: "Fly to Preveza, then forty minutes by road. Lefkada is joined to the mainland by a causeway, so no ferry.",
    bestTime: "June, and September when the meltemi drops." },

  { slug: "algarve", country: "portugal", name: "Algarve", kind: "Coast",
    blurb: "Limestone the colour of biscuit dropping straight into deep blue, with a cliff path running east from Praia da Marinha for about four kilometres.",
    gettingThere: "Fly to Faro, then forty minutes by car.",
    bestTime: "October, or April before the schools break." },

  { slug: "lofoten", country: "norway", name: "Lofoten", kind: "Archipelago",
    blurb: "Granite peaks going straight into the sea, fishing cabins on stilts over the water, and six weeks in summer when the sun never fully sets.",
    gettingThere: "Fly to Bodø, then the ferry, or drive the E10 from Narvik.",
    bestTime: "Late May to mid July." },

  { slug: "norfolk", country: "united-kingdom", name: "Norfolk", kind: "Broads and coast",
    image: "boathouse-lake",
    gallery: ["boathouse-exterior", "boathouse-through", "boathouse-living",
              "boathouse-deck-dusk", "boathouse-watching", "boathouse-lake"],
    blurb: "Flat, watery, and easy to underestimate. The Broads are the reason: a network of rivers and shallow lakes threaded through reed beds, with the kind of open sky you only get where nothing is tall enough to interrupt it.",
    gettingThere: "Two and a half hours from London by car, or train to Norwich.",
    bestTime: "Late spring and September, when the water traffic thins out." },

  { slug: "cornwall", country: "united-kingdom", name: "Cornwall", kind: "Coast",
    blurb: "Three hundred miles of coast path, an Atlantic swell on the north side and calm water on the south, and the only part of England that reliably gets light worth waiting for.",
    gettingThere: "Five hours from London by car, or the sleeper to Penzance.",
    bestTime: "May, June and September. August is gridlocked." },

  { slug: "eryri", country: "united-kingdom", name: "Eryri", kind: "National park",
    blurb: "Snowdonia by its proper name. Fifteen peaks over three thousand feet inside eight hundred square miles, with valleys, lakes and old slate everywhere you look.",
    gettingThere: "Four hours from London, three from Manchester.",
    bestTime: "May and September. Book Yr Wyddfa parking weeks ahead." },

  { slug: "cairngorms", country: "united-kingdom", name: "Cairngorms", kind: "National park",
    blurb: "The largest national park in Britain and the closest thing it has to wilderness. Ancient pine forest at the bottom, arctic plateau at the top.",
    gettingThere: "Sleeper train to Aviemore, or eight hours by car from London.",
    bestTime: "May for the light, February for the snow." },

  { slug: "lake-district", country: "united-kingdom", name: "Lake District", kind: "National park",
    blurb: "Sixteen lakes, a lot of walls, and more weather than anywhere else in England. The western valleys are half as busy as the ones people drive to.",
    gettingThere: "Train to Oxenholme or Penrith, then a car.",
    bestTime: "Late April and October." },

  { slug: "orlando", country: "united-states", name: "Orlando", kind: "City",
    gallery: ["orlando-carousel"],
    blurb: "Everything worth photographing here was built to be looked at, lit by someone who thought about it harder than you will.",
    gettingThere: "Direct from London in about nine hours.",
    bestTime: "November to April. August is 34 degrees and humid." },

  { slug: "koh-lipe", country: "thailand", name: "Koh Lipe", kind: "Island",
    blurb: "Small enough to walk across in twenty minutes, with three beaches facing three different directions and a national park either side.",
    gettingThere: "Fly to Hat Yai, then a bus and a speedboat.",
    bestTime: "November to March. Most of it closes in monsoon." },

  { slug: "munduk", country: "indonesia", name: "Munduk", kind: "Highland village",
    blurb: "Two hours north of the south coast and it may as well be a different island. Coffee slopes, cloud forest, and a waterfall at the end of most paths.",
    gettingThere: "Two and a half hours by car from Denpasar.",
    bestTime: "May to September." },

  { slug: "baa-atoll", country: "maldives", name: "Baa Atoll", kind: "Atoll",
    blurb: "A UNESCO biosphere reserve, which in practice means the reef is protected and the manta aggregation at Hanifaru Bay is the reason people come.",
    gettingThere: "Seaplane or domestic flight from Malé.",
    bestTime: "November to April. Mantas peak June to November." },

  { slug: "erg-chebbi", country: "morocco", name: "Erg Chebbi", kind: "Dune field",
    blurb: "One ridge, three hundred metres high, and nothing else for an hour in any direction. It only looks like the pictures for forty minutes either side of dawn and dusk.",
    gettingThere: "Eight hours by road from Marrakech, or fly to Errachidia.",
    bestTime: "October to April." },

  { slug: "fiordland", country: "new-zealand", name: "Fiordland", kind: "National park",
    blurb: "Four metres of rain a year, which is not a problem to work around but the entire reason the place looks the way it does.",
    gettingThere: "Two hours from Queenstown to Te Anau, then two more to Milford.",
    bestTime: "December to March, and expect to lose days to weather." },
];
