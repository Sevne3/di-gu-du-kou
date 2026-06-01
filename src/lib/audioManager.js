// Audio manager - plays real audio files with playlist support
let audioEl = null;
let isPlaying = false;
let initialized = false;
let currentTrackIdx = 0;
let listeners = [];
let volume = 0.3;

const PLAYLIST = [
  {
    "id": "snowfall",
    "name": "snowfall (Slowed + Reverb)",
    "emoji": "❄️",
    "description": "Øneheart, reidenshi",
    "url": "/audio/snowfall.mp3"
  },
  {
    "id": "bornastranger",
    "name": "Born a Stranger",
    "emoji": "🌙",
    "description": "Kan R. Gao",
    "url": "/audio/born-a-stranger.mp3"
  },
  {
    "id": "bluedragon",
    "name": "Blue Dragon (piano guitar ver.)",
    "emoji": "🐉",
    "description": "澤野弘之",
    "url": "/audio/blue-dragon.mp3"
  }
];

export function getAudioState() {
  return {
    isPlaying, initialized,
    currentTrack: currentTrackIdx,
    currentTrackName: PLAYLIST[currentTrackIdx]?.name || "",
    currentTrackEmoji: PLAYLIST[currentTrackIdx]?.emoji || "",
    playlist: PLAYLIST
  };
}

export function getPlaylist() { return PLAYLIST; }
export function getCurrentTrack() { return PLAYLIST[currentTrackIdx]; }

export function subscribe(callback) {
  listeners.push(callback);
  return () => { listeners = listeners.filter(l => l !== callback); };
}

function notify() {
  const track = PLAYLIST[currentTrackIdx];
  listeners.forEach(l => l({
    isPlaying, initialized,
    currentTrack: currentTrackIdx,
    currentTrackName: track?.name || "",
    currentTrackEmoji: track?.emoji || "",
    playlist: PLAYLIST
  }));
}

function createAudio() {
  if (audioEl) return;
  audioEl = document.createElement("audio");
  audioEl.loop = false;
  audioEl.addEventListener("ended", () => { nextTrack(); });
  audioEl.volume = volume;
  document.body.appendChild(audioEl);
}

function loadTrack(idx) {
  if (!audioEl) createAudio();
  const track = PLAYLIST[idx];
  if (!track) return;
  audioEl.src = track.url;
  audioEl.load();
}

export function startAudio(trackIndex) {
  if (initialized && isPlaying) {
    if (trackIndex !== undefined && trackIndex !== currentTrackIdx) {
      switchTrack(trackIndex);
    }
    return;
  }
  createAudio();
  if (trackIndex !== undefined) currentTrackIdx = trackIndex;
  loadTrack(currentTrackIdx);
  audioEl.play().then(() => {
    isPlaying = true;
    initialized = true;
    notify();
  }).catch(e => {
    console.log("Audio play failed:", e.message);
  });
}

export function stopAudio() {
  if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; }
  isPlaying = false;
  notify();
}

export function toggleAudio(trackIndex) {
  if (isPlaying) { stopAudio(); }
  else { startAudio(trackIndex); }
}

export function switchTrack(trackIndex) {
  if (trackIndex < 0 || trackIndex >= PLAYLIST.length) return;
  currentTrackIdx = trackIndex;
  if (audioEl && isPlaying) {
    loadTrack(trackIndex);
    audioEl.play().catch(() => {});
  }
  notify();
}

export function nextTrack() {
  switchTrack((currentTrackIdx + 1) % PLAYLIST.length);
}

export function prevTrack() {
  switchTrack((currentTrackIdx - 1 + PLAYLIST.length) % PLAYLIST.length);
}

export function setVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  if (audioEl) audioEl.volume = volume;
}

export function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.15;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 2);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch {}
}
