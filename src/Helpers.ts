
export function toObject<T, K>(item: T[], keySelector: (item: T) => K): any
export function toObject<T, K, V>(item: T[], keySelector: (item: T) => K, valueSelector: (item: T) => V): any
export function toObject<T, K, V>(item: T[], keySelector: (item: T) => K, valueSelector?: (item: T) => V): any {
	const o = {} as any;
	for (const i of item) {
		o[keySelector(i)] = valueSelector ? valueSelector(i) : i;
	}
	return o;
}
