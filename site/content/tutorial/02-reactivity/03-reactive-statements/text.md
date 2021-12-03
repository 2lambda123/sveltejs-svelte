---
title: Statements
---

We're not limited to declaring reactive *values* — we can also run arbitrary *statements* reactively. For example, we can log the value of `count` whenever it changes:

```js
$: console.log(`the count is ${count}`);
```

> This example uses [a template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals "MDN Web Docs").

You can easily group statements together with a block:

```js
$: {
	console.log(`the count is ${count}`);
	alert(`I SAID THE COUNT IS ${count}`);
}
```

You can even put the `$:` in front of things like `if` blocks:

```js
$: if (count >= 10) {
	alert(`count is dangerously high!`);
	count = 9;
}
```
