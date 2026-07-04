import { useState, useRef, useEffect, useMemo } from "react";

// ---------------------------------------------------------------
// Say & Sign - a Makaton phrase helper for families
// Type or speak a phrase; the app picks out the key words and
// shows a flashcard strip of sign prompts (where on the body the
// sign happens, plus a short movement cue).
//
// The figure graphics here are original simplified prompts, not
// reproductions of official Makaton illustrations. Makaton is the
// property of The Makaton Charity (makaton.org) - always check
// signs against official resources or training.
// ---------------------------------------------------------------

const CATEGORIES = {
  people:    { label: "People",          tint: "#8FB7E8" },
  family:    { label: "Family",          tint: "#F2A9C4" },
  health:    { label: "Health",          tint: "#7ECBC0" },
  daily:     { label: "Daily routine",   tint: "#B9A6E8" },
  clothes:   { label: "Clothes",         tint: "#F0B98A" },
  food:      { label: "Food & drink",    tint: "#F6B92C" },
  feelings:  { label: "Feelings & manners", tint: "#F08E7D" },
  questions: { label: "Questions",       tint: "#9AC48A" },
  actions:   { label: "Actions",         tint: "#89C6E0" },
  play:      { label: "Play & school",   tint: "#E0A6D8" },
  transport: { label: "Transport",       tint: "#A9C4F2" },
  animals:   { label: "Animals",         tint: "#C9B98A" },
  places:    { label: "Places & nature", tint: "#96CE9E" },
};

