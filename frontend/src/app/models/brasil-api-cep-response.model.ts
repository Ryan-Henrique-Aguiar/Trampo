export interface BrasilApiCepResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
  location?: {
    type: string;
    coordinates: {
      longitude: string | null;
      latitude: string | null;
    };
  };
}
