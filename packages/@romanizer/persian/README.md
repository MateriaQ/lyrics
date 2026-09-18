<div align="center">

  <h1>Materia<span style="color: #d0bcfe;">Q</span> Persian Romanizer</h1>

  <p><strong>TypeScript library for transliterating Persian to Latin</strong></p>

  <p>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-66558E?labelColor=332F38" alt="License: AGPL-3.0"></a>
    <a href="./package.json"><img src="https://img.shields.io/badge/Package-@romanizer%2Fpersian-D0BCFE?labelColor=332F38" alt="@romanizer/persian"></a>
  </p>
</div>

---

### ✦ Overview

Transliterates Persian text to Latin characters, handling Persian diacritics (fatha, kasra, damma, sukun) while preserving spaces, punctuation and non-Persian characters.

### ✦ Usage

```typescript
import { romanizePersian } from "@romanizer/persian";

romanizePersian("سلام"); // "salām"
romanizePersian("ایران"); // "Irān"
```
