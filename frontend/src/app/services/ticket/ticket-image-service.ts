import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { TicketImage } from "../../models/ticket.model";
import { environment } from "../../../environments/environment";



@Injectable({
    providedIn: 'root'
})
export class TicketImageService {

    private baseUrl = `${environment.apiUrl}/images-tickets`;


    constructor(private http: HttpClient) {}

    uploadImages(ticketId: number, files: File[]): Observable<void> {

    const formData = new FormData();

    files.forEach(file => {
        formData.append('files', file);
    });

    return this.http.post<void>(
        `${this.baseUrl}/${ticketId}/images`,
        formData
    );
    }

    getImages(ticketId: number): Observable<TicketImage[]> {
    return this.http.get<TicketImage[]>(
        `${this.baseUrl}/${ticketId}/images`
    );
    }

    deleteImage(imageId: number): Observable<void> {
    return this.http.delete<void>(
        `http://localhost:8080/api/v1/ticket-images/${imageId}`
    );
    }

    getImageUrl(imageId: number): string {
    return `http://localhost:8080/api/v1/ticket-images/${imageId}`;
    }
}
