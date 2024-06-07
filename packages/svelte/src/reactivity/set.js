import { DEV } from 'esm-env';
import { source, set } from '../internal/client/reactivity/sources.js';
import { get } from '../internal/client/runtime.js';
import { increment } from './utils.js';

var read_methods = ['forEach', 'isDisjointFrom', 'isSubsetOf', 'isSupersetOf'];
var set_like_methods = ['difference', 'intersection', 'symmetricDifference', 'union'];

var inited = false;

/**
 * @template T
 * @extends {Set<T>}
 */
export class ReactiveSet extends Set {
	/** @type {Map<T, import('#client').Source<boolean>>} */
	#sources = new Map();
	#version = source(0);
	#size = source(0);

	/**
	 * @param {Iterable<T> | null | undefined} [value]
	 */
	constructor(value) {
		super();

		// If the value is invalid then the native exception will fire here
		if (DEV) new Set(value);

		if (value) {
			var sources = this.#sources;
			for (var element of value) {
				super.add(element);
			}
			this.#size.v = super.size;
		}

		if (!inited) this.#init();
	}

	// We init as part of the first instance so that we can treeshake this class
	#init() {
		inited = true;

		var proto = ReactiveSet.prototype;
		var set_proto = Set.prototype;

		for (const method of read_methods) {
			// @ts-ignore
			proto[method] = function (...v) {
				this.#read_all();
				get(this.#version);
				// @ts-ignore
				return set_proto[method].apply(this, v);
			};
		}

		for (const method of set_like_methods) {
			// @ts-ignore
			proto[method] = function (...v) {
				get(this.#version);
				// @ts-ignore
				var set = /** @type {Set<T>} */ (set_proto[method].apply(this, v));
				return new ReactiveSet(set);
			};
		}
	}

	/** @param {T} value */
	has(value) {
		var sources = this.#sources;
		var s = sources.get(value);

		if (s === undefined) {
			var ret = super.has(value);
			if (ret) {
				s = source(true);
				sources.set(value, s);
			} else {
				// We should always track the version in case
				// the Set ever gets this value in the future.
				get(this.#version);
				return false;
			}
		}

		get(s);
		return super.has(value);
	}

	#read_all() {
		var sources = this.#sources;
		var values = super.values();
		for (let value of values) {
			var s = sources.get(value);

			if (s === undefined) {
				s = source(true);
				sources.set(value, s);
			}

			get(s);
		}
	}

	/** @param {T} value */
	add(value) {
		var sources = this.#sources;
		var res = super.add(value);
		var s = sources.get(value);

		if (s === undefined) {
			set(this.#size, super.size);
			increment(this.#version);
		} else {
			set(s, true);
		}

		return res;
	}

	/** @param {T} value */
	delete(value) {
		var sources = this.#sources;
		var s = sources.get(value);
		var res = super.delete(value);

		if (s !== undefined) {
			sources.delete(value);
			set(this.#size, super.size);
			set(s, false);
			increment(this.#version);
		}

		return res;
	}

	clear() {
		var sources = this.#sources;

		if (super.size !== 0) {
			set(this.#size, 0);
			for (var s of sources.values()) {
				set(s, false);
			}
			increment(this.#version);
			sources.clear();
		}
		super.clear();
	}

	keys() {
		this.#read_all();
		get(this.#version);
		return super.keys();
	}

	values() {
		this.#read_all();
		get(this.#version);
		return super.values();
	}

	entries() {
		this.#read_all();
		get(this.#version);
		return super.entries();
	}

	[Symbol.iterator]() {
		return this.keys();
	}

	get size() {
		return get(this.#size);
	}
}
