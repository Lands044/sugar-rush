import ConfettiAnimation from './confetti.js';

class SlotMachine {
	constructor() {
		// DOM елементи
		this.drumSpinner = document.querySelector('.drum__spinner');
		this.popup = document.querySelector('.popup');
		this.buttonsWrap = document.querySelector('.menu__bottom');

		// Анімація конфеті
		this.confettiAnimation = null;

		// Кнопки
		this.spinButton = document.querySelector('.menu__button-spin');
		this.autoButton = document.querySelector('.menu__button-auto');
		this.soundButton = document.querySelector('.menu__sound');
		this.increaseButton = document.querySelector('.menu__button-arrow.increase');
		this.reduceButton = document.querySelector('.menu__button-arrow.reduce');

		// Кнопки ставок
		this.betButtons = document.querySelectorAll('.menu__bet-btn');

		// Елементи UI
		this.balanceElement = document.querySelector('.menu__info .number');
		this.betElement = document.querySelector('.menu__bet-value .number');

		// Стан гри
		this.spinCount = 0;
		this.isSpinning = false;
		this.isSoundEnabled = true;

		// Тип анімації виграшу: 'line' (виграшна лінія) або 'border' (анімована обводка)
		this.winAnimationType = 'border';

		// Фінансові значення
		this.balance = 1000.00;
		this.betValues = this.getBetValuesFromButtons();
		this.currentBetIndex = 0;
		this.bet = this.betValues[this.currentBetIndex];

		// Брейкпоінти: desktop (>767.98px) та mobile (<=767.98px)
		// Desktop iconHeight масштабується тільки на екранах > 1440px
		// На менших екранах залишається фіксованим 180px
		this.breakpoints = {
			desktop: {
				minWidth: 767.98,
				cols: 5,
				rows: 3,
				// Масштабування тільки для екранів > 1440px, інакше фіксовано 180px
				getIconHeight: () => Math.max(180, (180 / 1440) * window.innerWidth)
			},
			mobile: {
				minWidth: 0,
				cols: 3,
				rows: 3,
				getIconHeight: () => 140
			}
		};

		// Поточна конфігурація
		this.config = this.getConfigForCurrentBreakpoint();

		// Базовий URL для ресурсів (коректні шляхи у білді)
		this.baseUrl = import.meta.env.BASE_URL || './';

		// Звуки
		this.sounds = {
			spin: new Audio(`${this.baseUrl}assets/sound/spin.mp3`),
			win: new Audio(`${this.baseUrl}assets/sound/win.mp3`)
		};

		// Іконки (8 типів)
		this.icons = 8;
		this.iconsPerReel = 100;

		// Елементи Lines
		this.linesItems = document.querySelectorAll('.lines__item');
		this.linesContainer = document.querySelector('.drum');

		// Патерни ліній для кожного значення
		// Desktop: 5 колонок, 3 рядки (0-2)
		// Mobile: 3 колонки, 3 рядки (0-2)
		this.linePatterns = {
			100: this.generateRandomLines(20),
			80: this.generateRandomLines(16),
			60: this.generateRandomLines(12),
			40: this.generateRandomLines(8),
			20: this.generateRandomLines(4)
		};

		// Предустановлені результати спінів
		// Desktop: 5 колонок по 3 іконки
		// Mobile: 3 колонки по 3 іконки
		// winLine: масив рядків (0-2 для desktop, 0-2 для mobile) де знаходяться виграшні іконки
		this.predefinedResults = {
			desktop: [
				{
					type: 'loss',
					winAmount: 0,
					winLine: null,
					result: [
						[2, 4, 1],
						[3, 5, 2],
						[1, 7, 4],
						[6, 2, 5],
						[4, 1, 3]
					]
				},
				{
					type: 'smallwin',
					winAmount: 50,
					// Виграшна лінія: середній рядок (горизонтальна лінія посередині)
					winLine: [1, 2, 1, null, null],
					result: [
						[1, 3, 4],
						[7, 4, 3],
						[4, 3, 1],
						[2, 5, 4],
						[5, 6, 7]
					]
				},
				{
					type: 'bigwin',
					winAmount: 150,
					// Виграшна лінія: діагональ вниз
					winLine: [0, 0, 1, 2, 2],
					result: [
						[8, 4, 7],
						[8, 6, 2],
						[3, 8, 1],
						[1, 4, 8],
						[5, 3, 8]
					]
				}
			],
			mobile: [
				{
					type: 'loss',
					winAmount: 0,
					winLine: null,
					result: [
						[4, 1, 7],
						[5, 2, 8],
						[7, 4, 3]
					]
				},
				{
					type: 'smallwin',
					winAmount: 50,
					// Виграшна лінія: середній рядок
					winLine: [1, 1, 1],
					result: [
						[2, 3, 5],
						[7, 3, 2],
						[4, 3, 8]
					]
				},
				{
					type: 'bigwin',
					winAmount: 150,
					// Виграшна лінія: середній рядок
					winLine: [2, 1, 1],
					result: [
						[8, 5, 7],
						[3, 8, 6],
						[6, 8, 4]
					]
				}
			]
		};

		this.init();
	}

