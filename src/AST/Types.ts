export interface Record<T> {
	__t: T;
	textRepresentation: string;
}

export type Json<T> = T & { __brand: "json" };


interface Type<TInType, TOutType> {
	parse(arg: string): TInType;
}