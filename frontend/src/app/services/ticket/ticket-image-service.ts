import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { TicketImage } from "../../models/ticket.model";
import { environment } from "../../../environments/environment";
import { firstValueFrom } from 'rxjs';



@Injectable({
    providedIn: 'root'
})
export class TicketImageService {

    private baseUrl = `${environment.apiUrl}/image-tickets`;


    constructor(private http: HttpClient) {}

    async uploadImages(ticketId: number, files: File[]): Promise<void> {

        const formData = new FormData();

        files.forEach(file => {
            formData.append('files', file);
        });

        await firstValueFrom(
            this.http.post<void>(
            `${this.baseUrl}/${ticketId}/images`,
            formData
            )
        );
    }

    getImages(ticketId: number): Observable<TicketImage[]> {
        return this.http.get<TicketImage[]>(
            `${this.baseUrl}/${ticketId}/images`
        );
    }

    getImage(imageId: number): Observable<Blob> {
        return this.http.get(
            `${this.baseUrl}/images/${imageId}`,
            { responseType: 'blob' }
        );
    }

    deleteImage(imageId: number): Observable<void> {
        return this.http.delete<void>(
        `${environment.apiUrl}/ticket-images/${imageId}`
    );
    }

    getImageUrl(imageId: number): string {
        return `${this.baseUrl}/images/${imageId}`;
    }
}
