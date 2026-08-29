import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './contact.html',
    styleUrl: './contact.css'
})
export class Contact {
    readonly email = 'contato@trampo.com';
    emailCopiado = false;

    get atendimentoAberto(): boolean {
        const agora = new Date();
        const dia = agora.getDay(); // 0 = domingo, 6 = sábado
        const hora = agora.getHours();
        const dentroDoHorario = hora >= 9 && hora < 18;
        const diaUtil = dia >= 1 && dia <= 5;
        return diaUtil && dentroDoHorario;
    }

    copiarEmail(): void {
        navigator.clipboard.writeText(this.email).then(() => {
            this.emailCopiado = true;
            setTimeout(() => (this.emailCopiado = false), 2000);
        });
    }
}