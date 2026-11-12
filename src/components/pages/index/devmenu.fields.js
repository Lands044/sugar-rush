// Sugar Rush devmenu field groups, concatenated with CORE_FIELDS (texts/CTA/
// sound) in index.js. See src/js/config/devmenu.js for the field shape
// ({ path, label, type, min/max/step, hint }).
//
// Deliberately file-only (edit public/config.json by hand):
//   - game.mobile.spins — each spin is a 3×3 result grid + win line bound to the
//     reel layout; a free-typed value would easily break the scripted outcome.
//   - game.symbols / game.iconPath — mobile results refer to symbols by index.
//   - assets.sounds, cta.target, dev.* — plumbing, not producer-facing.
// Animation timings and per-sound volume levels are not config at all — they
// live in index.js / sound.js.
export const GAME_FIELDS = [
	['Гра', [
		{ path: 'game.credit', label: 'Кредит', type: 'text' },
		{ path: 'game.bet', label: 'Ставка', type: 'text' },
		{ path: 'game.clusterWinPerSymbol', label: 'Виграш за символ кластера', type: 'number', min: 0, step: 1 },
		{ path: 'game.desktop.spins', label: 'Спіни desktop', type: 'list',
			hint: 'none / small / big, по порядку; після big — попап, далі все none' }
	]],
	['Тексти меню', [
		{ path: 'texts.title', label: 'Заголовок меню', type: 'text' },
		{ path: 'texts.creditLabel', label: 'Підпис "Credit"', type: 'text' },
		{ path: 'texts.betLabel', label: 'Підпис "Bet"', type: 'text' }
	]]
]