// zone: where the sign happens; motion: how it moves; hint: short cue
const SIGNS = {
  // People
  "hello":       { cat: "people", zone: "ear",    motion: "wave",    hint: "Open hand by the head waves forward" },
  "goodbye":     { cat: "people", zone: "side",   motion: "wave",    hint: "Wave the open hand" },
  "my":          { cat: "people", zone: "chest",  motion: "tap",     hint: "Fist rests on the chest" },
  "your":        { cat: "people", zone: "front",  motion: "forward", hint: "Fist moves towards the other person" },
  "name":        { cat: "people", zone: "forehead", motion: "tap",   hint: "Two fingers tap the forehead, then twist forward" },
  "is":          { cat: "people", zone: "front",  motion: "forward", hint: "Hand moves gently forward" },
  "i":           { cat: "people", zone: "chest",  motion: "none",    hint: "Point to yourself" },
  "you":         { cat: "people", zone: "front",  motion: "forward", hint: "Point to the other person" },
  "boy":         { cat: "people", zone: "chin",   motion: "side",    hint: "Fingers make a small sideways stroke at the chin" },
  "girl":        { cat: "people", zone: "cheek",  motion: "forward", hint: "Index finger makes two small strokes at the corner of the mouth" },
  "friend":      { cat: "people", zone: "hands",  motion: "down",    hint: "Clasp hands together, small downward movement twice" },

  // Family
  "mum":         { cat: "family", zone: "hands",  motion: "tap",     hint: "Fingers tap the opposite palm, twice" },
  "dad":         { cat: "family", zone: "hands",  motion: "tap",     hint: "Two fingers tap two fingers, twice" },
  "baby":        { cat: "family", zone: "hands",  motion: "side",    hint: "Cradle your arms and rock gently" },
  "family":      { cat: "family", zone: "hands",  motion: "circle",  hint: "Fingerspell F, circling in front of the body" },
  "sister":      { cat: "family", zone: "nose",   motion: "tap",     hint: "Hooked finger taps the middle of the nose, twice" },
  "brother":     { cat: "family", zone: "hands",  motion: "shake",   hint: "Rub the knuckles of both fists together" },
  "aunt":        { cat: "family", zone: "chin",   motion: "tap",     hint: "Index and middle fingers tap the chin, twice" },
  "uncle":       { cat: "family", zone: "chin",   motion: "side",    hint: "Index and middle fingers tap the chin, right then left" },
  "grandmother": { cat: "family", zone: "hands",  motion: "tap",     hint: "Fist sign, then flat hands come together twice" },
  "grandfather": { cat: "family", zone: "hands",  motion: "tap",     hint: "Fist sign, then hands cross at the fingers" },

  // Health
  "doctor":      { cat: "health", zone: "wrist",  motion: "tap",     hint: "Mime taking a pulse at the wrist" },
  "nurse":       { cat: "health", zone: "arm",    motion: "down",    hint: "Thumb traces a cross on the upper arm" },
  "hospital":    { cat: "health", zone: "arm",    motion: "down",    hint: "Trace a cross on the arm, then arms curve overhead" },
  "blood":       { cat: "health", zone: "mouth",  motion: "forward", hint: "Index finger runs across the lips, then one hand flows over the other" },
  "appointment": { cat: "health", zone: "wrist",  motion: "tap",     hint: "Fingers tap towards the back of the wrist" },
  "broken bone": { cat: "health", zone: "hands",  motion: "shake",   hint: "Point to the part, then twist both fists as if snapping" },
  "injection":   { cat: "health", zone: "arm",    motion: "tap",     hint: "Thumb presses against the arm, placed where the jab goes" },
  "x-ray":       { cat: "health", zone: "hands",  motion: "open",    hint: "Closed hand springs open" },
  "cold":        { cat: "health", zone: "hands",  motion: "shake",   hint: "Both fists shake; sign nearer the mouth for cold food" },
  "hot":         { cat: "health", zone: "mouth",  motion: "side",    hint: "Open hand passes quickly across the mouth" },
  "hurt":        { cat: "health", zone: "front",  motion: "shake",   hint: "Open hand shakes at the place that hurts" },
  "sore":        { cat: "health", zone: "front",  motion: "none",    hint: "Little finger shows the sore spot" },

  // Daily routine
  "wash":        { cat: "daily", zone: "hands",  motion: "circle",  hint: "Hands rub together in a circular wash" },
  "wash hands":  { cat: "daily", zone: "hands",  motion: "circle",  hint: "Mime washing your hands" },
  "bath":        { cat: "daily", zone: "chest",  motion: "shake",   hint: "Thumbs rub up and down on the chest" },
  "shower":      { cat: "daily", zone: "head",   motion: "open",    hint: "Hand sprinkles above the head" },
  "toilet":      { cat: "daily", zone: "chest",  motion: "circle",  hint: "Index finger makes a small circling tap at the chest" },
  "brush teeth": { cat: "daily", zone: "mouth",  motion: "side",    hint: "Index finger scrubs across the teeth" },
  "brush hair":  { cat: "daily", zone: "head",   motion: "down",    hint: "Mime brushing the hair" },
  "drying":      { cat: "daily", zone: "hands",  motion: "circle",  hint: "Mime drying with a towel" },
  "bed":         { cat: "daily", zone: "cheek",  motion: "none",    hint: "Rest the head on flat hands" },
  "sleep":       { cat: "daily", zone: "eye",    motion: "down",    hint: "Hands together at the cheek, eyes closing" },
  "get dressed": { cat: "daily", zone: "chest",  motion: "down",    hint: "Both hands make two quick downward moves on the body" },
  "get undressed": { cat: "daily", zone: "chest", motion: "up",     hint: "Both hands make two quick upward moves on the body" },

  // Clothes
  "coat":        { cat: "clothes", zone: "shoulder", motion: "down", hint: "Mime pulling a coat on over the shoulders" },
  "shoes":       { cat: "clothes", zone: "hands",  motion: "down",   hint: "One hand slides down over the other, like a shoe" },
  "shirt":       { cat: "clothes", zone: "chest",  motion: "tap",    hint: "Show the collar shape and the buttons" },
  "trousers":    { cat: "clothes", zone: "legs",   motion: "down",   hint: "Hands trace down the legs" },
  "skirt":       { cat: "clothes", zone: "waist",  motion: "open",   hint: "Fists open to flat hands, showing the skirt shape" },
  "sock":        { cat: "clothes", zone: "hands",  motion: "up",     hint: "Hand points down, then lifts, showing a sock" },
  "t-shirt":     { cat: "clothes", zone: "chest",  motion: "tap",    hint: "Tap twice to show the sleeve length" },
  "clothes":     { cat: "clothes", zone: "chest",  motion: "down",   hint: "Flat hands stroke slowly down the chest, twice" },

  // Food & drink
  "eat":         { cat: "food", zone: "mouth",  motion: "up",      hint: "Bunched fingers move up to the mouth" },
  "biscuit":     { cat: "food", zone: "elbow",  motion: "tap",     hint: "Fingers tap the elbow, twice" },
  "apple":       { cat: "food", zone: "mouth",  motion: "none",    hint: "Mime biting an apple" },
  "banana":      { cat: "food", zone: "hands",  motion: "down",    hint: "Mime peeling a banana" },
  "cake":        { cat: "food", zone: "hands",  motion: "none",    hint: "Curved hand rests on the flat palm" },
  "ice cream":   { cat: "food", zone: "mouth",  motion: "down",    hint: "Mime licking an ice cream" },
  "drink":       { cat: "food", zone: "mouth",  motion: "none",    hint: "Mime a small drink from a cup" },
  "milk":        { cat: "food", zone: "hands",  motion: "shake",   hint: "Mime milking, fists moving up and down" },

  // Feelings & manners
  "good":        { cat: "feelings", zone: "hands", motion: "up",    hint: "Thumb up" },
  "bad":         { cat: "feelings", zone: "hands", motion: "up",    hint: "Little finger raised" },
  "yes":         { cat: "feelings", zone: "hands", motion: "down",  hint: "Fist nods, like a head nodding" },
  "no":          { cat: "feelings", zone: "chest", motion: "side",  hint: "Flat hand sweeps sideways" },
  "help":        { cat: "feelings", zone: "hands", motion: "up",    hint: "Fist on the flat palm, lift both together" },
  "sorry":       { cat: "feelings", zone: "chest", motion: "circle", hint: "Fist circles on the chest" },
  "please":      { cat: "feelings", zone: "chin",  motion: "forward", hint: "Flat hand moves from the chin, forward and down" },
  "thank you":   { cat: "feelings", zone: "chin",  motion: "forward", hint: "Fingertips at the chin move forward" },
  "more":        { cat: "feelings", zone: "hands", motion: "tap",   hint: "Bent hand taps down onto the other hand" },
  "want":        { cat: "feelings", zone: "chest", motion: "down",  hint: "Open hand strokes down the chest" },
  "need":        { cat: "feelings", zone: "chest", motion: "down",  hint: "Flat palm on the chest moves down, then forward" },
  "like":        { cat: "feelings", zone: "chest", motion: "tap",   hint: "Pat the chest gently" },
  "love":        { cat: "feelings", zone: "chest", motion: "cross", hint: "Cross both hands over the heart" },
  "kiss":        { cat: "feelings", zone: "mouth", motion: "forward", hint: "Fingertips touch the lips, then the other fingertips" },
  "beautiful":   { cat: "feelings", zone: "cheek", motion: "circle", hint: "Open hand circles gently in front of the face" },

  // Questions
  "what":        { cat: "questions", zone: "hands", motion: "shake", hint: "Index finger up, small side-to-side shake" },
  "where":       { cat: "questions", zone: "hands", motion: "circle", hint: "Open palms up, making small circles" },
  "who":         { cat: "questions", zone: "chin",  motion: "circle", hint: "Index finger circles at the chin" },
  "which":       { cat: "questions", zone: "hands", motion: "side",  hint: "Fist with thumb out moves side to side" },
  "questions":   { cat: "questions", zone: "cheek", motion: "circle", hint: "Curved finger and thumb circle at the face" },

  // Actions
  "come":        { cat: "actions", zone: "side",  motion: "forward", hint: "Hand beckons towards you" },
  "give":        { cat: "actions", zone: "hands", motion: "forward", hint: "Flat hands move out towards the person" },
  "done":        { cat: "actions", zone: "chest", motion: "forward", hint: "Fist twists, then the hand opens out flat" },
  "take":        { cat: "actions", zone: "hands", motion: "none",    hint: "Hand closes as it pulls towards you" },
  "finished":    { cat: "actions", zone: "chest", motion: "open",    hint: "Both hands twist outwards and open" },
  "go":          { cat: "actions", zone: "side",  motion: "forward", hint: "Hand points and moves away" },
  "get":         { cat: "actions", zone: "hands", motion: "none",    hint: "Open hand lands on the other arm and grips" },
  "up":          { cat: "actions", zone: "head",  motion: "up",      hint: "Index finger points and moves up" },
  "down":        { cat: "actions", zone: "hands", motion: "down",    hint: "Index finger points and moves down" },
  "here":        { cat: "actions", zone: "front", motion: "down",    hint: "Point down, just in front of you" },
  "there":       { cat: "actions", zone: "side",  motion: "forward", hint: "Point over to the place" },
  "big":         { cat: "actions", zone: "side",  motion: "side",    hint: "Arms stretch wide apart" },
  "little":      { cat: "actions", zone: "hands", motion: "none",    hint: "Finger and thumb show something small" },
  "look":        { cat: "actions", zone: "eye",   motion: "forward", hint: "Two fingers point from the eyes outwards" },
  "listen":      { cat: "actions", zone: "ear",   motion: "none",    hint: "Cupped hand held at the ear" },
  "noise":       { cat: "actions", zone: "ear",   motion: "tap",     hint: "Index finger points to the ear" },
  "speak":       { cat: "actions", zone: "mouth", motion: "forward", hint: "Open hand moves out from the mouth" },
  "sing":        { cat: "actions", zone: "mouth", motion: "wave",    hint: "Two fingers spiral away from the mouth" },
  "run":         { cat: "actions", zone: "hands", motion: "circle",  hint: "Fists circle quickly, like pumping arms" },
  "jump":        { cat: "actions", zone: "hands", motion: "up",      hint: "Two fingers stand on the palm and hop" },
  "kick":        { cat: "actions", zone: "hands", motion: "forward", hint: "Two fingers flick off the palm" },
  "swim":        { cat: "actions", zone: "chest", motion: "open",    hint: "Mime a gentle breaststroke" },
  "write":       { cat: "actions", zone: "hands", motion: "none",    hint: "Mime writing on the palm" },
  "paint":       { cat: "actions", zone: "hands", motion: "down",    hint: "Mime brush strokes on the other hand" },
  "cut":         { cat: "actions", zone: "hands", motion: "side",    hint: "Two fingers snip like scissors, moving along" },
  "build":       { cat: "actions", zone: "hands", motion: "up",      hint: "Hands place one on top of the other, building up" },
  "playing":     { cat: "actions", zone: "hands", motion: "circle",  hint: "Open hands circle outwards at the sides" },
  "colouring":   { cat: "actions", zone: "hands", motion: "shake",   hint: "Mime colouring with small strokes" },
  "learning":    { cat: "actions", zone: "head",  motion: "forward", hint: "Hands draw in from the head, taking ideas in" },
  "to":          { cat: "actions", zone: "hands", motion: "forward", hint: "Index fingers move to meet each other" },

  // Play & school
  "bricks":      { cat: "play", zone: "hands", motion: "up",      hint: "Mime stacking small bricks" },
  "book":        { cat: "play", zone: "hands", motion: "open",    hint: "Palms open out like a book" },
  "ball":        { cat: "play", zone: "hands", motion: "none",    hint: "Curved hands shape a ball" },
  "doll":        { cat: "play", zone: "hands", motion: "none",    hint: "Cradle a doll in your arms" },
  "teddy":       { cat: "play", zone: "chest", motion: "cross",   hint: "Hug, arms crossed over the chest" },
  "toys":        { cat: "play", zone: "hands", motion: "circle",  hint: "Point to the palm; whole shape circles twice" },
  "scissors":    { cat: "play", zone: "hands", motion: "side",    hint: "Fingers snip like scissors" },
  "pencils":     { cat: "play", zone: "hands", motion: "none",    hint: "Mime writing with a pencil" },
  "glue":        { cat: "play", zone: "hands", motion: "circle",  hint: "Mime spreading glue on the palm" },
  "paper":       { cat: "play", zone: "hands", motion: "circle",  hint: "Point to the palm; whole shape circles twice" },
  "playground":  { cat: "play", zone: "side",  motion: "circle",  hint: "Playing sign, then flat hand circles for the place" },
  "school":      { cat: "play", zone: "cheek", motion: "none",    hint: "Flat hand at the face, small movement" },
  "teacher":     { cat: "play", zone: "eye",   motion: "forward", hint: "Index fingers move out from beside the eyes" },
  "classroom":   { cat: "play", zone: "hands", motion: "side",    hint: "School sign, then fingers trace the room shape" },

  // Transport
  "boat":        { cat: "transport", zone: "hands", motion: "forward", hint: "Hands make a bow shape moving forward" },
  "train":       { cat: "transport", zone: "arm",   motion: "circle",  hint: "Fist circles like wheels along the other arm" },
  "aeroplane":   { cat: "transport", zone: "side",  motion: "forward", hint: "Hand with thumb and little finger out flies across" },
  "bus":         { cat: "transport", zone: "hands", motion: "circle",  hint: "Both fists steer a large wheel" },
  "car":         { cat: "transport", zone: "hands", motion: "circle",  hint: "Fists steer a car" },
  "motorbike":   { cat: "transport", zone: "hands", motion: "shake",   hint: "Twist both fists like revving handlebars" },
  "bicycle":     { cat: "transport", zone: "hands", motion: "circle",  hint: "Fists pedal round in circles" },
  "tricycle":    { cat: "transport", zone: "hands", motion: "circle",  hint: "Fists pedal round, then mime pedalling" },
  "ride a bicycle": { cat: "transport", zone: "hands", motion: "circle", hint: "Fists pedal round, like riding a bike" },
  "ride a horse": { cat: "transport", zone: "hands", motion: "down",   hint: "Two fingers sit astride the other hand and bounce" },

  // Animals
  "rabbit":      { cat: "animals", zone: "head",  motion: "shake",  hint: "Two fingers up at the head, waggle like ears" },
  "fish":        { cat: "animals", zone: "hands", motion: "wave",   hint: "Flat hand swims forward, wiggling" },
  "cow":         { cat: "animals", zone: "head",  motion: "none",   hint: "Hands make horns at the head" },
  "dog":         { cat: "animals", zone: "hands", motion: "down",   hint: "Two hands paw downwards, like a begging dog" },
  "bird":        { cat: "animals", zone: "mouth", motion: "tap",    hint: "Finger and thumb open and close like a beak" },
  "cat":         { cat: "animals", zone: "cheek", motion: "side",   hint: "Spread fingers draw out whiskers" },
  "horse":       { cat: "animals", zone: "hands", motion: "down",   hint: "Two fingers astride the other hand, riding along" },
  "pig":         { cat: "animals", zone: "nose",  motion: "circle", hint: "Fist circles at the nose, like a snout" },

  // Places & nature
  "house":       { cat: "places", zone: "hands", motion: "down",   hint: "Fingertips meet like a roof, hands draw down the walls" },
  "farm":        { cat: "places", zone: "hands", motion: "forward", hint: "Point down to the palm, then sweep the hand out" },
  "tree":        { cat: "places", zone: "arm",   motion: "shake",  hint: "Forearm up like a trunk, hand waves like branches" },
  "flower":      { cat: "places", zone: "nose",  motion: "side",   hint: "Fingertips at the nose, sniff to each side" },
  "home":        { cat: "places", zone: "front", motion: "down",   hint: "Curved hand settles, like a roof over a place" },
};

