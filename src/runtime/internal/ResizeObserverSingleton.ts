const MapImplementation = "WeakMap" in window ? WeakMap : ("Map" in window ? Map : undefined);

/**
 * Resize observer singleton
 * https://groups.google.com/a/chromium.org/g/blink-dev/c/z6ienONUb5A/m/F5-VcUZtBAAJ
 */
export class ResizeObserverSingleton {
	constructor(readonly options?: ResizeObserverOptions) {}

	addListener(element: Element, callback: Callback) {
		this._subscriptions.set(element, new Subscription(callback));
		this._getObserver().observe(element, this.options);
	}

	removeListener(element: Element) {
		this._subscriptions.delete(element);
		this._getObserver().unobserve(element);
	}

	getLastEntry(element: Element) {
		return this._subscriptions.get(element)?.lastEntry;
	}

	private readonly _subscriptions: WeakMap<Element, Subscription> = MapImplementation ? new MapImplementation() : undefined;
	private _observer: ResizeObserver|undefined = undefined;
	private _getObserver() {
		return this._observer ?? (this._observer = new ResizeObserver((entries)=>{
			for (const entry of entries) {
				const subscription = this._subscriptions.get(entry.target)!;
				subscription.lastEntry = entry;
				subscription.listener(entry);
			}
		}));
	}
}

type Callback = (entry: ResizeObserverEntry)=>any;

class Subscription {
	constructor(
		readonly listener: Callback,
		public lastEntry?: ResizeObserverEntry,
	) {}
}