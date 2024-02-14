import type { ByteVec, U256 } from "./brands";

export type FieldType = "ByteVec" | "U256";

interface FieldGeneric {
	type: FieldType;
	value: U256 | ByteVec;
}
interface FieldByteVec extends FieldGeneric {
	type: "ByteVec";
	value: ByteVec;
}
interface FieldU256 extends FieldGeneric {
	type: "U256";
	value: U256;
}

export type Field = FieldByteVec | FieldU256;

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