// Words that map onto a canonical sign
const SYNONYMS = {
  mummy: "mum", mommy: "mum", mama: "mum", mom: "mum",
  daddy: "dad", dada: "dad", papa: "dad",
  grandma: "grandmother", granny: "grandmother", gran: "grandmother",
  nana: "grandmother", nanny: "grandmother",
  grandad: "grandfather", granddad: "grandfather", grandpa: "grandfather",
  hi: "hello", hiya: "hello", hey: "hello",
  bye: "goodbye", byebye: "goodbye",
  ta: "thank you", thanks: "thank you",
  loo: "toilet", potty: "toilet", wee: "toilet", poo: "toilet",
  bathtime: "bath", bedtime: "bed", sleepy: "sleep", nap: "sleep",
  plane: "aeroplane", airplane: "aeroplane",
  bike: "bicycle", trike: "tricycle",
  doggy: "dog", doggie: "dog", puppy: "dog",
  kitty: "cat", kitten: "cat", horsey: "horse", bunny: "rabbit",
  birdie: "bird", piggy: "pig",
  food: "eat", dinner: "eat", lunch: "eat", breakfast: "eat", hungry: "eat",
  juice: "drink", water: "drink", cuppa: "drink", thirsty: "drink",
  jab: "injection", ouch: "hurt", pain: "hurt", poorly: "hurt",
  large: "big", huge: "big", small: "little", tiny: "little",
  pretty: "beautiful", lovely: "beautiful",
  talk: "speak", talking: "speak", say: "speak",
  not: "no", dont: "no",
  wants: "want", needs: "need", likes: "like", loves: "love",
  washing: "wash", drying: "drying", eating: "eat", drinking: "drink",
  sleeping: "sleep", swimming: "swim", running: "run", jumping: "jump",
  kicking: "kick", singing: "sing", looking: "look", listening: "listen",
  writing: "write", painting: "paint", cutting: "cut", building: "build",
  play: "playing", plays: "playing", helping: "help",
  colour: "colouring", coloring: "colouring", learn: "learning",
  teeth: "brush teeth", toothbrush: "brush teeth",
  xray: "x-ray", tshirt: "t-shirt",
  question: "questions", brick: "bricks", toy: "toys", pencil: "pencils",
  shoe: "shoes", socks: "sock", biscuits: "biscuit", books: "book",
  auntie: "aunt", aunty: "aunt", finish: "finished", stop: "finished",
  mine: "my", me: "i", gone: "finished", again: "more",
};

