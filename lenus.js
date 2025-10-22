function main() {
	// GSAP register
	gsap.registerPlugin(ScrollTrigger);

	// GSAP defaults
	gsap.defaults({
		ease: "power2.out",
		duration: 0.5,
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
		let state = "light"; // current theme state
		const attributeName = "data-wf--section-group--theme";

		const sectionGroups = gsap.utils.toArray(`[${attributeName}]`);

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
			const darkThemer = document.querySelector(".nav-dark-themer");
			const lightThemer = document.querySelector(".nav-light-themer");

			if (headerThemeTl) headerThemeTl.kill();
			headerThemeTl = gsap.timeline({
				paused: true,
				onComplete: () => (state = "dark"),
				onReverseComplete: () => (state = "light"),
			});

			if (!darkThemer || !lightThemer) {
				console.warn(
					"Header theme elements not found. Ensure .nav-dark-themer and .nav-light-themer exist."
				);
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
			headerThemeTl.to(
				header,
				{
					...darkVars,
					duration: 0.3,
				},
				0
			);

			// Set initial light theme values
			gsap.set(header, lightVars);
		}

		// Setup header theme timeline once
		setupHeaderThemeTimeline();

		// Only create ScrollTriggers for dark section groups
		// Store header theme ScrollTriggers for clean management
		let headerThemeScrollTriggers = [];

		function killHeaderThemeScrollTriggers() {
			headerThemeScrollTriggers.forEach((t) => t.kill());
			headerThemeScrollTriggers = [];
		}

		function createHeaderThemeScrollTriggers() {
			killHeaderThemeScrollTriggers();
			console.log("Creating header theme ScrollTriggers...");
			sectionGroups.forEach((group, idx) => {
				const variant = group.getAttribute(attributeName);
				const theme = getTheme(variant);
				console.log(`Section idx=${idx}, variant=${variant}, theme=${theme}`);

				if (DARK_THEMES.includes(variant)) {
					console.log(`  -> Creating ScrollTrigger for dark section at idx=${idx}`);
					const trigger = ScrollTrigger.create({
						trigger: group,
						start: () => `top ${getNavHeight()}px`,
						end: () => `bottom top`,
						scrub: true,
						onEnter: () => {
							console.log(
								`[headerTheme] onEnter: idx=${idx}, variant=${variant}, theme=${theme} (DARK)`
							);
							headerThemeTl.play();
						},
						onEnterBack: () => {
							console.log(
								`[headerTheme] onEnterBack: idx=${idx}, variant=${variant}, theme=${theme} (LIGHT)`
							);
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
									console.log(
										`[headerTheme] onLeave: idx=${idx}, variant=${variant}, theme=${theme} (LIGHT)`
									);
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
									console.log(
										`[headerTheme] onLeaveBack: idx=${idx}, variant=${variant}, theme=${theme} (LIGHT)`
									);
									headerThemeTl.reverse();
								}
							}
						},
					});
					headerThemeScrollTriggers.push(trigger);
				}
			});
		}
		createHeaderThemeScrollTriggers();

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
			const variant = found
				? found.getAttribute("data-wf--section-group--variant")
				: sectionGroups[0]?.getAttribute("data-wf--section-group--variant");
			if (DARK_THEMES.includes(variant)) {
				// if state is already dark, do nothing
				if (state === "dark") return;
				headerThemeTl.play(0);
			} else {
				// if state is already light, do nothing
				if (state === "light") return;
				headerThemeTl.reverse(0);
			}
		}
		setInitialHeaderTheme();

		ResizeManager.add(({ widthChanged, heightChanged, width, height }) => {
			// Only rebuild if width changed or large layout change
			if (!widthChanged) return;

			console.log(`[headerThemeScrollTrigger] resize: ${width}x${height}`);

			setupHeaderThemeTimeline();
			createHeaderThemeScrollTriggers();
			ScrollTrigger.refresh();
			setInitialHeaderTheme();
		});
	}

	function logoSwap() {
		document.querySelectorAll(".c-logo-swap").forEach((component) => {
			// we need to decide if we need to include the invert(1) part in the filters for logos - this depends on whether the current theme is dark or light - and we can find this out by checking the value of the var(--_theme---invert) variable on the component - if it is 0 then we don't need invert, if it is 1 then we do
			const invertFilter =
				getComputedStyle(component).getPropertyValue("--_theme---invert") === "1"
					? "invert(1) "
					: "";
			const logoList = component.querySelector(".logo-swap_list");
			let logoSlots = Array.from(logoList.querySelectorAll(".logo-swap_slot"));
			const logoEls = Array.from(component.querySelectorAll(".logo-swap_logo"));
			let logoCount = getLogoCount(component);
			let timerId;
			let tl;

			let logosArray = [];
			logoEls.forEach((logoEl) => {
				const logoObj = {};
				logoObj.el = logoEl;
				logoObj.visibleNow = false;
				logosArray.push(logoObj);
			});

			// Resize callback (defined early so we can reference it later)
			const handleResize = ({ widthChanged }) => {
				if (!widthChanged) return; // skip iOS toolbar resizes etc.

				clearTimeout(timerId);
				clearTimeline();
				logoCount = getLogoCount(component);
				createLogoSlots();
				clearAllLogos();
				updateLogos();
				animateLogos();
			};

			function getLogoCount(component) {
				const logoCount = parseInt(
					getComputedStyle(component).getPropertyValue("--logo-swap--count"),
					10
				);
				return isNaN(logoCount) ? 5 : logoCount;
			}

			function shuffleArray(array) {
				//https://bost.ocks.org/mike/shuffle/
				var m = array.length,
					t,
					i;

				// While there remain elements to shuffle…
				while (m) {
					// Pick a remaining element…
					i = Math.floor(Math.random() * m--);

					// And swap it with the current element.
					t = array[m];
					array[m] = array[i];
					array[i] = t;
				}

				return array;
			}

			function getNewLogos() {
				// first shuffle the logos array
				logosArray = shuffleArray(logosArray);

				// get the first X logos from the shuffled array that are not currently visible
				const newLogos = logosArray.filter((logo) => !logo.visibleNow).slice(0, logoCount);

				// clear visibility status of all logos
				logosArray.forEach((logo) => {
					logo.visibleNow = false;
				});

				// mark the new logos as visible
				newLogos.forEach((logo) => {
					logo.visibleNow = true;
				});

				if (newLogos.length < logoCount) {
					// If not enough unique logos are available, add some more from logosArray
					// console.log("Not enough unique logos, adding some from last time.");
					const additionalLogos = logosArray
						.filter((logo) => !logo.visibleNow)
						.slice(0, logoCount - newLogos.length);
					// and mark as visible
					additionalLogos.forEach((logo) => {
						logo.visibleNow = true;
					});
					// and add to newLogos
					newLogos.push(...additionalLogos);
				}

				return newLogos.map((logo) => logo.el);
			}

			function updateLogos() {
				const newLogos = getNewLogos();
				if (newLogos.length === 0) {
					// console.warn("No logos available to display.");
					return;
				}

				// for each slot, clone the new logo and add it to the slot in a hidden state
				logoSlots.forEach((slot, index) => {
					const currentLogo = slot.querySelector(".logo-swap_logo");
					if (currentLogo) {
						currentLogo.setAttribute("data-logo-swap", "outgoing");
					}
					const newLogo = newLogos[index];
					if (newLogo) {
						const clonedLogo = newLogo.cloneNode(true);
						clonedLogo.setAttribute("data-logo-swap", "incoming");
						gsap.set(clonedLogo, {
							autoAlpha: 0,
							filter: `${invertFilter}blur(5px) grayscale()`,
							scale: 0.8,
							transformOrigin: "50% 50%",
						}); // start hidden
						slot.appendChild(clonedLogo);
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
				// update the logoSlots variable
				logoSlots = Array.from(logoList.querySelectorAll(".logo-swap_slot"));
				// console.log("Logo slots created:", logoSlots.length);
			}

			function cleanUp() {
				logoSlots.forEach((slot) => {
					slot.querySelectorAll("[data-logo-swap='outgoing']").forEach((el) => el.remove());
				});
			}

			function scheduleNext() {
				timerId = setTimeout(() => {
					updateLogos();
					animateLogos();
				}, 4000);
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
					"<+0.1" // start at the same time as the fade out
				);
			}

			function clearTimeline() {
				if (tl) {
					tl.kill();
					tl = null;
				}
			}

			function clearAllLogos() {
				logoSlots.forEach((slot) => {
					const logo = slot.querySelector(".logo-swap_logo");
					if (logo) {
						logo.remove();
					}
				});
			}

			// Register resize handler
			ResizeManager.add(handleResize);

			// pause/resume when user tabs away
			document.addEventListener("visibilitychange", () => {
				if (document.hidden) {
					clearTimeout(timerId);
					clearTimeline();
					// Ensure cleanup is performed when pausing
					cleanUp();
				} else {
					// Resume animations and schedule the next update
					scheduleNext();
				}
			});

			// Initial setup
			createLogoSlots();
			clearAllLogos();
			updateLogos();
			animateLogos();
		});
	}

	function parallax() {
		const parallaxTriggers = document.querySelectorAll(".anim-parallax-trigger");
		if (parallaxTriggers.length === 0) return;
		parallaxTriggers.forEach((trigger) => {
			const parallaxElements = trigger.querySelectorAll("[data-parallax]");
			if (parallaxElements.length === 0) return;

			gsap.utils.toArray(parallaxElements).forEach((el) => {
				// Set the initial position of the element based on the speed
				const speed = parseFloat(el.getAttribute("data-parallax")) || 0.5;
				const scalingFactor = 5; // just to tweak feel
				let startY = 50 * speed * scalingFactor;
				let endY = -50 * speed * scalingFactor;
				const xSpeed = parseFloat(el.getAttribute("data-parallax-x")) || 0;
				let startX = 50 * xSpeed;
				let endX = -50 * xSpeed;
				gsap.fromTo(
					el,
					{ yPercent: startY, xPercent: startX },
					{
						yPercent: endY,
						xPercent: endX,
						ease: "none",
						scrollTrigger: {
							trigger: trigger,
							start: "top bottom",
							end: "bottom top",
							scrub: true,
						},
					}
				);
			});
		});
	}

	function loadVideos() {
		return;
		// Grab all videos on the page
		const videos = gsap.utils.toArray(".media video");
		const mediaQuery = window.matchMedia("(max-width: 768px)");
		const videoLoadPadding = "100%"; // = one full viewport

		// Helper to know current mode
		const isMobile = () => mediaQuery.matches;

		// update sources once per mode
		function updateSources(video, mode) {
			if (video.dataset.videoLoaded) return; // skip if already done
			// console.log(`Loading video sources for`, video, `mode=${mode}`);

			video.querySelectorAll("source").forEach((srcEl) => {
				const { srcMobile, srcDesktop, typeMobile, typeDesktop, codecsMobile, codecsDesktop } =
					srcEl.dataset;
				srcEl.src = ""; // reset src to avoid stale data
				// pick URL + MIME + codecs
				const url = mode === "mobile" ? srcMobile || srcDesktop : srcDesktop;
				const mime = mode === "mobile" ? typeMobile || typeDesktop : typeDesktop;
				const codecs = mode === "mobile" ? codecsMobile || codecsDesktop : codecsDesktop;

				if (!url) return;
				srcEl.src = url;
				// console.log(`Setting source for ${video.id}:`, url);

				let typeAttr = mime || "";
				if (codecs) typeAttr += `; codecs="${codecs}"`;
				if (typeAttr) srcEl.setAttribute("type", typeAttr);
			});

			video.load();
			video.dataset.videoLoaded = "true";
		}

		// preload triggers (±1 viewport)
		let preloadTriggers = videos.map((video) =>
			ScrollTrigger.create({
				trigger: video,
				start: `top bottom+=${videoLoadPadding}`, // 1 viewport below
				end: `bottom top-=${videoLoadPadding}`, // 1 viewport above
				onEnter(self) {
					updateSources(video, isMobile() ? "mobile" : "desktop");
					console.log("Preloading video:", video);
					self.kill(); // don’t fire again until mode change
				},
				onEnterBack(self) {
					updateSources(video, isMobile() ? "mobile" : "desktop");
					console.log("Preloading video (back):", video);
					self.kill();
				},
				// markers: true,
			})
		);

		// play / pause triggers
		videos.forEach((video) => {
			// only play if autoplay is enabled or video was previously playing, but pause for all

			ScrollTrigger.create({
				trigger: video,
				start: "top 90%",
				end: "bottom 10%",
				onEnter: () => {
					lenus.helperFunctions.playVideo(video);
				},
				onLeave: () => {
					if (!video.paused) {
						console.log("Pausing", video);
						video.pause();
					}
				},
				onEnterBack: () => {
					lenus.helperFunctions.playVideo(video);
				},
				onLeaveBack: () => {
					if (!video.paused) {
						console.log("Pausing", video);
						video.pause();
					}
				},
			});
		});

		// mode change
		mediaQuery.addEventListener("change", () => {
			const newMode = isMobile() ? "mobile" : "desktop";
			// console.log(`Mode changed to: ${newMode}`);

			// console.log("Updating video sources for new mode:", newMode);

			// Clear loaded flags so videos will reload in new mode
			videos.forEach((video) => {
				delete video.dataset.videoLoaded;
			});

			// Kill old preload triggers, then recreate them
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
				})
			);

			// Refresh all ScrollTriggers to recalc positions
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
		console.log("Registering video card:", card);
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

	function testimCardVideos() {
		let standaloneCards = [
			...document.querySelectorAll(".c-testim-card"),
			...document.querySelectorAll(".c-wide-card"),
		];

		// filter out cards that are inside a carousel - these are handled by the carousel setup
		standaloneCards = standaloneCards.filter((card) => !card.closest(".c-carousel"));

		console.log("Found standalone video cards:", standaloneCards.length);

		standaloneCards.forEach((card) => {
			registerVideoCard(card);
		});
	}

	function videoCarousel() {
		const controller = lenus.helperFunctions.videoController;
		if (!controller) return;

		document.querySelectorAll(".c-carousel.is-testim").forEach((component) => {
			gsap.set(component, { display: "none" });
		});
		return;

		document.querySelectorAll(".c-carousel.is-testim").forEach((component) => {
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
					snap: false,
					drag: "free",
					focus: "center",
					breakpoints: {
						767: {
							autoWidth: true,
						},
					},
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
						if (instance.Components.AutoScroll) {
							instance.Components.AutoScroll.pause();
						}
					},
					onPause: () => {
						if (instance.Components.AutoScroll) {
							instance.Components.AutoScroll.play();
						}
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

	function gradTest1() {
		// grab the gradients by ID
		const grad2 = document.querySelector("#paint1_linear_0_1");

		// original gradient values in SVG from Figma
		const orig0 = { x1: 719.5, y1: 1169, x2: 719.5, y2: 269 };

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: ".bg-lines-wrap",
				start: "top center",
				end: "bottom center",
				scrub: true,
			},
		});

		tl.fromTo(
			grad2,
			{
				attr: { x1: 719.5, y1: 0, x2: 719.5, y2: 0 },
				duration: 1,
				ease: "none",
			},
			{
				attr: orig0,
			}
		);
	}

	function ctaImage() {
		// Store contexts globally to allow cleanup
		if (!window._ctaImageContexts) {
			window._ctaImageContexts = new Map();
		}

		document.querySelectorAll(".c-cta").forEach((component) => {
			// Clean up existing context for this component
			if (window._ctaImageContexts.has(component)) {
				const existingContext = window._ctaImageContexts.get(component);
				existingContext.revert();
				window._ctaImageContexts.delete(component);
			}

			const isSplit = component.classList.contains("is-split");
			const img = component.querySelector(".cta_img");
			const content = component.querySelector(".cta_content");
			const pinned = component.querySelector(".cta_pinned");
			const endParent = component.querySelector(".cta_spacer");
			const title = component.querySelector(".cta_title");

			// Get all images inside .cta_img
			const images = img ? Array.from(img.querySelectorAll("img")) : [];

			// Helper to check if the viewport is mobile
			const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

			const createTimeline = () => {
				// If it's a split variant and on mobile, revert to static
				if (isSplit && isMobile()) {
					gsap.set([img, content, title], { clearProps: "all" });
					return;
				}

				const gap = endParent.offsetWidth + 48;
				const titleSpans = title.querySelectorAll("span");
				const spanWidth = (content.offsetWidth - gap) / 2;

				// Start with the image at full size
				gsap.set(img, {
					width: "100%",
					height: "100%",
					scale: 1.05,
				});

				// Set up images - first image visible, others hidden
				if (images.length > 1) {
					gsap.set(images[0], { autoAlpha: 1 });
					gsap.set(images.slice(1), { autoAlpha: 0 });
				}

				// for each image, set progress time we animate it
				// weight towards end so we move quickly through images
				let imgTimes = [];
				images.forEach((image, index) => {
					const imgTimeObj = {};
					imgTimeObj.img = image;
					imgTimeObj.time = (index / (images.length - 1)) * 0.5; // Spread across 75% of timeline
					imgTimes.push(imgTimeObj);
				});

				const tl = gsap.timeline({
					scrollTrigger: {
						trigger: component,
						start: "top top",
						end: "+=100%",
						scrub: 0.5,
						pin: pinned,
						onUpdate(self) {
							if (images.length < 2) return; // no need to adjust nav if no image fades
							const p = self.progress;

							imgTimes.forEach((time, index) => {
								if (p >= time.time) {
									gsap.to(time.img, {
										autoAlpha: 1,
										duration: 0.15,
										ease: "power2.inOut",
									});
								}
							});
							// hide images that are ahead of current progress
							imgTimes.forEach((time, index) => {
								if (p < time.time) {
									gsap.to(time.img, {
										autoAlpha: 0,
										duration: 0.15,
										ease: "power2.inOut",
									});
								}
							});
						},
					},
					onStart: () => {
						console.log("CTA animation started");
					},
				});

				if (isSplit) {
					console.log(titleSpans, spanWidth);
					// ensure title doesn't reflow as we adjust the gap - first fix the size of each .cta_title > span to (container width - gap)/2
					gsap.set(titleSpans, {
						width: spanWidth,
					});
					gsap.set(titleSpans[0], {
						textAlign: "right",
					});
					gsap.set(titleSpans[1], {
						textAlign: "left",
					});

					tl.to(
						title,
						{
							gap: gap,
						},
						"<"
					);
				}

				tl.add(Flip.fit(img, endParent, { duration: 0.5 }), "<");

				tl.to(
					title,
					{
						backgroundPosition: "0% 0%",
						ease: "none",
						duration: 0.3,
					},
					"0.2"
				);
			};

			// Create a new context for this component
			const ctx = gsap.context(() => {
				createTimeline();
			}, component);

			// Store the context for later cleanup
			window._ctaImageContexts.set(component, ctx);

			// Debounced resize handler
			const debouncedResize = lenus.helperFunctions.debounce(() => {
				console.log("CTA resize detected");
				// Clean up and recreate context on resize
				ctx.revert();
				const newCtx = gsap.context(() => {
					createTimeline();
				}, component);
				window._ctaImageContexts.set(component, newCtx);
			}, 200);

			// Add resize event listener
			// window.addEventListener("resize", debouncedResize);
		});
	}

	function randomTestimonial() {
		const sources = Array.from(document.querySelectorAll('[data-lenus-source="testimonial-img"]'));

		document.querySelectorAll('[data-lenus-target="testimonial-group"]').forEach((group) => {
			const targets = Array.from(group.querySelectorAll('[data-lenus-target="testimonial-img"]'));

			// clone & shuffle a fresh copy of the sources
			const pool = sources.slice();
			gsap.utils.shuffle(pool);
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
			});
			gsap.set(group, {
				autoAlpha: 1,
			});
		});
	}

	function accordion() {
		document.querySelectorAll(".c-accordion, .c-faq").forEach((component) => {
			const items = gsap.utils.toArray(".accordion-item, .faq-item", component);
			const images = gsap.utils.toArray(".accordion-img", component);

			items.forEach((item, index) => {
				const header = item.querySelector(".accordion-item_header, .faq-item_header");
				const content = item.querySelector(".accordion-item_content, .faq-item_body-wrap");
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

				// create a timeline that starts “open” and then reverse() so panels start closed
				const tl = gsap
					.timeline({
						paused: true,
						defaults: { duration: 0.4, ease: "power1.inOut" },
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

			// on load have first item open
			if (items.length > 0) {
				const firstItem = items[0];
				firstItem._tl.reversed(false);
				firstItem
					.querySelector(".accordion-item_header, .faq-item_header")
					.setAttribute("aria-expanded", "true");
			}
		});
	}

	function cardTrain() {
		const videoSelector = "video";
		const imgSelector = "img";
		const mediaQuery = window.matchMedia("(max-width: 768px)");
		const inactiveOpacity = 0.5; // Opacity for inactive cards

		// Helper to know current mode
		const isMobile = () => mediaQuery.matches;
		let currentMode = isMobile() ? "mobile" : "desktop"; // Track the current mode
		let splideInstance;

		document.querySelectorAll(".c-card-train").forEach((component) => {
			const cards = lenus.helperFunctions.getCards(component);
			const bgs = gsap.utils.toArray(".card_media", component);
			const contents = gsap.utils.toArray(".card_content, .card_extra-content", component);
			let ctx = gsap.context(() => {});
			const handlers = new Map();

			// initialise
			if (cards.length > 0) {
				if (currentMode === "desktop") {
					console.log("Desktop mode detected, setting up card train.");
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
					console.log("Mobile mode detected, switching to carousel.");
					cardTrain_resetCards(cards, true, false);
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
					cardTrain_resetCards(cards, true, false);
					updateBgs(bgs, cards, contents, true);
					cards.forEach((c) => {
						c.removeEventListener("mouseenter", handlers.get(c));
					});
					ctx.revert();
					initSplide(cards, component);
				} else {
					console.log("Desktop mode detected, switching to card train.");
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

		function cardTrain_resetCards(cards, resetVideos = false, lowerOpacity = true) {
			cards.forEach((c) => {
				c.classList.remove("is-expanded");
				gsap.set(c, {
					opacity: lowerOpacity ? inactiveOpacity : 1,
				});
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
			card.classList.add("is-expanded");
			gsap.set(card, {
				opacity: 1,
			});
			if (activateVideo) {
				const video = card.querySelector("video");
				if (video) {
					lenus.helperFunctions.showVideo(card, videoSelector, imgSelector, true);
					video.play();
				}
			}
		}

		function createFlip(component, cards, card, contents) {
			const state = Flip.getState([cards, contents], { props: "flex, opacity, width" });

			gsap.set(component, { minHeight: () => cards[0].offsetHeight + "px" });

			cardTrain_resetCards(cards, false); // need to do this within flip so we update state correctly

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

			console.log("Card mouse enter:", card);

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
				splideInstance.Components.Slides
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
		gsap.utils.toArray(".anim-grad-text").forEach((title) => {
			// exclude titles inside .c-cta
			if (title.closest(".c-cta")) return;

			gsap.to(title, {
				backgroundPosition: "0% 0%",
				ease: "none",
				scrollTrigger: {
					trigger: title,
					start: "top 80%",
					end: "bottom 20%",
					scrub: true,
				},
			});
		});
	}

	function tabbedHero_v1() {
		const CSS_VARS = { width: "--tab-controls--w", left: "--tab-controls--l" };
		const CONTROL_CLASS = "tab-controls_item";
		const controlPadding = 8; // padding for the control container

		document.querySelectorAll(".c-tabbed-hero").forEach(initHero);

		function initHero(component) {
			// get all necessary elements
			const container = component.querySelector(".container");
			if (!container) return;
			const panelWrapper = component.querySelector(".tabbed-hero_media-items");
			if (!panelWrapper) return;
			const panels = gsap.utils.toArray(".media", panelWrapper);
			if (!panels.length) return;
			const control = component.querySelector(".c-tab-controls");
			if (!control) return;
			const track = control.querySelector(".tab-controls_track");
			const list = control.querySelector(".tab-controls_list");
			if (!track || !list) return;

			// set up variables
			let currentIndex = 0;
			let mode = "desktop"; // default mode
			let bounds = {};
			let snapPoints = [];
			let draggableInstance = null;
			let totalWidth = 0;
			let gap = parseFloat(getComputedStyle(list).gap) || 0;
			let paddingLeft = parseFloat(getComputedStyle(control).paddingLeft) || 0;
			let paddingRight = parseFloat(getComputedStyle(control).paddingRight) || 0;
			let listWidth = 0;

			// build tabs and calculate snap points
			const tabs = buildControls(list, panels);

			if (checkDraggable()) {
				initDraggable();
			}

			// click support
			tabs.forEach((tab, idx) => {
				tab.addEventListener("click", () => {
					scrollToIndex(list, idx, tabs);
					activate(idx);
				});
			});

			function activate(i) {
				activateTab(component, tabs, panels, i);
				moveHighlight(tabs[i]);
			}

			function updateValues() {
				function updateGap() {
					gap = parseFloat(getComputedStyle(list).gap) || 0;
					console.log("Gap updated:", gap);
				}

				function updateTotalWidth() {
					let width = 0;
					tabs.forEach((tab) => {
						width += tab.offsetWidth;
					});
					width = width + gap * (tabs.length - 1);
					totalWidth = width;
					console.log("Total width updated:", totalWidth);
				}

				function updatePadding() {
					paddingLeft = parseFloat(getComputedStyle(control).paddingLeft) || 0;
					paddingRight = parseFloat(getComputedStyle(control).paddingRight) || 0;
				}
				updateGap();
				updateTotalWidth();
				updatePadding();
				listWidth = control.clientWidth - paddingLeft - paddingRight;
			}

			// initial activation
			activate(0);

			// decide if draggable is needed
			function checkDraggable() {
				updateValues();

				console.log(
					"Total item width:",
					totalItemWidth,
					"List width:",
					listWidth,
					"Draggable needed:",
					totalItemWidth > listWidth
				);
				return totalItemWidth > listWidth;
			}

			function initDraggable() {
				if (draggableInstance) return;
				// set list flex to start
				gsap.set(list, {
					justifyContent: "flex-start",
				});
				snapPoints = calculateSnapPoints(list, tabs, control);
				draggableInstance = Draggable.create(list, {
					type: "x",
					bounds: {
						minX: Math.min(...snapPoints),
						maxX: 0,
					},
					inertia: true,
					cursor: "grab",
					activeCursor: "grabbing",
					snap: (endValue) =>
						snapPoints.reduce(
							(prev, curr) => (Math.abs(curr - endValue) < Math.abs(prev - endValue) ? curr : prev),
							snapPoints[0]
						),
					onDragEnd: function () {
						const idx = snapPoints.indexOf(this.endX);
						activate(idx);
					},
					onThrowComplete: function () {
						const idx = snapPoints.indexOf(this.x);
						activate(idx);
					},
				})[0];
			}

			function destroyDraggable() {
				if (draggableInstance) {
					draggableInstance.kill();
					draggableInstance = null;
					gsap.set(list, { x: 0 });
				}
			}

			function updateMode() {
				if (checkDraggable()) {
					initDraggable();
				} else {
					destroyDraggable();
				}
			}

			window.addEventListener("resize", lenus.helperFunctions.debounce(updateMode, 200));
			updateMode();
		}

		function buildControls(container, panels) {
			container.innerHTML = "";
			return panels.map((panel, i) => {
				const btn = document.createElement("div");
				btn.className = CONTROL_CLASS;
				btn.textContent = panel.dataset.title;
				btn.dataset.tabIndex = i;
				container.appendChild(btn);
				return btn;
			});
		}

		function calculateSnapPoints(list, tabs, parent) {
			const gap = parseFloat(getComputedStyle(list).gap) || 0;
			const parentWidth = parent.offsetWidth;
			const points = tabs.map((tab) => -tab.offsetLeft);
			const maxShift = list.offsetWidth - parentWidth;
			if (maxShift > 0) points[points.length - 1] = -maxShift;
			console.log("Calculated snap points:", points);
			return points;
		}

		function updateTotalWidth(list, tabs) {
			const gap = parseFloat(getComputedStyle(list).gap) || 0;

			function generateBounds(list, tabs) {
				const controlWidth = control.offsetWidth;
				bounds = { minX: Math.min(controlWidth - totalWidth, 0), maxX: 0 };
			}

			function scrollToIndex(list, idx, tabs) {
				gsap.to(list, { x: snapPoints[idx], duration: 0.4, ease: "power2.out" });
				// update current index
				currentIndex = idx;
				console.log(`Scrolled to index ${idx}:`, tabs[idx].textContent);
			}

			function moveHighlight(tab) {
				const comp = tab.closest(".c-tabbed-hero");
				const left = tab.offsetLeft;
				const width = tab.offsetWidth;
				gsap.to(comp, {
					[CSS_VARS.left]: `${left + controlPadding}px`,
					[CSS_VARS.width]: `${width}px`,
					duration: 0.3,
					ease: "power2.out",
				});
			}

			function activateTab(component, tabs, panels, idx) {
				const oldPanel = component.querySelector(".media.is-active");
				const lastTime = preserveVideoTime(oldPanel);
				tabs.forEach((t, i) => t.classList.toggle("is-active", i === idx));
				panels.forEach((p, i) => p.classList.toggle("is-active", i === idx));
				panels.forEach((p, i) => gsap.set(p, { autoAlpha: i === idx ? 1 : 0 }));
				const newVid = panels[idx].querySelector("video");
				if (newVid) {
					newVid.currentTime = lastTime;
					newVid.play();
				}
			}

			function preserveVideoTime(panel) {
				if (!panel) return 0;
				const vid = panel.querySelector("video");
				if (vid) {
					const t = vid.currentTime;
					vid.pause();
					return t;
				}
				return 0;
			}
		}
	}

	function tabbedHero() {
		const CSS_VARS = { width: "--toggle-slider--w", left: "--toggle-slider--l" };
		const CONTROL_ITEM = "tab-controls_item";

		document.querySelectorAll(".c-tabbed-hero").forEach(setupHero);

		function setupHero(component) {
			const control = component.querySelector(".c-tab-controls");
			const list = component.querySelector(".tab-controls_list");
			const track = component.querySelector(".tab-controls_track");
			const panels = Array.from(component.querySelectorAll(".tabbed-hero_media-items .media"));
			let bounds = {};
			if (!control || !list || panels.length === 0) return;

			let draggable = null;

			// Build controls
			list.innerHTML = "";
			panels.forEach((panel, idx) => {
				const btn = document.createElement("button");
				btn.className = CONTROL_ITEM;
				btn.textContent = panel.dataset.title;
				btn.dataset.index = idx;
				btn.addEventListener("click", () => selectTab(idx));
				list.appendChild(btn);
			});

			const tabs = Array.from(list.children);
			let activeIndex = 0;

			function selectTab(i) {
				// preserve previous video time
				let prevTime = 0,
					prevEnded = false;
				const prevPanel = panels[activeIndex];
				if (prevPanel && prevPanel.classList.contains("is-active")) {
					const prevVid = prevPanel.querySelector("video");
					if (prevVid && !isNaN(prevVid.currentTime)) {
						prevTime = prevVid.currentTime;
						prevEnded = prevVid.ended;
					}
				}

				tabs.forEach((tab, idx) => tab.classList.toggle("is-active", idx === i));
				panels.forEach((panel, idx) => {
					const active = idx === i;
					panel.classList.toggle("is-active", active);
					gsap.to(panel, { autoAlpha: active ? 1 : 0 });
					if (active) {
						const vid = panel.querySelector("video");
						if (vid) {
							try {
								vid.currentTime = prevTime || 0;
							} catch (e) {}
							if (!prevEnded) vid.play();
						}
					}
				});

				moveHighlight(tabs[i]);
				scrollTabIntoView(tabs[i]); // <-- keep active tab visible when draggable
				activeIndex = i;
			}

			function moveHighlight(tab) {
				const left = tab.offsetLeft;
				const width = tab.offsetWidth;
				gsap.to(component, {
					[CSS_VARS.left]: `${left}px`,
					[CSS_VARS.width]: `${width}px`,
					duration: 0.3,
					ease: "power2.out",
				});
			}

			// Calculate correct draggable bounds based on overflow
			function updateBounds() {
				const { tabsWidth, trackWidth } = getWidths();
				const startOffset = (tabsWidth - trackWidth) / 2; // assuming centered

				// if tabsWidth is LESS than trackWidth
				if (tabsWidth < trackWidth) {
					return { minX: 0, maxX: 0 };
				}

				bounds = { minX: -tabsWidth + trackWidth + startOffset, maxX: startOffset };
			}

			function getWidths() {
				let tabsWidth = 0;
				tabs.forEach((tab) => {
					tabsWidth += tab.offsetWidth;
				});
				const trackWidth = track.offsetWidth;
				return { tabsWidth, trackWidth };
			}

			// Ensure a tab is inside the visible viewport of the control
			function scrollTabIntoView(tab) {
				// we want the active tab to be as close to center as possible

				if (!draggable) return;

				const currentX = gsap.getProperty(list, "x") || 0;

				const tabRect = tab.getBoundingClientRect();
				const wrapRect = track.getBoundingClientRect();

				let targetX = currentX;

				// Center the active tab in the viewport
				const tabCenter = tabRect.left + tabRect.width / 2;
				const wrapCenter = wrapRect.left + wrapRect.width / 2;
				targetX += wrapCenter - tabCenter;

				// Clamp within bounds and animate
				targetX = gsap.utils.clamp(bounds.minX, bounds.maxX, targetX);
				gsap.to(list, { x: targetX, duration: 0.3, ease: "power2.out" });
			}

			function updateMode() {
				// check if overflowing
				const { tabsWidth, trackWidth } = getWidths();
				const overflowing = tabsWidth > trackWidth;

				if (overflowing && !draggable) {
					gsap.set(list, { x: 0, cursor: "grab" });

					draggable = Draggable.create(list, {
						type: "x",
						bounds: bounds,
						inertia: true,
						edgeResistance: 0.85,
						allowContextMenu: true,
						allowNativeTouchScrolling: false,
						cursor: "grab",
						activeCursor: "grabbing",
						onDrag: function () {
							// protect against overscroll on very fast flicks if inertia disabled
							const clamped = gsap.utils.clamp(bounds.minX, bounds.maxX, this.x);
							if (clamped !== this.x) gsap.set(list, { x: clamped });
						},
					})[0];
				} else if (!overflowing && draggable) {
					draggable.kill();
					draggable = null;
					gsap.set(list, { x: 0, cursor: "" });
				}
				// when first set up, scroll the controls to the first item
				// scrollTabIntoView(tabs[0]);

				// If we have a draggable already, refresh its bounds (e.g., on resize)
				if (draggable) {
					updateBounds();
					draggable.applyBounds(bounds);
					// snap current x into the new bounds so it never gets stuck out of range
					const currentX = gsap.getProperty(list, "x") || 0;
					const clamped = gsap.utils.clamp(bounds.minX, bounds.maxX, currentX);
					if (clamped !== currentX) gsap.set(list, { x: clamped });
					// update highlight
					moveHighlight(tabs[activeIndex]);
					// scrollTabIntoView(tabs[activeIndex]);
				}
			}

			const debouncedUpdate = lenus.helperFunctions.debounce(updateMode);
			window.addEventListener("resize", debouncedUpdate);

			// Initial activation and mode setup
			selectTab(0);
			// scrollTabIntoView(tabs[0]);
			updateMode();
		}
	}

	function toggleSlider() {
		const CSS_VARS = { width: "--toggle-slider--w", left: "--toggle-slider--l" };

		document.querySelectorAll(".c-toggle-slider").forEach(setupSlider);

		function setupSlider(component) {
			const list = component.querySelector(".toggle-slider_list");
			const track = component.querySelector(".toggle-slider_track");
			const items = Array.from(component.querySelectorAll(".c-toggle-slider-item"));
			const radios = Array.from(component.querySelectorAll("input[type=radio]"));
			const labels = Array.from(component.querySelectorAll(".toggle-slider_label"));
			let activeItem;
			let draggable = null;
			let pickerMode = false;
			let fadeLeft, fadeRight;

			if (!list || radios.length === 0) return;

			// Add gradient fade overlays if not present
			if (!component.querySelector(".toggle-slider_fade-left")) {
				fadeLeft = document.createElement("div");
				fadeLeft.className = "toggle-slider_fade-left";
				component.appendChild(fadeLeft);
			}
			if (!component.querySelector(".toggle-slider_fade-right")) {
				fadeRight = document.createElement("div");
				fadeRight.className = "toggle-slider_fade-right";
				component.appendChild(fadeRight);
			}

			// Initial highlight
			const initial = radios.find((r) => r.checked) || radios[0];
			const initialLabel = component.querySelector(`label[for="${initial.id}"]`);
			activeItem = items.find((it) => it.contains(initialLabel));
			moveHighlight(initialLabel, true);

			// Change handler
			radios.forEach((radio) => {
				radio.addEventListener("change", () => {
					if (radio.checked) {
						const label = component.querySelector(`label[for="${radio.id}"]`);
						items.forEach((it) => it.classList.toggle("is-active", it.contains(label)));
						moveHighlight(label);
						activeItem = items.find((it) => it.contains(label));
						// Snap to selected in picker mode
						if (pickerMode && draggable) {
							snapToItem(items.indexOf(activeItem));
						}
					}
				});
			});

			// On resize, re-calc position for checked item
			window.addEventListener(
				"resize",
				lenus.helperFunctions.debounce(() => {
					moveHighlight(activeItem);
					updateMode();
				})
			);

			function moveHighlight(target, isInitial = false) {
				if (!target) return;
				const targetRect = target.getBoundingClientRect();
				const listRect = list.getBoundingClientRect();
				const left = targetRect.left - listRect.left;
				const width = targetRect.width;

				if (isInitial) {
					gsap.set(component, {
						[CSS_VARS.left]: `${left}px`,
						[CSS_VARS.width]: `${width}px`,
					});
					items.forEach((it) =>
						it.classList.toggle("is-active", it.contains(target) || it === target)
					);
				} else {
					gsap.to(component, {
						[CSS_VARS.left]: `${left}px`,
						[CSS_VARS.width]: `${width}px`,
						duration: 0.3,
						ease: "power2.out",
					});
				}
			}

			function updateMode() {
				let containerWidth = component.offsetWidth;
				let listWidth = 0;
				for (let i = 0; i < items.length; i++) {
					listWidth += items[i].offsetWidth;
				}
				let itemWidth = listWidth / items.length; // average

				console.log("itemWidth: " + itemWidth);
				console.log("containerWidth: " + containerWidth);
				console.log("listWidth: " + listWidth);

				// Picker mode: less than 2.5 items fit
				pickerMode = listWidth > containerWidth && containerWidth < itemWidth * 2.5;

				// Show/hide fade overlays
				if (listWidth > containerWidth) {
					fadeLeft.style.display = "block";
					fadeRight.style.display = "block";
				} else {
					fadeLeft.style.display = "none";
					fadeRight.style.display = "none";
				}

				if (listWidth > containerWidth) {
					// need to account for flex centering when setting bounds
					const centerOffset = (containerWidth - listWidth) / 2;
					bounds = { minX: -centerOffset, maxX: centerOffset };

					if (!draggable) {
						draggable = Draggable.create(list, {
							type: "x",
							bounds: bounds,
							inertia: true,
							cursor: "grab",
							activeCursor: "grabbing",
							onDragEnd: function () {
								if (pickerMode) {
									const idx = getClosestToCenter();
									snapToItem(idx);
									radios[idx].checked = true;
									items.forEach((it, i) => it.classList.toggle("is-active", i === idx));
									moveHighlight(labels[idx]);
									activeItem = items[idx];
								}
							},
						})[0];
					}
					// set initial draggable position

					gsap.set(list, { x: -centerOffset });
				} else if (draggable) {
					draggable.kill();
					draggable = null;
					gsap.set(list, { x: 0 });
				}
			}

			function getClosestToCenter() {
				const containerRect = component.getBoundingClientRect();
				const center = containerRect.left + containerRect.width / 2;
				let closestIdx = 0,
					minDist = Infinity;
				items.forEach((item, idx) => {
					const rect = item.getBoundingClientRect();
					const itemCenter = rect.left + rect.width / 2;
					const dist = Math.abs(center - itemCenter);
					if (dist < minDist) {
						minDist = dist;
						closestIdx = idx;
					}
				});
				return closestIdx;
			}

			function snapToItem(idx) {
				const item = items[idx];
				const containerRect = component.getBoundingClientRect();
				const offset = item.offsetLeft + item.offsetWidth / 2 - containerRect.width / 2;
				const minX = component.offsetWidth - list.scrollWidth;
				const maxX = 0;
				const x = gsap.utils.clamp(minX, maxX, -offset);
				gsap.to(list, { x, duration: 0.3, ease: "power2.out" });
			}

			// Initial mode setup
			updateMode();
		}
	}

	function wideCarousel() {
		document.querySelectorAll(".c-carousel.is-wide").forEach((component) => {
			console.log("Initializing wide carousel:", component);
			const instance = lenus.helperFunctions.initSplideCarousel(component, {
				config: {
					// focus: "center",
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
	function miniCarousel() {
		document.querySelectorAll(".c-carousel.is-mini").forEach((component) => {
			console.log("Initializing mini carousel:", component);
			const instance = lenus.helperFunctions.initSplideCarousel(component, {
				config: {
					// focus: "center",
					speed: 400,
					breakpoints: {
						767: {
							gap: "1rem",
							autoWidth: false,
						},
					},
				},
				onMounted: (instance) => {
					// Find slide with .w--current link - use original slides only
					const slides = instance.Components.Slides.get();
					let targetIndex = null;

					// Filter out clones and only check original slides
					const originalSlides = slides.filter((slideObj) => !slideObj.isClone);

					originalSlides.forEach((slideObj, index) => {
						const currentLink = slideObj.slide.querySelector("a.w--current");
						if (currentLink) {
							targetIndex = slideObj.index; // Use the slideObj's actual index
						}
					});

					// If we found a slide with .w--current, go to it
					if (targetIndex !== null) {
						console.log(
							`Setting mini carousel active slide to index ${targetIndex} (contains .w--current)`
						);
						instance.go(targetIndex);
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

	function bentoHero() {
		/*
		- bg image starts full width and height
		- on scroll with scrolltrigger, image shrinks to defined container. We will probably use GSAP Flip for this to move it to the new position
		- will need to change the nav logo color at the same time from white to black
		- on mobile we don't do this, we just load the image at the correct size.
		- but on mobile we do the following:
			- on load, the top part of the component is 100vh with the section image shown and the section title content pinned to the bottom
			- as we scroll, the image container remains pinned, but the image changes to the image from the first bento card. The section title content scrolls up out of view. The first bento card title appears.
			- there are then left/right arrows to scroll through the bento cards. The image container remains pinned but the image itself changes to the image from the bento card. The bento card title translates in from the left/right like a normal carousel.
		- we need to handle the appropriate resize events, checking if the mode has changed and doing the appropriate setup / teardown.

		*/

		document.querySelectorAll(".c-bento-hero").forEach((component) => {
			const bg = component.querySelector(".bento-hero_bg");
			const primaryBg = component.querySelector(".bento-hero_bg-img.is-primary");
			const cardBgs = gsap.utils.toArray(".bento-hero_bg-img.is-card", component);

			const topContent = component.querySelector(".bento-hero_title-wrap");
			const bottomContent = component.querySelector(".bento-hero_bottom");
			const controls = component.querySelector(".bento-hero_controls");

			const cards = gsap.utils.toArray(".bento-hero-card", component);
			const bgTarget = component.querySelector(".bento-hero_layout");

			const mediaQuery = window.matchMedia("(max-width: 768px)");
			let currentMode = mediaQuery.matches ? "mobile" : "desktop";

			let desktopCtx, mobileCtx;
			let splideInstance;

			function initDesktop() {
				// return;
				teardownMobile();
				desktopCtx && desktopCtx.revert();
				desktopCtx = gsap.context(() => {
					// start with image at full size
					gsap.set(bg, {
						width: "100%",
						height: "100%",
						scale: 1.05,
					});
					const tl = gsap.timeline({
						onComplete: () => {},
						scrollTrigger: {
							trigger: component,
							start: 20,
							end: "+=300",
							toggleActions: "play none reverse  reverse",
							scrub: 1,
							pin: true,
							pinSpacing: true,
							onLeave: () => {
								ctaImage();
							},
						},
					});

					tl.add(Flip.fit(bg, bgTarget, { duration: 1.75, ease: "power2.out" }));
					tl.to(
						bg,
						{
							borderRadius: "20px",
							duration: 1.75,
							ease: "power4.out",
						},
						0
					);
				});
			}

			function initMobile() {
				teardownDsk();

				gsap.set(topContent, {
					autoAlpha: 1,
					y: 0,
				});
				gsap.set(bg, {
					scale: 1,
				});
				gsap.set([bottomContent, controls], {
					autoAlpha: 0,
					y: 20,
				});
				mobileCtx = gsap.context(() => {
					const tl = gsap.timeline({
						onComplete: () => {},
						scrollTrigger: {
							trigger: component,
							start: 20,
							end: "+=300",
							toggleActions: "play none reverse  reverse",

							// scrub: true,
							// pin: true,
							// pinSpacing: true,
							// markers: true,
						},
					});
					tl.to(
						bg,
						{
							autoAlpha: 0,
							duration: 0.5,
							ease: "power2.out",
						},
						0.1
					)
						.to(
							topContent,
							{
								autoAlpha: 0,
								y: -20,
								duration: 0.5,
								ease: "power2.out",
							},
							0.1
						)
						// .to(
						// 	cardBgs[0],
						// 	{
						// 		autoAlpha: 1,
						// 		duration: 0.5,
						// 		ease: "power2.out",
						// 	},
						// 	0.1
						// )
						.to(
							[bottomContent, controls],
							{
								y: 0,
								autoAlpha: 1,
								duration: 0.5,
								ease: "power2.out",
							},
							0.1
						);
				});
				setupSplide();
			}

			function setupSplide() {
				splideInstance = new Splide(component, {
					autoplay: false,
					arrows: true,
					pagination: false,
					snap: true,
					drag: "free",
					autoWidth: true,
					focus: "center",
				});
				splideInstance.mount();
				// on active slide change, update the image in the container
				splideInstance.on("active", (slide) => {
					// get the nth element from cardBgs
					const index = slide.index;
					const cardImage = cardBgs[index];
					if (!cardImage) return; // no image found for this slide

					if (cardImage) {
						const bgTl = gsap.timeline();
						bgTl.to(cardBgs, {
							autoAlpha: 0,
							duration: 0.5,
							ease: "power2.out",
						});
						bgTl.to(
							cardImage,
							{
								autoAlpha: 1,
								duration: 0.5,
								ease: "power2.out",
							},
							"<"
						);
					}
				});
			}

			function teardownDsk() {
				if (desktopCtx) {
					desktopCtx.revert();
					desktopCtx = null;
				}
			}

			function teardownMobile() {
				if (mobileCtx) {
					mobileCtx.revert();
					mobileCtx = null;
				}
				if (splideInstance) {
					splideInstance.destroy();
					splideInstance = null;
				}
				gsap.set(topContent, {
					autoAlpha: 1,
					y: 0,
				});
				gsap.set(bottomContent, {
					autoAlpha: 1,
					y: 0,
				});
			}

			// Initial setup
			if (currentMode === "mobile") initMobile();
			else initDesktop();

			const onResize = lenus.helperFunctions.debounce(() => {
				const newMode = mediaQuery.matches ? "mobile" : "desktop";

				if (newMode === currentMode) {
					return;
				}

				currentMode = newMode;
				if (newMode === "mobile") initMobile();
				else initDesktop();
			});

			window.addEventListener("resize", onResize);
		});
	}

	function locations() {
		// enable splide for all instances of c-locations
		// enable hover events using GSAP for all .location-card elements:
		//  - scale up the .location-card_media > img item
		//  - capture the current card width and apply it as a fixed width to the card while we do the animation
		//  - scale down the location-card_title
		//  - increase the height of the _details element and increase its opacity from 0 to 1

		const isMobile = window.matchMedia("(max-width: 768px)").matches;

		document.querySelectorAll(".c-locations.splide").forEach((component, index) => {
			// alternate components go in opposite directions
			const speed = index % 2 === 0 ? 0.5 : -0.5;
			// initalise Splide
			var splideInstance = new Splide(component, {
				type: "loop",
				autoWidth: true,
				arrows: false,
				pagination: false,
				snap: false,
				//focus: "center",
				gap: "0",
				autoplay: false,
				drag: "free",
				autoScroll: {
					speed: speed,
					pauseOnHover: true,
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

			if (isMobile) return; // Skip hover interactions on mobile

			const cards = lenus.helperFunctions.getCards(component);
			cards.forEach((card) => {
				const media = card.querySelector(".location-card_media-inner");
				const details = card.querySelector(".location-card_details");
				const title = card.querySelector(".location-card_title");
				const mediaText = card.querySelector(".location-card_media-text");

				if (!media || !details || !title) return;

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
					scale: 1.25,
				})
					.to(
						title,
						{
							fontSize: "2.25rem",
						},
						"<"
					)
					.fromTo(
						details,
						{
							height: 0,
							opacity: 0,
						},
						{
							height: "auto",
							opacity: 1,
						},
						"<"
					)
					.to(
						mediaText,
						{
							opacity: 1,
						},
						"<"
					);

				// add hover events to the card
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
		mapboxgl.accessToken =
			"pk.eyJ1Ijoic3B1cndpbmctc3AiLCJhIjoiY21kc3I1MmV1MHV3MzJscjN5MDF6ZGFxMSJ9.5EnxurStX-M_QZovcUegZw";

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
				style: "mapbox://styles/spurwing-sp/cm0pfyq2r00je01pb5lf74zb3",
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
		// ====== Configurable Randomization Bounds ======
		const config = {
			maxRotation: 10, // degrees
			minScale: 0.8, // scale
			maxScale: 1.0,
			posYOffset: 300, // how far down to animate from
			fadeDuration: 0.5, // seconds
			transformDuration: 1, // seconds
			stagger: 0.05, // stagger between each image
			scale: [0.8, 1], // scale options for randomization

			// positioning bounds for random X/Y (in % relative to parent)
			bounds: {
				desktop: {
					xMin: -25,
					xMax: 25,
					yMin: -100,
					yMax: 100,
				},
				mobile: {
					xMin: -15,
					xMax: 15,
					yMin: -50,
					yMax: 50,
				},
			},

			centerBounds: {
				desktop: {
					yMin: -20,
					yMax: 20,
				},
				mobile: {
					yMin: -10,
					yMax: 10,
				},
			},
		};

		// Helper function to detect if we're on mobile
		const isMobile = () => window.innerWidth <= 768;

		// Helper function to get current bounds based on screen size
		const getCurrentBounds = () => (isMobile() ? config.bounds.mobile : config.bounds.desktop);
		const getCurrentCenterBounds = () =>
			isMobile() ? config.centerBounds.mobile : config.centerBounds.desktop;

		// Function to animate images to their scattered positions
		const animateInTl = (componentObj) => {
			let component = componentObj.component;
			const bounds = getCurrentBounds();
			const centerBounds = getCurrentCenterBounds();

			let tl = gsap.timeline({ paused: true });

			tl.fromTo(
				component.querySelectorAll(".scatter-hero_media-wrap:is(.is-left, .is-right) .scatter-img"),
				{
					y: config.posYOffset,
					autoAlpha: 0,
				},
				{
					xPercent: () => gsap.utils.random(bounds.xMin, bounds.xMax),
					yPercent: () => gsap.utils.random(bounds.yMin, bounds.yMax),
					rotation: () => gsap.utils.random(-config.maxRotation, config.maxRotation),
					scale: () => gsap.utils.random(config.scale),
					autoAlpha: 1,
					y: 0,
					duration: config.transformDuration,
					ease: "power3.out",
					stagger: {
						amount: config.stagger,
						from: "random",
					},
				}
			).fromTo(
				component.querySelectorAll(".scatter-hero_media-wrap.is-main .scatter-img"),
				{
					opacity: 0,
					y: config.posYOffset,
				},
				{
					opacity: 1,
					yPercent: () => gsap.utils.random(centerBounds.yMin, centerBounds.yMax),
					rotation: () => gsap.utils.random(-2, 2),
					y: 0,
					scale: 1, // keep size fixed
					duration: config.fadeDuration,
					ease: "power3.out",
				},
				"<"
			);

			tl.eventCallback("onComplete", () => {
				console.log("Animation in completed");
				componentObj.inAnimationCompleted = true;
				// if (componentObj.outAnimationToRun) {
				// 	componentObj.tl_out.play(); // play out animation if it was triggered while in not yet completed
				// }

				// make draggable
				setupDraggable(componentObj);
			});

			return tl;
		};

		function setupDraggable(componentObj) {
			const component = componentObj.component;
			const section = componentObj.section;
			// find all images
			const imgs = component.querySelectorAll(".scatter-img");
			if (imgs.length === 0) return;

			// Set up draggable for rotation and translation
			imgs.forEach((el) => {
				let rotationDrag = setupRotationDraggable(el);
				let translateDrag = setupTranslateDraggable(el);

				function setupRotationDraggable(el) {
					let rotationDrag = new Draggable(el, {
						type: "rotation",
						throwProps: true,
						inertia: true,
						zIndexBoost: false,
						onPress: setDraggable,
					}).disable();
					return rotationDrag;
				}

				function setupTranslateDraggable(el) {
					let translateDrag = new Draggable(el, {
						bounds: section,
						throwProps: true,
						inertia: true,
						zIndexBoost: false,
						onPress: setDraggable,
					});
					return translateDrag;
				}

				function setDraggable(event) {
					let isRotation = this.vars.type === "rotation";
					let isCorner = event.target.classList.contains("scatter-img_corner");

					if (isCorner) {
						// No need to do this if it's already the rotation draggable
						if (!isRotation) {
							translateDrag.disable();
							rotationDrag.enable().startDrag(event);
						}
					} else if (isRotation) {
						rotationDrag.disable();
						translateDrag.enable().startDrag(event);
					}
				}
			});
		}

		// Function to animate images out of view
		const animateOutTl = (componentObj) => {
			let component = componentObj.component;
			let tl = gsap.timeline({
				paused: true,
				onStart: () => {
					console.log("Starting animation out");
				},
				onComplete: () => {
					console.log("Animation out completed");
					// componentObj.outAnimationToRun = false;
				},
			});
			tl.to(component.querySelectorAll(".scatter-hero_media-wrap"), {
				y: -200,
				autoAlpha: 0,
				duration: config.transformDuration,
				ease: "power2.in",
				stagger: {
					amount: config.stagger,
					from: "random",
				},
			});

			return tl;
		};

		// Store resize timeout to debounce resize events
		let resizeTimeout;

		// loop through all .c-scatter-hero components
		document.querySelectorAll(".c-scatter-hero").forEach((component) => {
			let componentObj = {
				component: component,
				section: component.closest(".section"),
				images: gsap.utils.toArray(".scatter-img", component),
				inAnimationCompleted: false,
				outAnimationToRun: false,
			};
			let currentScreenType = isMobile() ? "mobile" : "desktop";

			// componentObj.tl_out = animateOutTl(componentObj);
			componentObj.tl_in = animateInTl(componentObj);

			// wait for images to load before starting animations
			const images = componentObj.images;

			const loadPromises = images.map((img_wrap) => {
				const img = img_wrap.querySelector("img");
				if (img.complete) return Promise.resolve(img); // already loaded
				return new Promise((resolve) => {
					img.addEventListener("load", () => resolve(img));
					img.addEventListener("error", () => resolve(img)); // resolve even on error to avoid blocking
				});
			});

			Promise.all(loadPromises).then(() => {
				console.log("All images loaded");
				// Start animations
				componentObj.tl_in.play();
			});

			// // if html element has class 'lenus-page-loaded' then run animation, otherwise wait for window load event
			// if (document.documentElement.classList.contains("lenus-page-loaded")) {
			// 	componentObj.tl_in.play();
			// } else {
			// 	window.addEventListener("load", () => {
			// 		componentObj.tl_in.play();
			// 	});
			// }

			// Create scroll trigger for scroll-based animations
			ScrollTrigger.create({
				trigger: component,
				start: "bottom 80%",
				end: "bottom 79%",
				onEnter: () => {
					componentObj.outAnimationToRun = true;
					if (!componentObj.inAnimationCompleted) {
						console.log("Animation in not yet completed, deferring animation out");
						return; // don't animate out if in not yet completed
					}
					// componentObj.tl_out.play();
				},
				onLeave: () => {},
				onEnterBack: () => {
					// componentObj.tl_out.reverse();
				},
				onLeaveBack: () => {},
			});

			// Handle resize events
			// const handleResize = () => {
			// 	clearTimeout(resizeTimeout);
			// 	resizeTimeout = setTimeout(() => {
			// 		const newScreenType = isMobile() ? "mobile" : "desktop";

			// 		// Only re-animate if screen type changed and component is in view
			// 		if (newScreenType !== currentScreenType && isInView) {
			// 			currentScreenType = newScreenType;
			// 			animateImagesIn(component);
			// 		} else {
			// 			currentScreenType = newScreenType;
			// 		}
			// 	}, 150); // Debounce resize events
			// };

			// window.addEventListener("resize", handleResize);
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
					gap: "0",
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
		return;
		/* add vertical infinite Splide slider to each c-job-scroll instance (assuming appropriate _track, _list, _item elements). Also run the shrinkWrap helper on each job-scroll_name item */

		const bp_tab = 991;
		const mm = window.matchMedia(`(max-width: ${bp_tab}px)`);

		document.querySelectorAll(".c-job-scroll").forEach((component) => {
			const state = {
				mode: null,
				loop: null, //GSAP timeline
				splides: [], // splide instances
				cloneItems: [],
				cloneInstance: [],
			};

			component._jobScroll = state;

			const init = () => {
				const isTablet = mm.matches;
				if (isTablet && state.mode !== "tablet") {
					console.log("Switching to tablet");
					teardownDesktop(component);
					initTablet(component);
				} else if (!isTablet && state.mode !== "desktop") {
					console.log("Switching to desktop");
					teardownTablet(component);
					initDesktop(component);
				}
			};

			function initDesktop(root) {
				const instance = root.querySelector(".job-scroll_instance");
				const list = root.querySelector(".job-scroll_list");
				let items = gsap.utils.toArray(".job-scroll_item", root);
				if (!instance || !list || items.length === 0) return;

				// if instance is not tall enough to cover component, duplicate items
				if (instance.offsetHeight < component.offsetHeight) {
					const cloneCount = Math.ceil(component.offsetHeight / instance.offsetHeight) - 1;
					const clonesAdded = [];
					for (let i = 0; i < cloneCount; i++) {
						const current = Array.from(list.querySelectorAll(".job-scroll_item:not(.clone)"));

						current.forEach((item) => {
							const clone = item.cloneNode(true);
							clone.classList.add("clone");
							list.appendChild(clone);
							clonesAdded.push(clone);
						});
					}
					// track clones so they can be removed on teardown
					state.cloneItems.push(...clonesAdded);
					// refresh items to include clones
					items = gsap.utils.toArray(".job-scroll_item", root);
				}

				state.loop = lenus.helperFunctions.verticalLoop(items, {
					draggable: true,
					center: true,
					repeat: -1,
					speed: 0.5,
				});

				state.mode = "desktop";
			}

			function initTablet(root) {
				const baseInstance = root.querySelector(".job-scroll_instance");
				const baseList = root.querySelector(".job-scroll_list");
				let items = gsap.utils.toArray(".job-scroll_item", root);
				if (!baseInstance || !baseList || items.length === 0) return;

				// duplicate instance to create second marquee
				const cloneInstance = baseInstance.cloneNode(true);
				baseInstance.after(cloneInstance);
				state.dupInstance = cloneInstance;

				const buildSplide = (instanceEl, speed) => {
					const options = {
						type: "loop",
						autoWidth: true,
						autoplay: false,
						autoScroll: {
							speed: speed,
							pauseOnHover: true,
						},
						intersection: {
							inView: {
								autoScroll: true,
							},
							outView: {
								autoScroll: false,
							},
						},
						snap: false,
						drag: false,
						pagination: false,
						arrows: false,
					};

					let splide = new Splide(instanceEl, options).mount(window.splide.Extensions);
					return splide;
				};

				const splide_1 = buildSplide(baseInstance, 1);
				const splide_2 = buildSplide(cloneInstance, -1);
				state.splides = [splide_1, splide_2];

				state.mode = "tablet";
			}

			function teardownTablet(root) {
				// destroy splides
				state.splides.forEach((splide) => splide.destroy(true));
				state.splides = [];

				// remove duplicate instance
				if (state.dupInstance) {
					state.dupInstance.remove();
					state.dupInstance = null;
				}
			}

			function teardownDesktop(root) {
				// destroy loop
				if (state.loop) {
					console.log("Killing job scroll loop");
					state.loop.kill();
					state.loop = null;
				}

				// remove any clones
				state.cloneItems.forEach((item) => item.remove());
				state.cloneItems = [];

				// remove transforms set by GSAP from all items
				gsap.utils.toArray(".job-scroll_item", root).forEach((item) => {
					gsap.set(item, { clearProps: true });
				});
			}

			init();

			function handleResize() {
				// hide element temporarily
				component.style.opacity = "0";
				init();
				// wait for 200ms
				setTimeout(() => {
					component.style.opacity = "";
				}, 200);
			}

			// on resize
			window.addEventListener("resize", lenus.helperFunctions.debounce(handleResize));
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
				}
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
				getComputedStyle(highlight).getPropertyValue("border-left-width")
			);
			adjustedLeft += borderWidth;
			adjustedWidth -= borderWidth * 2;

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

		const mediaQuery = window.matchMedia("(max-width: 767px)");
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
		let staggerGroup3_dsk = filterValidElements([nav.querySelector(".nav-mega_feat")]);
		// }
		let stagger = 0.05;

		let staggerGroup1_mbl = filterValidElements(nav.querySelector(".nav-mega_feat"));
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
			gsap.set([".nav-mega_col", ".nav-mega_feat", ".nav-mega_footer"], { autoAlpha: 0 });
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
				0
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
				0
			);
			tl.to(
				icon,
				{
					rotation: 45,
					duration: 0.3,
				},
				0
			);
			if (staggerGroup1_dsk && staggerGroup1_dsk.length > 0) {
				tl.to(
					staggerGroup1_dsk,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					"flipDone"
				);
			}
			if (staggerGroup2_dsk && staggerGroup2_dsk.length > 0) {
				tl.to(
					staggerGroup2_dsk,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					`flipDone+=${stagger}`
				);
			}
			if (staggerGroup3_dsk && staggerGroup3_dsk.length > 0) {
				tl.to(
					staggerGroup3_dsk,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					`flipDone+=${stagger * 2}`
				);
			}
			tl.set(navBg, { autoAlpha: 0 }, "flipDone");
			tl.set(
				megaNavBg,
				{
					autoAlpha: 1,
				},
				"flipDone"
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
				0
			);
			tl.to(
				navLayout,
				{
					opacity: 1,
					duration: 0.3,
					ease: "power2.out",
				},
				0
			);
			tl.to(
				iconMbl,
				{
					rotation: 45,
					duration: 0.3,
				},
				0
			);

			// Only add animations for groups that have elements
			if (staggerGroup1_mbl && staggerGroup1_mbl.length > 0) {
				tl.to(
					staggerGroup1_mbl,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					0.1
				);
			}

			if (staggerGroup2_mbl && staggerGroup2_mbl.length > 0) {
				tl.to(
					staggerGroup2_mbl,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					0.1 + stagger
				);
			}

			if (staggerGroup3_mbl && staggerGroup3_mbl.length > 0) {
				tl.to(
					staggerGroup3_mbl,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					0.1 + stagger * 2
				);
			}

			if (staggerGroup4_mbl && staggerGroup4_mbl.length > 0) {
				tl.to(
					staggerGroup4_mbl,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					0.1 + stagger * 3
				);
			}

			if (staggerGroup5_mbl && staggerGroup5_mbl.length > 0) {
				tl.to(
					staggerGroup5_mbl,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					0.1 + stagger * 4
				);
			}

			if (staggerGroup6_mbl && staggerGroup6_mbl.length > 0) {
				tl.to(
					staggerGroup6_mbl,
					{
						autoAlpha: 1,
						duration: 0.5,
					},
					0.1 + stagger * 5
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
						">-0.1"
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
						">-0.05"
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
										})
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
					0
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
				})
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
				'input[type="radio"][fs-list-field="category"]:checked'
			);
			const activeSubBlogRadios = document.querySelectorAll(
				'input[type="radio"][fs-list-field="blog"]:checked'
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
			isBlogPostPage
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
			const hiddenForm = document.querySelector(".products-listing_grid .u-display-none form");
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
							(radio) => radio.getAttribute("fs-list-value") === categoryParam
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
				'input[type="radio"][fs-list-field="category"]'
			);
			const blogRadios = visibleForm?.querySelectorAll('input[type="radio"][fs-list-field="blog"]');
			const allRadios = visibleForm?.querySelectorAll('input[type="radio"]');
			const searchInput = visibleForm?.querySelector('input[fs-list-field="*"]');
			// Get category filter items using a more compatible selector
			const categoryFilterItems = Array.from(
				document.querySelectorAll(".filters_list-item")
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
							(radio) => radio.getAttribute("fs-list-value") === blogParam
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
		document.querySelectorAll(".pricing-options").forEach((component) => {
			lenus.helperFunctions.initSplideCarousel(component, {
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

				tl.timeScale(1.35);

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
					delayTransformCurrent
				)
					.to(
						charsCurrent,
						{
							filter: "blur(4px)",
							duration: duration,
							ease: ease,
							stagger: { each: staggerAmount, from: fromSide },
						},
						delayBlurCurrent
					)
					.to(
						charsCurrent,
						{
							opacity: 0,
							duration: durationOpacity,
							ease: ease,
							stagger: { each: staggerAmount, from: fromSide },
						},
						delayOpacityCurrent
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
					delayTransformNext
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
						delayBlurNext
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
						delayOpacityNext
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
		const components = document.querySelectorAll(".c-quote.splide");
		if (components.length === 0) return;

		components.forEach((component) => {
			const items = component.querySelectorAll(".quote_list-item");
			if (items.length <= 1) {
				// No need to animate if only one item
				const controls = component.querySelector(".carousel_controls");
				if (controls) controls.remove();
				return;
			}

			// Initialize Splide with breakpoints for desktop/mobile configs
			const splideInstance = lenus.helperFunctions.initSplideCarousel(component, {
				config: {
					// Desktop defaults (768px and above)
					type: "fade",
					rewind: true,
					autoplay: true,
					interval: 5000,
					pauseOnHover: true,
					pagination: false,
					speed: 600,
					// Mobile breakpoint
					breakpoints: {
						767: {
							arrows: true,
							gap: "0rem",
						},
					},
				},
				useAutoScroll: false,
			});
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
				console.log("delta:", delta, "hiding nav");
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
			"[data-location-element='parent']:not([data-location-processed])"
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
						})
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

					console.log(
						`Updated location ${parent} - Time: ${time}, Night: ${isNightTime()}, Time elements: ${
							timeElements.length
						}, Day images: ${dayImages.length}, Night images: ${nightImages.length}`
					);
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

			const group_list = component.querySelector(".events-list_list");
			if (!group_list) return;

			// find department group template
			const departmentGroup = group_list.querySelector(".events-group");
			if (!departmentGroup) {
				console.warn("[Lenus.Greenhouse] No .events-group template found.");
				return;
			}

			// clone department and job templates
			this.departmentTemplate = departmentGroup.cloneNode(true);
			this.jobTemplate = departmentGroup.querySelector(".events-group_list-item")?.cloneNode(true);

			if (!this.jobTemplate) {
				console.warn(
					"[Lenus.Greenhouse] No .events-group_list-item found inside .events-group template."
				);
				return;
			}

			// remove the template from the DOM
			departmentGroup.remove();

			// fetch Greenhouse data
			fetch(this.apiUrl)
				.then((res) => res.json())
				.then((data) => {
					console.log("Greenhouse API response:", data); // Debug log

					if (!data.jobs) {
						console.warn("No jobs found in API response");
						return;
					}

					const jobs = data.jobs;

					// Process jobs to add normalized department names
					jobs.forEach((job) => {
						// Handle department - use first department or fallback to "General"
						job.jobDepartment = job.departments?.[0]?.name || "";
						job.jobLocation = job.location?.name || "";
					});

					this.renderJobs(jobs, group_list);

					// filters
					const locations = [...new Set(jobs.map((j) => j.jobLocation).filter(Boolean))];
					const departments = [...new Set(jobs.map((j) => j.jobDepartment).filter(Boolean))];

					console.log("Departments found:", departments); // Debug log
					console.log("Locations found:", locations); // Debug log

					this.populateFilters({ locations, departments });
				})
				.catch((err) => console.error("Greenhouse fetch error:", err));
		},

		renderJobs(jobs, container) {
			container.innerHTML = ""; // clear previous

			if (!jobs.length) {
				container.innerHTML =
					'<div class="body-m">No current openings. Please check back soon.</div>';
				return;
			}

			// group jobs by department using the normalized department name
			const grouped = {};
			jobs.forEach((job) => {
				const deptName = job.jobDepartment; // Use the normalized department name
				if (!grouped[deptName]) grouped[deptName] = [];
				grouped[deptName].push(job);
			});

			console.log("Grouped jobs by department:", grouped); // Debug log

			// iterate departments
			Object.entries(grouped).forEach(([departmentName, deptJobs]) => {
				const deptClone = this.departmentTemplate.cloneNode(true);
				const deptHeader = deptClone.querySelector("[data-template='department']");
				const deptList = deptClone.querySelector(".events-group_list");

				if (deptHeader) deptHeader.textContent = departmentName;
				if (deptList) deptList.innerHTML = "";

				deptJobs.forEach((job) => {
					const { title, absolute_url, location, departments } = job;
					const locationName = job.jobLocation;
					const departmentName = job.jobDepartment;

					const jobClone = this.jobTemplate.cloneNode(true);

					const linkEl = jobClone.querySelector("[data-template='link']");
					const nameEl = jobClone.querySelector("[data-template='name']");
					const deptEl = jobClone.querySelector("[data-template='department']");
					const locEl = jobClone.querySelector("[data-template='location']");

					if (linkEl) {
						linkEl.href = "/careers/opportunity-details/?gh_jid=" + job.id;
						linkEl.target = "_blank";
					}
					if (nameEl) nameEl.textContent = title;
					if (deptEl) deptEl.textContent = departmentName;
					if (locEl) locEl.textContent = locationName;

					deptList?.appendChild(jobClone);
				});

				container.appendChild(deptClone);
			});

			// refresh Finsweet filters
			window.fsAttributes?.list?.init?.();
		},

		populateFilters({ locations = [], departments = [] }) {
			const locSelect = document.querySelector('[data-greenhouse-filter="location"] select');
			const depSelect = document.querySelector('[data-greenhouse-filter="department"] select');

			if (locSelect) this.populateSelectCustom(locSelect, locations, "All locations");
			if (depSelect) this.populateSelectCustom(depSelect, departments, "All departments");
		},

		// ✅ Reusable Finsweet select builder
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
			if (selectWrap && window.fsAttributes?.selectcustom?.init) {
				window.fsAttributes.selectcustom.init(selectWrap);
			}
		},
	};

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

			console.log(job.content);

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
		bool = true
	) {
		const video = card.querySelector(videoSelector);
		const img = card.querySelector(imgSelector);
		if (!video || !img) return;
		let toShow = bool ? video : img;
		let toHide = bool ? img : video;

		// hide image and show video
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
		splideSlides
	) {
		const progress = component.querySelector(".carousel_progress");
		if (!progress) return;

		// get color variables from component
		const progressLineColor = getComputedStyle(component).getPropertyValue(
			"--_theme---progress-line"
		);
		const progressLineActiveColor = getComputedStyle(component).getPropertyValue(
			"--_theme---progress-line-active"
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
			video.currentTime = 0;
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
			emit("play", { card, video });
			entry.onPlay?.({ card, video });
		}

		function pause(card) {
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
				validation.missing
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
			easing: "cubic-bezier(0.5, 0, 0.75, 0)",
		};

		const mergedConfig = { ...defaultConfig, ...config };

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
			console.log("Carousel overflow status:", isOverflow);
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
				console.log("Splide mounted:", instance);
				onMounted(instance);
			});

		if (onReady)
			instance.on("ready", () => {
				console.log("Splide ready:", instance);
				onReady(instance);
			});

		// Mount with extensions if needed
		if (hasAutoScroll && window.splide?.Extensions) {
			instance.mount(window.splide.Extensions);
		} else {
			instance.mount();
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
								gsap.getProperty(el, "yPercent")
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
								tl.labels["label" + i] + (tl.duration() * heights[i]) / 2 / totalHeight - timeOffset
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
							0
						)
							.fromTo(
								item,
								{ yPercent: snap(((curY - distanceToLoop + totalHeight) / heights[i]) * 100) },
								{
									yPercent: yPercents[i],
									duration: (curY - distanceToLoop + totalHeight - curY) / pixelsPerSecond,
									immediateRender: false,
								},
								distanceToLoop / pixelsPerSecond
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
						"InertiaPlugin required for momentum-based scrolling and snapping. https://greensock.com/club"
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

	parallax();
	// loadVideos();
	gradTest1();
	logoSwap();
	// videoCarousel();
	ctaImage();
	randomTestimonial();
	accordion();
	cardTrain();
	animateTitles();
	tabbedHero();
	wideCarousel();
	multiQuote();
	bentoHero();
	locations();
	miniCarousel();
	featureColumns();
	mapbox();
	cardGrid();
	// testimCardVideos();
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
		console.log("Initializing navHover for non-mobile device");
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
		lenus.greenhouseJob.init();
	}
	handleLocalTimes();
}
