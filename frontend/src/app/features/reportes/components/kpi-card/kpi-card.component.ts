import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="kpi" [style.border-left-color]="color">
      <div class="kpi-lbl">{{ label }}</div>
      <div class="kpi-val">{{ value }}</div>

      <div *ngIf="variacion !== undefined && variacion !== null" class="kpi-var"
        [class.kpi-up]="variacion >= 0"
        [class.kpi-down]="variacion < 0">
        <svg *ngIf="variacion >= 0" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" width="12" height="12">
          <path d="M7 17L17 7M17 7H8M17 7v9"/>
        </svg>
        <svg *ngIf="variacion < 0" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" width="12" height="12">
          <path d="M17 7L7 17M7 17h9M7 17V8"/>
        </svg>
        {{ variacionAbs }}% vs anterior
      </div>

      <div *ngIf="subtext" class="kpi-sub">{{ subtext }}</div>
    </div>
  `,
  styles: [`
    .kpi {
      background: var(--color-candy-surface, #FFFFFF);
      border: 0.5px solid var(--color-candy-border, #E2E8F0);
      border-left: 3px solid #2563EB;
      border-radius: 10px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-height: 92px;
    }
    .kpi-lbl {
      font-size: 10.5px;
      color: var(--color-candy-muted, #64748B);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .kpi-val {
      font-size: 22px;
      font-weight: 700;
      color: var(--color-candy-text, #0F172A);
      line-height: 1.2;
    }
    .kpi-var {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 500;
      padding: 2px 7px;
      border-radius: 999px;
      width: fit-content;
      margin-top: 2px;
    }
    .kpi-up {
      color: #059669;
      background: rgba(5, 150, 105, 0.10);
    }
    .kpi-down {
      color: #DC2626;
      background: rgba(220, 38, 38, 0.10);
    }
    .kpi-sub {
      font-size: 11px;
      color: var(--color-candy-muted, #94A3B8);
      margin-top: 2px;
    }
    :host-context(.dark) .kpi {
      background: var(--color-candy-dark-surface, #1E293B);
      border-color: var(--color-candy-dark-border, #334155);
    }
    :host-context(.dark) .kpi-val {
      color: var(--color-candy-dark-text, #F1F5F9);
    }
  `],
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: string | number = '—';
  @Input() variacion?: number;
  @Input() subtext?: string;
  @Input() color = '#2563EB';

  get variacionAbs(): string {
    if (this.variacion === undefined || this.variacion === null) return '';
    return Math.abs(this.variacion).toFixed(1);
  }
}