const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const levelEl = document.querySelector("#level");
const scoreEl = document.querySelector("#score");
const levelGoalsEl = document.querySelector("#levelGoals");
const livesEl = document.querySelector("#lives");
const coinsEl = document.querySelector("#coins");
const messageEl = document.querySelector("#message");
const startBtn = document.querySelector("#startBtn");
const playerSelect = document.querySelector("#playerSelect");
const levelSelect = document.querySelector("#levelSelect");
const restartTopBtn = document.querySelector("#restartTopBtn");
const soundBtn = document.querySelector("#soundBtn");
const leftBtn = document.querySelector("#leftBtn");
const rightBtn = document.querySelector("#rightBtn");
const upBtn = document.querySelector("#upBtn");
const downBtn = document.querySelector("#downBtn");
const shootBtn = document.querySelector("#shootBtn");

const GAME_W = 900;
const GAME_H = 600;
const LANES = [275, 450, 625];
const PLAYER_Y = 492;
const PLAYER_MIN_Y = 330;
const PLAYER_MAX_Y = 515;
const PLAYER_STEP_Y = 54;
const GOAL_Y = 76;
const GOALS_PER_LEVEL = 3;
const LIVES_PER_LEVEL = 2;

const PLAYERS = {
  derek: { name: "Derek", number: "10", ballSide: -1, goalLine: "Derek dance tornado!" },
  dani: { name: "Dani", number: "9", ballSide: 1, goalLine: "Dani power pose!" },
};

const SPORTS = {
  football: {
    name: "Football",
    target: "goal",
    scoringVerb: "scores",
    bigCheer: "GOOOAAALLL!",
    announcer: "Goooooooal!",
    blocked: "SAVED! The crowd cannot believe it.",
    badShot: "Oops! That shot landed in the snack stand.",
    wait: "Wait for SHOOT NOW!",
  },
};

const LEVELS = [
  {
    opponent: "Venezuela",
    music: "public/Golazo%20Fiesta.mp3",
    twist: "classic",
    primary: "#8a1538",
    secondary: "#f3c64b",
    accent: "#113a8f",
    keeper: "#f3c64b",
    keeperAccent: "#8a1538",
  },
  {
    opponent: "Uruguay",
    music: "public/Golazo%20Fiesta2.mp3",
    twist: "classic",
    primary: "#78c7f2",
    secondary: "#ffffff",
    accent: "#111827",
    keeper: "#111827",
    keeperAccent: "#78c7f2",
  },
  {
    opponent: "Brazil",
    music: "public/Gol%20Na%20Quadra.mp3",
    twist: "classic",
    primary: "#ffd43b",
    secondary: "#1f8f43",
    accent: "#2457c5",
    keeper: "#2457c5",
    keeperAccent: "#ffd43b",
  },
  {
    opponent: "Spain",
    music: "public/Gol%20en%20la%20Plaza.mp3",
    twist: "classic",
    primary: "#c9152d",
    secondary: "#ffd23f",
    accent: "#243f8f",
    keeper: "#ffd23f",
    keeperAccent: "#c9152d",
  },
  {
    opponent: "France",
    music: "public/Blue%20Shirt%20Parade.mp3",
    twist: "classic",
    primary: "#1c3f94",
    secondary: "#ffffff",
    accent: "#ef3340",
    keeper: "#ef3340",
    keeperAccent: "#1c3f94",
  },
  {
    opponent: "Argentina",
    music: "public/La%20Pelota%20Baila.mp3",
    twist: "classic",
    primary: "#7ac7f5",
    secondary: "#ffffff",
    accent: "#202a44",
    keeper: "#202a44",
    keeperAccent: "#7ac7f5",
    striped: true,
  },
  {
    opponent: "Mexico",
    music: "public/Golazo%20Fiesta5.mp3",
    twist: "zigzag",
    primary: "#0b7a3b",
    secondary: "#ffffff",
    accent: "#ce1126",
    keeper: "#ce1126",
    keeperAccent: "#ffffff",
  },
  {
    opponent: "Germany",
    music: "public/Ma%C3%9F%20und%20Tor.mp3",
    twist: "wall",
    primary: "#ffffff",
    secondary: "#111827",
    accent: "#ffce00",
    keeper: "#111827",
    keeperAccent: "#ffce00",
  },
  {
    opponent: "Japan",
    music: "public/Kickoff%20Parade.mp3",
    twist: "quick",
    primary: "#1f4fa3",
    secondary: "#ffffff",
    accent: "#bc002d",
    keeper: "#bc002d",
    keeperAccent: "#ffffff",
  },
  {
    opponent: "Portugal",
    music: "public/Portugal%20Kickoff.mp3",
    twist: "superKeeper",
    primary: "#c8102e",
    secondary: "#006a4e",
    accent: "#ffd100",
    keeper: "#006a4e",
    keeperAccent: "#ffd100",
  },
];

const colors = {
  white: "#fff8e7",
  ink: "#17222b",
  grass: "#34bf65",
  grassDark: "#20994d",
  stripe: "#66dc86",
  lane: "rgba(255, 255, 255, 0.28)",
  orange: "#ff7a2f",
  yellow: "#ffcf33",
  blue: "#1d9bf0",
  red: "#ef3d3d",
  purple: "#8d5cf6",
};