// Multi-word phrases in the vocabulary (checked before single words)
const MULTIWORD = [
  "get undressed", "get dressed", "ride a bicycle", "ride a bike",
  "ride a horse", "broken bone", "brush teeth", "brushing teeth",
  "brush your teeth", "brush hair", "brush your hair", "wash hands",
  "wash your hands", "washing your hands", "ice cream", "thank you",
  "x ray", "t shirt", "all done", "well done", "night night",
];

const MULTIWORD_MAP = {
  "ride a bike": "ride a bicycle",
  "brushing teeth": "brush teeth",
  "brush your teeth": "brush teeth",
  "brush your hair": "brush hair",
  "wash your hands": "wash hands",
  "washing your hands": "wash hands",
  "x ray": "x-ray",
  "t shirt": "t-shirt",
  "all done": "finished",
  "well done": "good",
  "night night": "sleep",
};

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "of", "for", "do", "does", "did",
  "am", "are", "was", "were", "be", "been", "being", "it", "its", "that",
  "this", "these", "those", "at", "on", "in", "with", "from", "by", "some",
  "any", "will", "would", "can", "could", "shall", "should", "may", "might",
  "must", "very", "really", "just", "so", "then", "now", "oh", "time",
  "lets", "let", "us", "we", "have", "has", "had", "going", "gonna", "ok",
  "okay", "right",
]);

const QUICK_PHRASES = [
  "Hello, my name is",
  "Do you want a drink?",
  "More please",
  "Thank you",
  "Time for bed",
  "Do you need the toilet?",
  "Brush your teeth",
  "I love you",
  "All done!",
  "Where is teddy?",
];

// ---- Tokeniser -------------------------------------------------

