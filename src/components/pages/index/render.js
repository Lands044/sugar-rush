// textContent rather than innerText: these are plain labels, and innerText is
// rendering-dependent (it reads back empty inside a hidden element).
const setText = (selector, value) => {
	const element = document.querySelector(selector)
	if (element && typeof value === 'string') element.textContent = value
}

/**
 * Applies the config to the static parts of the page (menu labels/values, popup
 * texts, CTA link). Safe to call repeatedly — the dev watcher and the config
 * panel re-run it on every edit. The reels themselves are rebuilt by index.js.
 */
export function renderLanding(config) {
	const { game, texts, cta } = config

	setText('.menu__credit > span', texts.creditLabel)
	setText('.menu__value-all', game.credit)
	setText('.menu__bet > span', texts.betLabel)
	setText('.menu__value-win', game.bet)
	setText('.menu__title', texts.title)

	// popup.js rewrites these when the popup opens (and the 18+ mode, if
	// re-enabled, overrides them) — set here too so the markup matches the config.
	setText('.popup__title', texts.popupTitle)
	setText('.popup__text', texts.popupText)
	setText('.popup .cta-button', texts.ctaButton)

	const ctaButton = document.querySelector('.popup .cta-button')
	if (ctaButton) {
		ctaButton.href = cta.url
		ctaButton.target = cta.target
	}
}