let state;
let lastTime = 0;
let audioCtx;
let musicAudio;
let currentMusicSrc = "";
let soundOn = true;
let swipeStart = null;
let selectedStartLevel = 0;
let selectedPlayerId = "derek";
let selectedSport = "football";

function freshState() {
  return {
    status: "menu",
    sport: selectedSport,
    playerId: selectedPlayerId,
    lane: 1,
    targetLane: 1,
    playerX: LANES[1],
    playerY: PLAYER_Y,
    targetY: PLAYER_Y,
    ballY: PLAYER_Y - 14,
    distance: 0,
    speed: 215,
    score: 0,
    level: 0,
    goalsThisLevel: 0,
    coins: 0,
    streak: 0,
    lives: LIVES_PER_LEVEL,
    obstacles: [],
    particles: [],
    floaters: [],
    goalkeeper: { x: LANES[1], dir: 1, dive: 0 },
    crowd: { mood: "neutral", timer: 0 },
    nextSpawn: 0.65,
    nextEvent: 6,
    shootWindow: false,
    shooting: false,
    shot: null,
    celebration: 0,
    fail: 0,
    shake: 0,
    banner: "Move with arrows or WASD. Space shoots.",
    funnyEvent: "",
    boost: 0,
  };
}

function currentLevel() {
  return LEVELS[state.level];
}

function currentPlayer() {
  return PLAYERS[state.playerId] || PLAYERS.derek;
}

function currentSport() {
  return SPORTS[state.sport] || SPORTS.football;
}

function playLevelMusic() {
  if (!soundOn) return;

  const track = currentLevel().music;
  if (!musicAudio) {
    musicAudio = new Audio(track);
    musicAudio.loop = true;
    musicAudio.volume = 0.24;
  }

  if (currentMusicSrc !== track) {
    musicAudio.pause();
    musicAudio.src = track;
    musicAudio.currentTime = 0;
    currentMusicSrc = track;
  }

  musicAudio.play().catch(() => {
    // Browsers may block audio until the next user action.
  });
}

function pauseLevelMusic() {
  if (musicAudio) musicAudio.pause();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);
  ctx.setTransform(scale * (rect.width / GAME_W), 0, 0, scale * (rect.height / GAME_H), 0, 0);
}

function startGame() {
  state = freshState();
  state.sport = selectedSport;
  state.playerId = selectedPlayerId;
  state.level = selectedStartLevel;
  state.speed = 215 + state.level * 24;
  state.status = "running";
  state.banner = `${currentSport().name}: Colombia vs ${currentLevel().opponent}`;
  messageEl.classList.add("hidden");
  playLevelMusic();
  playBeep(420, 0.08, "square", 0.06);
  playBeep(650, 0.08, "square", 0.05, 0.08);
}

function showMessage(title, copy, buttonText = "Play again", action = startGame) {
  messageEl.innerHTML = `
    <p class="eyebrow">Double D: Goal Rush</p>
    <h1>${title}</h1>
    <p>${copy}</p>
    <button id="startBtn" type="button">${buttonText}</button>
  `;
  messageEl.classList.remove("hidden");
  messageEl.querySelector("button").addEventListener("click", action);
}

function playBeep(freq, duration, type = "sine", volume = 0.04, delay = 0) {
  if (!soundOn) return;
  try {
    audioCtx ||= new AudioContext();
    const start = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + duration);
  } catch {
    soundOn = false;
  }
}

function playCrowdReaction(mood) {
  if (!soundOn) return;
  try {
    audioCtx ||= new AudioContext();
    const start = audioCtx.currentTime;
    const duration = mood === "happy" ? 1.45 : 1.15;
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.55;
    }

    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    const wobble = audioCtx.createOscillator();
    const wobbleGain = audioCtx.createGain();

    noise.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(mood === "happy" ? 720 : 310, start);
    filter.frequency.exponentialRampToValueAtTime(mood === "happy" ? 1150 : 210, start + duration);
    filter.Q.setValueAtTime(mood === "happy" ? 0.65 : 0.95, start);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(mood === "happy" ? 0.16 : 0.12, start + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    wobble.type = "sine";
    wobble.frequency.setValueAtTime(mood === "happy" ? 8 : 4, start);
    wobbleGain.gain.setValueAtTime(mood === "happy" ? 85 : 45, start);
    wobble.connect(wobbleGain).connect(filter.frequency);
    noise.connect(filter).connect(gain).connect(audioCtx.destination);

    noise.start(start);
    noise.stop(start + duration);
    wobble.start(start);
    wobble.stop(start + duration);

    if (mood === "happy") {
      playBeep(980, 0.16, "triangle", 0.035, 0.12);
      playBeep(1240, 0.18, "triangle", 0.03, 0.34);
    } else {
      playBeep(260, 0.26, "sawtooth", 0.035, 0.06);
      playBeep(190, 0.34, "sawtooth", 0.03, 0.28);
    }
  } catch {
    soundOn = false;
  }
}

