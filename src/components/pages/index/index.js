import "./sound.js";
import { unlockAudioOnNextClick } from "./sound.js";
import { openPopup, openAgePopup } from "./popup";

/* ================= CONFIG ================= */
const MOBILE_BREAKPOINT = 767.98;

const ICON_PATH = "assets/img/icon/";
const SYMBOLS = [
    "pic_01.webp",
    "pic_02.webp",
    "pic_03.webp",
    "pic_04.webp",
    "pic_05.webp",
    "pic_06.webp",
    "pic_07.webp",
    "pic_08.webp",
    "pic_09.webp",
];

const WIN_TYPE = {
    NONE: "none",
    SMALL: "small",
    BIG: "big",
};

/* Desktop spin timing */
const DROP_TIME = 100;
const DROP_DELAY = 0.07;
const DISAPPEAR_TIME = 450;
const WIN_TIME = 1000;

/* ================= ELEMENTS ================= */
const drum = document.querySelector(".drum");
const spinBtn = document.querySelector(".menu__button-spin");

/* ================= STATE ================= */
let spinning = false;
let spinCount = 0;
let currentGrid = [];

/* ================= START POPUP 18+ ================= */
window.addEventListener("load", () => {
    if (!localStorage.getItem("age_confirmed")) {
        openAgePopup();
    } else {
        unlockAudioOnNextClick();
    }
});

/* ================= BREAKPOINT DETECTION ================= */
function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
}

/* ================= MOBILE SLOT MACHINE ================= */
class MobileSlotMachine {
    constructor() {
        this.drumSpinner = drum.querySelector(".drum__spinner");
        if (!this.drumSpinner) {
            this.drumSpinner = document.createElement("div");
            this.drumSpinner.className = "drum__spinner";
            drum.appendChild(this.drumSpinner);
        }

        this.isSpinning = false;
        this.spinCount = 0;

        this.baseUrl = (import.meta.env.BASE_URL || "./");

        this.icons = SYMBOLS.length;
        this.iconsPerReel = 60;

        this.config = {
            cols: 3,
            rows: 3,
            gap: 10,
            getIconHeight: () => Math.floor((drum.offsetHeight - 2 * 10) / 3),
            getIconStep: () => Math.floor((drum.offsetHeight - 2 * 10) / 3) + 10,
        };

        /* predefined spin results for mobile */
        this.predefinedResults = [
            {
                type: "loss",
                winAmount: 0,
                winLine: null,
                result: [
                    [4, 1, 7],
                    [5, 2, 8],
                    [7, 4, 3],
                ],
            },
            {
                type: "smallwin",
                winAmount: 50,
                winLine: [1, 1, 1],
                result: [
                    [2, 4, 5],
                    [7, 4, 2],
                    [4, 4, 8],
                ],
            },
            {
                type: "bigwin",
                winAmount: 150,
                winLine: [1, 1, 1],
                result: [
                    [8, 5, 7],
                    [3, 8, 6],
                    [6, 8, 4],
                ],
            },
        ];

        this.createReels();
    }

    getIconSrc(iconNum) {
        return ICON_PATH + SYMBOLS[(iconNum - 1) % SYMBOLS.length];
    }

    createReels() {
        this.drumSpinner.innerHTML = "";
        const { cols } = this.config;
        for (let colIndex = 0; colIndex < cols; colIndex++) {
            const column = document.createElement("div");
            column.className = "drum__column";
            column.dataset.column = colIndex;

            const strip = document.createElement("div");
            strip.className = "drum__strip";

            const randomOffset = Math.floor(Math.random() * this.icons);

            for (let i = 0; i < this.iconsPerReel; i++) {
                const iconNum = ((i + randomOffset) % this.icons) + 1;
                strip.appendChild(this.createIconEl(iconNum));
            }

            /* append predefined results */
            this.predefinedResults.forEach((res) => {
                const colIcons = res.result[colIndex];
                if (colIcons) {
                    colIcons.forEach((n) => strip.appendChild(this.createIconEl(n)));
                }
            });

            column.appendChild(strip);
            this.drumSpinner.appendChild(column);
        }

        this.initPositions();
    }

