export interface AttributeResponse {
    id: number;
    name: string;
    dataType: string;
    status: string;
}

export interface AttributeRequest {
    name: string;
    dataType: string;
    status: string;
}

export interface AttributeValueResponse {
    id: number;
    valueString: string;
    valueNumber: number;
    valueBoolean: boolean;
}

export interface AttributeValueRequest {
    attributeId: number;
    valueString: string;
    valueNumber: number;
    valueBoolean: boolean;
}
