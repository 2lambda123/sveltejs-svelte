import { Readable, Subscriber, Writable } from 'svelte/store';
import { SvelteComponent } from '../index.js';
import { T$$ } from './types.js';

export function noop() {}

export const identity = <T>(x: T): T => x;

export function assign<T, S>(tar: T, src: S): T & S {
	// @ts-ignore
	for (const k in src) tar[k] = src[k];
	return tar as T & S;
}

// Adapted from https://github.com/then/is-promise/blob/master/index.js
// Distributed under MIT License https://github.com/then/is-promise/blob/master/LICENSE
export function is_promise<T = any>(value: any): value is PromiseLike<T> {
	return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
}

export function add_location(element: Element, file: string | undefined, line: number, column: number, char: number) {
	(element as Element & { __svelte_meta: any }).__svelte_meta = {
		loc: { file, line, column, char }
	};
}

export function blank_object(): {} {
	return Object.create(null);
}

export function run(fn: Function) {
	return fn();
}

export function run_all(fns: Function[]) {
	fns.forEach(run);
}

export function is_function(thing: any): thing is Function {
	return typeof thing === 'function';
}

let src_url_equal_anchor: HTMLAnchorElement;

export function src_url_equal(element_src: string, url: string) {
	if (!src_url_equal_anchor) {
		src_url_equal_anchor = document.createElement('a');
	}
	src_url_equal_anchor.href = url;
	return element_src === src_url_equal_anchor.href;
}

export function safe_not_equal(a: unknown, b: unknown) {
	return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

export function not_equal(a: unknown, b: unknown) {
	return a != a ? b == b : a !== b;
}

export function is_empty(obj: Record<PropertyKey, unknown>) {
	return Object.keys(obj).length === 0;
}

export function validate_store<S extends Readable<unknown>>(store: S, name: string) {
	if (store != null && typeof store.subscribe !== 'function') {
		throw new Error(`'${name}' is not a store with a 'subscribe' method`);
	}
}

export function subscribe<T, S extends Readable<T>>(store: S, ...callbacks: Array<Subscriber<T>>) {
	if (store == null) {
		return noop;
	}
	const unsub: any = store.subscribe(...(callbacks as [any]));
	return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}

export function get_store_value<T, S extends Readable<T>>(store: S): T {
	let value: T;
	subscribe<T, S>(store, v => value = v)();
	return value;
}

export function component_subscribe<T, S extends Readable<T>>(component: SvelteComponent, store: S, callback: Subscriber<T>) {
	component.$$.on_destroy.push(subscribe(store, callback));
}

export function create_slot(definition: any[], ctx: any[], $$scope: T$$, fn: Function) {
	if (definition) {
		const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
		return definition[0](slot_ctx);
	}
}

function get_slot_context(definition: any[], ctx: any[], $$scope: T$$, fn: Function) {
	return definition[1] && fn
		? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
		: $$scope.ctx;
}

export function get_slot_changes(definition: any[], $$scope: T$$, dirty: number[], fn: Function) {
	if (definition[2] && fn) {
		const lets = definition[2](fn(dirty));

		if ($$scope.dirty === undefined) {
			return lets;
		}

		if (typeof lets === 'object') {
			const merged = [];
			const len = Math.max($$scope.dirty.length, lets.length);
			for (let i = 0; i < len; i += 1) {
				merged[i] = $$scope.dirty[i] | lets[i];
			}

			return merged;
		}

		// @ts-expect-error TODO
		return $$scope.dirty | lets;
	}

	return $$scope.dirty;
}

export function update_slot_base(slot: any, slot_definition: any[], ctx: any[], $$scope: T$$, slot_changes: any, get_slot_context_fn: Function) {
	if (slot_changes) {
		const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
		slot.p(slot_context, slot_changes);
	}
}

export function update_slot(slot: any, slot_definition: any[], ctx: any[], $$scope: T$$, dirty: number[], get_slot_changes_fn: Function, get_slot_context_fn: Function) {
	const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
	update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn);
}

export function get_all_dirty_from_scope($$scope: T$$) {
	if ($$scope.ctx.length > 32) {
		const dirty = [];
		const length = $$scope.ctx.length / 32;
		for (let i = 0; i < length; i++) {
			dirty[i] = -1;
		}
		return dirty;
	}
	return -1;
}

export function exclude_internal_props<P extends Record<PropertyKey, unknown>>(props: P) {
	const result: Partial<P> = {};
	for (const k in props) if (k[0] !== '$') result[k] = props[k];
	return result;
}

export function compute_rest_props<P extends Record<PropertyKey, unknown>>(props: P, keys: string[] | Set<string>) {
	const rest: Partial<P> = {};
	keys = new Set(keys);
	for (const k in props) if (!keys.has(k) && k[0] !== '$') rest[k] = props[k];
	return rest;
}

export function compute_slots<S extends Map<string, unknown>>(slots: S) {
	const result = {} as Record<keyof S, true>;
	for (const key in slots) {
		result[key] = true;
	}
	return result;
}

export function once(fn: Function) {
	let ran = false;
	return function(this: any, ...args: unknown[]) {
		if (ran) return;
		ran = true;
		fn.call(this, ...args);
	};
}

export function null_to_empty<T>(value: T): T extends null | undefined ? '' : T {
	return (value == null ? '' : value) as T extends null | undefined ? '' : T;
}

export function set_store_value<T, S extends Writable<T>>(store: S, ret: Node, value: T) {
	store.set(value);
	return ret;
}

export function has_prop<X extends {}, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown> {
	return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function action_destroyer(action_result: { destroy?: () => void } | undefined) {
	return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}

export function split_css_unit(value: number | string): [number, string] {
	const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
	return split ? [parseFloat(split[1]), split[2] || 'px'] : [value as number, 'px'];
}

export const contenteditable_truthy_values = ['', true, 1, 'true', 'contenteditable'];
