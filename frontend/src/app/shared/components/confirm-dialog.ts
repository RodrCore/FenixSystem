// src/app/shared/components/confirm-dialog/confirm-dialog.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="cd-overlay" (click)="onCancel()">
  <div class="cd-box" (click)="$event.stopPropagation()">

    <!-- Título -->
    <div class="cd-title">{{ title }}</div>

    <!-- Mensaje -->
    <div class="cd-msg">{{ message }}</div>

    <!-- Nombre del elemento afectado -->
    <div *ngIf="itemName" class="cd-item">{{ itemName }}</div>

    <!-- Botones -->
    <div class="cd-footer">
      <button class="cd-btn cd-cancel" (click)="onCancel()">Cancelar</button>
      <button class="cd-btn" [class.cd-confirm-danger]="type === 'danger'" [class.cd-confirm-success]="type === 'success'" (click)="onConfirm()">
        {{ confirmLabel }}
      </button>
    </div>

  </div>
</div>
  `,
  styles: [`
    .cd-overlay {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(15,23,42,.40);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      backdrop-filter: blur(2px);
    }
    .cd-box {
      background: var(--color-candy-surface);
      border: 0.5px solid var(--color-candy-border);
      border-radius: 14px;
      width: 100%; max-width: 360px;
      box-shadow: 0 20px 60px rgba(15,23,42,.15);
      padding: 24px;
    }
    .cd-title {
      font-size: 14px; font-weight: 500;
      color: var(--color-candy-text);
      margin-bottom: 8px;
    }
    .cd-msg {
      font-size: 13px; color: var(--color-candy-muted);
      line-height: 1.55; margin-bottom: 10px;
    }
    .cd-item {
      font-size: 13px; font-weight: 500;
      color: var(--color-candy-text);
      background: var(--color-candy-bg);
      border: 0.5px solid var(--color-candy-border);
      border-radius: 8px; padding: 8px 12px;
      margin-bottom: 20px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .cd-footer {
      display: flex; gap: 8px; justify-content: flex-end;
    }
    .cd-btn {
      height: 36px; padding: 0 16px; border-radius: 9px;
      font-size: 13px; font-weight: 500; cursor: pointer;
      display: inline-flex; align-items: center; gap: 6px;
      transition: background .15s, transform .1s; border: none;
    }
    .cd-btn:active { transform: scale(.98); }
    .cd-cancel {
      background: transparent; color: var(--color-candy-muted);
      border: 0.5px solid var(--color-candy-border);
    }
    .cd-cancel:hover { background: var(--color-candy-bg); }
    .cd-confirm-danger {
      background: rgba(220,38,38,.10); color: #DC2626;
      border: 0.5px solid rgba(220,38,38,.30);
    }
    .cd-confirm-danger:hover { background: rgba(220,38,38,.16); }
    .cd-confirm-success {
      background: rgba(5,150,105,.10); color: #059669;
      border: 0.5px solid rgba(5,150,105,.30);
    }
    .cd-confirm-success:hover { background: rgba(5,150,105,.16); }
  `],
})
export class ConfirmDialogComponent {
  @Input() title        = 'Confirmar acción';
  @Input() message      = '¿Estás seguro de que deseas continuar?';
  @Input() itemName     = '';                          // nombre del producto afectado
  @Input() confirmLabel = 'Confirmar';
  @Input() type: 'danger' | 'success' = 'danger';     // color del botón confirmar

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void { this.confirmed.emit(); }
  onCancel():  void { this.cancelled.emit(); }
}