<div align="center">

  <h1>Materia<span style="color: #d0bcfe;">Q</span> Greek Romanizer</h1>

  <p><strong>TypeScript library for transliterating Greek to Latin</strong></p>

  <p>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-66558E?labelColor=332F38" alt="License: AGPL-3.0"></a>
    <a href="./package.json"><img src="https://img.shields.io/badge/Package-@romanizer%2Fgreek-D0BCFE?labelColor=332F38" alt="@romanizer/greek"></a>
  </p>
</div>

---

### ✦ Overview

Transliterates Greek text with a configurable [`Schema`](./src/schema.ts), defaulting to SBL Academic.

### ✦ Usage

```typescript
import { romanizeGreek } from "@romanizer/greek";

romanizeGreek("λόγος");
```

### ✦ Acknowledgements

Fork of [charlesLoder/greek-transliteration](https://github.com/charlesLoder/greek-transliteration).
