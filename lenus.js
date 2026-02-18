function main() {
	// GSAP register
	gsap.registerPlugin(ScrollTrigger);

	// GSAP defaults
	gsap.defaults({
		ease: "power2.out",
		duration: 0.5,
	});

	// Global ScrollTrigger defaults to mitigate pin jumps across the site
	ScrollTrigger.defaults({
		anticipatePin: 1, // pre-offsets before the pin engages -> no “snap” at start
	});

	// Global ScrollTrigger defaults to mitigate pin jumps across the site
	ScrollTrigger.defaults({
		anticipatePin: 1, // pre-offsets before the pin engages -> no “snap” at start
	});
	ScrollTrigger.config({
		ignoreMobileResize: true,
		autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
	});
	ScrollTrigger.addEventListener("refreshInit", function () {
		// this code will run BEFORE the refresh
		// console.log("ScrollTrigger refreshInit");
	});

	ScrollTrigger.addEventListener("refresh", function () {
		// this code will run AFTER all ScrollTriggers refreshed.
		// console.log("ScrollTrigger refresh");
	});

	// GSDevTools setup for development
	let gsDevToolsEnabled = false;
	function loadGSDevTools() {
		if (gsDevToolsEnabled || window.GSDevTools) return Promise.resolve();

		return new Promise((resolve, reject) => {
			const script = document.createElement("script");
			script.src = "https://cdn.jsdelivr.net/npm/gsap@3/dist/GSDevTools.min.js";
			script.onload = () => {
				if (window.GSDevTools) {
					gsap.registerPlugin(GSDevTools);
					gsDevToolsEnabled = true;
					console.log("GSDevTools loaded and ready");
					resolve();
				} else {
					reject(new Error("GSDevTools failed to load"));
				}
			};
			script.onerror = () => reject(new Error("Failed to load GSDevTools script"));
			document.head.appendChild(script);
		});
	}

	// Lenus variables
	lenus.search = { stateClass: "search-active" };

	// set nav breakpoint
	lenus.navBreakpoint = 991; // px
	// if DOM contains element with class .css-nav-1125, set navBreakpoint to 1125
	if (document.querySelector(".css-nav-1125")) {
		lenus.navBreakpoint = 1125;
	}

	// all the card classes we use
	lenus.cardClasses = [
		"c-card",
		"c-wide-card",
		"c-mini-card",
		"c-blog-card",
		"c-feat-blog-card",
		"c-large-card",
		"c-testim-card",
		"c-location-card",
	];

	// Helper function to create the selector
	lenus.helperFunctions.getCardSelector = function () {
		return "." + lenus.cardClasses.join(", .");
	};

	// Helper function to get card elements from a container
	// Helper function to get card elements from a container - returns array
	lenus.helperFunctions.getCards = function (container = document) {
		if (!container) return [];
		return gsap.utils.toArray(lenus.helperFunctions.getCardSelector(), container);
	};

	// Helper to check if an element is a card
	lenus.helperFunctions.isCard = function (element) {
		return lenus.cardClasses.some((className) => element.classList.contains(className));
	};

	// Global timeline storage for debugging
	window._debugTimelines = window._debugTimelines || {};

	// Header theme scroll logic
	function headerThemeScrollTrigger() {
		const DARK_THEMES = ["dark", "ivy", "wolfram", "olive"];
		const LIGHT_THEMES = ["base", "chalk", "slate", "light-grey"];
		const header = document.querySelector(".header");
		if (!header) return;

		const attributeName = "data-wf--section-group--theme";
		const headerTheme = header.getAttribute("data-wf--header--theme") || "light"; // get initial theme from header
		let state = headerTheme === "dark" ? "dark" : "light"; // track current state

		// console.log(`[headerThemeScrollTrigger] Initial header theme state: ${state}`);

		const sectionGroups = gsap.utils.toArray(`.section-group`);

		const getNavHeight = () =>
			parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav--height")) || 0;

		function getTheme(variant) {
			if (DARK_THEMES.includes(variant)) return "dark";
			if (LIGHT_THEMES.includes(variant)) return "light";
			return "light";
		}

		// Single timeline for header theme animation
		let headerThemeTl = null;
		function setupHeaderThemeTimeline() {
			const targets = [
				header,
				document.querySelector(".nav-mega_bg"),
				document.querySelector(".nav-mega_link"),
			].filter(Boolean);

			const darkThemer = document.querySelector(".nav-dark-themer");
			const lightThemer = document.querySelector(".nav-light-themer");

			// helper: commit theme state + reflect on header attribute
			function commitTheme(theme) {
				state = theme;
				header.setAttribute("data-wf--header--theme", theme);
				// console.log(`[headerThemeScrollTrigger] Committed header theme: ${theme}`);
			}

			if (headerThemeTl) headerThemeTl.kill();
			headerThemeTl = gsap.timeline({
				paused: true,
				onComplete: () => commitTheme("dark"),
				onReverseComplete: () => commitTheme("light"),
			});

			if (!darkThemer || !lightThemer) {
				// console.warn(
				// 	"[headerThemeScrollTrigger] Header theme elements not found. Ensure .nav-dark-themer and .nav-light-themer exist."
				// );
				return;
			}

			// Define all CSS variables in one place
			const cssVars = [
				"--_theme---nav--body",
				"--_theme---nav--accent",
				"--_theme---nav--accent-careers",
				"--_theme---nav--logo-text",
				"--_theme---nav--link-inactive",
				"--_theme---nav--link-active",
				"--_theme---nav--bg",
				"--_theme---nav--col-header",
				"--_theme---nav--search-border",
				"--_theme---nav--bg-mbl",
				"--_theme---nav--link-hover",
			];

			// Helper function to extract values from computed styles
			const getThemeValues = (element) => {
				const styles = getComputedStyle(element);
				return cssVars.reduce((acc, varName) => {
					acc[varName] = styles.getPropertyValue(varName).trim();
					return acc;
				}, {});
			};

			const darkVars = getThemeValues(darkThemer);
			const lightVars = getThemeValues(lightThemer);

			// Animate to dark theme values
			headerThemeTl.fromTo(targets, { ...lightVars }, { ...darkVars, duration: 0.3 }, 0);

			headerThemeTl.progress(state === "dark" ? 1 : 0);
			commitTheme(state);
		}

		// Only create ScrollTriggers for dark section groups
		// Store header theme ScrollTriggers for clean management
		let headerThemeScrollTriggers = [];

		function killHeaderThemeScrollTriggers() {
			headerThemeScrollTriggers.forEach((t) => t.kill());
			headerThemeScrollTriggers = [];
		}

		function createHeaderThemeScrollTriggers() {
			killHeaderThemeScrollTriggers();
			// console.log("Creating header theme ScrollTriggers...");
			sectionGroups.forEach((group, idx) => {
				let variant = group.getAttribute(attributeName);
				// if no variant, assume light
				if (!variant) {
					variant = "light";
				}
				const theme = getTheme(variant);
				// console.log(`Section idx=${idx}, variant=${variant}, theme=${theme}`);

				if (DARK_THEMES.includes(variant)) {
					// console.log(`  -> Creating ScrollTrigger for dark section at idx=${idx}`);
					const trigger = ScrollTrigger.create({
						trigger: group,
						start: () => `top ${getNavHeight()}px`,
						end: () => `bottom top`,
						onEnter: () => {
							// console.log(
							// 	`[headerTheme] onEnter: idx=${idx}, variant=${variant}, theme=${theme} (DARK)`
							// );
							headerThemeTl.play();
						},
						onEnterBack: () => {
							// console.log(
							// 	`[headerTheme] onEnterBack: idx=${idx}, variant=${variant}, theme=${theme} (LIGHT)`
							// );
							headerThemeTl.play();
						},

						// handle on leave and leave back
						onLeave: () => {
							// if next section is dark, do nothing, else reverse
							const nextGroup = sectionGroups[idx + 1];
							if (nextGroup) {
								const nextVariant = nextGroup.getAttribute(attributeName);
								if (DARK_THEMES.includes(nextVariant)) {
									// Do nothing
								} else {
									// console.log(
									// 	`[headerTheme] onLeave: idx=${idx}, variant=${variant}, theme=${theme} (LIGHT)`
									// );
									headerThemeTl.reverse();
								}
							}
						},
						onLeaveBack: () => {
							// if previous section is dark, do nothing, else play
							const prevGroup = sectionGroups[idx - 1];
							if (prevGroup) {
								const prevVariant = prevGroup.getAttribute(attributeName);
								if (DARK_THEMES.includes(prevVariant)) {
									// Do nothing
								} else {
									// console.log(
									// 	`[headerTheme] onLeaveBack: idx=${idx}, variant=${variant}, theme=${theme} (LIGHT)`
									// );
									headerThemeTl.reverse();
								}
							}
						},
					});
					headerThemeScrollTriggers.push(trigger);
				}
			});
		}

		// Initial setup: timeline, triggers, and theme
		setupHeaderThemeTimeline();
		createHeaderThemeScrollTriggers();
		function setInitialHeaderTheme() {
			const navHeight = getNavHeight();
			let found = null;
			sectionGroups.forEach((group) => {
				const rect = group.getBoundingClientRect();
				if (rect.top <= navHeight && rect.bottom > navHeight) {
					found = group;
				}
			});

			const targetGroup = found || sectionGroups[0] || null;

			const rawVariant = targetGroup ? targetGroup.getAttribute(attributeName) || "" : "light";
			const variant = rawVariant || "light";

			// console.log("[headerTheme] targetGroup:", targetGroup);
			// console.log("[headerTheme] variant resolved:", variant);

			// Apply timeline direction only if state differs
			if (DARK_THEMES.includes(variant)) {
				if (state !== "dark") headerThemeTl.play(0);
			} else {
				if (state !== "light") headerThemeTl.reverse(0);
			}
		}
		setInitialHeaderTheme();

		ResizeManager.add(({ widthChanged, heightChanged, width, height }) => {
			// Only rebuild if width changed or large layout change
			if (!widthChanged) return;

			// console.log(`[headerThemeScrollTrigger] resize: ${width}x${height}`);

			setupHeaderThemeTimeline();
			createHeaderThemeScrollTriggers();
			ScrollTrigger.refresh();
			setInitialHeaderTheme();
		});
	}

	function cardHover() {
		const CARDS_SELECTOR = ".c-card:not([data-wf--card--variant='content-inside'])";
		let initialized = false;

		function setup() {
			const cards = gsap.utils.toArray(CARDS_SELECTOR);
			if (cards.length === 0) return;
			initialized = true;

			cards.forEach((card) => {
				card.setAttribute("data-card-hover", "enabled");
				const tl = initCard(card);
				if (!tl) return;
				card._tl = tl;

				const onEnter = () => {
					if (card._tl) card._tl.play();
				};
				const onLeave = () => {
					if (card._tl) card._tl.reverse();
				};

				card._hoverEnter = onEnter;
				card._hoverLeave = onLeave;

				card.addEventListener("mouseenter", onEnter);
				card.addEventListener("mouseleave", onLeave);
			});
		}

		function cleanup() {
			const cards = gsap.utils.toArray(CARDS_SELECTOR);
			if (cards.length === 0) return;

			cards.forEach((card) => {
				// remove event listeners
				if (card._hoverEnter) {
					card.removeEventListener("mouseenter", card._hoverEnter);
					delete card._hoverEnter;
				}
				if (card._hoverLeave) {
					card.removeEventListener("mouseleave", card._hoverLeave);
					delete card._hoverLeave;
				}

				// timelines: reset to start to avoid leaving mid-FLIP transforms, then kill
				if (card._tl) {
					try {
						card._tl.progress(0).kill();
					} catch (e) {}
					card._tl = null;
				}

				// hard-kill any FLIPs associated with this card (clears inline styles)
				try {
					Flip.killFlipsOf(card, true);
				} catch (e) {}

				// unlock any locked cover pixels
				if (card._mediaCoverEls) {
					try {
						unlockCoverPixels(card._mediaCoverEls);
					} catch (e) {}
					delete card._mediaCoverEls;
				}

				const media = card.querySelector(".card_media");
				const content = card.querySelector(".card_content");
				const extraContent = card.querySelector(".card_body");

				gsap.set(card, { clearProps: "height" });
				gsap.set(media, { clearProps: "height,minHeight,overflow" });
				gsap.set(content, { clearProps: "transform" }); // safeguard
				gsap.set(extraContent, { clearProps: "height,opacity,autoAlpha" });

				card.setAttribute("data-card-hover", "disabled");
			});

			initialized = false;
		}

		// Only initialize on desktop (and devices that support hover)
		if (
			!window.matchMedia("(max-width: 768px)").matches &&
			!window.matchMedia("(hover: none)").matches
		) {
			setup();
		}

		// Rebuild/teardown on relevant resizes (width changes)
		ResizeManager.add(({ widthChanged }) => {
			if (!widthChanged) return;

			const isDesktop =
				!window.matchMedia("(max-width: 768px)").matches &&
				!window.matchMedia("(hover: none)").matches;

			// If we were initialized but now left desktop, teardown
			if (initialized && !isDesktop) {
				cleanup();
				return;
			}

			// If we were not initialized but now entered desktop, build
			if (!initialized && isDesktop) {
				// teardown just in case, then setup after a short delay to let layout settle
				cleanup();
				setTimeout(() => {
					setup();
					ScrollTrigger.refresh();
				}, 60);
				return;
			}

			// If still desktop and width changed, fully rebuild to pick up new measurements
			if (initialized && isDesktop) {
				cleanup();
				setTimeout(() => {
					setup();
					ScrollTrigger.refresh();
				}, 60);
			}
		});

		function initCard(card) {
			const media = card.querySelector(".card_media");
			const content = card.querySelector(".card_content");
			// const title = card.querySelector("h3");
			const extraContent = card.querySelector(".card_body");
			const mediaCoverEls = gsap.utils.toArray(".u-cover", media);
			if (!media || !content || !extraContent) return;

			// store for cleanup
			card._mediaCoverEls = mediaCoverEls;

			// get current state of card
			// then expand extraContent to auto height, and reduce height of media accordingly so the overall card height stays the same
			// then use a GSAP timeline with Flip to animate between the two states

			const originalCardHeight = card.offsetHeight;
			const originalMediaHeight = media.offsetHeight;

			lockCoverPixels(media, mediaCoverEls);

			const state = Flip.getState([card, media, content, extraContent, mediaCoverEls], {
				// props: "object-position",
			});
			// expand extraContent to auto height
			gsap.set(extraContent, { height: "auto", autoAlpha: 0 });
			const extraContentHeight = extraContent.offsetHeight;
			const expandedHeight = card.offsetHeight;

			gsap.set(media, {
				height: originalMediaHeight - extraContentHeight,
				minHeight: 0,
			});
			gsap.set(card, { height: originalCardHeight });
			// gsap.set(mediaCoverEls, { objectPosition: "50% 0%" });

			const tl = gsap.timeline({ paused: true });
			tl.add(
				Flip.from(state, {
					targets: [card, media, content, extraContent, mediaCoverEls],
					absolute: mediaCoverEls,
					duration: 0.35,
					ease: "ease.inOut",
					onReverseComplete: () => {
						unlockCoverPixels(mediaCoverEls);
					},
				}),
			);
			tl.to(extraContent, { autoAlpha: 1, duration: 0.3, ease: "power2.inOut" }, "0.1");
			return tl;
		}

		function lockCoverPixels(media, mediaCoverEls) {
			const mediaRect = media.getBoundingClientRect();

			mediaCoverEls.forEach((img) => {
				const r = img.getBoundingClientRect();
				const left = r.left - mediaRect.left;
				const top = r.top - mediaRect.top;

				// Lock the rendered box in pixels so object-fit won’t re-calc on height changes
				gsap.set(img, {
					position: "absolute",
					left,
					top,
					width: r.width,
					height: r.height,
					objectFit: "cover",
					willChange: "transform",
				});
			});

			// Ensure the viewport crops the image instead of the image resizing
			gsap.set(media, { overflow: "hidden" });
		}

		function unlockCoverPixels(mediaCoverEls) {
			mediaCoverEls.forEach((img) => {
				gsap.set(img, { clearProps: "position,left,top,width,height,willChange" });
			});
		}
	}

	function logoSwap() {
		document.querySelectorAll(".c-logo-swap").forEach((component) => {
			const invertFilter =
				getComputedStyle(component).getPropertyValue("--_theme---invert") === "1"
					? "invert(1) "
					: "";

			const logoList = component.querySelector(".logo-swap_list");
			const buttonWrap = component.querySelector(".logo-swap_btn-wrap");
			const button = component.querySelector("a.button:not([href='#'])"); // valid button link
			let logoSlots = Array.from(logoList.querySelectorAll(".logo-swap_slot"));
			const logoEls = Array.from(component.querySelectorAll(".logo-swap_logo"));
			let logoCount = getLogoCount(component);
			let timerId = null;
			let tl = null;
			let paused = false;
			let inView = true;
			const timeBetweenCycles = 4000;

			// --- logo pool setup ---
			let logosArray = logoEls.map((el) => ({ el, visibleNow: false }));

			// --- resize handler (via ResizeManager) ---
			const handleResize = ({ widthChanged }) => {
				if (!widthChanged) return;
				stopCycle();
				logoCount = getLogoCount(component);
				createLogoSlots();
				clearAllLogos();
				updateLogos();
				animateLogos();
			};

			ResizeManager.add(handleResize);

			// --- IntersectionObserver: pause when offscreen ---
			const observer = new IntersectionObserver(
				([entry]) => {
					inView = entry.isIntersecting;
					if (inView) {
						stopCycle();
					} else {
						normalizeSlots();
					}
					handlePauseState();
				},
				{ threshold: 0.1 },
			);
			observer.observe(component);

			function hoverHandler() {
				paused = true;
				// only do animation if buttonWrap is present
				if (buttonWrap && button) {
					gsap.to(logoList, { filter: "blur(6px)", autoAlpha: 0.5, duration: 0.3 });
					// if (buttonWrap) gsap.to(buttonWrap, { autoAlpha: 1, duration: 0.3 });
				}
				handlePauseState();
			}
			function hoverOutHandler() {
				paused = false;
				if (buttonWrap && button) {
					gsap.to(logoList, { filter: "blur(0px)", autoAlpha: 1, duration: 0.3 });
					// if (buttonWrap) gsap.to(buttonWrap, { autoAlpha: 0, duration: 0.3 });
				}
				handlePauseState();
			}

			let hoverCleanup = null; // will store cleanup fn

			function addHoverListeners() {
				component.addEventListener("mouseenter", hoverHandler);
				component.addEventListener("mouseleave", hoverOutHandler);
				hoverCleanup = () => {
					component.removeEventListener("mouseenter", hoverHandler);
					component.removeEventListener("mouseleave", hoverOutHandler);
					hoverCleanup = null;
				};
			}

			function removeHoverListeners() {
				if (hoverCleanup) hoverCleanup();
			}

			// --- integrate with ResizeManager media query helpers ---
			const cleanupDesktopListener = ResizeManager.onDesktop(({ matches }) => {
				if (matches) {
					// console.log("logoSwap: desktop mode - adding hover listeners");
					addHoverListeners();
				} else {
					// console.log("logoSwap: mobile mode - removing hover listeners");
					removeHoverListeners();
				}
			});

			// --- helper functions ---
			function getLogoCount(component) {
				const logoCount = parseInt(
					getComputedStyle(component).getPropertyValue("--logo-swap--count"),
					10,
				);
				return isNaN(logoCount) ? 5 : logoCount;
			}

			function shuffleArray(array) {
				let m = array.length,
					t,
					i;
				while (m) {
					i = Math.floor(Math.random() * m--);
					t = array[m];
					array[m] = array[i];
					array[i] = t;
				}
				return array;
			}

			function getNewLogos() {
				logosArray = shuffleArray(logosArray);
				const newLogos = logosArray.filter((l) => !l.visibleNow).slice(0, logoCount);
				logosArray.forEach((l) => (l.visibleNow = false));
				newLogos.forEach((l) => (l.visibleNow = true));

				if (newLogos.length < logoCount) {
					const extras = logosArray
						.filter((l) => !l.visibleNow)
						.slice(0, logoCount - newLogos.length);
					extras.forEach((l) => (l.visibleNow = true));
					newLogos.push(...extras);
				}

				return newLogos.map((l) => l.el);
			}

			function updateLogos() {
				const newLogos = getNewLogos();
				if (!newLogos.length) return;

				logoSlots.forEach((slot, i) => {
					const current = slot.querySelector(".logo-swap_logo");
					if (current) current.setAttribute("data-logo-swap", "outgoing");
					const next = newLogos[i];
					if (next) {
						const clone = next.cloneNode(true);
						clone.setAttribute("data-logo-swap", "incoming");
						gsap.set(clone, {
							autoAlpha: 0,
							filter: `${invertFilter}blur(5px) grayscale()`,
							scale: 0.8,
							transformOrigin: "50% 50%",
						});
						slot.appendChild(clone);
					}
				});
			}

			function createLogoSlots() {
				logoList.innerHTML = "";
				for (let i = 0; i < logoCount; i++) {
					const slot = document.createElement("div");
					slot.classList.add("logo-swap_slot");
					logoList.appendChild(slot);
				}
				logoSlots = Array.from(logoList.querySelectorAll(".logo-swap_slot"));
			}

			function cleanUp() {
				logoSlots.forEach((slot) => {
					slot.querySelectorAll("[data-logo-swap='outgoing']").forEach((el) => el.remove());
				});
			}

			function clearAllLogos() {
				logoSlots.forEach((slot) => {
					slot.querySelectorAll(".logo-swap_logo").forEach((el) => el.remove());
				});
			}

			function normalizeSlots() {
				logoSlots.forEach((slot) => {
					const logos = Array.from(slot.querySelectorAll(".logo-swap_logo"));
					if (logos.length === 0) return;

					// Keep last one only
					const keep = logos[logos.length - 1];
					logos.slice(0, -1).forEach((el) => el.remove());

					keep.removeAttribute("data-logo-swap");
					gsap.set(keep, {
						autoAlpha: 1,
						scale: 1,
						filter: `${invertFilter}blur(0px) grayscale()`,
					});
				});
			}

			function clearTimeline() {
				if (tl) {
					tl.kill();
					tl = null;
				}
			}

			function stopCycle() {
				if (timerId) {
					clearTimeout(timerId);
					timerId = null;
				}
				if (tl) {
					tl.kill();
					tl = null;
				}

				normalizeSlots();
			}

			function handlePauseState() {
				if (paused || !inView) {
					stopCycle();
					return;
				}

				// Resume only if nothing is already active
				if (!timerId && !tl) {
					scheduleNext();
				}
			}

			function scheduleNext() {
				// Always clear any existing timer before setting a new one
				if (timerId) {
					clearTimeout(timerId);
					timerId = null;
				}

				timerId = setTimeout(() => {
					// Bail if paused/offscreen
					if (paused || !inView) {
						stopCycle();
						return;
					}

					// Start new cycle
					updateLogos();
					animateLogos();
				}, timeBetweenCycles);
			}

			function animateLogos() {
				tl = gsap.timeline({
					onComplete: () => {
						cleanUp();
						scheduleNext();
					},
				});
				tl.to("[data-logo-swap='outgoing']", {
					autoAlpha: 0,
					scale: 0.8,
					filter: `${invertFilter}blur(5px) grayscale()`,
					duration: 0.5,
					stagger: 0.05,
					ease: "power2.inOut",
				}).to(
					"[data-logo-swap='incoming']",
					{
						autoAlpha: 1,
						scale: 1,
						filter: `${invertFilter}blur(0px) grayscale()`,
						duration: 0.5,
						stagger: 0.05,
						ease: "power2.inOut",
					},
					"<+0.1",
				);
			}

			// --- Pause when tab inactive ---
			document.addEventListener("visibilitychange", () => {
				if (document.hidden) {
					paused = true;
					stopCycle();
				} else {
					paused = false;
					normalizeSlots();
					handlePauseState();
				}
			});

			// --- Initial setup ---
			createLogoSlots();
			clearAllLogos();
			updateLogos();

			// Force initial visible logos
			gsap.set(".logo-swap_logo", {
				autoAlpha: 1,
				scale: 1,
				filter: `${invertFilter}blur(0px) grayscale()`,
			});

			// Only start animation if visible
			if (inView && !paused) {
				animateLogos(); // start immediately
			} else {
				// Wait until back in view or unpaused
				handlePauseState();
			}

			// --- Cleanup when component is removed ---
			component._cleanupLogoSwap = () => {
				observer.disconnect();
				removeHoverListeners();
				cleanupDesktopListener?.();
				ResizeManager.remove(handleResize);
				stopCycle();
			};
		});
	}

	function parallax() {
		const sections = document.querySelectorAll(".anim-parallax-trigger");
		if (!sections.length) return;

		sections.forEach((section) => {
			const imgs = gsap.utils.toArray(section.querySelectorAll(".collage_img"));
			if (!imgs.length) return;

			const mm = gsap.matchMedia();

			// -----------------------------------------------------
			// MOBILE
			// -----------------------------------------------------
			mm.add("(max-width: 768px)", () => {
				imgs.forEach((img, i) => {
					gsap.set(img, { clearProps: "all" });
					if (i > 0) gsap.set(img, { autoAlpha: 0 });
				});
			});

			// -----------------------------------------------------
			// DESKTOP
			// -----------------------------------------------------
			mm.add("(min-width: 769px)", () => {
				const revealTl = gsap.timeline({
					scrollTrigger: {
						trigger: section,
						start: "top 60%",
						end: "top 40%",
						toggleActions: "play none none reverse",
					},
				});

				// movement
				revealTl.from(
					imgs,
					{
						y: 40,
						rotate: () => gsap.utils.random(-4, 4),
						scale: 0.95,
						duration: 5,
						ease: "power3.out",
						stagger: 0.12,
					},
					0,
				);

				// opacity
				revealTl.from(
					imgs,
					{
						autoAlpha: 0,
						duration: 2,
						ease: "power3.out",
						stagger: 0.12,
					},
					0,
				);

				// cleanup on unmatch
				return () => {
					revealTl.kill();
					ScrollTrigger.getAll().forEach((st) => {
						if (st.trigger === section) st.kill();
					});
				};
			});
		});
	}

	function loadVideos() {
		// Grab all videos on the page
		const videos = gsap.utils.toArray(".media video");
		const mediaQuery = window.matchMedia("(max-width: 768px)");
		const videoLoadPadding = "100%"; // = one full viewport

		const defaultOffsetPx = 20; // default offset for start trigger
		const respondImmediately = true; // strategy for rapid scroll direction changes

		const isMobile = () => mediaQuery.matches;

		// --- source selection / alpha variants -------------------------------------

		function updateSources(video, mode) {
			if (video.dataset.videoLoaded) return;

			const ua = navigator.userAgent || "";
			const isIOS = /iP(hone|ad|od)/i.test(ua);
			const isSafariDesktop = /Safari/i.test(ua) && !/(Chrome|Chromium|CriOS|Edg|OPR)/i.test(ua);
			const isAppleEngine = isIOS || isSafariDesktop;

			const sourceEls = Array.from(video.querySelectorAll("source"));

			// Build meta for each source
			const meta = sourceEls
				.map((srcEl) => {
					const { srcMobile, srcDesktop, typeMobile, typeDesktop, codecsMobile, codecsDesktop } =
						srcEl.dataset;

					const url = mode === "mobile" ? srcMobile || srcDesktop : srcDesktop;
					const mime = mode === "mobile" ? typeMobile || typeDesktop : typeDesktop;
					const codecs = mode === "mobile" ? codecsMobile || codecsDesktop : codecsDesktop;

					if (!url) return null;

					const lowerMime = (mime || "").toLowerCase();

					return {
						srcEl,
						url,
						mime,
						codecs,
						isWebm: lowerMime.includes("webm"),
						isMp4: lowerMime.includes("mp4"),
					};
				})
				.filter(Boolean);

			const hasWebm = meta.some((m) => m.isWebm);
			const hasMp4 = meta.some((m) => m.isMp4);
			const dual = hasWebm && hasMp4;

			console.log(
				`[loadVideos:updateSources]` +
					`\n  → Engine: ${isAppleEngine ? "Apple" : "Non-Apple"}` +
					`\n  → Mode: ${mode}` +
					`\n  → hasWebm: ${hasWebm}` +
					`\n  → hasMp4: ${hasMp4}` +
					`\n  → dualVariants: ${dual}`,
			);

			let chosen = null;

			if (dual) {
				// Alpha pair case: one webm + one mp4
				if (isAppleEngine) {
					// Safari / iOS: use MP4 (HEVC export from Rotato)
					chosen = meta.find((m) => m.isMp4 && m.url);
				} else {
					// Chrome/Firefox/Edge: use WebM (VP9 g=1)
					chosen = meta.find((m) => m.isWebm && m.url);
				}
			} else {
				// Single variant – just pick first with URL (normal videos)
				chosen = meta.find((m) => m.url);
			}

			// When dual, blank out non-chosen srcs so browser can't fall back
			if (dual && chosen) {
				meta.forEach((m) => {
					if (m !== chosen) {
						m.srcEl.removeAttribute("src");
						m.srcEl.removeAttribute("type");
					}
				});
			}

			if (chosen) {
				chosen.srcEl.src = chosen.url;
				let typeAttr = chosen.mime || "";
				if (chosen.codecs) typeAttr += `; codecs="${chosen.codecs}"`;
				if (typeAttr) chosen.srcEl.setAttribute("type", typeAttr);

				console.log(
					`[loadVideos:updateSources] ✔ Using source:` +
						`\n    URL: ${chosen.url}` +
						`\n    MIME: ${chosen.mime}` +
						`\n    Codecs: ${chosen.codecs || "(none)"}` +
						`\n    Variant: ${chosen.isWebm ? "WebM" : chosen.isMp4 ? "MP4 (Safari/iOS)" : "Other"}`,
				);

				video._variantChoice = chosen.isWebm ? "webm" : chosen.isMp4 ? "mp4" : "other";
			} else {
				console.warn("[loadVideos:updateSources] ⚠ No valid source found", video);
			}

			video.load();
			video.dataset.videoLoaded = "true";
		}

		// Expose a safe hook for components (e.g. tabs) to force lazy source assignment.
		// Keeping this inside loadVideos() lets it reuse the same UA/mode selection logic.
		lenus.helperFunctions = lenus.helperFunctions || {};
		if (!lenus.helperFunctions.ensureVideoSources) {
			lenus.helperFunctions.ensureVideoSources = (video, mode) => {
				try {
					updateSources(video, mode || (isMobile() ? "mobile" : "desktop"));
				} catch (err) {
					console.warn("[ensureVideoSources] failed", err);
				}
			};
		}

		// --- small helpers ---------------------------------------------------------

		function isInViewport(video) {
			const rect = video.getBoundingClientRect();
			return rect.bottom > 0 && rect.top < window.innerHeight;
		}

		function isTruthyAttr(value) {
			if (value == null) return false;
			const v = String(value).toLowerCase().trim();
			return v === "" || v === "true" || v === "1" || v === "yes";
		}

		function canReplayOnEnter(video) {
			return isTruthyAttr(video.getAttribute("data-video-replay-on-enter"));
		}

		function hasAutoplayEnded(video) {
			return video.ended || video.dataset.lenusAutoplayEnded === "true";
		}

		function markAutoplayEnded(video) {
			video.dataset.lenusAutoplayEnded = "true";
		}

		function clearAutoplayEnded(video) {
			video.removeAttribute("data-lenus-autoplay-ended");
		}

		function playOnEnter(video) {
			// If a non-looping video has finished, don't auto-replay it on re-enter
			// unless explicitly opted in via `data-video-replay-on-enter`.
			if (hasAutoplayEnded(video) && !canReplayOnEnter(video)) return;

			if (hasAutoplayEnded(video) && canReplayOnEnter(video)) {
				// Attempt to rewind so replay-on-enter behaves consistently.
				try {
					video.currentTime = 0;
				} catch {
					// ignore seek failures
				}
				clearAutoplayEnded(video);
			}

			lenus.helperFunctions.playVideo
				? lenus.helperFunctions.playVideo(video)
				: video.play().catch(() => {});
		}

		// Track ended state so scroll-based autoplay can respect it.
		videos.forEach((video) => {
			if (!video || video._lenusEndedHandlerAttached) return;
			video._lenusEndedHandlerAttached = true;
			video.addEventListener(
				"ended",
				() => {
					markAutoplayEnded(video);
				},
				{ passive: true },
			);
		});

		// Immediately load sources for videos already in viewport
		videos.forEach((video) => {
			if (isInViewport(video)) {
				updateSources(video, isMobile() ? "mobile" : "desktop");
			}
		});

		// Preload triggers (lazy source assignment)
		let preloadTriggers = videos.map((video) =>
			ScrollTrigger.create({
				trigger: video,
				start: `top bottom+=${videoLoadPadding}`,
				end: `bottom top-=${videoLoadPadding}`,
				onEnter(self) {
					updateSources(video, isMobile() ? "mobile" : "desktop");
					self.kill();
				},
				onEnterBack(self) {
					updateSources(video, isMobile() ? "mobile" : "desktop");
					self.kill();
				},
			}),
		);

		// Basic play / pause triggers (viewport region)
		videos.forEach((video) => {
			ScrollTrigger.create({
				trigger: video,
				start: "top 90%",
				end: "bottom 10%",
				onEnter: () => playOnEnter(video),
				onLeave: () => {
					if (!video.paused) video.pause();
				},
				onEnterBack: () => playOnEnter(video),
				onLeaveBack: () => {
					if (!video.paused) video.pause();
				},
			});
		});

		// Mode change (desktop ⇆ mobile)
		mediaQuery.addEventListener("change", () => {
			const newMode = isMobile() ? "mobile" : "desktop";

			videos.forEach((video) => {
				delete video.dataset.videoLoaded;
			});

			preloadTriggers.forEach((t) => t.kill());
			preloadTriggers = videos.map((video) =>
				ScrollTrigger.create({
					trigger: video,
					start: `top bottom+=${videoLoadPadding}`,
					end: `bottom top-=${videoLoadPadding}`,
					onEnter(self) {
						updateSources(video, newMode);
						self.kill();
					},
					onEnterBack(self) {
						updateSources(video, newMode);
						self.kill();
					},
				}),
			);

			ScrollTrigger.refresh();
		});
	}

	const VIDEO_PLAY_SELECTOR = "button[name='play'], [data-video-play]";
	const VIDEO_CARD_CONFIGS = [
		{
			match: ".c-testim-card",
			videoSelector: "video",
			imgSelector: ".testim-card_bg img",
		},
		{
			match: ".c-wide-card",
			videoSelector: "video",
			imgSelector: ".wide-card_bg img",
		},
	];

	function getVideoConfig(card) {
		return VIDEO_CARD_CONFIGS.find((config) => card.matches(config.match));
	}

	function registerVideoCard(card, overrides = {}) {
		// console.log("Registering video card:", card);
		const config = getVideoConfig(card);
		if (!config) return null;
		const controller = lenus.helperFunctions.videoController;
		if (!controller || controller.isRegistered(card)) return null;
		const selectors = {
			video: config.videoSelector || "video",
			img: config.imgSelector || "img",
			play: overrides.playSelector || config.playSelector || VIDEO_PLAY_SELECTOR,
		};

		return controller.register({
			card,
			selectors,
			pauseOthers: overrides.pauseOthers ?? true,
			onPlay: overrides.onPlay,
			onPause: overrides.onPause,
			startVisible: overrides.startVisible ?? false,
		});
	}

	function standaloneVideoCards() {
		let standaloneCards = [
			...document.querySelectorAll(".c-testim-card"),
			...document.querySelectorAll(".c-wide-card"),
		];

		// filter out cards that are inside a carousel - these are handled by the carousel setup
		standaloneCards = standaloneCards.filter((card) => !card.closest(".c-carousel"));

		// console.log("Found standalone video cards:", standaloneCards.length);

		standaloneCards.forEach((card) => {
			registerVideoCard(card);
		});
	}

	function videoCarousel() {
		const controller = lenus.helperFunctions.videoController;
		if (!controller) return;

		document.querySelectorAll(".c-carousel.is-testim, .c-carousel.is-wide").forEach((component) => {
			const instance = lenus.helperFunctions.initSplideCarousel(component, {
				config: {
					type: "loop",
					gap: "1.5rem",
					autoplay: false,
					clones: 5,
					autoWidth: true,
					arrows: true,
					pagination: false,
					trimSpace: "move",
					snap: true,
					drag: "free",
					focus: "center",
					breakpoints: {
						767: {
							autoWidth: true,
						},
					},
					customAutoscroll: true,
					// autoscroll is defined in data attributes and initialized by initSplideCarousel
				},
				onMounted: (instance) => {
					// Register video cards and setup interactions
					setupVideoCarouselInteractions(component, instance, controller);
				},
			});
		});
		function setupVideoCarouselInteractions(component, instance, controller) {
			const { Slides } = instance.Components;
			const unregisterFns = [];
			const cards = [];

			Slides.get().forEach((slideObj) => {
				const card = slideObj.slide.querySelector(".c-testim-card, .c-wide-card");
				if (!card) return;
				cards.push(card);

				const unregister = registerVideoCard(card, {
					onPlay: () => {
						instance.go(slideObj.index);
						instance.Components?.AutoScroll?.pause?.();
						instance.Components?.Autoplay?.pause?.();
					},
					onPause: () => {
						// resume whichever mode is correct (desktop vs mobile)
						instance._syncAutoMode?.();
						// fallback if you don’t expose helper:
						// instance.Components?.AutoScroll?.play?.();
						// instance.Components?.Autoplay?.play?.();
					},
				});
				if (typeof unregister === "function") {
					unregisterFns.push(unregister);
				}
			});

			component.querySelectorAll(".carousel_arrow, .carousel_progress").forEach((el) => {
				const handler = () => controller.pauseAll();
				el.addEventListener("click", handler);
				unregisterFns.push(() => el.removeEventListener("click", handler));
			});

			instance.on("destroy", () => {
				unregisterFns.forEach((fn) => fn());
			});
		}
	}

	function ctaImage() {
		if (!window._ctaImageState) window._ctaImageState = new Map();

		const ResizeManager = lenus.resizeManager;
		const mobileMq = window.matchMedia(
			lenus.resizeManager.breakpoints.mobile || "(max-width: 767px)",
		);

		document.querySelectorAll(".c-cta").forEach((component) => {
			// --- Clean previous instance ---
			const prev = window._ctaImageState.get(component);
			if (prev) {
				prev.split && prev.split.revert();
				prev.ctx && prev.ctx.revert();
				if (prev.resizeHandler) ResizeManager.remove(prev.resizeHandler);
				window._ctaImageState.delete(component);
			}

			const isSplit = component.classList.contains("is-split");
			const imgWrap = component.querySelector(".cta_img");
			const content = component.querySelector(".cta_content");
			const pinned = component.querySelector(".cta_pinned");
			const endParent = component.querySelector(".cta_spacer");
			const title = component.querySelector(".cta_title");

			if (!imgWrap || !content || !pinned || !endParent || !title) return;

			const images = Array.from(imgWrap.querySelectorAll("img"));

			let ctx = null;
			let split = null;
			let tl = null;

			const makeTimeline = () => {
				// Kill any previous timeline, but keep ctx so context tracking still works
				if (tl) {
					if (tl.scrollTrigger) tl.scrollTrigger.kill(false);
					tl.kill();
					tl = null;
				}

				// Mobile split variant → static layout, no ST
				if (isSplit && mobileMq.matches) {
					if (split) {
						split.revert();
						split = null;
					}
					gsap.set([imgWrap, content, title], { clearProps: "all" });
					return;
				}

				const gap = endParent.offsetWidth + 48;
				const titleSpans = title.querySelectorAll("span");
				const spanWidth = (content.offsetWidth - gap) / 2;

				// Reset wrapper transform before Flip
				gsap.set(imgWrap, { clearProps: "transform,width,height" });
				gsap.set(imgWrap, { width: "100%", height: "100%" });

				// Scale inner images instead of wrapper
				if (images.length) {
					gsap.set(images, {
						scale: 1.05,
						transformOrigin: "50% 50%",
					});
				}

				// Initial image visibility
				if (images.length > 1) {
					gsap.set(images[0], { autoAlpha: 1 });
					gsap.set(images.slice(1), { autoAlpha: 0 });
				}

				const imgTimes = [];
				if (images.length > 1) {
					images.forEach((image, index) => {
						imgTimes.push({
							img: image,
							time: (index / (images.length - 1)) * 0.5,
						});
					});
				}

				// Split title for gradient
				if (split) split.revert();
				split = new SplitText(title, {
					type: "words",
					wordsClass: "anim-grad-text-word",
				});

				const words = split.words;
				gsap.set(words, { backgroundPosition: "100% 0%" });

				tl = gsap.timeline({
					scrollTrigger: {
						trigger: component,
						start: "top top",
						end: () => "+=" + pinned.offsetHeight * 1,
						scrub: 1,
						pin: pinned,
						invalidateOnRefresh: true,
						// markers: true,
						onUpdate(self) {
							if (imgTimes.length < 2) return;
							const p = self.progress;
							imgTimes.forEach(({ img, time }) => {
								gsap.set(img, { autoAlpha: p >= time ? 1 : 0 });
							});
						},
					},
				});

				if (isSplit) {
					gsap.set(titleSpans, { width: spanWidth });
					gsap.set(titleSpans[0], { textAlign: "right" });
					gsap.set(titleSpans[1], { textAlign: "left" });

					tl.to(title, { gap }, 0);
				}

				tl.add(
					Flip.fit(imgWrap, endParent, {
						duration: 0.5,
						// scale: true, // or false, if you want to control scale separately
					}),
					0,
				);

				tl.to(
					words,
					{
						backgroundPosition: "0% 0%",
						ease: "none",
						duration: 0.3,
						stagger: {
							each: 0.08,
							from: "start",
						},
					},
					0.1,
				);
			};

			ctx = gsap.context(makeTimeline, component);

			const resizeHandler = ({ widthChanged, heightChanged }) => {
				if (!widthChanged && !heightChanged) return;
				if (mobileMq.matches && !widthChanged) return; // ignore toolbar flicker

				if (ctx) ctx.revert();
				if (split) {
					split.revert();
					split = null;
				}
				ctx = gsap.context(makeTimeline, component);
				ScrollTrigger.refresh();
			};

			ResizeManager.add(resizeHandler);
			window._ctaImageState.set(component, { ctx, split, resizeHandler });
		});
	}

	function randomTestimonial() {
		const sources = Array.from(document.querySelectorAll('[data-lenus-source="testimonial-img"]'));

		if (sources.length === 0) {
			// if no sources, hide all groups and exit
			document.querySelectorAll('[data-lenus-target="testimonial-group"]').forEach((group) => {
				gsap.set(group, {
					display: "none",
				});
			});
		}

		document.querySelectorAll('[data-lenus-target="testimonial-group"]').forEach(async (group) => {
			const targets = Array.from(group.querySelectorAll('[data-lenus-target="testimonial-img"]'));

			if (targets.length === 0) return;

			// clone & shuffle a fresh copy of the sources
			const pool = sources.slice();
			gsap.utils.shuffle(pool);

			let newImgs = [];

			targets.forEach((targetEl, idx) => {
				const srcEl = pool[idx];
				if (!srcEl) return; // in case there are more targets than sources

				// keep the target's original classList
				const cls = Array.from(targetEl.classList).join(" ");

				// clone the source node (deep)
				const clone = srcEl.cloneNode(true);

				// re-apply the target's classes and data attr
				clone.className = cls;
				clone.setAttribute("data-lenus-target", "testimonial-img");

				// swap it in
				targetEl.replaceWith(clone);

				// If the clone is an <img>, track it for load-waiting
				if (clone.tagName === "IMG") newImgs.push(clone);
				else newImgs = newImgs.concat(Array.from(clone.querySelectorAll("img")));
			});
			await waitForImages(newImgs);
			gsap.to(group, { autoAlpha: 1 });
		});

		function waitForImages(imgs) {
			return Promise.all(
				imgs.map((img) => {
					if (img.complete && img.naturalWidth > 0) return Promise.resolve();
					return new Promise((resolve) => {
						img.addEventListener("load", resolve, { once: true });
						img.addEventListener("error", resolve, { once: true }); // resolve on error so it doesn't hang
					});
				}),
			);
		}
	}

	function academyCredAnim() {
		// scrolltriggered load in anim for each .cred inside each .c-creds component. Stagger anim for each .cred. Animation for each item looks like this: the image .cred_img has a slight move up and sharpen from blur, then the .cred_text content fade and move up after
		document.querySelectorAll(".c-creds").forEach((component) => {
			gsap.utils.toArray(".cred", component).forEach((cred, index) => {
				const img = cred.querySelector(".cred_img");
				const text = cred.querySelector(".cred_text");
				if (!img || !text) return;
				const tl = gsap.timeline({
					scrollTrigger: {
						trigger: component,
						start: "top 80%",
						end: "top 40%",
						toggleActions: "play none none reverse",
						scrub: 1,
						// markers: true,
					},
				});
				tl.fromTo(
					img,
					{ y: 30, filter: "blur(4px)", autoAlpha: 0 },
					{ y: 0, filter: "blur(0px)", autoAlpha: 1, ease: "power1.out", duration: 0.6 },
					index * 0.2,
				);
				tl.fromTo(
					text,
					{ y: 20, autoAlpha: 0 },
					{ y: 0, autoAlpha: 1, ease: "power1.out", duration: 1.6 },
					"-=0.5",
				);
			});
		});
	}

	function basicMediaAnim() {
		// do a basic scale from 0;9 and slight move up for .large-card_media elements in viewport using scrollTrigger, revserse on leave, and use scrub with a large delay
		gsap.utils.toArray(".large-card_media, .full-screen_media-wrap").forEach((media) => {
			let scaleStart = 0.9;
			if (media.classList.contains("full-screen_media-wrap")) {
				scaleStart = 0.95;
			}

			gsap.fromTo(
				media,
				{ y: 30, scale: scaleStart },
				{
					y: 0,
					scale: 1,
					ease: "power1.out",
					scrollTrigger: {
						trigger: media,
						start: "top 80%",
						end: "top 40%",
						scrub: 3,
						toggleActions: "play reverse play reverse",
					},
				},
			);
		});
	}

	function accordion() {
		function buildAccordion(component) {
			const items = gsap.utils.toArray(".accordion-item, .faq-item", component);
			const fallbackImage = component.querySelector(".accordion_media.is-fallback .accordion-img");
			const images = gsap.utils.toArray(
				".accordion_media.is-not-fallback .accordion-img",
				component,
			);

			// Function to check if any item is open and update fallback image visibility
			function updateFallbackImage() {
				const hasOpenItem = items.some((item) => !item._tl.reversed());

				if (fallbackImage) {
					gsap.to(fallbackImage, {
						autoAlpha: hasOpenItem ? 0 : 1,
						duration: 0.4,
						ease: "power1.inOut",
					});
				}
			}

			items.forEach((item, index) => {
				const header = item.querySelector(".accordion-item_header, .faq-item_header");
				const content = item.querySelector(".accordion-item_content, .faq-item_content");
				const image = images[index] || null; // if no image, set to null

				// prepare content for auto-height animation
				gsap.set(content, {
					height: "auto",
					overflow: "hidden",
				});

				if (image) {
					gsap.set(image, {
						autoAlpha: 1,
					});
				}

				// create a timeline that starts "open" and then reverse() so panels start closed
				const tl = gsap
					.timeline({
						paused: true,
						defaults: { duration: 0.4, ease: "power1.inOut" },
						onComplete: updateFallbackImage,
						onReverseComplete: updateFallbackImage,
					})
					.from(content, { height: 0 });

				if (images.length > 1) {
					tl.from(image, { autoAlpha: 0 }, 0);
				}

				// start closed
				tl.reverse();
				item._tl = tl;

				// accessibility setup
				header.setAttribute("role", "button");
				header.setAttribute("tabindex", "0");
				header.setAttribute("aria-expanded", "false");

				header.addEventListener("click", () => {
					// collapse all others
					items.forEach((other) => {
						if (other !== item) {
							other._tl.reversed(true);
							other
								.querySelector(".accordion-item_header, .faq-item_header")
								.setAttribute("aria-expanded", "false");
						}
					});

					// toggle this one
					const isOpening = tl.reversed();
					tl.reversed(!isOpening);
					header.setAttribute("aria-expanded", isOpening);
				});
			});

			// on load have first item open and hide fallback - but don't do this for FAQs
			if (items.length > 0 && !component.classList.contains("c-faq")) {
				const firstItem = items[0];
				firstItem._tl.reversed(false);
				firstItem
					.querySelector(".accordion-item_header, .faq-item_header")
					.setAttribute("aria-expanded", "true");

				// Update fallback image visibility after first item opens
				updateFallbackImage();
			} else {
				// No items, ensure fallback is visible
				if (fallbackImage) {
					gsap.set(fallbackImage, { autoAlpha: 1 });
				}
			}
		}

		function normalAccordions() {
			document.querySelectorAll(".c-accordion, .c-faq").forEach((component) => {
				buildAccordion(component);
			});
		}
		normalAccordions();

		function legalAccordions() {
			// accordions inside content sections with TOC
			const components = document.querySelectorAll(".contents:has(.accordion-item)");

			if (components.length === 0) return;

			window.FinsweetAttributes ||= [];
			window.FinsweetAttributes.push([
				"toc",
				(result) => {
					console.log(
						"[legalAccordions] Accordions detected, building accordions inside TOC content sections.",
					);
					components.forEach((contentsBlock) => {
						const hasAccordion = contentsBlock.querySelector(".accordion-item");
						if (!hasAccordion) return;

						buildAccordion(contentsBlock);
					});
				},
			]);
		}
		legalAccordions();
	}

	// ---- NEW: expose a refresh function ----

	function expandingCards() {
		const videoSelector = "video";
		const imgSelector = "img";
		const mediaQuery = window.matchMedia("(max-width: 768px)");
		const inactiveOpacity = 0.5; // Opacity for inactive cards

		// Helper to know current mode
		const isMobile = () => mediaQuery.matches;
		let currentMode = isMobile() ? "mobile" : "desktop"; // Track the current mode
		let splideInstance;

		document.querySelectorAll(".c-expanding-cards").forEach((component) => {
			const cards = lenus.helperFunctions.getCards(component);
			const bgs = gsap.utils.toArray(".card_media", component);
			const contents = gsap.utils.toArray(".card_content, .card_content-inner", component);
			let ctx = gsap.context(() => {});
			const handlers = new Map();

			// initialise
			if (cards.length > 0) {
				if (currentMode === "desktop") {
					console.log("Desktop mode detected, setting up expanding-cards.");
					// add event listeners to cards

					cards.forEach((card) => {
						const handler = (event) => {
							const card = event.currentTarget;
							cardMouseEnter(ctx, card, component, cards, contents);
						};
						card.addEventListener("mouseenter", handler);
						handlers.set(card, handler); // store for later removal
					});

					initDsk(cards, bgs, contents);
				} else {
					// console.log("Mobile mode detected, switching to carousel.");
					expandingCards_resetCards(cards, true, false, true);
					initSplide(cards, component);
				}
			}

			// on resize
			const onResize = lenus.helperFunctions.debounce(() => {
				const newMode = isMobile() ? "mobile" : "desktop";
				// if still in desktop, update the background images so they are correct
				if (newMode === "desktop") {
					updateBgs(bgs, cards, contents, false);
				}
				if (newMode === currentMode) return; // Only reinitialize if mode has changed

				currentMode = newMode; // Update the current mode

				if (newMode === "mobile") {
					console.log("Mobile mode detected, switching to carousel.");
					expandingCards_resetCards(cards, true, false, true);
					updateBgs(bgs, cards, contents, true);
					cards.forEach((c) => {
						c.removeEventListener("mouseenter", handlers.get(c));
					});
					ctx.revert();
					initSplide(cards, component);
				} else {
					console.log("Desktop mode detected, switching to expanding-cards.");
					if (splideInstance) {
						lenus.helperFunctions.destroySplide(splideInstance);
					}
					cards.forEach((card) => {
						const handler = (event) => {
							const card = event.currentTarget;
							cardMouseEnter(ctx, card, component, cards, contents);
						};
						card.addEventListener("mouseenter", handler);
						handlers.set(card, handler); // store for later removal
					});
					initDsk(cards, bgs, contents);
				}
			});
			window.addEventListener("resize", onResize);
			resizeHandlerRef = onResize;
		});

		function initSplide(cards, component) {
			splideInstance = new Splide(component, {
				type: "loop",
				autoplay: false,
				autoWidth: true,
				arrows: true,
				pagination: false,
				gap: "1rem",
				trimSpace: "move",
				mediaQuery: "min",
				breakpoints: {
					768: {
						destroy: true,
					},
					767: {
						perPage: 1,
					},
				},
				snap: true,
				drag: true,
			});
			splideInstance.mount();
			const { Slides } = splideInstance.Components;

			// Set up progress bar
			lenus.helperFunctions.setUpProgressBar(component, cards, splideInstance, Slides);

			// When slide becomes active, if video exists, play it (and pause others)
			splideInstance.on("active", (slide) => {
				let card;

				// Ensure we only process the original slide, not clones
				if (!slide || !slide.slide || slide.isClone) return; // Skip clones

				// Get card - it will either be the slide itself or a child of the slide
				if (slide.slide.classList.contains("card")) {
					card = slide.slide;
				} else {
					card = slide.slide.querySelector(".card");
				}
				if (!card) return; // Safety check

				lenus.helperFunctions.resetAllCards(cards, card); // Reset all cards except the active one
				const video = card.querySelector(videoSelector);
				if (video) {
					console.log("Playing video for card:", card);
					lenus.helperFunctions.showVideo(card, videoSelector, imgSelector, true);
					video.play();
				}
			});

			console.log("Splide carousel initialized.");
		}

		function expandingCards_resetCards(
			cards,
			resetVideos = false,
			lowerOpacity = true,
			showContent = false,
		) {
			cards.forEach((c) => {
				const content = c.querySelector(".card_content");
				c.classList.remove("is-expanded");
				gsap.set(c, {
					opacity: lowerOpacity ? inactiveOpacity : 1,
				});
				if (content) {
					// console.log("Setting content opacity for card:", c, "to", showContent ? 1 : 0);
					gsap.set(content, { opacity: showContent ? 1 : 0 });
				}
				if (resetVideos) {
					const video = c.querySelector("video");
					if (video) {
						video.pause();
						video.currentTime = 0;
						lenus.helperFunctions.showVideo(c, videoSelector, imgSelector, false); // show image, hide video
					}
				}
			});
		}

		function activateCard(card, activateVideo = true) {
			if (!card) return;
			const content = card.querySelector(".card_content");
			card.classList.add("is-expanded");
			gsap.set(card, {
				opacity: 1,
			});
			if (content) {
				gsap.set(content, { opacity: 1 });
			}
			if (activateVideo) {
				const video = card.querySelector("video");
				if (video) {
					lenus.helperFunctions.showVideo(card, videoSelector, imgSelector, true);
					video.play();
				}
			}
		}

		function createFlip(component, cards, card, contents) {
			const state = Flip.getState([cards], { props: "flex, width" });

			gsap.set(component, { minHeight: () => cards[0].offsetHeight + "px" });

			expandingCards_resetCards(cards, false); // need to do this within flip so we update state correctly

			activateCard(card, false); // activate the hovered card, but handle video separately

			let flip = Flip.from(state, {
				absolute: true,
				nested: true,
				duration: 0.6,
				custom: { opacity: { duration: 0.3 } }, // custom duration for opacity change
				ease: "power2.inOut",
				toggleClass: "is-changing",
				onComplete: () => gsap.set(component, { minHeight: "auto" }),
			});

			return flip;
		}

		function cardMouseEnter(ctx, card, component, cards, contents) {
			// if card already active, do nothing
			if (card.classList.contains("is-expanded")) return;

			// console.log("Card mouse enter:", card);

			// set up flip animation and add to context
			ctx.add(() => {
				let flip = createFlip(component, cards, card, contents);
			});

			// play video
			const video = card.querySelector("video");
			if (video) {
				lenus.helperFunctions.showVideo(card, videoSelector, imgSelector, true);
				video.play();
			}

			// reset all other videos
			cards.forEach((otherCard) => {
				if (otherCard !== card) {
					const otherVideo = otherCard.querySelector("video");
					if (otherVideo) {
						otherVideo.pause();
						otherVideo.currentTime = 0;
					}
					lenus.helperFunctions.showVideo(otherCard, videoSelector, imgSelector, false);
				}
			});
		}

		function initDsk(cards, bgs, contents) {
			expandingCards_resetCards(cards, true, false, false);
			activateCard(cards[0], true);
			updateBgs(bgs, cards, contents);
		}

		function updateBgs(bgs, cards, contents = null, reset = false) {
			if (cards.length === 0) return;

			if (reset) {
				gsap.set([bgs, contents], {
					clearProps: "width",
				});

				return;
			} else {
				// find the active card
				let card = cards.find((c) => c.classList.contains("is-expanded")) || cards[0];

				if (!card) return; // no active card found

				// we don't want to scope, we want to apply to all cards

				gsap.set(bgs, {
					width: () => card.offsetWidth + "px",
				});
				// if contents are provided, set their width too
				if (contents && contents.length > 0) {
					gsap.set(contents, {
						width: () => card.offsetWidth + "px",
					});
				}
			}
		}
	}

	function cardCleanupInlineStyles(card) {
		console.log("[cardCleanup] Cleaning up inline styles for card:", card);
		const media = card.querySelector(".card_media");
		const content = card.querySelector(".card_content");
		const extraContent = card.querySelector(".card_extra-content");

		// clear height, width, minHeight, minWidth, maxHeight, maxWidth on all items
		gsap.set(card, { clearProps: "height,width,minHeight,minWidth,maxHeight,maxWidth" });
		gsap.set(media, {
			clearProps: "height,width,minHeight,minWidth,maxHeight,maxWidth,overflow",
		});
		gsap.set(content, { clearProps: "transform,width" });
		gsap.set(extraContent, {
			clearProps: "height,opacity,autoAlpha,width, visibility",
		});
		extraContent.style.removeProperty("visibility");
	}

	function cardGrid() {
		document.querySelectorAll(".c-card-grid").forEach((component) => {
			const cards = lenus.helperFunctions.getCards(component);
			console.log("Setting up card grid carousel for", component, cards);

			lenus.helperFunctions.handleResponsiveCarousel(component, {
				config: {
					type: "loop",
					autoplay: false,
					autoWidth: true,
					arrows: true,
					pagination: false,
					gap: "1rem",
					trimSpace: "move",
					snap: true,
					drag: true,
				},
				// run when Splide has been mounted
				onMounted: (splideInstance) => {
					const cards = gsap.utils.toArray(".c-card", component);
					// ensure all inline styles are cleared from the cardHover function
					cards.forEach((card) => {
						cardCleanupInlineStyles(card);
					});
				},
				responsive: {
					breakpoint: 768,
					mobileOnly: true,
					onModeChange: (mode, splideInstance) => {
						if (mode === "mobile" && splideInstance) {
							console.log("Mobile mode: setting up card grid carousel");
							setupCardGridInteractions(splideInstance, cards);
						} else {
							console.log("Desktop mode: using native grid layout");
							// Desktop uses native CSS grid - no additional setup needed
						}
					},
				},
			});
		});
		function setupCardGridInteractions(splideInstance, cards) {
			const videoSelector = "video";
			const imgSelector = "img";

			// Set up progress bar
			const component = splideInstance.root;
			lenus.helperFunctions.setUpProgressBar(
				component,
				cards,
				splideInstance,
				splideInstance.Components.Slides,
			);

			// When slide becomes active, handle video playback
			splideInstance.on("active", (slide) => {
				let card;

				// Ensure we only process the original slide, not clones
				if (!slide || !slide.slide || slide.isClone) return;

				// Get card - it will either be the slide itself or a child of the slide
				if (slide.slide.classList.contains("card")) {
					card = slide.slide;
				} else {
					card = slide.slide.querySelector(".card");
				}
				if (!card) return;

				lenus.helperFunctions.resetAllCards(cards, card);
				const video = card.querySelector(videoSelector);
				if (video) {
					console.log("Playing video for card:", card);
					lenus.helperFunctions.showVideo(card, videoSelector, imgSelector, true);
					video.play();
				}
			});

			console.log("Card grid carousel initialized.");
		}
	}

	function animateTitles() {
		document.querySelectorAll(".anim-grad-text, .c-title:not(.no-anim)").forEach((el) => {
			if (el.closest(".c-cta")) return;

			const split = new SplitText(el, {
				type: "words",
				wordsClass: "anim-grad-text-word",
			});

			const words = split.words;

			// initial state
			gsap.set(words, {
				backgroundPosition: "100% 0%",
			});

			gsap.to(words, {
				backgroundPosition: "0% 0%",
				ease: "none",
				stagger: {
					each: 0.08,
					from: "start",
				},
				scrollTrigger: {
					trigger: el,
					start: "top 80%",
					end: "top 40%",
					scrub: 3,
				},
			});
		});
	}

	function animateGradientLines() {
		// animate background position of .svg-cross_line elements in the same way as text gradients
		document.querySelectorAll(".svg-cross_line").forEach((el) => {
			const trigger = el.closest(".media") || el;
			gsap.set(el, {
				backgroundPosition: "50% 0%", // middle of the 300% gradient
			});

			gsap.to(el, {
				backgroundPosition: "0% 0%", // sweep the highlight across
				ease: "none",
				scrollTrigger: {
					trigger: trigger,
					start: "top 80%",
					end: "top 10%",
					scrub: 3,
				},
			});
		});

		document.querySelectorAll(".cred_line").forEach((el, index) => {
			const startOffset = 80 + index * 5;
			const endOffset = 10 - index * 5;
			const start = `top ${startOffset}%`;
			const end = `top ${Math.max(endOffset, 0)}%`;
			gsap.set(el, {
				backgroundPosition: "0% -100%",
			});

			gsap.to(el, {
				backgroundPosition: "0% 200%",
				ease: "none",
				scrollTrigger: {
					trigger: el,
					start: start, //"top 80%",
					end: end, //"top 10%",
					scrub: 3,
					// markers: true,
				},
			});
		});
	}

	// -----------------------------------------------------------------------------
	// SHARED TRACK CONTROLLER
	// Drives highlight (via CSS vars), drag bounds, snapping, and resize updates.
	// -----------------------------------------------------------------------------

	function createToggleTrack({
		host, // component element (where CSS vars can live)
		track, // viewport element
		list, // the scrolling flex list
		items, // array of button/item elements
		varsHost = host, // element to receive CSS vars
		onSelect = () => {}, // callback(index, meta)
		selectOnDrag = false, // if true: drag release selects nearest
		fadeLeft = null,
		fadeRight = null,
	}) {
		const CSS_VARS = { width: "--toggle-slider--w", left: "--toggle-slider--l" };

		let active = 0;
		let draggable = null;
		let bounds = { minX: 0, maxX: 0 };

		// ---- measurements (left-aligned model) -------------------
		function measure() {
			const style = getComputedStyle(list);
			const gap = parseFloat(style.gap) || 0;
			const listWidth =
				items.reduce((w, el) => w + el.offsetWidth, 0) + gap * Math.max(items.length - 1, 0);
			const trackWidth = track.clientWidth;
			const overflowing = listWidth > trackWidth + 0.5;
			bounds = { minX: Math.min(0, trackWidth - listWidth), maxX: 0 };
			// fade vis
			if (fadeLeft && fadeRight) {
				const show = overflowing ? "block" : "none";
				fadeLeft.style.display = show;
				fadeRight.style.display = show;
			}
			return {
				listWidth,
				trackWidth,
				overflowing,
				avgItem: items.length ? listWidth / items.length : 0,
			};
		}

		// ---- highlight -------------------------------------------------------------
		function setHighlight(i, immediate = false) {
			const el = items[i];
			if (!el) return;
			const left = el.offsetLeft;
			const width = el.offsetWidth;
			const vars = { [CSS_VARS.left]: `${left}px`, [CSS_VARS.width]: `${width}px` };
			immediate
				? gsap.set(varsHost, vars)
				: gsap.to(varsHost, { ...vars, duration: 0.28, ease: "power2.out" });
		}

		const clampX = (x) => gsap.utils.clamp(bounds.minX, bounds.maxX, x);

		function centerIndex(i, immediate = false) {
			const el = items[i];
			if (!el || !track) return;
			const trackCenter = track.clientWidth / 2;
			const itemCenter = el.offsetLeft + el.offsetWidth / 2;
			const x = clampX(trackCenter - itemCenter);
			immediate ? gsap.set(list, { x }) : gsap.to(list, { x, duration: 0.35, ease: "power2.out" });
		}

		function closestIndexToCenter() {
			const rect = track.getBoundingClientRect();
			const center = rect.left + rect.width / 2;
			let best = 0,
				min = Infinity;
			items.forEach((el, i) => {
				const r = el.getBoundingClientRect();
				const c = r.left + r.width / 2;
				const d = Math.abs(c - center);
				if (d < min) {
					min = d;
					best = i;
				}
			});
			return best;
		}

		// ---- selection -------------------------------------------------------------
		function select(i, { immediate = false, center = true, source = "program" } = {}) {
			if (i < 0 || i >= items.length) return;
			active = i;
			items.forEach((el, idx) => el.classList.toggle("is-active", idx === i));
			setHighlight(i, immediate);
			if (center) centerIndex(i, immediate);
			onSelect(i, { source });
		}

		// ---- draggable -------------------------------------------------------------
		function ensureDraggable() {
			if (draggable) return;
			draggable = Draggable.create(list, {
				type: "x",
				bounds,
				inertia: true,
				edgeResistance: 0.85,
				allowNativeTouchScrolling: false,
				cursor: "grab",
				activeCursor: "grabbing",
				onDrag: function () {
					const clamped = clampX(this.x);
					if (clamped !== this.x) gsap.set(list, { x: clamped });
				},
				onDragEnd: () => {
					if (selectOnDrag) select(closestIndexToCenter(), { source: "drag" });
				},
			})[0];
		}

		function killDraggable() {
			if (!draggable) return;
			draggable.kill();
			draggable = null;
			gsap.set(list, { x: 0, cursor: "" });
		}

		function update() {
			const { overflowing } = measure();
			list.style.justifyContent = overflowing ? "flex-start" : ""; // stabilize offsets
			if (overflowing) {
				ensureDraggable();
				draggable.applyBounds(bounds);
				const cur = gsap.getProperty(list, "x") || 0;
				gsap.set(list, { x: clampX(cur) });
			} else {
				killDraggable();
			}
			setHighlight(active, true);
		}

		// --- init + observers -------------------------------------------------------
		measure();
		setHighlight(active, true);
		update();

		const onWinResize = lenus?.helperFunctions?.debounce
			? lenus.helperFunctions.debounce(update, 150)
			: update;
		window.addEventListener("resize", onWinResize);
		const ro = new ResizeObserver(() => onWinResize());
		ro.observe(track);

		return {
			select,
			update,
			getActive: () => active,
			getAvgItem: () => measure().avgItem,
			isOverflow: () => measure().overflowing,
			setSelectOnDrag(val) {
				if (!draggable) selectOnDrag = val;
				else
					draggable.vars.onDragEnd = () => {
						if (val) select(closestIndexToCenter(), { source: "drag" });
					};
			},
			destroy() {
				window.removeEventListener("resize", onWinResize);
				ro.disconnect();
				killDraggable();
			},
		};
	}

	function tabsWithToggleSlider() {
		// global store if you want to inspect/tab debug in DevTools
		if (!lenus.toggleTabs) lenus.toggleTabs = [];

		document.querySelectorAll("[data-tabs-element='component']").forEach((component) => {
			const controls = component.querySelector("[data-tabs-element='controls']");
			const track = component.querySelector("[data-tabs-element='controls-track']");
			const list = component.querySelector("[data-tabs-element='controls-list']");
			const panelsList = component.querySelector("[data-tabs-element='panel-list']");
			if (!controls || !track || !list || !panelsList) {
				console.log(
					"[tabsWithToggleSlider] Missing required elements in tabs component:",
					component,
				);
				return;
			}

			console.log("[tabsWithToggleSlider] Setting up tabs component:", component);

			// find panels
			let panels = Array.from(panelsList.querySelectorAll("[data-tabs-element='panel']"));
			if (!panels.length) return;

			const obj = {
				component,
				controls,
				track,
				list,
				panelsList,
				panels,
			};
			lenus.toggleTabs.push(obj);

			// --- videos & shared timeline detection -----------------------------------

			const allVideos = Array.from(component.querySelectorAll("video"));
			const isVideoTabs = allVideos.length > 0;

			obj.videos = allVideos;
			obj.isVideoTabs = isVideoTabs;

			// If a tabbed-hero video reaches the end, it should never be auto-restarted
			// by scroll-based triggers. We track this per-video.
			if (isVideoTabs) {
				obj.videos.forEach((video) => {
					if (!video || video._lenusEndedHandlerAttached) return;
					video._lenusEndedHandlerAttached = true;
					video.addEventListener(
						"ended",
						() => {
							video.dataset.lenusAutoplayEnded = "true";
						},
						{ passive: true },
					);
				});
			}

			// --- build or reuse buttons ----------------------------------------------

			let tabs = Array.from(list.querySelectorAll("[data-tabs-element='controls-item']"));
			const hasPrebuiltButtons = tabs.length > 0;

			if (!hasPrebuiltButtons) {
				list.innerHTML = "";
				panels.forEach((panel, i) => {
					const btn = document.createElement("button");
					btn.className = "tab-controls_item";
					const label = panel.getAttribute("data-tabs-title") || `Tab ${i + 1}`;
					btn.textContent = label;
					btn.dataset.index = i;
					list.appendChild(btn);
				});
				tabs = Array.from(list.querySelectorAll(".tab-controls_item"));
			} else {
				// If buttons are prebuilt, map them to panels:
				//  - If a button has data-tab-target it may be a selector or #id to find its panel.
				//  - Otherwise we map by index order.
				tabs.forEach((btn, i) => {
					const tgt = btn.getAttribute("data-tab-target");
					let panel = null;
					if (tgt) panel = component.querySelector(tgt);
					btn._panel = panel || panels[i] || null;
				});
				// Reorder panels to match prebuilt mapping if most buttons specify a target.
				const mapped = tabs.map((b, i) => b._panel || panels[i]).filter(Boolean);
				if (mapped.length === tabs.length) panels = mapped;
			}

			obj.tabs = tabs;
			obj.panels = panels;

			// --- accessibility (basic) -----------------------------------------------

			tabs.forEach((btn, i) => {
				btn.setAttribute("role", "tab");
				btn.setAttribute("aria-controls", panels[i]?.id || "");
				btn.setAttribute("aria-selected", "false");
			});
			panels.forEach((p) => p.setAttribute("role", "tabpanel"));

			function ensureMetadata(video) {
				if (Number.isFinite(video.duration) && video.duration > 0) {
					return Promise.resolve();
				}
				return new Promise((resolve, reject) => {
					const timeout = setTimeout(() => {
						reject(new Error("Metadata load timeout"));
					}, 5000);
					const onLoad = () => {
						clearTimeout(timeout);
						video.removeEventListener("loadedmetadata", onLoad);
						resolve();
					};
					video.addEventListener("loadedmetadata", onLoad, { once: true });
					video.load();
				});
			}

			async function primeAndPlay(video) {
				if (!video) return;
				// Never auto-restart a video that has ended
				if (video.ended || video.dataset.lenusAutoplayEnded === "true") return;

				// Avoid concurrent priming attempts on the same element
				if (video._lenusPrimeInFlight) return;
				video._lenusPrimeInFlight = true;

				console.log("[tabsWithToggleSlider] Priming and playing video:", video);
				try {
					lenus?.helperFunctions?.ensureVideoSources?.(video);
					video.preload = "auto";
					video.playsInline = true;
					if (!video.hasAttribute("muted")) video.muted = true;
					await ensureMetadata(video);
					try {
						await video.play();
					} catch {
						// ignore autoplay failures
					}
				} catch {
					// ignore metadata failures
				} finally {
					video._lenusPrimeInFlight = false;
				}
			}

			// --- content switching ----------------------------------------------------

			const panelDisplayFallback =
				panels.map((p) => p.style.display).find((d) => d && d !== "none") ||
				panels
					.map((p) => {
						try {
							return getComputedStyle(p).display;
						} catch {
							return "";
						}
					})
					.find((d) => d && d !== "none") ||
				"block";

			// For video-tabs, keep panels out of `display:none` so videos can continue playing.
			// To avoid layout growth, stack panels on top of each other.
			if (isVideoTabs) {
				try {
					if (getComputedStyle(panelsList).position === "static") {
						gsap.set(panelsList, { position: "relative" });
					}
				} catch {
					gsap.set(panelsList, { position: "relative" });
				}
				panels.forEach((p) => {
					const display =
						(p.style.display && p.style.display !== "none" ? p.style.display : null) ||
						panelDisplayFallback;
					p.dataset.tabsDisplay = display;
					p.style.removeProperty("display");
					gsap.set(p, { position: "absolute", inset: 0, width: "100%", display });
				});
			} else {
				// For non-video tabs, we keep legacy `display:none` switching to avoid layout expansion.
				panels.forEach((p) => {
					const display =
						(p.style.display && p.style.display !== "none" ? p.style.display : null) ||
						panelDisplayFallback;
					p.dataset.tabsDisplay = display;
				});
			}

			function showPanel(i, { immediate = false } = {}) {
				const duration = immediate ? 0 : 0.28;
				panels.forEach((p, idx) => {
					const active = idx === i;
					p.classList.toggle("is-active", active);

					if (isVideoTabs) {
						// Never `display:none` for video tabs.
						gsap.set(p, { display: p.dataset.tabsDisplay || panelDisplayFallback });
						if (active) {
							gsap.set(p, { pointerEvents: "auto" });
							gsap.to(p, { autoAlpha: 1, duration, ease: "power2.out" });
							refreshSplideInPanel(p, immediate);
						} else {
							gsap.to(p, { autoAlpha: 0, duration, ease: "power2.out" });
							gsap.set(p, { pointerEvents: "none", delay: duration });
						}
						return;
					}

					// Non-video tabs: fade + toggle display
					if (active) {
						gsap.set(p, {
							display: p.dataset.tabsDisplay || panelDisplayFallback,
							pointerEvents: "auto",
						});
						gsap.to(p, { autoAlpha: 1, duration, ease: "power2.out" });
						refreshSplideInPanel(p, immediate);
					} else {
						gsap.to(p, { autoAlpha: 0, duration, ease: "power2.out" });
						gsap.set(p, { pointerEvents: "none", delay: duration });
						gsap.set(p, { display: "none", delay: duration });
					}
				});
			}

			function refreshSplideInPanel(panel, immediate = false) {
				const storedConfig = panel._splideConfig;
				if (!storedConfig) return;

				const delay = immediate ? 0 : 1000;

				setTimeout(() => {
					if (panel.splide) {
						lenus.helperFunctions.destroySplide(panel.splide);
						panel.splide = null;
					}

					const instance = lenus.helperFunctions.initSplideCarousel(
						panel,
						{
							...storedConfig,
							onMounted: (splideInstance) => {
								panel.splide = splideInstance;
							},
						},
						delay,
					);
				});
			}

			// --- controller (drag-to-scroll only; click selects) ---------------------

			const controller = createToggleTrack({
				host: component,
				track,
				list,
				items: tabs,
				varsHost: component,
				onSelect: () => {},
				selectOnDrag: false,
			});

			// --- interactions ---------------------------------------------------------

			let activeIndex =
				Math.max(
					0,
					tabs.findIndex((b) => b.classList.contains("is-active")),
				) ||
				Math.max(
					0,
					panels.findIndex((p) => p.classList.contains("is-active")),
				) ||
				0;

			function activate(i, { immediate = false, source = "program" } = {}) {
				if (i === activeIndex) return;

				// UI + aria
				tabs.forEach((t, n) => {
					const isActive = n === i;
					t.classList.toggle("is-active", isActive);
					t.setAttribute("aria-selected", isActive ? "true" : "false");
				});

				// switch content
				showPanel(i, { immediate });

				// center slider + move highlight
				controller.select(i, { immediate, center: true, source });

				activeIndex = i;
			}

			tabs.forEach((tab, idx) =>
				tab.addEventListener("click", () => activate(idx, { source: "click" })),
			);

			// Initial state
			tabs.forEach((t, n) => {
				const isActive = n === activeIndex;
				t.classList.toggle("is-active", isActive);
				t.setAttribute("aria-selected", isActive ? "true" : "false");
			});
			if (isVideoTabs) {
				panels.forEach((p, n) =>
					gsap.set(p, {
						display: p.dataset.tabsDisplay || panelDisplayFallback,
						autoAlpha: n === activeIndex ? 1 : 0,
						pointerEvents: n === activeIndex ? "auto" : "none",
					}),
				);
			} else {
				panels.forEach((p, n) =>
					gsap.set(p, {
						display: n === activeIndex ? p.dataset.tabsDisplay || panelDisplayFallback : "none",
						autoAlpha: n === activeIndex ? 1 : 0,
						pointerEvents: n === activeIndex ? "auto" : "none",
					}),
				);
			}
			controller.select(activeIndex, { immediate: true, center: true });
			showPanel(activeIndex, { immediate: true });

			const mediaWrap = component.querySelector(".tabbed-hero_media");
			if (mediaWrap) {
				let enterST;

				const END_OFFSET_PX = 10;

				const isComponentInViewport = (el) => {
					if (!el) return false;
					const rect = el.getBoundingClientRect();
					// Treat as visible if it intersects the viewport at all.
					// (Full-visibility checks can fail forever when the component is taller than the viewport.)
					return rect.bottom > 0 && rect.top < window.innerHeight;
				};

				const primeAll = () => {
					obj.videos.forEach((video) => {
						primeAndPlay(video);
					});
				};

				const primeIfVisible = () => {
					if (isComponentInViewport(component)) primeAll();
				};

				const buildHeroSTs = () => {
					if (enterST) enterST.kill();

					// 1) In/out: only handle priming + saving (no early "top+=50" leave)
					enterST = ScrollTrigger.create({
						trigger: component,
						start: "top top",
						end: `bottom top-=${END_OFFSET_PX}`,
						invalidateOnRefresh: true,
						onEnter: () => {
							// prime and play all videos in component
							primeAll();
						},
						onEnterBack: () => {
							primeAll();
						},
						onLeave: () => {},
					});
				};

				buildHeroSTs();
				ScrollTrigger.refresh();
				// If the hero is already visible on load, ScrollTrigger may not fire onEnter
				// until the first scroll update. Prime immediately in that case.
				requestAnimationFrame(() => requestAnimationFrame(primeIfVisible));

				const onResize = lenus?.helperFunctions?.debounce
					? lenus.helperFunctions.debounce(() => {
							controller.update();
							buildHeroSTs();
							ScrollTrigger.refresh();
							requestAnimationFrame(() => requestAnimationFrame(primeIfVisible));
						}, 150)
					: () => {
							controller.update();
							buildHeroSTs();
							ScrollTrigger.refresh();
							requestAnimationFrame(() => requestAnimationFrame(primeIfVisible));
						};

				window.addEventListener("resize", onResize);
			}
		});
	}

	function toggleSlider() {
		document.querySelectorAll(".c-toggle-slider").forEach((component) => {
			const list = component.querySelector(".toggle-slider_list");
			const track = component.querySelector(".toggle-slider_track") || list?.parentElement;
			const items = Array.from(component.querySelectorAll(".c-toggle-slider-item"));
			const radios = Array.from(component.querySelectorAll('input[type="radio"]'));
			if (!list || !track || !items.length || !radios.length) return;

			// Ensure gradient fades exist
			let fadeLeft = component.querySelector(".toggle-slider_fade-left");
			let fadeRight = component.querySelector(".toggle-slider_fade-right");
			if (!fadeLeft) {
				fadeLeft = document.createElement("div");
				fadeLeft.className = "toggle-slider_fade-left";
				component.appendChild(fadeLeft);
			}
			if (!fadeRight) {
				fadeRight = document.createElement("div");
				fadeRight.className = "toggle-slider_fade-right";
				component.appendChild(fadeRight);
			}

			const controller = createToggleTrack({
				host: component,
				track,
				list,
				items,
				varsHost: component,
				onSelect: (i) => {
					radios.forEach((r, idx) => (r.checked = idx === i));
				},
				selectOnDrag: false, // we enable/disable below based on layout
				fadeLeft,
				fadeRight,
			});

			function updatePickerMode() {
				// enable drag-to-select when ≲ 2.5 items fit
				const avg = controller.getAvgItem();
				const overflow = controller.isOverflow();
				controller.setSelectOnDrag(overflow && track.clientWidth < avg * 2.5);
			}

			// Radio → select & center
			radios.forEach((radio, idx) => {
				radio.addEventListener("change", () => {
					if (radio.checked) controller.select(idx);
				});
			});

			// Initial selection
			const initial = Math.max(
				0,
				radios.findIndex((r) => r.checked),
			);
			controller.select(initial, { immediate: true });

			// Keep everything sane on resize
			const onResize = lenus?.helperFunctions?.debounce
				? lenus.helperFunctions.debounce(() => {
						controller.update();
						updatePickerMode();
						const current = Math.max(
							0,
							radios.findIndex((r) => r.checked),
						);
						controller.select(current, { immediate: true });
					}, 150)
				: () => {
						controller.update();
						updatePickerMode();
						const current = Math.max(
							0,
							radios.findIndex((r) => r.checked),
						);
						controller.select(current, { immediate: true });
					};

			window.addEventListener("resize", onResize);
			updatePickerMode();
		});
	}

	function standardCarousel() {
		// set up splide instance for each .c-carousel component
		document
			.querySelectorAll(".c-carousel:not(.is-wide):not(.is-mini):not(.is-testim)")
			.forEach((component) => {
				console.log("Initializing standard carousel:", component);
				const instance = lenus.helperFunctions.initSplideCarousel(component, {
					config: {
						gap: "1rem",
						breakpoints: {
							767: {
								gap: "1.5rem",
								// autoWidth: false,
							},
						},
						clones: 2,
					},
				});

				console.log("Standard carousel initialized.");
			});
	}

	function wideCarousel() {
		return; // disable as wide carousels are actually handled by videoCarousel
		document.querySelectorAll(".c-carousel.is-wide").forEach((component) => {
			console.log("Initializing wide carousel:", component);
			const instance = lenus.helperFunctions.initSplideCarousel(component, {
				config: {
					gap: "3rem",
					breakpoints: {
						767: {
							// gap: "1rem",
							autoWidth: false,
						},
					},
					clones: 5,
				},
			});

			console.log("Wide carousel initialized.");
		});
	}

	function relatedProductsCarousel() {
		document.querySelectorAll(".related-products").forEach((component) => {
			console.log("Initializing related products carousel:", component);
			const instance = lenus.helperFunctions.initSplideCarousel(component, {
				config: {
					gap: "2rem",
					type: "slide",
					breakpoints: {
						767: {
							gap: "1rem",
							autoWidth: false,
						},
					},
				},
			});

			console.log("Related products carousel initialized.");
		});
	}

	function productImageCarousel() {
		// class is .product_carousel
		document.querySelectorAll(".product_carousel").forEach((component) => {
			console.log("Initializing product image carousel:", component);
			const instance = lenus.helperFunctions.initSplideCarousel(component, {
				config: {
					gap: "3rem",
					arrows: true,
					breakpoints: {
						767: {
							gap: "1rem",
						},
					},
				},
			});

			console.log("Product image carousel initialized.");
		});
	}

	function miniCarousel() {
		document.querySelectorAll(".c-carousel.is-mini").forEach((component) => {
			gsap.set(component, { autoAlpha: 0 });
			console.log("Initializing mini carousel:", component);
			const instance = lenus.helperFunctions.initSplideCarousel(component, {
				config: {
					type: "loop",
					speed: 400,
					perMove: 3,
					clones: 2,
					breakpoints: {
						767: {
							perMove: 1,
							gap: "1rem",
						},
					},
				},
				onMounted: (instance) => {
					// Find slide with .w--current link - use original slides only
					const slides = instance.Components.Slides.get();
					let targetIndex = null;
					let hasActiveSlide = false;

					// Filter out clones and only check original slides
					const originalSlides = slides.filter((slideObj) => !slideObj.isClone);

					originalSlides.forEach((slideObj, index) => {
						const currentLink = slideObj.slide.querySelector("a.w--current");
						if (currentLink) {
							targetIndex = slideObj.index; // Use the slideObj's actual index
							hasActiveSlide = true;
						}
					});

					// Set up reveal function
					const revealCarousel = () => {
						component.setAttribute("data-loaded", "true");
						gsap.to(component, { autoAlpha: 1, duration: 0.3 });
					};

					// Function to handle the final reveal logic
					const handleReveal = () => {
						if (hasActiveSlide && targetIndex !== null) {
							// Check if we're already at the target index (no movement needed)
							if (instance.index === targetIndex) {
								console.log(
									`Mini carousel already at active slide index ${targetIndex}, revealing immediately`,
								);
								revealCarousel();
							} else {
								console.log(
									`Setting mini carousel active slide to index ${targetIndex} (contains .w--current)`,
								);

								// Listen for the move completion, then reveal
								const handleMoved = () => {
									revealCarousel();
									instance.off("moved", handleMoved); // Remove listener after first use
								};

								instance.on("moved", handleMoved);
								instance.go(targetIndex);
							}
						} else {
							// Fallback: No active slide found, reveal immediately
							console.log("No active slide found in mini carousel, revealing immediately");
							revealCarousel();
						}
					};

					// Use imagesLoaded with fallback timer
					if (typeof imagesLoaded !== "undefined") {
						// Use imagesLoaded on the carousel component
						const imgLoad = imagesLoaded(component);

						// Create fallback timer (5 seconds)
						const fallbackTimer = setTimeout(() => {
							console.log("Mini carousel: fallback timer triggered after 5 seconds");
							handleReveal();
						}, 5000);

						imgLoad.on("done", () => {
							clearTimeout(fallbackTimer);
							console.log("Mini carousel: all images loaded via imagesLoaded");
							handleReveal();
						});

						imgLoad.on("fail", () => {
							clearTimeout(fallbackTimer);
							console.log("Mini carousel: some images failed to load, revealing anyway");
							handleReveal();
						});
					} else {
						// Fallback if imagesLoaded is not available
						console.warn("imagesLoaded not available, revealing mini carousel immediately");
						handleReveal();
					}
				},
			});

			console.log("Mini carousel initialized.");
		});
	}

	function featureColumns() {
		// set up splide instance for each .c-feature-cols component
		document.querySelectorAll(".c-feature-cols").forEach((component) => {
			console.log("Initializing feature columns:", component);
			const instance = lenus.helperFunctions.initSplideCarousel(component, {
				config: {
					type: "slide",
				},
			});

			console.log("Feature columns initialized.");
		});
	}

	function fancyHero() {
		const components = document.querySelectorAll(".c-fancy-hero");
		if (!components.length) return;

		// Prefer your global ResizeManager if available
		const ResizeManager = window.ResizeManager || lenus?.resizeManager;

		// Basic iOS / Safari-on-iOS detection
		const ua = navigator.userAgent || navigator.vendor || "";
		const devOverride = false; // set to true to force iOS-like mode for testing
		const isIOSDevice =
			/iP(hone|ad|od)/i.test(ua) ||
			(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
		const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
		const isIOSLike = devOverride || isIOSDevice || (isSafari && /Mobile/i.test(ua));
		console.log("[fancyHero] isIOSLike:", isIOSLike);

		components.forEach((component) => {
			const bg = component.querySelector(".fancy-hero_bg");
			if (!bg) return;

			const itemsToFade = gsap.utils.toArray(
				component.querySelectorAll(".c-social-reviews, .c-title, .c-subtitle"),
			);

			let introCtx = null;
			let scrollCtx = null;
			let tlIntro = null;
			let tlScroll = null;

			// --- intro (run once) ---
			function buildIntro() {
				if (introCtx) return;

				introCtx = gsap.context(() => {
					// Start hidden (FOUC-safe)
					gsap.set([itemsToFade, bg], { autoAlpha: 0 });
					gsap.set(component, { autoAlpha: 1 });

					tlIntro = gsap.timeline();
					tlIntro.to(
						bg,
						{
							autoAlpha: 1,
							duration: 1.5,
							ease: "power2.out",
						},
						0.5,
					);
					tlIntro.to(
						itemsToFade,
						{
							autoAlpha: 1,
							duration: 1.5,
							ease: "power2.in",
							stagger: 0.15,
						},
						2,
					);
				}, component);
			}

			// --- pinned scrub (rebuild on resize) ---
			function killScroll() {
				if (tlScroll) {
					tlScroll.scrollTrigger && tlScroll.scrollTrigger.kill();
					tlScroll.kill();
					tlScroll = null;
				}
				if (scrollCtx) {
					scrollCtx.revert();
					scrollCtx = null;
				}
			}

			function buildScroll() {
				killScroll();

				// iOS/Safari-mobile fallback: transform-only, no pinning, lighter work
				if (isIOSLike) {
					scrollCtx = gsap.context(() => {
						gsap.set(bg, {
							clearProps: "width,height,left,top,scale,borderRadius",
							willChange: "transform",
						});

						tlScroll = gsap.timeline({
							scrollTrigger: {
								trigger: component,
								start: 0,
								end: "+=600",
								scrub: 1,
								pin: true,
								pinSpacing: true,
								anticipatePin: 1,
								invalidateOnRefresh: true,
								markers: false,
							},
						});

						// Only animate scale (GPU-friendly) and let CSS control final layout
						tlScroll.from(
							bg,
							{
								scale: () => {
									// needs to be large enough to cover viewport
									const vw = window.innerWidth;
									const vh = window.innerHeight;
									const diag = Math.sqrt(vw * vw + vh * vh);
									const imgRect = bg.getBoundingClientRect();
									const imgMaxDim = Math.max(imgRect.width, imgRect.height);
									const scaleFactor = diag / imgMaxDim;
									return scaleFactor * 1.02; // slight oversize
								},
								borderRadius: "0px",
								duration: 1.2,
								ease: "power2.out",
								immediateRender: false,
							},
							0,
						);
					}, component);

					// Light refresh to ensure bounds
					ScrollTrigger.refresh();
					return;
				}

				// Default (non-iOS) path
				scrollCtx = gsap.context(() => {
					// Ensure we start from the “normal” layout state (CSS-driven end state)
					gsap.set(bg, { clearProps: "width,height,left,top,scale,borderRadius" });

					tlScroll = gsap.timeline({
						scrollTrigger: {
							trigger: component,
							start: 0,
							end: "+=600",
							scrub: 2,
							pin: true,
							pinSpacing: true,
							anticipatePin: 1,
							invalidateOnRefresh: true,
							onLeave: () => ScrollTrigger.refresh(),
						},
					});

					tlScroll.from(
						bg,
						{
							// "fullscreen-ish" start state
							scale: 1.05,
							width: "102svw",
							height: "102svh",

							// keep the oversized bg centered on the viewport
							left: () => {
								const rect = bg.getBoundingClientRect();
								return -rect.left - (window.innerWidth * 0.02) / 2 + "px";
							},
							top: () => {
								const rect = bg.getBoundingClientRect();
								return -rect.top - (window.innerHeight * 0.02) / 2 + "px";
							},

							borderRadius: "0px",
							duration: 1.75,
							ease: "power2.out",

							immediateRender: false,
						},
						0,
					);
				}, component);

				// One refresh after building helps pin spacing settle correctly
				ScrollTrigger.refresh();
			}

			// --- teardown (handy with Swup / dynamic DOM) ---
			function cleanup() {
				killScroll();
				if (introCtx) {
					introCtx.revert();
					introCtx = null;
				}

				if (ResizeManager && onResizeManaged) ResizeManager.remove(onResizeManaged);
				if (!ResizeManager && onResizeFallback)
					window.removeEventListener("resize", onResizeFallback);
			}

			// --- resize handling ---
			let onResizeManaged = null;
			let onResizeFallback = null;

			if (ResizeManager) {
				onResizeManaged = ({ widthChanged, heightChanged }) => {
					// component removed? stop listening and clean up.
					if (!component.isConnected) {
						cleanup();
						return;
					}

					// On iOS-like, ignore height-only changes (browser chrome)
					if (isIOSLike && !widthChanged) return;

					if (!widthChanged && !heightChanged) return;

					// Rebuild so measurements are correct
					buildScroll();
				};

				ResizeManager.add(onResizeManaged);
			} else {
				// fallback if ResizeManager isn't in scope for some reason
				onResizeFallback = lenus?.helperFunctions?.debounce
					? lenus.helperFunctions.debounce(() => {
							if (!component.isConnected) {
								cleanup();
								return;
							}
							// On iOS-like, avoid rebuild on pure height changes by checking width diff
							buildScroll();
						}, 250)
					: () => buildScroll();

				window.addEventListener("resize", onResizeFallback);
			}

			// --- init ---
			buildIntro();
			buildScroll();
		});
	}

	function locations() {
		const isMobile = window.matchMedia("(max-width: 768px)").matches;
		const components = document.querySelectorAll(".c-locations.splide");

		// Store all Splide instances for cross-component pause control
		const allInstances = [];

		components.forEach((component, index) => {
			// alternate components go in opposite directions
			const baseSpeed = index % 2 === 0 ? 0.75 : -0.75;
			const speed = isMobile ? baseSpeed * 0.3 : baseSpeed; // reduce speed on mobile

			// initalise Splide
			var splideInstance = new Splide(component, {
				type: "loop",
				autoWidth: true,
				arrows: false,
				pagination: false,
				snap: false,
				gap: "0",
				autoplay: false,
				drag: "free",
				autoScroll: {
					speed: speed,
					pauseOnHover: false, // Disable built-in pauseOnHover
				},
				intersection: {
					inView: {
						autoScroll: true,
					},
					outView: {
						autoScroll: false,
					},
				},
			});
			splideInstance.mount(window.splide.Extensions);

			// Store instance reference
			allInstances.push(splideInstance);

			if (isMobile) return; // Skip hover interactions on mobile

			const cards = lenus.helperFunctions.getCards(component);
			console.log("Setting up location card hover animations for", cards.length, "cards.");

			// Component-level hover handlers for autoscroll pause
			const handleComponentMouseEnter = () => {
				// Pause autoscroll on ALL instances
				allInstances.forEach((instance) => {
					if (instance.Components.AutoScroll) {
						instance.Components.AutoScroll.pause();
					}
				});
			};

			const handleComponentMouseLeave = () => {
				// Resume autoscroll on ALL instances
				allInstances.forEach((instance) => {
					if (instance.Components.AutoScroll) {
						instance.Components.AutoScroll.play();
					}
				});
			};

			// Add hover listeners to the component
			component.addEventListener("mouseenter", handleComponentMouseEnter);
			component.addEventListener("mouseleave", handleComponentMouseLeave);

			// Individual card hover animations
			cards.forEach((card) => {
				const media = card.querySelector(".location-card_media-inner");
				const details = card.querySelector(".location-card_details");
				const title = card.querySelector(".location-card_title");
				const ctaText = card.querySelector(".location-card_cta");
				gsap.set(title, { transformOrigin: "bottom left", whiteSpace: "nowrap" });

				if (!media || !details || !title || !ctaText) return;

				const tl = gsap.timeline({
					defaults: {
						duration: 0.2,
						ease: "power2.out",
					},
					paused: true,
					onStart: () => {
						// get current card width
						const cardWidth = card.offsetWidth;
						// set card width to fixed value
						gsap.set(card, {
							width: cardWidth + "px",
						});
					},
					onReverseComplete: () => {
						// reset card width to auto after animation completes
						gsap.set(card, {
							width: "auto",
						});
					},
				});

				tl.to(media, {
					scale: 1.05,
					ease: "power2.out",
					duration: 0.3,
				})
					.to(
						title,
						{
							scale: "0.95",
							ease: "power2.out",
							duration: 0.3,
						},
						"<",
					)
					.fromTo(
						ctaText,
						{
							opacity: 0,
							ease: "power2.out",
							duration: 0.2,
						},
						{
							opacity: 1,
						},
						"<",
					);

				// add hover events to the card (these don't affect autoscroll)
				card.addEventListener("mouseenter", () => {
					tl.play();
				});
				card.addEventListener("mouseleave", () => {
					tl.reverse();
				});
			});
		});
	}

	function mapbox() {
		// Set your Mapbox access token
		mapboxgl.accessToken = lenus.mapboxToken; // set in WF site header

		// Find all map components on the page
		const mapComponents = document.querySelectorAll(".c-map");

		mapComponents.forEach((mapComponent) => {
			const mapContainer = mapComponent.querySelector(".map_inner");
			if (!mapContainer) return;

			let lat = mapComponent.getAttribute("data-lat");
			let lng = mapComponent.getAttribute("data-long");

			if (!lat || !lng) {
				return;
			}

			// Get lat/long from data attributes, fallback to defaults if missing
			lat = parseFloat(mapComponent.getAttribute("data-lat"));
			lng = parseFloat(mapComponent.getAttribute("data-long"));

			const map = new mapboxgl.Map({
				container: mapContainer,
				// style: "mapbox://styles/spurwing-sp/cm0pfyq2r00je01pb5lf74zb3",
				center: [lng, lat],
				zoom: 15,
			});

			const markerEl = document.createElement("div");
			markerEl.className = "marker";
			markerEl.innerHTML = `
		<svg width="32" height="37" viewBox="0 0 32 37" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.05446 27.5L0 36.5V12.4996C0 10.4995 0.766078 8.73966 2.01223 7.49988L9.05446 0.5V27.5Z" fill="black"/>
<path d="M31.6874 18.5H18.1091L9.05469 27.5H19.6141C21.3562 27.4899 23.4081 26.7216 24.6441 25.4999L31.6874 18.5Z" fill="black"/>
</svg>`;

			new mapboxgl.Marker(markerEl).setLngLat([lng, lat]).addTo(map);
			const nav = new mapboxgl.NavigationControl();
			map.addControl(nav, "bottom-right");

			if (window.matchMedia("(pointer: coarse)").matches) {
				map.dragPan.disable();
				map.scrollZoom.disable();
				map.touchZoomRotate.disable();
			}
		});
	}

	function scatterHero() {
		const config = {
			posYOffset: {
				desktop: 300,
				mobile: 100,
			},
			fadeDuration: 0.5,
			transformDuration: 1,
			stagger: 0.05,
		};

		const isMobile = () => window.innerWidth <= 768;

		// Animate images to scattered positions
		const animateInTl = (componentObj) => {
			const component = componentObj.component;

			const tl = gsap.timeline({ paused: true });
			tl.timeScale(0.85);

			if (isMobile()) {
				const allImgs = Array.from(component.querySelectorAll(".scatter-img"));

				// Animate only target images
				tl.from(allImgs, {
					y: config.posYOffset.mobile,
					autoAlpha: 0,
					rotation: 0,
					duration: config.transformDuration,
					ease: "power3.out",
					stagger: { amount: config.stagger, from: "random" },
				});
			} else {
				// DESKTOP: original logic
				tl.from(component.querySelectorAll(".scatter-img"), {
					y: config.posYOffset.desktop,
					autoAlpha: 0,
					rotation: 0,
					duration: config.transformDuration,
					ease: "power3.out",
					stagger: { amount: config.stagger, from: "random" },
				});
			}

			tl.eventCallback("onComplete", () => {
				componentObj.inAnimationCompleted = true;
				// Disable draggable on mobile
				if (!isMobile()) {
					setupDraggable(componentObj);
				}
			});

			return tl;
		};

		function setupDraggable(componentObj) {
			if (isMobile()) return; // mobile: no draggable
			const component = componentObj.component;
			const section = componentObj.section;
			const imgs = component.querySelectorAll(".scatter-img");
			if (!imgs.length) return;

			imgs.forEach((el) => {
				const rotationDrag = new Draggable(el, {
					type: "rotation",
					throwProps: true,
					inertia: true,
					zIndexBoost: false,
					onPress: setDraggable,
				}).disable();

				const translateDrag = new Draggable(el, {
					// bounds: section,
					throwProps: true,
					inertia: true,
					zIndexBoost: false,
					onPress: setDraggable,
				});

				function setDraggable(event) {
					const isRotation = this.vars.type === "rotation";
					const isCorner = event.target.classList.contains("scatter-img_corner");
					if (isCorner && !isRotation) {
						translateDrag.disable();
						rotationDrag.enable().startDrag(event);
					} else if (!isCorner && isRotation) {
						rotationDrag.disable();
						translateDrag.enable().startDrag(event);
					}
				}
			});
		}

		document.querySelectorAll(".c-scatter-hero").forEach((component) => {
			const allImages = gsap.utils.toArray(".scatter-img", component);

			const componentObj = {
				component,
				section: component.closest(".section"),
				images: allImages,
				inAnimationCompleted: false,
				outAnimationToRun: false,
			};

			componentObj.tl_in = animateInTl(componentObj);

			const loadPromises = componentObj.images.map((imgWrap) => {
				const img = imgWrap.querySelector("img") || imgWrap;
				if (!img) return Promise.resolve();
				if (img.complete) return Promise.resolve();
				return new Promise((resolve) => {
					img.addEventListener("load", resolve);
					img.addEventListener("error", resolve);
				});
			});

			Promise.all(loadPromises).then(() => {
				componentObj.tl_in.play();
			});

			ScrollTrigger.create({
				trigger: component,
				start: "bottom 80%",
				end: "bottom 79%",
				onEnter: () => {
					componentObj.outAnimationToRun = true;
					if (!componentObj.inAnimationCompleted) return;
				},
			});
		});
	}

	function pastEvents() {
		document.querySelectorAll(".c-past-events").forEach((component) => {
			lenus.helperFunctions.initSplideCarousel(component, {
				config: {
					type: "loop",
					autoWidth: true,
					arrows: true,
					pagination: false,
					snap: true,
					gap: "1.5rem",
					autoplay: false,
					drag: "free",
				},
				responsive: {
					breakpoint: 768,
					mobileOnly: true, // Only create carousel on mobile
				},
			});
		});
	}
	function customSubmitButtons() {
		document.querySelectorAll('[data-custom-submit="true"]').forEach((customBtn) => {
			customBtn.addEventListener("click", function (e) {
				e.preventDefault();

				const form = this.closest("form");

				// Find the real submit button (can be a selector or an ID)
				const realSubmit = form.querySelector('[data-custom-submit="target"]');

				if (realSubmit) {
					realSubmit.click();
				}
			});
		});
	}

	function hiddenFormFields() {
		const FIELDS = ["page-url", "page-title", "event-name"];

		const getEventName = () => {
			const h1 = document.querySelector("h1");
			return h1 ? h1.textContent.trim() : "";
		};

		const getValues = () => ({
			"page-url": window.location.href,
			"page-title": document.title || "",
			"event-name": getEventName(),
		});

		const setInputValue = (input, value) => {
			if (!input) return;
			input.value = value;
			input.setAttribute("value", value);
			console.log(`Set value for ${input.name || input.id}: ${value}`);
		};

		const updateForm = (form) => {
			const values = getValues();
			FIELDS.forEach((key) => {
				const inputs = form.querySelectorAll(`input[name="${key}"], input#${key}`);
				inputs.forEach((inp) => setInputValue(inp, values[key]));
			});
		};

		// for each form
		document.querySelectorAll("form").forEach((form) => {
			updateForm(form);
		});
	}

	function rangeSlider() {
		document.querySelectorAll(".c-range-slider").forEach((wrapper) => {
			const slider = wrapper.querySelector('input[type="range"]');
			const valueDisplay = wrapper.querySelector(".range-value");

			// Read attributes
			const min = parseFloat(wrapper.getAttribute("data-min"));
			const max = parseFloat(wrapper.getAttribute("data-max"));
			const maxText = wrapper.getAttribute("data-max-text") || null;

			slider.min = min;
			slider.max = max;

			// Create a hidden field to submit the label (e.g., "100+") in addition to the numeric value
			// Name it "<sliderName>_label" so you can find it server-side.
			let labelField = wrapper.querySelector('input[type="hidden"][data-range-label]');
			if (!labelField) {
				labelField = document.createElement("input");
				labelField.type = "hidden";
				labelField.setAttribute("data-range-label", "");
				labelField.name = (slider.name || "range") + " (max text)";
				wrapper.appendChild(labelField);
			}

			const updateDisplays = () => {
				const current = parseFloat(slider.value);
				const threshold = min + (max - min) * 0.95; // 95%

				const label = maxText && current > threshold ? maxText : String(current);
				valueDisplay.textContent = label;

				// Submit both:
				// - slider.value => numeric (e.g., 97)
				// - labelField.value => label (e.g., "100+")
				labelField.value = label;
			};

			slider.addEventListener("input", updateDisplays);
			updateDisplays();
		});
	}

	function featBlogCard() {
		const mql = window.matchMedia("(max-width: 768px)");
		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		document.querySelectorAll(".c-feat-blog-card").forEach((card) => {
			const title = card.querySelector(".c-title");
			const footer = card.querySelector(".feat-blog-card_footer");
			const header = card.querySelector(".feat-blog-card_header");
			const overline = card.querySelector(".overline");

			// bail if critical bits are missing
			if (!title || !footer || !header) return;

			const tl = gsap.timeline({
				defaults: { duration: 0.5, ease: "power2.out" },
				paused: true,
			});

			// initial state
			gsap.set(footer, { y: "100%", autoAlpha: 0 });
			gsap.set(header, { y: () => footer.offsetHeight });

			// build timeline (guard overline)
			if (overline) {
				tl.to(overline, { y: () => title.offsetHeight * 0.33 }, 0);
			}
			tl.to(title, { scale: 0.67, transformOrigin: "bottom left" }, 0)
				.to(header, { y: 0 }, 0)
				.to(footer, { y: 0, autoAlpha: 1 }, 0);

			function handleHoverIn() {
				if (!reduceMotion) tl.play();
			}
			function handleHoverOut() {
				if (!reduceMotion) tl.reverse();
			}

			let eventListenersEnabled = false;
			function enableHover() {
				if (eventListenersEnabled) return;
				card.addEventListener("mouseenter", handleHoverIn);
				card.addEventListener("mouseleave", handleHoverOut);
				// keyboard focus for a11y
				card.addEventListener("focusin", handleHoverIn);
				card.addEventListener("focusout", handleHoverOut);
				eventListenersEnabled = true;
			}
			function disableHover() {
				if (!eventListenersEnabled) return;
				card.removeEventListener("mouseenter", handleHoverIn);
				card.removeEventListener("mouseleave", handleHoverOut);
				card.removeEventListener("focusin", handleHoverIn);
				card.removeEventListener("focusout", handleHoverOut);
				eventListenersEnabled = false;
				tl.progress(0).pause(); // reset when leaving desktop
			}

			// set initial state based on viewport
			if (!mql.matches) enableHover();

			// media query change is better than raw resize
			function onMQChange(e) {
				e.matches ? disableHover() : enableHover();
			}
			mql.addEventListener("change", onMQChange);

			// // Optional: expose a destroy hook if you re-init on page changes
			// card._featBlogCleanup = () => {
			// 	disableHover();
			// 	mql.removeEventListener("change", onMQChange);
			// 	tl.kill();
			// };
		});

		// Example global cleanup if you navigate with Swup/Barba etc.
		// window.addEventListener("unload", () =>
		//   document.querySelectorAll(".c-feat-blog-card").forEach(c => c._featBlogCleanup?.())
		// );
	}

	function jobScroll() {
		/*
			Job Scroll
			- Desktop: GSAP vertical loop (draggable)
			- Tablet/mobile (<= 991px): two GSAP horizontal marquees, opposite directions
		*/

		const DEBUG = window.__LENUS_JOBSCROLL_DEBUG__ ?? true;
		const LOG_PREFIX = "[jobScroll]";
		const log = (...args) => DEBUG && console.log(LOG_PREFIX, ...args);
		const warn = (...args) => DEBUG && console.warn(LOG_PREFIX, ...args);
		const error = (...args) => DEBUG && console.error(LOG_PREFIX, ...args);

		const bp_tab = 991;
		const mm = window.matchMedia(`(max-width: ${bp_tab}px)`);
		const components = document.querySelectorAll(".c-job-scroll");
		log(`init: found ${components.length} component(s)`, { bp_tab, matches: mm.matches });

		components.forEach((component, index) => {
			const componentLabel = component.id
				? `#${component.id}`
				: component.getAttribute("data-component")
					? `[data-component='${component.getAttribute("data-component")}']`
					: `.c-job-scroll[${index}]`;

			log("component init", componentLabel, component);
			const state = {
				mode: null,
				loop: null, //GSAP timeline
				cloneItems: [],
				cloneInstance: [],
				dupInstance: null,
				_resizeHandler: null,
				_mqHandler: null,
				_timeouts: [],
				tabletLoops: [],
				tabletCloneItems: [],
				tabletHoverUnsubs: [],
			};

			component._jobScroll = state;
			if (DEBUG) {
				console.groupCollapsed(`${LOG_PREFIX} ${componentLabel}`);
				console.log("component state (initial)", state);
				console.groupEnd();
			}

			const init = () => {
				const isTablet = mm.matches;
				log(`${componentLabel} init()`, { isTablet, prevMode: state.mode });
				if (isTablet && state.mode !== "tablet") {
					log(`${componentLabel} switching -> tablet`);
					teardownDesktop(component);
					initTablet(component);
				} else if (!isTablet && state.mode !== "desktop") {
					log(`${componentLabel} switching -> desktop`);
					teardownTablet(component);
					initDesktop(component);
				} else {
					log(`${componentLabel} no mode change`, { mode: state.mode });
				}
			};

			function initDesktop(root) {
				const instance = root.querySelector(".job-scroll_instance");
				const list = root.querySelector(".job-scroll_list");
				let items = gsap.utils.toArray(".job-scroll_item", root);
				if (!instance || !list || items.length === 0) {
					warn(`${componentLabel} desktop init aborted: missing DOM`, {
						hasInstance: !!instance,
						hasList: !!list,
						items: items.length,
					});
					return;
				}

				log(`${componentLabel} initDesktop`, {
					items: items.length,
					instanceHeight: instance.offsetHeight,
					componentHeight: component.offsetHeight,
				});

				// if instance is not tall enough to cover component, duplicate items
				if (instance.offsetHeight < component.offsetHeight) {
					const cloneCount = Math.ceil(component.offsetHeight / instance.offsetHeight) - 1;
					log(`${componentLabel} desktop: duplicating items`, {
						cloneCount,
						instanceHeight: instance.offsetHeight,
						componentHeight: component.offsetHeight,
					});
					const clonesAdded = [];
					for (let i = 0; i < cloneCount; i++) {
						const current = Array.from(list.querySelectorAll(".job-scroll_item:not(.clone)"));
						log(`${componentLabel} desktop: clone pass`, {
							pass: i + 1,
							sourceItems: current.length,
						});

						current.forEach((item) => {
							const clone = item.cloneNode(true);
							clone.classList.add("clone");
							list.appendChild(clone);
							clonesAdded.push(clone);
						});
					}
					// track clones so they can be removed on teardown
					state.cloneItems.push(...clonesAdded);
					log(`${componentLabel} desktop: clones added`, { clones: clonesAdded.length });
					// refresh items to include clones
					items = gsap.utils.toArray(".job-scroll_item", root);
					log(`${componentLabel} desktop: items after clone`, { items: items.length });
				} else {
					log(`${componentLabel} desktop: no clones needed`);
				}

				try {
					state.loop = lenus.helperFunctions.verticalLoop(items, {
						draggable: true,
						center: true,
						repeat: -1,
						speed: 0.5,
					});
					log(`${componentLabel} desktop: GSAP loop created`, state.loop);
				} catch (e) {
					error(`${componentLabel} desktop: failed to create GSAP loop`, e);
				}

				state.mode = "desktop";
				log(`${componentLabel} mode set`, state.mode);
			}

			function initTablet(root) {
				const baseInstance = root.querySelector(".job-scroll_instance");
				const baseList = root.querySelector(".job-scroll_list");
				let items = gsap.utils.toArray(".job-scroll_item", root);
				if (!baseInstance || !baseList || items.length === 0) {
					warn(`${componentLabel} tablet init aborted: missing DOM`, {
						hasBaseInstance: !!baseInstance,
						hasBaseList: !!baseList,
						items: items.length,
					});
					return;
				}

				log(`${componentLabel} initTablet`, { items: items.length });

				// duplicate instance to create second marquee
				const cloneInstance = baseInstance.cloneNode(true);
				baseInstance.after(cloneInstance);
				state.dupInstance = cloneInstance;
				log(`${componentLabel} tablet: duplicated instance`, cloneInstance);

				// --- GSAP marquee helpers (no Splide JS) ---
				const ensureMarqueeFill = (instanceEl) => {
					const list =
						instanceEl.querySelector(".job-scroll_list") ||
						instanceEl.querySelector(".splide__list");
					if (!list) {
						warn(`${componentLabel} tablet: missing list in instance`, instanceEl);
						return;
					}
					const originals = Array.from(list.querySelectorAll(".job-scroll_item"));
					if (originals.length === 0) {
						warn(`${componentLabel} tablet: no .job-scroll_item found for marquee`, instanceEl);
						return;
					}
					const targetWidth = (instanceEl.getBoundingClientRect().width || 0) * 2;
					if (!targetWidth) return;
					let safety = 0;
					while (list.scrollWidth < targetWidth && safety < 6) {
						safety++;
						originals.forEach((node) => {
							const clone = node.cloneNode(true);
							clone.classList.add("js-marquee-clone");
							list.appendChild(clone);
							state.tabletCloneItems.push(clone);
						});
					}
					log(`${componentLabel} tablet: marquee fill`, {
						listWidth: list.scrollWidth,
						targetWidth,
						clonesAdded: state.tabletCloneItems.filter((c) => instanceEl.contains(c)).length,
					});
				};

				const buildGsapMarquee = (instanceEl, { reversed }) => {
					ensureMarqueeFill(instanceEl);
					const marqueeItems = gsap.utils.toArray(".job-scroll_item", instanceEl);
					if (marqueeItems.length === 0) return null;

					// Clear any leftover x/transform from previous inits
					marqueeItems.forEach((el) => gsap.set(el, { clearProps: "transform" }));

					try {
						const tl = lenus.helperFunctions.horizontalLoop(marqueeItems, {
							repeat: -1,
							speed: 0.6,
							reversed: !!reversed,
							paused: false,
						});
						log(`${componentLabel} tablet: GSAP horizontalLoop created`, {
							reversed: !!reversed,
							items: marqueeItems.length,
						});
						return tl;
					} catch (e) {
						error(`${componentLabel} tablet: horizontalLoop failed`, e);
						return null;
					}
				};

				const tl1 = buildGsapMarquee(baseInstance, { reversed: false });
				const tl2 = buildGsapMarquee(cloneInstance, { reversed: true });
				state.tabletLoops = [tl1, tl2].filter(Boolean);
				log(`${componentLabel} tablet: GSAP marquees ready`, { count: state.tabletLoops.length });

				// Pause/resume on hover (helps UX and makes it obvious it's running)
				const bindHoverPause = (instanceEl, timelines) => {
					const onEnter = () => {
						log(`${componentLabel} tablet: hover pause`);
						timelines.forEach((t) => t?.pause?.());
					};
					const onLeave = () => {
						log(`${componentLabel} tablet: hover resume`);
						timelines.forEach((t) => t?.play?.());
					};
					instanceEl.addEventListener("mouseenter", onEnter);
					instanceEl.addEventListener("mouseleave", onLeave);
					return () => {
						instanceEl.removeEventListener("mouseenter", onEnter);
						instanceEl.removeEventListener("mouseleave", onLeave);
					};
				};

				state.tabletHoverUnsubs.push(bindHoverPause(baseInstance, state.tabletLoops));
				state.tabletHoverUnsubs.push(bindHoverPause(cloneInstance, state.tabletLoops));

				state.mode = "tablet";
				log(`${componentLabel} mode set`, state.mode);
			}

			function teardownTablet(root) {
				log(`${componentLabel} teardownTablet()`);
				// cancel any deferred init timeouts (legacy)
				if (state._timeouts?.length) {
					state._timeouts.forEach((id) => clearTimeout(id));
					state._timeouts = [];
				}

				// unbind hover listeners
				if (state.tabletHoverUnsubs?.length) {
					state.tabletHoverUnsubs.forEach((fn) => {
						try {
							fn();
						} catch (e) {}
					});
					state.tabletHoverUnsubs = [];
				}

				// kill GSAP marquees
				if (state.tabletLoops?.length) {
					state.tabletLoops.forEach((tl) => {
						try {
							tl.kill();
						} catch (e) {
							error(`${componentLabel} tablet: marquee kill failed`, e);
						}
					});
					state.tabletLoops = [];
					log(`${componentLabel} tablet: marquees killed`);
				}

				// remove JS clones added for marquee fill
				if (state.tabletCloneItems?.length) {
					state.tabletCloneItems.forEach((n) => n.remove());
					log(`${componentLabel} tablet: removed marquee clones`, {
						count: state.tabletCloneItems.length,
					});
					state.tabletCloneItems = [];
				}

				// clear any x transforms from items
				gsap.utils.toArray(".job-scroll_item", root).forEach((item) => {
					gsap.set(item, { clearProps: "transform" });
				});

				// remove duplicate instance
				if (state.dupInstance) {
					state.dupInstance.remove();
					state.dupInstance = null;
					log(`${componentLabel} tablet: duplicate instance removed`);
				}
			}

			function teardownDesktop(root) {
				log(`${componentLabel} teardownDesktop()`);
				// destroy loop
				if (state.loop) {
					log(`${componentLabel} desktop: killing GSAP loop`);
					try {
						// verticalLoop optionally attaches Draggable; explicitly kill it to avoid
						// lingering pointer handlers during mode switches.
						state.loop.draggable?.kill?.();
						state.loop.kill();
					} catch (e) {
						error(`${componentLabel} desktop: loop.kill failed`, e);
					}
					state.loop = null;
				}

				// remove any clones
				state.cloneItems.forEach((item) => item.remove());
				if (state.cloneItems.length)
					log(`${componentLabel} desktop: clones removed`, { count: state.cloneItems.length });
				state.cloneItems = [];

				// remove transforms set by GSAP from all items
				gsap.utils.toArray(".job-scroll_item", root).forEach((item) => {
					gsap.set(item, { clearProps: true });
				});
				log(`${componentLabel} desktop: cleared GSAP props from items`);
			}

			init();

			// Prefer breakpoint change events over resize for mode switching
			state._mqHandler = (e) => {
				log(`${componentLabel} media query change`, { matches: e.matches });
				init();
			};
			try {
				if (mm.addEventListener) mm.addEventListener("change", state._mqHandler);
				else if (mm.addListener) mm.addListener(state._mqHandler);
			} catch (e) {
				warn(`${componentLabel} failed to bind media query listener`, e);
			}

			function handleResize() {
				log(`${componentLabel} resize`);
				// hide element temporarily
				component.style.opacity = "0";
				init();
				// wait for 200ms
				setTimeout(() => {
					component.style.opacity = "";
				}, 200);
			}

			// on resize
			state._resizeHandler = lenus.helperFunctions.debounce(handleResize);
			window.addEventListener("resize", state._resizeHandler);
			log(`${componentLabel} listeners bound`, { resize: true, mq: true });
		});
	}

	function navHover() {
		const state = {
			menu: null,
			items: [],
			expandBtn: null,
			hoverables: [],
			highlight: null, // this is the moving highlight that follows the mouse
			passiveHighlight: null, // this is the one that doesn't move and remains under the "active" item at all times
			activeItem: null, // .c-nav-item element
			activeAnchor: null, // <a> inside .c-nav-item
			itemClicked: false,
			moveTween: null,
			fadeTween: null,
			handlers: {
				mouseenters: [],
				menuMouseleave: null,
				itemClicks: [],
				mousedowns: [],
				mouseups: [],
				resize: null,
			},
			inited: false,
			variables: {
				activeLinkColor: "var(--_theme---nav--link-active)",
				inactiveLinkColor: "var(--_theme---nav--link-inactive)",
				highlightBg: "var(--_theme---nav--accent)",
				highlightBgHover: "var(--_theme---nav--accent-hover)",
				highlightBgPressed: "var(--_theme---nav--accent-pressed)",
			},
		};

		function qsAllArray(sel, root = document) {
			return Array.from(root.querySelectorAll(sel));
		}

		function getRects(target) {
			const menuRect = state.menu.getBoundingClientRect();
			const rect = target.getBoundingClientRect();
			return {
				width: rect.width,
				left: rect.left - menuRect.left,
			};
		}

		function setHighlightOpacity(visible) {
			if (!state.highlight) return;
			if (state.fadeTween) state.fadeTween.kill();

			state.fadeTween = gsap.to(state.highlight, {
				autoAlpha: visible ? 1 : 0,
				duration: 0.25,
				ease: "power2.out",
				onComplete: () => {
					if (!visible) {
						gsap.set(state.highlight, {
							"--nav--menu-bg-w": "0px",
							"--nav--menu-bg-l": "0px",
						});
					}
				},
			});
		}

		function setHighlightColor(highlight = state.highlight, color) {
			if (!highlight) return;

			// Get the current computed background color to ensure smooth transition
			const currentColor = getComputedStyle(highlight).backgroundColor;

			gsap.fromTo(
				highlight,
				{
					backgroundColor: currentColor,
				},
				{
					backgroundColor: color,
					duration: 0.15,
					ease: "power2.out",
				},
			);
		}

		function colorAllInactive() {
			gsap.to(state.hoverables, {
				color: state.variables.inactiveLinkColor,
				duration: 0.2,
				ease: "power3.out",
			});
		}

		function colorTargetActive(target) {
			gsap.to(target, {
				color: state.variables.activeLinkColor,
				duration: 0.2,
				ease: "power3.out",
			});
		}

		function moveHighlightTo(highlight = state.highlight, target, animate = true) {
			if (!state.menu || !highlight || !target) return;
			if (state.itemClicked) return; // avoid anim jank on click nav

			const { width, left } = getRects(target);

			let adjustedLeft = left;
			let adjustedWidth = width;

			// get border width and adjust accordingly
			const borderWidth = parseFloat(
				getComputedStyle(highlight).getPropertyValue("border-left-width"),
			);
			adjustedLeft += borderWidth;
			adjustedWidth -= borderWidth * 2;

			// minus a pixel from width each side to keep space between highlights
			adjustedLeft += 1;
			adjustedWidth -= 2;

			if (state.moveTween) state.moveTween.kill();

			const isHidden = gsap.getProperty(highlight, "autoAlpha") < 0.5;
			if (!animate || isHidden) {
				gsap.set(highlight, {
					"--nav--menu-bg-w": `${adjustedWidth}px`,
					"--nav--menu-bg-l": `${adjustedLeft}px`,
				});
				setHighlightOpacity(true);
			} else {
				state.moveTween = gsap.to(highlight, {
					"--nav--menu-bg-w": `${adjustedWidth}px`,
					"--nav--menu-bg-l": `${adjustedLeft}px`,
					duration: 0.3,
					ease: "power2.out",
				});
			}

			// colors
			colorAllInactive();
			colorTargetActive(target);
		}

		function makeHighlight(elClassModifier = null) {
			const el = document.createElement("div");
			el.classList.add("nav_menu-highlight");
			if (elClassModifier) el.classList.add(elClassModifier);
			state.menu.prepend(el);
			return el;
		}

		function findInitialActive() {
			// Prefer Webflow's .w--current or any persisted .is-current
			const activeLink =
				document.querySelector(".nav-item_link.w--current") ||
				document.querySelector(".nav-item_link.is-current");

			if (!activeLink) return { item: null, anchor: null };

			const item = activeLink.closest(".c-nav-item");
			return { item, anchor: activeLink };
		}

		function setAnchorCurrent(anchor, isCurrent) {
			if (!anchor) return;
			anchor.classList.toggle("is-current", !!isCurrent);
			// Optional: if you want to strip Webflow's .w--current once we've taken over
			anchor.classList.remove("w--current");
		}

		function clearAllCurrents() {
			qsAllArray(".nav-item_link.is-current").forEach((a) => a.classList.remove("is-current"));
		}

		function applyActive(targetItem) {
			state.activeItem = targetItem || null;
			state.activeAnchor = state.activeItem
				? state.activeItem.querySelector(".nav-item_link")
				: null;

			clearAllCurrents();
			if (state.activeAnchor) setAnchorCurrent(state.activeAnchor, true);

			if (state.activeItem) {
				// Position both highlights only after fonts are ready

				const positionHighlights = () => {
					if (state.activeItem) {
						// Position the active highlight
						moveHighlightTo(state.highlight, state.activeItem, false);

						// Position the passive highlight if it exists
						if (state.passiveHighlight) {
							moveHighlightTo(state.passiveHighlight, state.activeItem, false);
							gsap.set(state.passiveHighlight, { autoAlpha: 1 });
						}
					}
				};

				if (document.fonts && document.fonts.ready) {
					document.fonts.ready.then(positionHighlights);
				} else {
					// Fallback - wait a bit longer for fonts
					setTimeout(positionHighlights, 200);
				}
			} else {
				// no active
				setHighlightOpacity(false);
				colorAllInactive();
				if (state.expandBtn)
					gsap.set(state.expandBtn, { color: state.variables.inactiveLinkColor });
			}
		}

		function wireHoverHandlers() {
			// element hovers
			state.hoverables.forEach((el) => {
				const hoverHandler = () => {
					moveHighlightTo(state.highlight, el, true);
					setHighlightColor(state.highlight, state.variables.highlightBgHover);
				};

				const mousedownHandler = () => {
					setHighlightColor(state.highlight, state.variables.highlightBgPressed);
				};

				const mouseupHandler = () => {
					setHighlightColor(state.highlight, state.variables.highlightBgHover);
				};

				el.addEventListener("mouseenter", hoverHandler);
				el.addEventListener("mousedown", mousedownHandler);
				el.addEventListener("mouseup", mouseupHandler);
				state.handlers.mouseenters.push({ el, h: hoverHandler });
				state.handlers.mousedowns.push({ el, h: mousedownHandler });
				state.handlers.mouseups.push({ el, h: mouseupHandler });
			});

			// leave menu => return to active (if any)
			const onLeave = () => {
				setHighlightColor(state.highlight, state.variables.highlightBg); // reset highlight color
				if (state.activeItem) {
					moveHighlightTo(state.highlight, state.activeItem, true);
				} else {
					setHighlightOpacity(false);
					colorAllInactive();
				}
			};
			state.menu.addEventListener("mouseleave", onLeave);
			state.handlers.menuMouseleave = onLeave;

			// click → suppress subsequent hover animation until next resize - unless we are on blog listing or store pages (where nav reflects current page)
			state.items.forEach((item) => {
				const h = () => {
					// if page URL contains '/blog' or '/store' then ignore click suppression
					if (
						window.location.pathname.includes("/blog") ||
						window.location.pathname.includes("/store")
					) {
						return;
					}
					state.itemClicked = true;
				};
				item.addEventListener("click", h);
				state.handlers.itemClicks.push({ el: item, h });
			});

			// resize
			const onResize = lenus.helperFunctions.debounce(() => {
				state.itemClicked = false;

				if (!state.highlight) return;

				if (state.activeItem) {
					const { width, left } = getRects(state.activeItem);
					gsap.set(state.highlight, {
						autoAlpha: 1,
						"--nav--menu-bg-w": `${width}px`,
						"--nav--menu-bg-l": `${left}px`,
					});

					// Also update passive highlight if it exists
					if (state.passiveHighlight) {
						gsap.set(state.passiveHighlight, {
							autoAlpha: 1,
							"--nav--menu-bg-w": `${width}px`,
							"--nav--menu-bg-l": `${left}px`,
						});
					}

					colorAllInactive();
					colorTargetActive(state.activeItem);
				} else {
					gsap.set(state.highlight, {
						autoAlpha: 0,
						"--nav--menu-bg-w": "0px",
						"--nav--menu-bg-l": "0px",
					});

					// Hide passive highlight too when no active item
					if (state.passiveHighlight) {
						gsap.set(state.passiveHighlight, {
							autoAlpha: 0,
							"--nav--menu-bg-w": "0px",
							"--nav--menu-bg-l": "0px",
						});
					}

					colorAllInactive();
				}

				if (state.expandBtn)
					gsap.set(state.expandBtn, { color: state.variables.inactiveLinkColor });
			}, 200);

			window.addEventListener("resize", onResize);
			state.handlers.resize = onResize;
		}

		function unwireHandlers() {
			// element hovers
			state.handlers.mouseenters.forEach(({ el, h }) => el.removeEventListener("mouseenter", h));
			state.handlers.mouseenters = [];

			// mousedown handlers
			state.handlers.mousedowns.forEach(({ el, h }) => el.removeEventListener("mousedown", h));
			state.handlers.mousedowns = [];

			// mouseup handlers
			state.handlers.mouseups.forEach(({ el, h }) => el.removeEventListener("mouseup", h));
			state.handlers.mouseups = [];

			// menu leave
			if (state.handlers.menuMouseleave) {
				state.menu?.removeEventListener("mouseleave", state.handlers.menuMouseleave);
			}
			state.handlers.menuMouseleave = null;

			// clicks
			state.handlers.itemClicks.forEach(({ el, h }) => el.removeEventListener("click", h));
			state.handlers.itemClicks = [];

			// resize
			if (state.handlers.resize) window.removeEventListener("resize", state.handlers.resize);
			state.handlers.resize = null;
		}

		function collectDom(options) {
			const root = options?.root || document;
			state.menu = root.querySelector(".nav_menu");
			state.items = gsap.utils.toArray(root.querySelectorAll(".c-nav-item"));
			state.expandBtn = root.querySelector(".nav_expand-btn.is-menu");
			state.hoverables = [...state.items];
			if (state.expandBtn) state.hoverables.push(state.expandBtn);
		}

		function ensureHighlight() {
			if (!state.menu) return;
			// Prevent duplicate highlights on re-init
			const existingActiveHighlight = state.menu.querySelector(".nav_menu-highlight");
			state.highlight = existingActiveHighlight || makeHighlight();
		}

		function ensurePassiveHighlight() {
			if (!state.menu) return;

			// Prevent duplicate passive highlights on re-init
			const existingPassiveHighlight = state.menu.querySelector(".nav_menu-highlight.is-passive");
			state.passiveHighlight = existingPassiveHighlight || makeHighlight("is-passive");

			// Initially hide passive highlight until properly positioned
			if (state.passiveHighlight) {
				gsap.set(state.passiveHighlight, { autoAlpha: 0 });
			}
		}

		// PUBLIC API
		function init(options = {}) {
			kill(); // clean slate if already inited

			collectDom(options);
			if (!state.menu || !state.items.length) {
				state.inited = false;
				return;
			}

			ensureHighlight();

			const { item } = findInitialActive();

			// only create passive highlight if we have an active item
			// (otherwise it just sits there doing nothing)
			if (item) {
				ensurePassiveHighlight();
			}

			// initial placement
			applyActive(item);

			// default hidden when no active
			if (!item) {
				gsap.set(state.highlight, {
					autoAlpha: 0,
					"--nav--menu-bg-w": "0px",
					"--nav--menu-bg-l": "0px",
				});
			}

			wireHoverHandlers();
			state.inited = true;
			return api; // allow chaining if you want
		}

		// Re-scan DOM and re-place highlight (use if nav items change without full re-init)
		function refresh(options = {}) {
			if (!state.inited) return init(options);
			unwireHandlers();

			const currentActive = state.activeItem; // remember
			collectDom(options);
			ensureHighlight();
			wireHoverHandlers();

			// Re-apply active if still present, otherwise compute again
			if (currentActive && state.items.includes(currentActive)) {
				applyActive(currentActive);
			} else {
				const { item } = findInitialActive();
				applyActive(item);
			}
		}

		function kill({ removeHighlight = false } = {}) {
			unwireHandlers();

			if (state.moveTween) state.moveTween.kill();
			if (state.fadeTween) state.fadeTween.kill();
			state.moveTween = null;
			state.fadeTween = null;

			if (removeHighlight && state.highlight && state.highlight.parentNode) {
				state.highlight.parentNode.removeChild(state.highlight);
			}

			// clear references
			state.menu = null;
			state.items = [];
			state.expandBtn = null;
			state.hoverables = [];
			state.highlight = null;
			state.passiveHighlight = null;
			state.activeItem = null;
			state.activeAnchor = null;
			state.itemClicked = false;
			state.inited = false;
		}

		// External controls
		// - target can be: Element (.c-nav-item or an <a> inside it), a selector, or an index
		function setActive(target) {
			if (!state.inited) return;

			let itemEl = null;

			if (typeof target === "number") {
				itemEl = state.items[target] || null;
			} else if (typeof target === "string") {
				const found = document.querySelector(target);
				itemEl = found ? found.closest(".c-nav-item") || found : null;
			} else if (target instanceof Element) {
				itemEl = target.closest(".c-nav-item") || target;
			}

			applyActive(itemEl);
		}

		function setActiveByHref(href, { exact = false } = {}) {
			if (!state.inited) return;

			const anchors = qsAllArray(".c-nav-item .nav-item_link", state.menu || document);
			const url = href || window.location.pathname + window.location.search + window.location.hash;

			let match = null;
			anchors.some((a) => {
				const aHref = a.getAttribute("href") || "";
				if (exact ? aHref === url : url.startsWith(aHref)) {
					match = a;
					return true;
				}
				return false;
			});

			setActive(match || null);
		}

		function clearActive() {
			setActive(null);
		}

		function getState() {
			return {
				inited: state.inited,
				hasHighlight: !!state.highlight,
				items: state.items.length,
				activeIndex: state.activeItem ? state.items.indexOf(state.activeItem) : -1,
				activeText: state.activeAnchor?.textContent?.trim() || null,
			};
		}

		const api = { init, refresh, kill, setActive, setActiveByHref, clearActive, getState };

		// expose
		lenus.navHover = api;
	}

	function navOpen() {
		const nav = document.querySelector(".nav");
		const navBtn = document.querySelector(".nav_expand-btn.is-menu");
		const navBtnMbl = document.querySelector(".nav_expand-btn.is-mbl");
		const megaNav = document.querySelector(".nav-mega");
		const navLayout = document.querySelector(".nav_mega-layout");
		const headerBg = document.querySelector(".header_bg");

		// get the nav type
		let navType;
		if (nav.classList.contains("is-blog")) {
			navType = "blog";
		} else if (nav.classList.contains("is-store")) {
			navType = "store";
		} else if (nav.classList.contains("is-careers")) {
			navType = "careers";
		} else {
			navType = "default";
		}

		const navBg = document.querySelector(".nav_bg"); // menu bg we animate on desktop
		const megaNavBg = document.querySelector(".nav-mega_bg"); // mega menu bg
		let bgColor;
		if (navBg) bgColor = getComputedStyle(navBg).getPropertyValue("background-color");
		let finalRadius;
		if (megaNavBg)
			finalRadius = getComputedStyle(megaNavBg).getPropertyValue("border-bottom-left-radius");
		let icon;
		if (navBtn) icon = navBtn.querySelector(".nav-plus");
		let iconMbl;
		if (navBtnMbl) iconMbl = navBtnMbl.querySelector(".nav-plus");

		const mediaQuery = window.matchMedia("(max-width: " + lenus.navBreakpoint + "px)");
		let currentMode = mediaQuery.matches ? "mobile" : "desktop";
		let navOpen = false;

		let desktopTl, mobileTl;

		let accordionContext;

		// Stagger menu items in three groups
		let staggerGroup1_dsk = filterValidElements([
			nav.querySelector(".nav-mega_col:nth-child(1)"),
			nav.querySelector(".nav-mega_col:nth-child(3)"),
		]);

		let staggerGroup2_dsk = filterValidElements([
			nav.querySelector(".nav-mega_col:nth-child(2)"),
			nav.querySelector(".nav-mega_col:nth-child(4)"),
		]);
		let staggerGroup3_dsk = filterValidElements([nav.querySelector(".nav-mega_right")]);
		// }
		let stagger = 0.05;

		let staggerGroup1_mbl = filterValidElements(nav.querySelector(".nav-mega_right"));
		let staggerGroup2_mbl = filterValidElements(nav.querySelector(".nav-mega_col:nth-child(1)"));
		let staggerGroup3_mbl = filterValidElements(nav.querySelector(".nav-mega_col:nth-child(2)"));
		let staggerGroup4_mbl = filterValidElements(nav.querySelector(".nav-mega_col:nth-child(3)"));
		let staggerGroup5_mbl = filterValidElements(nav.querySelector(".nav-mega_col:nth-child(4)"));
		let staggerGroup6_mbl = filterValidElements(nav.querySelector(".nav-mega_footer"));

		resetAllStyles();

		if (currentMode === "desktop") {
			desktopTl = setUpDesktopTimeline();
		} else {
			mobileTl = setUpMobileTimeline();
			setUpAccordions();
		}

		// Set initial states
		function resetAllStyles() {
			// Clear all inline styles first
			gsap.set([navBg, megaNavBg, megaNav, navLayout], { clearProps: "all" });
			if (headerBg) {
				gsap.set(headerBg, { display: "none" }); // Hide headerBg initially
			}
			if (icon) {
				gsap.set(icon, { rotation: 0 });
			}
			if (iconMbl) {
				gsap.set(iconMbl, { rotation: 0 });
			}

			if (staggerGroup1_dsk && staggerGroup1_dsk.length > 0) {
				gsap.set(staggerGroup1_dsk, { clearProps: "all" });
			}
			if (staggerGroup2_dsk && staggerGroup2_dsk.length > 0) {
				gsap.set(staggerGroup2_dsk, { clearProps: "all" });
			}
			if (staggerGroup3_dsk && staggerGroup3_dsk.length > 0) {
				gsap.set(staggerGroup3_dsk, { clearProps: "all" });
			}

			// Then set initial state
			gsap.set(megaNav, { display: "block", autoAlpha: 0 });
			gsap.set([".nav-mega_col", ".nav-mega_right", ".nav-mega_footer"], { autoAlpha: 0 });
			gsap.set(megaNavBg, { autoAlpha: 0 });
		}

		function setUpDesktopTimeline() {
			let tl = gsap.timeline({ paused: true });

			tl.set(megaNav, { display: "block", autoAlpha: 1 }, 0);
			tl.set(headerBg, { display: "block" }, 0); // Show headerBg when nav opens

			tl.to(
				navLayout,
				{
					opacity: 1,
					duration: 0.3,
					ease: "power2.out",
				},
				0,
			);
			tl.add(Flip.fit(navBg, megaNavBg, { duration: 0.5 }), 0);
			tl.add("flipDone", ">-0.1");
			tl.to(
				navBg,
				{
					borderBottomLeftRadius: finalRadius,
					borderBottomRightRadius: finalRadius,
					borderTopLeftRadius: 0,
					borderTopRightRadius: 0,
					duration: 0.5,
				},
				0,
			);
			tl.to(
				icon,
				{
					rotation: 45,
					duration: 0.3,
				},
				0,
			);
			if (staggerGroup1_dsk && staggerGroup1_dsk.length > 0) {
				tl.to(
					staggerGroup1_dsk,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					"flipDone",
				);
			}
			if (staggerGroup2_dsk && staggerGroup2_dsk.length > 0) {
				tl.to(
					staggerGroup2_dsk,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					`flipDone+=${stagger}`,
				);
			}
			if (staggerGroup3_dsk && staggerGroup3_dsk.length > 0) {
				tl.to(
					staggerGroup3_dsk,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					`flipDone+=${stagger * 2}`,
				);
			}
			tl.set(navBg, { autoAlpha: 0 }, "flipDone");
			tl.set(
				megaNavBg,
				{
					autoAlpha: 1,
				},
				"flipDone",
			);
			return tl;
		}
		function setUpMobileTimeline() {
			let tl = gsap.timeline({ paused: true });
			tl.set(megaNav, { display: "block", autoAlpha: 1 }, 0);
			tl.set(headerBg, { display: "block" }, 0); // Show headerBg when nav opens

			tl.to(
				megaNavBg,
				{
					autoAlpha: 1,
					duration: 0.3,
					ease: "power2.out",
				},
				0,
			);
			tl.to(
				navLayout,
				{
					opacity: 1,
					duration: 0.3,
					ease: "power2.out",
				},
				0,
			);
			tl.to(
				iconMbl,
				{
					rotation: 45,
					duration: 0.3,
				},
				0,
			);

			// Only add animations for groups that have elements
			if (staggerGroup1_mbl && staggerGroup1_mbl.length > 0) {
				tl.to(
					staggerGroup1_mbl,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					0.1,
				);
			}

			if (staggerGroup2_mbl && staggerGroup2_mbl.length > 0) {
				tl.to(
					staggerGroup2_mbl,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					0.1 + stagger,
				);
			}

			if (staggerGroup3_mbl && staggerGroup3_mbl.length > 0) {
				tl.to(
					staggerGroup3_mbl,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					0.1 + stagger * 2,
				);
			}

			if (staggerGroup4_mbl && staggerGroup4_mbl.length > 0) {
				tl.to(
					staggerGroup4_mbl,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					0.1 + stagger * 3,
				);
			}

			if (staggerGroup5_mbl && staggerGroup5_mbl.length > 0) {
				tl.to(
					staggerGroup5_mbl,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					0.1 + stagger * 4,
				);
			}

			if (staggerGroup6_mbl && staggerGroup6_mbl.length > 0) {
				tl.to(
					staggerGroup6_mbl,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					0.1 + stagger * 5,
				);
			}

			return tl;
		}

		function setUpAccordions() {
			// quick check - if the nav type is anything but default then we don't need accordions, just make the heights auto
			if (navType !== "default") {
				gsap.set(".nav-mega_list-wrap", { height: "auto", overflow: "visible" });
				gsap.set(".nav-mega_link", { autoAlpha: 1 });
				return;
			}

			accordionContext = gsap.context(() => {
				const cols = nav.querySelectorAll(".nav-mega_col");
				let tls = [];
				let isAnimating = false;

				// initial states
				gsap.set(".nav-mega_list-wrap", { height: 0, overflow: "hidden" });
				gsap.set(".nav-mega_link", { autoAlpha: 0 });

				cols.forEach((col, index) => {
					const title = col.querySelector(".nav-mega_col-title");
					const body = col.querySelector(".nav-mega_list-wrap");
					const colSelector = gsap.utils.selector(col);

					// Create separate timelines for opening and closing
					const openTl = gsap.timeline({
						paused: true,
						onComplete: () => {
							isAnimating = false;
						},
					});

					const closeTl = gsap.timeline({
						paused: true,
						onComplete: () => {
							isAnimating = false;
						},
					});

					// Build the open timeline
					openTl.to(body, {
						height: body.scrollHeight,
						duration: 0.25,
						ease: "power2.out",
					});

					openTl.to(
						colSelector(".nav-mega_link"),
						{
							autoAlpha: 1,
							stagger: 0.03,
							duration: 0.15,
							ease: "power2.out",
						},
						">-0.1",
					); // Start slightly before height animation completes

					// Build the close timeline
					closeTl.to(colSelector(".nav-mega_link"), {
						autoAlpha: 0,
						stagger: 0.02,
						duration: 0.1,
						ease: "power2.in",
					});

					closeTl.to(
						body,
						{
							height: 0,
							duration: 0.2, // Faster closing animation
							ease: "power2.in",
						},
						">-0.05",
					);

					// Store both timelines
					tls[index] = {
						open: openTl,
						close: closeTl,
						isOpen: false,
					};

					// Add click handler
					title.addEventListener("click", () => {
						if (isAnimating) return;

						isAnimating = true;
						const isCurrentlyOpen = tls[index].isOpen;

						// Function to close all open accordions
						const closeAllOthers = () => {
							const promises = [];

							cols.forEach((otherCol, otherIndex) => {
								if (otherIndex !== index && tls[otherIndex].isOpen) {
									tls[otherIndex].isOpen = false;
									tls[otherIndex].close.restart();
									promises.push(
										new Promise((resolve) => {
											// Add onComplete just for this instance
											tls[otherIndex].close.eventCallback("onComplete", resolve);
										}),
									);
								}
							});

							return Promise.all(promises);
						};

						if (isCurrentlyOpen) {
							// Just close this one
							tls[index].isOpen = false;
							tls[index].close.restart();
						} else {
							// First close others, then open this one
							closeAllOthers().then(() => {
								tls[index].isOpen = true;
								tls[index].open.restart();
							});
						}
					});
				});
			});
		}

		// Click handlers
		if (navBtn) {
			navBtn.addEventListener("click", () => {
				if (currentMode !== "desktop") return;

				if (navOpen) {
					if (desktopTl) {
						desktopTl.reverse();
						// re-enable scroll
						document.body.style.overflow = "";
					}
				} else {
					if (desktopTl) {
						desktopTl.play();
						// disable scroll
						document.body.style.overflow = "hidden";
					}
				}
				navOpen = !navOpen;
			});
		}

		if (navBtnMbl) {
			navBtnMbl.addEventListener("click", () => {
				console.log("mobile nav btn clicked");

				if (currentMode !== "mobile") return;

				if (navOpen) {
					if (mobileTl) {
						// re-enable scroll
						document.body.style.overflow = "";
						mobileTl.reverse();
					}
				} else {
					if (mobileTl) {
						//disable scroll
						document.body.style.overflow = "hidden";
						if (mobileTl) mobileTl.play();
					}
				}

				navOpen = !navOpen;
			});
		}

		function resetDesktopTimeline() {
			if (desktopTl) {
				desktopTl.revert();
				desktopTl = null;
				// gsap.clearProps(navBg);
			}
		}

		// Add click handler for headerBg to close nav
		if (headerBg) {
			headerBg.addEventListener("click", () => {
				if (!navOpen) return; // Only handle clicks when nav is open

				if (currentMode === "desktop" && desktopTl) {
					desktopTl.reverse();
					document.body.style.overflow = "";
				} else if (currentMode === "mobile" && mobileTl) {
					mobileTl.reverse();
					document.body.style.overflow = "";
				}
				navOpen = false;
			});
		}

		// Mode change handler
		function handleResize() {
			const newMode = mediaQuery.matches ? "mobile" : "desktop";

			// when resizing within desktop mode, we are aggressive and kill and recreate timeline, so as to keep the FLIP stuff up to date
			if (newMode === currentMode && newMode === "desktop") {
				if (desktopTl) desktopTl.revert();
				desktopTl.kill();
				desktopTl = setUpDesktopTimeline();
				navOpen = false;
			}

			if (newMode === currentMode) return;

			// If menu was open, close it in current mode before switching

			if (currentMode === "desktop") {
				if (desktopTl) desktopTl.revert();
				mobileTl = setUpMobileTimeline();
				setUpAccordions();
			} else {
				if (mobileTl) mobileTl.revert();
				if (accordionContext) accordionContext.revert();
				desktopTl = setUpDesktopTimeline();
			}
			navOpen = false;

			currentMode = newMode;
		}

		// Listen for resize events
		window.addEventListener("resize", lenus.helperFunctions.debounce(handleResize, 200));

		// Initialize
		handleResize();

		// Helper function to filter out null/undefined elements from stagger groups
		function filterValidElements(group) {
			if (!group) return [];
			if (Array.isArray(group)) {
				return group.filter((item) => item !== null && item !== undefined);
			}
			return group ? [group] : [];
		}
	}

	// Global featured section animation controller for blog pages
	const blogFeaturedSectionController = (() => {
		let currentlyHidden = false;
		let timeline = null;
		let featuredSection = null;
		let blogListSection = null;
		let isInitialized = false;
		let resizeHandler = null;

		function createTimeline() {
			// Kill existing timeline if it exists
			if (timeline) {
				timeline.kill();
			}

			// Create a simple timeline using CSS auto height - no measurement needed
			timeline = gsap.timeline({
				paused: true,
				onReverseComplete: () => {
					gsap.set(featuredSection, { display: "", opacity: 1, height: "auto" });
				},
			});

			// Hide animation: fade out and collapse height
			timeline
				.to(featuredSection, {
					opacity: 0,
					duration: 0.3,
					ease: "power2.inOut",
				})
				.to(featuredSection, {
					height: 0,
					duration: 0.3,
					ease: "power2.inOut",
				})
				.set(featuredSection, { display: "none" })
				.to(
					blogListSection,
					{
						paddingTop: "var(--section--padding-top-nav)",
						duration: 0.6,
						ease: "power2.inOut",
					},
					0,
				);

			// Set initial state based on current status
			if (currentlyHidden) {
				timeline.progress(1);
			} else {
				timeline.progress(0);
				// Ensure proper expanded state
				gsap.set(featuredSection, {
					display: "",
					opacity: 1,
					height: "auto",
				});
			}
		}

		function initialize() {
			if (isInitialized) return true;

			// Check if we're on a blog page
			const nav = document.querySelector(".nav");
			const isBlogPage = nav && nav.classList.contains("is-blog");
			const isOnListingPage =
				window.location.pathname === "/blog" || window.location.pathname === "/blog/";

			if (!isBlogPage || !isOnListingPage) return false;

			featuredSection = document.querySelector("#featured-blog");
			blogListSection = document.querySelector("#blog-list");

			if (!featuredSection || !blogListSection) return false;

			// Set initial state based on current search-active class
			const hasSearchActiveClass = document.documentElement.classList.contains("search-active");
			currentlyHidden = hasSearchActiveClass;

			// Create initial timeline
			createTimeline();

			isInitialized = true;
			return true;
		}

		function cleanup() {
			if (timeline) {
				timeline.kill();
				timeline = null;
			}
			if (resizeHandler) {
				window.removeEventListener("resize", resizeHandler);
				resizeHandler = null;
			}
			isInitialized = false;
		}

		function hide() {
			if (!initialize() || currentlyHidden) return;

			timeline.play();
			currentlyHidden = true;
		}

		function show() {
			if (!initialize() || !currentlyHidden) return;

			// Prepare section for show animation
			gsap.set(featuredSection, {
				display: "",
				height: 0,
				opacity: 0,
			});

			// Reverse the timeline to show the section
			timeline.reverse();
			currentlyHidden = false;
		}

		function toggle(shouldHide) {
			if (shouldHide) {
				hide();
			} else {
				show();
			}
		}

		return { hide, show, toggle, cleanup };
	})();

	// Convenience function for backward compatibility
	function globalAnimateFeaturedSection(hide) {
		blogFeaturedSectionController.toggle(hide);
	}

	/**
	 * Unified handleSearch for Blog and Store pages.
	 * - Nav search input: .c-search .search_input
	 * - Blog filter input: .blog-list_search > input
	 * - Store filter input: .store-list_search > input
	 * - Detects page type and applies correct logic (filter or redirect)
	 */
	function handleSearch() {
		const nav = document.querySelector(".nav");
		if (!nav || (!nav.classList.contains("is-blog") && !nav.classList.contains("is-store"))) return;

		const searchComponents = document.querySelectorAll(".c-search");
		if (!searchComponents.length) return;

		const PAGE_TYPE = nav.classList.contains("is-blog")
			? "blog"
			: nav.classList.contains("is-store")
				? "store"
				: null;

		const LISTING_PATH = PAGE_TYPE === "blog" ? "/blog" : "/store";
		const FILTER_INPUT_SELECTOR =
			PAGE_TYPE === "blog" ? ".blog-list_search > input" : ".store-list_search > input";
		const isOnListingPage = () =>
			window.location.pathname === LISTING_PATH || window.location.pathname === LISTING_PATH + "/";
		const blogHeader = PAGE_TYPE === "blog" ? document.querySelector(".blog-list_header h2") : null;
		const blogHeaderDefaultText = blogHeader?.textContent?.trim() || "All posts";
		const BLOG_HEADER_SEARCH_TEXT = "Search results";

		const updateBlogHeader = (active) => {
			if (!blogHeader || PAGE_TYPE !== "blog" || !isOnListingPage()) return;
			blogHeader.textContent = active ? BLOG_HEADER_SEARCH_TEXT : blogHeaderDefaultText;
		};

		const initTimeline = (timeline, component) => {
			timeline.to(component, {
				width: "var(--search--full-w)",
				duration: 0.5,
				ease: "power2.out",
			});
		};

		searchComponents.forEach((component) => {
			const searchInput = component.querySelector(".search_input");
			const searchButton = component.querySelector(".search_icon-wrap");
			const searchForm = component.querySelector("form");

			let timeline = gsap.timeline({ paused: true });

			if (!searchInput || !searchButton) return;

			// DRY: shared filter logic
			const applyFilter = (searchValue) => {
				if (isOnListingPage()) {
					const filterInput = document.querySelector(FILTER_INPUT_SELECTOR);
					if (filterInput) {
						filterInput.value = searchValue;
						const inputEvent = new Event("input", { bubbles: true });
						filterInput.dispatchEvent(inputEvent);
					}
					setStateClass(!!searchValue.trim());
				}
			};

			// Prevent form submission
			if (searchForm) {
				searchForm.addEventListener("submit", (e) => {
					e.preventDefault();
					e.stopPropagation();
				});
			}

			// Animation timeline for expanding search
			initTimeline(timeline, component);

			// Helper: set/remove state class
			const setStateClass = (active) => {
				const isActive = !!active;
				document.documentElement.classList.toggle(lenus.search.stateClass, isActive);
				updateBlogHeader(isActive);
				globalAnimateFeaturedSection(isActive);
			};

			// Hover events for animation
			component.addEventListener("mouseenter", () => timeline.play());
			component.addEventListener("mouseleave", () => {
				if (!searchInput.value.trim()) timeline.reverse();
			});

			// Clear button handler
			const addClearButtonHandler = (clearButton) => {
				if (!clearButton || clearButton.hasAttribute("data-search-clear-handled")) return;
				clearButton.setAttribute("data-search-clear-handled", "true");
				clearButton.addEventListener("click", () => {
					searchInput.value = "";
					timeline.reverse();
					setStateClass(false);
				});
			};

			// Find and click clear button
			const triggerClearButton = () => {
				const clearButton = document.querySelector("[fs-list-element=clear]");
				if (clearButton) clearButton.click();
			};

			// Debounced search functionality
			let searchDebounceTimer = null;
			const SEARCH_DEBOUNCE_DELAY = 1000; // milliseconds

			const performSearch = (value) => {
				applyFilter(value);
				setStateClass(!!value.trim());
				if (!value.trim()) {
					triggerClearButton();
					timeline.reverse();
				}
			};

			// Input change: debounced filter, immediate UI feedback
			searchInput.addEventListener("input", (e) => {
				const value = e.target.value;

				// Clear existing debounce timer
				if (searchDebounceTimer) {
					clearTimeout(searchDebounceTimer);
				}

				// Immediate UI feedback for empty input
				if (!value.trim()) {
					performSearch(value);
					return;
				}

				// Debounce the actual search for non-empty input
				searchDebounceTimer = setTimeout(() => {
					performSearch(value);
				}, SEARCH_DEBOUNCE_DELAY);
			});

			// Escape/Enter key handling
			searchInput.addEventListener("keydown", (e) => {
				if (e.key === "Escape") {
					// Clear debounce timer
					if (searchDebounceTimer) {
						clearTimeout(searchDebounceTimer);
						searchDebounceTimer = null;
					}
					searchInput.value = "";
					triggerClearButton();
					timeline.reverse();
					setStateClass(false);
				} else if (e.key === "Enter") {
					// Clear debounce timer and perform immediate search
					if (searchDebounceTimer) {
						clearTimeout(searchDebounceTimer);
						searchDebounceTimer = null;
					}
					performSearch(searchInput.value);
				}
			});

			// Search button click: filter or redirect
			searchButton.addEventListener("click", () => {
				const value = searchInput.value.trim();
				const searchTerm = encodeURIComponent(value);

				// Clear debounce timer for immediate search
				if (searchDebounceTimer) {
					clearTimeout(searchDebounceTimer);
					searchDebounceTimer = null;
				}

				if (!searchTerm) return;

				if (isOnListingPage()) {
					performSearch(value);
				} else {
					// Redirect to listing page with search param
					window.location.href = `${LISTING_PATH}?search=${searchTerm}`;
				}
			});

			// Add clear button handlers to existing buttons
			document.querySelectorAll("[fs-list-element=clear]").forEach(addClearButtonHandler);

			// Mutation observer for dynamically added clear buttons
			const observerConfig = { childList: true, subtree: true };
			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.type === "childList" && mutation.addedNodes.length) {
						mutation.addedNodes.forEach((node) => {
							if (
								node.nodeType === 1 &&
								node.getAttribute &&
								node.getAttribute("fs-list-element") === "clear"
							) {
								addClearButtonHandler(node);
							}
							if (node.nodeType === 1 && node.querySelectorAll) {
								node.querySelectorAll("[fs-list-element=clear]").forEach(addClearButtonHandler);
							}
						});
					}
				});
			});
			observer.observe(document.body, observerConfig);

			// Enter key support for search input
			searchInput.addEventListener("keydown", (e) => {
				if (e.key === "Enter") searchButton.click();
			});

			// On page load: check for search param and apply filter/state class
			if (isOnListingPage()) {
				const urlParams = new URLSearchParams(window.location.search);
				const searchParam = urlParams.get("*_contain") || urlParams.get("search") || "";
				const blogParam = urlParams.get("blog_equal") || "";
				const categoryParam = urlParams.get("category_equal") || "";

				if (searchParam) {
					searchInput.value = searchParam;
					timeline.play();
					const filterInput = document.querySelector(FILTER_INPUT_SELECTOR);
					if (filterInput) {
						filterInput.value = searchParam;
						const inputEvent = new Event("input", { bubbles: true });
						filterInput.dispatchEvent(inputEvent);
					}
					setStateClass(true);
				} else if (blogParam || categoryParam) {
					// Apply search-active class if any filter is applied via URL params
					setStateClass(true);
				} else {
					setStateClass(false);
				}
			} else {
				setStateClass(false);
			}

			function mobileHandler() {
				searchInput.value = "";
				triggerClearButton();
				timeline.reverse();
				setStateClass(false);
			}
			// On resize to mobile, clear all and remove state class
			window.addEventListener(
				"resize",
				lenus.helperFunctions.debounce(() => {
					if (window.innerWidth < 768) {
						mobileHandler();
					} else {
						// revert timeline and restart
						timeline.reverse();
						gsap.set(component, { clearProps: "all" });
					}
				}),
			);
		});

		function clearSearch() {
			const searchInputs = document.querySelectorAll('input[fs-list-field="*"]');
			searchInputs.forEach((input) => {
				if (input.value) {
					input.value = "";
					input.dispatchEvent(new Event("input", { bubbles: true }));
				}
			});
			updateBlogHeader(false);

			// Remove search-active class if no filters are active
			if (!hasActiveFilters()) {
				document.documentElement.classList.remove(lenus.search.stateClass);
				globalAnimateFeaturedSection(false);
			}
		}

		function hasActiveFilters() {
			// Check if any category filters are active
			const activeRadios = document.querySelectorAll(
				'input[type="radio"][fs-list-field="category"]:checked',
			);
			const activeSubBlogRadios = document.querySelectorAll(
				'input[type="radio"][fs-list-field="blog"]:checked',
			);

			return activeRadios.length > 0 || activeSubBlogRadios.length > 0;
		}
	}

	function handleFiltering() {
		const isStorePage = window.location.pathname === "/store";
		const isBlogPage = window.location.pathname === "/blog";
		const isProductPage = window.location.pathname.includes("/products/");
		const isBlogPostPage = window.location.pathname.includes("/blog/") && !isBlogPage;

		console.log(
			"Page type - Store:",
			isStorePage,
			"Blog:",
			isBlogPage,
			"Product:",
			isProductPage,
			"Blog Post:",
			isBlogPostPage,
		);

		if (isStorePage) {
			setupStoreFiltering();
		} else if (isBlogPage) {
			setupBlogFiltering();
		} else if (isProductPage || isBlogPostPage) {
			setupProductBlogPageFiltering();
		}

		function setupStoreFiltering() {
			const navLinks = document.querySelectorAll(".nav.is-store .nav-item_link");
			const hiddenForm = document.querySelector(".c-products-listing .u-display-none form");
			const hiddenClearBtn = hiddenForm?.querySelector('[fs-list-element="clear"]');
			const hiddenRadios = hiddenForm?.querySelectorAll('input[type="radio"]');

			navLinks.forEach((link) => {
				link.addEventListener("click", function (e) {
					e.preventDefault();

					const url = new URL(this.href);
					const categoryParam = url.searchParams.get("category_equal");

					// Reset search first
					lenus.functions.clearSearch?.();

					// Apply search-active class for layout changes
					document.documentElement.classList.add(lenus.search.stateClass);

					if (!categoryParam || this.textContent.trim() === "Everything") {
						// Clear all filters
						hiddenClearBtn?.click();
						lenus.navHover.clearActive();
					} else {
						// Find and trigger the matching radio button
						const matchingRadio = Array.from(hiddenRadios).find(
							(radio) => radio.getAttribute("fs-list-value") === categoryParam,
						);

						if (matchingRadio) {
							matchingRadio.click();
							lenus.navHover.setActive(this);
						}
					}
				});
			});
		}

		function setupBlogFiltering() {
			const navLinks = document.querySelectorAll(".nav.is-blog .nav-item_link");
			const visibleForm = document.querySelector(".blog-list_filters-form");
			const visibleClearBtn = visibleForm?.querySelector('[fs-list-element="clear"]');
			const categoryRadios = visibleForm?.querySelectorAll(
				'input[type="radio"][fs-list-field="category"]',
			);
			const blogRadios = visibleForm?.querySelectorAll('input[type="radio"][fs-list-field="blog"]');
			const allRadios = visibleForm?.querySelectorAll('input[type="radio"]');
			const searchInput = visibleForm?.querySelector('input[fs-list-field="*"]');
			// Get category filter items using a more compatible selector
			const categoryFilterItems = Array.from(
				document.querySelectorAll(".filters_list-item"),
			).filter((item) => item.querySelector('input[fs-list-field="category"]'));

			// Flag to prevent clear button from updating category visibility when triggered programmatically
			let skipClearButtonCategoryUpdate = false;

			// Function to show/hide category filters based on current sub-blog
			function updateCategoryVisibility(currentBlog = "auto") {
				// If "auto", try to get it from currently checked blog radio
				if (currentBlog === "auto") {
					const checkedBlogRadio = document.querySelector('input[fs-list-field="blog"]:checked');
					currentBlog = checkedBlogRadio?.getAttribute("fs-list-value") || null;
				}

				categoryFilterItems.forEach((filterItem) => {
					if (!currentBlog) {
						// If no sub-blog selected, show all categories
						filterItem.style.display = "";
						return;
					}

					// Find nested data elements that specify which blogs this category should show for
					const blogDataElements = filterItem.querySelectorAll("[data-show-for-blog]");
					const shouldShow = Array.from(blogDataElements).some((element) => {
						const blogValue = element.getAttribute("data-show-for-blog");
						return blogValue === currentBlog;
					});

					// Show or hide the entire filter item
					filterItem.style.display = shouldShow ? "" : "none";
				});
			}

			navLinks.forEach((link) => {
				link.addEventListener("click", function (e) {
					e.preventDefault();

					console.log("Blog nav link clicked:", this.href);

					const url = new URL(this.href);
					const blogParam = url.searchParams.get("blog_equal");

					// Clear search and category filters when switching sub-blogs
					if (searchInput) {
						searchInput.value = "";
						searchInput.dispatchEvent(new Event("input", { bubbles: true }));
					}

					// Set flag to prevent clear button from updating category visibility
					skipClearButtonCategoryUpdate = true;

					// Clear filters
					visibleClearBtn?.click();

					// Reset flag after a short delay
					setTimeout(() => {
						skipClearButtonCategoryUpdate = false;
					}, 10);

					console.log(blogParam);

					// Remove lenus.search.stateClass class since we're clearing everything
					document.documentElement.classList.remove(lenus.search.stateClass);
					globalAnimateFeaturedSection(false);

					if (blogParam) {
						const matchingRadio = Array.from(blogRadios).find(
							(radio) => radio.getAttribute("fs-list-value") === blogParam,
						);

						if (matchingRadio) {
							matchingRadio.click();
							// Apply lenus.search.stateClass class for layout changes
							document.documentElement.classList.add(lenus.search.stateClass);
							globalAnimateFeaturedSection(true);
						}

						// Update category visibility based on selected sub-blog
						updateCategoryVisibility(blogParam);
					} else {
						// No blog param means "all blogs" - show all categories
						updateCategoryVisibility(null);
					}

					lenus.navHover.setActive(this);
				});
			});

			// Handle visible category filter changes
			allRadios.forEach((radio) => {
				radio.addEventListener("change", function () {
					if (this.checked) {
						document.documentElement.classList.add(lenus.search.stateClass);
						globalAnimateFeaturedSection(true);
					}
				});
			});

			// Handle clear button
			visibleClearBtn?.addEventListener("click", function () {
				document.documentElement.classList.remove(lenus.search.stateClass);
				globalAnimateFeaturedSection(false);
				// Show all categories when clearing filters - but only if not triggered programmatically
				if (!skipClearButtonCategoryUpdate) {
					setTimeout(() => {
						updateCategoryVisibility(null);
					}, 0);
				}
				// Clear nav highlight to show no sub-blog is selected
				lenus.navHover.clearActive();
			});

			// Handle initial page load with URL parameters
			function handleInitialUrlParams() {
				const urlParams = new URLSearchParams(window.location.search);
				const blogParam = urlParams.get("posts_blog_equal");

				if (blogParam) {
					// Find the corresponding nav link and set it as active
					const matchingNavLink = Array.from(navLinks).find((link) => {
						const linkUrl = new URL(link.href);
						return linkUrl.searchParams.get("blog_equal") === blogParam;
					});

					if (matchingNavLink) {
						lenus.navHover.setActive(matchingNavLink);
					}

					// Update category visibility based on the URL parameter
					updateCategoryVisibility(blogParam);
				} else {
					// No blog parameter in URL, show all categories
					updateCategoryVisibility("auto");
				}
			}

			// Expose utilities globally for Finsweet callback
			window.blogFilteringUtils = {
				handleInitialUrlParams,
				updateCategoryVisibility,
			};

			// Initialize on page load (this will be called again from Finsweet callback if needed)
			handleInitialUrlParams();
		}

		function setupProductBlogPageFiltering() {
			// On product/blog post pages, use URL navigation as before
			const navLinks = document.querySelectorAll(".nav .nav-item_link");

			navLinks.forEach((link) => {
				link.addEventListener("click", function (e) {
					// Let default navigation happen - no preventDefault
					// This will take user back to listing page with filter applied
				});
			});
		}

		function updateNavActiveState(activeLink) {
			const nav = activeLink.closest(".nav");
			const allNavLinks = nav.querySelectorAll(".nav-item_link");
			const navItems = nav.querySelectorAll(".c-nav-item");

			// Remove active states
			allNavLinks.forEach((link) => {
				link.classList.remove("is-current");
				link.style.color = "";
			});
			navItems.forEach((item) => {
				item.style.color = "";
			});

			// Add active state to clicked link
			activeLink.classList.add("is-current");
			const parentNavItem = activeLink.closest(".c-nav-item");
			if (parentNavItem) {
				parentNavItem.style.color = "var(--_theme---nav--link-active)";
			}

			// Update nav highlight position
			updateNavHighlight(nav, parentNavItem || activeLink.parentElement);
		}

		function updateNavHighlight(nav, activeItem) {
			const highlight = nav.querySelector(".nav_menu-highlight");
			if (highlight && activeItem) {
				const rect = activeItem.getBoundingClientRect();
				const navRect = nav.querySelector(".nav_menu").getBoundingClientRect();

				const left = rect.left - navRect.left;
				const width = rect.width;

				nav.style.setProperty("--nav--menu-bg-l", `${left}px`);
				nav.style.setProperty("--nav--menu-bg-w", `${width}px`);

				highlight.style.opacity = "1";
				highlight.style.visibility = "inherit";
			}
		}
	}

	function pricingOptions() {
		document.querySelectorAll(".pricing-panel").forEach((component) => {
			// Store the config for reuse
			const splideConfig = {
				config: {
					type: "slide",
					autoWidth: true,
					gap: "0",
					focus: "left",
					snap: false,
					drag: "free",
				},
				responsive: {
					breakpoint: 767,
					desktopOnly: true, // Only create carousel on desktop
				},
			};

			// Store config on the element for later access
			component._splideConfig = splideConfig;

			const instance = lenus.helperFunctions.initSplideCarousel(component, {
				...splideConfig,
				onMounted: (splideInstance) => {
					// Store instance reference on the element for later access
					component.splide = splideInstance;
				},
			});
		});
	}

	function pricingFeatures() {
		const container = document.querySelector(".c-pricing-features");
		if (!container) return;
		const content = container.querySelector(".pricing-features_table");
		if (!content) return;
		const draggable = setupHorizontalDraggable(container, content);

		function setupHorizontalDraggable(component, content) {
			// Get container and content elements
			const container =
				typeof component === "string" ? document.querySelector(component) : component;
			const contentEl = typeof content === "string" ? container.querySelector(content) : content;

			if (!container || !contentEl) {
				console.error("Container or content element not found");
				return;
			}

			// State
			let draggableInstance = null;

			// Function to check if draggable is needed
			function checkOverflow() {
				const containerWidth = container.clientWidth;
				const contentWidth = contentEl.scrollWidth;
				return contentWidth > containerWidth;
			}

			// Function to calculate bounds
			function calculateBounds() {
				const containerWidth = container.clientWidth;
				const contentWidth = contentEl.scrollWidth;
				return {
					minX: -Math.max(0, contentWidth - containerWidth),
					maxX: 0,
				};
			}

			// Function to create draggable instance
			function createDraggable() {
				if (draggableInstance) return;

				const bounds = calculateBounds();

				// Set initial cursor styles
				gsap.set(contentEl, { cursor: "grab" });

				draggableInstance = Draggable.create(contentEl, {
					type: "x",
					bounds: bounds,
					inertia: true,
					edgeResistance: 0.65,
					allowContextMenu: true,
					cursor: "grab",
					activeCursor: "grabbing",
					onDrag: function () {
						// Ensure we don't exceed bounds during drag
						const x = gsap.getProperty(contentEl, "x");
						if (x < bounds.minX || x > bounds.maxX) {
							const clamped = gsap.utils.clamp(bounds.minX, bounds.maxX, x);
							gsap.set(contentEl, { x: clamped });
						}
					},
				})[0];
				content.classList.add("is-overflow");
				console.log("Draggable created with bounds:", bounds);
			}

			// Function to destroy draggable instance
			function destroyDraggable() {
				if (!draggableInstance) return;

				draggableInstance.kill();
				draggableInstance = null;
				gsap.set(contentEl, { x: 0, cursor: "" });
				content.classList.remove("is-overflow");
				console.log("Draggable destroyed");
			}

			// Update function to check and apply/remove draggable as needed
			function update() {
				if (checkOverflow()) {
					if (draggableInstance) {
						// Update bounds if draggable already exists
						const bounds = calculateBounds();
						draggableInstance.applyBounds(bounds);

						// Ensure current position is within new bounds
						const currentX = gsap.getProperty(contentEl, "x");
						const clamped = gsap.utils.clamp(bounds.minX, bounds.maxX, currentX);
						if (clamped !== currentX) {
							gsap.set(contentEl, { x: clamped });
						}

						console.log("Draggable bounds updated:", bounds);
					} else {
						createDraggable();
					}
				} else {
					destroyDraggable();
				}
			}

			// Create debounced resize handler
			const debouncedUpdate = lenus.helperFunctions.debounce(update, 200);

			// Add resize listener
			window.addEventListener("resize", debouncedUpdate);

			// Initial setup
			update();

			// Return cleanup function
			return {
				update,
				destroy: () => {
					window.removeEventListener("resize", debouncedUpdate);
					destroyDraggable();
				},
			};
		}
	}

	function largeButtonHover() {
		if (window.matchMedia("(hover: none)").matches) return; // disable on touch/mobile

		const buttons = document.querySelectorAll(".button.is-large");
		if (buttons.length === 0) return;

		buttons.forEach((btn, index) => setupButton(btn, index));

		function setupButton(btn, index) {
			const textEl = btn.querySelector(".button_text");
			if (!textEl) return;

			let directionToggle = true; // true = up/left, false = down/right
			let hoverTimeline = null; // Store the main hover timeline
			let isHovered = false;

			// Create dual text layers
			const originalText = textEl.textContent;
			console.log("Original button text:", originalText);
			textEl.innerHTML = `
      <div class="btn-text-layer btn-text-current">${originalText}</div>
      <div class="btn-text-layer btn-text-next" aria-hidden="true">${originalText}</div>
    `;

			const currentLayer = textEl.querySelector(".btn-text-current");
			const nextLayer = textEl.querySelector(".btn-text-next");

			let splitCurrent = new SplitText(currentLayer, { type: "chars" });
			let splitNext = new SplitText(nextLayer, { type: "chars" });

			let charsCurrent = splitCurrent.chars;
			let charsNext = splitNext.chars;

			// Ensure next layer is stacked
			gsap.set(nextLayer, { position: "absolute", top: 0, left: 0, width: "100%" });

			// Resize handling (re-split)
			const resizeHandler = debounce(() => {
				splitCurrent.revert();
				splitNext.revert();
				splitCurrent = new SplitText(currentLayer, { type: "chars" });
				splitNext = new SplitText(nextLayer, { type: "chars" });
				charsCurrent = splitCurrent.chars;
				charsNext = splitNext.chars;
			}, 200);
			window.addEventListener("resize", resizeHandler);

			// Create the main hover animation timeline (paused by default)
			function createHoverTimeline() {
				if (hoverTimeline) hoverTimeline.kill();

				const dir = directionToggle ? 1 : -1; // up vs down
				const fromSide = directionToggle ? "start" : "end";
				directionToggle = !directionToggle;

				const tl = gsap.timeline({
					paused: true,
					onComplete: () => {
						// Swap layers at end (so next becomes current for next round)
						textEl.insertBefore(nextLayer, currentLayer);
						[splitCurrent, splitNext] = [splitNext, splitCurrent];
						[charsCurrent, charsNext] = [charsNext, charsCurrent];
						currentLayer.classList.toggle("btn-text-current");
						nextLayer.classList.toggle("btn-text-next");
					},
				});

				tl.timeScale(1.6);

				const staggerAmount = 0.07;
				const duration = 0.5;
				const durationOpacity = 0.15;
				const ease = "power1.inOut";
				const delayTransformCurrent = 0; // anim just starts
				const delayTransformNext = 0.12; // how long til next chars move
				const delayBlurCurrent = 0; // how long til current chars blur out
				const delayBlurNext = 0.1; // how long til next chars blur in
				const delayOpacityCurrent = 0.1; // how long til current chars fade out
				const delayOpacityNext = 0; // how long til next chars fade in
				const translate = 50; // how far chars move

				// Animate current chars out
				tl.to(
					charsCurrent,
					{
						yPercent: dir * -translate,
						rotationX: dir * -90,

						duration: duration,
						ease: ease,
						stagger: { each: staggerAmount, from: fromSide },
					},
					delayTransformCurrent,
				)
					.to(
						charsCurrent,
						{
							filter: "blur(4px)",
							duration: duration,
							ease: ease,
							stagger: { each: staggerAmount, from: fromSide },
						},
						delayBlurCurrent,
					)
					.to(
						charsCurrent,
						{
							opacity: 0,
							duration: durationOpacity,
							ease: ease,
							stagger: { each: staggerAmount, from: fromSide },
						},
						delayOpacityCurrent,
					);

				// Animate next chars in
				tl.fromTo(
					charsNext,
					{
						yPercent: dir * translate,
						rotationX: dir * 90,
					},
					{
						yPercent: 0,
						rotationX: 0,

						duration: duration,
						ease: ease,
						stagger: { each: staggerAmount, from: fromSide },
					},
					delayTransformNext,
				)
					.fromTo(
						charsNext,
						{
							filter: "blur(4px)",
						},
						{
							filter: "blur(0px)",
							duration: duration,
							ease: ease,
							stagger: { each: staggerAmount, from: fromSide },
						},
						delayBlurNext,
					)
					.fromTo(
						charsNext,
						{
							opacity: 0,
						},
						{
							opacity: 1,
							duration: durationOpacity,
							ease: ease,
							stagger: { each: staggerAmount, from: fromSide },
						},
						delayOpacityNext,
					);

				return tl;
			}

			// Mouse enter handler
			btn.addEventListener("mouseenter", () => {
				isHovered = true;

				// Create new timeline for this direction if needed
				if (!hoverTimeline || hoverTimeline.progress() === 1) {
					hoverTimeline = createHoverTimeline();
				}

				// Play forward immediately
				hoverTimeline.play();
			});

			// Mouse leave handler
			btn.addEventListener("mouseleave", () => {
				isHovered = false;

				// If we have an active timeline, reverse it immediately
				if (hoverTimeline) {
					hoverTimeline.reverse();
				}
			});
		}

		// Simple debounce helper
		function debounce(fn, delay) {
			let t;
			return (...args) => {
				clearTimeout(t);
				t = setTimeout(() => fn.apply(this, args), delay);
			};
		}
	}

	function multiQuote() {
		const components = document.querySelectorAll(".c-quote");
		if (!components.length) return;

		components.forEach((component) => {
			const items = component.querySelectorAll(".quote_list-item");
			const itemsCount = items.length;

			if (itemsCount === 0) return;

			if (itemsCount === 1) {
				// Only one item, just show it and bail
				items[0].classList.add("is-active");
				gsap.set(items[0], { autoAlpha: 1 });
				return;
			}

			// Global timings per quote
			const visibleTime = 5; // how long each quote stays on screen
			const transitionTime = 1; // exit anim duration

			// Hide all items initially (CSS already fades with .is-active, this keeps them truly hidden)
			gsap.set(items, { autoAlpha: 0 });

			// Master timeline for this quote component, playing only when in view
			const masterTl = gsap.timeline({
				repeat: -1,
				paused: false,
				scrollTrigger: {
					trigger: component,
					start: "top 80%",
					end: "bottom 20%",
					onEnter: () => masterTl.play(),
					onEnterBack: () => masterTl.play(),
					onLeave: () => masterTl.pause(),
					onLeaveBack: () => masterTl.pause(),
				},
			});

			items.forEach((item, index) => {
				const title = item.querySelector(".c-title");
				title.classList.add("anim-grad-text-word");
				gsap.set(title, { backgroundSize: "300% 300%" });
				const credit = item.querySelector(".c-subtitle");

				// One timeline for this specific quote
				const itemTl = gsap.timeline({
					// When this quote starts, mark it active and others inactive
					onStart: () => {
						items.forEach((el) => el.classList.remove("is-active"));
						item.classList.add("is-active");
					},
				});

				itemTl
					// Make sure this item is visible when its turn starts
					.set(item, { autoAlpha: 1 })

					// Intro
					.fromTo(
						title,
						{ y: 50, autoAlpha: 0 },
						{ y: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out" },
						0,
					)
					.fromTo(
						title,
						{
							backgroundPosition: "100% 0%",
						},
						{
							backgroundPosition: "0% 100%",
							ease: "power2.out",
							duration: 2,
						},
						0,
					)
					.fromTo(
						credit,
						{ y: 30, autoAlpha: 0 },
						{ y: 0, autoAlpha: 1, duration: 1, ease: "power2.out" },
						0.2,
					)

					// Hold the quote on screen
					.to({}, { duration: visibleTime })

					// Outro
					.to(
						title,
						{ y: -50, autoAlpha: 0, duration: transitionTime, ease: "power2.in" },
						">", // start right after the hold
					)
					.to(
						credit,
						{ y: -30, autoAlpha: 0, duration: transitionTime, ease: "power2.in" },
						"<+0.2", // slightly after title
					)

					// Hide the item at the end so it's clean for the next cycle
					.set(item, { autoAlpha: 0 });

				// Store for debugging if you like
				item._itemTl = itemTl;

				// Add this quote's timeline to the master sequence
				// No position argument = append directly after the previous one
				masterTl.add(itemTl);
			});

			// // Optionally store the master timeline for devtools / debugging
			// component._quoteMasterTl = masterTl;
		});
	}

	function hideShowNav() {
		const nav = document.querySelector(".nav");
		if (!nav) return;

		const navLogoText = document.querySelector(".nav_logo-link.is-wordmark");

		const showThreshold = 50; // Always show when within this distance from top
		const hideThreshold = 150; // Can hide only after passing this
		const logoThreshold = 60; // Independent threshold for logo text animation
		const revealBuffer = 50; // Scroll-up distance before revealing
		const hideBuffer = 10; // Small buffer to prevent flicker

		let lastScrollY = window.scrollY;
		let currentScrollY = window.scrollY;
		let revealDistance = 0;
		let navHidden = false;
		let logoHidden = false;
		let ticking = false;

		if (navLogoText) gsap.set(navLogoText, { x: 0, autoAlpha: 1 });

		// Clean up any existing trigger
		const oldTrigger = ScrollTrigger.getById("hideShowNav");
		if (oldTrigger) oldTrigger.kill();

		// rAF update loop
		function updateNav() {
			ticking = false;

			const y = currentScrollY;
			const delta = y - lastScrollY;

			// --- NAV VISIBILITY ---
			if (y <= showThreshold) {
				if (navHidden) {
					nav.classList.remove("is-hidden", "is-past-threshold");
					navHidden = false;
				}
				revealDistance = 0;
			} else if (delta > hideBuffer && y > hideThreshold && !navHidden) {
				nav.classList.add("is-hidden", "is-past-threshold");
				navHidden = true;
				revealDistance = 0;
			} else if (delta < 0 && navHidden) {
				revealDistance -= delta; // delta is negative
				if (revealDistance >= revealBuffer) {
					nav.classList.remove("is-hidden");
					navHidden = false;
					revealDistance = 0;
				}
			}

			nav.classList.toggle("is-past-threshold", y > hideThreshold);

			// --- LOGO ANIMATION ---
			if (navLogoText) {
				if (y > logoThreshold && !logoHidden) {
					logoHidden = true;
					gsap.to(navLogoText, {
						x: "-1.25rem",
						autoAlpha: 0,
						duration: 0.35,
						ease: "power2.out",
						overwrite: true,
					});
				} else if (y <= logoThreshold && logoHidden) {
					logoHidden = false;
					gsap.to(navLogoText, {
						x: "0rem",
						autoAlpha: 1,
						duration: 0.35,
						ease: "power2.out",
						overwrite: true,
					});
				}
			}

			lastScrollY = y;
		}

		// ScrollTrigger watches scroll and schedules an update
		ScrollTrigger.create({
			id: "hideShowNav",
			trigger: document.body,
			start: "top top",
			end: "bottom bottom",
			onUpdate() {
				currentScrollY = window.scrollY;
				if (!ticking) {
					ticking = true;
					requestAnimationFrame(updateNav);
				}
			},
		});
	}

	function countriesDropdown() {
		const select = document.querySelector('select[name="Country"]:not([fs-list-field="location"])');
		if (!select) {
			// console.error("Country <select> not found.");
			return;
		}

		// Fetch country data
		fetch("https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json")
			.then((res) => {
				if (!res.ok) throw new Error(`Failed to fetch country data: ${res.status}`);
				return res.json();
			})
			.then((data) => {
				// Sort by country name
				const sortedCountries = data.map((c) => c.name.common).sort((a, b) => a.localeCompare(b));

				// Clear existing options
				select.innerHTML = "";

				// Add placeholder option
				const placeholder = document.createElement("option");
				placeholder.value = "";
				placeholder.textContent = "Select a country";
				placeholder.disabled = true;
				placeholder.selected = true;
				select.appendChild(placeholder);

				// Populate options
				for (const name of sortedCountries) {
					const option = document.createElement("option");
					option.value = name;
					option.textContent = name;
					select.appendChild(option);
				}

				// Trigger Finsweet Custom Select refresh
				document.dispatchEvent(new Event("fsselectcustom:update"));
			})
			.catch((err) => console.error("Error loading countries:", err));
	}

	function handleLocalTimes(scope = document) {
		// Find all parent location elements first
		const locationParents = scope.querySelectorAll(
			"[data-location-element='parent']:not([data-location-processed])",
		);
		if (locationParents.length === 0) return;

		console.log(`Processing ${locationParents.length} location elements in scope:`, scope);

		for (const parent of locationParents) {
			// Mark as processed to avoid duplicate processing
			parent.setAttribute("data-location-processed", "true");

			// Find all time elements within this parent
			const timeElements = parent.querySelectorAll("[data-local-time]");

			// Find day/night images within this parent
			const dayImages = parent.querySelectorAll("[data-location-element='day']");
			const nightImages = parent.querySelectorAll("[data-location-element='night']");

			// If no time elements, skip time-based logic but leave day images visible
			if (timeElements.length === 0) {
				console.log("No time elements found in parent:", parent);
				continue;
			}

			// Get timezone from first time element (assuming all times in same parent use same timezone)
			const tz = timeElements[0].getAttribute("data-tz");
			if (!tz) {
				console.warn("Missing timezone (data-tz) for time elements in parent:", parent);
				continue;
			}

			// Set initial state - night images hidden by default
			if (nightImages.length > 0) {
				gsap.set(nightImages, { autoAlpha: 0 });
			}
			if (dayImages.length > 0) {
				gsap.set(dayImages, { autoAlpha: 1 });
			}

			// Helper to determine if it's night time (6pm-6am)
			const isNightTime = () => {
				try {
					const now = new Date();
					const hour = parseInt(
						now.toLocaleTimeString([], {
							timeZone: tz,
							hour: "2-digit",
							hour12: false,
						}),
					);

					// Night time is 18:00 (6pm) to 06:00 (6am)
					return hour >= 18 || hour < 6;
				} catch (e) {
					console.warn("Could not determine time for timezone:", tz, e);
					return false; // Default to day if we can't determine
				}
			};

			// Helper to update both time displays and images
			const updateTimeAndImages = () => {
				try {
					// Update all time displays in this parent
					const time = new Date().toLocaleTimeString([], {
						timeZone: tz,
						hour: "2-digit",
						minute: "2-digit",
					});

					timeElements.forEach((timeElement) => {
						timeElement.textContent = time;
						if (
							timeElement.dataset.localTimeProcessed === "false" ||
							!timeElement.dataset.localTimeProcessed
						) {
							gsap.set(timeElement, { autoAlpha: 1 });
							timeElement.dataset.localTimeProcessed = "true";
						}
					});

					// Update images based on time of day (only if we have both day and night images)
					if (dayImages.length > 0 && nightImages.length > 0) {
						const isNight = isNightTime();

						if (isNight) {
							// Show night, hide day
							gsap.to(dayImages, { autoAlpha: 0, duration: 1, ease: "power2.inOut" });
							gsap.to(nightImages, { autoAlpha: 1, duration: 1, ease: "power2.inOut" });
						} else {
							// Show day, hide night
							gsap.to(dayImages, { autoAlpha: 1, duration: 1, ease: "power2.inOut" });
							gsap.to(nightImages, { autoAlpha: 0, duration: 1, ease: "power2.inOut" });
						}
					}

					// console.log(
					// 	`Updated location ${parent} - Time: ${time}, Night: ${isNightTime()}, Time elements: ${
					// 		timeElements.length
					// 	}, Day images: ${dayImages.length}, Night images: ${nightImages.length}`
					// );
				} catch (e) {
					console.warn("Could not update time and images for parent:", parent, e);
				}
			};

			// Initial render
			updateTimeAndImages();

			// Update every minute, synchronized to the next minute mark
			const msUntilNextMinute = 60000 - (Date.now() % 60000);
			setTimeout(() => {
				updateTimeAndImages();
				setInterval(updateTimeAndImages, 60000);
			}, msUntilNextMinute);
		}
	}

	lenus.greenhouse = {
		apiUrl: "https://boards-api.greenhouse.io/v1/boards/lenusehealth/jobs?content=true", // ✅ your actual board slug

		init() {
			const component = document.querySelector("#job-listings");
			if (!component) return;

			const group_list = component.querySelector(".events-group_list");
			if (!group_list) return;

			this._listContainer = group_list; // store for Finsweet integration

			// Clone the job template and delete original
			const originalJobItem = group_list.querySelector(".events-group_list-item");
			if (!originalJobItem) {
				return;
			}
			this.jobTemplate = originalJobItem.cloneNode(true);
			originalJobItem.remove();

			if (!this.jobTemplate) {
				console.warn(
					"[Lenus.Greenhouse] No .events-group_list-item found inside .events-group template.",
				);
				return;
			}

			fetch(this.apiUrl)
				.then((res) => res.json())
				.then((data) => {
					console.log("Greenhouse API response:", data);

					if (!data.jobs) {
						console.warn("No jobs found in API response");
						return;
					}

					const jobs = data.jobs;

					jobs.forEach((job) => {
						job.jobDepartment = job.departments?.[0]?.name || "";
						job.jobLocation = job.location?.name || "";
						if (job.jobLocation) {
							job.jobLocation = simplifyLocation(job.jobLocation);
						}
					});

					this.renderJobs(jobs, group_list);

					const locations = [...new Set(jobs.map((j) => j.jobLocation).filter(Boolean))];
					const departments = [...new Set(jobs.map((j) => j.jobDepartment).filter(Boolean))];

					this.populateFilters({ locations, departments });

					setTimeout(() => {
						this.reinitFinsweet();
					}, 50);
				})
				.catch((err) => console.error("Greenhouse fetch error:", err));

			function simplifyLocation(name) {
				if (!name) return "";
				const parts = name.split(",").map((p) => p.trim());
				if (parts.length >= 3) {
					const country = parts[parts.length - 1];
					const stateOrProvince = parts[parts.length - 2];
					const city = parts.slice(0, parts.length - 2).join(", ");
					if (country === "United States" || country === "Canada") {
						return `${city}, ${stateOrProvince}`;
					}
					return `${city}, ${country}`;
				}
				return name;
			}
		},

		renderJobs(jobs, container) {
			// container.innerHTML = "";

			if (!jobs.length) {
				container.innerHTML =
					'<div class="body-m">No current openings. Please check back soon.</div>';
				return;
			}

			const orderedDepartments = [];
			const seen = new Set();
			jobs.forEach((job) => {
				const deptName = job.jobDepartment;
				if (!seen.has(deptName)) {
					seen.add(deptName);
					orderedDepartments.push(deptName);
				}
			});

			orderedDepartments.forEach((deptName) => {
				jobs
					.filter((job) => job.jobDepartment === deptName)
					.forEach((job) => {
						const jobClone = this.jobTemplate.cloneNode(true);

						// Mark as a Finsweet List item
						jobClone.setAttribute("fs-list-element", "item");

						const linkEl = jobClone.querySelector("[data-template='link']");
						const nameEl = jobClone.querySelector("[data-template='name']");
						const deptEl = jobClone.querySelector("[data-template='department']");
						const locEl = jobClone.querySelector("[data-template='location']");

						if (linkEl) {
							linkEl.href = "/careers/opportunity-details/?gh_jid=" + job.id;
							linkEl.target = "_blank";
						}
						if (nameEl) nameEl.textContent = job.title;
						if (deptEl) deptEl.textContent = job.jobDepartment || "";
						if (deptEl) jobClone.setAttribute("data-department", job.jobDepartment || "");
						if (locEl) locEl.textContent = job.jobLocation || "";

						container.appendChild(jobClone);
					});
			});
		},

		reinitFinsweet() {
			const container = this._listContainer;
			if (!container) return;

			// Prevent duplicate hook registration
			if (this._fsHookAdded) return;
			this._fsHookAdded = true;

			window.FinsweetAttributes ||= [];
			window.FinsweetAttributes.push([
				"list",
				(listInstances) => {
					const listInstance = listInstances.find((inst) => inst.listElement === container);
					if (!listInstance) return;

					// Add any new DOM items not yet tracked
					const existing = new Set(listInstance.items.value.map((i) => i.element));
					const newEls = Array.from(container.querySelectorAll('[fs-list-element="item"]')).filter(
						(el) => !existing.has(el),
					);

					if (newEls.length) {
						const created = newEls.map((el) => listInstance.createItem(el));
						listInstance.items.value = [...listInstance.items.value, ...created];
						listInstance.triggerHook("filter");
					}

					// Optional: department headers via data attributes could be handled here later
				},
			]);
		},

		populateFilters({ locations = [], departments = [] }) {
			const locSelect = document.querySelector('[data-greenhouse-filter="location"] select');
			const depSelect = document.querySelector('[data-greenhouse-filter="department"] select');

			if (locSelect) this.populateSelectCustom(locSelect, locations, "All locations");
			if (depSelect) this.populateSelectCustom(depSelect, departments, "All departments");
		},

		populateSelectCustom(selectEl, items, defaultLabel = "All") {
			if (!selectEl) return;

			selectEl.innerHTML = `<option value="">${defaultLabel}</option>`;
			items
				.sort((a, b) => a.localeCompare(b))
				.forEach((val) => {
					const opt = document.createElement("option");
					opt.value = val;
					opt.textContent = val;
					selectEl.appendChild(opt);
				});

			const selectWrap = selectEl.closest("[fs-selectcustom-element='dropdown']");
			if (selectWrap && window.FinsweetAttributes?.selectcustom?.init) {
				window.FinsweetAttributes.selectcustom.init(selectWrap);
			}
		},
	};
	// ...existing code...

	function decodeHTML(html) {
		const txt = document.createElement("textarea");
		txt.innerHTML = html;
		return txt.value;
	}

	lenus.greenhouseJob = {
		apiBase: "https://boards-api.greenhouse.io/v1/boards/lenusehealth/jobs/",

		init() {
			const params = new URLSearchParams(window.location.search);
			const id = params.get("gh_jid");

			if (!id) {
				console.warn("[Lenus.GreenhouseJob] Missing ?gh_jid parameter");
				document.documentElement.setAttribute("data-job-status", "error");
				return;
			}

			this.fetchJob(id);
		},

		async fetchJob(id) {
			try {
				const res = await fetch(`${this.apiBase}${id}?content=true`);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const job = await res.json();
				this.render(job);
			} catch (err) {
				console.error("[Lenus.GreenhouseJob] Fetch error:", err);
				document.documentElement.setAttribute("data-job-status", "error");
			}
		},

		render(job) {
			if (!job || !job.id) {
				document.documentElement.setAttribute("data-job-status", "error");
				return;
			}

			document.documentElement.setAttribute("data-job-status", "loaded");

			// Populate core fields
			this.setText("[data-template='name']", job.title);
			this.setText("[data-template='company-name']", job.company_name || "Lenus");

			// Handle optional sidebar items
			this.setTextOrHide("[data-template='location']", job.location?.name);
			this.setTextOrHide("[data-template='department']", job.departments?.[0]?.name);

			// Description comes as HTML
			const descEl = document.querySelector("[data-template='description']");
			if (descEl) descEl.innerHTML = decodeHTML(job.content || "");

			console.log("[Lenus.GreenhouseJob] Job loaded:", job.title);

			// refresh scroll triggers
			setTimeout(() => {
				ScrollTrigger.refresh();
			}, 1000);
		},

		setText(selector, value) {
			const el = document.querySelector(selector);
			if (el && value) el.textContent = value;
		},

		setTextOrHide(selector, value) {
			const el = document.querySelector(selector);
			if (!el) return;
			const parentSidebarItem = el.closest(".job_sidebar-item");
			if (value) {
				el.textContent = value;
				if (parentSidebarItem) parentSidebarItem.style.display = "";
			} else if (parentSidebarItem) {
				parentSidebarItem.style.display = "none";
			}
		},

		handleApplicationIframe() {
			const appWrapper = document.querySelector(".greenhouse-application");
			const tabButtons = document.querySelectorAll(".tab-controls_item");

			if (!appWrapper || !tabButtons.length) return;

			console.log("[Lenus.GreenhouseJob] Setting up Application iframe handling");

			// 1) Whenever the application block changes height, keep ScrollTrigger in sync.
			if ("ResizeObserver" in window) {
				const ro = new ResizeObserver(() => {
					// CTA and any other pinned sections need fresh measurements
					ScrollTrigger.refresh();
				});
				ro.observe(appWrapper);
			}

			let hasRebuiltIframe = false;

			function initApplicationTab() {
				console.log("[Lenus.GreenhouseJob] Application tab activated");
				// Only rebuild once – first time the Application tab is opened
				if (!hasRebuiltIframe) {
					hasRebuiltIframe = true;

					// If the Greenhouse embed script is present, rebuild the iframe
					// now that the panel is visible. Grnhse.Iframe.load() will
					// look up the gh_jid from the URL and inject a new iframe
					// into #grnhse_app.
					if (window.Grnhse && Grnhse.Iframe && typeof Grnhse.Iframe.load === "function") {
						try {
							Grnhse.Iframe.load();
						} catch (e) {
							console.warn("[Lenus.GreenhouseJob] Grnhse.Iframe.load() failed", e);
						}
					}
				}

				// Give Greenhouse a moment to size itself, then:
				//  - nudge any resize listeners it has
				//  - refresh ScrollTrigger so CTA uses the final page length
				setTimeout(() => {
					try {
						// helps the Greenhouse embed's internal window.resize handler
						window.dispatchEvent(new Event("resize"));
					} catch (e) {
						// Some environments may not like synthetic resize; non-fatal.
					}

					// Critical: this is what fixes the CTA and any other ScrollTriggers
					ScrollTrigger.refresh();
				}, 400);
			}

			// 2) Bind to the Application tab (by name) instead of every tab blindly.
			tabButtons.forEach((btn) => {
				const tabName = (btn.innerHTML || "").toLowerCase();

				// Adjust this check if your tab label is different (e.g. "Apply now")
				if (!tabName.includes("application")) return;

				btn.addEventListener("click", () => {
					// Let Webflow switch the tab pane first
					setTimeout(initApplicationTab, 50);
				});
			});

			// // 3) If the Application tab is already active on initial load (deep-link, restore),
			// // run the same logic on window load.
			// window.addEventListener("load", () => {
			// 	const current = document.querySelector(".job_tabs-menu [data-w-tab].w--current");
			// 	if (!current) return;
			// 	const tabName = (current.getAttribute("data-w-tab") || "").toLowerCase();
			// 	if (tabName.includes("application") || tabName.includes("apply")) {
			// 		initApplicationTab();
			// 	}
			// });
		},
	};

	/* helper functions */

	// resizeManager
	const ResizeManager = (() => {
		const callbacks = new Map(); // resize callbacks with config
		const mediaQueries = new Map(); // { query: { mq, handler } }

		let lastW = window.innerWidth;
		let lastH = window.innerHeight;
		const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);

		// --- Internal debounce utility (no external dependency) ---
		const debounce = (fn, delay = 200) => {
			let t;
			return (...args) => {
				clearTimeout(t);
				t = setTimeout(() => fn.apply(this, args), delay);
			};
		};

		// --- Register a resize callback ---
		function add(fn, options = {}) {
			const config = {
				debounce: 200,
				immediate: false,
				breakpoint: null,
				...options,
			};
			callbacks.set(fn, config);

			if (config.immediate) {
				fn({
					width: lastW,
					height: lastH,
					isInitial: true,
				});
			}
		}

		// --- Remove a specific callback ---
		function remove(fn) {
			callbacks.delete(fn);
		}

		// --- Clear everything (resize + media queries) ---
		function clear() {
			callbacks.clear();
			mediaQueries.forEach(({ mq, handler }) => {
				mq.removeEventListener("change", handler);
			});
			mediaQueries.clear();
		}

		// --- Extract numeric breakpoint value from query ---
		function extractBreakpoint(query) {
			const match = query.match(/(\d+)px/);
			return match ? parseInt(match[1]) : null;
		}

		// --- Media query registration ---
		function addMediaQuery(query, callback, options = {}) {
			const { immediate = true } = options;
			const mq = window.matchMedia(query);

			const handler = (e) => {
				callback({
					matches: e.matches,
					query: e.media || query,
					breakpoint: extractBreakpoint(query),
				});
			};

			mq.addEventListener("change", handler);
			mediaQueries.set(query, { mq, handler });

			if (immediate) handler(mq);

			// Return cleanup function
			return () => {
				const entry = mediaQueries.get(query);
				if (entry) {
					entry.mq.removeEventListener("change", entry.handler);
					mediaQueries.delete(query);
				}
			};
		}

		// --- Common breakpoint queries ---
		const breakpoints = {
			mobile: "(max-width: 767px)",
			tablet: "(max-width: 1024px)",
			desktop: "(min-width: 1025px)",
			hover: "(hover: hover)",
			touch: "(hover: none)",
			reducedMotion: "(prefers-reduced-motion: reduce)",
		};

		// --- Convenience helpers for common breakpoints ---
		const onMobile = (cb, options) => addMediaQuery(breakpoints.mobile, cb, options);
		const onTablet = (cb, options) => addMediaQuery(breakpoints.tablet, cb, options);
		const onDesktop = (cb, options) => addMediaQuery(breakpoints.desktop, cb, options);

		// --- Main resize handler ---
		const run = () => {
			const w = window.innerWidth;
			const h = window.innerHeight;

			const widthChanged = w !== lastW;
			const heightChanged = Math.abs(h - lastH) > 60; // Ignore Safari toolbar bounce

			// Ignore Safari address bar show/hide resizes
			if (isIOS && !widthChanged && heightChanged) return;

			const prevW = lastW;
			const prevH = lastH;
			lastW = w;
			lastH = h;

			const resizeData = {
				width: w,
				height: h,
				prevWidth: prevW,
				prevHeight: prevH,
				widthChanged,
				heightChanged,
			};

			callbacks.forEach((config, fn) => {
				try {
					fn(resizeData);
				} catch (err) {
					console.error("ResizeManager callback error:", err);
				}
			});
		};

		// --- Attach global listener once ---
		window.addEventListener("resize", debounce(run, 300));

		// --- Public API ---
		return {
			add,
			remove,
			clear,
			addMediaQuery,
			onMobile,
			onTablet,
			onDesktop,
			breakpoints,
			run, // manual trigger
		};
	})();
	lenus.resizeManager = ResizeManager;

	/* for a card with a video and an image, show the video and hide the image or vice versa */
	lenus.helperFunctions.showVideo = function (
		card,
		videoSelector = "video",
		imgSelector = "img",
		bool = true,
	) {
		const video = card.querySelector(videoSelector);
		const img = imgSelector ? card.querySelector(imgSelector) : null;
		// If we have both video and image, keep the existing crossfade
		if (video && img) {
			const toShow = bool ? video : img;
			const toHide = bool ? img : video;

			gsap.to(toHide, {
				autoAlpha: 0,
				duration: 0.3,
				ease: "power2.out",
			});
			gsap.to(toShow, {
				autoAlpha: 1,
				duration: 0.3,
				ease: "power2.out",
			});
		} else {
			// Video-only case: just toggle the video visibility
			gsap.to(video, {
				autoAlpha: bool ? 1 : 0,
				duration: 0.3,
				ease: "power2.out",
			});
		}

		// add playing class to card if showing video
		if (bool) {
			card.classList.add("playing");
		} else {
			card.classList.remove("playing");
		}
	};

	lenus.helperFunctions.playVideo = function (video) {
		// play video if it has autoplay enabled OR an ancestor .card has class 'playing' - note not all videos are inside cards
		const card = video.closest(".card");
		if (card) {
			if (video.autoplay === false && !card.classList.contains("playing")) return;
		} else {
			// if no card, just check the video itself
			if (video.autoplay === false) return;
		}

		if (!video.dataset.videoLoaded) {
			console.warn(`Video ${video.id} not loaded yet, skipping play.`);
			return;
		}
		console.log("Playing", video);
		video.play();
	};

	// simple debounce utility
	lenus.helperFunctions.debounce = function (fn, delay = 200) {
		let id;
		return (...args) => {
			clearTimeout(id);
			id = setTimeout(() => fn.apply(this, args), delay);
		};
	};

	lenus.helperFunctions.setUpProgressBar = function (
		component,
		cards,
		splideInstance,
		splideSlides,
	) {
		const progress = component.querySelector(".carousel_progress");
		if (!progress) return;

		// get color variables from component
		const progressLineColor = getComputedStyle(component).getPropertyValue(
			"--_theme---progress-line",
		);
		const progressLineActiveColor = getComputedStyle(component).getPropertyValue(
			"--_theme---progress-line-active",
		);

		progress.innerHTML = ""; // clear existing progress lines
		const slideLength = splideSlides.getLength(true); // true to include clones

		// create progress lines based on the number of slides
		for (let i = 0; i < slideLength; i++) {
			const progressLine = document.createElement("div");
			progressLine.classList.add("carousel_progress-line");
			progress.appendChild(progressLine);
		}

		const progressLines = progress.querySelectorAll(".carousel_progress-line");

		splideInstance.on("active", function () {
			// on active slide change, update the progress bar
			const activeIndex = splideInstance.index;

			progressLines.forEach((line, index) => {
				if (index === activeIndex) {
					gsap.to(line, {
						color: progressLineActiveColor,
						// color: "red",
						duration: 0.3,
						ease: "power2.out",
					});
				} else {
					gsap.to(line, {
						color: progressLineColor,
						// color: "blue",
						duration: 0.3,
						ease: "power2.out",
					});
				}
			});
		});

		// on click on each progress line, jump to the corresponding slide and pause any playing video
		progressLines.forEach((line, index) => {
			line.addEventListener("click", () => {
				splideInstance.go(index);
				lenus.helperFunctions.resetAllCards(cards);
			});
		});

		// set initial state
		progressLines.forEach((line, index) => {
			if (index === splideInstance.index) {
				gsap.set(line, {
					color: progressLineActiveColor,
				});
			} else {
				gsap.set(line, {
					color: progressLineColor,
				});
			}
		});
	};

	lenus.helperFunctions.resetCard = function (card, videoSelector = "video", imgSelector = "img") {
		lenus.helperFunctions.showVideo(card, videoSelector, imgSelector, false);
		card.classList.remove("playing");
		const video = card.querySelector("video");
		if (video) {
			video.pause();
			// video.currentTime = 0;
			// video.controls = true;
		}
	};

	lenus.helperFunctions.resetAllCards = function (cards, exclusion = null) {
		cards.forEach((c) => {
			if (c !== exclusion) {
				lenus.helperFunctions.resetCard(c);
			}
		});
	};

	lenus.helperFunctions.videoController = (function () {
		const registry = new Map();
		const listeners = {
			play: new Set(),
			pause: new Set(),
		};

		function isRegistered(card) {
			return registry.has(card);
		}

		function register({
			card,
			selectors = {},
			pauseOthers = true,
			onPlay,
			onPause,
			startVisible = false,
		}) {
			if (!card) return null;
			const videoSelector = selectors.video || "video";
			const imgSelector = selectors.img || "img";
			const playSelector = selectors.play;
			const video = card.querySelector(videoSelector);
			if (!video) return null;

			if (isRegistered(card)) unregister(card);

			const entry = {
				card,
				video,
				videoSelector,
				imgSelector,
				pauseOthers,
				onPlay,
				onPause,
				handlers: [],
			};
			registry.set(card, entry);

			const img = imgSelector ? card.querySelector(imgSelector) : null;

			if (!startVisible) {
				// console.log("Hiding video initially for", video);
				gsap.set(video, { autoAlpha: 0 });
				if (img) gsap.set(img, { autoAlpha: 1 });
				card.classList.remove("playing");
			} else if (startVisible) {
				// console.log("Showing video initially for", video);
				gsap.set(video, { autoAlpha: 1 });
				if (img) gsap.set(img, { autoAlpha: 0 });
				card.classList.add("playing");
			}

			video.controls = true;
			video.autoplay = false;
			video.removeAttribute("autoplay");
			video.pause();

			const isVideoFullscreen = (vid) =>
				document.fullscreenElement === vid ||
				document.webkitFullscreenElement === vid ||
				document.msFullscreenElement === vid ||
				(typeof vid.matches === "function" && vid.matches(":fullscreen")) ||
				vid.webkitDisplayingFullscreen;

			const clearFullscreenIgnore = () => {
				if (video._ignorePauseTimer) {
					clearTimeout(video._ignorePauseTimer);
					video._ignorePauseTimer = null;
				}
				video._ignorePauseReason = null;
			};

			const markFullscreenInteraction = () => {
				if (video._ignorePauseTimer) {
					clearTimeout(video._ignorePauseTimer);
				}
				video._ignorePauseReason = "fullscreen";
				video._ignorePauseTimer = setTimeout(clearFullscreenIgnore, 450);
			};

			let wasFullscreen = isVideoFullscreen(video);
			const handleFullscreenChange = () => {
				const isFs = isVideoFullscreen(video);
				if (isFs !== wasFullscreen) {
					wasFullscreen = isFs;
					markFullscreenInteraction();
				}
			};

			["fullscreenchange", "webkitfullscreenchange", "MSFullscreenChange"].forEach((evt) => {
				document.addEventListener(evt, handleFullscreenChange);
				entry.handlers.push({ element: document, type: evt, handler: handleFullscreenChange });
			});

			["webkitbeginfullscreen", "webkitendfullscreen"].forEach((evt) => {
				video.addEventListener(evt, markFullscreenInteraction);
				entry.handlers.push({ element: video, type: evt, handler: markFullscreenInteraction });
			});

			if (playSelector) {
				const triggers = Array.from(card.querySelectorAll(playSelector));
				triggers.forEach((trigger) => {
					const handler = (event) => {
						event.preventDefault();
						play(card);
					};
					trigger.addEventListener("click", handler);
					entry.handlers.push({ element: trigger, type: "click", handler });
				});
			}

			const handleVideoPause = () => {
				if (!card.classList.contains("playing")) return;
				if (isVideoFullscreen(video)) {
					markFullscreenInteraction();
					return;
				}
				if (video.seeking) {
					return;
				}
				if (video._ignorePauseReason === "fullscreen") {
					return;
				}
				pause(card);
			};
			const handleVideoEnded = () => pause(card);

			video.addEventListener("pause", handleVideoPause);
			video.addEventListener("ended", handleVideoEnded);
			entry.handlers.push({ element: video, type: "pause", handler: handleVideoPause });
			entry.handlers.push({ element: video, type: "ended", handler: handleVideoEnded });

			return () => unregister(card);
		}

		function unregister(card) {
			const entry = registry.get(card);
			if (!entry) return;
			entry.handlers.forEach(({ element, type, handler }) => {
				element.removeEventListener(type, handler);
			});
			registry.delete(card);
		}

		function play(card) {
			const entry = registry.get(card);
			if (!entry) return;
			const { video, videoSelector, imgSelector } = entry;
			if (entry.pauseOthers) pauseAll(card);
			lenus.helperFunctions.showVideo(card, videoSelector, imgSelector, true);
			// video.controls = true;
			console.log("Attempting to play", video);
			const playAttempt = video.play();
			if (playAttempt && typeof playAttempt.catch === "function") {
				playAttempt.catch((error) => {
					console.warn("Video play prevented", error);
				});
			}
			card.classList.add("playing");
			emit("play", { card, video });
			entry.onPlay?.({ card, video });
		}

		function pause(card) {
			console.log("Pausing card", card);
			const entry = registry.get(card);
			if (!entry) return;
			const wasPlaying = card.classList.contains("playing");
			const { videoSelector, imgSelector, video } = entry;
			lenus.helperFunctions.resetCard(card, videoSelector, imgSelector);
			if (!wasPlaying) return;
			emit("pause", { card, video });
			entry.onPause?.({ card, video });
		}

		function pauseAll(excludeCard = null) {
			registry.forEach((entry, card) => {
				if (card === excludeCard) return;
				pause(card);
			});
		}

		function on(event, handler) {
			if (!listeners[event]) return () => {};
			listeners[event].add(handler);
			return () => listeners[event].delete(handler);
		}

		function emit(event, payload) {
			const subs = listeners[event];
			if (!subs) return;
			subs.forEach((handler) => handler(payload));
		}

		return {
			register,
			unregister,
			isRegistered,
			play,
			pause,
			pauseAll,
			on,
		};
	})();

	// Initialize a Splide carousel with common settings and optional progress bar
	// Returns the Splide instance for further customization if needed
	// Usage: lenus.helperFunctions.initSplideCarousel(component, { config: { ... }, onActive: fn, onOverflow: fn })
	lenus.helperFunctions.initSplideCarousel = function (component, options = {}) {
		if (!component) return null;

		// Validate component structure first
		const validation = lenus.helperFunctions.validateSplideStructure(component);
		if (!validation.isValid) {
			console.warn(
				`Skipping Splide initialization due to invalid structure:`,
				component,
				validation.missing,
			);
			return null;
		}

		const {
			config = {},
			mountExtensions = true,
			onActive = null,
			onDestroy = null,
			onMounted = null,
			onReady = null,
			onOverflow = null,
			responsive = null,
			watchLocalTimes = false, // watch for new local time elements to init
		} = options;

		// if responsive, handle with separate responsive function
		if (responsive) {
			return lenus.helperFunctions.handleResponsiveCarousel(component, { ...options, responsive });
		}

		const defaultConfig = {
			perMove: 1,
			type: "loop",
			autoplay: false, // not used
			gap: "1.5rem",
			arrows: false, // controlled by .carousel_controls presence
			pagination: false, // never used
			focus: 0,
			speed: 800,
			dragAngleThreshold: 60,
			autoWidth: true, // most common case
			rewind: false,
			rewindSpeed: 1000,
			waitForTransition: false,
			updateOnMove: true,
			trimSpace: "move",
			drag: true,
			snap: true,
			clones: 2, // default, will be disabled on overflow check
			// easing: "cubic-bezier(0.5, 0, 0.75, 0)", // ease in
			easing: "cubic-bezier(0.25, 1, 0.5, 1)", // ease out
		};

		function getCloneCountFromSets(component, sets) {
			if (!sets || sets <= 0) return 0;

			// Use validation result first to avoid re-querying
			const slideCount =
				validation && typeof validation.slideCount === "number"
					? validation.slideCount
					: lenus.helperFunctions.validateSplideStructure(component).slideCount || 0;

			if (!slideCount) return 0;

			const totalClonesNeeded = slideCount * sets;
			// Splide expects clones per side
			return Math.ceil(totalClonesNeeded / 2);
		}

		const mergedConfig = { ...defaultConfig, ...config };

		// Interpret clones as "sets" with priority:
		// 1) data-splide-clones attribute
		// 2) config.clones
		// 3) defaultConfig.clones
		const attr = component.getAttribute("data-splide-clones");
		const attrSets = attr != null ? parseInt(attr, 10) : null;

		let setsFromConfig = mergedConfig.clones;
		if (typeof setsFromConfig === "function") {
			const raw = setsFromConfig(component);
			setsFromConfig = Number.isFinite(raw) ? raw : defaultConfig.clones;
		}

		const effectiveSets = Number.isFinite(attrSets)
			? attrSets
			: Number.isFinite(setsFromConfig)
				? setsFromConfig
				: defaultConfig.clones;

		mergedConfig.clones = getCloneCountFromSets(component, effectiveSets);

		const hasAutoScroll = component.dataset.autoscroll === "true";

		if (hasAutoScroll) {
			mergedConfig.autoScroll = {
				speed: 1,
				pauseOnHover: true,
				...(config.autoScroll || {}),
			};
			mergedConfig.intersection = {
				inView: {
					autoScroll: true,
				},
				outView: {
					autoScroll: false,
				},
				...(config.intersection || {}),
			};
		}

		// Controls detection - arrows enabled if .carousel_controls exists
		const hasControls = !!component.querySelector(".carousel_controls");
		if (hasControls) {
			mergedConfig.arrows = true;
		}

		const instance = new Splide(component, mergedConfig);

		// Overflow handling - disable features when not needed
		instance.on("overflow", function (isOverflow) {
			console.log("[initSplideCarousel] Carousel overflow status:", isOverflow);
			instance.go(0);
			const updates = {
				arrows: hasControls && isOverflow, // arrows only if controls exist and overflow
				drag: isOverflow ? mergedConfig.drag : false, // disable drag if no overflow
				clones: isOverflow ? mergedConfig.clones : 0, // disable clones if no overflow
			};

			// Hide/show controls based on overflow - TODO do this with CSS instead
			const controls = component.querySelector(".carousel_controls");
			if (controls) {
				controls.style.display = isOverflow ? "" : "none";
			}

			instance.options = updates;

			// Custom overflow callback
			if (onOverflow) onOverflow(isOverflow, instance);
		});

		// Event handlers - to be declared before mounting
		if (onMounted)
			instance.on("mounted", () => {
				console.log("[initSplideCarousel] Splide mounted:", instance);
				onMounted(instance);
			});

		if (onReady)
			instance.on("ready", () => {
				console.log("[initSplideCarousel] Splide ready:", instance);
				onReady(instance);
			});

		// Mount with extensions if needed
		if (hasAutoScroll && window.splide?.Extensions) {
			instance.mount(window.splide.Extensions);
		} else {
			instance.mount();
		}

		// Auto-scroll + autoplay dual mode handling for video carousels

		const enableAutoMotion =
			mergedConfig.customAutoscroll === true && component.dataset.autoscroll !== "false";

		if (enableAutoMotion) {
			// Ensure both systems are configured (but we’ll only run one at a time)
			mergedConfig.autoScroll = {
				speed: 1,
				pauseOnHover: true,
				...(config.autoScroll || {}),
			};

			// Autoplay “snap”
			mergedConfig.autoplay = true;
			mergedConfig.interval = mergedConfig.interval ?? 4000;
			mergedConfig.speed = mergedConfig.speed ?? 700;
			mergedConfig.easing = mergedConfig.easing ?? "cubic-bezier(0.19, 1, 0.22, 1)"; // expo-ish feel
			mergedConfig.pauseOnHover = mergedConfig.pauseOnHover ?? true;
			mergedConfig.pauseOnFocus = mergedConfig.pauseOnFocus ?? true;
		}

		if (enableAutoMotion) {
			// see https://github.com/Splidejs/splide/issues/58#issuecomment-641683634
			const mq = window.matchMedia("(max-width: 767px)");

			const syncAutoMode = () => {
				const AS = instance.Components?.AutoScroll;
				const AP = instance.Components?.Autoplay;

				console.log(
					`[initSplideCarousel] syncAutoMode: ${
						mq.matches ? "mobile (autoplay)" : "desktop (autoscroll)"
					}`,
				);

				if (mq.matches) {
					// mobile: autoplay snap
					AS?.pause?.();
					AP?.play?.(99);
				} else {
					// desktop: fluid autoscroll
					AP?.pause?.(99);
					AS?.play?.();
				}
			};

			// Start correct mode
			instance.on("mounted", syncAutoMode);

			// Switch on breakpoint changes
			mq.addEventListener("change", syncAutoMode);
			instance.on("destroy", () => mq.removeEventListener("change", syncAutoMode));

			// Hold/drag should freeze motion
			instance.on("drag", () => {
				instance.Components?.AutoScroll?.pause?.();
				instance.Components?.Autoplay?.pause?.(99);
			});
			instance.on("dragged", syncAutoMode);

			// Optional: expose helper so videoCarousel can resume “the right one”
			instance._syncAutoMode = syncAutoMode;

			// fire it once after mount to ensure correct state
			syncAutoMode();
		}

		// if (onDestroy) instance.on("destroy", onDestroy);
		// if (onActive) instance.on("active", onActive);

		// Progress bar setup - automatic if .carousel_progress exists
		const progressContainer = component.querySelector(".carousel_progress");
		if (progressContainer) {
			// get slides and cards for progress bar and video control
			const splideSlides = instance.Components.Slides;
			const cards = lenus.helperFunctions.getCards(component);
			lenus.helperFunctions.setUpProgressBar(component, cards, instance, splideSlides);
		}

		// ⏰ Optional: Watch for [data-local-time] updates
		if (watchLocalTimes) {
			const updateTimes = () => handleLocalTimes(component);

			// Run once initially after mount
			instance.on("mounted", updateTimes);

			// Re-run whenever Splide creates new clones or updates
			instance.on("updated", updateTimes);
			instance.on("refresh", updateTimes);

			// Optional: handle destroy cleanup if needed
			instance.on("destroy", () => {
				// Clear any processed flags in case the component gets reused
				component.querySelectorAll("[data-time-processed]").forEach((el) => {
					el.removeAttribute("data-time-processed");
				});
			});
		}

		return instance;
	};

	lenus.helperFunctions.validateSplideStructure = function (component) {
		if (!component) {
			console.warn("Splide validation: No component provided");
			return { isValid: false, missing: ["component"] };
		}

		const required = {
			track: ".splide__track",
			list: ".splide__list",
			slides: ".splide__slide",
		};

		const missing = [];
		const elements = {};

		// Check for track
		elements.track = component.querySelector(required.track);
		if (!elements.track) {
			missing.push("track");
		} else {
			// If track present, check for list
			elements.list = elements.track.querySelector(required.list);
			if (!elements.list) {
				missing.push("list");
			} else {
				// if list present, check for slides
				elements.slides = elements.list.querySelectorAll(required.slides);
				if (elements.slides.length === 0) {
					missing.push("slides");
				}
			}
		}

		const isValid = missing.length === 0;

		if (!isValid) {
			// console.warn(`Splide validation failed for component:`, component);
		}

		return {
			isValid,
			missing,
			elements,
			slideCount: elements.slides ? elements.slides.length : 0,
		};
	};

	// New responsive handler
	lenus.helperFunctions.handleResponsiveCarousel = function (component, options = {}) {
		const { responsive, config = {}, ...otherOptions } = options;
		const {
			breakpoint = 768,
			mobileOnly = false,
			desktopOnly = false,
			onModeChange = null,
		} = responsive;

		const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
		let currentMode = mediaQuery.matches ? "mobile" : "desktop";
		let splideInstance = null;

		const createSplide = () => {
			if (splideInstance) return splideInstance;

			splideInstance = lenus.helperFunctions.initSplideCarousel(component, {
				config,
				...otherOptions,
				responsive: null, // Remove responsive to prevent recursion
			});

			component.splide = splideInstance; // Store reference
			return splideInstance;
		};

		const destroySplide = () => {
			if (splideInstance) {
				lenus.helperFunctions.destroySplide(splideInstance);
				splideInstance = null;
				component.splide = null;
			}
		};

		const handleModeChange = (isInitial = false) => {
			const isMobile = mediaQuery.matches;
			const newMode = isMobile ? "mobile" : "desktop";

			// Only skip if not initial and mode hasn't changed
			if (!isInitial && currentMode === newMode) return;
			currentMode = newMode;

			if (mobileOnly) {
				// Mobile-only pattern (like pastEvents)
				if (isMobile) {
					createSplide();
				} else {
					destroySplide();
				}
			} else if (desktopOnly) {
				// Desktop-only pattern (like pricingOptions)
				if (!isMobile) {
					createSplide();
				} else {
					destroySplide();
				}
			}

			if (onModeChange) onModeChange(newMode, splideInstance);
		};

		// Initial setup
		handleModeChange(true);

		// Listen for changes
		window.addEventListener("resize", lenus.helperFunctions.debounce(handleModeChange, 250));

		return {
			getInstance: () => splideInstance,
			destroy: () => {
				window.removeEventListener("resize", handleModeChange);
				destroySplide();
			},
		};
	};

	lenus.helperFunctions.destroySplide = function (instance) {
		if (instance) {
			instance.destroy();

			// Cleanup inline styles and cloned slides
			const splideElement = instance.root;
			const splideList = splideElement.querySelector(".splide__list");
			const splideTrack = splideElement.querySelector(".splide__track");

			// Clear inline styles
			if (splideList) {
				gsap.set(splideList, { clearProps: "transform" });
			}
			if (splideTrack) {
				gsap.set(splideTrack, { clearProps: "padding" });
			}

			// Remove cloned slides
			splideElement.querySelectorAll(".splide__slide.is-clone").forEach((clone) => clone.remove());

			instance = null;
		}
	};

	lenus.helperFunctions.shrinkWrap = function (el) {
		/**
		 * Sets the element's width to tightly wrap its children (content-box).
		 * Returns a function to undo the inline styles if needed.
		 */
		if (!el) return;

		// Need at least one child node to measure
		const first = el.firstChild;
		const last = el.lastChild;
		if (!first || !last) return;

		// Save previous inline styles so this is reversible
		const prev = {
			width: el.style.width,
			boxSizing: el.style.boxSizing,
		};

		// Measure the bounding box around all child nodes
		const range = document.createRange();
		range.setStartBefore(first);
		range.setEndAfter(last);

		const rect = range.getBoundingClientRect();
		const width = Math.ceil(rect.width) + 10; // avoid sub-pixel fuzz

		// Apply styles
		// el.style.boxSizing = "content-box";
		el.style.width = width + "px";

		// Optional: return an undo helper
		return () => {
			el.style.width = prev.width;
			el.style.boxSizing = prev.boxSizing;
		};
	};

	lenus.helperFunctions.verticalLoop = function (items, config) {
		/*
This helper function makes a group of elements animate along the x-axis in a seamless, responsive loop.

Features:
 - Uses yPercent so that even if the heights change (like if the window gets resized), it should still work in most cases.
 - When each item animates to the left or right enough, it will loop back to the other side
 - Optionally pass in a config object with values like draggable: true, center: true, speed (default: 1, which travels at roughly 100 pixels per second), paused (boolean), repeat, reversed, and paddingBottom.
 - The returned timeline will have the following methods added to it:
   - next() - animates to the next element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, easing, etc.
   - previous() - animates to the previous element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, easing, etc.
   - toIndex() - pass in a zero-based index value of the element that it should animate to, and optionally pass in a vars object to control duration, easing, etc. Always goes in the shortest direction
   - current() - returns the current index (if an animation is in-progress, it reflects the final index)
   - times - an Array of the times on the timeline where each element hits the "starting" spot.
 */
		let timeline;
		let resizeHandlerRef;
		let ctx;
		items = gsap.utils.toArray(items);
		config = config || {};
		ctx = gsap.context(() => {
			// use a context so that if this is called from within another context or a gsap.matchMedia(), we can perform proper cleanup like the "resize" event handler on the window
			let onChange = config.onChange,
				lastIndex = 0,
				tl = gsap.timeline({
					repeat: config.repeat,
					onUpdate:
						onChange &&
						function () {
							let i = tl.closestIndex();
							if (lastIndex !== i) {
								lastIndex = i;
								onChange(items[i], i);
							}
						},
					paused: config.paused,
					defaults: { ease: "none" },
					onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
				}),
				length = items.length,
				startY = items[0].offsetTop,
				times = [],
				heights = [],
				spaceBefore = [],
				yPercents = [],
				curIndex = 0,
				indexIsDirty = false,
				center = config.center,
				pixelsPerSecond = (config.speed || 1) * 100,
				snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1), // some browsers shift by a pixel to accommodate flex layouts, so for example if height is 20% the first element's height might be 242px, and the next 243px, alternating back and forth. So we snap to 5 percentage points to make things look more natural
				timeOffset = 0,
				container =
					center === true
						? items[0].parentNode
						: gsap.utils.toArray(center)[0] || items[0].parentNode,
				totalHeight,
				getTotalHeight = () =>
					items[length - 1].offsetTop +
					(yPercents[length - 1] / 100) * heights[length - 1] -
					startY +
					spaceBefore[0] +
					items[length - 1].offsetHeight * gsap.getProperty(items[length - 1], "scaleY") +
					(parseFloat(config.paddingBottom) || 0),
				populateHeights = () => {
					let b1 = container.getBoundingClientRect(),
						b2;
					items.forEach((el, i) => {
						heights[i] = parseFloat(gsap.getProperty(el, "height", "px"));
						yPercents[i] = snap(
							(parseFloat(gsap.getProperty(el, "y", "px")) / heights[i]) * 100 +
								gsap.getProperty(el, "yPercent"),
						);
						b2 = el.getBoundingClientRect();
						spaceBefore[i] = b2.top - (i ? b1.bottom : b1.top);
						b1 = b2;
					});
					gsap.set(items, {
						// convert "y" to "yPercent" to make things responsive, and populate the heights/yPercents Arrays to make lookups faster.
						yPercent: (i) => yPercents[i],
					});
					totalHeight = getTotalHeight();
				},
				timeWrap,
				populateOffsets = () => {
					timeOffset = center ? (tl.duration() * (container.offsetHeight / 2)) / totalHeight : 0;
					center &&
						times.forEach((t, i) => {
							times[i] = timeWrap(
								tl.labels["label" + i] +
									(tl.duration() * heights[i]) / 2 / totalHeight -
									timeOffset,
							);
						});
				},
				getClosest = (values, value, wrap) => {
					let i = values.length,
						closest = 1e10,
						index = 0,
						d;
					while (i--) {
						d = Math.abs(values[i] - value);
						if (d > wrap / 2) {
							d = wrap - d;
						}
						if (d < closest) {
							closest = d;
							index = i;
						}
					}
					return index;
				},
				populateTimeline = () => {
					let i, item, curY, distanceToStart, distanceToLoop;
					tl.clear();
					for (i = 0; i < length; i++) {
						item = items[i];
						curY = (yPercents[i] / 100) * heights[i];
						distanceToStart = item.offsetTop + curY - startY + spaceBefore[0];
						distanceToLoop = distanceToStart + heights[i] * gsap.getProperty(item, "scaleY");
						tl.to(
							item,
							{
								yPercent: snap(((curY - distanceToLoop) / heights[i]) * 100),
								duration: distanceToLoop / pixelsPerSecond,
							},
							0,
						)
							.fromTo(
								item,
								{ yPercent: snap(((curY - distanceToLoop + totalHeight) / heights[i]) * 100) },
								{
									yPercent: yPercents[i],
									duration: (curY - distanceToLoop + totalHeight - curY) / pixelsPerSecond,
									immediateRender: false,
								},
								distanceToLoop / pixelsPerSecond,
							)
							.add("label" + i, distanceToStart / pixelsPerSecond);
						times[i] = distanceToStart / pixelsPerSecond;
					}
					timeWrap = gsap.utils.wrap(0, tl.duration());
				},
				refresh = (deep) => {
					let progress = tl.progress();
					tl.progress(0, true);
					populateHeights();
					deep && populateTimeline();
					populateOffsets();
					deep && tl.draggable && tl.paused()
						? tl.time(times[curIndex], true)
						: tl.progress(progress, true);
				},
				onResize = () => refresh(true),
				proxy;
			gsap.set(items, { y: 0 });
			populateHeights();
			populateTimeline();
			populateOffsets();
			window.addEventListener("resize", onResize);
			function toIndex(index, vars) {
				vars = vars || {};
				Math.abs(index - curIndex) > length / 2 && (index += index > curIndex ? -length : length); // always go in the shortest direction
				let newIndex = gsap.utils.wrap(0, length, index),
					time = times[newIndex];
				if (time > tl.time() !== index > curIndex && index !== curIndex) {
					// if we're wrapping the timeline's playhead, make the proper adjustments
					time += tl.duration() * (index > curIndex ? 1 : -1);
				}
				if (time < 0 || time > tl.duration()) {
					vars.modifiers = { time: timeWrap };
				}
				curIndex = newIndex;
				vars.overwrite = true;
				gsap.killTweensOf(proxy);
				return vars.duration === 0 ? tl.time(timeWrap(time)) : tl.tweenTo(time, vars);
			}
			tl.toIndex = (index, vars) => toIndex(index, vars);
			tl.closestIndex = (setCurrent) => {
				let index = getClosest(times, tl.time(), tl.duration());
				if (setCurrent) {
					curIndex = index;
					indexIsDirty = false;
				}
				return index;
			};
			tl.current = () => (indexIsDirty ? tl.closestIndex(true) : curIndex);
			tl.next = (vars) => toIndex(tl.current() + 1, vars);
			tl.previous = (vars) => toIndex(tl.current() - 1, vars);
			tl.times = times;
			tl.progress(1, true).progress(0, true); // pre-render for performance
			if (config.reversed) {
				tl.vars.onReverseComplete();
				tl.reverse();
			}
			if (config.draggable && typeof Draggable === "function") {
				proxy = document.createElement("div");
				let wrap = gsap.utils.wrap(0, 1),
					ratio,
					startProgress,
					draggable,
					dragSnap,
					lastSnap,
					initChangeY,
					wasPlaying,
					align = () => tl.progress(wrap(startProgress + (draggable.startY - draggable.y) * ratio)),
					syncIndex = () => tl.closestIndex(true);
				typeof InertiaPlugin === "undefined" &&
					console.warn(
						"InertiaPlugin required for momentum-based scrolling and snapping. https://greensock.com/club",
					);
				draggable = Draggable.create(proxy, {
					trigger: items[0].parentNode,
					type: "y",
					onPressInit() {
						let y = this.y;
						gsap.killTweensOf(tl);
						wasPlaying = !tl.paused();
						tl.pause();
						startProgress = tl.progress();
						refresh();
						ratio = 1 / totalHeight;
						initChangeY = startProgress / -ratio - y;
						gsap.set(proxy, { y: startProgress / -ratio });
					},
					onDrag: align,
					onThrowUpdate: align,
					overshootTolerance: 0,
					inertia: true,
					snap(value) {
						//note: if the user presses and releases in the middle of a throw, due to the sudden correction of proxy.x in the onPressInit(), the velocity could be very large, throwing off the snap. So sense that condition and adjust for it. We also need to set overshootTolerance to 0 to prevent the inertia from causing it to shoot past and come back
						if (Math.abs(startProgress / -ratio - this.y) < 10) {
							return lastSnap + initChangeY;
						}
						let time = -(value * ratio) * tl.duration(),
							wrappedTime = timeWrap(time),
							snapTime = times[getClosest(times, wrappedTime, tl.duration())],
							dif = snapTime - wrappedTime;
						Math.abs(dif) > tl.duration() / 2 && (dif += dif < 0 ? tl.duration() : -tl.duration());
						lastSnap = (time + dif) / tl.duration() / -ratio;
						return lastSnap;
					},
					onRelease() {
						syncIndex();
						draggable.isThrowing && (indexIsDirty = true);
					},
					onThrowComplete: () => {
						syncIndex();
						wasPlaying && tl.play();
					},
				})[0];
				tl.draggable = draggable;
			}
			tl.closestIndex(true);
			lastIndex = curIndex;
			onChange && onChange(items[curIndex], curIndex);
			timeline = tl;
		});
		if (timeline) {
			const originalKill = timeline.kill.bind(timeline);
			timeline.kill = (...args) => {
				if (resizeHandlerRef) {
					window.removeEventListener("resize", resizeHandlerRef);
					resizeHandlerRef = null;
				}
				try {
					ctx && ctx.revert && ctx.revert();
				} catch (e) {}
				return originalKill(...args);
			};
		}
		return timeline;
	};

	lenus.helperFunctions.horizontalLoop = function (items, config) {
		/*
This helper function makes a group of elements animate along the x-axis in a seamless, responsive loop.

Features:
- Uses xPercent so that even if the widths change (like if the window gets resized), it should still work in most cases.
- When each item animates to the left or right enough, it will loop back to the other side
- Optionally pass in a config object with values like "speed" (default: 1, which travels at roughly 100 pixels per second), paused (boolean),  repeat, reversed, and paddingRight.
- The returned timeline will have the following methods added to it:
- next() - animates to the next element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, easing, etc.
- previous() - animates to the previous element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, easing, etc.
- toIndex() - pass in a zero-based index value of the element that it should animate to, and optionally pass in a vars object to control duration, easing, etc. Always goes in the shortest direction
- current() - returns the current index (if an animation is in-progress, it reflects the final index)
- times - an Array of the times on the timeline where each element hits the "starting" spot. There's also a label added accordingly, so "label1" is when the 2nd element reaches the start.
*/
		items = gsap.utils.toArray(items);
		config = config || {};
		let tl = gsap.timeline({
				repeat: config.repeat,
				paused: config.paused,
				defaults: { ease: "none" },
				onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
			}),
			length = items.length,
			startX = items[0].offsetLeft,
			times = [],
			widths = [],
			xPercents = [],
			curIndex = 0,
			pixelsPerSecond = (config.speed || 1) * 100,
			snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1), // some browsers shift by a pixel to accommodate flex layouts, so for example if width is 20% the first element's width might be 242px, and the next 243px, alternating back and forth. So we snap to 5 percentage points to make things look more natural
			totalWidth,
			curX,
			distanceToStart,
			distanceToLoop,
			item,
			i;
		gsap.set(items, {
			// convert "x" to "xPercent" to make things responsive, and populate the widths/xPercents Arrays to make lookups faster.
			xPercent: (i, el) => {
				let w = (widths[i] = parseFloat(gsap.getProperty(el, "width", "px")));
				xPercents[i] = snap(
					(parseFloat(gsap.getProperty(el, "x", "px")) / w) * 100 +
						gsap.getProperty(el, "xPercent"),
				);
				return xPercents[i];
			},
		});
		gsap.set(items, { x: 0 });
		totalWidth =
			items[length - 1].offsetLeft +
			(xPercents[length - 1] / 100) * widths[length - 1] -
			startX +
			items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], "scaleX") +
			(parseFloat(config.paddingRight) || 0);
		for (i = 0; i < length; i++) {
			item = items[i];
			curX = (xPercents[i] / 100) * widths[i];
			distanceToStart = item.offsetLeft + curX - startX;
			distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
			tl.to(
				item,
				{
					xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
					duration: distanceToLoop / pixelsPerSecond,
				},
				0,
			)
				.fromTo(
					item,
					{
						xPercent: snap(((curX - distanceToLoop + totalWidth) / widths[i]) * 100),
					},
					{
						xPercent: xPercents[i],
						duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
						immediateRender: false,
					},
					distanceToLoop / pixelsPerSecond,
				)
				.add("label" + i, distanceToStart / pixelsPerSecond);
			times[i] = distanceToStart / pixelsPerSecond;
		}
		function toIndex(index, vars) {
			vars = vars || {};
			Math.abs(index - curIndex) > length / 2 && (index += index > curIndex ? -length : length); // always go in the shortest direction
			let newIndex = gsap.utils.wrap(0, length, index),
				time = times[newIndex];
			if (time > tl.time() !== index > curIndex) {
				// if we're wrapping the timeline's playhead, make the proper adjustments
				vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
				time += tl.duration() * (index > curIndex ? 1 : -1);
			}
			curIndex = newIndex;
			vars.overwrite = true;
			return tl.tweenTo(time, vars);
		}
		tl.next = (vars) => toIndex(curIndex + 1, vars);
		tl.previous = (vars) => toIndex(curIndex - 1, vars);
		tl.current = () => curIndex;
		tl.toIndex = (index, vars) => toIndex(index, vars);
		tl.times = times;
		tl.progress(1, true).progress(0, true); // pre-render for performance
		if (config.reversed) {
			tl.vars.onReverseComplete();
			tl.reverse();
		}
		return tl;
	};

	// Calculate the number of clones needed for a Splide carousel based on slides and sets
	lenus.helperFunctions.getCloneCountFromSets = function (component, sets = 1) {
		const slides = component.querySelectorAll(".splide__slide");
		const slideCount = slides.length;
		if (!slideCount || !sets) return 0;

		// Splide wants clones per side, rounded up
		const totalClonesNeeded = slideCount * sets;
		return Math.ceil(totalClonesNeeded / 2);
	};

	// Finsweet Attributes v2: Refresh ScrollTrigger after list render and handle blog filtering
	function setupFinsweetScrollTriggerRefresh() {
		window.FinsweetAttributes ||= [];
		window.FinsweetAttributes.push([
			"list",
			(listInstances) => {
				listInstances.forEach((list) => {
					list.addHook("afterRender", () => {
						console.log("Finsweet list afterRender - refreshing ScrollTrigger");
						ScrollTrigger.refresh();

						// Handle blog category filtering after Finsweet has rendered
						const isBlogPage = window.location.pathname === "/blog";
						if (isBlogPage && window.blogFilteringUtils) {
							window.blogFilteringUtils.handleInitialUrlParams();
						}
					});
				});
			},
		]);
	}

	function tippyTooltipsInit() {
		// check tippy is loaded, or wait for a maximum time
		if (typeof tippy === "undefined") {
			let attempts = 0;
			const maxAttempts = 10;
			const interval = setInterval(() => {
				attempts++;
				if (typeof tippy !== "undefined") {
					clearInterval(interval);
					initializeTippy();
				} else if (attempts >= maxAttempts) {
					clearInterval(interval);
					console.warn("[tippyTooltipsInit] Tippy.js not loaded after maximum attempts.");
				}
			}, 500); // check every 500ms
			return;
		}

		initializeTippy();

		function initializeTippy() {
			tippy("[data-tippy-content][data-theme='dark']", {
				maxWidth: 200,

				theme: "dark",
			});
			tippy("[data-tippy-content][data-theme='light']", {
				maxWidth: 200,

				theme: "light",
			});
		}
	}

	parallax();
	loadVideos();
	logoSwap();
	videoCarousel();
	basicMediaAnim();
	academyCredAnim();
	randomTestimonial();
	accordion();
	expandingCards();
	tabsWithToggleSlider();
	wideCarousel();
	standardCarousel();
	multiQuote();
	fancyHero();
	locations();
	miniCarousel();
	featureColumns();
	mapbox();
	cardGrid();
	standaloneVideoCards();
	scatterHero();
	pastEvents();
	customSubmitButtons();
	hiddenFormFields();
	rangeSlider();
	featBlogCard();
	jobScroll();

	/* create navHover instance and init */
	navHover();
	// Only initialize navHover on non-mobile devices
	if (!window.matchMedia("(hover: none)").matches) {
		// console.log("Initializing navHover for non-mobile device");
		lenus.navHover.init();
	}

	toggleSlider();
	navOpen();
	handleFiltering();
	handleSearch();
	pricingOptions();
	pricingFeatures();
	headerThemeScrollTrigger();
	setupFinsweetScrollTriggerRefresh();
	largeButtonHover();
	hideShowNav();
	countriesDropdown();
	if (document.querySelector("#job-listings")) {
		lenus.greenhouse.init();
	}
	if (document.querySelector("#job-details.c-job")) {
		console.log("Initializing greenhouseJob");
		lenus.greenhouseJob.init();
		lenus.greenhouseJob.handleApplicationIframe();
	}
	handleLocalTimes();
	ctaImage();
	cardHover();
	tippyTooltipsInit();
	relatedProductsCarousel();
	productImageCarousel();
	animateTitles();
	animateGradientLines();
}
