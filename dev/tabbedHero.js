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
				gsap.set(panel, { autoAlpha: active ? 1 : 0 });
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
		function calcBounds() {
			let tabsWidth = 0;
			tabs.forEach((tab) => {
				tabsWidth += tab.offsetWidth;
			});
			const viewportWidth = Math.ceil(control.clientWidth);

			// Account for flexbox centering (justify-content: center)
			// If centered, the list may have a left offset
			let centerOffset = 0;
			if (tabs.length > 0) {
				const firstTabRect = tabs[0].getBoundingClientRect();
				const listRect = list.getBoundingClientRect();
				console.log("First tab rect:", firstTabRect, "List rect:", listRect);
				centerOffset = firstTabRect.left - listRect.left;
			}

			// maxX: leftmost tab is fully visible at left edge
			// minX: rightmost tab is fully visible at right edge
			const maxX = centerOffset;
			const minX = Math.min(centerOffset, viewportWidth - tabsWidth + centerOffset);
			console.log("Calculated bounds (center-aware):", { minX, maxX });
			return { minX, maxX };
		}

		// Ensure a tab is inside the visible viewport of the control
		function scrollTabIntoView(tab) {
			if (!draggable) return;
			const { minX, maxX } = calcBounds();
			const currentX = gsap.getProperty(list, "x") || 0;

			const tabRect = tab.getBoundingClientRect();
			const wrapRect = control.getBoundingClientRect();

			let targetX = currentX;

			// If the tab's left edge is hidden, shift right; if right edge is hidden, shift left
			if (tabRect.left < wrapRect.left) {
				targetX += wrapRect.left - tabRect.left;
			} else if (tabRect.right > wrapRect.right) {
				targetX -= tabRect.right - wrapRect.right;
			}

			// Clamp within bounds and animate
			targetX = gsap.utils.clamp(minX, maxX, targetX);
			gsap.to(list, { x: targetX, duration: 0.3, ease: "power2.out" });
		}

		function updateMode() {
			const overflowing = list.scrollWidth > control.clientWidth;

			if (overflowing && !draggable) {
				gsap.set(list, { x: 0, cursor: "grab" });

				const bounds = calcBounds();
				draggable = Draggable.create(list, {
					type: "x",
					bounds, // <-- correct dynamic bounds
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

			// If we have a draggable already, refresh its bounds (e.g., on resize)
			if (draggable) {
				const bounds = calcBounds();
				draggable.applyBounds(bounds);
				// snap current x into the new bounds so it never gets stuck out of range
				const currentX = gsap.getProperty(list, "x") || 0;
				const clamped = gsap.utils.clamp(bounds.minX, bounds.maxX, currentX);
				if (clamped !== currentX) gsap.set(list, { x: clamped });
			}
		}

		const debouncedUpdate = lenus.helperFunctions.debounce(updateMode, DEBOUNCE_DELAY);
		window.addEventListener("resize", debouncedUpdate);

		// Initial activation and mode setup
		selectTab(0);
		updateMode();
	}
}
