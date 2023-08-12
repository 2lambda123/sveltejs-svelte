/* generated by Svelte vX.Y.Z */
import {
	SvelteComponent,
	append,
	detach,
	element,
	init,
	insert,
	listen,
	noop,
	prevent_default,
	run_all,
	safe_not_equal,
	space,
	stop_immediate_propagation,
	stop_propagation
} from "svelte/internal";

function create_fragment(ctx) {
	let div1;
	let div0;
	let t1;
	let button0;
	let t3;
	let button1;
	let t5;
	let button2;
	let t7;
	let button3;
	let mounted;
	let dispose;

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			div0.textContent = "touch me";
			t1 = space();
			button0 = element("button");
			button0.textContent = "click me";
			t3 = space();
			button1 = element("button");
			button1.textContent = "or me";
			t5 = space();
			button2 = element("button");
			button2.textContent = "or me!";
			t7 = space();
			button3 = element("button");
			button3.textContent = "or me!";
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			append(div1, t1);
			append(div1, button0);
			append(div1, t3);
			append(div1, button1);
			append(div1, t5);
			append(div1, button2);
			append(div1, t7);
			append(div1, button3);

			if (!mounted) {
				dispose = [
					listen(div0, "touchstart", handleTouchstart, { passive: false }),
					listen(button0, "click", stop_propagation(prevent_default(handleClick))),
					listen(button1, "click", handleClick, { once: true, capture: true }),
					listen(button2, "click", handleClick, true),
					listen(button3, "click", stop_immediate_propagation(handleClick)),
					listen(button3, "click", handleTouchstart),
					listen(div1, "touchstart", handleTouchstart, { passive: true })
				];

				mounted = true;
			}
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

function handleTouchstart() {
	
} // ...

function handleClick() {
	
} // ...

class Component extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment, safe_not_equal, {});
	}
}

export default Component;