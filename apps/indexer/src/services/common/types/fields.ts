import type {
	Address,
	Bool,
	ByteVec,
	FieldType,
	FieldValue,
	U256,
} from "../../common/types/brands";

interface FieldGeneric {
	type: FieldType;
	value: FieldValue;
}
export interface FieldByteVec extends FieldGeneric {
	type: "ByteVec";
	value: ByteVec;
}
export interface FieldU256 extends FieldGeneric {
	type: "U256";
	value: U256;
}
export interface FieldAddress extends FieldGeneric {
	type: "Address";
	value: Address;
}

export interface FieldBool extends FieldGeneric {
	type: "Bool";
	value: Bool;
}

export type Field = FieldByteVec | FieldU256 | FieldAddress | FieldBool;

export function parseValue(field: FieldU256): bigint;
export function parseValue(field: FieldByteVec): ByteVec;
export function parseValue(field: FieldAddress): Address;
export function parseValue(field: FieldBool): boolean;
export function parseValue(field: Field): string | bigint | boolean {
	if (field.type === "ByteVec") {
		return field.value as ByteVec;
	}

	if (field.type === "U256") {
		return BigInt(field.value);
	}

	if (field.type === "Address") {
		return field.value as Address;
	}

	if (field.type === "Bool") {
		return field.value as Bool;
	}

	throw new Error(`Invalid field type ${field}`);
}

function getField(obj: unknown): Field {
	if (typeof obj !== "object" || obj === null) {
		throw new Error("Invalid field");
	}
	if (!("type" in obj) || !("value" in obj)) {
		throw new Error("Invalid field");
	}

	return {
		type: obj.type,
		value: obj.value,
	} as Field;
}

export function transformField(obj: unknown): Field {
	const field = getField(obj);

	const { type, value } = field;
	if (type === "ByteVec") {
		return {
			type: field.type,
			value: value as ByteVec,
		};
	}
	if (type === "U256") {
		return {
			type,
			value: value as U256,
		};
	}

	if (type === "Address") {
		return {
			type,
			value: value as Address,
		};
	}

	// if (type === "Bool") {
	// 	return {
	// 		type,
	// 		value: value as Bool,
	// 	};
	// }
	throw new Error(`Invalid field type ${type} => ${value}`);
}
