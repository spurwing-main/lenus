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
							filter: "blur(5px) grayscale()",
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
					filter: "blur(5px) grayscale()",
					duration: 0.5,
					stagger: 0.05,
					ease: "power2.inOut",
				}).to(
					"[data-logo-swap='incoming']",
					{
						autoAlpha: 1,
						scale: 1,
						filter: "blur(0px) grayscale()",
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
					// gsap.globalPause();
				} else {
					// gsap.globalResume();
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

	function videoCarousel() {
		const imgSelector = ".coach-card_bg img";
		const videoSelector = "video";
		// for each video carousel component .c-testim-carousel.splide
		document.querySelectorAll(".c-testim-carousel.splide").forEach((component) => {
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
						autoScroll: true,
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
			splideInstance.mount(window.splide.Extensions);
			let autoScroll = splideInstance.Components.AutoScroll;

			const { Slides } = splideInstance.Components;
			const cards = component.querySelectorAll(".coach-card");

			lenus.helperFunctions.setUpProgressBar(component, cards, splideInstance, Slides);

			Slides.get().forEach((slideObj) => {
				const slideEl = slideObj.slide; // the actual DOM node

				const card = slideObj.slide.querySelector(".coach-card");
				const playBtn = card.querySelector("btn[name='play']");
				if (!playBtn) return;
				const video = card.querySelector("video");
				if (!video) return;
				const img = card.querySelector(".coach-card_bg img");
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
			const img = component.querySelector(".cta_img");
			const pinned = component.querySelector(".cta_pinned");
			const endParent = component.querySelector(".cta_spacer");

			let ctx; // context

			const createTimeline = () => {
				ctx && ctx.revert();
				ctx = gsap.context(() => {
					// start with image at full size
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

					tl.add(Flip.fit(img, endParent, { duration: 0.5 }));
				});
			};
			createTimeline();

			window.addEventListener("resize", createTimeline);
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
		document.querySelectorAll(".c-accordion").forEach((container) => {
			const items = gsap.utils.toArray(".accordion-item", container);
			const images = gsap.utils.toArray(".accordion-img", container);

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
					borderBottomColor: "var(--_color---blue--base)",
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
							borderBottomColor: "var(--_color---glass-dark--medium)",
						},
						0
					);

				if (images.length > 1) {
					tl.from(image, { autoAlpha: 0 }, 0);
				}

				// start closed
				tl.reverse();
				item._tl = tl;

				// //set first image visible
				// if (index === 0 && image) {
				// 	gsap.set(image, {
				// 		autoAlpha: 1,
				// 	});
				// }

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
						destroySplide();
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

		function destroySplide() {
			if (splideInstance) {
				splideInstance.destroy();
				splideInstance = null;
			}
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

	function animateTitles() {
		gsap.utils.toArray(".c-title").forEach((title) => {
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
		const CSS_VARS = { width: "--tab-controls--w", left: "--tab-controls--l" };
		const CONTROL_ITEM = "tab-controls_item";
		const DEBOUNCE_DELAY = 200;

		document.querySelectorAll(".c-tabbed-hero").forEach(setupHero);

		function setupHero(component) {
			const control = component.querySelector(".c-tab-controls");
			const list = component.querySelector(".tab-controls_list");
			const panels = Array.from(component.querySelectorAll(".tabbed-hero_media-items .media"));
			if (!control || !list || panels.length === 0) return;

			let splide = null;

			// Build controls
			list.innerHTML = "";
			panels.forEach((panel, idx) => {
				const btn = document.createElement("button");
				btn.className = CONTROL_ITEM;
				btn.classList.add("splide__slide");
				btn.textContent = panel.dataset.title;
				btn.dataset.index = idx;
				btn.addEventListener("click", () => selectTab(idx));
				list.appendChild(btn);
			});

			const tabs = Array.from(list.children);
			let activeIndex = 0;

			function selectTab(i) {
				// Activate panels
				tabs.forEach((tab, idx) => tab.classList.toggle("is-active", idx === i));
				panels.forEach((panel, idx) => {
					const active = idx === i;
					panel.classList.toggle("is-active", active);
					gsap.set(panel, { autoAlpha: active ? 1 : 0 });
					if (active && panel.querySelector("video")) {
						const vid = panel.querySelector("video");
						vid.currentTime = vid.currentTime || 0;
						vid.play();
					}
				});
				moveHighlight(tabs[i]);
				if (splide) splide.go(i);
				activeIndex = i;
			}

			function moveHighlight(tab) {
				const left = tab.offsetLeft;
				const width = tab.offsetWidth;
				const listRect = list.getBoundingClientRect();
				const controlRect = control.getBoundingClientRect();
				// need to account for parent list element having a transform applied
				gsap.to(component, {
					[CSS_VARS.left]: `${left}px`,
					[CSS_VARS.width]: `${width}px`,
					duration: 0.3,
					ease: "power2.out",
				});
			}

			// Determine when to switch to carousel
			function updateMode() {
				const needsCarousel = list.scrollWidth > control.clientWidth;
				if (needsCarousel && !splide) {
					gsap.set(list, {
						justifyContent: "flex-start",
					});

					splide = new Splide(control, {
						type: "slide",
						// focus: "center",
						autoWidth: true,
						pagination: false,
						arrows: false,
						drag: true,
						autoplay: false,
						flick: 50,
					});
					splide.on("move", (newIndex) => selectTab(newIndex));
					splide.mount();
					// Ensure current active
					splide.go(activeIndex);
				} else if (!needsCarousel && splide) {
					splide.destroy();
					splide = null;
					// Reset scroll position
					gsap.set(list, { x: 0 });
				}
			}

			const debouncedUpdate = lenus.helperFunctions.debounce(updateMode, DEBOUNCE_DELAY);
			window.addEventListener("resize", debouncedUpdate);

			// Initial activation and mode setup
			selectTab(0);
			updateMode();
		}
	}

	function wideCarousel() {
		const splideSelector = ".c-wide-carousel";
		const trackSelector = ".wide-carousel_track";
		const listSelector = ".wide-carousel_list";
		const slideSelector = ".wide-card";
		document.querySelectorAll(".c-wide-carousel.splide").forEach((component) => {
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
			if (slides.length === 0) {
				return;
			}
			slides.forEach((slide) => {
				if (!slide.classList.contains("splide__slide")) {
					slide.classList.add("splide__slide");
				}
			});
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
						autoScroll: true,
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
			splideInstance.mount(window.splide.Extensions);
			let autoScroll = splideInstance.Components.AutoScroll;

			const { Slides } = splideInstance.Components;
			const cards = component.querySelectorAll(".coach-card");

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
							start: "top top",
							end: "+=100",
							scrub: 0.5,
							pin: true,
						},
					});

					tl.add(Flip.fit(bg, bgTarget, { duration: 0.5 }));
					tl.to(
						bg,
						{
							borderRadius: "20px",
							ease: "power4.out",
						},
						0
					);
				});
			}

			function initMobile() {
				teardownDsk();
				setupSplide(component);
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
							start: "top top",
							end: () => `+=400`,
							scrub: true,
							// pin: true,
							pinSpacing: true,
							markers: true,
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
			}

			function setupSplide() {
				splideInstance = new Splide(component, {
					// type: "loop",
					autoplay: false,

					// clones: 5,
					arrows: true,
					// trimSpace: "move",
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

			// // Handle mode switch
			// mediaQuery.addEventListener("change", (e) => {
			// 	const newMode = e.matches ? "mobile" : "desktop";
			// 	if (newMode === "desktop") {

			// 	}
			// 	// if (newMode === currentMode) return;
			// 	// currentMode = newMode;
			// 	// if (newMode === "mobile") initMobile();
			// 	// else initDesktop();
			// });

			// Initial setup
			if (currentMode === "mobile") initMobile();
			else initDesktop();

			const onResize = lenus.helperFunctions.debounce(() => {
				const newMode = mediaQuery.matches ? "mobile" : "desktop";

				// if (newMode !== currentMode) {
				// 	currentMode = newMode;
				if (newMode === "mobile") initMobile();
				else initDesktop();
			});

			window.addEventListener("resize", onResize);

			// let ctx = gsap.context(() => {
			// 	// // initial setup
			// 	// gsap.set(primaryBgImg, {
			// 	// 	width: "100%",
			// 	// 	height: "100%",
			// 	// });

			// 	// set up scroll trigger for the background image
			// 	gsap.to(bg, {
			// 		scrollTrigger: {
			// 			trigger: bgTarget,
			// 			start: "top top",
			// 			end: "+=200",
			// 			scrub: 1,
			// 			pin: false,
			// 		},
			// 		width: "80%",
			// 		height: "80%",
			// 		ease: "power2.out",
			// 	});

			// 	// set up scroll trigger for the title
			// 	gsap.to(title, {
			// 		scrollTrigger: {
			// 			trigger: component,
			// 			start: "top top",
			// 			end: "+=2000",
			// 			scrub: 1,
			// 		},
			// 		yPercent: -100,
			// 		ease: "power2.out",
			// 	});

			// 	// set up the bento cards carousel
			// 	const splideInstance = new Splide(component, {
			// 		type: "loop",
			// 		autoWidth: true,
			// 		arrows: true,
			// 		pagination: false,
			// 		gap: "1rem",
			// 		focus: "center",
			// 	});
			// 	splideInstance.mount();

			// 	lenus.helperFunctions.setUpProgressBar(
			// 		component,
			// 		cards,
			// 		splideInstance,
			// 		splideInstance.Components.Slides
			// 	);

			// 	splideInstance.on("active", (slide) => {
			// 		const card = slide.slide;
			// 		const cardImage = card.querySelector("img");
			// 		if (cardImage) {
			// 			image.src = cardImage.src; // change the image in the container to the active card's image
			// 		}
			// 	});
			// }, component);

			// window.addEventListener("resize", () => ctx.revert());
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
}