    createIconEl(iconNum) {
        const div = document.createElement("div");
        div.className = "drum__image";
        div.style.height = `${this.config.getIconHeight()}px`;
        const img = document.createElement("img");
        img.src = this.getIconSrc(iconNum);
        img.alt = "icon";
        div.appendChild(img);
        return div;
    }

    initPositions() {
        const iconStep = this.config.getIconStep();
        this.drumSpinner.querySelectorAll(".drum__column").forEach((col) => {
            const strip = col.querySelector(".drum__strip");
            const offset = Math.floor(Math.random() * this.icons) * iconStep;
            strip.style.transform = `translateY(-${offset}px)`;
        });
    }

    async spin() {
        if (this.isSpinning) return;
        if (this.spinCount >= this.predefinedResults.length) return;

        this.isSpinning = true;
        spinning = true;
        disableSpinButton();

        const result = this.predefinedResults[this.spinCount];
        await this.animateSpin(result);
        this.showResult(result);

        this.spinCount++;
        spinCount = this.spinCount;
        this.isSpinning = false;

        if (this.spinCount >= this.predefinedResults.length) {
            setTimeout(() => openPopup(), 1500);
        }
    }

    async animateSpin(result) {
        const columns = this.drumSpinner.querySelectorAll(".drum__column");
        const duration = 2500;

        const promises = Array.from(columns).map((col, i) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    this.spinColumn(col, result.result[i], duration);
                    setTimeout(resolve, duration + i * 100);
                }, i * 100);
            });
        });

        await Promise.all(promises);
    }

    spinColumn(column, targetIcons, duration) {
        const strip = column.querySelector(".drum__strip");
        const iconStep = this.config.getIconStep();

        const targetPos = this.findSequence(strip, targetIcons);
        if (targetPos === -1) return;

        strip.style.transition = "none";
        strip.style.transform = "translateY(0)";
        strip.offsetHeight; // force reflow

        strip.classList.add("mobile-active");

        strip.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
        strip.style.transform = `translateY(-${targetPos * iconStep}px)`;

        setTimeout(() => strip.classList.remove("mobile-active"), duration - 200);
    }

    findSequence(strip, targetIcons) {
        const imgs = strip.querySelectorAll(".drum__image img");
        for (let i = imgs.length - targetIcons.length; i >= 0; i--) {
            let found = true;
            for (let j = 0; j < targetIcons.length; j++) {
                const src = imgs[i + j]?.getAttribute("src") || "";
                const match = src.match(/pic_0?(\d+)\.webp/);
                const num = match ? parseInt(match[1]) : -1;
                if (num !== targetIcons[j]) { found = false; break; }
            }
            if (found) return i;
        }
        return -1;
    }

    showResult(result) {
        if (result.type === "bigwin" || result.type === "smallwin") {
            if (result.winLine) this.highlightWin(result.winLine);

            const winDelay = result.type === "bigwin" ? 2000 : 1500;

            // disappear анімація перед очищенням
            setTimeout(() => {
                this.disappearWinIcons(result.winLine);
                setTimeout(() => {
                    this.clearWinClasses();
                    spinning = false;
                    enableSpinButton();
                }, 450);
            }, winDelay);
        } else {
            spinning = false;
            enableSpinButton();
        }
    }

    // повертає видимі drum__image для рядка winRowIndex в кожній колонці
    getVisibleIcons(winLine) {
        const columns = this.drumSpinner.querySelectorAll(".drum__column");
        const rows = this.config.rows;
        const iconStep = this.config.getIconStep();
        const result = [];

        columns.forEach((col, colIndex) => {
            const winRowIndex = winLine[colIndex];
            const strip = col.querySelector(".drum__strip");
            const icons = strip.querySelectorAll(".drum__image");

            const transform = strip.style.transform;
            const match = transform.match(/translateY\(-?(\d+(?:\.\d+)?)px\)/);
            const offset = match ? parseFloat(match[1]) : 0;
            const visStart = Math.round(offset / iconStep);

            for (let i = 0; i < rows; i++) {
                const icon = icons[visStart + i];
                if (!icon) continue;
                result.push({ icon, isWin: i === winRowIndex });
            }
        });

        return result;
    }

    highlightWin(winLine) {
        this.getVisibleIcons(winLine).forEach(({ icon, isWin }) => {
            if (isWin) {
                icon.classList.add("win");
            } else {
                icon.classList.add("dimmed");
            }
        });
    }

    disappearWinIcons(winLine) {
        this.getVisibleIcons(winLine).forEach(({ icon, isWin }) => {
            if (isWin) icon.classList.add("disappear");
        });
    }

    clearWinClasses() {
        this.drumSpinner.querySelectorAll(".drum__image").forEach((icon) => {
            icon.classList.remove("win", "dimmed", "disappear");
        });
    }

    createAnimatedBorder(iconEl) {
        const width = iconEl.offsetWidth;
        const height = iconEl.offsetHeight;
        const padding = 8;
        const borderRadius = 12;
        const strokeMain = 6;
        const strokeGlow = 2;
        const blur = 6;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "win-border-svg");
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        Object.assign(svg.style, {
            position: "absolute", top: "0", left: "0",
            pointerEvents: "none", zIndex: "50", overflow: "visible",
        });

        const rX = padding, rY = padding;
        const rW = width - padding * 2, rH = height - padding * 2;
        const perimeter = 2 * (rW + rH);
        const dash = perimeter * 0.2;

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const filterId = `glow-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", filterId);
        filter.setAttribute("x", "-50%"); filter.setAttribute("y", "-50%");
        filter.setAttribute("width", "200%"); filter.setAttribute("height", "200%");
        const feBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
        feBlur.setAttribute("stdDeviation", blur);
        feBlur.setAttribute("result", "coloredBlur");
        const feMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
        ["coloredBlur", "SourceGraphic"].forEach((inp) => {
            const n = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
            n.setAttribute("in", inp);
            feMerge.appendChild(n);
        });
        filter.appendChild(feBlur);
        filter.appendChild(feMerge);
        defs.appendChild(filter);
        svg.appendChild(defs);

        const styleId = `border-anim-${Math.round(perimeter)}`;
        if (!document.getElementById(styleId)) {
            const s = document.createElement("style");
            s.id = styleId;
            s.textContent = `
                @keyframes br1-${Math.round(perimeter)} {
                    0%{stroke-dashoffset:0} 100%{stroke-dashoffset:${-perimeter}}
                }
                @keyframes br2-${Math.round(perimeter)} {
                    0%{stroke-dashoffset:${-perimeter * 0.5}} 100%{stroke-dashoffset:${-perimeter * 1.5}}
                }
            `;
            document.head.appendChild(s);
        }

        const an1 = `br1-${Math.round(perimeter)}`;
        const an2 = `br2-${Math.round(perimeter)}`;

        const makeRect = (stroke, width, offset, anim) => {
            const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            r.setAttribute("x", rX); r.setAttribute("y", rY);
            r.setAttribute("width", rW); r.setAttribute("height", rH);
            r.setAttribute("rx", borderRadius); r.setAttribute("ry", borderRadius);
            r.setAttribute("fill", "none");
            r.setAttribute("stroke", stroke);
            r.setAttribute("stroke-width", width);
            r.setAttribute("stroke-linecap", "round");
            r.setAttribute("stroke-dasharray", `${dash} ${perimeter - dash}`);
            r.setAttribute("stroke-dashoffset", offset);
            if (stroke === "#ffb921") r.setAttribute("filter", `url(#${filterId})`);
            r.style.animation = `${anim} 3s linear infinite`;
            return r;
        };

        svg.appendChild(makeRect("#ffb921", strokeMain, 0, an1));
        svg.appendChild(makeRect("#fff", strokeGlow, 0, an1));
        svg.appendChild(makeRect("#ffb921", strokeMain, `${-perimeter * 0.5}`, an2));
        svg.appendChild(makeRect("#fff", strokeGlow, `${-perimeter * 0.5}`, an2));

        iconEl.style.position = "relative";
        iconEl.appendChild(svg);
    }

    destroy() {
        this.drumSpinner.innerHTML = "";
    }
}

