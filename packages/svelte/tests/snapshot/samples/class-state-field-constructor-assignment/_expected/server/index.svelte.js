// index.svelte (Svelte VERSION)
// Note: compiler output will change before 5.0 is released!
import * as $ from "svelte/internal/server";

export default function Index($$payload, $$props) {
	$.push(true);

	class Foo {
		a;
		#b;

		constructor() {
			this.a = 1;
			this.#b = 2;
		}
	}

	$.pop();
}