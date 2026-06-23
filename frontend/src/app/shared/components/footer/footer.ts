import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  template: `
    <footer class="bg-gray-800 text-gray-400 text-center py-4 text-sm">
      <p>© {{ year }} Fenix - Sistema de Gestión Comercial - RodrCorp</p>
    </footer>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}