function speakAnnouncer(text) {
  if (!soundOn || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const line = new SpeechSynthesisUtterance(text);
  line.lang = "en-US";
  line.volume = 0.95;
  line.rate = text.includes("Goal") ? 0.82 : 0.92;
  line.pitch = text.includes("Goal") ? 1.35 : 0.72;
  window.speechSynthesis.speak(line);
}

function moveLane(dir) {
  if (state.status !== "running" || state.shooting) return;
  state.targetLane = Math.max(0, Math.min(2, state.targetLane + dir));
  state.boost = Math.max(state.boost, 0.12);
  playBeep(dir > 0 ? 520 : 460, 0.05, "triangle", 0.025);
}

function moveVertical(dir) {
  if (state.status !== "running" || state.shooting) return;
  state.targetY = Math.max(PLAYER_MIN_Y, Math.min(PLAYER_MAX_Y, state.targetY + dir * PLAYER_STEP_Y));
  state.boost = Math.max(state.boost, 0.12);
  playBeep(dir > 0 ? 390 : 560, 0.05, "triangle", 0.025);
}

function shoot() {
  if (state.status !== "running" || state.shooting) return;
  if (!state.shootWindow) {
    addFloater(currentSport().wait, 450, 190, colors.orange);
    playBeep(160, 0.12, "sawtooth", 0.04);
    return;
  }
  state.shooting = true;
  state.shot = {
    x: state.playerX,
    y: state.playerY + 20,
    vx: (LANES[state.targetLane] - state.goalkeeper.x) * -0.18,
    vy: -1040,
    power: 1 + Math.min(1.4, state.streak * 0.12),
    fire: state.streak >= 2,
  };
  state.banner = state.shot.fire ? "FIRE SHOT!" : "SHOOOOT!";
  playBeep(220, 0.08, "square", 0.05);
  playBeep(760, 0.18, "sawtooth", 0.035, 0.06);
}

function spawnObstacle() {
  const level = currentLevel();
  const pattern = Math.random();
  const lane = Math.floor(Math.random() * 3);
  const kind = pattern > 0.86 ? "banana" : pattern > 0.74 ? "slider" : "defender";
  state.obstacles.push({
    kind,
    lane,
    x: LANES[lane],
    y: -50,
    wobble: Math.random() * Math.PI * 2,
    crashed: false,
    spin: 0,
    zigzag: level.twist === "zigzag",
  });

  if (state.score > 2 && Math.random() > 0.62) {
    const otherLane = (lane + (Math.random() > 0.5 ? 1 : 2)) % 3;
    state.obstacles.push({
      kind: "defender",
      lane: otherLane,
      x: LANES[otherLane],
      y: -145,
      wobble: Math.random() * Math.PI * 2,
      crashed: false,
      spin: 0,
      zigzag: level.twist === "zigzag",
    });
  }

  if (level.twist === "wall" && Math.random() > 0.58) {
    for (let i = 0; i < LANES.length; i += 1) {
      if (i === lane) continue;
      state.obstacles.push({
        kind: "defender",
        lane: i,
        x: LANES[i],
        y: -110 - i * 38,
        wobble: Math.random() * Math.PI * 2,
        crashed: false,
        spin: 0,
      });
    }
    addFloater("German wall!", 450, 190, colors.ink);
  }
}

function triggerFunnyEvent() {
  const events = [
    "A tiny dog wants VAR!",
    "Banana peel deployed!",
    "Commentator lost his sandwich!",
    "The keeper is doing homework!",
  ];
  state.funnyEvent = events[Math.floor(Math.random() * events.length)];
  addFloater(state.funnyEvent, 450, 132, colors.purple);
  if (state.funnyEvent.includes("dog")) {
    state.obstacles.push({ kind: "dog", lane: 0, x: 120, y: 420, wobble: 0, crashed: false, spin: 0 });
  } else if (state.funnyEvent.includes("Banana")) {
    const lane = Math.floor(Math.random() * 3);
    state.obstacles.push({ kind: "banana", lane, x: LANES[lane], y: 90, wobble: 0, crashed: false, spin: 0 });
  }
}

function update(dt) {
  if (state.status !== "running") {
    updateParticles(dt);
    return;
  }

  state.distance += state.speed * dt;
  state.speed = Math.min(410 + state.level * 24, state.speed + dt * (9 + state.level * 1.5));
  state.boost = Math.max(0, state.boost - dt);
  state.playerX += (LANES[state.targetLane] - state.playerX) * Math.min(1, dt * 12);
  state.playerY += (state.targetY - state.playerY) * Math.min(1, dt * 12);
  state.ballY = state.playerY - 14 + Math.sin(performance.now() / 80) * 3;
  state.shootWindow = state.distance % 1200 > 910;
  state.nextSpawn -= dt;
  state.nextEvent -= dt;
  state.shake = Math.max(0, state.shake - dt * 8);
  state.crowd.timer = Math.max(0, state.crowd.timer - dt);
  if (state.crowd.timer === 0) state.crowd.mood = "neutral";

  if (state.nextSpawn <= 0 && !state.shootWindow && !state.shooting) {
    spawnObstacle();
    const quickBonus = currentLevel().twist === "quick" ? 0.13 : 0;
    state.nextSpawn = Math.max(0.2, 0.82 - state.level * 0.075 - state.goalsThisLevel * 0.035 - quickBonus - Math.random() * 0.16);
  }

  if (state.nextEvent <= 0) {
    triggerFunnyEvent();
    state.nextEvent = 7 + Math.random() * 5;
  }

  updateObstacles(dt);
  updateKeeper(dt);
  updateShot(dt);
  updateParticles(dt);
  detectCollisions();
}

function updateObstacles(dt) {
  const quickBonus = currentLevel().twist === "quick" ? 0.16 : 0;
  const fallSpeed = state.speed * (0.94 + state.level * 0.045 + quickBonus) + (state.shootWindow ? 80 : 0);
  for (const obstacle of state.obstacles) {
    obstacle.wobble += dt * 5;
    obstacle.spin += dt * 7;
    if (obstacle.kind === "dog") {
      obstacle.x += dt * 220;
      obstacle.y += Math.sin(obstacle.wobble) * 1.5;
    } else {
      obstacle.y += fallSpeed * dt;
      const wobbleSize = obstacle.zigzag ? 62 : obstacle.kind === "slider" ? 24 : 8;
      obstacle.x = LANES[obstacle.lane] + Math.sin(obstacle.wobble) * wobbleSize;
    }
  }
  state.obstacles = state.obstacles.filter((obstacle) => obstacle.y < GAME_H + 90 && obstacle.x < GAME_W + 80);
}

function updateKeeper(dt) {
  const keeperBonus = currentLevel().twist === "superKeeper" ? 45 : 0;
  state.goalkeeper.x += state.goalkeeper.dir * (95 + state.level * 28 + state.goalsThisLevel * 8 + keeperBonus) * dt;
  if (state.goalkeeper.x > LANES[2] + 50) state.goalkeeper.dir = -1;
  if (state.goalkeeper.x < LANES[0] - 50) state.goalkeeper.dir = 1;
  state.goalkeeper.dive = Math.max(0, state.goalkeeper.dive - dt * 3);
}

function updateShot(dt) {
  if (!state.shot) return;
  state.shot.y += state.shot.vy * dt;
  state.shot.x += state.shot.vx * dt;
  state.shot.vy += 760 * dt;
  addParticle(state.shot.x, state.shot.y, state.shot.fire ? colors.orange : colors.white, 9, 0.28);

  if (state.shot.y <= GOAL_Y + 70) {
    const keeperTwist = currentLevel().twist === "superKeeper";
    const saveRadius = keeperTwist ? 92 : 62;
    const saveThreshold = 0.25 + state.shot.power * 0.12 - (keeperTwist ? 0.16 : 0);
    const saved = Math.abs(state.shot.x - state.goalkeeper.x) < saveRadius && Math.random() > saveThreshold;
    if (saved) {
      failRun(currentSport().blocked, "disappointed");
    } else {
      scoreGoal();
    }
  } else if (state.shot.y > GAME_H + 90 || state.shot.x < -90 || state.shot.x > GAME_W + 90) {
    failRun(currentSport().badShot);
  }
}

function updateParticles(dt) {
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 420 * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);

  for (const floater of state.floaters) {
    floater.y -= dt * 34;
    floater.life -= dt;
  }
  state.floaters = state.floaters.filter((floater) => floater.life > 0);
}

