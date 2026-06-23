import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector:    'app-password-temporal',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:     [CommonModule],
  template: `
    <div class="pt-backdrop" (click)="onCerrar()"></div>
    <div class="pt-modal">
      <div class="pt-icon">
        <svg fill="none" stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round"
          viewBox="0 0 24 24" width="24" height="24">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>

      <h3 class="pt-title">{{ titulo }}</h3>
      <p class="pt-message">
        Comparte esta contraseña con el usuario. Deberá cambiarla
        en su próximo inicio de sesión.
      </p>

      <div class="pt-info" *ngIf="email">
        <span class="pt-info-k">Email</span>
        <span class="pt-info-v">{{ email }}</span>
      </div>

      <div class="pt-password-box">
        <div class="pt-password-label">Contraseña temporal</div>
        <div class="pt-password-value">
          <span class="pt-pwd">{{ password }}</span>
          <button class="pt-copy" (click)="copiar()"
            [class.pt-copied]="copiado">
            <svg *ngIf="!copiado" fill="none" stroke="currentColor"
              stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
              viewBox="0 0 24 24" width="15" height="15">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <svg *ngIf="copiado" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              viewBox="0 0 24 24" width="15" height="15">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            {{ copiado ? 'Copiado' : 'Copiar' }}
          </button>
        </div>
      </div>

      <div class="pt-warning">
        <svg fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" width="14" height="14">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Esta contraseña <strong>no se mostrará otra vez</strong>. Cópiala ahora.
      </div>

      <button class="btn-cerrar" (click)="onCerrar()">
        Entendido, ya la copié
      </button>
    </div>
  `,
  styles: [`
    .pt-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.60);
      z-index: 2030;
    }
    .pt-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 460px;
      max-width: 92vw;
      background: var(--color-candy-surface, #FFFFFF);
      border-radius: 14px;
      padding: 28px;
      z-index: 2031;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      text-align: center;
    }
    .pt-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: rgba(37, 99, 235, 0.12);
      color: #2563EB;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    .pt-title {
      font-size: 17px;
      font-weight: 600;
      color: var(--color-candy-text, #0F172A);
      margin: 0 0 8px;
    }
    .pt-message {
      font-size: 13px;
      color: var(--color-candy-muted, #64748B);
      margin: 0 0 16px;
      line-height: 1.5;
    }
    .pt-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: var(--color-candy-bg, #F8FAFC);
      border: 0.5px solid var(--color-candy-border, #E2E8F0);
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 12.5px;
    }
    .pt-info-k {
      color: var(--color-candy-muted, #64748B);
    }
    .pt-info-v {
      color: var(--color-candy-text, #0F172A);
      font-weight: 500;
    }
    .pt-password-box {
      background: var(--color-candy-bg, #F8FAFC);
      border: 1.5px solid #E11D48;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 14px;
    }
    .pt-password-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--color-candy-muted, #64748B);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 8px;
    }
    .pt-password-value {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .pt-pwd {
      font-family: 'Courier New', monospace;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.10em;
      color: #E11D48;
      user-select: all;
    }
    .pt-copy {
      padding: 8px 14px;
      border-radius: 8px;
      border: 0.5px solid var(--color-candy-border, #E2E8F0);
      background: var(--color-candy-surface, #FFFFFF);
      color: var(--color-candy-text, #0F172A);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-family: inherit;
      transition: all 0.2s;
    }
    .pt-copy:hover {
      background: var(--color-candy-bg, #F8FAFC);
    }
    .pt-copy.pt-copied {
      background: rgba(5, 150, 105, 0.10);
      border-color: rgba(5, 150, 105, 0.30);
      color: #059669;
    }
    .pt-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: rgba(217, 119, 6, 0.08);
      border: 0.5px solid rgba(217, 119, 6, 0.30);
      border-radius: 8px;
      color: #D97706;
      font-size: 11.5px;
      margin-bottom: 16px;
      text-align: left;
    }
    .btn-cerrar {
      width: 100%;
      height: 40px;
      background: #E11D48;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-cerrar:hover {
      background: #BE123C;
    }

    :host-context(.dark) .pt-modal {
      background: var(--color-candy-dark-surface, #1E293B);
    }
    :host-context(.dark) .pt-title,
    :host-context(.dark) .pt-info-v {
      color: var(--color-candy-dark-text, #F1F5F9);
    }
    :host-context(.dark) .pt-info,
    :host-context(.dark) .pt-password-box {
      background: var(--color-candy-dark-bg, #0F172A);
      border-color: var(--color-candy-dark-border, #334155);
    }
    :host-context(.dark) .pt-password-box {
      border: 1.5px solid #E11D48;
    }
    :host-context(.dark) .pt-copy {
      background: var(--color-candy-dark-surface, #1E293B);
      border-color: var(--color-candy-dark-border, #334155);
      color: var(--color-candy-dark-text, #F1F5F9);
    }
  `],
})
export class PasswordTemporalComponent {
  @Input() password = '';
  @Input() email    = '';
  @Input() titulo   = 'Contraseña temporal generada';

  @Output() cerrar = new EventEmitter<void>();

  copiado = false;

  constructor(private cdr: ChangeDetectorRef) {}

  async copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.password);
      this.copiado = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copiado = false;
        this.cdr.markForCheck();
      }, 2500);
    } catch (e) {
      // Fallback para navegadores antiguos
      const textarea = document.createElement('textarea');
      textarea.value = this.password;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.copiado = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copiado = false;
        this.cdr.markForCheck();
      }, 2500);
    }
  }

  onCerrar(): void {
    this.cerrar.emit();
  }
}