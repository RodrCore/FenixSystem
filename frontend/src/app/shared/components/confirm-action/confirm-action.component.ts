// ═══════════════════════════════════════════════════════════════
// frontend/src/app/shared/components/confirm-action/confirm-action.component.ts
//
// Modal reutilizable de confirmación con opción de motivo (textarea)
// ═══════════════════════════════════════════════════════════════

import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector:    'app-confirm-action',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:     [CommonModule, FormsModule],
  template: `
    <div class="ca-backdrop" (click)="onCancel()"></div>
    <div class="ca-modal">
      <div class="ca-icon" [class.warning]="type === 'warning'" [class.danger]="type === 'danger'">
        <svg *ngIf="type === 'warning'" fill="none" stroke="currentColor"
          stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
          viewBox="0 0 24 24" width="22" height="22">
          <path d="M12 9v4M12 17h.01"/>
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        </svg>
        <svg *ngIf="type === 'danger'" fill="none" stroke="currentColor"
          stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
          viewBox="0 0 24 24" width="22" height="22">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        </svg>
      </div>

      <h3 class="ca-title">{{ title }}</h3>
      <p class="ca-message">{{ message }}</p>
      <div class="ca-item" *ngIf="itemName">{{ itemName }}</div>

      <textarea
        *ngIf="askMotivo"
        [(ngModel)]="motivo"
        class="ca-motivo"
        rows="3"
        [placeholder]="motivoPlaceholder"
      ></textarea>

      <div class="ca-actions">
        <button class="ca-btn ca-cancel" (click)="onCancel()" [disabled]="loading">
          Cancelar
        </button>
        <button
          class="ca-btn ca-confirm"
          [class.danger]="type === 'danger'"
          [class.warning]="type === 'warning'"
          (click)="onConfirm()"
          [disabled]="loading || (askMotivo && requireMotivo && !motivo.trim())"
        >
          {{ loading ? 'Procesando...' : confirmLabel }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .ca-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  z-index: 2020;        /* ← era 70, ahora encima del modal de edit */
}
 
.ca-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 440px;
  max-width: 92vw;
  background: var(--color-candy-surface, #FFFFFF);
  border-radius: 14px;
  padding: 24px;
  z-index: 2021;        /* ← era 71, ahora encima del modal de edit */
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}

    .ca-icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 14px;
    }
    .ca-icon.warning {
      background: rgba(217, 119, 6, 0.12);
      color: #D97706;
    }
    .ca-icon.danger {
      background: rgba(220, 38, 38, 0.12);
      color: #DC2626;
    }
    .ca-title {
      font-size: 17px; font-weight: 600;
      color: var(--color-candy-text, #0F172A);
      margin: 0 0 6px;
    }
    .ca-message {
      font-size: 13px; color: var(--color-candy-muted, #64748B);
      margin: 0 0 12px; line-height: 1.5;
    }
    .ca-item {
      padding: 10px 12px;
      background: var(--color-candy-bg, #F8FAFC);
      border: 0.5px solid var(--color-candy-border, #E2E8F0);
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-candy-text, #0F172A);
      margin-bottom: 14px;
    }
    .ca-motivo {
      width: 100%;
      padding: 10px;
      border-radius: 8px;
      border: 0.5px solid var(--color-candy-border, #E2E8F0);
      background: var(--color-candy-surface, #FFFFFF);
      color: var(--color-candy-text, #0F172A);
      font-size: 12.5px;
      font-family: inherit;
      outline: none;
      resize: vertical;
      margin-bottom: 14px;
    }
    .ca-motivo:focus {
      border-color: #E11D48;
      box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.10);
    }
    .ca-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .ca-btn {
      height: 38px;
      padding: 0 18px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      border: 0.5px solid transparent;
      font-family: inherit;
    }
    .ca-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .ca-cancel {
      background: transparent;
      color: var(--color-candy-muted, #64748B);
      border-color: var(--color-candy-border, #E2E8F0);
    }
    .ca-confirm.warning {
      background: #D97706;
      color: white;
    }
    .ca-confirm.danger {
      background: #DC2626;
      color: white;
    }
    .ca-confirm:hover:not([disabled]) {
      filter: brightness(1.05);
    }

    :host-context(.dark) .ca-modal {
      background: var(--color-candy-dark-surface, #1E293B);
    }
    :host-context(.dark) .ca-title {
      color: var(--color-candy-dark-text, #F1F5F9);
    }
    :host-context(.dark) .ca-item,
    :host-context(.dark) .ca-motivo {
      background: var(--color-candy-dark-bg, #0F172A);
      border-color: var(--color-candy-dark-border, #334155);
      color: var(--color-candy-dark-text, #F1F5F9);
    }
  `],
})
export class ConfirmActionComponent {
  @Input() title         = '¿Confirmar?';
  @Input() message       = '';
  @Input() itemName      = '';
  @Input() confirmLabel  = 'Confirmar';
  @Input() type: 'warning' | 'danger' = 'warning';
  @Input() askMotivo     = false;
  @Input() requireMotivo = false;
  @Input() motivoPlaceholder = 'Escribe el motivo (opcional)';
  @Input() loading       = false;

  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  motivo = '';

  onConfirm(): void {
    this.confirmed.emit(this.motivo.trim());
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}