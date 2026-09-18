<script lang="ts">
	import { onMount } from "svelte";

	let isDark = $state(false);

	onMount(() => {
		isDark = document.documentElement.classList.contains("dark");

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleMediaChange = (e: MediaQueryListEvent) => {
			if (!localStorage.getItem("materiaq_theme_mode")) {
				isDark = e.matches;
				document.documentElement.classList.toggle("dark", e.matches);
				document.documentElement.classList.toggle("light", !e.matches);
			}
		};

		mediaQuery.addEventListener("change", handleMediaChange);
		return () =>
			mediaQuery.removeEventListener("change", handleMediaChange);
	});

	function toggleTheme(event: MouseEvent) {
		const nextDark = !isDark;
		const target = event.currentTarget as HTMLElement | null;

		if (target) {
			const rect = target.getBoundingClientRect();
			const x = `${((event.clientX || rect.left + rect.width / 2) / window.innerWidth) * 100}%`;
			const y = `${((event.clientY || rect.top + rect.height / 2) / window.innerHeight) * 100}%`;
			document.documentElement.style.setProperty(
				"--theme-button-cord",
				`${x} ${y}`,
			);
		}

		const applyTheme = () => {
			isDark = nextDark;
			document.documentElement.classList.toggle("dark", nextDark);
			document.documentElement.classList.toggle("light", !nextDark);
			try {
				localStorage.setItem(
					"materiaq_theme_mode",
					nextDark ? "dark" : "light",
				);
			} catch (_) {}
		};

		if (
			typeof document !== "undefined" &&
			"startViewTransition" in document
		) {
			document.documentElement.style.viewTransitionName =
				"changing-theme";
			// svelte-ignore explicit_any
			(document as any)
				.startViewTransition(applyTheme)
				.finished.finally(() => {
					document.documentElement.style.viewTransitionName = "";
				});
		} else {
			applyTheme();
		}
	}
</script>

