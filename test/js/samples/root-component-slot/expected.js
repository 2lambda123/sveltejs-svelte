/* generated by Svelte vX.Y.Z */
import {
	SvelteComponent,
	append,
	create_root_component_slots,
	create_slot,
	detach,
	element,
	get_slot_changes,
	get_slot_context,
	init,
	insert,
	safe_not_equal,
	space,
	transition_in,
	transition_out
} from "svelte/internal";

const get_slot1_slot_changes = dirty => ({});
const get_slot1_slot_context = ctx => ({});

function create_fragment(ctx) {
	let div;
	let t;
	let current;
	const default_slot_template = /*$$slots*/ ctx[1].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);
	const slot1_slot_template = /*$$slots*/ ctx[1].slot1;
	const slot1_slot = create_slot(slot1_slot_template, ctx, /*$$scope*/ ctx[0], get_slot1_slot_context);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			t = space();
			if (slot1_slot) slot1_slot.c();
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append(div, t);

			if (slot1_slot) {
				slot1_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot && default_slot.p && dirty & /*$$scope*/ 1) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[0], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null));
			}

			if (slot1_slot && slot1_slot.p && dirty & /*$$scope*/ 1) {
				slot1_slot.p(get_slot_context(slot1_slot_template, ctx, /*$$scope*/ ctx[0], get_slot1_slot_context), get_slot_changes(slot1_slot_template, /*$$scope*/ ctx[0], dirty, get_slot1_slot_changes));
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			transition_in(slot1_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			transition_out(slot1_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
			if (slot1_slot) slot1_slot.d(detaching);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
	};

	return [$$scope, $$slots];
}

class Component extends SvelteComponent {
	constructor(options) {
		super();

		if (options.slots) {
			options.props = options.props || {};
			options.props.$$scope = {};
			options.props.$$slots = create_root_component_slots(options.slots);
		}

		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

export default Component;