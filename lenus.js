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
		/*
    - loop through all c-logo-swap components on page, then within each component:
    - get list element to hold logos .logo-swap_list
    - get all logos to show .logo-swap_logo
    - get the number of logos to show at the current breakpoint, this will be a CSS variable --logo-swap--count
    - get a random selection of logos from logo array and shuffle them
    - add logos to the list element in a hidden state
    - after a set time interval, fade out each current logo and fade in the new logo with a stagger across the list
    - ensure that the new logo is different from the current logo
    - ensure that the same logo is not shown more than once in the list at the same time
    - repeat the process indefinitely
    - update on resize

    



    */

		document.querySelectorAll(".c-logo-swap").forEach((component) => {
			const logoList = component.querySelector(".logo-swap_list");
			const logoSlots = Array.from(logoList.querySelectorAll(".logo-swap_slot"));
			const logoEls = Array.from(component.querySelectorAll(".logo-swap_logo"));
			let logoCount = getLogoCount(component);

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

			let currentLogos = [];

			// function getRandomLogos() {
			// 	const shuffledLogos = logos.sort(() => 0.5 - Math.random());
			// 	return shuffledLogos.slice(0, logoCount);
			// }

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
				shuffleArray(logosArray);

				// get the first `logoCount` logos from the shuffled array that are not currently visible
				const newLogos = logosArray.filter((logo) => !logo.visibleNow).slice(0, logoCount);

				// reset the visibility of the logos
				logosArray.forEach((logo) => {
					logo.visibleNow = false;
				});

				// mark the new logos as visible
				newLogos.forEach((logo) => {
					logo.visibleNow = true;
				});

				if (newLogos.length < logoCount) {
					// If not enough unique logos are available, add some more from logosArray
					const additionalLogos = logosArray
						.filter((logo) => !newLogos.includes(logo))
						.slice(0, logoCount - newLogos.length);
					newLogos.push(...additionalLogos);
					console.log("Not enough unique logos, adding more from the array.");
				}

				return newLogos.map((logo) => logo.el);
			}

			function updateLogos() {
				const newLogos = getNewLogos();
				if (newLogos.length === 0) {
					console.warn("No logos available to display.");
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
						gsap.set(clonedLogo, { autoAlpha: 0 }); // start hidden
						slot.appendChild(clonedLogo);
					}
				});
			}

			function animateLogos() {}

			function resizeHandler() {
				logoCount = getLogoCount(component);
				updateLogos();
			}

			window.addEventListener("resize", resizeHandler);
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
		const videos = gsap.utils.toArray("video");
		const mediaQuery = window.matchMedia("(max-width: 768px)");
		const PLAY_ZONE_PADDING = "100%"; // = one full viewport

		// Helper to know current mode
		const isMobile = () => mediaQuery.matches;

		console.log(`Initial mode: ${isMobile() ? "mobile" : "desktop"}`);

		// update sources once per mode
		function updateSources(video, mode) {
			if (video.dataset.videoLoaded) return; // skip if already done
			console.log(`Loading video sources for`, video, `mode=${mode}`);

			video.querySelectorAll("source").forEach((srcEl) => {
				const { srcMobile, srcDesktop, typeMobile, typeDesktop, codecsMobile, codecsDesktop } =
					srcEl.dataset;

				// pick URL + MIME + codecs
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
			ScrollTrigger.create({
				trigger: video,
				start: "top 90%",
				end: "bottom 10%",
				onEnter: () => {
					console.log("Playing", video);
					video.play();
				},
				onLeave: () => {
					console.log("Pausing", video);
					video.pause();
				},
				onEnterBack: () => {
					console.log("Playing back", video);
					video.play();
				},
				onLeaveBack: () => {
					console.log("Pausing back", video);
					video.pause();
				},
				// markers: true
			});
		});

		// mode change
		mediaQuery.addEventListener("change", () => {
			const newMode = isMobile() ? "mobile" : "desktop";
			console.log(`Mode changed to: ${newMode}`);

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

	parallax();
	loadVideos();
}
