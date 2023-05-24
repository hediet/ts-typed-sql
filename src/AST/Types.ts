import { Row } from "./FromFactor";

export type AnyType = Type<any, any, string>;


export type MapOutType<TRow extends Row> = { [TName in keyof TRow]: GetOutType<TRow[TName]> };

export type GetInType<TType extends {_inType: any}> = TType["_inType"];
export type GetOutType<TType extends {_outType: any}> = TType["_outType"];

export abstract class Type<TInType, TOutType, TBrand extends string> {
	public readonly _brand: TBrand;
	_inType: TInType;
	_outType: TOutType;

	public abstract name: string;

	public abstract serialize(arg: TInType): string|number|boolean|null;
	public abstract deserialize(arg: string|number|boolean): TOutType;

	public orNull(): Type<TInType|null, TOutType|null, TBrand|"null"> {
		return new NullType(this);
	}
}

export class NullType<TInType, TOutType, TBrand extends string> extends Type<TInType|null, TOutType|null, TBrand|"null"> {
	public name = "null";

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

export class StandaloneNullType extends Type<null, null, "null"> {
	public name = "null";

	public serialize(arg: null): string|number|boolean|null {
		if (arg === null) return null;
		throw new Error("Can only serialize null.");
	}

	public deserialize(arg: string|number|boolean|null): null {
		if (arg === null) return null;
		throw new Error("Can only deserialize null.");
	}
}

export const tNull = new StandaloneNullType();

export class VoidType extends Type<void, void, "void"> {
	public name = "void";

	public serialize(arg: void): string|number|boolean|null { throw new Error("Void type does not support serialization"); }
	public deserialize(arg: string|number|boolean): void { throw new Error("Void type does not support deserialization"); }
}
export const tVoid = new VoidType();

export type RecordTypeToJson<T extends { _brand: string, _recordType: { [name: string]: any }, _inType: any }> =
(
	{
		record: { [TName in keyof T["_recordType"]]: RecordTypeToJson<T["_recordType"][TName]> }
	}
	&
	{ [other: string]: GetInType<T> }
)[T["_brand"]];



//let test: RecordTypeToJson<{ _brand: "record", _recordType: { p2: { _brand: "record", _recordType: { fooa: { _brand: "record", _recordType: { bla: IntegerType } } } } } }> = null!;
//test.p2.fooa.bla;


export function tJson<T>(): Json<T> {
	return new Json<T>();
}

export class Json<T extends any> extends Type<T, T, "json"> {

	public name = "JSON";

	serialize(arg: T): string|number|boolean {
		return JSON.stringify(arg);
	}

	deserialize(arg: string|number|boolean): T {
		if (typeof arg !== "string") throw new Error("Arg must be of type string.");

		return JSON.parse(arg);
	}
}

export class Record<T> extends Type<never, string, "record"> {
	public name = "RECORD";

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
	public name = "boolean";

	serialize(arg: boolean): string|number|boolean {
		return arg;
	}

	deserialize(arg: string|number|boolean): boolean {
		return !!arg;
	}
}
export const tBoolean = new BooleanType();

export class TextType extends Type<string, string, "text"> {
	public name = "text";

	serialize(arg: string): string|number|boolean {
		return arg;
	}

	deserialize(arg: string|number|boolean): string {
		return "" + arg;
	}
}
export const tText = new TextType();

export class StringEnumType<T extends string> extends Type<T, T, "string_enum"> {
	public name = "text";

	serialize(arg: T): string|number|boolean {
		return arg;
	}

	deserialize(arg: string|number|boolean): T {
		return "" + arg as T;
	}
}

export function tStringEnum<T extends string>(): StringEnumType<T> {
	return new StringEnumType<T>();
}


export class IntegerEnumType<T extends number> extends Type<T, T, "integer_enum"> {
	public name = "numeric";

	serialize(arg: T): string|number|boolean {
		return arg;
	}

	deserialize(arg: string|number|boolean): T {
		return +arg as T;
	}
}

export function tIntegerEnum<T extends number>(): IntegerEnumType<T> {
	return new IntegerEnumType<T>();
}


export class IntegerType extends Type<number, number, "integer"> {
	public name = "integer";

	serialize(arg: number): string|number|boolean {
		return arg;
	}

	deserialize(arg: string|number|boolean): number {
		return +arg;
	}
}

export const tInteger = new IntegerType();



export class BigIntType extends Type<string, string, "bigint"> {
	public name = "bigint";

	serialize(arg: string): string|number|boolean {
		return arg;
	}

	deserialize(arg: string|number|boolean): string {
		return "" + arg;
	}
}

export const tBigInt = new BigIntType();


export class NumericType extends Type<number, number, "numeric"> {
	public name = "numeric";

	serialize(arg: number): string|number|boolean {
		return arg;
	}

	deserialize(arg: string|number|boolean): number {
		return +arg;
	}
}

export const tNumeric = new NumericType();


export class DateType extends Type<Date, Date, "date"> {
	public name = "date";

	serialize(arg: Date): string|number|boolean {
		return arg.toString();
	}

	deserialize(arg: string|number|boolean): Date {
		return new Date(""+ arg);
	}
}

export const tDate = new DateType();