function detectCollisions() {
  if (state.shooting) return;
  for (const obstacle of state.obstacles) {
    if (obstacle.crashed) continue;
    const closeY = Math.abs(obstacle.y - state.playerY) < 46;
    const closeX = Math.abs(obstacle.x - state.playerX) < (obstacle.kind === "dog" ? 44 : 52);
    if (!closeY || !closeX) continue;

    if (obstacle.kind === "banana") {
      obstacle.crashed = true;
      state.coins += 1;
      state.shake = 0.5;
      burst(state.playerX, state.playerY, colors.yellow, 15);
      addFloater("Banana dodge bonus!", state.playerX, state.playerY - 84, colors.yellow);
      playBeep(780, 0.08, "triangle", 0.04);
      continue;
    }
    failRun(obstacle.kind === "dog" ? "The dog stole the ball. Fair enough." : "BOINK! Defender tackle pile-up.");
    obstacle.crashed = true;
    break;
  }
}

function scoreGoal() {
  const player = currentPlayer();
  const sport = currentSport();
  state.score += 1;
  state.goalsThisLevel += 1;
  state.streak += 1;
  state.coins += 8 + state.streak * 2;
  state.distance = 0;
  state.shooting = false;
  state.shot = null;
  state.obstacles = [];
  state.celebration = 1.6;
  state.shake = 0.85;
  state.banner = state.streak > 2 ? `${sport.bigCheer} ${player.goalLine}` : `${sport.bigCheer} ${player.name}!`;
  state.crowd = { mood: "happy", timer: 2.3 };
  burst(450, 120, colors.yellow, 46);
  burst(380, 120, colors.orange, 32);
  addFloater(`${player.name} ${sport.scoringVerb}!`, 450, 240, colors.blue);
  playBeep(520, 0.12, "square", 0.05);
  playBeep(700, 0.14, "square", 0.05, 0.12);
  playBeep(880, 0.2, "square", 0.05, 0.26);
  playCrowdReaction("happy");
  speakAnnouncer(sport.announcer);

  if (state.goalsThisLevel >= GOALS_PER_LEVEL) {
    setTimeout(completeLevel, 850);
  }
}

