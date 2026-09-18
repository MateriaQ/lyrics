<div align="center">

  <h1>Materia<span style="color: #d0bcfe;">Q</span> Gothic Romanizer</h1>

  <p><strong>TypeScript library for transliterating Gothic to Latin</strong></p>

  <p>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-66558E?labelColor=332F38" alt="License: AGPL-3.0"></a>
    <a href="./package.json"><img src="https://img.shields.io/badge/Package-@romanizer%2Fgothic-D0BCFE?labelColor=332F38" alt="@romanizer/gothic"></a>
  </p>
</div>

---

### ✦ Overview

Transliterates the Gothic alphabet to Latin, supporting digraphs, dropping the koppa and sampi numerals, and preserving spaces, punctuation and non-Gothic characters.

### ✦ Usage

```typescript
import { romanizeGothic } from "@romanizer/gothic";

romanizeGothic("𐌰𐍄𐍄𐌰 𐌿𐌽𐍃𐌰𐍂"); // "atta unsar"
```
