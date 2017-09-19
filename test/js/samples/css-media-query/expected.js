/* generated by Svelte vX.Y.Z */
import { appendNode, assign, createElement, detachNode, init, insertNode, noop, proto, setAttribute } from "svelte/shared.js";

export default (function() {
	function encapsulateStyles(node) {
		setAttribute(node, "svelte-2363328337", "");
	}

	function add_css() {
		var style = createElement("style");
		style.id = 'svelte-2363328337-style';
		style.textContent = "@media(min-width: 1px){div[svelte-2363328337],[svelte-2363328337] div{color:red}}";
		appendNode(style, document.head);
	}

	function create_main_fragment(state, component) {
		var div;

		return {
			create: function() {
				div = createElement("div");
				this.hydrate();
			},

			hydrate: function() {
				encapsulateStyles(div);
			},

			mount: function(target, anchor) {
				insertNode(div, target, anchor);
			},

			update: noop,

			unmount: function() {
				detachNode(div);
			},

			destroy: noop
		};
	}

	function SvelteComponent(options) {
		init(this, options);
		this._state = options.data || {};

		if (!document.getElementById("svelte-2363328337-style")) add_css();

		this._fragment = create_main_fragment(this._state, this);

		if (options.target) {
			this._fragment.create();
			this._fragment.mount(options.target, options.anchor || null);
		}
	}

	assign(SvelteComponent.prototype, proto);
	return SvelteComponent;
}());