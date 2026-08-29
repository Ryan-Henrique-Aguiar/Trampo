import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface FaqItem {
  pergunta: string;
  resposta: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './faq.html',
  styleUrl: './faq.css'
})
export class Faq {
  openIndex: number | null = 0;
  busca = '';

  faqs: FaqItem[] = [
    {
      pergunta: 'Como funciona o Trampo?',
      resposta: 'O Trampo conecta pessoas que precisam de um serviço a profissionais que podem realizá-lo. O cliente publica uma solicitação e recebe propostas dos prestadores disponíveis.'
    },
    {
      pergunta: 'Como publico um serviço?',
      resposta: 'Acesse Início ou Serviços e escolha a opção para publicar um novo serviço. Informe a categoria, descreva o que precisa e envie a solicitação.'
    },
    {
      pergunta: 'Como encontro oportunidades como prestador?',
      resposta: 'Ative o modo Quero trabalhar para visualizar os serviços disponíveis de acordo com suas categorias de atuação.'
    },
    {
      pergunta: 'Posso cancelar um serviço?',
      resposta: 'O cancelamento deve respeitar o estágio da negociação e os acordos feitos entre as partes. Em caso de problema, procure o Suporte.'
    },
    {
      pergunta: 'Meus dados estão seguros?',
      resposta: 'O Trampo busca proteger os dados dos usuários e recomenda que informações de acesso nunca sejam compartilhadas com terceiros.'
    },
    {
      pergunta: 'Ainda tenho dúvidas. O que faço?',
      resposta: 'Você pode abrir uma solicitação em Suporte ou falar diretamente com a equipe pela página Contato.'
    }
  ];

  get faqsFiltradas(): FaqItem[] {
    const termo = this.busca.trim().toLowerCase();

    if (!termo) {
      return this.faqs;
    }

    return this.faqs.filter(
      f =>
        f.pergunta.toLowerCase().includes(termo) ||
        f.resposta.toLowerCase().includes(termo)
    );
  }

  toggle(index: number): void {
    this.openIndex = this.openIndex === index ? null : index;
  }

  limparBusca(): void {
    this.busca = '';
  }
}
