import { run_all } from './utils';
import { current_component, set_current_component } from './lifecycle';

export const dirty_components = [];
export const intros = { enabled: false };

export const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];

const resolved_promise = Promise.resolve();
let update_scheduled = false;

export function schedule_update() {
	if (!update_scheduled) {
		update_scheduled = true;
		resolved_promise.then(flush);
	}
}

export function tick() {
	schedule_update();
	return resolved_promise;
}

export function add_render_callback(fn) {
	render_callbacks.push(fn);
}

export function add_flush_callback(fn) {
	flush_callbacks.push(fn);
}

const seen_callbacks = new Set();
let flushidx = 0;  // Do *not* move this inside the flush() function
export function flush() {
	const saved_component = current_component;

	do {
		// first, call beforeUpdate functions
		// and update components
		while (flushidx < dirty_components.length) {
			const component = dirty_components[flushidx];
			flushidx++;
			set_current_component(component);
			update(component.$$);
		}
		set_current_component(null);

		dirty_components.length = 0;
		flushidx = 0;

		while (binding_callbacks.length) binding_callbacks.pop()();

		// then, once components are updated, call
		// afterUpdate functions. This may cause
		// subsequent updates...
		for (let i = 0; i < render_callbacks.length; i += 1) {
			const callback = render_callbacks[i];

			if (!seen_callbacks.has(callback)) {
				// ...so guard against infinite loops
				seen_callbacks.add(callback);

				callback();
			}
		}

		render_callbacks.length = 0;
	} while (dirty_components.length);

	set_current_component(saved_component);

	while (flush_callbacks.length) {
		flush_callbacks.pop()();
	}

	update_scheduled = false;
	seen_callbacks.clear();
}

function update($$) {
	if ($$.fragment !== null) {
		$$.update();
		run_all($$.before_update);
		const dirty = $$.dirty;
		$$.dirty = [-1];
		$$.fragment && $$.fragment.p($$.ctx, dirty);

		$$.after_update.forEach(add_render_callback);
	}
}
