import {
  Component, Input, OnInit, OnDestroy, NgZone,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router }       from '@angular/router';
import { AuthService }  from '../../../core/services/auth.service';
 
export type TabType =
  | 'dashboard' | 'productos' | 'clientes' | 'ventas'
  | 'pedidos'   | 'usuarios'  | 'reportes';
 
interface TabConfig {
  id:    TabType;
  label: string;
  route: string;
}
 
@Component({
  selector:        'app-tabbar',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
  templateUrl: './tabbar.html',
  styleUrl: './tabbar.scss',
})
export class TabbarComponent implements OnInit, OnDestroy {
  @Input() tab: TabType = 'dashboard';
  isHidden = false;
  tabs: TabConfig[] = [];
 
  private lastY    = 0;
  private scrollEl: HTMLElement | null = null;
  private bound:   any = null;
 
  // ── Tabs por rol ──────────────────────────────────────────
  private readonly tabsPreventista: TabConfig[] = [
    { id:'dashboard', label:'Inicio',    route:'/dashboard' },
    { id:'productos', label:'Productos', route:'/productos' },
    { id:'clientes',  label:'Clientes',  route:'/clientes' },
    { id:'ventas',    label:'Ventas',    route:'/ventas' },
  ];
 
  private readonly tabsRepartidor: TabConfig[] = [
    { id:'dashboard', label:'Inicio',    route:'/dashboard' },
    { id:'pedidos',   label:'Pedidos',   route:'/repartidor/entregas' },
    { id:'clientes',  label:'Clientes',  route:'/clientes' },
  ];
 
  private readonly tabsAdmin: TabConfig[] = [
    { id:'dashboard', label:'Inicio',    route:'/dashboard' },
    { id:'ventas',    label:'Ventas',    route:'/ventas' },
    { id:'clientes',  label:'Clientes',  route:'/clientes' },
    { id:'usuarios',  label:'Usuarios',  route:'/usuarios' },
  ];
 
  private readonly tabsSuperAdmin: TabConfig[] = [
    ...this.tabsAdmin,
    { id:'reportes', label:'Auditoría', route:'/reportes' },
  ];
 
  constructor(
    private router: Router,
    private auth:   AuthService,
    private zone:   NgZone,
    private cdr:    ChangeDetectorRef,
  ) {}
 
  ngOnInit(): void {
    if      (this.auth.hasRole('SUPER_ADMIN'))         this.tabs = this.tabsSuperAdmin;
    else if (this.auth.hasRole('ADMIN', 'GERENTE'))    this.tabs = this.tabsAdmin;
    else if (this.auth.hasRole('REPARTIDOR'))          this.tabs = this.tabsRepartidor;
    else                                                this.tabs = this.tabsPreventista;
 
    setTimeout(() => this.bindScroll(), 300);
  }
 
  ngOnDestroy(): void {
    this.scrollEl?.removeEventListener('scroll', this.bound);
  }
 
  go(t: TabConfig): void {
    this.isHidden = false;
    this.router.navigate([t.route]);
  }
 
  private bindScroll(): void {
    const ionContent = document.querySelector('ion-content');
    if (!ionContent) return;
    ionContent.getScrollElement().then(el => {
      this.scrollEl = el;
      this.bound = () => {
        const y = el.scrollTop;
        const delta = y - this.lastY;
        this.zone.run(() => {
          if      (delta >  10) this.isHidden = true;
          else if (delta < -10) this.isHidden = false;
          this.cdr.markForCheck();
        });
        this.lastY = y;
      };
      el.addEventListener('scroll', this.bound, { passive: true });
    });
  }
}