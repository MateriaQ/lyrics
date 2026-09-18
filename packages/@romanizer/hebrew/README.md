<div align="center">

  <h1>Materia<span style="color: #d0bcfe;">Q</span> Hebrew Romanizer</h1>

  <p><strong>TypeScript library for transliterating Hebrew to Latin</strong></p>

  <p>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-66558E?labelColor=332F38" alt="License: AGPL-3.0"></a>
    <a href="./package.json"><img src="https://img.shields.io/badge/Package-@romanizer%2Fhebrew-D0BCFE?labelColor=332F38" alt="@romanizer/hebrew"></a>
  </p>
</div>

---

### ✦ Overview

Transliterates Hebrew text to Latin characters with a configurable [`Schema`](./src/schema.ts) and optional syllable separation.

### ✦ Usage

```typescript
import { romanize } from "@romanizer/hebrew";

romanize("רַעַל"); // "raʿal"
```

### ✦ Acknowledgements

Based on [havarotjs](https://github.com/hebrew-transliteration/havarotjs).
