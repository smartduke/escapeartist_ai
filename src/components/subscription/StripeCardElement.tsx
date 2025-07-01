import { useEffect, useState } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Stripe: any;
  }
}

interface StripeCardElementProps {
  onReady: (elements: any, stripe: any) => void;
}

export default function StripeCardElement({ onReady }: StripeCardElementProps) {
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);

  useEffect(() => {
    if (!window.Stripe) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = initializeStripe;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } else {
      initializeStripe();
    }
  }, []);

  const initializeStripe = () => {
    const stripeInstance = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    setStripe(stripeInstance);

    const elementsInstance = stripeInstance.elements();
    setElements(elementsInstance);

    const cardElement = elementsInstance.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
          fontFamily: '"Inter", sans-serif',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a',
        },
      },
    });

    cardElement.mount('#card-element');
    onReady(elementsInstance, stripeInstance);

    // Handle real-time validation errors
    cardElement.on('change', (event: any) => {
      const displayError = document.getElementById('card-errors');
      if (displayError) {
        if (event.error) {
          displayError.textContent = event.error.message;
        } else {
          displayError.textContent = '';
        }
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div id="card-element" className="mb-4">
          {/* Stripe Card Element will be mounted here */}
        </div>
        <div id="card-errors" role="alert" className="text-red-500 text-sm min-h-[20px]"></div>
      </div>
    </div>
  );
} 