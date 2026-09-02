---
name: medium-text
description: "Build streaming text UI on the web. Use when adding chat, generated answers, live transcripts, or any text that arrives progressively and renders as markdown."
---

# Text as a medium

## What this medium does to the person
Text makes an app quotable, searchable, and accountable; people trust what they can copy. Streaming adds presence: the app appears to think alongside the reader rather than hand down a finished page.

## When to reach for this medium
Text is right when people will read, quote, search, or copy the result. It is the default medium; choose another only when text is a worse fit.

## Core browser APIs
- Server-Sent Events or `fetch()` with a `ReadableStream` for token delivery
- `requestAnimationFrame` or a short `setInterval` to batch DOM writes (never one write per token)
- `aria-live="polite"` on the answer container, announced at sentence boundaries

## UX rules that always apply
- First token on screen under 500 ms, or show a skeleton that says what is happening.
- Show a caret while streaming; remove it the moment the stream ends.
- A visible Stop control while streaming, and a Copy control that copies source markdown.
- Only auto-scroll when the reader is already at the bottom.

## Reference implementation
`reference/StreamingText.ts` — incremental markdown renderer that tolerates open fences and unclosed emphasis, a token/latency meter, and a stop handle. Framework-free; `mount(root)` builds the UI, `unmount()` stops the stream.

## Gotchas
- Incremental markdown must be forgiving; use a parser that can render partial input.
- Keep layout stable: reserve width for the answer column so it does not reflow as text grows.
- Do not trust client token counts for billing.