	getCurrentBreakpoint() {
		const width = window.innerWidth;
		if (width > this.breakpoints.desktop.minWidth) {
			return 'desktop';
		}
		return 'mobile';
	}

	getConfigForCurrentBreakpoint() {
		const breakpoint = this.getCurrentBreakpoint();
		return { ...this.breakpoints[breakpoint], breakpoint };
	}

	getResultsForCurrentBreakpoint() {
		const breakpoint = this.getCurrentBreakpoint();
		return this.predefinedResults[breakpoint];
	}

	init() {
		// Створюємо структуру барабанів зі стрічками
		this.createReels();

		// Обробники кнопок спіну
		this.spinButton.addEventListener('click', (e) => {
			e.preventDefault();
			this.handleSpin();
		});

		this.autoButton.addEventListener('click', (e) => {
			e.preventDefault();
			this.handleSpin();
		});

		// Обробник кнопки звуку
		this.soundButton.addEventListener('click', (e) => {
			e.preventDefault();
			this.toggleSound();
		});

		// Обробники стрілок для зміни ставки
		if (this.increaseButton) {
			this.increaseButton.addEventListener('click', (e) => {
				e.preventDefault();
				this.decreaseBet();
			});
		}

		if (this.reduceButton) {
			this.reduceButton.addEventListener('click', (e) => {
				e.preventDefault();
				this.increaseBet();
			});
		}

		// Обробники кнопок ставок
		this.betButtons.forEach((button, index) => {
			button.addEventListener('click', () => {
				this.selectBet(index);
			});
		});

		// Оновлення при зміні розміру вікна
		window.addEventListener('resize', () => {
			this.handleResize();
		});

		// Обробники кнопок Lines
		this.linesItems.forEach((item) => {
			item.addEventListener('click', () => {
				this.handleLinesClick(item);
			});
		});

		// Оновлюємо UI
		this.updateUI();
	}

	// Створює структуру барабанів зі стрічками для анімації
	createReels() {
		// Очищаємо існуючу розмітку
		this.drumSpinner.innerHTML = '';

		const cols = this.config.cols;
		const rows = this.config.rows;
		const iconHeight = this.config.getIconHeight();

		// Створюємо колонки
		for (let colIndex = 0; colIndex < cols; colIndex++) {
			const column = document.createElement('div');
			column.className = 'drum__column';
			column.dataset.column = colIndex;

			// Створюємо стрічку (strip) з іконками
			const strip = document.createElement('div');
			strip.className = 'drum__strip';

			// Випадкове зміщення для кожної колонки
			const randomOffset = Math.floor(Math.random() * this.icons);

			// Генеруємо випадкові іконки для стрічки
			for (let i = 0; i < this.iconsPerReel; i++) {
				const iconNum = ((i + randomOffset) % this.icons) + 1;
				const icon = document.createElement('div');
				icon.className = 'drum__image';
				icon.innerHTML = `<img src="${this.baseUrl}assets/img/icon/icon-${iconNum}.webp" alt="Icon ${iconNum}">`;
				strip.appendChild(icon);
			}

			// Додаємо predefined комбінації в кінець стрічки
			const results = this.getResultsForCurrentBreakpoint();
			results.forEach((result) => {
				const columnIcons = result.result[colIndex];
				if (columnIcons) {
					columnIcons.forEach((iconNum) => {
						const icon = document.createElement('div');
						icon.className = 'drum__image';
						icon.innerHTML = `<img src="${this.baseUrl}assets/img/icon/icon-${iconNum}.webp" alt="Icon ${iconNum}">`;
						strip.appendChild(icon);
					});
				}
			});

			column.appendChild(strip);
			this.drumSpinner.appendChild(column);
		}

		// Встановлюємо початкові позиції
		this.initializePositions();
	}

