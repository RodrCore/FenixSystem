import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { NavbarComponent } from './shared/components/navbar/navbar';   
import { FooterComponent } from './shared/components/footer/footer';   
import * as AuthActions from './store/auth/auth.actions';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  constructor(private store: Store) {}
  showPublicNav = false;

  ngOnInit(): void {
    this.store.dispatch(AuthActions.loadAuthFromStorage());
  }
}