/* ================= DESKTOP HELPERS ================= */
function randSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

const ROWS = 7;
const COLS = 7;

function disableSpinButton() {
    spinBtn.classList.add("disabled");
}

function enableSpinButton() {
    if (spinning) return;
    spinBtn.classList.remove("disabled");
}

function getWinType(count) {
    if (count === 2) return WIN_TYPE.SMALL;
    if (count === 3) return WIN_TYPE.BIG;
    return WIN_TYPE.NONE;
}

function generateGrid() {
    const grid = [];
    for (let c = 0; c < COLS; c++) {
        const col = [];
        for (let r = 0; r < ROWS; r++) col.push(randSymbol());
        grid.push(col);
    }
    return grid;
}

function generateGridWithoutWin() {
    let grid;
    do { grid = generateGrid(); } while (findClusters(grid).length > 0);
    return grid;
}


function generateGridWithExactClusters(exact = 1) {
    let grid;
    do { grid = generateGrid(); } while (findClusters(grid).length !== exact);
    return grid;
}

function generateGridWithLimitedWin(min = 1) {
    let grid;
    do { grid = generateGrid(); } while (findClusters(grid).length < min);
    return grid;
}

function generateGridByWinType(winType) {
    switch (winType) {
        case WIN_TYPE.SMALL: return generateGridWithExactClusters(1);
        case WIN_TYPE.BIG:   return generateGridWithLimitedWin(3);
        default:             return generateGridWithoutWin();
    }
}

