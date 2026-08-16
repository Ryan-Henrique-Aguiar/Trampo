export interface RegisterRequestDto {
    email: string;
    password: string;
    name: string;
    cpf: string;
    phone: string;
    city: string;
    state: string;
    provider: boolean;
    categoryIds: number[];
}