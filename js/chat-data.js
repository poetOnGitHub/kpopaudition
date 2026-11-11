/* ============================================
   7th Room — Chatroom script
   Everything the chatroom says: who is in it, how it answers what a
   visitor types, and the conversations the members have among themselves.
   Data only. The engine that plays it is initChatroom() in main.js, which
   this file has to be loaded before. It defines one global.
   ============================================ */

window.SEVENTH_ROOM_CHAT = {
  // Where the room's members connect from
  cities: [
    'Seoul', 'Tokyo', 'London', 'Paris', 'Lagos', 'New York',
    'Bangkok', 'Jakarta', 'Berlin', 'Mumbai', 'Manila', 'Sydney',
    'Toronto', 'Stockholm', 'Cairo', 'Mexico City', 'Osaka',
    'Amsterdam', 'Dubai', 'Taipei', 'Singapore', 'Lisbon'
  ],

  // Their screen names
  handles: [
    'star_girl', 'moonchild99', 'neon.dream', 'cherry_bxm',
    'luv4music', 'glittergrl', 'skyline_', 'velvet.voice',
    'sugar_plum', 'oceangirl', 'pixiedust', 'aurora.wav',
    'dreamcatcher', 'honey_bee', 'cloud.nine', 'sparkle_xx',
    'midnight_sun', 'blossom.mp3', 'starry_eyed', 'pink.static',
    'luna_moth', 'crystal.clear', 'daisychain', 'prism.girl'
  ],

  // --- Replies to the visitor ---
  // The rules are tried in order and the first match wins, so specific
  // rules come before general ones.
  //   regex     what the message has to contain
  //   capture   'name' or 'place': the first group is tidied up as a name
  //             or a place; if nothing usable is left the rule does not
  //             apply and the next rules are tried. Without it, {extract}
  //             is the first group as typed.
  //   remember  'userName' or 'userCountry': the room keeps {extract}
  //   category, mood, topic
  //             what the room notes about the visitor; they steer the
  //             mood reactions below and the follow-up lines in main.js
  //   system    what the [SYSTEM] answers (one line is picked)
  //   users     what a member answers (one line is picked)
  // {extract} in a line is replaced with the captured text.
  rules: [
    {
      // Unambiguous introductions. A bare "i am ..." is usually not a
      // name; that form is handled further down, after the mood rules.
      regex: /\b(?:my name is|my name.?s|i.?m called|i am called|call me)\s+([^\s\d.,!?;:()"]+)/i,
      capture: 'name',
      remember: 'userName',
      system: ['[SYSTEM] Identity registered: {extract}.'],
      users: [
        'hi {extract}!! welcome to the room',
        'nice to meet you {extract}!',
        '{extract}!! i love that name',
        'welcome {extract}. you belong here'
      ]
    },
    {
      regex: /\b(?:i sing|i.?m a singer|vocal|i love singing|my voice)\b/i,
      category: 'vocal',
      topic: 'singing',
      system: ['[SYSTEM] Vocal frequency detected. Resonance: strong.'],
      users: [
        'a vocalist! what genre do you usually go for?',
        'omg same. singing is everything to me',
        'i would love to hear you sing tbh',
        'vocal line is going to be insane in this group'
      ]
    },
    {
      regex: /\b(?:i dance|dancer|i love dancing|choreo|i.?m a dancer)\b/i,
      category: 'dance',
      topic: 'dancing',
      system: ['[SYSTEM] Movement signature captured.'],
      users: [
        'dancer!! what style is your specialty?',
        'i can feel the energy already',
        'dance is the purest form of expression imo',
        'the dance line in this group is going to go OFF'
      ]
    },
    {
      regex: /\b(?:i rap|rapper|bars|i write lyrics|flow)\b/i,
      category: 'rap',
      topic: 'rapping',
      system: ['[SYSTEM] Lyrical signal analyzed. Pattern: unique.'],
      users: [
        'a rapper?? ok we NEED you',
        'rap is so underrated in kpop. show them',
        'spit some bars right now i dare you lol',
        'wordsmith energy. i respect that'
      ]
    },
    {
      regex: /\b(?:nervous|scared|terrified|anxious|afraid|worried|shaking)\b/i,
      mood: 'nervous',
      topic: 'nervousness',
      system: ['[SYSTEM] Emotional resonance detected. You are not alone in this room.'],
      users: [
        'honestly? same. but thats how you know it matters',
        'being nervous just means you care. thats literally the point',
        'i was shaking before i typed my first message here too',
        'take a deep breath. we are all in this together',
        'the bravest thing is showing up scared and doing it anyway'
      ]
    },
    {
      regex: /\b(?:i feel|feeling|i.?m so|i am so) (.+)/i,
      system: ['[SYSTEM] Emotional wavelength logged.'],
      users: [
        'the fact that {extract}... i relate so hard',
        'you being honest about that takes courage',
        'i feel that too. this room is a safe space',
        'say more about that. we are listening'
      ]
    },
    {
      regex: /\b(?:i want to|i wanna|i wish|i hope|i need)\b (.+)/i,
      mood: 'vulnerable',
      system: ['[SYSTEM] Dream frequency registered. Signal amplifying...'],
      users: [
        'thats such a real thing to want',
        'manifesting that for you rn',
        'you deserve {extract}. dont let anyone tell you different',
        'the 7th room hears you. keep going'
      ]
    },
    {
      // "from ..." on its own only counts at the start of the message (the
      // answer to "where are you from?"), not anywhere in a sentence
      regex: /(?:\bi.?m from|\bi am from|\bi live in|^\s*from)\s+(.+)/i,
      capture: 'place',
      remember: 'userCountry',
      topic: 'location',
      system: ['[SYSTEM] Geolocation locked: {extract}. Signal strength: maximum.'],
      users: [
        '{extract}!! thats so cool. we really are global',
        'no way!! i have always wanted to visit {extract}',
        'different countries same chatroom same dream. i love it',
        'the 7th room has no borders. just vibes'
      ]
    },
    {
      // "i am <name>": only when the name closes the thought and is not a
      // common describing word ("i am tired", "i am 17" are not names)
      regex: /\bi am\s+([^\s\d.,!?;:()"]+)(?=\s*(?:$|[.,!?~;:)]|(?:and|from|btw|lol)\b))/i,
      capture: 'name',
      remember: 'userName',
      system: ['[SYSTEM] Identity registered: {extract}.'],
      users: [
        'hi {extract}!! welcome to the room',
        'nice to meet you {extract}!',
        '{extract}!! i love that name',
        'welcome {extract}. you belong here'
      ]
    },
    {
      regex: /\b(?:hello|hi|hey+|hii+|yo|sup)\b/i,
      mood: 'excited',
      system: ['[SYSTEM] New signal acknowledged. Welcome.'],
      users: [
        'hiii!! omg another one. the room is growing',
        'welcome!! where are you from?',
        'hey!! glad you found this place',
        'hiiii! i love when new people come in'
      ]
    },
    {
      regex: /\bwhat (?:is|are|do you|should)\b/i,
      system: ['[SYSTEM] Inquiry processed.'],
      users: [
        'good question honestly. i was wondering that too',
        'idk but i think the system knows lol',
        'scroll down! all the info is on this page',
        'omg i literally asked the same thing when i got here'
      ]
    },
    {
      regex: /\b(?:love|adore|obsessed|into|passion)\b/i,
      mood: 'hype',
      topic: 'passion',
      system: ['[SYSTEM] Passion frequency amplified.'],
      users: [
        'the passion in this room is UNREAL',
        'you can literally feel the energy through the screen',
        'this is why we are all here. love and music',
        'i love this chat so much already'
      ]
    },
    {
      regex: /\b(?:dream|dreaming|manifest|destiny|fate|meant to be)\b/i,
      mood: 'vulnerable',
      topic: 'dreams',
      system: ['[SYSTEM] Dream signal locked. The room remembers.'],
      users: [
        'i literally had a dream about this before i found the page',
        'fate is real and this chatroom is proof',
        'we were all meant to be here at the same time. thats not random',
        'manifesting right now with you'
      ]
    },
    {
      regex: /\b(?:thank|thanks|ty|thx|appreciate)\b/i,
      mood: 'excited',
      system: ['[SYSTEM] Gratitude signal received.'],
      users: [
        'of course!! this room looks out for each other',
        'always. we are a team already and we havent even met',
        'no need to thank us. you being here is enough',
        'this energy is everything. WE got each other'
      ]
    },
    {
      regex: /\b(?:apply|submit|form|audition|sign up)\b/i,
      topic: 'applying',
      system: ['[SYSTEM] Application intent registered. The 7th Room is watching.'],
      users: [
        'DO IT. literally just press send',
        'i submitted mine and my hands havent stopped shaking',
        'the hardest part is pressing submit. everything after that is destiny',
        'go go go!! we are all applying together'
      ]
    },
    {
      regex: /\b(?:music|song|listen|album|kpop|k-pop|idol)\b/i,
      topic: 'music',
      system: ['[SYSTEM] Musical resonance detected.'],
      users: [
        'music is literally the reason we are all in this room',
        'what are you listening to rn? need recs',
        'kpop saved my life ngl',
        'the power of music brought us here. think about that'
      ]
    }
  ],

  // --- Mood reactions ---
  // Half the time a second member chimes in, in the mood of the conversation
  moodReactions: {
    neutral: ['real talk', 'felt that', 'honestly same', 'the energy in here rn', 'everyone here is so real'],
    excited: ['YESSS', 'the vibes are IMMACULATE', 'i cant stop smiling rn', 'this room is literally glowing', 'WE ARE DOING THIS'],
    nervous: ['deep breaths everyone', 'we got this. together.', 'nervous energy is just excitement in disguise', 'im holding everyones hand through the screen rn'],
    vulnerable: ['that was so real. thank you for sharing', 'vulnerability is a superpower here', 'the fact that you can say that... respect', 'this room is a safe space. always'],
    hype: ['LETS GOOO', 'inject this energy into my veins', 'the 7th room is ALIVE', 'somebody screenshot this moment', 'we are making history rn']
  },

  // [SYSTEM] answers to a message no rule matches
  fallbackSystem: [
    '[SYSTEM] Signal processed. Frequency: unique.',
    '[SYSTEM] Voice pattern logged. Continue.',
    '[SYSTEM] Transmission stored in room memory.',
    '[SYSTEM] Connection deepening.',
    '[SYSTEM] The room is listening. Always.'
  ],

  // --- Conversations between the members ---
  // Played one after another while the room is on screen. `pause` is the
  // gap in ms before a line. (The room's opening "hello? is anyone here?"
  // exchange is part of the boot sequence in main.js, so it is not
  // repeated here.)
  conversations: [
    [
      { text: 'is anyone else super nervous rn', pause: 900 },
      { text: 'literally shaking lol', pause: 700 },
      { text: 'same but like... the good kind of nervous?', pause: 1100 }
    ],
    [
      { text: 'how did you guys find this??', pause: 1000 },
      { text: 'a friend sent me the link at like 2am', pause: 900 },
      { text: 'i saw it on tiktok and something just clicked', pause: 800 },
      { text: 'i literally googled "auditions that feel different" lol', pause: 1200 }
    ],
    [
      { text: 'what category is everyone going for?', pause: 1000 },
      { text: 'vocal!! singing is literally my whole life', pause: 900 },
      { text: 'dance for me. i cant stop moving lol', pause: 800 },
      { text: 'all-rounder bc i refuse to choose', pause: 700 }
    ],
    [
      { text: 'imagine if we all end up in the same group', pause: 1000 },
      { text: 'STOP i would actually cry', pause: 700 },
      { text: 'manifesting this so hard rn', pause: 800 },
      { text: 'the 7th room chose us', pause: 900 }
    ],
    [
      { text: 'not gonna lie im scared to submit my video', pause: 1100 },
      { text: 'same. but they said authenticity over perfection right?', pause: 1000 },
      { text: 'just be you. thats literally all they want', pause: 800 },
      { text: 'ok that actually made me feel better ty', pause: 700 }
    ],
    [
      { text: 'does anyone else feel like they were meant to find this page', pause: 1200 },
      { text: 'yes. literally yes. i cant explain it', pause: 1000 },
      { text: 'its giving fate', pause: 600 }
    ],
    [
      { text: 'its 3am here and i cant sleep bc of this', pause: 1000 },
      { text: 'lol its 4am for me. we are unhinged', pause: 800 },
      { text: 'sleep is for people who dont have dreams to chase', pause: 1000 }
    ],
    [
      { text: 'ok real talk what if we dont get in', pause: 1100 },
      { text: 'dont think like that. the room heard you', pause: 900 },
      { text: 'even being here means something. we already took the first step', pause: 1000 },
      { text: 'no matter what happens we found each other. thats not nothing', pause: 1200 }
    ],
    [
      { text: 'i showed my friend and she is applying too', pause: 900 },
      { text: 'the more the merrier!! spread the signal', pause: 800 },
      { text: 'imagine if best friends end up in the group together', pause: 1000 }
    ]
  ]
};
