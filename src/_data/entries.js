/* Every entry is a place I have been, the frames I kept, and what I actually
   thought of it. Entries flagged `placeholder: true` are filler: the writing
   is invented and the pictures are drawn, not shot. Replace the frames, drop
   the flag, rewrite the words. */

const entries = [
  {
    slug: "orlando",
    placeSlug: "orlando",
    place: "Orlando",
    region: "Florida",
    country: "United States",
    dates: "19 August 2025",
    month: "Aug 2025",
    kicker: "Four days photographing places built entirely to be looked at.",
    body: [
      "I did not go to Orlando to take pictures. I went because other people were going, and the camera came along the way it always does. Four days later I had eleven hundred frames and a much better opinion of theme parks than I arrived with.",
      "The thing nobody tells you is that these places are already composed. Every sightline is deliberate. Every building has an angle it was designed to be seen from, and there is usually a paving pattern quietly steering you towards it. You are not hunting for a shot so much as accepting the one you have been handed. That felt like cheating for about a day, and then it stopped mattering.",
      "Hogwarts Castle gave me the frame of the trip, and it did it under weather I spent the whole evening complaining about. Flat grey overcast, no direction to the light, nothing to model the towers. It turns out that is exactly what the stonework wants. I have seen the same castle shot in hard sun and it looks like what it partly is, which is painted fibreglass on a steel frame. Grey sky hides the seams.",
      "Epcot after dark is the harder problem and the more interesting one. Spaceship Earth runs a lighting programme that shifts continuously and never quite repeats, so you stand in the dark at ISO 6400 with a slow kit zoom, waiting for a combination you want and hoping a thirtieth of a second is enough. It usually is not. I kept two frames out of about sixty, and both are noisier than I would like.",
      "The one at midnight from the entrance plaza is the one I would print. The monorail beam cutting in from the left does more work than anything I chose to do, and the woman in the yellow dress walking away from camera was pure luck. I have tried to arrange that shot deliberately since and it never lands.",
    ],
    verdict:
      "Go for the engineering and stay for the light. Everything worth photographing is lit by someone who thought about it harder than you will, and the night programmes are genuinely good. Bring something faster than a kit zoom and accept you will be shooting over heads.",
    rating: 4,
    again: "Yes, with a fast prime and a monopod",
    stayed: null,
  },

  {
    slug: "baa-atoll",
    placeSlug: "baa-atoll",
    place: "Baa Atoll",
    region: "Baa",
    country: "Maldives",
    dates: "March 2025",
    month: "Mar 2025",
    kicker: "Water so clear the boat looks like it is hovering.",
    placeholder: true,
    body: [
      "Placeholder entry. The lagoon runs from almost colourless at the sand to a hard turquoise about thirty metres out, and the line between the two moves with the tide, so the same frame taken an hour apart is a different picture.",
      "Midday is the only time the reef reads properly from above, which is inconvenient because midday is also when the light is at its worst for everything else. I shot the water at one and the villas at six and treated them as two separate trips.",
    ],
    verdict:
      "Placeholder verdict. Worth it for two or three days, less so for a week. The reef is the reason to come and you can see all of it before lunch on day two.",
    rating: 4,
    again: "Yes, on a local island rather than a resort",
    stayed: {
      name: "Fehendhoo Beach House",
      type: "Airbnb",
      note: "Local island, two bicycles, reef fifty metres from the door.",
    },
  },

  {
    slug: "koh-lipe",
    placeSlug: "koh-lipe",
    place: "Koh Lipe",
    region: "Satun",
    country: "Thailand",
    dates: "January 2025",
    month: "Jan 2025",
    kicker: "The sunset does the work and everyone knows it.",
    placeholder: true,
    body: [
      "Placeholder entry. Sunset Beach faces exactly where you would want it to, which means by six every evening there are forty people standing in a line along the sand, all making the same picture. I made it too.",
      "The better frames came half an hour after everyone left, when the sky went from orange to a flat mauve and the palms stopped being silhouettes and started being shapes.",
    ],
    verdict:
      "Placeholder verdict. Beautiful and quite busy, and those two facts are related. Go in the shoulder season or go to the next island along.",
    rating: 3,
    again: "Yes, but in November",
    stayed: {
      name: "Bundhaya Beachfront",
      type: "Guesthouse",
      note: "Fan room thirty seconds from the water, no view, did not need one.",
    },
  },

  {
    slug: "praia-da-marinha",
    placeSlug: "algarve",
    place: "Praia da Marinha",
    region: "Algarve",
    country: "Portugal",
    dates: "October 2024",
    month: "Oct 2024",
    kicker: "Limestone the colour of biscuit, dropping straight into deep blue.",
    placeholder: true,
    body: [
      "Placeholder entry. The cliff path east of the car park is the whole reason to come. It runs for about four kilometres along the top of the headland and you get a new arch or stack every few hundred metres.",
      "Late afternoon puts the sun behind you and lights the rock properly. Morning is flat and slightly blue and not worth the early start.",
    ],
    verdict:
      "Placeholder verdict. The best coastal walking in southern Europe for the effort involved, and almost empty outside July and August.",
    rating: 5,
    again: "Yes, every October if I can",
    stayed: {
      name: "Casa do Carrasco, Carvoeiro",
      type: "Airbnb",
      note: "Whitewashed house with a roof terrace, ten minutes from the path.",
    },
  },

  {
    slug: "fiordland",
    placeSlug: "fiordland",
    place: "Fiordland",
    region: "Southland",
    country: "New Zealand",
    dates: "February 2024",
    month: "Feb 2024",
    kicker: "Cloud sits in the valley until the sun burns it off, usually around ten.",
    placeholder: true,
    body: [
      "Placeholder entry. Four metres of rain a year is what makes the waterfalls, so the weather is not something to work around, it is the subject. The two days it did not rain were the two least interesting days.",
      "Everything here is bigger than the lens. I spent a week trying to make the scale read and only got it once, by putting a boat in the frame for something to measure against.",
    ],
    verdict:
      "Placeholder verdict. Go, and give it more days than you think you need, because you will lose at least two of them to weather that makes the road impassable.",
    rating: 5,
    again: "Yes, in a campervan next time",
    stayed: {
      name: "The Hut at Hollyford",
      type: "Cabin",
      note: "Off grid, wood stove, last kilometre on foot.",
    },
  },

  {
    slug: "erg-chebbi",
    placeSlug: "erg-chebbi",
    place: "Erg Chebbi",
    region: "Merzouga",
    country: "Morocco",
    dates: "November 2023",
    month: "Nov 2023",
    kicker: "One ridge, three hundred metres high, and nothing else for an hour in any direction.",
    placeholder: true,
    body: [
      "Placeholder entry. The dunes only look like the pictures for about forty minutes either side of sunrise and sunset. In between they are flat, hazy and the colour of cardboard.",
      "Walking up the big ridge in soft sand takes far longer than it looks, so leave an hour more than seems reasonable. Sand in the camera is not the problem people warn you about. Sand in the zoom ring is.",
    ],
    verdict:
      "Placeholder verdict. One night is enough and two is plenty. Do the camp, get up in the dark, and do not bother changing lenses out there.",
    rating: 4,
    again: "Probably not, but I am glad I went",
    stayed: {
      name: "Desert camp, Erg Chebbi",
      type: "Tented camp",
      note: "Rugs, no power after eleven, and the best sky I have stood under.",
    },
  },

  {
    slug: "munduk",
    placeSlug: "munduk",
    place: "Munduk",
    region: "Bali",
    country: "Indonesia",
    dates: "June 2023",
    month: "Jun 2023",
    kicker: "Coffee, cloud forest, and a waterfall at the end of every path.",
    placeholder: true,
    body: [
      "Placeholder entry. Up in the hills the light stays flat and soft most of the day because the cloud never fully clears, which is miserable for landscapes and excellent for anything green.",
      "The waterfalls are a twenty minute walk down and a forty minute walk back up, and every one of them has a warung at the top selling the coffee grown on the slope you just climbed.",
    ],
    verdict:
      "Placeholder verdict. The part of Bali worth the flight. Two hours from the south coast and it may as well be a different island.",
    rating: 5,
    again: "Yes, for longer",
    stayed: {
      name: "Munduk Ridge Villa",
      type: "Airbnb",
      note: "Open-sided living room facing the valley, no glass, no need for it.",
    },
  },
];

// Attach the resolved frame objects and a running entry number.
export default entries.map((e, i) => ({
  ...e,
  number: String(entries.length - i).padStart(2, "0"),
}));
