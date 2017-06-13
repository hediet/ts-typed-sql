import debug = require("debug");

export function isLoggingEnabled() {
	return debug.enabled("typed-sql:debug");
}

const sqlDebugLogFull = debug("typed-sql:debug-full");
export function logFull(message: string, ...args: any[]) {
	sqlDebugLogFull(message, ...args);
}

const sqlDebugLog = debug("typed-sql:debug");
export function log(message: string, ...args: any[]) {
	sqlDebugLog(message, ...args);
}

const sqlDebugWarn = debug("typed-sql:warn");
export function warn(message: string, ...args: any[]) {
	sqlDebugWarn(message, ...args);
}

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

export class DynamicDispatcher<TBase, TArgs, TResult> {
	private registeredHandlers = new Map<Function, (subject: TBase, arg: TArgs) => TResult>();

	public register<T extends TBase>(clazz: (new (...args: any[]) => T) | Function, handler: (subject: T, arg: TArgs) => TResult) {
		this.registeredHandlers.set(clazz, handler);
		return this;
	}

	public dispatch(obj: TBase, args: TArgs): TResult {
		let proto = Object.getPrototypeOf(obj);
		while (proto) {
			const handler = this.registeredHandlers.get(proto.constructor);
			if (handler) {
				return handler(obj, args);
			}
			proto = Object.getPrototypeOf(proto);
		}

		throw new Error(`No handler was registered for '${obj}'.`);
	}
}