	// Встановлює початкові позиції стрічок
	initializePositions() {
		const columns = this.drumSpinner.querySelectorAll('.drum__column');
		const iconHeight = this.config.getIconHeight();

		columns.forEach((column) => {
			const strip = column.querySelector('.drum__strip');
			// Початкова позиція - показуємо перші іконки
			const randomOffset = Math.floor(Math.random() * this.icons) * iconHeight;
			strip.style.transform = `translateY(-${randomOffset}px)`;
		});
	}

	// Обробка зміни розміру вікна
	handleResize() {
		const newConfig = this.getConfigForCurrentBreakpoint();
		if (newConfig.breakpoint !== this.config.breakpoint) {
			this.config = newConfig;
			this.spinCount = 0;
			this.createReels();
			// Перегенеровуємо патерни ліній для нового брейкпоінта
			this.regenerateLinePatterns();
			// Видаляємо відображені лінії
			this.removePaylines();
		}
	}

	// Обробка спіну
	async handleSpin() {
		if (this.isSpinning) return;

		if (this.balance < this.bet) {
			console.log('Недостатньо коштів');
			return;
		}

		const results = this.getResultsForCurrentBreakpoint();

		if (this.spinCount >= results.length) {
			console.log('Всі спіни використано');
			return;
		}

		this.isSpinning = true;

		// Віднімаємо ставку
		this.balance -= this.bet;
		this.updateUI();

		// Блокуємо кнопки
		this.disableSpinButtons();

		// Звук спіну
		this.playSound('spin');

		const currentResult = results[this.spinCount];

		// Запускаємо анімацію обертання
		await this.spin(currentResult);

		// Показуємо результат
		this.showResult(currentResult);

		// Додаємо виграш
		if (currentResult.winAmount > 0) {
			this.balance += currentResult.winAmount;
			this.updateUI();
		}

		this.spinCount++;
		this.isSpinning = false;

		if (this.spinCount >= results.length) {
			this.showCTA();
		}
		// Кнопки розблоковуються після завершення анімації виграшу в showResult
	}

	// Анімація обертання всіх колонок
	async spin(result) {
		const columns = this.drumSpinner.querySelectorAll('.drum__column');
		const duration = 3000;

		// Запускаємо анімацію кожної колонки з затримкою
		const spinPromises = Array.from(columns).map((column, colIndex) => {
			return new Promise((resolve) => {
				setTimeout(() => {
					this.spinColumn(column, result.result[colIndex], duration, colIndex);
					setTimeout(resolve, duration + (colIndex * 100));
				}, colIndex * 100);
			});
		});

		await Promise.all(spinPromises);
	}

	// Анімація обертання однієї колонки
	spinColumn(column, targetIcons, duration, colIndex) {
		const strip = column.querySelector('.drum__strip');
		const iconHeight = this.config.getIconHeight();
		const rows = this.config.rows;

		// Знаходимо позицію потрібної послідовності в стрічці
		const targetPosition = this.findSequencePosition(strip, targetIcons);

		if (targetPosition === -1) {
			console.log('Послідовність не знайдена');
			return;
		}

		// Скидаємо до початкової позиції
		strip.style.transition = 'none';
		strip.style.transform = 'translateY(0)';

		// Примусовий reflow
		strip.offsetHeight;

		// Додаємо blur ефект на початку обертання
		strip.classList.add('active');

		// Фінальна позиція - показати потрібні іконки
		const finalOffset = targetPosition * iconHeight;

		// Запускаємо анімацію з плавним сповільненням
		strip.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
		strip.style.transform = `translateY(-${finalOffset}px)`;

		// Видаляємо blur ефект перед зупинкою (за 500ms до кінця)
		setTimeout(() => {
			strip.classList.remove('active');
		}, duration - 250);
	}

	// Знаходить позицію послідовності іконок у стрічці
	findSequencePosition(strip, targetIcons) {
		const icons = strip.querySelectorAll('.drum__image img');

		// Шукаємо з кінця стрічки (там predefined комбінації)
		for (let i = icons.length - targetIcons.length; i >= 0; i--) {
			let found = true;

			for (let j = 0; j < targetIcons.length; j++) {
				const img = icons[i + j];
				if (!img) {
					found = false;
					break;
				}

				const iconNum = this.getIconNumber(img);
				if (iconNum !== targetIcons[j]) {
					found = false;
					break;
				}
			}

			if (found) {
				return i;
			}
		}

		return -1;
	}

	// Отримує номер іконки з src
	getIconNumber(img) {
		const src = img.getAttribute('src');
		const match = src.match(/icon-(\d+)\.webp/);
		return match ? parseInt(match[1]) : 1;
	}

