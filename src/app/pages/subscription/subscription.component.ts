import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicHeaderComponent } from '@app/shared/components/public-header/public-header.component';

interface SubscriptionPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  buttonText: string;
  buttonClass: string;
}

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
  imports: [CommonModule, PublicHeaderComponent],
  standalone: true
})
export class SubscriptionComponent {

  plans: SubscriptionPlan[] = [
    {
      name: 'Starter',
      price: '$49',
      period: 'per month',
      description: 'Ideal para pequenos negócios de carpintaria',
      features: [
        'Quarterly 10% OFF $129.00',
        'Yearly 20% OFF $469.00',
        'Up to 2 users',
        'Up to 30 takeoffs monthly'
      ],
      highlighted: false,
      buttonText: 'Start Free Trial',
      buttonClass: 'btn-outline-primary'
    },
    {
      name: 'Basic',
      price: '$99',
      period: 'per month',
      description: 'Perfeito para equipes de pequeno porte',
      features: [
        'Quarterly 10% OFF $259.00',
        'Yearly 20% OFF $949.00',
        'Up to 5 users',
        'Up to 70 takeoffs monthly'
      ],
      highlighted: false,
      buttonText: 'Start Free Trial',
      buttonClass: 'btn-outline-primary'
    },
    {
      name: 'Professional',
      price: '$199',
      period: 'per month',
      description: 'Para negócios em expansão',
      features: [
        'Quarterly 10% OFF $537.00',
        'Yearly 20% OFF $1,899.00',
        'Up to 15 users',
        'Up to 260 takeoffs monthly'
      ],
      highlighted: true,
      buttonText: 'Start Free Trial',
      buttonClass: 'btn-primary'
    },
    {
      name: 'Enterprise',
      price: '$399',
      period: 'per month',
      description: 'Para grandes empresas e uso ilimitado',
      features: [
        'Quarterly 10% OFF $999.00',
        'Yearly 20% OFF $3,798.00',
        'Unlimited users',
        'Unlimited takeoffs'
      ],
      highlighted: false,
      buttonText: 'Contact Sales',
      buttonClass: 'btn-outline-primary'
    }
  ];

  constructor(private router: Router) {}

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToLanding(): void {
    this.router.navigate(['/show-case']);
  }

  selectPlan(plan: SubscriptionPlan): void {
    if (plan.name === 'Enterprise') {
      // Handle contact sales flow
      window.open('mailto:sales@carpentrygo.com?subject=Enterprise Plan Inquiry', '_blank');
    } else {
      // Navigate to registration with plan parameter
      this.router.navigate(['/register'], { queryParams: { plan: plan.name.toLowerCase() } });
    }
  }
}