export type Ordering<T> = { asc: T } | { desc: T };

export function isOrderingAsc(obj: any): obj is { asc: any } {
	const keys = Object.keys(obj);
	return keys.length === 1 && keys[0] === "asc";
}

export function isOrderingDesc(obj: any): obj is { desc: any } {
	const keys = Object.keys(obj);
	return keys.length === 1 && keys[0] === "desc";
}