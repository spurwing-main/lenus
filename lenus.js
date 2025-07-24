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
		autoWidth: false,
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

			// simple debounce utility
			function debounce(fn, delay = 200) {
				let id;
				return (...args) => {
					clearTimeout(id);
					id = setTimeout(() => fn.apply(this, args), delay);
				};
			}

			const onResize = debounce(() => {
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

	function loadVideos_intersectionObs() {
		const videos = document.querySelectorAll("video");
		const mediaQuery = window.matchMedia("(max-width: 768px)");
		let isMobile = () => mediaQuery.matches;
		const PLAY_THRESHOLD = 0.5;

		// Helper: apply src/type/codecs based on mode, but only once per load
		function updateSources(video, mode) {
			if (video.dataset.videoLoaded) return; // ← skip if already done

			video.querySelectorAll("source").forEach((srcEl) => {
				const { srcMobile, srcDesktop, typeMobile, typeDesktop, codecsMobile, codecsDesktop } =
					srcEl.dataset;

				const url = mode === "mobile" ? srcMobile || srcDesktop : srcDesktop;
				const mime = mode === "mobile" ? typeMobile || typeDesktop : typeDesktop;
				const codecs = mode === "mobile" ? codecsMobile || codecsDesktop : codecsDesktop;

				if (!url) return;
				srcEl.src = url;

				let typeAttr = mime || "";
				if (codecs) typeAttr += `; codecs="${codecs}"`;
				if (typeAttr) srcEl.setAttribute("type", typeAttr);
			});

			video.load();
			video.dataset.videoLoaded = "true"; // ← mark it loaded
		}

		// PRELOAD when within ±1 viewport
		const getMargin = () => `${window.innerHeight}px 0px ${window.innerHeight}px 0px`;
		const preloadObs = new IntersectionObserver(
			(entries, obs) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) return;
					updateSources(entry.target, isMobile() ? "mobile" : "desktop");
					obs.unobserve(entry.target); // ← only preload once
				});
			},
			{
				rootMargin: getMargin(),
				threshold: 0,
			}
		);

		// PLAY/PAUSE at 50%
		const playObs = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					entry.intersectionRatio >= PLAY_THRESHOLD ? entry.target.play() : entry.target.pause();
					console.log(
						`Video ${entry.target.id} is ${
							entry.intersectionRatio >= PLAY_THRESHOLD ? "playing" : "paused"
						}`
					);
				});
			},
			{
				threshold: PLAY_THRESHOLD,
			}
		);

		videos.forEach((video) => {
			preloadObs.observe(video);
			playObs.observe(video);
		});

		// On window-resize, update the preload margin
		window.addEventListener("resize", () => {
			preloadObs.rootMargin = getMargin();
		});

		// On mode‐flip: clear all loaded flags and re-observe so updateSources can run again
		mediaQuery.addEventListener("change", (e) => {
			const newMode = e.matches ? "mobile" : "desktop";
			videos.forEach((video) => {
				video.removeAttribute("data-video-loaded"); // ← clear the flag
				preloadObs.observe(video); // ← re-arm preload
			});
		});
	}

	function loadVideos() {
		// Grab all videos on the page
		const videos = gsap.utils.toArray(".media video");
		const mediaQuery = window.matchMedia("(max-width: 768px)");
		const PLAY_ZONE_PADDING = "100%"; // = one full viewport

		// Helper to know current mode
		const isMobile = () => mediaQuery.matches;

		// console.log(`Initial mode: ${isMobile() ? "mobile" : "desktop"}`);

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
				start: `top bottom+=${PLAY_ZONE_PADDING}`, // 1 viewport below
				end: `bottom top-=${PLAY_ZONE_PADDING}`, // 1 viewport above
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
			// only play if autoplay is enabled
			if (video.autoplay === false) return;
			ScrollTrigger.create({
				trigger: video,
				start: "top 90%",
				end: "bottom 10%",
				onEnter: () => {
					// console.log("Playing", video);
					video.play();
				},
				onLeave: () => {
					// console.log("Pausing", video);
					video.pause();
				},
				onEnterBack: () => {
					// console.log("Playing back", video);
					video.play();
				},
				onLeaveBack: () => {
					// console.log("Pausing back", video);
					video.pause();
				},
				// markers: true
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
					start: `top bottom+=${PLAY_ZONE_PADDING}`,
					end: `bottom top-=${PLAY_ZONE_PADDING}`,
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

			function resetCard(card) {
				showVideo(card, videoSelector, imgSelector, false); // show image, hide video
				card.classList.remove("playing");
				const video = card.querySelector("video");
				if (video) {
					video.pause();
					video.currentTime = 0;
					video.controls = false;
				}
			}

			function resetAllCards() {
				cards.forEach((c) => {
					resetCard(c);
				});
			}

			function setUpProgressBar() {
				const progress = component.querySelector(".testim-carousel_progress");
				if (!progress) return;

				progress.innerHTML = ""; // clear existing progress lines
				const slideLength = Slides.getLength((excludeClones = true));

				// create progress lines based on the number of slides
				for (let i = 0; i < slideLength; i++) {
					const progressLine = document.createElement("div");
					progressLine.classList.add("testim-carousel_progress-line");
					progress.appendChild(progressLine);
				}

				const progressLines = progress.querySelectorAll(".testim-carousel_progress-line");

				splideInstance.on("active", function () {
					// on active slide change, update the progress bar
					const activeIndex = splideInstance.index;

					progressLines.forEach((line, index) => {
						if (index === activeIndex) {
							gsap.to(line, {
								color: "#DDDDD6",
								duration: 0.3,
								ease: "power2.out",
							});
						} else {
							gsap.to(line, {
								color: "#EFEFE8",
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
						resetAllCards();
					});
				});
			}

			setUpProgressBar();

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

					resetAllCards();
					// jump to slide
					splideInstance.go(idx);

					showVideo(card, videoSelector, imgSelector, true); // show video, hide image
					video.play();
					video.controls = true;
					card.classList.add("playing");
					autoScroll.pause();
				});

				// on video pause, resume autoScroll
				video.addEventListener("pause", () => {
					if (card.classList.contains("playing")) {
						resetCard(card);
						autoScroll.play();
					}
				});

				// on video end, reset card
				video.addEventListener("ended", () => {
					resetCard(card);
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
		/* TODO
		
		handle mobile - clear all flips and change to a slider 
		handle videos - play on hover, pause on leave
		*/

		function setUpFlip(component, cards, card) {
			const state = Flip.getState([cards], { props: "flex, opacity" });

			gsap.set(component, { minHeight: () => cards[0].offsetHeight + "px" });

			cards.forEach((c) => {
				c.classList.remove("is-active");
				gsap.set(c, {
					opacity: 0.75,
				});
			});
			card.classList.add("is-active");
			gsap.set(card, {
				opacity: 1,
			});

			Flip.from(state, {
				absolute: true,
				nested: true,
				duration: 0.6,
				custom: { opacity: { duration: 0.3 } }, // custom duration for opacity change
				ease: "power2.inOut",
				toggleClass: "is-changing",
				onComplete: () => gsap.set(component, { minHeight: "auto" }),
			});
		}

		document.querySelectorAll(".c-card-train").forEach((component) => {
			const cards = component.querySelectorAll(".card");
			const bgs = gsap.utils.toArray(".card_bg", component);

			cards.forEach((card) => {
				card.addEventListener("mouseenter", () => {
					// if card already active, do nothing
					if (card.classList.contains("is-active")) return;
					// set up flip animation
					setUpFlip(component, cards, card);

					// play video
					const video = card.querySelector("video");
					if (video) {
						// show video, hide image
						showVideo(card, videoSelector, imgSelector, true);
						video.play();
					}
					card.classList.add("playing");
					// hide all other videos
					cards.forEach((otherCard) => {
						if (otherCard !== card) {
							const otherVideo = otherCard.querySelector("video");
							if (otherVideo) {
								otherVideo.pause();
								otherVideo.currentTime = 0;
							}
							showVideo(otherCard, videoSelector, imgSelector, false); // show image, hide video
						}
					});
				});
			});

			if (cards.length > 0) {
				// set first card as active
				const firstCard = cards[0];
				firstCard.classList.add("is-active");
				gsap.set(firstCard, {
					opacity: 1,
				});
				// play video
				const video = firstCard.querySelector("video");
				if (video) {
					// show video, hide image
					showVideo(firstCard, videoSelector, imgSelector, true);
					video.play();
				}

				// set all images to width of an expanded card to avoid img jumps
				gsap.set(bgs, {
					width: () => firstCard.offsetWidth + "px",
				});
			}
		});
	}

	/* helper functions */

	/* for a card with a video and an image, show the video and hide the image or vice versa */
	function showVideo(card, videoSelector = "video", imgSelector = "img", bool = true) {
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
	}

	parallax();
	loadVideos();
	gradTest1();
	logoSwap();
	videoCarousel();
	ctaImage();
	randomTestimonial();
	accordion();
	cardTrain();
}
