export const getStripeConfig = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID;
  const yearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID;

  // Validate required variables
  const missingVars = [];
  if (!publishableKey) missingVars.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  if (!secretKey) missingVars.push('STRIPE_SECRET_KEY');
  if (!webhookSecret) missingVars.push('STRIPE_WEBHOOK_SECRET');
  if (!monthlyPriceId) missingVars.push('STRIPE_MONTHLY_PRICE_ID');
  if (!yearlyPriceId) missingVars.push('STRIPE_YEARLY_PRICE_ID');

  if (missingVars.length > 0) {
    console.error('Missing required Stripe environment variables:', missingVars.join(', '));
    throw new Error(`Missing required Stripe environment variables: ${missingVars.join(', ')}`);
  }

  // Check if webhook secret is same as secret key (common mistake)
  if (webhookSecret === secretKey) {
    console.warn('WARNING: STRIPE_WEBHOOK_SECRET appears to be the same as STRIPE_SECRET_KEY');
  }

  return {
    publishableKey,
    secretKey,
    webhookSecret,
    monthlyPriceId,
    yearlyPriceId,
  };
};

export const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }
  return key;
}; 