function completeLevel() {
  if (state.status !== "running") return;

  const beaten = currentLevel().opponent;
  state.status = state.level === LEVELS.length - 1 ? "won" : "level-complete";
  state.shot = null;
  state.shooting = false;
  state.obstacles = [];
  pauseLevelMusic();

  if (state.status === "won") {
    showMessage(
      "Colombia Wins!",
      `${currentPlayer().name} beat ${beaten} and conquered all ${LEVELS.length} levels. Final score: ${state.score}. Coins: ${state.coins}.`,
      "Play again",
      startGame,
    );
    return;
  }

  const next = LEVELS[state.level + 1];
  showMessage(
    `${beaten} Beaten!`,
    `${currentPlayer().name} is still rolling. Next up: ${next.opponent}. Defenders and keeper are getting faster.`,
    "Next level",
    nextLevel,
  );
}

function nextLevel() {
  state.level += 1;
  state.goalsThisLevel = 0;
  state.lives = LIVES_PER_LEVEL;
  state.distance = 0;
  state.speed = 215 + state.level * 24;
  state.nextSpawn = 0.65;
  state.nextEvent = 5;
  state.goalkeeper = { x: LANES[1], dir: 1, dive: 0 };
  state.playerX = LANES[1];
  state.targetLane = 1;
  state.playerY = PLAYER_Y;
  state.targetY = PLAYER_Y;
  state.status = "running";
  state.banner = `${currentSport().name}: Colombia vs ${currentLevel().opponent}`;
  messageEl.classList.add("hidden");
  playLevelMusic();
  addFloater(`Level ${state.level + 1}: ${currentLevel().opponent}`, 450, 190, colors.yellow);
  playBeep(520, 0.08, "square", 0.05);
  playBeep(720, 0.12, "square", 0.05, 0.1);
}

function failRun(reason, crowdMood = "neutral") {
  state.lives -= 1;
  state.status = state.lives > 0 ? "life-lost" : "failed";
  state.fail = 1;
  state.shooting = false;
  state.shot = null;
  state.obstacles = [];
  state.shake = 1;
  state.banner = reason;
  state.crowd = { mood: crowdMood, timer: 2.5 };
  pauseLevelMusic();
  comicImpact(state.playerX, state.playerY - 20);
  playBeep(120, 0.28, "sawtooth", 0.06);
  if (crowdMood === "disappointed") {
    playCrowdReaction("disappointed");
    speakAnnouncer("Oh no!");
  }
  setTimeout(() => {
    if (state.lives > 0) {
      showMessage(
        "Chance Used",
        `${currentPlayer().name} gets another chance. ${reason} You have ${state.lives} ${state.lives === 1 ? "life" : "lives"} left in this level.`,
        "Continue",
        continueLevel,
      );
      return;
    }

    showMessage("Full-Time Whistle", `${currentPlayer().name} is out of chances. ${reason} Score: ${state.score}. Coins: ${state.coins}.`, "Restart");
  }, 650);
}

function continueLevel() {
  state.distance = 0;
  state.speed = 215 + state.level * 24;
  state.nextSpawn = 0.65;
  state.nextEvent = 5;
  state.goalkeeper = { x: LANES[1], dir: 1, dive: 0 };
  state.playerX = LANES[1];
  state.targetLane = 1;
  state.playerY = PLAYER_Y;
  state.targetY = PLAYER_Y;
  state.shot = null;
  state.shooting = false;
  state.obstacles = [];
  state.status = "running";
  state.banner = `${currentSport().name}: Colombia vs ${currentLevel().opponent}`;
  messageEl.classList.add("hidden");
  playLevelMusic();
  addFloater(`${state.lives} ${state.lives === 1 ? "life" : "lives"} left`, 450, 190, colors.yellow);
}

function addParticle(x, y, color, size = 6, life = 0.55) {
  state.particles.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 160,
    vy: (Math.random() - 0.8) * 180,
    color,
    size: size * (0.6 + Math.random() * 0.8),
    life,
  });
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) addParticle(x, y, color, 5 + Math.random() * 6, 0.55 + Math.random() * 0.45);
}

function comicImpact(x, y) {
  burst(x, y, colors.yellow, 18);
  burst(x, y, colors.white, 12);
  burst(x, y, colors.blue, 8);
  addFloater("BONK!", x, y - 60, colors.yellow);
}

function addFloater(text, x, y, color) {
  state.floaters.push({ text, x, y, color, life: 1.35 });
}

function draw() {
  const shakeX = state.shake ? (Math.random() - 0.5) * state.shake * 10 : 0;
  const shakeY = state.shake ? (Math.random() - 0.5) * state.shake * 8 : 0;
  ctx.save();
  ctx.clearRect(0, 0, GAME_W, GAME_H);
  ctx.translate(shakeX, shakeY);
  drawField();
  drawCrowd();
  drawGoal();
  drawObstacles();
  drawKeeper();
  drawPlayer();
  drawShot();
  drawParticles();
  drawVignette();
  drawText();
  ctx.restore();
}