function findClusters(grid) {
    const visited = Array.from({ length: COLS }, () => Array(ROWS).fill(false));
    const clusters = [];

    function dfs(c, r, symbol, cluster) {
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS || visited[c][r] || grid[c][r] !== symbol) return;
        visited[c][r] = true;
        cluster.push({ c, r });
        dfs(c + 1, r, symbol, cluster);
        dfs(c - 1, r, symbol, cluster);
        dfs(c, r + 1, symbol, cluster);
        dfs(c, r - 1, symbol, cluster);
    }

    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
            if (!visited[c][r]) {
                const cluster = [];
                dfs(c, r, grid[c][r], cluster);
                if (cluster.length >= 3) clusters.push(cluster);
            }
        }
    }
    return clusters;
}

/* ================= DESKTOP RENDER ================= */
function getDesktopLayers() {
    return {
        oldLayer: drum.querySelector(".drum-layer--old .drum-columns"),
        newLayer: drum.querySelector(".drum-layer--new .drum-columns"),
    };
}

function renderLayer(layer, grid, animate = false) {
    layer.innerHTML = "";

    grid.forEach((colData, colIndex) => {
        const col = document.createElement("div");
        col.className = "drum-column";

        if (animate) {
            col.classList.add("drop-in");
            col.style.animationDelay = `${colIndex * DROP_DELAY}s`;
        }

        colData.forEach((symbol) => {
            const item = document.createElement("div");
            item.className = "drum__item";

            const inner = document.createElement("div");
            inner.className = "drum__item-inner";

            const img = document.createElement("img");
            img.src = ICON_PATH + symbol;
            img.alt = "Icon game";

            inner.appendChild(img);
            item.appendChild(inner);
            col.appendChild(item);
        });

        layer.appendChild(col);
    });
}

function highlightClusters(clusters) {
    const { newLayer } = getDesktopLayers();
    newLayer.querySelectorAll(".drum__item.win").forEach((el) => el.classList.remove("win"));

    clusters.forEach((cluster) => {
        cluster.forEach(({ c, r }) => {
            const col = newLayer.children[c];
            if (!col) return;
            const item = col.children[r];
            if (item) item.classList.add("win");
        });
    });
}

function animateLandingPerColumn() {
    const { newLayer } = getDesktopLayers();
    const columns = newLayer.querySelectorAll(".drum-column");

    columns.forEach((col, colIndex) => {
        const items = col.querySelectorAll(".drum__item");
        if (!items.length) return;

        const landingTime = DROP_TIME + colIndex * DROP_DELAY * 1000;

        setTimeout(() => {
            const total = items.length;
            items.forEach((item, index) => {
                const depth = (index + 1) / total;
                const scale = 0.1 * depth;
                const shift = 3.2 * Math.pow(depth, 2);
                item.style.setProperty("--land-scale", scale.toFixed(3));
                item.style.setProperty("--land-shift", `${shift.toFixed(2)}%`);
                item.classList.remove("land");
                void item.offsetWidth;
                item.classList.add("land");
            });
        }, landingTime);
    });
}

function calculateClusterWin(cluster) {
    return cluster.length * 10;
}

