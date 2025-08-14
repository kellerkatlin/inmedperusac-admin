export interface CategoryResponse {
    id: number;
    description: string;
    image: string;
    status: string;
}

export interface CategoryRequest {
    description: string;
    image?: string;
    status: string;
}
