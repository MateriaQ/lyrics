<div align="center">

  <h1>Materia<span style="color: #d0bcfe;">Q</span> Arabic Romanizer</h1>

  <p><strong>TypeScript library for transliterating Arabic script to Latin</strong></p>

  <p>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-66558E?labelColor=332F38" alt="License: AGPL-3.0"></a>
    <a href="./package.json"><img src="https://img.shields.io/badge/Package-@romanizer%2Farabic-D0BCFE?labelColor=332F38" alt="@romanizer/arabic"></a>
  </p>
</div>

---

### ✦ Overview

Converts Arabic script (Arabic, Farsi, Urdu) to romanized Latin text. Handles diacritical marks, special characters and proper spacing after punctuation.

### ✦ Usage

```typescript
import { romanizeArabic } from "@romanizer/arabic";

romanizeArabic("مرحبا"); // "marḥaba"
romanizeArabic("الله"); // "Allāh"
```

### ✦ Acknowledgements

Based on work from:

- [Vyshantha/arabic-transliterate](https://github.com/Vyshantha/arabic-transliterate)
- [rejyoung/romanize-string](https://github.com/rejyoung/romanize-string)