<main class="w-full max-w-215 flex flex-col gap-5 sm:gap-6 mx-auto">
	<!-- Header -->
	<header class="flex items-start justify-between gap-3">
		<a
			href="/"
			class="flex items-center gap-3 sm:gap-4 no-underline min-w-0 flex-1"
		>
			<div
				class="w-11 h-11 sm:w-13 sm:h-13 grid place-items-center shrink-0 rounded-xl sm:rounded-2xl shadow-xs"
				aria-hidden="true"
			>
				<!-- Light Mode Brand Icon -->
				<svg
					class="w-full h-full rounded-[inherit] block dark:hidden"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 32 32"
				>
					<defs>
						<linearGradient
							id="brand-light-a"
							x1="0%"
							x2="100%"
							y1="0%"
							y2="100%"
						>
							<stop offset="0%" stop-color="#d0bcfe" />
							<stop offset="100%" stop-color="#ffd9e2" />
						</linearGradient>
						<linearGradient
							id="brand-light-b"
							x1="0%"
							x2="100%"
							y1="0%"
							y2="100%"
						>
							<stop offset="0%" stop-color="#633b48" />
							<stop offset="100%" stop-color="#4d3d75" />
						</linearGradient>
					</defs>
					<rect
						width="32"
						height="32"
						fill="url(#brand-light-a)"
						rx="9"
					/>
					<path
						fill="url(#brand-light-b)"
						d="M401.724 366.846 231.793 654.262h78.532L431.45 444.836l31.945 49.486-93.618 161.128h77.646l121.57-209.822 124.23 209.031 74.984-.397-167.27-286.625h-62.115l-36.382 59.384-38.158-59.384z"
						transform="translate(-7 -7.5) scale(.046)"
					/>
				</svg>

				<!-- Dark Mode Brand Icon -->
				<svg
					class="w-full h-full rounded-[inherit] hidden dark:block"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 32 32"
				>
					<defs>
						<linearGradient
							id="brand-dark-a"
							x1="0%"
							x2="100%"
							y1="0%"
							y2="100%"
						>
							<stop offset="0%" stop-color="#4d3d75" />
							<stop offset="100%" stop-color="#633b48" />
						</linearGradient>
						<linearGradient
							id="brand-dark-b"
							x1="0%"
							x2="100%"
							y1="0%"
							y2="100%"
						>
							<stop offset="0%" stop-color="#fff" />
							<stop offset="100%" stop-color="#ffd8e4" />
						</linearGradient>
					</defs>
					<rect
						width="32"
						height="32"
						fill="url(#brand-dark-a)"
						rx="9"
					/>
					<path
						fill="url(#brand-dark-b)"
						d="M401.724 366.846 231.793 654.262h78.532L431.45 444.836l31.945 49.486-93.618 161.128h77.646l121.57-209.822 124.23 209.031 74.984-.397-167.27-286.625h-62.115l-36.382 59.384-38.158-59.384z"
						transform="translate(-7 -7.5) scale(.046)"
					/>
				</svg>
			</div>

			<div class="flex flex-col min-w-0">
				<h1
					class="flex items-center flex-wrap gap-2 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-on-surface leading-tight"
				>
					<span
						>Materia<span
							class="bg-linear-to-br from-primary to-tertiary bg-clip-text text-transparent"
							>Q</span
						></span
					>
					<span
						class="text-[0.52em] font-semibold tracking-wide px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant self-center"
					>
						Lyrics
					</span>
				</h1>
				<p class="text-xs sm:text-sm text-on-surface-variant">
					Synchronized lyrics for Spotify via Spicetify.
				</p>
			</div>
		</a>

		<div class="flex items-center gap-2 shrink-0 pt-0.5">
			<!-- Theme Toggle Button -->
			<button
				id="theme-toggle"
				class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border-none bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface grid place-items-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs"
				onclick={toggleTheme}
				title={isDark
					? "Switch to light theme"
					: "Switch to dark theme"}
				aria-label={isDark
					? "Switch to light theme"
					: "Switch to dark theme"}
			>
				<svg
					class="w-5 h-5 stroke-current stroke-2 fill-none stroke-round"
					viewBox="0 0 24 24"
				>
					{#if isDark}
						<circle cx="12" cy="12" r="4" />
						<path d="M12 2v2" />
						<path d="M12 20v2" />
						<path d="m4.93 4.93 1.41 1.41" />
						<path d="m17.66 17.66 1.41 1.41" />
						<path d="M2 12h2" />
						<path d="M20 12h2" />
						<path d="m6.34 17.66-1.41 1.41" />
						<path d="m19.07 4.93-1.41 1.41" />
					{:else}
						<path
							d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
						/>
					{/if}
				</svg>
			</button>

			<!-- Source Code -->
			<a
				href="https://github.com/MateriaQ/lyrics"
				class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface grid place-items-center transition-all duration-150 active:scale-95 shadow-xs"
				title="Source Code"
				aria-label="Source Code"
			>
				<svg
					class="w-5 h-5 stroke-current stroke-2 fill-none stroke-round"
					viewBox="0 0 24 24"
				>
					<path
						d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
					/>
					<path d="M9 18c-4.51 2-5-2-7-2" />
				</svg>
			</a>
		</div>
	</header>

	<!-- Hero Section -->
	<section
		class="bg-surface-container-low rounded-3xl p-6 sm:p-10 flex flex-col gap-4 sm:gap-5 relative overflow-hidden shadow-xs before:absolute before:top-0 before:right-0 before:w-64 before:h-64 before:bg-[radial-gradient(circle_at_top_right,var(--primary-container),transparent_70%)] before:opacity-40 before:pointer-events-none"
	>
		<div
			class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface w-fit"
		>
			<span class="w-2 h-2 rounded-full bg-tertiary animate-pulse-glow"
			></span>
			<span>Under Construction</span>
		</div>

		<div>
			<h2
				class="text-2xl sm:text-3xl md:text-4xl font-bold text-on-surface leading-snug tracking-tight"
			>
				Something thoughtful is taking shape.
			</h2>
		</div>

		<p
			class="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-160"
		>
			We are preparing the official web companion and documentation for
			MateriaQ Lyrics. In the meantime, the Spicetify extension is fully
			operational, open source, and actively maintained.
		</p>
	</section>

	<div class="flex items-center justify-between mt-1">
		<span
			class="text-xs font-semibold tracking-wider uppercase text-on-surface-variant"
		>
			Ecosystem
		</span>
	</div>

	<!-- Ecosystem Cards -->
	<section class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
		<!-- Telemetry Card -->
		<a
			href="https://telemetry.materiaq.org"
			class="group bg-surface-container-low hover:bg-surface-container rounded-2xl p-5 flex flex-col justify-between gap-5 no-underline text-inherit transition-all duration-200 hover:-translate-y-0.5 shadow-xs hover:shadow-sm"
		>
			<div class="flex items-start justify-between gap-3">
				<div
					class="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container grid place-items-center shrink-0"
				>
					<svg
						class="w-5 h-5 stroke-current stroke-2 fill-none stroke-round"
						viewBox="0 0 24 24"
					>
						<circle cx="12" cy="12" r="10" />
						<path
							d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"
						/>
						<path d="M2 12h20" />
					</svg>
				</div>
				<svg
					class="w-5 h-5 stroke-current stroke-2 fill-none stroke-round text-on-surface-variant group-hover:text-primary transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0"
					viewBox="0 0 24 24"
				>
					<path d="M7 17L17 7" />
					<path d="M7 7h10v10" />
				</svg>
			</div>
			<div>
				<h3 class="text-base font-semibold text-on-surface mb-1">
					Telemetry Dashboard
				</h3>
				<p
					class="text-xs sm:text-sm text-on-surface-variant leading-relaxed"
				>
					Live anonymous metrics, concurrent user counts, and active
					presence statistics.
				</p>
			</div>
		</a>

		<!-- Organization Card -->
		<a
			href="https://materiaq.org"
			class="group bg-surface-container-low hover:bg-surface-container rounded-2xl p-5 flex flex-col justify-between gap-5 no-underline text-inherit transition-all duration-200 hover:-translate-y-0.5 shadow-xs hover:shadow-sm"
		>
			<div class="flex items-start justify-between gap-3">
				<div
					class="w-11 h-11 rounded-xl bg-secondary-container text-on-secondary-container grid place-items-center shrink-0"
				>
					<svg
						class="w-5 h-5 stroke-current stroke-2 fill-none stroke-round"
						viewBox="0 0 24 24"
					>
						<path
							d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
						/>
						<polyline points="9 22 9 12 15 12 15 22" />
					</svg>
				</div>
				<svg
					class="w-5 h-5 stroke-current stroke-2 fill-none stroke-round text-on-surface-variant group-hover:text-primary transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0"
					viewBox="0 0 24 24"
				>
					<path d="M7 17L17 7" />
					<path d="M7 7h10v10" />
				</svg>
			</div>
			<div>
				<h3 class="text-base font-semibold text-on-surface mb-1">
					MateriaQ Collective
				</h3>
				<p
					class="text-xs sm:text-sm text-on-surface-variant leading-relaxed"
				>
					Explore the collective, open-source projects, and
					privacy-first web utilities.
				</p>
			</div>
		</a>
	</section>

	<footer
		class="flex items-center justify-between p-3.5 sm:px-5 bg-surface-container-low rounded-2xl text-xs sm:text-sm text-on-surface-variant gap-3 flex-wrap mt-1 shadow-xs"
	>
		<div class="inline-flex items-center gap-2">
			<span class="text-sm font-bold tracking-tight text-on-surface">
				Materia<span
					class="bg-linear-to-br from-primary to-tertiary bg-clip-text text-transparent"
					>Q</span
				>
			</span>
			<span
				class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant"
			>
				Lyrics
			</span>
		</div>

		<nav
			class="inline-flex items-center gap-1 bg-surface-container p-1 rounded-full flex-wrap"
			aria-label="Footer Navigation"
		>
			<a
				href="https://telemetry.materiaq.org"
				class="px-3 py-1 rounded-full text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
			>
				Telemetry
			</a>
			<a
				href="https://materiaq.org"
				class="px-3 py-1 rounded-full text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
			>
				Web
			</a>
			<a
				href="https://sanooj.es/spicetify-discord"
				class="px-3 py-1 rounded-full text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
			>
				Discord
			</a>
		</nav>

		<div class="flex items-center gap-2">
			<a
				href="https://github.com/MateriaQ/lyrics"
				class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-medium transition-colors"
				title="Source Code"
			>
				<svg
					class="w-4 h-4 stroke-current stroke-2 fill-none stroke-round"
					viewBox="0 0 24 24"
				>
					<path
						d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
					/>
					<path d="M9 18c-4.51 2-5-2-7-2" />
				</svg>
				<span>Source</span>
			</a>
		</div>
	</footer>
</main>
