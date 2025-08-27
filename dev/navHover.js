function navHover() {
	const menu = document.querySelector(".nav_menu");
	const items = gsap.utils.toArray(".c-nav-item");
	const activeLink = document.querySelector(".nav-item_link.w--current");
	const highlight = document.querySelector(".nav_menu-highlight");

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
