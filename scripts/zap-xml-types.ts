export interface XMLAttr<T> {
    // biome-ignore lint/style/useNamingConvention: API
    $: T;
}

export interface XMLEnumeration extends XMLAttr<{name: string; value: string}> {}

export interface XMLBitmapDefinition {
    element: XMLBitmapElement[];
}

export interface XMLBitmapElement extends XMLAttr<{name: string; mask: string; shiftRight?: string}> {}

export interface XMLSequence {
    field: XMLSequenceField[];
}

export interface XMLSequenceField extends XMLAttr<{name: string; type: string}> {}

export interface XMLTypeType
    extends XMLAttr<{
        id: string;
        name: string;
        short: string;
        inheritsFrom?: string;
        discrete?: string;
    }> {
    restriction?: XMLRestriction[];
    bitmap?: XMLBitmapDefinition[];
}

export interface XMLLibrary {
    "xi:include"?: XMLAttr<{href: string; parse?: string}>[];
    "type:type"?: XMLTypeType[];
}

export interface XMLRestriction {
    "type:length"?: XMLAttr<{value: string}>[];
    "type:minLength"?: XMLAttr<{value: string}>[];
    "type:maxLength"?: XMLAttr<{value: string}>[];
    "type:minExclusive"?: XMLAttr<{value: string}>[];
    "type:minInclusive"?: XMLAttr<{value: string}>[];
    "type:maxExclusive"?: XMLAttr<{value: string}>[];
    "type:maxInclusive"?: XMLAttr<{value: string}>[];
    /** only used for `type:type` (data type non-value) */
    "type:invalid"?: XMLAttr<{value: string}>[];
    "type:minInclusiveRef"?: XMLAttr<{ref: string}>[];
    "type:minExclusiveRef"?: XMLAttr<{ref: string}>[];
    "type:maxInclusiveRef"?: XMLAttr<{ref: string}>[];
    "type:maxExclusiveRef"?: XMLAttr<{ref: string}>[];
    "type:special"?: XMLAttr<{name: string; value: string}>[];
    /** for types gen */
    "type:enumeration"?: XMLEnumeration[];
    "type:sequence"?: XMLSequence[];
}

export interface XMLAttributeDefinition
    extends XMLAttr<{
        id: string;
        name: string;
        type: string;
        readable?: string; // default="true"
        writable?: string; // default="false"
        writeOptional?: string; // default="false"
        writableIf?: string; // DependencyExpression
        reportRequired?: string; // default="false"
        sceneRequired?: string; // default="false"
        required?: string; // default="false"
        requiredIf?: string; // DependencyExpression
        min?: string; // default="0"
        max?: string;
        default?: string;
        defaultRef?: string; // NamedElement
        deprecated?: string; // default="false"
    }> {
    restriction?: XMLRestriction[];
    bitmap?: XMLBitmapDefinition[];
}

export interface XMLFieldDefinition
    extends XMLAttr<{
        name: string;
        type: string;
        array?: string;
        arrayLengthSize?: string;
        arrayLengthField?: string;
        presentIf?: string;
        deprecated?: string;
    }> {
    restriction?: XMLRestriction[];
    bitmap?: XMLBitmapDefinition[];
}

export interface XMLCommandDefinition
    extends XMLAttr<{
        id: string;
        name: string;
        required?: string; // default="false"
        requiredIf?: string; // DependencyExpression
        deprecated?: string; // default="false"
    }> {
    fields?: {field: XMLFieldDefinition[]}[];
}

export interface XMLClusterSide {
    attributes?: {attribute: XMLAttributeDefinition[]}[];
    commands?: {command: XMLCommandDefinition[]}[];
}

export interface XMLCluster
    extends XMLAttr<{
        id: string;
        revision: string;
        name: string;
        manufacturer?: string;
    }> {
    classification: XMLAttr<{role?: string; picsCode: string; primaryTransaction?: string}>[];
    server?: XMLClusterSide[];
    client?: XMLClusterSide[];
    "type:type"?: XMLTypeType[];
}

export interface XMLDerivedCluster extends XMLCluster {
    // biome-ignore lint/style/useNamingConvention: API
    $: {
        inheritsFrom: string;
    } & XMLCluster["$"];
}

export interface XMLRoot {
    "zcl:cluster"?: XMLCluster | XMLCluster[];
    "zcl:derivedCluster"?: XMLDerivedCluster | XMLDerivedCluster[];
    "zcl:library"?: XMLLibrary | XMLLibrary[];
}
