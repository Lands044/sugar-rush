import { DEFAULT_CONFIG as CORE_DEFAULTS } from '@js/config/defaults.js'

// Sugar Rush defaults, merged on top of the core shape (texts/cta/sound/dev).
//
// Two mechanics share one page, picked by viewport width (index.js, MOBILE_BREAKPOINT):
//   - desktop: 7×7 cluster-pays grid with cascades. Each spin is scripted by
//     `game.desktop.spins` ("none" | "small" | "big"); the popup opens after the
//     cascades of a "big" spin finish.
//   - mobile: 3×3 reels with fully scripted results (`game.mobile.spins`); the
//     popup opens after the last scripted spin.
//
// Grid sizes (7×7 / 3×3), the breakpoint, animation timings and per-sound volume
// levels stay in code (index.js / sound.js).
//
// Named game.defaults.js (not defaults.js) deliberately: the core kit installs its
// own src/js/config/defaults.js, which this file spreads.

// Core fields this game has no element for: the spin button is an image (no
// label), there is no rotate overlay, and logo/background are SCSS-only art.
const {
	texts: { actionButton, rotateNotice, ...CORE_TEXTS },
	assets: CORE_ASSETS,
	...CORE_REST
} = CORE_DEFAULTS

export const DEFAULT_CONFIG = {
	...CORE_REST,

	cta: {
		url: '#',
		target: '_self'
	},

	texts: {
		...CORE_TEXTS,
		ctaButton: 'Download Now',
		title: 'Place your bets!',
		creditLabel: 'Credit',
		betLabel: 'Bet'
	},

	assets: {
		// Built-in keys = file names in src/assets/sound without extension, or URLs.
		sounds: {
			background: 'main_bg',
			hover: 'btn_hover',
			spin: 'btn_click'
		}
	},

	game: {
		// Shown as-is in the bottom menu.
		credit: '$100,000.00',
		bet: '$2.00',

		// Reel symbols: `iconPath` + file name. Mobile results below refer to them
		// by 1-based index into this list.
		iconPath: 'assets/img/icon/',
		symbols: [
			'pic_01.webp',
			'pic_02.webp',
			'pic_03.webp',
			'pic_04.webp',
			'pic_05.webp',
			'pic_06.webp',
			'pic_07.webp',
			'pic_08.webp',
			'pic_09.webp'
		],

		// "+N" floating number per cluster = cluster size × this.
		clusterWinPerSymbol: 10,

		desktop: {
			// Scripted spins, in order. Past the end of the list every spin is "none".
			spins: ['none', 'small', 'big']
		},

		mobile: {
			// type: "loss" | "smallwin" | "bigwin"
			// winLine: row (0–2) of the winning symbol in each reel, or null
			// result: per reel, top-to-bottom symbol numbers (1-based, see `symbols`)
			spins: [
				{
					type: 'loss',
					winLine: null,
					result: [
						[4, 1, 7],
						[5, 2, 8],
						[7, 4, 3]
					]
				},
				{
					type: 'smallwin',
					winLine: [1, 1, 1],
					result: [
						[2, 4, 5],
						[7, 4, 2],
						[4, 4, 8]
					]
				},
				{
					type: 'bigwin',
					winLine: [1, 1, 1],
					result: [
						[8, 5, 7],
						[3, 8, 6],
						[6, 8, 4]
					]
				}
			]
		}
	}
}