	// Показ результату
	showResult(result) {
		if (result.type === 'bigwin') {
			this.playSound('win');
			this.drumSpinner.classList.add('bigwin-animation');
			this.createWinEffects();

			// Малюємо анімацію виграшу
			if (result.winLine) {
				this.drawWinAnimation(result.winLine);
			}

			setTimeout(() => {
				this.drumSpinner.classList.remove('bigwin-animation');
				this.removeWinAnimation();
				this.enableSpinButtons();
			}, 2000);

		} else if (result.type === 'smallwin') {
			this.playSound('win');
			this.drumSpinner.classList.add('smallwin-animation');

			// Малюємо анімацію виграшу
			if (result.winLine) {
				this.drawWinAnimation(result.winLine);
			}

			setTimeout(() => {
				this.drumSpinner.classList.remove('smallwin-animation');
				this.removeWinAnimation();
				this.enableSpinButtons();
			}, 1500);

		} else {
			// Програш - одразу розблоковуємо кнопки
			this.enableSpinButtons();
		}
	}

	// Малює анімацію виграшу в залежності від типу
	drawWinAnimation(winLine) {
		if (this.winAnimationType === 'border') {
			this.drawWinBorder(winLine);
		} else {
			this.drawWinLine(winLine);
		}
	}

	// Видаляє анімацію виграшу
	removeWinAnimation() {
		if (this.winAnimationType === 'border') {
			this.removeWinBorder();
		} else {
			this.removeWinLine();
		}
	}

	// Встановлює тип анімації виграшу ('line' або 'border')
	setWinAnimationType(type) {
		if (type === 'line' || type === 'border') {
			this.winAnimationType = type;
		}
	}

	// Малює анімовану обводку навколо виграшних іконок
	drawWinBorder(winLine) {
		const columns = this.drumSpinner.querySelectorAll('.drum__column');
		const iconHeight = this.config.getIconHeight();
		const rows = this.config.rows;

		columns.forEach((column, colIndex) => {
			const winRowIndex = winLine[colIndex];
			if (winRowIndex === null || colIndex >= columns.length) return;

			const strip = column.querySelector('.drum__strip');
			const icons = strip.querySelectorAll('.drum__image');

			// Визначаємо видимі іконки на основі поточної позиції strip
			const transform = strip.style.transform;
			const match = transform.match(/translateY\(-?(\d+)px\)/);
			const currentOffset = match ? parseInt(match[1]) : 0;
			const visibleStartIndex = Math.round(currentOffset / iconHeight);

			// Застосовуємо ефекти до всіх видимих іконок
			for (let i = 0; i < rows; i++) {
				const iconIndex = visibleStartIndex + i;
				const icon = icons[iconIndex];
				if (!icon) continue;

				if (i === winRowIndex) {
					// Виграшна іконка - додаємо анімовану обводку
					icon.classList.add('win-border-animation');
					this.createAnimatedBorder(icon);
				} else {
					// Невиграшна іконка - затемнюємо
					icon.classList.add('dimmed');
				}
			}
		});
	}

	// Масштабує значення пропорційно viewport (тільки для екранів > 1440px)
	scaleValue(px) {
		const baseWidth = 1440;
		return Math.max(px, (px / baseWidth) * window.innerWidth);
	}

