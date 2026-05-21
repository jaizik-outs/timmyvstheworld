export type DialogueLine = {
  speaker: string;
  text: string;
  portraitKey?: string;
  portraitColor?: string;
};

export type PartnerId = "austin" | "teddy" | "george" | "kira";

export const HOST_CHARACTER = {
  id: "jonny",
  name: "Jonny",
  portraitKey: "portrait-jonny",
  role: "host-narrator",
} as const;

export const PLAYER_CHARACTER = {
  id: "timmy",
  name: "Timmy",
  portraitKey: "portrait-timmy",
  role: "stanford-dropout-founder",
} as const;

export const STARTUP_LIFECYCLE = [
  {
    id: "pre-seed",
    title: "Pre-Seed Maze",
    premise: "Timmy turns a dropout thesis into something that can survive first meetings.",
  },
  {
    id: "seed",
    title: "Seed Round",
    premise: "The idea gets sharper, the calendar gets worse, and every dollar pellet starts having opinions.",
  },
  {
    id: "series-a",
    title: "Series A",
    premise: "Timmy needs real traction, fewer vibes, and a graph that goes up and to the right on purpose.",
  },
  {
    id: "growth",
    title: "Growth Round",
    premise: "The maze gets bigger because the company did too. This is called success, apparently.",
  },
  {
    id: "ipo",
    title: "IPO Gauntlet",
    premise: "Final challenge: survive public-market scrutiny without explaining AI margins using interpretive dance.",
  },
] as const;

export const LEVEL_PASSED_SCREEN_COPY = [
  "Enough early signal for Seed. The burrito-financing dream now has a calendar full of second calls.",
  "Seed check cleared. Timmy has a few logos, a less fake pipeline, and just enough momentum to say Series A with a straight face.",
  "Series A secured. The customer logos are spinning, the metrics look intentional, and growth investors have started sending calendar holds.",
  "Series B survived. Timmy is scaling fast, the bubble is still bubbly, and public markets are close enough to pretend this was always the plan.",
] as const;

// Edit these lines to tune the story without touching the game scene.
// Dialogue supports simple Celeste-style emphasis tags:
// [em]important[/em], [wave]polished/floaty words[/wave], and [shake]panic words[/shake].
export const INTRO_DIALOGUE: DialogueLine[] = [
  {
    speaker: HOST_CHARACTER.name,
    portraitKey: HOST_CHARACTER.portraitKey,
    text: "Meet [em]Timmy[/em]: Stanford dropout, pre-product & pre-team optimist, and founder of a [shake]groundbreaking[/shake] AI native financial product that lets you finance your chipotle burritos.",
  },
  {
    speaker: PLAYER_CHARACTER.name,
    portraitKey: PLAYER_CHARACTER.portraitKey,
    text: "I have a [wave]claude generated memo[/wave], a half-baked [wave]vision[/wave], and the confidence of someone who has not yet opened a data room yet.",
  },
  {
    speaker: HOST_CHARACTER.name,
    portraitKey: HOST_CHARACTER.portraitKey,
    text: "Collect [em]traction pellets[/em]. Avoid the Partners until Timmy [wave]\"innovates\"[/wave] so far out of thesis that everyone (briefly) loses interest.",
  },
];

export const POWER_PELLET_DIALOGUE_BY_LEVEL: DialogueLine[][] = [
  [
    {
      speaker: HOST_CHARACTER.name,
      portraitKey: HOST_CHARACTER.portraitKey,
      text: "[shake]Pivot alert[/shake]: Timmy just added a [wave]new web3 product feature[/wave]. For eight seconds, the partners are not chasing. They are politely passing.",
    },
  ],
  [
    {
      speaker: HOST_CHARACTER.name,
      portraitKey: HOST_CHARACTER.portraitKey,
      text: "[shake]Seed pivot[/shake]: the product is now an AI wearable for dogs that also wants fintech interchange. The partners need a moment to look at literally anything else.",
    },
  ],
  [
    {
      speaker: HOST_CHARACTER.name,
      portraitKey: HOST_CHARACTER.portraitKey,
      text: "[shake]Product update[/shake]: Timmy replaced retention with [wave]vibes-adjusted engagement[/wave]. The partners have fled to yacht week in Croatia.",
    },
  ],
  [
    {
      speaker: HOST_CHARACTER.name,
      portraitKey: HOST_CHARACTER.portraitKey,
      text: "[shake]Growth pivot[/shake]: Timmy launched an enterprise metaverse channel strategy. Procurement is confused. The partners are briefly impossible to reach.",
    },
  ],
  [
    {
      speaker: HOST_CHARACTER.name,
      portraitKey: HOST_CHARACTER.portraitKey,
      text: "[shake]IPO pivot[/shake]: Timmy told the roadshow the company is now [wave]AI-native, crypto-adjacent, and spiritually profitable[/wave]. The partners are unimpressed.",
    },
  ],
];

