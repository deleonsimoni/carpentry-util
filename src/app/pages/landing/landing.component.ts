import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MESSAGES } from '@app/shared/constants/messages.constants';
import { PublicHeaderComponent } from '@app/shared/components/public-header/public-header.component';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  imports: [CommonModule, PublicHeaderComponent],
  standalone: true
})
export class LandingComponent {
  readonly MESSAGES = MESSAGES;

  constructor(private router: Router) {}

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  navigateToSubscription(): void {
    this.router.navigate(['/subscription']);
  }

  navigateToHero(): void {
    this.router.navigate(['/show-case']);
  }
}