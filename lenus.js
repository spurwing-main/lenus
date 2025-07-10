function main() {
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
}
