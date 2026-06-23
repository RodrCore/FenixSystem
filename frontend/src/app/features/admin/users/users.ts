import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-100 p-6">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-800 mb-6">Gestión de Usuarios</h1>
        <div class="bg-white rounded-xl shadow p-8 text-center text-gray-400">
          <p class="text-lg">👥 Módulo de usuarios — próximamente</p>
        </div>
      </div>
    </div>
  `,
})
export class UsersComponent {}