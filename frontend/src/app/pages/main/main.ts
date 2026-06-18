import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './main.html',
  styleUrl: './main.css',
})

export class Main {

  lista: string[] = ['marcus', 'ryan', 'saimon', 'jaison', 'luciano tiburcio'];
  name: string | null = '';
  isHelpOpen = false;
  ngOnInit(): void {
    this.name = this.getRandomElement(this.lista);
  }
  getRandomElement<T>(list: T[]): T | null {
    if (!Array.isArray(list) || list.length === 0) {
      console.error("A lista está vazia ou não é um array válido.");
      return null;
    }

    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
  }
  
}
