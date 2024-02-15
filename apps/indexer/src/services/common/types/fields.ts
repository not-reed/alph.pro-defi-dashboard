import type { Address, ByteVec, FieldType, FieldValue, U256 } from "./brands";

interface FieldGeneric {
	type: FieldType;
	value: FieldValue;
}
interface FieldByteVec extends FieldGeneric {
	type: "ByteVec";
	value: ByteVec;
}
interface FieldU256 extends FieldGeneric {
	type: "U256";
	value: U256;
}
interface FieldAddress extends FieldGeneric {
	type: "Address";
	value: Address;
}

export type Field = FieldByteVec | FieldU256 | FieldAddress;

export function transformField(obj: unknown): Field {
	if (typeof obj !== "object" || obj === null) {
		throw new Error("Invalid field");
	}
	const { type, value } = obj as { type: FieldType; value: U256 | ByteVec };
	if (type === "ByteVec") {
		return {
			type,
			value: value as ByteVec,
		};
	}
	if (type === "U256") {
		return {
			type,
			value: value as U256,
		};
	}
	throw new Error("Invalid field type");
}
