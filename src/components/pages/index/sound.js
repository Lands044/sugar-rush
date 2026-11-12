import { soundUrl } from "@js/config/assets.js";
import { DEFAULT_CONFIG } from "@js/config/game.defaults.js";

////////////////////////////////////////////////////////// music
// фонова музика
const soundBtn = document.querySelector(".menu__sound");

// src приходить з рантайм-конфігу — див. configureSound() нижче.
// Гучність = рівень звуку тут × майстер-гучність sound.volume з конфігу.
const BG_VOLUME = 0.05;
const HOVER_VOLUME = 0.4;
const SPIN_VOLUME = 0.6;

const bgMusic = new Audio();
bgMusic.loop = true;
bgMusic.volume = BG_VOLUME;

const hoverSound = new Audio();
hoverSound.volume = HOVER_VOLUME;
hoverSound.preload = "auto";
let hoverVolume = HOVER_VOLUME;


soundBtn.addEventListener("click", (e) => {
    e.preventDefault();

    if (bgMusic.muted) {
        // Вмикаємо звук
        bgMusic.muted = false;
        bgMusic.play().catch(() => {
            // браузер може мовчки відмовити
        });
        soundBtn.classList.remove("muted");
    } else {
        // Вимикаємо звук
        bgMusic.muted = true;
        soundBtn.classList.add("muted");
    }
});

//////////////////////////////////////// звуки на кнопках unlockAudio викликається при підтвердженні віку, щоб розблокувати звуки в браузері

let lastHoverTime = 0;
const HOVER_DELAY = 80; // ms
let audioUnlocked = false;

export function unlockAudio() {
    if (audioUnlocked) return;
    // короткий play для розблокування
    hoverSound.volume = 0;
    hoverSound
        .play()
        .then(() => {
            hoverSound.pause();
            hoverSound.currentTime = 0;
            hoverSound.volume = hoverVolume;
            audioUnlocked = true;

            if (!bgMusic.muted) {
                bgMusic.play().catch(() => {});
            }
        })
        .catch(() => {});
}

export function unlockAudioOnNextClick() {
    if (audioUnlocked) return;
    const handler = () => {
        document.removeEventListener("click", handler);
        unlockAudio();
    };
    document.addEventListener("click", handler);
}


function playHoverSound() {
    if (bgMusic.muted || !audioUnlocked) return; // якщо звук вимкнений — мовчимо

    const now = Date.now();
    if (now - lastHoverTime < HOVER_DELAY) return;

    lastHoverTime = now;
    hoverSound.currentTime = 0;
    hoverSound.play().catch(() => {});
}

document
    .querySelectorAll(
        ".menu__sound, .menu__settings, .menu__info, .menu__minus, .menu__button-spin, .menu__plus",
    )
    .forEach((el) => {
        el.addEventListener("mouseenter", playHoverSound);
    });

//spin sound
const spinSound = new Audio();
spinSound.volume = SPIN_VOLUME;
spinSound.preload = "auto";

let lastSpinTime = 0;
const SPIN_SOUND_DELAY = 300;

function playSpinSound() {
    if (bgMusic.muted || !audioUnlocked) return;

    const now = Date.now();
    if (now - lastSpinTime < SPIN_SOUND_DELAY) return;

    lastSpinTime = now;
    spinSound.currentTime = 0;
    spinSound.play().catch(() => {});
}

const spinBtn = document.querySelector(".menu__button-spin");

spinBtn.addEventListener("click", () => {
    playSpinSound();
});

//////////////////////////////////////// конфіг
// Застосовує sound-частину конфігу. Викликається на старті й на кожну зміну
// конфігу (dev watcher / панель), тому src міняється лише якщо він інший —
// інакше фонова музика перезапускалась би на кожен edit.
function setSrc(audio, url) {
    if (audio.dataset.src === url) return;
    audio.dataset.src = url;
    audio.src = url;
}

export function configureSound(config) {
    const { sound, assets } = config;
    const sounds = assets.sounds;
    const defaults = DEFAULT_CONFIG.assets.sounds;

    setSrc(bgMusic, soundUrl(sounds.background, defaults.background));
    setSrc(hoverSound, soundUrl(sounds.hover, defaults.hover));
    setSrc(spinSound, soundUrl(sounds.spin, defaults.spin));

    bgMusic.volume = BG_VOLUME * sound.volume;
    hoverVolume = HOVER_VOLUME * sound.volume;
    if (audioUnlocked) hoverSound.volume = hoverVolume;
    spinSound.volume = SPIN_VOLUME * sound.volume;

    // sound.enabled = стартовий стан кнопки звуку; далі гравець перемикає сам.
    const muted = !sound.enabled;
    if (bgMusic.muted !== muted) {
        bgMusic.muted = muted;
        soundBtn.classList.toggle("muted", muted);
        if (!muted && audioUnlocked) bgMusic.play().catch(() => {});
    }
}
