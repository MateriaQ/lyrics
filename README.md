<div align="center">
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="brand/icon-light.svg">
    <source media="(prefers-color-scheme: dark)" srcset="brand/icon.svg">
    <img alt="MateriaQ" src="brand/icon.svg" width="80" height="80">
  </picture>

  <h1>MateriaQ Lyrics</h1>

  <p><strong>Lyrics provider &amp; aggregator for materiaq.org</strong></p>

  <p>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-66558E?labelColor=332F38" alt="License: AGPL-3.0"></a>
    <a href="https://lyrics.materiaq.org"><img src="https://img.shields.io/badge/Service-Live-D0BCFE?labelColor=332F38" alt="Live Service"></a>
    <a href="https://status.materiaq.org/monitors/lyrics-api"><img src="https://status.materiaq.org/badge/lyrics-api/status?labelColor=332F38&color=D0BCFE" alt="Lyrics API status"></a>
    <a href="https://status.materiaq.org/monitors/lyrics-web"><img src="https://status.materiaq.org/badge/lyrics-web/status?labelColor=332F38&color=D0BCFE" alt="Lyrics Web status"></a>
  </p>
</div>

---

### ✦ Overview

This monorepo powers **[lyrics.materiaq.org](https://lyrics.materiaq.org)**, a lyrics provider and aggregator for materiaq.org. It pulls lyrics from multiple sources (Spicy Lyrics, AMLL, Cider, Spotify, Apple Music, Musixmatch) and normalizes them behind a single API.

| Package                            | Description                                   |
| ---------------------------------- | --------------------------------------------- |
| [`apps/backend`](./apps/backend)   | Elysia API — aggregation, romanization & auth |
| [`apps/frontend`](./apps/frontend) | SvelteKit web app (under construction)        |
| `packages/@romanizer/*`            | Romanization libraries                        |

### ✦ Status & Uptime

Live metrics and incident reporting are tracked via our monitor dashboards:

- [Lyrics API Monitor](https://status.materiaq.org/monitors/lyrics-api)
- [Lyrics Web Monitor](https://status.materiaq.org/monitors/lyrics-web)

### ✦ TODO

- [ ] Contributions — let users submit, edit and review lyrics.

### ✦ License

This project is licensed under AGPL-3.0. See [LICENSE](./LICENSE) for details.