function normalise(text) {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveWord(word) {
  if (SIGNS[word]) return word;
  if (SYNONYMS[word] && SIGNS[SYNONYMS[word]]) return SYNONYMS[word];
  // simple plural fallback
  if (word.endsWith("s")) {
    const singular = word.slice(0, -1);
    if (SIGNS[singular]) return singular;
    if (SYNONYMS[singular] && SIGNS[SYNONYMS[singular]]) return SYNONYMS[singular];
  }
  return null;
}

function tokenise(text) {
  const words = normalise(text).split(" ").filter(Boolean);
  const tokens = [];
  let i = 0;
  while (i < words.length) {
    let matched = false;
    // greedy: try 3-word then 2-word phrases
    for (let len = 3; len >= 2; len--) {
      if (i + len <= words.length) {
        const phrase = words.slice(i, i + len).join(" ");
        if (MULTIWORD.includes(phrase)) {
          const key = MULTIWORD_MAP[phrase] || phrase;
          if (SIGNS[key]) {
            tokens.push({ word: phrase, key });
            i += len;
            matched = true;
            break;
          }
        }
      }
    }
    if (matched) continue;
    const w = words[i];
    if (STOPWORDS.has(w)) {
      i++;
      continue;
    }
    const key = resolveWord(w);
    tokens.push({ word: w, key });
    i++;
  }
  return tokens;
}

// ---- Figure graphic --------------------------------------------

const ZONES = {
  head:     [50, 6],
  forehead: [50, 13],
  ear:      [63, 20],
  eye:      [44, 17],
  nose:     [50, 22],
  mouth:    [50, 28],
  chin:     [50, 33],
  cheek:    [59, 25],
  shoulder: [30, 48],
  chest:    [50, 60],
  elbow:    [23, 70],
  arm:      [26, 60],
  wrist:    [22, 80],
  hands:    [50, 82],
  front:    [50, 72],
  side:     [84, 58],
  waist:    [50, 90],
  legs:     [50, 102],
};

function MotionMark({ type, x, y, tint }) {
  const s = { stroke: tint, strokeWidth: 2.4, fill: "none", strokeLinecap: "round" };
  switch (type) {
    case "tap":
      return (
        <g {...s}>
          <path d={`M ${x - 5} ${y - 12} l -2 -5`} />
          <path d={`M ${x + 5} ${y - 12} l 2 -5`} />
        </g>
      );
    case "circle":
      return (
        <g {...s}>
          <path
            d={`M ${x + 11} ${y} A 11 11 0 1 1 ${x + 7.8} ${y - 7.8}`}
            strokeDasharray="3 3"
          />
          <path d={`M ${x + 7.8} ${y - 7.8} l 4 -1 M ${x + 7.8} ${y - 7.8} l 1 4`} />
        </g>
      );
    case "up":
      return (
        <g {...s}>
          <path d={`M ${x} ${y - 6} l 0 -14`} />
          <path d={`M ${x} ${y - 20} l -4 5 M ${x} ${y - 20} l 4 5`} />
        </g>
      );
    case "down":
      return (
        <g {...s}>
          <path d={`M ${x} ${y + 6} l 0 14`} />
          <path d={`M ${x} ${y + 20} l -4 -5 M ${x} ${y + 20} l 4 -5`} />
        </g>
      );
    case "forward":
      return (
        <g {...s}>
          <path d={`M ${x + 6} ${y} l 14 0`} />
          <path d={`M ${x + 20} ${y} l -5 -4 M ${x + 20} ${y} l -5 4`} />
        </g>
      );
    case "side":
      return (
        <g {...s}>
          <path d={`M ${x - 16} ${y - 12} l 32 0`} />
          <path d={`M ${x - 16} ${y - 12} l 5 -4 M ${x - 16} ${y - 12} l 5 4`} />
          <path d={`M ${x + 16} ${y - 12} l -5 -4 M ${x + 16} ${y - 12} l -5 4`} />
        </g>
      );
    case "wave":
      return (
        <g {...s}>
          <path
            d={`M ${x - 14} ${y - 12} q 4 -8 8 0 q 4 8 8 0 q 4 -8 8 0`}
          />
        </g>
      );
    case "shake":
      return (
        <g {...s}>
          <path d={`M ${x - 12} ${y - 12} l 6 -5 l 6 5 l 6 -5 l 6 5`} />
        </g>
      );
    case "open":
      return (
        <g {...s}>
          {[-40, -20, 0, 20, 40].map((deg) => {
            const r = (deg * Math.PI) / 180;
            const x1 = x + Math.sin(r) * 10;
            const y1 = y - Math.cos(r) * 10;
            const x2 = x + Math.sin(r) * 18;
            const y2 = y - Math.cos(r) * 18;
            return <path key={deg} d={`M ${x1} ${y1} L ${x2} ${y2}`} />;
          })}
        </g>
      );
    case "cross":
      return (
        <g {...s}>
          <path d={`M ${x - 12} ${y - 10} L ${x + 12} ${y + 10}`} />
          <path d={`M ${x + 12} ${y - 10} L ${x - 12} ${y + 10}`} />
        </g>
      );
    default:
      return null;
  }
}

function Figure({ zone, motion, tint, className = "w-24 h-28 mx-auto" }) {
  const [zx, zy] = ZONES[zone] || ZONES.chest;
  return (
    <svg
      viewBox="0 0 100 118"
      className={className}
      role="img"
      aria-hidden="true"
    >
      {/* head */}
      <circle cx="50" cy="21" r="13" fill="none" stroke="#1E3A38" strokeWidth="2" />
      {/* shoulders and torso */}
      <path
        d="M 28 52 Q 50 36 72 52 L 74 106 Q 50 112 26 106 Z"
        fill="#FFFFFF"
        stroke="#1E3A38"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* zone highlight */}
      <circle cx={zx} cy={zy} r="8" fill={tint} opacity="0.35" className="sas-pulse" />
      <circle cx={zx} cy={zy} r="3.2" fill={tint} />
      <MotionMark type={motion} x={zx} y={zy} tint="#1E3A38" />
    </svg>
  );
}

// ---- Cards -----------------------------------------------------

