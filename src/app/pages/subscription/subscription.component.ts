import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
  imports: [CommonModule],
  standalone: true
})
export class SubscriptionComponent {

  plans: SubscriptionPlan[] = [
    {
      name: 'Basic',
      price: '$29',
      period: 'per month',
      description: 'Perfect for small carpentry businesses',
      features: [
        'Pode criar até 50 takeoffs por mês',
        '2 carpenter assignments',
        'Basic reporting',
        'Email support',
        'Mobile access'
      ],
      highlighted: false,
      buttonText: 'Start Free Trial',
      buttonClass: 'btn-outline-primary'
    },
    {
      name: 'Professional',
      price: '$59',
      period: 'per month',
      description: 'Ideal for growing businesses',
      features: [
        'Até 250 takeoffs por mês',
        'Unlimited carpenter assignments',
        'Advanced reporting & analytics',
        'Priority support',
        'Mobile access',
        'PDF generation',
        'Delivery tracking',
        'Custom fields'
      ],
      highlighted: true,
      buttonText: 'Start Free Trial',
      buttonClass: 'btn-primary'
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: 'per month',
      description: 'For large teams and companies',
      features: [
        'Takeoffs ilimitados',
        'Multi-company management',
        'Advanced user roles',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'Custom branding',
        'SLA guarantee'
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
    this.router.navigate(['/hero']);
  }

  selectPlan(plan: SubscriptionPlan): void {
    if (plan.name === 'Enterprise') {
      // Handle contact sales flow
      window.open('mailto:sales@carpentryutil.com?subject=Enterprise Plan Inquiry', '_blank');
    } else {
      // Navigate to registration with plan parameter
      this.router.navigate(['/register'], { queryParams: { plan: plan.name.toLowerCase() } });
    }
  }
}