export const POWER_PELLET_RESPAWN_DIALOGUE: DialogueLine[] = [
  {
    speaker: HOST_CHARACTER.name,
    portraitKey: HOST_CHARACTER.portraitKey,
    text: "Market update: when all the [em]pivot pellets[/em] are used up, Timmy's OpenClaw periodically floats new, terrible ideas.",
  },
  {
    speaker: HOST_CHARACTER.name,
    portraitKey: HOST_CHARACTER.portraitKey,
    text: "This is called [wave]an innovation flywheel[/wave] if you put it in a fundraising deck.",
  },
];

export const LEVEL_CLEAR_DIALOGUE_BY_LEVEL: DialogueLine[][] = [
  [
    {
      speaker: HOST_CHARACTER.name,
      portraitKey: HOST_CHARACTER.portraitKey,
      text: "[em]Pre-seed cleared[/em]. Timmy survived first meetings and earned the ancient founder privilege of explaining the same idea with bigger numbers.",
    },
    {
      speaker: "Austin",
      portraitKey: "portrait-austin",
      text: "Fine. There is just enough signal here to take another call. Do not make me regret my career choices.",
    },
  ],
  [
    {
      speaker: HOST_CHARACTER.name,
      portraitKey: HOST_CHARACTER.portraitKey,
      text: "[em]Seed cleared[/em]. Timmy now has traction, calendar fatigue, and a deck that says [wave]\"web 4\"[/wave] nine times.",
    },
    {
      speaker: "Austin",
      portraitKey: "portrait-austin",
      text: "The seed round has a pulse. I still have questions, but at least the demo shows some promise.",
    },
  ],
  [
    {
      speaker: HOST_CHARACTER.name,
      portraitKey: HOST_CHARACTER.portraitKey,
      text: "[em]Series A funding secured[/em]. Timmy is locking in some decent logos, they look good as they carousel on the website",
    },
    {
      speaker: "Austin",
      portraitKey: "portrait-austin",
      text: "This is almost a company now. I am not very comfortable with the product, but traction is traction [wave]... At least you aren't making weapons[/wave], I guess.",
    },
  ],
  [
    {
      speaker: HOST_CHARACTER.name,
      portraitKey: HOST_CHARACTER.portraitKey,
      text: "[em]Series B cleared[/em]. The company is scaling, Timmy has gone to Turkey to \"fix his deviated septum\", and a16z is circling.",
    },
    {
      speaker: "Austin",
      portraitKey: "portrait-austin",
      text: "Growth is messy, but the traction is real. Proceed quickly, before the [shake]bubble pops.[/shake]",
    },
  ],
  [
    {
      speaker: HOST_CHARACTER.name,
      portraitKey: HOST_CHARACTER.portraitKey,
      text: "[em]Successful IPO achieved ($TMMY)[/em]. Timmy raises $500 million dollars from the public markets... His dad is still not proud of him.",
    },
    {
      speaker: "Austin",
      portraitKey: "portrait-austin",
      text: "It's no Datto, but good job. Ring the bell before they get a chance to take a closer look into your vibe coded infrastructure stack.",
    },
  ],
];

export const PITY_RUNWAY_DIALOGUE: DialogueLine[] = [
  {
    speaker: HOST_CHARACTER.name,
    portraitKey: HOST_CHARACTER.portraitKey,
    text: "Bridge financing update: Timmy received a totally not [shake]pity deal[/shake] from his dad's friend. He doesn't understand the business, but Timmy's dad was a legend in their frat at Dartmouth for shotgunning a beer in under 5 seconds. The company's runway is extended [wave]three more months[/wave].",
  },
];

