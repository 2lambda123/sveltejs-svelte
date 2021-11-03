---
title: Local transitions
---

Ordinarily, transitions will play on elements when any container block is added or destroyed. In the example here, toggling the visibility of the entire list also applies transitions to individual list elements.

Instead, we'd like transitions to play only when individual items are added and removed — in other words, when the user drags the slider.

We can achieve this with a *local* transition. Local transitions only play when the block they belong to is created or removed, not when parent blocks are created or removed.





```html
<div transition:slide|local>
	{item}
</div>
```