	// Створює SVG анімовану обводку для іконки
	createAnimatedBorder(iconElement) {
		const width = iconElement.offsetWidth;
		const height = iconElement.offsetHeight;

		// Масштабовані значення для екранів > 1440px
		const padding = this.scaleValue(8);
		const borderRadius = this.scaleValue(12);
		const strokeWidthMain = this.scaleValue(6);
		const strokeWidthGlow = this.scaleValue(2);
		const blurStdDeviation = this.scaleValue(6);

		// Створюємо SVG контейнер
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('class', 'win-border-svg');
		svg.setAttribute('width', width);
		svg.setAttribute('height', height);
		svg.style.position = 'absolute';
		svg.style.top = '0';
		svg.style.left = '0';
		svg.style.pointerEvents = 'none';
		svg.style.zIndex = '50';
		svg.style.overflow = 'visible';

		// Розміри прямокутника з відступом
		const rectX = padding;
		const rectY = padding;
		const rectWidth = width - padding * 2;
		const rectHeight = height - padding * 2;

		// Периметр прямокутника (для анімації)
		const perimeter = 2 * (rectWidth + rectHeight);

		// Defs для фільтрів
		const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

		// Фільтр для blur/glow ефекту
		const filterId = `glow-${Date.now()}-${Math.random()}`;
		const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
		filter.setAttribute('id', filterId);
		filter.setAttribute('x', '-50%');
		filter.setAttribute('y', '-50%');
		filter.setAttribute('width', '200%');
		filter.setAttribute('height', '200%');

		const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
		feGaussianBlur.setAttribute('stdDeviation', blurStdDeviation);
		feGaussianBlur.setAttribute('result', 'coloredBlur');

		const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
		const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
		feMergeNode1.setAttribute('in', 'coloredBlur');
		const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
		feMergeNode2.setAttribute('in', 'SourceGraphic');

		feMerge.appendChild(feMergeNode1);
		feMerge.appendChild(feMergeNode2);
		filter.appendChild(feGaussianBlur);
		filter.appendChild(feMerge);
		defs.appendChild(filter);
		svg.appendChild(defs);

		// Налаштування dash для анімації "біжучого" світла
		const dashLength = perimeter * 0.2; // 20% периметра світиться

		// Унікальне ім'я для keyframes (на основі периметра)
		const animationName1 = `borderRotate-${Math.round(perimeter)}`;
		const animationName2 = `borderRotate2-${Math.round(perimeter)}`;

		// Додаємо динамічні keyframes в style тег
		const styleId = `border-anim-style-${Math.round(perimeter)}`;
		if (!document.getElementById(styleId)) {
			const style = document.createElement('style');
			style.id = styleId;
			style.textContent = `
				@keyframes ${animationName1} {
					0% { stroke-dashoffset: 0; }
					100% { stroke-dashoffset: ${-perimeter}; }
				}
				@keyframes ${animationName2} {
					0% { stroke-dashoffset: ${-perimeter * 0.5}; }
					100% { stroke-dashoffset: ${-perimeter * 1.5}; }
				}
			`;
			document.head.appendChild(style);
		}

		// Перша анімована лінія (починає з верхнього лівого кута)
		const animRect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		animRect1.setAttribute('x', rectX);
		animRect1.setAttribute('y', rectY);
		animRect1.setAttribute('width', rectWidth);
		animRect1.setAttribute('height', rectHeight);
		animRect1.setAttribute('rx', borderRadius);
		animRect1.setAttribute('ry', borderRadius);
		animRect1.setAttribute('fill', 'none');
		animRect1.setAttribute('stroke', '#ffb921');
		animRect1.setAttribute('stroke-width', strokeWidthMain);
		animRect1.setAttribute('stroke-linecap', 'round');
		animRect1.setAttribute('filter', `url(#${filterId})`);
		animRect1.setAttribute('stroke-dasharray', `${dashLength} ${perimeter - dashLength}`);
		animRect1.setAttribute('stroke-dashoffset', '0');
		animRect1.style.animation = `${animationName1} 3s linear infinite`;
		svg.appendChild(animRect1);

		// Білий центр для першої лінії
		const glowRect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		glowRect1.setAttribute('x', rectX);
		glowRect1.setAttribute('y', rectY);
		glowRect1.setAttribute('width', rectWidth);
		glowRect1.setAttribute('height', rectHeight);
		glowRect1.setAttribute('rx', borderRadius);
		glowRect1.setAttribute('ry', borderRadius);
		glowRect1.setAttribute('fill', 'none');
		glowRect1.setAttribute('stroke', '#fff');
		glowRect1.setAttribute('stroke-width', strokeWidthGlow);
		glowRect1.setAttribute('stroke-linecap', 'round');
		glowRect1.setAttribute('stroke-dasharray', `${dashLength * 0.5} ${perimeter - dashLength * 0.5}`);
		glowRect1.setAttribute('stroke-dashoffset', '0');
		glowRect1.style.animation = `${animationName1} 3s linear infinite`;
		svg.appendChild(glowRect1);

		// Друга анімована лінія (починає з діагонально протилежного кута - 50% зміщення)
		const animRect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		animRect2.setAttribute('x', rectX);
		animRect2.setAttribute('y', rectY);
		animRect2.setAttribute('width', rectWidth);
		animRect2.setAttribute('height', rectHeight);
		animRect2.setAttribute('rx', borderRadius);
		animRect2.setAttribute('ry', borderRadius);
		animRect2.setAttribute('fill', 'none');
		animRect2.setAttribute('stroke', '#ffb921');
		animRect2.setAttribute('stroke-width', strokeWidthMain);
		animRect2.setAttribute('stroke-linecap', 'round');
		animRect2.setAttribute('filter', `url(#${filterId})`);
		animRect2.setAttribute('stroke-dasharray', `${dashLength} ${perimeter - dashLength}`);
		animRect2.setAttribute('stroke-dashoffset', `${-perimeter * 0.5}`);
		animRect2.style.animation = `${animationName2} 3s linear infinite`;
		svg.appendChild(animRect2);

		// Білий центр для другої лінії
		const glowRect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		glowRect2.setAttribute('x', rectX);
		glowRect2.setAttribute('y', rectY);
		glowRect2.setAttribute('width', rectWidth);
		glowRect2.setAttribute('height', rectHeight);
		glowRect2.setAttribute('rx', borderRadius);
		glowRect2.setAttribute('ry', borderRadius);
		glowRect2.setAttribute('fill', 'none');
		glowRect2.setAttribute('stroke', '#fff');
		glowRect2.setAttribute('stroke-width', strokeWidthGlow);
		glowRect2.setAttribute('stroke-linecap', 'round');
		glowRect2.setAttribute('stroke-dasharray', `${dashLength * 0.5} ${perimeter - dashLength * 0.5}`);
		glowRect2.setAttribute('stroke-dashoffset', `${-perimeter * 0.5}`);
		glowRect2.style.animation = `${animationName2} 3s linear infinite`;
		svg.appendChild(glowRect2);

		// Додаємо SVG до іконки
		iconElement.style.position = 'relative';
		iconElement.appendChild(svg);

		// Запускаємо CSS анімацію через клас
		setTimeout(() => {
			svg.classList.add('active');
		}, 50);
	}

