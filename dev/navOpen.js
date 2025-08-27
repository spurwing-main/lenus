function navOpen() {
	const nav = document.querySelector(".nav");
	const navBtn = document.querySelector(".nav_expand-btn.is-menu");
	const navBtnMbl = document.querySelector(".nav_expand-btn.is-mbl");
	const megaNav = document.querySelector(".nav-mega");
	const navLayout = document.querySelector(".nav_mega-layout");
	const navBg = document.querySelector(".nav_bg"); // menu bg we animate on desktop
	const megaNavBg = document.querySelector(".nav-mega_bg"); // mega menu bg
	const bgColor = getComputedStyle(navBg).getPropertyValue("background-color");
	const finalRadius = getComputedStyle(megaNavBg).getPropertyValue("border-bottom-left-radius");
	const icon = navBtn.querySelector(".nav-plus");
	const iconMbl = navBtnMbl.querySelector(".nav-plus");

	const mediaQuery = window.matchMedia("(max-width: 767px)");
	let currentMode = mediaQuery.matches ? "mobile" : "desktop";
	let navOpen = false;

	let desktopTl, mobileTl;

	if (currentMode === "desktop") {
		desktopTl = setUpDesktopTimeline();
	} else {
		mobileTl = setUpMobileTimeline();
	}

	// Stagger menu items in three groups
	let staggerGroup1 = [
		nav.querySelector(".nav-mega_col:nth-child(1)"),
		nav.querySelector(".nav-mega_col:nth-child(3)"),
	];
	let staggerGroup2 = [
		nav.querySelector(".nav-mega_col:nth-child(2)"),
		nav.querySelector(".nav-mega_col:nth-child(4)"),
	];
	let staggerGroup3 = nav.querySelector(".nav-mega_feat");
	let stagger = 0.05;

	// Set initial states
	function resetAllStyles() {
		// Clear all inline styles first
		gsap.set([navBg, megaNavBg, megaNav, navLayout], { clearProps: "all" });
		gsap.set([icon, iconMbl], { rotation: 0 });
		gsap.set([staggerGroup1, staggerGroup2, staggerGroup3], { clearProps: "all" });

		// Then set initial state
		gsap.set(megaNav, { display: "block", autoAlpha: 0 });
		gsap.set([staggerGroup1, staggerGroup2, staggerGroup3], { autoAlpha: 0 });
	}

	resetAllStyles();

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
		tl.to(
			staggerGroup1,
			{
				autoAlpha: 1,
				duration: 0.5,
			},
			"flipDone"
		);
		tl.to(
			staggerGroup2,
			{
				autoAlpha: 1,
				duration: 0.5,
			},
			`flipDone+=${stagger}`
		);
		tl.to(
			staggerGroup3,
			{
				autoAlpha: 1,
				duration: 0.5,
			},
			`flipDone+=${stagger * 2}`
		);
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
		tl.to(
			staggerGroup1,
			{
				autoAlpha: 1,
				duration: 0.5,
			},
			0.1
		);
		tl.to(
			staggerGroup2,
			{
				autoAlpha: 1,
				duration: 0.5,
			},
			0.1 + stagger
		);
		tl.to(
			staggerGroup3,
			{
				autoAlpha: 1,
				duration: 0.5,
			},
			0.1 + stagger * 2
		);

		return tl;
	}

	// Click handlers
	navBtn.addEventListener("click", () => {
		if (currentMode !== "desktop") return;

		if (navOpen) {
			if (desktopTl) desktopTl.reverse();
		} else {
			if (desktopTl) desktopTl.play();
		}
		navOpen = !navOpen;
	});

	navBtnMbl.addEventListener("click", () => {
		if (currentMode !== "mobile") return;

		if (navOpen) {
			if (mobileTl) mobileTl.reverse();
		} else {
			if (mobileTl) mobileTl.play();
		}
		navOpen = !navOpen;
	});

	function resetDesktopTimeline() {
		if (desktopTl) {
			desktopTl.revert();
			desktopTl = null;
			gsap.clearProps(navBg);
		}
	}

	// Mode change handler
	function handleResize() {
		const newMode = mediaQuery.matches ? "mobile" : "desktop";

		// if new mode = current mode = desktop...
		// clear props on bg
		if (newMode === currentMode && newMode === "desktop") {
			console.log("clearinig bg props");
			gsap.clearProps(navBg);
		}

		if (newMode === currentMode) return;

		// If menu was open, close it in current mode before switching

		if (currentMode === "desktop") {
			if (desktopTl) desktopTl.revert();
			mobileTl = setUpMobileTimeline();
		} else {
			if (mobileTl) mobileTl.revert();
			desktopTl = setUpDesktopTimeline();
		}
		navOpen = false;

		// // Reset animations when switching modes
		// if (newMode === "desktop") {
		// 	mobileTl.progress(0).pause();
		// 	desktopTl = setUpDesktopTimeline();
		// } else {
		// 	desktopTl.progress(0).pause();
		// 	mobileTl = setUpMobileTimeline();
		// }

		// Reset to initial state with a complete cleanup of inline styles
		// resetAllStyles();

		// Reset background color explicitly to prevent transparency issues
		// if (newMode === "desktop") {
		// 	gsap.set(navBg, { backgroundColor: bgColor, autoAlpha: 1 });
		// } else {
		// 	gsap.set(megaNavBg, { backgroundColor: bgColor, autoAlpha: 0 });
		// }

		currentMode = newMode;
	}

	// Listen for resize events
	window.addEventListener("resize", lenus.helperFunctions.debounce(handleResize, 200));

	// Initialize
	handleResize();
}