function SignCard({ token, large }) {
  const sign = token.key ? SIGNS[token.key] : null;
  const tint = sign ? CATEGORIES[sign.cat].tint : "#C9C9C9";
  const displayWord = token.key || token.word;

  if (!sign) {
    return (
      <div
        className="flex-shrink-0 w-40 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-3 text-center flex flex-col items-center justify-center gap-2"
        style={{ minHeight: large ? 220 : 180 }}
      >
        <div className="text-3xl" aria-hidden="true">💬</div>
        <div className="font-bold text-lg" style={{ fontFamily: "'Baloo 2', sans-serif", color: "#1E3A38" }}>
          {token.word}
        </div>
        <div className="text-xs text-gray-500">
          No sign in this set. Just say the word clearly.
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 w-40 rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden text-center"
      style={{ minHeight: large ? 220 : 180 }}
    >
      <div style={{ height: 8, backgroundColor: tint }} />
      <div className="p-2">
        <Figure zone={sign.zone} motion={sign.motion} tint={tint} />
        <div
          className="font-bold text-xl leading-tight"
          style={{ fontFamily: "'Baloo 2', sans-serif", color: "#1E3A38" }}
        >
          {displayWord}
        </div>
        <div className="text-xs mt-1 px-1" style={{ color: "#4A6360" }}>
          {sign.hint}
        </div>
      </div>
    </div>
  );
}

// ---- Large follow-along overlay --------------------------------

function SignOverlay({ tokens, index, mode, onClose, onStep, onJump, onModeChange }) {
  const token = tokens[index];
  const sign = token.key ? SIGNS[token.key] : null;
  const tint = sign ? CATEGORIES[sign.cat].tint : "#C9C9C9";
  const displayWord = token.key || token.word;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (mode === "single" && e.key === "ArrowRight") onStep(1);
      else if (mode === "single" && e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onStep, mode]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    document
      .querySelector('[aria-current="step"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [index, mode]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "#F1F6F4" }}
      role="dialog"
      aria-modal="true"
      aria-label={`Large sign view: ${displayWord}`}
    >
      {/* Phrase strip + close */}
      <div className="flex items-start gap-2 p-4">
        {mode === "single" ? (
          <div
            className="flex-1 flex gap-2 overflow-x-auto sm:flex-wrap pb-1"
            aria-label="Phrase words"
          >
            {tokens.map((t, i) => (
              <button
                key={i}
                onClick={() => onJump(i)}
                className="sas-focus flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold border-2"
                style={{
                  backgroundColor: i === index ? "#1E3A38" : "#FFFFFF",
                  color: i === index ? "#FFFFFF" : "#1E3A38",
                  borderColor: "#1E3A38",
                }}
                aria-current={i === index ? "step" : undefined}
              >
                {t.key || t.word}
              </button>
            ))}
          </div>
        ) : (
          <div
            className="flex-1 self-center font-bold text-xl"
            style={{ fontFamily: "'Baloo 2', sans-serif", color: "#1E3A38" }}
          >
            Whole phrase
          </div>
        )}
        <button
          onClick={() => onModeChange(mode === "single" ? "all" : "single")}
          className="sas-focus flex-shrink-0 rounded-xl px-4 py-2 font-bold border-2 border-gray-300 bg-white"
          style={{ color: "#1E3A38", fontFamily: "'Baloo 2', sans-serif" }}
        >
          {mode === "single" ? "See all" : "One at a time"}
        </button>
        <button
          onClick={onClose}
          className="sas-focus flex-shrink-0 rounded-xl px-4 py-2 text-xl font-bold border-2 border-gray-300 bg-white"
          style={{ color: "#1E3A38" }}
          aria-label="Close large view"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      {/* Whole-phrase grid */}
      {mode === "all" && (
        <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
          <div
            className="grid gap-3 max-w-5xl mx-auto pt-2"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
          >
            {tokens.map((t, i) => {
              const s = t.key ? SIGNS[t.key] : null;
              const cardTint = s ? CATEGORIES[s.cat].tint : "#C9C9C9";
              return (
                <button
                  key={i}
                  onClick={() => {
                    onJump(i);
                    onModeChange("single");
                  }}
                  className={`sas-focus relative flex flex-col rounded-2xl bg-white text-center overflow-hidden shadow-sm ${
                    s
                      ? "border border-gray-200"
                      : "border-2 border-dashed border-gray-300"
                  }`}
                  aria-label={`Show ${t.key || t.word} one at a time`}
                >
                  <div style={{ height: 8, backgroundColor: s ? cardTint : "transparent" }} />
                  <span
                    className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: "#1E3A38" }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="p-3">
                    {s ? (
                      <Figure
                        zone={s.zone}
                        motion={s.motion}
                        tint={cardTint}
                        className="w-28 h-32 mx-auto"
                      />
                    ) : (
                      <div
                        className="w-28 h-32 mx-auto flex items-center justify-center text-5xl"
                        aria-hidden="true"
                      >
                        💬
                      </div>
                    )}
                    <div
                      className="font-bold text-2xl leading-tight"
                      style={{ fontFamily: "'Baloo 2', sans-serif", color: "#1E3A38" }}
                    >
                      {t.key || t.word}
                    </div>
                    <div className="text-sm mt-1" style={{ color: "#4A6360" }}>
                      {s ? s.hint : "No sign - just say it clearly"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Big card */}
      {mode === "single" && (
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        <div className="w-full max-w-xl max-h-full overflow-y-auto rounded-3xl bg-white border border-gray-200 shadow-lg text-center">
          <div style={{ height: 12, backgroundColor: tint }} />
          <div className="p-6">
            {sign ? (
              <>
                <Figure
                  zone={sign.zone}
                  motion={sign.motion}
                  tint={tint}
                  className="w-52 h-60 sm:w-64 sm:h-72 mx-auto"
                />
                <div
                  className="font-bold"
                  style={{
                    fontFamily: "'Baloo 2', sans-serif",
                    color: "#1E3A38",
                    fontSize: "clamp(2.5rem, 8vw, 4rem)",
                    lineHeight: 1.1,
                  }}
                >
                  {displayWord}
                </div>
                <p className="mt-3 text-lg sm:text-xl" style={{ color: "#4A6360" }}>
                  {sign.hint}
                </p>
              </>
            ) : (
              <>
                <div className="text-7xl my-8" aria-hidden="true">💬</div>
                <div
                  className="font-bold"
                  style={{
                    fontFamily: "'Baloo 2', sans-serif",
                    color: "#1E3A38",
                    fontSize: "clamp(2.5rem, 8vw, 4rem)",
                    lineHeight: 1.1,
                  }}
                >
                  {token.word}
                </div>
                <p className="mt-3 text-lg sm:text-xl" style={{ color: "#4A6360" }}>
                  No sign in this set. Just say the word clearly.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      )}

      {/* Navigation */}
      {mode === "single" && (
      <div className="flex items-center justify-center gap-4 p-4 pb-6">
        <button
          onClick={() => onStep(-1)}
          disabled={index === 0}
          className="sas-focus rounded-xl px-6 py-4 text-xl font-bold border-2 border-gray-300 bg-white disabled:opacity-40"
          style={{ color: "#1E3A38", fontFamily: "'Baloo 2', sans-serif" }}
          aria-label="Previous sign"
        >
          ← Back
        </button>
        <span
          className="text-lg font-bold tabular-nums"
          style={{ color: "#4A6360" }}
          aria-live="polite"
        >
          {index + 1} of {tokens.length}
        </span>
        <button
          onClick={() => onStep(1)}
          disabled={index === tokens.length - 1}
          className="sas-focus rounded-xl px-6 py-4 text-xl font-bold text-white disabled:opacity-40"
          style={{ backgroundColor: "#1E3A38", fontFamily: "'Baloo 2', sans-serif" }}
          aria-label="Next sign"
        >
          Next →
        </button>
      </div>
      )}
    </div>
  );
}

// ---- Logo ------------------------------------------------------
// A waving hand inside a speech bubble: speech and sign together.

function Logo({ size = 40, light = false }) {
  const bubble = light ? "#FFFFFF" : "#1E3A38";
  const hand = light ? "#1E3A38" : "#FFFFFF";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Say and Sign logo"
    >
      <path
        d="M32 5 C16.5 5 5 15 5 27.5 C5 40 16.5 50 32 50 c2.3 0 4.5 -0.2 6.6 -0.6 L50.5 55 L48 44.6 C54.5 40.4 59 34.4 59 27.5 C59 15 47.5 5 32 5 Z"
        fill={bubble}
      />
      <g fill={hand}>
        {/* four fingers */}
        <rect x="25" y="21" width="3.8" height="12" rx="1.9" />
        <rect x="29.8" y="17" width="3.8" height="16" rx="1.9" />
        <rect x="34.6" y="16" width="3.8" height="17" rx="1.9" />
        <rect x="39.4" y="18.5" width="3.8" height="14" rx="1.9" />
        {/* thumb, angled out from the palm */}
        <rect
          x="15"
          y="29.9"
          width="12"
          height="4.2"
          rx="2.1"
          transform="rotate(40 27 32)"
        />
        {/* palm */}
        <rect x="24" y="28" width="19.2" height="13" rx="6" />
      </g>
      <path
        d="M47 21 a 9.5 9.5 0 0 1 0 14"
        stroke="#E8654F"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ---- Main app --------------------------------------------------

export default function SayAndSign() {
  const [input, setInput] = useState("");
  const [tokens, setTokens] = useState(null);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [browseCat, setBrowseCat] = useState(null);
  const [overlayIdx, setOverlayIdx] = useState(null);
  const [overlayMode, setOverlayMode] = useState("single");
  const recognitionRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSpeechSupported(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-GB";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setTokens(tokenise(text));
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch (err) {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    if (tokens && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [tokens]);

  const translate = (text) => {
    const t = text ?? input;
    if (!t.trim()) return;
    setOverlayIdx(null);
    setTokens(tokenise(t));
  };

  const stepOverlay = (delta) => {
    setOverlayIdx((i) =>
      Math.max(0, Math.min((tokens?.length ?? 1) - 1, i + delta))
    );
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    setListening(true);
    try {
      recognitionRef.current.start();
    } catch (err) {
      setListening(false);
    }
  };

  const speakPhrase = () => {
    if (!("speechSynthesis" in window) || !input.trim()) return;
    const utter = new SpeechSynthesisUtterance(input);
    utter.lang = "en-GB";
    utter.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const vocabByCat = useMemo(() => {
    const map = {};
    Object.entries(SIGNS).forEach(([key, sign]) => {
      if (!map[sign.cat]) map[sign.cat] = [];
      map[sign.cat].push(key);
    });
    Object.values(map).forEach((arr) => arr.sort());
    return map;
  }, []);

  const signedCount = tokens ? tokens.filter((t) => t.key).length : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F1F6F4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap');
        .sas-body { font-family: 'Atkinson Hyperlegible', system-ui, sans-serif; }
        .sas-pulse { animation: sasPulse 1.8s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes sasPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.25); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sas-pulse { animation: none; }
        }
        .sas-focus:focus-visible { outline: 3px solid #1E3A38; outline-offset: 2px; }
        html { scroll-behavior: smooth; }
        button, a { transition: transform .15s ease, box-shadow .15s ease, background-color .15s ease, border-color .15s ease, color .15s ease; }
        .sas-navlink { color: #1E3A38; }
        .sas-navlink:hover { color: #E8654F; }
        .sas-primary:hover { background-color: #2C524F !important; }
        .sas-chip:hover { background-color: #EAF2EF !important; }
        .sas-lift:hover { transform: translateY(-3px); }
      `}</style>

      {/* Top bar */}
      <header
        className="sas-body sticky top-0 z-40 border-b border-gray-200"
        style={{ backgroundColor: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Logo size={40} />
          <div>
            <div
              className="text-xl font-bold leading-none"
              style={{ fontFamily: "'Baloo 2', sans-serif", color: "#1E3A38" }}
            >
              Say &amp; Sign
            </div>
            <div className="text-xs mt-1 hidden sm:block" style={{ color: "#4A6360" }}>
              Sign prompts for talking families
            </div>
          </div>
          <nav className="ml-auto flex items-center gap-5 text-sm font-bold flex-shrink-0">
            <a href="#browse" className="sas-focus sas-navlink whitespace-nowrap">
              Browse signs
            </a>
            <a href="#about" className="sas-focus sas-navlink whitespace-nowrap">
              About
            </a>
          </nav>
        </div>
      </header>

      <main className="sas-body max-w-3xl mx-auto px-4 pb-12">
        {/* Hero */}
        <section className="pt-8 pb-6">
          <h1
            className="text-4xl sm:text-5xl font-bold leading-tight"
            style={{ fontFamily: "'Baloo 2', sans-serif", color: "#1E3A38" }}
          >
            Say it. Sign it. <span style={{ color: "#E8654F" }}>Together.</span>
          </h1>
          <p className="mt-3 text-lg max-w-xl" style={{ color: "#4A6360" }}>
            Type or speak a phrase and we turn the key words into
            Makaton-style sign prompts, in order. Always say the whole phrase
            aloud as you sign the key words.
          </p>
        </section>

        {/* Input */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5">
          <label
            htmlFor="phrase"
            className="block font-bold mb-2"
            style={{ color: "#1E3A38" }}
          >
            Your phrase
          </label>
          <div className="flex gap-2">
            <input
              id="phrase"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") translate();
              }}
              placeholder="e.g. Do you want a drink?"
              className="sas-focus flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 text-lg"
              style={{ color: "#1E3A38" }}
              aria-label="Phrase to translate into sign prompts"
            />
            <button
              onClick={startListening}
              disabled={!speechSupported}
              className="sas-focus rounded-xl px-4 py-3 text-2xl font-bold border-2"
              style={{
                backgroundColor: listening ? "#E8654F" : "#FFFFFF",
                borderColor: listening ? "#E8654F" : "#D1D5DB",
                minWidth: 56,
              }}
              aria-label={listening ? "Stop listening" : "Speak your phrase"}
              title={
                speechSupported
                  ? listening
                    ? "Stop listening"
                    : "Speak your phrase"
                  : "Voice input is not supported in this browser"
              }
            >
              <span aria-hidden="true">{listening ? "⏹" : "🎤"}</span>
            </button>
          </div>
          {listening && (
            <p className="mt-2 text-sm" style={{ color: "#E8654F" }} aria-live="polite">
              Listening... speak your phrase now.
            </p>
          )}
          {!speechSupported && (
            <p className="mt-2 text-sm text-gray-500">
              Voice input isn't available in this browser, but typing works fine.
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => translate()}
              className="sas-focus sas-primary rounded-xl px-6 py-3 font-bold text-lg text-white"
              style={{
                backgroundColor: "#1E3A38",
                fontFamily: "'Baloo 2', sans-serif",
              }}
            >
              Sign it
            </button>
            <button
              onClick={speakPhrase}
              className="sas-focus rounded-xl px-4 py-3 font-bold border-2 border-gray-300"
              style={{ color: "#1E3A38" }}
              aria-label="Speak the phrase aloud"
            >
              <span aria-hidden="true">🔊</span> Say it aloud
            </button>
          </div>

          {/* Quick phrases */}
          <div className="mt-4">
            <p className="text-sm font-bold mb-2" style={{ color: "#4A6360" }}>
              Quick phrases
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PHRASES.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setInput(p);
                    translate(p);
                  }}
                  className="sas-focus sas-chip rounded-full px-4 py-2 text-sm border border-gray-300 bg-white"
                  style={{ color: "#1E3A38" }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef} aria-live="polite">
          {tokens && (
            <section className="mt-6">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: "'Baloo 2', sans-serif", color: "#1E3A38" }}
                >
                  Sign along
                </h2>
                {tokens.length > 0 && (
                  <button
                    onClick={() => {
                      setOverlayMode("all");
                      setOverlayIdx(0);
                    }}
                    className="sas-focus rounded-xl px-4 py-2 font-bold border-2 border-gray-300 bg-white"
                    style={{ color: "#1E3A38", fontFamily: "'Baloo 2', sans-serif" }}
                  >
                    <span aria-hidden="true">⛶</span> Large view
                  </button>
                )}
              </div>
              <p className="text-sm mb-3" style={{ color: "#4A6360" }}>
                {signedCount > 0
                  ? `${signedCount} sign${signedCount === 1 ? "" : "s"} found. Sign the cards left to right while saying the whole phrase. Tap a card to see it large.`
                  : "No signs found in this set for that phrase. Try simpler key words."}
              </p>
              <div className="flex gap-3 overflow-x-auto pb-3 items-stretch">
                {tokens.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setOverlayMode("single");
                        setOverlayIdx(idx);
                      }}
                      className="sas-focus sas-lift text-left flex-shrink-0"
                      aria-label={`Show ${t.key || t.word} in large view`}
                    >
                      <SignCard token={t} large />
                    </button>
                    {idx < tokens.length - 1 && (
                      <span
                        className="text-2xl flex-shrink-0"
                        style={{ color: "#9CB5B0" }}
                        aria-hidden="true"
                      >
                        →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Browse */}
        <section id="browse" className="mt-10 scroll-mt-20">
          <h2
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: "'Baloo 2', sans-serif", color: "#1E3A38" }}
          >
            Browse the signs
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setBrowseCat(browseCat === key ? null : key)}
                className="sas-focus rounded-full px-4 py-2 text-sm font-bold border-2"
                style={{
                  backgroundColor: browseCat === key ? cat.tint : "#FFFFFF",
                  borderColor: cat.tint,
                  color: "#1E3A38",
                }}
                aria-pressed={browseCat === key}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {browseCat && (
            <div className="flex gap-3 overflow-x-auto pb-3">
              {(vocabByCat[browseCat] || []).map((key) => (
                <SignCard key={key} token={{ word: key, key }} />
              ))}
            </div>
          )}
          {!browseCat && (
            <p className="text-sm" style={{ color: "#4A6360" }}>
              Pick a category to see all the signs in this set.
            </p>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer id="about" className="sas-body" style={{ backgroundColor: "#1E3A38" }}>
        <div className="max-w-3xl mx-auto px-4 py-10 text-sm" style={{ color: "#BFD4CF" }}>
          <div className="flex items-center gap-3 mb-5">
            <Logo size={36} light />
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "'Baloo 2', sans-serif", color: "#FFFFFF" }}
            >
              Say &amp; Sign
            </span>
          </div>
          <p className="font-bold mb-1" style={{ color: "#FFFFFF" }}>
            A note on Makaton
          </p>
          <p className="max-w-2xl leading-relaxed">
            Makaton belongs to The Makaton Charity (makaton.org). The
            graphics here are simplified memory prompts showing roughly
            where and how each sign moves; they are not official Makaton
            illustrations. For exact handshapes, please check official
            Makaton resources, your speech and language therapist, or the
            NHS leaflet this vocabulary is based on. Makaton always pairs
            signs with normal speech, so keep talking as you sign.
          </p>
          <p className="mt-6 text-xs" style={{ color: "#7FA39C" }}>
            Made for families. Not affiliated with or endorsed by The Makaton
            Charity.
          </p>
        </div>
      </footer>

      {tokens && overlayIdx !== null && overlayIdx < tokens.length && (
        <SignOverlay
          tokens={tokens}
          index={overlayIdx}
          mode={overlayMode}
          onClose={() => setOverlayIdx(null)}
          onStep={stepOverlay}
          onJump={(i) => setOverlayIdx(i)}
          onModeChange={setOverlayMode}
        />
      )}
    </div>
  );
}