	// Видаляє анімовану обводку
	removeWinBorder() {
		// Видаляємо всі SVG обводки
		const svgs = this.drumSpinner.querySelectorAll('.win-border-svg');
		svgs.forEach(svg => {
			svg.classList.remove('active');
			setTimeout(() => svg.remove(), 300);
		});

		// Видаляємо класи з іконок
		const icons = this.drumSpinner.querySelectorAll('.drum__image');
		icons.forEach(icon => {
			icon.classList.remove('win-border-animation', 'dimmed');
		});
	}

	// Малює виграшну лінію через SVG
	drawWinLine(winLine) {
		const columns = this.drumSpinner.querySelectorAll('.drum__column');
		const iconHeight = this.config.getIconHeight();
		const spinnerRect = this.drumSpinner.getBoundingClientRect();

		// Створюємо SVG елемент
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('class', 'win-line-svg');
		svg.setAttribute('width', '100%');
		svg.setAttribute('height', '100%');
		svg.style.position = 'absolute';
		svg.style.top = '0';
		svg.style.left = '0';
		svg.style.pointerEvents = 'none';
		svg.style.zIndex = '50';
		svg.style.overflow = 'visible';

		// Збираємо точки для лінії
		const points = [];

		winLine.forEach((rowIndex, colIndex) => {
			if (rowIndex === null || colIndex >= columns.length) return;

			const column = columns[colIndex];
			const colRect = column.getBoundingClientRect();

			// Центр іконки
			const x = colRect.left - spinnerRect.left + colRect.width / 2;
			const y = (rowIndex + 0.5) * iconHeight;

			points.push({ x, y });
		});

		if (points.length < 2) return;

		// Створюємо polyline для лінії
		const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
		const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
		polyline.setAttribute('points', pointsStr);
		polyline.setAttribute('class', 'win-line');

		svg.appendChild(polyline);

		// Додаємо кола на кожній точці
		points.forEach((point) => {
			const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			circle.setAttribute('cx', point.x);
			circle.setAttribute('cy', point.y);
			circle.setAttribute('r', '8');
			circle.setAttribute('class', 'win-line-dot');
			svg.appendChild(circle);
		});

		this.drumSpinner.appendChild(svg);

		// Застосовуємо ефекти до іконок (затемнення та хитання)
		this.applyWinIconEffects(winLine);

		// Анімація появи
		setTimeout(() => {
			svg.classList.add('visible');
		}, 50);
	}

