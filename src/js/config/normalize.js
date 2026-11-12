import { setGameNormalizer, mergeConfig, toNumber } from '@js/config/config.js'
import { DEFAULT_CONFIG } from './game.defaults.js'

const DESKTOP_TYPES = ['none', 'small', 'big']
const MOBILE_TYPES = ['loss', 'smallwin', 'bigwin']
const MOBILE_COLS = 3
const MOBILE_ROWS = 3

const text = (value, fallback) => (typeof value === 'string' ? value : fallback)

// A mobile spin is bound to the 3×3 reel layout; anything malformed falls back
// to the default spin at the same index (or a plain loss) instead of being dropped.
function normalizeMobileSpin(spin, index, symbolCount) {
	const fallback = DEFAULT_CONFIG.game.mobile.spins[index] || DEFAULT_CONFIG.game.mobile.spins[0]
	if (!spin || typeof spin !== 'object') return structuredClone(fallback)

	const type = MOBILE_TYPES.includes(spin.type) ? spin.type : 'loss'

	const resultOk = Array.isArray(spin.result) && spin.result.length === MOBILE_COLS &&
		spin.result.every(col => Array.isArray(col) && col.length === MOBILE_ROWS &&
			col.every(n => Number.isInteger(n) && n >= 1 && n <= symbolCount))
	const result = resultOk ? spin.result : structuredClone(fallback.result)

	const lineOk = Array.isArray(spin.winLine) && spin.winLine.length === MOBILE_COLS &&
		spin.winLine.every(r => Number.isInteger(r) && r >= 0 && r < MOBILE_ROWS)
	// A win needs a line to highlight; a loss ignores it.
	const winLine = lineOk ? spin.winLine : (type === 'loss' ? null : [1, 1, 1])

	return { ...spin, type, winLine, result }
}

// Registered with the core config module. Core normalizeConfig() merges with the
// CORE defaults only, so the game's own sections are merged in here first.
function normalizeGameConfig(input) {
	const config = mergeConfig(DEFAULT_CONFIG, input)
	delete config.texts.actionButton
	delete config.texts.rotateNotice

	const d = DEFAULT_CONFIG
	const { game } = config

	game.credit = text(game.credit, d.game.credit)
	game.bet = text(game.bet, d.game.bet)
	game.iconPath = text(game.iconPath, d.game.iconPath)
	game.symbols = Array.isArray(game.symbols) && game.symbols.filter(Boolean).length
		? game.symbols.filter(Boolean).map(String)
		: [...d.game.symbols]
	game.clusterWinPerSymbol = Math.max(0, toNumber(game.clusterWinPerSymbol, d.game.clusterWinPerSymbol))

	const dt = game.desktop
	dt.spins = (Array.isArray(dt.spins) ? dt.spins : [])
		.map(type => (DESKTOP_TYPES.includes(type) ? type : 'none'))

	const mb = game.mobile
	mb.spins = (Array.isArray(mb.spins) ? mb.spins : [])
		.map((spin, i) => normalizeMobileSpin(spin, i, game.symbols.length))

	return config
}

export function registerGameConfig() {
	setGameNormalizer(normalizeGameConfig)
}
