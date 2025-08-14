export interface CompanyResponse {
    id: number;
    domain: string;
    identityTypeCode: string;
    identityDocument: string;
    name: string;
    businessName: string;
    address: string;
    email: string;
    summary: string;
    missionDescription: string;
    missionImage: string; // URL/Base64
    visionDescription: string;
    visionImage: string; // URL/Base64
    status: string;
}

export interface CompanyRequest {
    domain: string;
    identityTypeCode: string;
    identityDocument: string;
    name: string;
    businessName: string;
    address: string;
    email: string;
    summary: string;
    missionDescription: string;
    visionDescription: string;
    status: string;
}