	// Застосовує ефекти до іконок: затемнення невиграшних та хитання виграшних
	applyWinIconEffects(winLine) {
		const columns = this.drumSpinner.querySelectorAll('.drum__column');
		const rows = this.config.rows;
		const iconHeight = this.config.getIconHeight();

		columns.forEach((column, colIndex) => {
			const strip = column.querySelector('.drum__strip');
			const icons = strip.querySelectorAll('.drum__image');
			const winRowIndex = winLine[colIndex];

			// Визначаємо видимі іконки на основі поточної позиції strip
			const transform = strip.style.transform;
			const match = transform.match(/translateY\(-?(\d+)px\)/);
			const currentOffset = match ? parseInt(match[1]) : 0;
			const visibleStartIndex = Math.round(currentOffset / iconHeight);

			for (let i = 0; i < rows; i++) {
				const iconIndex = visibleStartIndex + i;
				const icon = icons[iconIndex];

				if (!icon) continue;

				if (winRowIndex !== null && i === winRowIndex) {
					// Виграшна іконка - додаємо хитання
					icon.classList.add('winning');
				} else {
					// Невиграшна іконка - затемнюємо
					icon.classList.add('dimmed');
				}
			}
		});
	}

	// Видаляє ефекти з іконок
	removeWinIconEffects() {
		const icons = this.drumSpinner.querySelectorAll('.drum__image');
		icons.forEach((icon) => {
			icon.classList.remove('winning', 'dimmed');
		});
	}

	// Видаляє виграшну лінію
	removeWinLine() {
		const svg = this.drumSpinner.querySelector('.win-line-svg');
		if (svg) {
			svg.classList.remove('visible');
			setTimeout(() => svg.remove(), 300);
		}
		// Видаляємо ефекти з іконок
		this.removeWinIconEffects();
	}

	// Ефекти виграшу
	createWinEffects() {
		for (let i = 0; i < 12; i++) {
			setTimeout(() => {
				const flash = document.createElement('div');
				flash.className = 'win-flash';
				flash.style.left = `${Math.random() * 100}%`;
				flash.style.top = `${Math.random() * 100}%`;
				this.drumSpinner.appendChild(flash);

				setTimeout(() => flash.remove(), 600);
			}, i * 120);
		}
	}

	// Показ CTA popup
	showCTA() {
		this.buttonsWrap.classList.add('hidden');

		setTimeout(() => {
			this.popup.classList.add('show');

			// Запускаємо анімацію конфеті
			if (!this.confettiAnimation) {
				this.confettiAnimation = new ConfettiAnimation(this.popup);
			}
		}, 1500);
	}

	// Перемикання звуку
	toggleSound() {
		this.isSoundEnabled = !this.isSoundEnabled;

		if (this.isSoundEnabled) {
			this.soundButton.classList.remove('sound-off');
		} else {
			this.soundButton.classList.add('sound-off');
			this.stopAllSounds();
		}
	}

	// Відтворення звуку
	playSound(soundName) {
		if (!this.isSoundEnabled) return;

		const sound = this.sounds[soundName];
		if (sound) {
			sound.currentTime = 0;
			sound.play().catch(error => {
				console.log('Помилка відтворення звуку:', error);
			});
		}
	}

	// Зупинка всіх звуків
	stopAllSounds() {
		Object.values(this.sounds).forEach(sound => {
			sound.pause();
			sound.currentTime = 0;
		});
	}

	// Блокує кнопки спіну
	disableSpinButtons() {
		this.spinButton.classList.add('disabled');
		this.autoButton.classList.add('disabled');
	}

	// Розблоковує кнопки спіну
	enableSpinButtons() {
		// Не розблоковуємо якщо всі спіни використано
		const results = this.getResultsForCurrentBreakpoint();
		if (this.spinCount >= results.length) return;

		this.spinButton.classList.remove('disabled');
		this.autoButton.classList.remove('disabled');
	}

	// Отримує значення ставок з кнопок
	getBetValuesFromButtons() {
		const values = [];
		this.betButtons.forEach((button) => {
			const value = parseInt(button.textContent, 10);
			if (!isNaN(value)) {
				values.push(value);
			}
		});
		return values.length > 0 ? values : [1, 5, 10, 20, 30];
	}

	// Вибір ставки по індексу
	selectBet(index) {
		if (this.isSpinning) return;
		if (index < 0 || index >= this.betValues.length) return;

		this.currentBetIndex = index;
		this.bet = this.betValues[index];
		this.updateBetButtonsUI();
		this.updateUI();
	}

	// Збільшення ставки (перехід до наступної кнопки)
	increaseBet() {
		if (this.isSpinning) return;

		if (this.currentBetIndex < this.betValues.length - 1) {
			this.currentBetIndex++;
			this.bet = this.betValues[this.currentBetIndex];
			this.updateBetButtonsUI();
			this.updateUI();
		}
	}

