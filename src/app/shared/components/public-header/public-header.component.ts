import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss'
})
export class PublicHeaderComponent {

  constructor(private router: Router) {}

  navigateToLanding(): void {
    this.router.navigate(['/hero']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
