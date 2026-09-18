<div align="center">

  <h1>Materia<span style="color: #d0bcfe;">Q</span> Armenian Romanizer</h1>

  <p><strong>TypeScript library for transliterating Armenian to Latin</strong></p>

  <p>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-66558E?labelColor=332F38" alt="License: AGPL-3.0"></a>
    <a href="./package.json"><img src="https://img.shields.io/badge/Package-@romanizer%2Farmenian-D0BCFE?labelColor=332F38" alt="@romanizer/armenian"></a>
  </p>
</div>

---

### ✦ Overview

Transliterates Armenian words and text to Latin characters. Preserves original casing (lowercase, uppercase, title case), expands Armenian ligatures (ﬓ, ﬔ, ﬕ, ﬖ, ﬗ), converts Armenian punctuation to English equivalents and processes mixed text.

### ✦ Usage

```typescript
import { romanizeArmenian } from "@romanizer/armenian";

romanizeArmenian("Հայաստան"); // "Hayastan"
romanizeArmenian("ողջույն, աշխարհ"); // "vołčyun, ašxarh"
```

### ✦ Acknowledgements

Based on [lobotomoe/armenian-transliteration](https://github.com/lobotomoe/armenian-transliteration).
