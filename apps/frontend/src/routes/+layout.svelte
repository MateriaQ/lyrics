<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<title>MateriaQ Lyrics — Synchronized Lyrics for Spicetify</title>
	<meta
		name="description"
		content="Synchronized, customizable lyrics experience for Spotify via Spicetify. Modern aesthetics, privacy-first, zero tracking."
	/>
	<meta name="author" content="MateriaQ" />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href="https://lyrics.materiaq.org/" />

	<!-- OpenGraph -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="MateriaQ Lyrics" />
	<meta property="og:title" content="MateriaQ Lyrics — Synchronized Lyrics for Spicetify" />
	<meta
		property="og:description"
		content="Synchronized, customizable lyrics experience for Spotify via Spicetify. Privacy-first, open-source software."
	/>
	<meta property="og:url" content="https://lyrics.materiaq.org/" />
	<meta property="og:image" content="https://telemetry.materiaq.org/favicon.svg" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="MateriaQ Lyrics" />
	<meta
		name="twitter:description"
		content="Synchronized lyrics experience for Spotify via Spicetify."
	/>
	<meta name="twitter:image" content="https://telemetry.materiaq.org/favicon.svg" />

	<link rel="icon" type="image/svg+xml" href={favicon} />
	<link rel="apple-touch-icon" href={favicon} />
</svelte:head>

{@render children()}