	// Зменшення ставки (перехід до попередньої кнопки)
	decreaseBet() {
		if (this.isSpinning) return;

		if (this.currentBetIndex > 0) {
			this.currentBetIndex--;
			this.bet = this.betValues[this.currentBetIndex];
			this.updateBetButtonsUI();
			this.updateUI();
		}
	}

	// Оновлення UI кнопок ставок (клас active)
	updateBetButtonsUI() {
		this.betButtons.forEach((button, index) => {
			if (index === this.currentBetIndex) {
				button.classList.add('active');
			} else {
				button.classList.remove('active');
			}
		});
	}

	// Оновлення UI
	updateUI() {
		if (this.balanceElement) {
			this.balanceElement.textContent = this.balance.toFixed(2);
		}
		if (this.betElement) {
			this.betElement.textContent = this.bet;
		}
	}

	// Генерує випадкові лінії для поточного брейкпоінта
	generateRandomLines(count) {
		const lines = [];
		const rows = this.config.rows;
		const cols = this.config.cols;

		for (let i = 0; i < count; i++) {
			const line = [];
			for (let col = 0; col < cols; col++) {
				line.push(Math.floor(Math.random() * rows));
			}
			lines.push(line);
		}
		return lines;
	}

	// Перегенеровує патерни ліній для поточного брейкпоінта
	regenerateLinePatterns() {
		this.linePatterns = {
			100: this.generateRandomLines(20),
			80: this.generateRandomLines(16),
			60: this.generateRandomLines(12),
			40: this.generateRandomLines(8),
			20: this.generateRandomLines(4)
		};
	}

	// Обробка кліку на Lines
	handleLinesClick(item) {
		// Знімаємо active з усіх
		this.linesItems.forEach(li => li.classList.remove('active'));
		// Додаємо active на поточний
		item.classList.add('active');

		// Отримуємо значення
		const value = parseInt(item.querySelector('button').textContent);
		this.showLines(value);
	}

	// Показує лінії для вибраного значення
	showLines(value) {
		// Видаляємо попередні лінії
		this.removePaylines();

		// Скасовуємо попередній таймер зникнення
		if (this.paylinesTimeout) {
			clearTimeout(this.paylinesTimeout);
		}

		const lines = this.linePatterns[value];
		if (!lines) return;

		const iconHeight = this.config.getIconHeight();
		const spinnerRect = this.drumSpinner.getBoundingClientRect();
		const columns = this.drumSpinner.querySelectorAll('.drum__column');

		// Створюємо SVG контейнер
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('class', 'paylines-svg');
		svg.setAttribute('width', '100%');
		svg.setAttribute('height', '100%');
		svg.style.position = 'absolute';
		svg.style.top = '0';
		svg.style.left = '0';
		svg.style.pointerEvents = 'none';
		svg.style.zIndex = '40';
		svg.style.overflow = 'visible';

		// Малюємо кожну лінію
		lines.forEach((line) => {
			const points = [];

			line.forEach((rowIndex, colIndex) => {
				if (colIndex >= columns.length) return;

				const column = columns[colIndex];
				const colRect = column.getBoundingClientRect();

				const x = colRect.left - spinnerRect.left + colRect.width / 2;
				const y = (rowIndex + 0.5) * iconHeight;

				points.push({ x, y });
			});

			if (points.length < 2) return;

			const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

			// Створюємо червону обводку (нижній шар)
			const strokeLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
			strokeLine.setAttribute('points', pointsStr);
			strokeLine.setAttribute('class', 'payline-stroke');
			svg.appendChild(strokeLine);

			// Створюємо золоту лінію (верхній шар)
			const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
			polyline.setAttribute('points', pointsStr);
			polyline.setAttribute('class', 'payline');
			svg.appendChild(polyline);
		});

		this.drumSpinner.appendChild(svg);

		// Плавна поява
		setTimeout(() => {
			svg.classList.add('visible');
		}, 50);

		// Автоматичне зникнення через 2 секунди
		this.paylinesTimeout = setTimeout(() => {
			this.hidePaylines();
		}, 2000);
	}

	// Плавно приховує лінії
	hidePaylines() {
		const svg = this.drumSpinner.querySelector('.paylines-svg');
		if (svg) {
			svg.classList.remove('visible');
			setTimeout(() => svg.remove(), 300);
		}
	}

	// Видаляє лінії paylines
	removePaylines() {
		const svg = this.drumSpinner.querySelector('.paylines-svg');
		if (svg) {
			svg.remove();
		}
	}
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
	new SlotMachine();
});
