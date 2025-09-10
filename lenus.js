function main() {
	// splide defaults
	Splide.defaults = {
		perMove: 1,
		gap: "0rem",
		arrows: false,
		pagination: false,
		focus: 0,
		speed: 600,
		dragAngleThreshold: 60,
		autoWidth: false,
		rewind: false,
		rewindSpeed: 400,
		waitForTransition: false,
		updateOnMove: true,
		trimSpace: "move",
		type: "loop",
		drag: true,
		snap: true,
		autoplay: true,
	};

	// GSAP register
	gsap.registerPlugin(ScrollTrigger);

	// GSAP defaults
	gsap.defaults({
		ease: "power2.out",
		duration: 0.5,
	});

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

			const onResize = lenus.helperFunctions.debounce(() => {
				clearTimeout(timerId);
				clearTimeline();
				logoCount = getLogoCount(component);
				createLogoSlots();
				clearAllLogos();
				updateLogos();
				animateLogos();
			}, 200);
			window.addEventListener("resize", onResize);

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
					self.kill(); // don’t fire again until mode change
				},
				onEnterBack(self) {
					updateSources(video, isMobile() ? "mobile" : "desktop");
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

	function testimCardVideos() {
		// on play button click, play video and pause others
		// for all c-testimonial components, get child media and button[name="play"] elements

		document.querySelectorAll(".c-testim").forEach((component) => {
			const cards = component.querySelectorAll(".c-testim-card");
			const videoSelector = "video";
			const imgSelector = ".testim-card_bg img";

			cards.forEach((card) => {
				const playBtn = card.querySelector("btn[name='play']");
				if (!playBtn) return;
				const video = card.querySelector(videoSelector);
				if (!video) return;
				const img = card.querySelector(imgSelector);
				if (!img) return;

				// hide video and show image by default
				gsap.set(video, {
					autoAlpha: 0,
				});

				// on click, play video and pause others
				playBtn.addEventListener("click", () => {
					lenus.helperFunctions.showVideo(card, videoSelector, imgSelector, true); // show video, hide image
					video.play();
					video.controls = true;
					card.classList.add("playing");
				});

				// on video pause, reset card
				video.addEventListener("pause", () => {
					if (card.classList.contains("playing")) {
						lenus.helperFunctions.resetCard(card, videoSelector, imgSelector);
					}
				});

				// on video end, reset card
				video.addEventListener("ended", () => {
					lenus.helperFunctions.resetCard(card, videoSelector, imgSelector);
				});
			});
		});
	}

	function videoCarousel() {
		const imgSelector = ".testim-card_bg img";
		const videoSelector = "video";
		// for each video carousel component .c-testim-carousel.splide
		document.querySelectorAll(".c-testim-carousel.splide").forEach((component) => {
			// initalise Splide
			var splideInstance = new Splide(component, {
				type: "loop",
				autoplay: false,
				autoScroll: {
					speed: 1,
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
				breakpoints: {
					767: {
						// gap: "1rem",
						autoWidth: true,
					},
				},
				clones: 5,
				arrows: true,
				trimSpace: "move",
				pagination: false,
				snap: false,
				drag: "free",
				autoWidth: true,
				focus: "center",
			});
			splideInstance.mount(window.splide.Extensions);
			let autoScroll = splideInstance.Components.AutoScroll;

			const { Slides } = splideInstance.Components;
			const cards = component.querySelectorAll(".c-testim-card");

			lenus.helperFunctions.setUpProgressBar(component, cards, splideInstance, Slides);

			Slides.get().forEach((slideObj) => {
				const slideEl = slideObj.slide; // the actual DOM node

				const card = slideObj.slide.querySelector(".c-testim-card");
				const playBtn = card.querySelector("btn[name='play']");
				if (!playBtn) return;
				const video = card.querySelector("video");
				if (!video) return;
				const img = card.querySelector(".testim-card_bg img");
				if (!img) return;

				// hide video and show image by default. Then when card is clicked, show video and hide image
				gsap.set(video, {
					autoAlpha: 0,
				});

				// on click, play video and pause others
				playBtn.addEventListener("click", () => {
					const idx = slideObj.index;

					lenus.helperFunctions.resetAllCards(cards);
					// jump to slide
					splideInstance.go(idx);

					lenus.helperFunctions.showVideo(card, videoSelector, imgSelector, true); // show video, hide image
					video.play();
					video.controls = true;
					card.classList.add("playing");
					autoScroll.pause();
				});

				// on video pause, resume autoScroll
				video.addEventListener("pause", () => {
					if (card.classList.contains("playing")) {
						lenus.helperFunctions.resetCard(card, videoSelector, imgSelector);
						autoScroll.play();
					}
				});

				// on video end, reset card
				video.addEventListener("ended", () => {
					lenus.helperFunctions.resetCard(card, videoSelector, imgSelector);
					autoScroll.play();
				});
			});
		});
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
		document.querySelectorAll(".c-cta").forEach((component) => {
			const isSplit = component.classList.contains("is-split");
			const img = component.querySelector(".cta_img");
			const content = component.querySelector(".cta_content");
			const pinned = component.querySelector(".cta_pinned");
			const endParent = component.querySelector(".cta_spacer");
			const title = component.querySelector(".cta_title");
			let ctx; // GSAP context

			// Helper to check if the viewport is mobile
			const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

			const createTimeline = () => {
				// If it's a split variant and on mobile, revert to static
				if (isSplit && isMobile()) {
					ctx && ctx.revert(); // Revert any GSAP animations
					gsap.set([img, content, title], { clearProps: "all" }); // Clear inline styles
					return;
				}

				const gap = endParent.offsetWidth + 48;
				const titleSpans = title.querySelectorAll("span");
				const spanWidth = (content.offsetWidth - gap) / 2;

				ctx && ctx.revert(); // Revert previous GSAP context
				ctx = gsap.context(() => {
					// Start with the image at full size
					gsap.set(img, {
						width: "100%",
						height: "100%",
						scale: 1.05,
					});

					// }
					const tl = gsap.timeline({
						scrollTrigger: {
							trigger: component,
							start: "top top",
							end: "+=100%",
							scrub: 0.5,
							pin: pinned,
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
							// title,
							// {
							// 	gap: () => {
							// 		endParent.offsetWidth + 32 + "px";
							// 	},
							// 	duration: 0.5,
							// 	ease: "power1.inOut",
							// },
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
				});
			};

			// Debounced resize handler
			const debouncedResize = lenus.helperFunctions.debounce(createTimeline, 200);

			// Initial setup
			createTimeline();

			// Add resize event listener
			window.addEventListener("resize", debouncedResize);
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
			const items = gsap.utils.toArray(".accordion-item", component);
			const images = gsap.utils.toArray(".accordion-img", component);
			const borderColorDefault = getComputedStyle(component).getPropertyValue(
				"--_theme---accordion-border"
			);
			const borderColorHighlight = getComputedStyle(component).getPropertyValue(
				"--_theme---accordion-highlight"
			);

			items.forEach((item, index) => {
				const header = item.querySelector(".accordion-item_header");
				const content = item.querySelector(".accordion-item_content");
				const image = images[index] || null; // if no image, set to null

				// prepare content for auto-height animation
				gsap.set(content, {
					height: "auto",
					overflow: "hidden",
				});
				gsap.set(item, {
					borderBottomColor: borderColorHighlight,
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
					.from(content, { height: 0 })
					.from(
						item,
						{
							borderBottomColor: borderColorDefault,
						},
						0
					);

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
							other.querySelector(".accordion-item_header").setAttribute("aria-expanded", "false");
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
				firstItem.querySelector(".accordion-item_header").setAttribute("aria-expanded", "true");
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
			const cards = gsap.utils.toArray(".card", component);
			const bgs = gsap.utils.toArray(".card_media", component);
			const contents = gsap.utils.toArray(".card_content", component);
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
				768: {
					destroy: true,
				},
				767: {
					perPage: 1,
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
		const mediaQuery = window.matchMedia("(max-width: 768px)");

		// Helper to know current mode
		const isMobile = () => mediaQuery.matches;
		let currentMode = isMobile() ? "mobile" : "desktop"; // Track the current mode
		let splideInstance;

		document.querySelectorAll(".c-card-grid").forEach((component) => {
			const cards = gsap.utils.toArray(".card", component);

			let ctx = gsap.context(() => {});

			// initialise
			if (cards.length > 0) {
				if (currentMode === "desktop") {
				} else {
					console.log("Mobile mode detected, switching to carousel.");
					initSplide(cards, component);
				}
			}

			// on resize
			const onResize = lenus.helperFunctions.debounce(() => {
				const newMode = isMobile() ? "mobile" : "desktop";
				// if still in desktop, update the background images so they are correct
				if (newMode === "desktop") {
					console.log("Desktop mode detected, switching to card grid.");
					if (splideInstance) {
						lenus.helperFunctions.destroySplide(splideInstance);
					}
				}
				if (newMode === currentMode) return; // Only reinitialize if mode has changed

				currentMode = newMode; // Update the current mode

				if (newMode === "mobile") {
					console.log("Mobile mode detected, switching to carousel.");

					initSplide(cards, component);
				} else {
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
				768: {
					destroy: true,
				},
				767: {
					perPage: 1,
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

	function toggleSlider_v1() {
		const CSS_VARS = { width: "--toggle-slider--w", left: "--toggle-slider--l" };

		document.querySelectorAll(".c-toggle-slider").forEach(setupSlider);

		function setupSlider(component) {
			const list = component.querySelector(".toggle-slider_list");
			const track = component.querySelector(".toggle-slider_track");
			const items = Array.from(component.querySelectorAll(".c-toggle-slider-item"));
			const radios = Array.from(component.querySelectorAll("input[type=radio]"));
			const labels = Array.from(component.querySelectorAll(".toggle-slider_label"));
			let activeItem;

			if (!list || radios.length === 0) return;

			// Move highlight under initially checked radio
			const initial = radios.find((r) => r.checked) || radios[0];
			const initialLabel = component.querySelector(`label[for="${initial.id}"]`);
			activeItem = items.find((it) => it.contains(initial));
			moveHighlight(activeItem, true);

			// Change handler
			radios.forEach((radio) => {
				radio.addEventListener("change", () => {
					console.log("Radio changed:", radio);
					if (radio.checked) {
						const label = component.querySelector(`label[for="${radio.id}"]`);
						items.forEach((it) => it.classList.toggle("is-active", it.contains(label)));
						moveHighlight(label);
						activeItem = items.find((it) => it.contains(label));
					}
				});
			});

			// On resize, re-calc position for checked item
			window.addEventListener(
				"resize",
				lenus.helperFunctions.debounce(() => {
					moveHighlight(activeItem);
				})
			);

			// Core animation
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
					// set active
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
		}
	}

	// ...existing code...
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
	// ...existing code...

	function wideCarousel() {
		const splideSelector = ".c-carousel";
		const trackSelector = ".carousel_track";
		const listSelector = ".carousel_list";
		const slideSelector = ".carousel_item";
		document.querySelectorAll(splideSelector).forEach((component) => {
			// ensure component has appropriate classes
			if (!component.classList.contains("splide")) {
				component.classList.add("splide");
			}
			const listEl = component.querySelector(listSelector);
			if (!listEl) {
				return;
			}
			if (!listEl.classList.contains("splide__list")) {
				listEl.classList.add("splide__list");
			}
			const trackEl = component.querySelector(trackSelector);
			if (!trackEl) {
				return;
			}
			if (!trackEl.classList.contains("splide__track")) {
				trackEl.classList.add("splide__track");
			}
			const slides = component.querySelectorAll(slideSelector);
			if (slides.length < 2) {
				// don't run Splide if 0 or 1 slide
				return;
			}
			slides.forEach((slide) => {
				if (!slide.classList.contains("splide__slide")) {
					slide.classList.add("splide__slide");
				}
			});

			const autoscrollEnabled = component.dataset.autoscroll === "true";
			// initalise Splide
			var splideInstance = new Splide(component, {
				type: "loop",
				autoplay: false,
				autoScroll: {
					speed: 1,
					pauseOnHover: false,
				},
				intersection: {
					inView: {
						autoScroll: autoscrollEnabled,
					},
					outView: {
						autoScroll: false,
					},
				},
				breakpoints: {
					767: {
						gap: "1rem",
						autoWidth: false,
					},
				},
				clones: 5,
				arrows: true,
				trimSpace: "move",
				pagination: false,
				snap: false,
				drag: "free",
				autoWidth: true,
				focus: "center",
			});
			if (autoscrollEnabled) {
				splideInstance.mount(window.splide.Extensions);
				let autoScroll = splideInstance.Components.AutoScroll;
			} else {
				// If autoscroll is not enabled, we can still use Splide's features
				splideInstance.mount();
			}

			const { Slides } = splideInstance.Components;
			const cards = component.querySelectorAll(".c-testim-card");

			lenus.helperFunctions.setUpProgressBar(component, cards, splideInstance, Slides);

			Slides.get().forEach((slideObj) => {
				const slideEl = slideObj.slide; // the actual DOM node
			});
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
						scrollTrigger: {
							trigger: component,
							start: 20,
							end: "+=300",
							toggleActions: "play none reverse  reverse",
							scrub: 1,
							pin: true,
							pinSpacing: true,
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
							pin: true,
							pinSpacing: true,
							// markers: true,
						},
					});
					tl.to(
						primaryBg,
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
						.to(
							cardBgs[0],
							{
								autoAlpha: 1,
								duration: 0.5,
								ease: "power2.out",
							},
							0.1
						)
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

			const cards = gsap.utils.toArray(".location-card", component);

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

	function miniCarousel() {
		// enable splide for all instances of c-mini-carousel and also set up progress bar
		document.querySelectorAll(".c-mini-carousel.splide").forEach((component) => {
			var splideInstance = new Splide(component, {
				type: "loop",
				autoWidth: true,
				arrows: true,
				pagination: false,
				snap: false,
				gap: "0",
				autoplay: false,
				drag: "free",
			});
			splideInstance.mount(window.splide.Extensions);

			// set up progress bar
			lenus.helperFunctions.setUpProgressBar(
				component,
				gsap.utils.toArray(".location-card", component),
				splideInstance,
				splideInstance.Components.Slides
			);
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
				style: "mapbox://styles/spurwing-sp/cmc99cxxj008j01sh73j11qbt",
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
				if (componentObj.outAnimationToRun) {
					componentObj.tl_out.play(); // play out animation if it was triggered while in not yet completed
				}

				// make draggable
				setupDraggable(component);
			});

			return tl;
		};

		function setupDraggable(component) {
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
						bounds: window,
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
		// Track current mode to detect changes
		let currentMode = null;

		function setupSplide(component) {
			// Only create splide if it doesn't already exist
			if (component.splide) return;

			var splideInstance = new Splide(component, {
				type: "loop",
				autoWidth: true,
				arrows: true,
				pagination: false,
				snap: true,
				gap: "0",
				autoplay: false,
				drag: "free",
			});
			splideInstance.mount();

			// Store reference to splide instance on the component
			component.splide = splideInstance;

			// set up progress bar
			lenus.helperFunctions.setUpProgressBar(
				component,
				gsap.utils.toArray(".past-event-card", component),
				splideInstance,
				splideInstance.Components.Slides
			);
		}

		function destroySplide(component) {
			const splideInstance = component.splide;
			if (splideInstance) {
				splideInstance.destroy();
				component.splide = null;
			}
		}

		function handleModeChange() {
			const isMobile = window.matchMedia("(max-width: 768px)").matches;
			const newMode = isMobile ? "mobile" : "desktop";

			// Only process if mode has changed
			if (currentMode === newMode) return;
			currentMode = newMode;

			document.querySelectorAll(".c-past-events.splide").forEach((component) => {
				if (isMobile) {
					// Create splide on mobile
					setupSplide(component);
				} else {
					// Destroy splide on desktop
					destroySplide(component);
				}
			});
		}

		// Initial setup
		handleModeChange();

		// Listen for resize events with debouncing
		window.addEventListener("resize", lenus.helperFunctions.debounce(handleModeChange, 250));
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
		const menu = document.querySelector(".nav_menu");
		const items = gsap.utils.toArray(".c-nav-item");
		const activeLink = document.querySelector(".nav-item_link.w--current");
		// create highlight element
		const highlight = document.createElement("div");
		highlight.classList.add("nav_menu-highlight");
		menu.prepend(highlight);

		if (!menu || !items.length || !highlight) return;

		let activeItem = activeLink ? activeLink.closest(".c-nav-item") : null;
		let itemClicked = false;
		let movementAnimation = null;
		let opacityAnimation = null;

		function resetActiveLink() {
			if (!activeLink) return;
			activeLink.classList.remove("w--current");
			activeLink.classList.add("is-current");
		}

		// Set up initial state
		if (activeItem) {
			const itemRect = activeItem.getBoundingClientRect();
			const menuRect = menu.getBoundingClientRect();

			gsap.set(highlight, {
				autoAlpha: 1,
				"--nav--menu-bg-w": `${itemRect.width}px`,
				"--nav--menu-bg-l": `${itemRect.left - menuRect.left}px`,
			});
			gsap.set(activeItem, { color: "var(--_theme---nav--link-active)" });
			resetActiveLink();
		} else {
			gsap.set(highlight, {
				autoAlpha: 0,
				"--nav--menu-bg-w": "0px",
				"--nav--menu-bg-l": "0px",
			});
		}

		// Separate functions for managing opacity and movement
		const setHighlightOpacity = (visible) => {
			if (opacityAnimation) {
				opacityAnimation.kill();
			}

			opacityAnimation = gsap.to(highlight, {
				autoAlpha: visible ? 1 : 0,
				duration: 0.3,
				ease: "power2.out",
				onComplete: () => {
					if (!visible) {
						gsap.set(highlight, {
							"--nav--menu-bg-w": "0px",
							"--nav--menu-bg-l": "0px",
						});
					}
				},
			});
		};

		const moveHighlight = (item) => {
			if (itemClicked) return;

			const itemRect = item.getBoundingClientRect();
			const menuRect = menu.getBoundingClientRect();
			const width = itemRect.width;
			const left = itemRect.left - menuRect.left;

			// Kill any existing movement animation
			if (movementAnimation) {
				movementAnimation.kill();
			}

			// If highlight is currently invisible, set position instantly before showing
			if (gsap.getProperty(highlight, "autoAlpha") < 0.5) {
				gsap.set(highlight, {
					"--nav--menu-bg-w": `${width}px`,
					"--nav--menu-bg-l": `${left}px`,
				});
				setHighlightOpacity(true);
			} else {
				// Otherwise, animate to the new position
				movementAnimation = gsap.to(highlight, {
					"--nav--menu-bg-w": `${width}px`,
					"--nav--menu-bg-l": `${left}px`,
					duration: 0.3,
					ease: "power2.out",
				});
			}

			// Always update text colors
			gsap.to(items, {
				color: "var(--_theme---nav--link-inactive)",
				duration: 0.2,
				ease: "power3.out",
			});

			gsap.to(item, {
				color: "var(--_theme---nav--link-active)",
				duration: 0.2,
				ease: "power3.out",
			});
		};

		// Hover handlers
		items.forEach((item) => {
			item.addEventListener("mouseenter", () => moveHighlight(item));
		});

		// Reset to active item when leaving menu
		menu.addEventListener("mouseleave", () => {
			if (activeItem) {
				moveHighlight(activeItem);
			} else {
				setHighlightOpacity(false);
				gsap.to(items, {
					color: "var(--_theme---nav--link-inactive)",
					duration: 0.2,
					ease: "power3.out",
				});
			}
		});

		// Set click flag
		items.forEach((item) => {
			item.addEventListener("click", () => {
				itemClicked = true;
			});
		});

		// Handle resize
		window.addEventListener(
			"resize",
			lenus.helperFunctions.debounce(() => {
				itemClicked = false; // Reset click state on resize
				if (activeItem) {
					// Skip animation on resize
					const itemRect = activeItem.getBoundingClientRect();
					const menuRect = menu.getBoundingClientRect();

					gsap.set(highlight, {
						autoAlpha: 1,
						"--nav--menu-bg-w": `${itemRect.width}px`,
						"--nav--menu-bg-l": `${itemRect.left - menuRect.left}px`,
					});
					gsap.set(activeItem, { color: "var(--_theme---nav--link-active)" });
					gsap.set(
						items.filter((item) => item !== activeItem),
						{
							color: "var(--_theme---nav--link-inactive)",
						}
					);
				} else {
					gsap.set(highlight, {
						autoAlpha: 0,
						"--nav--menu-bg-w": "0px",
						"--nav--menu-bg-l": "0px",
					});
					gsap.set(items, { color: "var(--_theme---nav--link-inactive)" });
				}
			}, 200)
		);
	}

	function navOpen() {
		const nav = document.querySelector(".nav");
		const navBtn = document.querySelector(".nav_expand-btn.is-menu");
		const navBtnMbl = document.querySelector(".nav_expand-btn.is-mbl");
		const megaNav = document.querySelector(".nav-mega");
		const navLayout = document.querySelector(".nav_mega-layout");

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
		}

		function setUpDesktopTimeline() {
			let tl = gsap.timeline({ paused: true });

			tl.set(megaNav, { display: "block", autoAlpha: 1 }, 0);
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
			tl.set(megaNavBg, { backgroundColor: bgColor }, "flipDone");
			return tl;
		}
		function setUpMobileTimeline() {
			let tl = gsap.timeline({ paused: true });
			tl.set(megaNav, { display: "block", autoAlpha: 1 }, 0);
			tl.to(
				megaNavBg,
				{
					autoAlpha: 1,
					backgroundColor: bgColor,
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
					if (desktopTl) desktopTl.reverse();
				} else {
					if (desktopTl) desktopTl.play();
				}
				navOpen = !navOpen;
			});
		}

		if (navBtnMbl) {
			navBtnMbl.addEventListener("click", () => {
				if (currentMode !== "mobile") return;

				if (navOpen) {
					if (mobileTl) mobileTl.reverse();
				} else {
					if (mobileTl) mobileTl.play();
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

	function blogSearch() {
		// Only run on blog-type pages
		const nav = document.querySelector(".nav");
		if (!nav || !nav.classList.contains("is-blog")) return;

		// Find search components
		const searchComponents = document.querySelectorAll(".c-search");
		if (!searchComponents.length) return;

		searchComponents.forEach((component) => {
			const searchInput = component.querySelector(".search_input");
			const searchButton = component.querySelector(".search_icon-wrap");
			const searchForm = component.querySelector("form"); // Find parent form if it exists

			const timeline = gsap.timeline({ paused: true });

			if (!searchInput || !searchButton) return;

			// Prevent form submission
			if (searchForm) {
				searchForm.addEventListener("submit", (e) => {
					e.preventDefault(); // Prevent the default form submission
					e.stopPropagation();
					// searchButton.click(); // Trigger the search button click instead
				});
			}

			// Create animation timeline
			timeline.to(component, {
				width: "var(--search--full-w)",
				duration: 0.5,
				ease: "power2.out",
			});

			// Add hover events
			component.addEventListener("mouseenter", () => {
				timeline.play();
			});

			component.addEventListener("mouseleave", () => {
				// Only reverse if input is empty
				if (!searchInput.value.trim()) {
					timeline.reverse();
				}
			});

			// Function to add click handler to clear buttons
			const addClearButtonHandler = (clearButton) => {
				if (!clearButton || clearButton.hasAttribute("data-search-clear-handled")) return;

				clearButton.setAttribute("data-search-clear-handled", "true");
				clearButton.addEventListener("click", () => {
					searchInput.value = "";
					timeline.reverse();
				});
			};

			// Function to find and click clear button
			const triggerClearButton = () => {
				const clearButton = document.querySelector("[fs-list-element=clear]");
				if (clearButton) {
					clearButton.click();
				}
			};

			// Listen for input changes to detect when the search is cleared
			searchInput.addEventListener("input", (e) => {
				if (!e.target.value.trim()) {
					triggerClearButton();
					timeline.reverse();
				}
			});

			// Add clear functionality when user presses escape key
			searchInput.addEventListener("keydown", (e) => {
				if (e.key === "Escape") {
					searchInput.value = "";
					triggerClearButton();
					timeline.reverse();
				} else if (e.key === "Enter") {
					searchButton.click();
				}
			});

			// Add click handler for search button
			searchButton.addEventListener("click", () => {
				const searchTerm = encodeURIComponent(searchInput.value.trim());
				if (!searchTerm) return;

				const isOnBlogPage =
					window.location.pathname === "/blog" || window.location.pathname === "/blog/";

				if (isOnBlogPage) {
					// We're on the blog page, so find and update the Finsweet filter input
					const blogListSearch = document.querySelector(".blog-list_search > input");
					if (blogListSearch) {
						blogListSearch.value = searchInput.value;

						// Trigger input event to activate Finsweet filtering
						const inputEvent = new Event("input", { bubbles: true });
						blogListSearch.dispatchEvent(inputEvent);

						// Optionally focus the blog list search input
						// blogListSearch.focus();
					}
				} else {
					// Navigate to blog page with search parameter
					window.location.href = `/blog?search=${searchTerm}`;
				}
			});

			// Check for existing clear buttons and add handlers to them
			document.querySelectorAll("[fs-list-element=clear]").forEach(addClearButtonHandler);

			// Set up a mutation observer to watch for clear buttons being added to the DOM
			const observerConfig = { childList: true, subtree: true };
			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.type === "childList" && mutation.addedNodes.length) {
						mutation.addedNodes.forEach((node) => {
							// Check if the node itself is a clear button
							if (
								node.nodeType === 1 &&
								node.getAttribute &&
								node.getAttribute("fs-list-element") === "clear"
							) {
								addClearButtonHandler(node);
							}

							// Check if the node contains clear buttons
							if (node.nodeType === 1 && node.querySelectorAll) {
								node.querySelectorAll("[fs-list-element=clear]").forEach(addClearButtonHandler);
							}
						});
					}
				});
			});

			// Start observing the document body for changes
			observer.observe(document.body, observerConfig);

			// Add enter key support for search input
			searchInput.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					searchButton.click();
				}
			});

			// Check URL for search parameter on page load
			if (window.location.pathname === "/blog" || window.location.pathname === "/blog/") {
				const urlParams = new URLSearchParams(window.location.search);
				const searchParam = urlParams.get("*_contain");

				if (searchParam) {
					// Set the search input value
					searchInput.value = searchParam;

					// Keep the search component expanded
					timeline.play();

					// Also update the Finsweet filter input
					const blogListSearch = document.querySelector(".blog-list_search > input");
					if (blogListSearch) {
						blogListSearch.value = searchParam;

						// Trigger input event to activate Finsweet filtering
						const inputEvent = new Event("input", { bubbles: true });
						blogListSearch.dispatchEvent(inputEvent);
					}
				}
			}

			// on resize to mobile (with a debounce), clear all
			window.addEventListener(
				"resize",
				lenus.helperFunctions.debounce(() => {
					if (window.innerWidth < 768) {
						searchInput.value = "";
						triggerClearButton();
						timeline.reverse();
					}
				})
			);
		});
	}

	function pricingOptions() {
		// add splide carousel with progress for .pricing-options, with carousel destroyed on mobile

		document.querySelectorAll(".pricing-options.splide").forEach((component) => {
			var splideInstance = new Splide(component, {
				type: "slide",
				autoWidth: true,
				arrows: true,
				pagination: false,
				gap: "0",
				autoplay: false,
				trimSpace: "move",
				snap: false,
				drag: "free",
				focus: "left",
			});
			splideInstance.mount();

			// destroy carousel on mobile
			const mediaQuery = window.matchMedia("(max-width: 768px)");
			const destroyCarousel = () => {
				if (mediaQuery.matches) {
					splideInstance.destroy();
				} else {
					splideInstance.mount();
				}
			};
			mediaQuery.addEventListener("change", destroyCarousel);
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

	/* helper functions */

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
		const slideLength = splideSlides.getLength((excludeClones = true));

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
			video.controls = false;
		}
	};

	lenus.helperFunctions.resetAllCards = function (cards, exclusion = null) {
		cards.forEach((c) => {
			if (c !== exclusion) {
				lenus.helperFunctions.resetCard(c);
			}
		});
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

	parallax();
	loadVideos();
	gradTest1();
	logoSwap();
	videoCarousel();
	ctaImage();
	randomTestimonial();
	accordion();
	cardTrain();
	animateTitles();
	tabbedHero();
	wideCarousel();
	bentoHero();
	locations();
	miniCarousel();
	mapbox();
	cardGrid();
	testimCardVideos();
	scatterHero();
	pastEvents();
	customSubmitButtons();
	hiddenFormFields();
	rangeSlider();
	featBlogCard();
	jobScroll();
	navHover();
	toggleSlider();
	navOpen();
	blogSearch();
	pricingOptions();
	pricingFeatures();
}