function drawVignette() {
  const v = ctx.createRadialGradient(450, 290, 250, 450, 290, 640);
  v.addColorStop(0, "rgba(8,28,22,0)");
  v.addColorStop(1, "rgba(8,28,22,0.3)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
}

function drawField() {
  const grass = ctx.createLinearGradient(0, 0, 0, GAME_H);
  grass.addColorStop(0, "#249350");
  grass.addColorStop(0.4, colors.grass);
  grass.addColorStop(1, "#41cf74");
  ctx.fillStyle = grass;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  for (let y = -80; y < GAME_H; y += 96) {
    ctx.fillStyle = y % 192 === 0 ? colors.stripe : colors.grassDark;
    ctx.globalAlpha = 0.22;
    ctx.fillRect(0, y + (state.distance % 96), GAME_W, 48);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let i = 0; i < 46; i += 1) {
    const gx = (i * 173) % GAME_W;
    const gy = (i * 271 + state.distance) % GAME_H;
    ctx.fillRect(gx, gy, 4, 4);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(38, 118);
  ctx.lineTo(38, GAME_H);
  ctx.moveTo(GAME_W - 38, 118);
  ctx.lineTo(GAME_W - 38, GAME_H);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 5;
  ctx.strokeRect(170, 106, 560, 140);
  ctx.strokeRect(300, 106, 300, 64);
  ctx.beginPath();
  ctx.arc(450, 246, 62, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();

  ctx.strokeStyle = colors.lane;
  ctx.lineWidth = 5;
  ctx.setLineDash([20, 26]);
  ctx.lineDashOffset = -(state.distance % 46);
  for (const x of LANES) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GAME_H);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 6;
  const circleY = 345 + Math.sin(state.distance / 90) * 20;
  ctx.beginPath();
  ctx.arc(450, circleY, 92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  circle(450, circleY, 7);
  ctx.fill();
}

function drawGoal() {
  if (state.shootWindow && !state.shooting) {
    const pulse = 0.55 + Math.sin(performance.now() / 90) * 0.2;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = colors.yellow;
    roundRect(236, 6, 428, 124, 8);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawShadow(450, 116, 360, 18);
  const mouth = ctx.createLinearGradient(0, 22, 0, 102);
  mouth.addColorStop(0, "#c9d4cc");
  mouth.addColorStop(0.55, "#e9e6d2");
  mouth.addColorStop(1, colors.white);
  ctx.fillStyle = mouth;
  roundRect(280, 22, 340, 80, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(23,34,43,0.24)";
  ctx.lineWidth = 4;
  for (let x = 296; x < 620; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 26);
    ctx.lineTo(x, 98);
    ctx.stroke();
  }
  for (let y = 38; y < 100; y += 18) {
    ctx.beginPath();
    ctx.moveTo(284, y);
    ctx.lineTo(616, y);
    ctx.stroke();
  }
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 10;
  ctx.strokeRect(274, 18, 352, 88);
}

function drawPlayer() {
  const player = currentPlayer();
  const dance = state.celebration > 0 ? Math.sin(performance.now() / 55) * 12 : 0;
  state.celebration = Math.max(0, state.celebration - 1 / 60);
  const x = state.playerX;
  const y = state.playerY + dance;

  drawShadow(x, y + 46, 58, 16);
  ctx.fillStyle = colors.yellow;
  roundRect(x - 28, y - 44, 56, 60, 14);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.fillStyle = colors.blue;
  roundRect(x - 28, y + 4, 56, 22, 6);
  ctx.fill();
  ctx.fillStyle = "#d9272e";
  roundRect(x - 28, y + 20, 56, 8, 4);
  ctx.fill();
  ctx.fillStyle = colors.blue;
  ctx.font = "900 24px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(player.number, x, y - 9);

  ctx.fillStyle = "#ffd19a";
  circle(x, y - 72, 32);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.fillStyle = "#4a2d16";
  if (player.name === "Derek") {
    roundRect(x - 23, y - 100, 46, 22, 10);
    ctx.fill();
    ctx.fillStyle = "#3a220f";
    roundRect(x - 16, y - 104, 32, 8, 5);
    ctx.fill();
  } else {
    circle(x - 4, y - 92, 24);
    ctx.fill();
  }
  ctx.fillStyle = colors.white;
  circle(player.name === "Derek" ? x - 12 : x - 11, y - 74, 6);
  circle(player.name === "Derek" ? x + 12 : x + 12, y - 74, 6);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  circle(player.name === "Derek" ? x - 12 : x - 9, y - 73, 2.5);
  circle(player.name === "Derek" ? x + 12 : x + 14, y - 73, 2.5);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + 2, y - 66, 13, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 18, y + 10);
  ctx.lineTo(x - 36, y + 36);
  ctx.moveTo(x + 18, y + 10);
  ctx.lineTo(x + 38, y + 34);
  ctx.stroke();

  drawBall(x + player.ballSide * (42 + Math.sin(performance.now() / 70) * 5), state.ballY + 34);
}

function drawCrowd() {
  const stand = ctx.createLinearGradient(0, 0, 0, 52);
  stand.addColorStop(0, "#1f3349");
  stand.addColorStop(1, "#3f5d7c");
  ctx.fillStyle = stand;
  ctx.fillRect(0, 0, GAME_W, 52);

  const mood = state.crowd.mood;
  const bounce = mood === "happy" ? Math.sin(performance.now() / 70) * 8 : 0;
  const slump = mood === "disappointed" ? 7 : 0;
  const shirts = [colors.yellow, colors.blue, colors.orange, colors.white, colors.purple];

  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 38; i += 1) {
    const x = 8 + i * 24;
    const y = 8 + ((i * 7) % 5) - bounce * (i % 4 === 0 ? 0.5 : 0.2) + slump * 0.5;
    ctx.fillStyle = shirts[(i + 2) % shirts.length];
    circle(x, y + 6, 6);
    ctx.fill();
    ctx.fillStyle = "#e8b98a";
    circle(x, y, 6);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (let i = 0; i < 30; i += 1) {
    const x = 18 + i * 30;
    const y = 26 + (i % 2) * 8 - bounce * (i % 3 === 0 ? 1 : 0.45) + slump;
    ctx.fillStyle = shirts[i % shirts.length];
    circle(x, y + 10, 8);
    ctx.fill();
    ctx.fillStyle = "#ffd19a";
    circle(x, y, 8);
    ctx.fill();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (mood === "disappointed") {
      ctx.arc(x, y + 8, 5, Math.PI + 0.2, Math.PI * 2 - 0.2);
    } else {
      ctx.arc(x, y + 1, 5, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    if (mood === "happy" && i % 4 === 0) {
      ctx.strokeStyle = colors.yellow;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 6, y + 14);
      ctx.lineTo(x - 16, y - 7);
      ctx.moveTo(x + 6, y + 14);
      ctx.lineTo(x + 16, y - 7);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 15; i += 1) {
    ctx.fillStyle = i % 2 ? "#12283c" : "#173754";
    ctx.fillRect(i * 60, 52, 60, 10);
    ctx.fillStyle = i % 3 ? "rgba(255,207,51,0.55)" : "rgba(255,255,255,0.4)";
    ctx.fillRect(i * 60 + 14, 56, 32, 3);
  }

  if (mood === "happy") {
    ctx.fillStyle = colors.yellow;
    ctx.font = "900 24px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(currentSport().bigCheer, 450, 38);
  } else if (mood === "disappointed") {
    ctx.fillStyle = colors.white;
    ctx.font = "900 21px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("OHHHH NOOO!", 450, 38);
  }
}

function drawKeeper() {
  const k = state.goalkeeper;
  const kit = currentLevel();
  const y = GOAL_Y + 55;
  drawShadow(k.x, y + 42, 76, 14);
  ctx.save();
  ctx.translate(k.x, y);
  ctx.rotate(k.dive * k.dir * 0.8);
  ctx.fillStyle = kit.keeper;
  roundRect(-34, -24, 68, 54, 10);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.fillStyle = kit.keeperAccent;
  roundRect(-34, 6, 68, 12, 4);
  ctx.fill();
  ctx.fillStyle = "#ffd19a";
  circle(0, -46, 25);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-32, -12);
  ctx.lineTo(-62, -36);
  ctx.moveTo(32, -12);
  ctx.lineTo(62, -36);
  ctx.stroke();
  ctx.fillStyle = colors.white;
  circle(-8, -49, 5);
  circle(9, -49, 5);
  ctx.fill();
  ctx.restore();
}

function drawObstacles() {
  const kit = currentLevel();
  for (const obstacle of state.obstacles) {
    if (obstacle.kind === "banana") {
      ctx.save();
      ctx.translate(obstacle.x, obstacle.y);
      ctx.rotate(Math.sin(obstacle.spin) * 0.6);
      ctx.strokeStyle = colors.yellow;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0.2, Math.PI * 0.92);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (obstacle.kind === "dog") {
      drawShadow(obstacle.x, obstacle.y + 24, 54, 12);
      ctx.fillStyle = "#b66b32";
      roundRect(obstacle.x - 28, obstacle.y - 12, 58, 30, 12);
      ctx.fill();
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#7b3f1e";
      circle(obstacle.x + 31, obstacle.y - 12, 16);
      ctx.fill();
      ctx.fillStyle = colors.white;
      circle(obstacle.x + 36, obstacle.y - 16, 4);
      ctx.fill();
      continue;
    }

    const sliding = obstacle.kind === "slider";
    drawShadow(obstacle.x, obstacle.y + 40, sliding ? 88 : 58, 14);
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.rotate(sliding ? -0.55 : Math.sin(obstacle.wobble) * 0.08);
    ctx.fillStyle = kit.primary;
    roundRect(-27, -38, 54, 56, 10);
    ctx.fill();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    if (kit.striped) {
      ctx.fillStyle = kit.secondary;
      ctx.fillRect(-11, -37, 10, 54);
      ctx.fillRect(11, -37, 10, 54);
    } else {
      ctx.fillStyle = kit.secondary;
      roundRect(-27, -10, 54, 12, 3);
      ctx.fill();
    }
    ctx.fillStyle = kit.accent;
    roundRect(-13, -38, 26, 8, 3);
    ctx.fill();
    ctx.fillStyle = "#ffd19a";
    circle(0, -62, 27);
    ctx.fill();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.fillStyle = colors.ink;
    ctx.font = "900 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", 0, -57);
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-18, 12);
    ctx.lineTo(sliding ? -58 : -30, 36);
    ctx.moveTo(18, 12);
    ctx.lineTo(sliding ? 58 : 30, 36);
    ctx.stroke();
    ctx.restore();
  }
}

function drawShot() {
  if (!state.shot) return;
  if (state.shot.fire) {
    ctx.fillStyle = colors.orange;
    ctx.beginPath();
    ctx.moveTo(state.shot.x, state.shot.y + 20);
    ctx.lineTo(state.shot.x - 28, state.shot.y + 66);
    ctx.lineTo(state.shot.x + 25, state.shot.y + 54);
    ctx.closePath();
    ctx.fill();
  }
  drawBall(state.shot.x, state.shot.y);
}

function drawBall(x, y) {
  const shade = ctx.createRadialGradient(x - 6, y - 7, 4, x, y, 20);
  shade.addColorStop(0, "#ffffff");
  shade.addColorStop(0.7, colors.white);
  shade.addColorStop(1, "#d3ccb2");
  ctx.fillStyle = shade;
  circle(x, y, 18);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const r = i % 2 ? 5 : 10;
    ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  circle(x - 8, y - 9, 3.5);
  ctx.fill();
}

function drawParticles() {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life * 1.8);
    ctx.fillStyle = p.color;
    circle(p.x, p.y, p.size);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawText() {
  if (state.status === "menu") return;

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  roundRect(292, 50, 316, 32, 8);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.font = "900 16px Inter, sans-serif";
  ctx.fillText(`Level ${state.level + 1}: Colombia vs ${currentLevel().opponent}`, 450, 72);

  ctx.textAlign = "center";
  ctx.fillStyle = state.shootWindow && !state.shooting ? colors.orange : "rgba(255,255,255,0.9)";
  roundRect(state.shootWindow && !state.shooting ? 245 : 265, 114, state.shootWindow && !state.shooting ? 410 : 370, 50, 8);
  ctx.fill();
  ctx.fillStyle = state.shootWindow && !state.shooting ? colors.white : colors.ink;
  ctx.font = state.shootWindow && !state.shooting ? "900 34px Inter, sans-serif" : "900 22px Inter, sans-serif";
  ctx.fillText(state.shootWindow && !state.shooting ? "SHOOT NOW!" : state.banner, 450, 148);

  for (const floater of state.floaters) {
    ctx.globalAlpha = Math.min(1, floater.life);
    ctx.fillStyle = floater.color;
    ctx.font = "900 24px Inter, sans-serif";
    ctx.fillText(floater.text, floater.x, floater.y);
  }
  ctx.globalAlpha = 1;
}

function drawShadow(x, y, w, h) {
  ctx.fillStyle = "rgba(23,34,43,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function syncHud() {
  levelEl.textContent = state.level + 1;
  scoreEl.textContent = state.score;
  levelGoalsEl.textContent = `${state.goalsThisLevel}/${GOALS_PER_LEVEL}`;
  livesEl.textContent = state.lives;
  coinsEl.textContent = state.coins;
  shootBtn.classList.toggle("is-ready", state.status === "running" && state.shootWindow && !state.shooting);
  shootBtn.setAttribute(
    "aria-label",
    state.status === "running" && state.shootWindow && !state.shooting ? "Shoot now" : "Shoot",
  );
}

function loop(time) {
  const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
  lastTime = time;
  update(dt);
  draw();
  syncHud();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

const dismissRotateBtn = document.querySelector("#dismissRotate");
if (dismissRotateBtn) {
  dismissRotateBtn.addEventListener("click", () => {
    document.body.classList.add("rotate-dismissed");
    resizeCanvas();
  });
}
window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") moveLane(-1);
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") moveLane(1);
  if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
    event.preventDefault();
    moveVertical(-1);
  }
  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
    event.preventDefault();
    moveVertical(1);
  }
  if (event.key === " ") {
    event.preventDefault();
    shoot();
  }
  if (event.key.toLowerCase() === "r") startGame();
});