function createWinNumber(amount, x, y) {
    const el = document.createElement("div");
    el.className = "win-number";
    el.textContent = `+${amount}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
        el.classList.add("hide");
        setTimeout(() => el.remove(), 500);
    }, 900);
}

function getClusterCenter(cluster) {
    const { newLayer } = getDesktopLayers();
    let sumX = 0, sumY = 0, count = 0;

    cluster.forEach(({ c, r }) => {
        const col = newLayer.children[c];
        if (!col) return;
        const item = col.children[r];
        if (!item) return;
        const rect = item.getBoundingClientRect();
        sumX += rect.left + rect.width / 2;
        sumY += rect.top + rect.height / 2;
        count++;
    });

    return { x: sumX / count, y: sumY / count };
}

function animateClusterDisappear(clusters) {
    const { newLayer } = getDesktopLayers();
    clusters.forEach((cluster) => {
        cluster.forEach(({ c, r }) => {
            const col = newLayer.children[c];
            if (!col) return;
            const item = col.children[r];
            if (item) item.classList.add("disappear");
        });
    });
}

function applyCascade(grid, clusters) {
    const newGrid = grid.map((col) => [...col]);

    clusters.forEach((cluster) => {
        cluster.forEach(({ c, r }) => { newGrid[c][r] = null; });
    });

    for (let c = 0; c < COLS; c++) {
        const col = newGrid[c].filter((v) => v !== null);
        const missing = ROWS - col.length;
        newGrid[c] = [...Array.from({ length: missing }, randSymbol), ...col];
    }

    return newGrid;
}

function animateCascade(oldGridWithNulls, newGrid) {
    const { newLayer } = getDesktopLayers();
    const columns = newLayer.querySelectorAll(".drum-column");

    columns.forEach((col, c) => {
        const oldCol = oldGridWithNulls[c];
        const newCol = newGrid[c];
        const removedCount = oldCol.filter((s) => s === null).length;
        if (removedCount === 0) return;

        col.innerHTML = "";

        const newItems = [];
        newCol.forEach((symbol) => {
            const item = document.createElement("div");
            item.className = "drum__item";
            const inner = document.createElement("div");
            inner.className = "drum__item-inner";
            const img = document.createElement("img");
            img.src = ICON_PATH + symbol;
            img.alt = "Icon game";
            inner.appendChild(img);
            item.appendChild(inner);
            item.style.transition = "none";
            newItems.push(item);
            col.appendChild(item);
        });

        const oldRowMap = [];
        let oldItemIndex = 0;

        for (let newRow = 0; newRow < ROWS; newRow++) {
            if (newRow < removedCount) {
                oldRowMap[newRow] = null;
            } else {
                let currentOldRow = 0, foundCount = 0;
                for (let r = 0; r < ROWS; r++) {
                    if (oldCol[r] !== null) {
                        if (foundCount === oldItemIndex) { currentOldRow = r; break; }
                        foundCount++;
                    }
                }
                oldRowMap[newRow] = currentOldRow;
                oldItemIndex++;
            }
        }

        for (let newRow = 0; newRow < ROWS; newRow++) {
            const item = newItems[newRow];
            const oldRow = oldRowMap[newRow];

            if (oldRow === null) {
                const startOffset = (ROWS + removedCount - newRow) * 100;
                item.style.transform = `translateY(-${startOffset}%)`;
                item.dataset.needsAnimation = "true";
            } else {
                const distance = newRow - oldRow;
                if (distance === 0) {
                    item.style.transform = "translateY(0)";
                    item.dataset.needsAnimation = "false";
                } else if (distance > 0) {
                    item.style.transform = `translateY(-${distance * 100}%)`;
                    item.dataset.needsAnimation = "true";
                } else {
                    item.style.transform = "translateY(0)";
                    item.dataset.needsAnimation = "false";
                }
            }
        }
    });

    columns.forEach((col) => { void col.offsetHeight; });

    setTimeout(() => {
        columns.forEach((col) => {
            col.querySelectorAll(".drum__item").forEach((item) => {
                if (item.dataset.needsAnimation !== "false") {
                    item.style.transition = "transform 0.6s cubic-bezier(.22,.61,.36,1)";
                    item.style.transform = "translateY(0)";
                }
            });
        });
    }, 50);
}

function processCascade() {
    const { newLayer } = getDesktopLayers();
    const clusters = findClusters(currentGrid);

    if (clusters.length === 0) {
        spinning = false;
        enableSpinButton();

        if (getWinType(spinCount) === WIN_TYPE.BIG) {
            openPopup();
        }
        return;
    }

    highlightClusters(clusters);

    clusters.forEach((cluster) => {
        const win = calculateClusterWin(cluster);
        const { x, y } = getClusterCenter(cluster);
        createWinNumber(win, x, y);
    });

    setTimeout(() => {
        animateClusterDisappear(clusters);

        setTimeout(() => {
            const oldGridWithNulls = currentGrid.map((col) => [...col]);
            clusters.forEach((cluster) => {
                cluster.forEach(({ c, r }) => { oldGridWithNulls[c][r] = null; });
            });

            const newGrid = applyCascade(currentGrid, clusters);
            drum.classList.add("cascading");
            animateCascade(oldGridWithNulls, newGrid);
            currentGrid = newGrid;

            setTimeout(() => {
                drum.classList.remove("cascading");
                renderLayer(newLayer, currentGrid);
                processCascade();
            }, 600);
        }, DISAPPEAR_TIME);
    }, WIN_TIME);
}

/* ================= DESKTOP SPIN ================= */
function spinDesktop() {
    if (spinning) return;
    spinning = true;
    disableSpinButton();

    const { oldLayer, newLayer } = getDesktopLayers();

    renderLayer(oldLayer, currentGrid);
    newLayer.innerHTML = "";

    const oldCols = oldLayer.querySelectorAll(".drum-column");
    oldCols.forEach((col, i) => {
        col.classList.add("drop-out");
        col.style.animationDelay = `${i * DROP_DELAY}s`;
    });

    setTimeout(() => {
        oldLayer.innerHTML = "";

        spinCount++;
        const winType = getWinType(spinCount);
        const nextGrid = generateGridByWinType(winType);

        renderLayer(newLayer, nextGrid, true);
        currentGrid = nextGrid;

        if (winType !== WIN_TYPE.NONE) {
            setTimeout(() => processCascade(), 600);
        } else {
            spinning = false;
            setTimeout(() => enableSpinButton(), 900);
        }

        renderLayer(newLayer, nextGrid, true);
        currentGrid = nextGrid;

        setTimeout(() => animateLandingPerColumn(), 300);
    }, DROP_TIME + COLS * DROP_DELAY * 1000);
}

/* ================= INIT ================= */
let mobileSlot = null;

function initDesktop() {
    /* ensure desktop layers exist */
    if (!drum.querySelector(".drum-layer--old")) {
        drum.innerHTML = `
            <div class="drum__layer drum-layer--old"><div class="drum-columns"></div></div>
            <div class="drum__layer drum-layer--new"><div class="drum-columns"></div></div>
        `;
    }
    /* remove mobile spinner if present */
    const ms = drum.querySelector(".drum__spinner");
    if (ms) ms.remove();

    currentGrid = generateGridWithoutWin();
    const { newLayer } = getDesktopLayers();
    renderLayer(newLayer, currentGrid);
}

function initMobile() {
    /* ensure spinner container exists inside drum */
    const existingLayers = drum.querySelectorAll(".drum__layer");
    existingLayers.forEach((l) => (l.style.display = "none"));

    mobileSlot = new MobileSlotMachine();
}

function setupMode() {
    if (isMobile()) {
        initMobile();
    } else {
        initDesktop();
    }
}

/* ================= RESIZE HANDLING ================= */
let lastMode = isMobile() ? "mobile" : "desktop";

window.addEventListener("resize", () => {
    const nowMobile = isMobile();
    const newMode = nowMobile ? "mobile" : "desktop";

    if (newMode === lastMode) return;
    lastMode = newMode;

    spinning = false;
    spinCount = 0;

    if (mobileSlot) {
        mobileSlot.destroy();
        mobileSlot = null;
    }

    if (nowMobile) {
        initMobile();
    } else {
        /* restore desktop layers */
        drum.querySelectorAll(".drum__layer").forEach((l) => (l.style.display = ""));
        const ms = drum.querySelector(".drum__spinner");
        if (ms) ms.remove();
        initDesktop();
    }
});

/* ================= EVENTS ================= */
spinBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (isMobile()) {
        if (mobileSlot) mobileSlot.spin();
    } else {
        spinDesktop();
    }
});

/* ================= BOOTSTRAP ================= */
setupMode();
