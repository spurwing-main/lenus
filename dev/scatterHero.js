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

		let tl = gsap.timeline();

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
				componentObj.outAnimationToRun = false;
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
			images: component.querySelectorAll(".scatter-img"),
			inAnimationCompleted: false,
			outAnimationToRun: false,
		};
		let currentScreenType = isMobile() ? "mobile" : "desktop";

		// Initial animation on page load

		componentObj.tl_out = animateOutTl(componentObj);
		componentObj.tl_in = animateInTl(componentObj);

		componentObj.tl_in.play();

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
				componentObj.tl_out.play();
			},
			onLeave: () => {},
			onEnterBack: () => {
				componentObj.tl_out.reverse();
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
