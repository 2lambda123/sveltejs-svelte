/* generated by Svelte vX.Y.Z */
import { SvelteComponent as SvelteComponent_1, createElement, detachNode, flush, init, insert, run, safe_not_equal, setStyle } from "svelte/internal";

function create_fragment(component, ctx) {
	var div, current;

	return {
		c() {
			div = createElement("div");
			setStyle(div, "color", ctx.color);
		},

		m(target, anchor) {
			insert(target, div, anchor);
			current = true;
		},

		p(changed, ctx) {
			if (changed.color) {
				setStyle(div, "color", ctx.color);
			}
		},

		i(target, anchor) {
			if (current) return;
			this.m(target, anchor);
		},

		o: run,

		d(detach) {
			if (detach) {
				detachNode(div);
			}
		}
	};
}

function instance($$self, $$props) {
	let { color } = $$props;

	$$self.$$.set = $$props => {
		if ('color' in $$props) color = $$props.color;
	};

	return { color };
}

class SvelteComponent extends SvelteComponent_1 {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal);
	}

	get color() {
		return this.$$.ctx.color;
	}

	set color(color) {
		this.$set({ color });
		flush();
	}
}

export default SvelteComponent;