import type { FieldType } from "./brands";
import type { Field } from "./fields";

export interface ArtifactEvent {
	name: string;
	fieldNames: string[];
	fieldTypes: FieldType[];
}

export interface ArtifactFunction {
	name: string;
	usePreapprovedAssets: boolean;
	useAssetsInContract: boolean;
	isPublic: boolean;
	paramNames: string[];
	paramTypes: FieldType[];
	paramIsMutable: boolean[];
	returnTypes: FieldType[];
}

export interface ArtifactConstant {
	name: string;
	value: Field;
}

export interface ArtifactEnum {
	name: string;
	fields: {
		name: string;
		value: Field;
	}[];
}

export interface Artifact {
	version: string;
	name: string;
	bytecode: string;
	codeHash: string;
	fieldsSig: {
		names: string[];
		types: FieldType[];
		isMutable: boolean[];
	};
	eventsSig: ArtifactEvent[];
	functions: ArtifactFunction[];
	constants: ArtifactConstant[];
	enums: ArtifactEnum[];
	stdInterfaceId?: "0001";
}
