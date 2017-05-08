
export function toObject<T, K>(item: T[], keySelector: (item: T) => K): any
export function toObject<T, K, V>(item: T[], keySelector: (item: T) => K, valueSelector: (item: T) => V): any
export function toObject<T, K, V>(item: T[], keySelector: (item: T) => K, valueSelector?: (item: T) => V): any {
	const o = {} as any;
	for (const i of item) {
		o[keySelector(i)] = valueSelector ? valueSelector(i) : i;
	}
	return o;
}

export function secondWithTypeOfFirst<T1>(t1: T1, t2: any): T1 {
	return t2;
}

export function objectValues<T extends {}>(obj: T): T[keyof T][] {
	const result: T[keyof T][] = [];
	for (const prop of Object.getOwnPropertyNames(obj) as (keyof T)[]) {
		result.push(obj[prop]);
	}
	return result;
}

export function objectEntries<T extends {}>(obj: T): [keyof T, T[keyof T]][] {
	const result: [keyof T, T[keyof T]][] = [];
	for (const prop of Object.getOwnPropertyNames(obj) as (keyof T)[]) {
		result.push([prop, obj[prop]]);
	}
	return result;
}

export function combine<T1, T2>(props: T1, and: T2): T1 & T2 {
	const result: any = {};
	for (const [prop, val] of objectEntries(props)) {
		result[prop] = val;
	}
	for (const [prop, val] of objectEntries(and)) {
		result[prop] = val;
	}
	return result;
}