import { cubicOut, cubicInOut, linear } from 'svelte/easing';
import { is_function } from 'svelte/internal';

type EasingFunction = (t: number) => number;

export interface TransitionConfig {
	delay?: number;
	duration?: number;
	easing?: EasingFunction;
	css?: (t: number, u: number) => string;
	tick?: (t: number, u: number) => void;
}

interface BlurParams {
	delay: number;
	duration: number;
	easing?: EasingFunction;
	amount: number;
	opacity: number;
}

export function blur(
	node: Element,
	{ delay = 0, duration = 400, easing = cubicInOut, amount = 5, opacity = 0 }: BlurParams
): TransitionConfig {
	const style = getComputedStyle(node);
	const target_opacity = +style.opacity;
	const f = style.filter === 'none' ? '' : style.filter;
	const od = target_opacity * (1 - opacity);
	return {
		delay,
		duration,
		easing,
		css: (_t, u) => `opacity: ${target_opacity - od * u}; filter: ${f} blur(${u * amount}px);`,
	};
}

interface FadeParams {
	delay: number;
	duration: number;
	easing: EasingFunction;
}

export function fade(node: Element, { delay = 0, duration = 400, easing = linear }: FadeParams): TransitionConfig {
	const o = +getComputedStyle(node).opacity;
	return {
		delay,
		duration,
		easing,
		css: (t) => `opacity: ${t * o};`,
	};
}

interface FlyParams {
	delay: number;
	duration: number;
	easing: EasingFunction;
	x: number;
	y: number;
	opacity: number;
}

export function fly(
	node: Element,
	{ delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }: FlyParams
): TransitionConfig {
	const style = getComputedStyle(node);
	const target_opacity = +style.opacity;
	const transform = style.transform === 'none' ? '' : style.transform;

	const od = target_opacity * (1 - opacity);

	return {
		delay,
		duration,
		easing,
		css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - od * u};`,
	};
}

interface SlideParams {
	delay: number;
	duration: number;
	easing: EasingFunction;
}

export function slide(node: Element, { delay = 0, duration = 400, easing = cubicOut }: SlideParams): TransitionConfig {
	const style = getComputedStyle(node);
	const opacity = +style.opacity;
	const height = parseFloat(style.height);
	const padding_top = parseFloat(style.paddingTop);
	const padding_bottom = parseFloat(style.paddingBottom);
	const margin_top = parseFloat(style.marginTop);
	const margin_bottom = parseFloat(style.marginBottom);
	const border_top_width = parseFloat(style.borderTopWidth);
	const border_bottom_width = parseFloat(style.borderBottomWidth);

	return {
		delay,
		duration,
		easing,
		css: (t) =>
			`overflow: hidden;` +
			`opacity: ${Math.min(t * 20, 1) * opacity};` +
			`height: ${t * height}px;` +
			`padding-top: ${t * padding_top}px;` +
			`padding-bottom: ${t * padding_bottom}px;` +
			`margin-top: ${t * margin_top}px;` +
			`margin-bottom: ${t * margin_bottom}px;` +
			`border-top-width: ${t * border_top_width}px;` +
			`border-bottom-width: ${t * border_bottom_width}px;`,
	};
}

interface ScaleParams {
	delay: number;
	duration: number;
	easing: EasingFunction;
	start: number;
	opacity: number;
}

export function scale(
	node: Element,
	{ delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }: ScaleParams
): TransitionConfig {
	const style = getComputedStyle(node);
	const target_opacity = +style.opacity;
	const transform = style.transform === 'none' ? '' : style.transform;

	const sd = 1 - start;
	const od = target_opacity * (1 - opacity);

	return {
		delay,
		duration,
		easing,
		css: (_t, u) => `
			transform: ${transform} scale(${1 - sd * u});
			opacity: ${target_opacity - od * u};
		`,
	};
}

interface DrawParams {
	delay: number;
	speed: number;
	duration: number | ((len: number) => number);
	easing: EasingFunction;
}

export function draw(
	node: SVGElement & { getTotalLength(): number },
	{ delay = 0, speed, duration, easing = cubicInOut }: DrawParams
): TransitionConfig {
	const len = node.getTotalLength();

	if (duration === undefined) {
		if (speed === undefined) {
			duration = 800;
		} else {
			duration = len / speed;
		}
	} else if (typeof duration === 'function') {
		duration = duration(len);
	}

	return {
		delay,
		duration,
		easing,
		css: (t, u) => `stroke-dasharray: ${t * len} ${u * len};`,
	};
}

interface CrossfadeParams {
	delay: number;
	duration: number | ((len: number) => number);
	easing: EasingFunction;
}
interface CrossFadeConfig extends CrossfadeParams {
	fallback: (node: Element, params: CrossfadeParams, intro: boolean) => TransitionConfig;
}
interface MarkedCrossFadeConfig extends CrossfadeParams {
	key: any;
}
type ElementMap = Map<string, Element>;

export function crossfade({
	delay: default_delay = 0,
	easing: default_easing = cubicOut,
	duration: default_duration = (d) => Math.sqrt(d) * 30,
	fallback,
}: CrossFadeConfig) {
	const to_receive: ElementMap = new Map();
	const to_send: ElementMap = new Map();
	function crossfade(
		from_node: Element,
		to_node: Element,
		{ delay = default_delay, easing = default_easing, duration = default_duration }: CrossfadeParams
	) {
		const from = from_node.getBoundingClientRect();
		const to = to_node.getBoundingClientRect();
		const dx = from.left - to.left;
		const dy = from.top - to.top;
		const dw = from.width / to.width;
		const dh = from.height / to.height;
		const d = Math.sqrt(dx * dx + dy * dy);
		const style = getComputedStyle(to_node);
		const transform = style.transform === 'none' ? '' : style.transform;
		const opacity = +style.opacity;
		return {
			delay,
			easing,
			duration: is_function(duration) ? duration(d) : duration,
			css: (t, u) => `
				opacity: ${t * opacity};
				transform-origin: top left;
				transform: ${transform} translate(${u * dx}px,${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
			`,
		} as TransitionConfig;
	}
	function transition(a: ElementMap, b: ElementMap, is_intro: boolean) {
		return (node: Element, params: MarkedCrossFadeConfig) => {
			a.set(params.key, node);
			return () => {
				if (b.has(params.key)) {
					const from_node = b.get(params.key);
					b.delete(params.key);
					return crossfade(from_node, node, params);
				} else {
					a.delete(params.key);
					return fallback && fallback(node, params, is_intro);
				}
			};
		};
	}

	return [transition(to_send, to_receive, false), transition(to_receive, to_send, true)];
}
