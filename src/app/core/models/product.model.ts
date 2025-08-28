import { AttributeValueResponse } from './attribute.model';
import { CategoryResponse } from './category.mode.';

export interface ProductResponse {
    id: number;
    category: CategoryResponse;
    tittle: string;
    description: string;
    price: number;
    status: string;
    productImages: ImageProduct[];
    productAttributes: AttributeProduct[];
}

export interface ImageProduct {
    id: number;
    image: string;
    status: string;
}

interface AttributeProduct {
    id: number;
    attributeValue: AttributeValueResponse;
}
