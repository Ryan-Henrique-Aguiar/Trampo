export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // city
  uf: string;          // state abbreviation
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean; // present and "true" when the CEP does not exist
}