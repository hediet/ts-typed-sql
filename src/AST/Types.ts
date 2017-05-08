import { Row } from "./FromFactor";

export type AnyType = Type<any, any, string>;


export type MapOutType<TRow extends Row> = { [TName in keyof TRow]: GetOutType<TRow[TName]> };

export type GetInType<TType extends any> = TType["_inType"];
export type GetOutType<TType extends any> = TType["_outType"];

export abstract class Type<TInType, TOutType, TBrand extends string> {
	public _brand: TBrand;
	private _inType: TInType;
	private _outType: TOutType;

	public abstract serialize(arg: TInType): string|number|boolean|null;
	public abstract deserialize(arg: string|number|boolean): TOutType;

	public orNull(): Type<TInType|null, TOutType|null, TBrand|"null"> {
		return new NullType(this);
	}
}

export class NullType<TInType, TOutType, TBrand extends string> extends Type<TInType|null, TOutType|null, TBrand|"null"> {
	constructor(private readonly type: Type<TInType, TOutType, TBrand>) {
		super();
	}

	public serialize(arg: TInType|null): string|number|boolean|null {
		if (arg === null) return null;
		return this.type.serialize(arg);
	}

	public deserialize(arg: string|number|boolean|null): TOutType|null {
		if (arg === null) return null;
		return this.type.deserialize(arg);
	}
}

export class VoidType extends Type<void, void, "void"> {
	public serialize(arg: void): string|number|boolean|null { throw new Error("Void type does not support serialization"); }
	public deserialize(arg: string|number|boolean): void { throw new Error("Void type does not support deserialization"); }
}
export const tVoid = new VoidType();

export type RecordTypeToJson<T extends { _brand: string }> = RecordTypeToJson2<T>["result"];
export type RecordTypeToJson1<T extends { result: any }> = { [TName in keyof T]: T[TName]["result"] };
export type RecordTypeToJson2<T extends { _brand: string }> =
{ 
	result:
		(
			{
				record: RecordTypeToJson1<{ [TName in keyof T["_recordType"]]: RecordTypeToJson2<T["_recordType"][TName]> }>
			}
			&
			{ [other: string]: GetInType<T> }
		)[T["_brand"]]
};

// let xx: RecordTypeToJson2<{ _brand: "record", _recordType: { p2: { _brand: "record", _recordType: { fooa: { _brand: "record", _recordType: { bla: IntegerType } } } } } }> = null!;


export function tJson<T>(): Json<T> {
	return new Json<T>();
}

export class Json<T extends any> extends Type<T, T, "json"> {

	serialize(arg: T): string|number|boolean {
		return JSON.stringify(arg);
	}

	deserialize(arg: string|number|boolean): T {
		if (typeof arg !== "string") throw new Error("Arg must be of type string.");

		return JSON.parse(arg);
	}
}

export class Record<T> extends Type<never, string, "record"> {
	_recordType: T;

	serialize(arg: never): string|number|boolean {
		throw "";
	}

	deserialize(arg: string): string {
		return arg;
	}
}

export function tRecord<T>() {
	return new Record<T>();
}

export class BooleanType extends Type<boolean, boolean, "boolean"> {

	serialize(arg: boolean): string|number|boolean {
		return arg;
	}

	deserialize(arg: string|number|boolean): boolean {
		return !!arg;
	}
}
export const tBoolean = new BooleanType();

export class TextType extends Type<string, string, "text"> {

	serialize(arg: string): string|number|boolean {
		return arg;
	}

	deserialize(arg: string|number|boolean): string {
		return "" + arg;
	}
}
export const tText = new TextType();



export class IntegerType extends Type<number, number, "integer"> {

	serialize(arg: number): string|number|boolean {
		return arg;
	}

	deserialize(arg: string|number|boolean): number {
		return +arg;
	}
}
export const tInteger = new IntegerType();