export const PARTNER_CATCH_LINES = {
  austin: [
    "Caught by Austin. The big boss man has asked for a [shake]technical demo[/shake]. However, Timmy can't code for his life.",
    "Austin cornered Timmy and asked one normal architecture question. Timmy immediately started sweating in [wave]founder mode[/wave].",
    "Austin requested proof the product exists outside the deck. Timmy opened a tab called [shake]final-final-demo-v7[/shake] and prayed.",
    "Austin found the basement-startup energy compelling. Unfortunately, the backend appears to be one Zapier workflow in a hoodie.",
  ],
  teddy: [
    "Teddy found a [shake]quantitative gap[/shake] in your projection model. Very Bridgewater of him, honestly.",
    "Teddy asked for the cohort chart. Timmy showed a screenshot labeled [wave]trust me bro[/wave].",
    "Teddy ran the sensitivity table and discovered the company only works if CAC becomes a negative number.",
    "Teddy wants to know why the model assumes churn politely stops after Q3. Timmy called it [em]AI retention[/em].",
  ],
  george: [
    "George looked at your product roadmap and surfaced a critical error: [em]it just kinda sucks[/em].",
    "George asked who urgently needs this product. Timmy said [wave]people with burrito ambition[/wave], which did not help.",
    "George read the customer quote twice and realized it was from Timmy's roommate.",
    "George found the wedge. It was mostly wedge salad, plus a landing page.",
  ],
  kira: [
    "Kira reviewed operations and determined your escape plan needed an [em]actual plan[/em].",
    "Kira asked who owns customer success. Timmy said the Discord has moderators, so everyone took a minute.",
    "Kira found the budget tab. It was three rows, two vibes, and one unexplained contractor named Brad.",
    "Kira asked how the company handles refunds. Timmy said [shake]good question[/shake], which is not a process.",
  ],
} as const satisfies Record<PartnerId, readonly string[]>;

export const PARTNER_CAPTURE_LINES = {
  austin: [
    "[shake]Crypto??[/shake] Austin has seen enough. It is a pass from him, dawg.",
    "Timmy pivoted into a tokenized basement marketplace. Austin respects the basement, rejects the marketplace.",
    "Austin heard \"cutting-edge AI marketing\" and immediately returned to first principles. Those principles being [shake]\"no\"[/shake]",
    "The pivot has too many hyphens and not enough customers. Austin is out.",
    "Timmy found web3. Austin found the exit.",
  ],
  teddy: [
    "Teddy adjusted the model for 'new web3 product feature' and the output cell simply said [shake]LOL[/shake].",
    "The forecast now depends on efficient token use. Teddy has left the chat (and the country).",
    "Teddy ran the sensitivity table. Every scenario converged on 'and for that reason, I'm out.'",
    "Timmy added an L2 strategy. Teddy added a 100% discount rate.",
    "The KPI is vibes per wallet. Teddy cannot underwrite this sentence.",
  ],
  george: [
    "George is not impressed with Timmy's hobbies outside of work. Instead of looksmaxxing, maybe you should try hands-on-keys-maxxing.",
    "Timmy said 'bookings.' George asked 'revenue?' The room got quiet.",
    "George tries underwriting the new wedge and discovered Timmy was talking about wedge salad.",
    "Timmy took a check from SoftBank. George has chosen violence.",
    "George found a fatal assumption mistake in the pitch: actually thinking that people want this",
  ],
  kira: [
    "Kira asked who owns operations after the crypto pivot. Timmy said [wave]'the community.'[/wave] Kira is out.",
    "The roadmap now says 'launch a shitcoin' is slated for Q1 next year. Kira has mentally marked down this investment to zero.",
    "Kira found the operating model and, unfortunately, it was a public Discord server.",
    "Timmy added web3. Kira added a blocker: reality.",
    "Kira reviewed the pivot and filed it under: not in thesis, not in budget, not today, and definitely not tomorrow either.",
  ],
} as const satisfies Record<PartnerId, readonly string[]>;
