---
name: Orval and Zod integer compatibility
description: How to avoid generated z.int calls when the workspace uses Zod 3.
---

Express integer-valued API fields as OpenAPI `type: number` with `format: int32` in this workspace, rather than `type: integer`.

**Why:** Orval v8 generates `z.int()` for `type: integer`, but the installed Zod 3 runtime does not expose that API, causing generated-schema typechecking to fail.

**How to apply:** Use the compatible number/int32 representation for IDs, counts, and other integer-valued response fields until the workspace Zod/Orval combination changes.