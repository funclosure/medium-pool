---
slug: text
order: 1
name: Text
hook: Streams, renders, never blocks
message: The app becomes quotable, and streaming makes it feel like it is thinking with you.
accent: { light: "#2B5FB3", dark: "#78A4EE" }
demo: reference/StreamingText.ts
examples:
  - name: mindsizer
    url: https://github.com/funclosure/mindsizer
    by: you
    note: Digests dense writing into an interactive deck. Text is the input and the output, with interactive slides in between.
  - name: weaving-shuttle
    url: https://github.com/funclosure/weaving-shuttle
    by: you
    note: "A two-axis reading surface: threads run horizontally as sequence, depth links run vertically as association."
  - name: streamdown
    url: https://github.com/vercel/streamdown
    by: oss
    note: A markdown renderer built for streaming. Tolerates unterminated blocks mid-stream, which is the hard part of this lane.
  - name: marked
    url: https://github.com/markedjs/marked
    by: oss
    note: Fast markdown compiler; the baseline most incremental renderers wrap.
---

## Why

Text is the cheapest medium to ship and the one people trust most, because they can skim it, search it and copy it. Almost every app needs it, and with language models it became a live medium: the answer arrives token by token, not as a page.

The hard part is no longer showing text, it is showing text that is still being written. Half-finished markdown, growing layout, a stop button that means something.

### Reach for it when

- the content is instructions, answers, or anything people will quote
- latency is visible and you can hide it by streaming
- accessibility and search matter more than atmosphere

## Gotchas

- Render markdown incrementally: an open code fence or an unclosed bold marker must not break layout mid-stream.
- Never let the scroll position jump under the reader. Only auto-scroll when they are already at the bottom.
- Count tokens client-side for the meter, but bill on the server; the two will never match exactly.
- Screen readers need one live region per answer, not one per token. Announce at sentence boundaries.
- Copy buttons must copy the source markdown, not the rendered HTML.
