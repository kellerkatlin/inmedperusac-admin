import { CompanyResponse } from './company.model';

export interface AuthResponse {
    id: number;
    company: CompanyResponse;
    identityTypeCode: string;
    identityDocument: string;
    fullName: string;
    email: string;
    status: string;
    token: string;
}