canvas.addEventListener("pointerdown", (event) => {
  swipeStart = { x: event.clientX, y: event.clientY };
});

canvas.addEventListener("pointerup", (event) => {
  if (!swipeStart) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  if (Math.abs(dx) > 32 && Math.abs(dx) > Math.abs(dy)) moveLane(dx > 0 ? 1 : -1);
  else if (Math.abs(dy) > 32) moveVertical(dy > 0 ? 1 : -1);
  else shoot();
  swipeStart = null;
});

startBtn.addEventListener("click", startGame);
restartTopBtn.addEventListener("click", startGame);
playerSelect.addEventListener("change", () => {
  selectedPlayerId = playerSelect.value;
  state.playerId = selectedPlayerId;
});
levelSelect.addEventListener("change", () => {
  selectedStartLevel = Number(levelSelect.value);
  state.level = selectedStartLevel;
});
leftBtn.addEventListener("click", () => moveLane(-1));
rightBtn.addEventListener("click", () => moveLane(1));
upBtn.addEventListener("click", () => moveVertical(-1));
downBtn.addEventListener("click", () => moveVertical(1));
shootBtn.addEventListener("click", shoot);
soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "Sound" : "Muted";
  if (soundOn) {
    playBeep(660, 0.07);
    if (state.status === "running") playLevelMusic();
  } else {
    pauseLevelMusic();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
});

state = freshState();
resizeCanvas();
requestAnimationFrame(loop);
