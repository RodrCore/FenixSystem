import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from '../features/auth/login/login';
import { RegisterComponent } from '../features/auth/register/register.component';
import { AuthRoutingModule } from './auth-routing-module';

@NgModule({
  declarations: [],
  imports: [CommonModule, ReactiveFormsModule, AuthRoutingModule, LoginComponent, RegisterComponent],
})
export class AuthModule {}
