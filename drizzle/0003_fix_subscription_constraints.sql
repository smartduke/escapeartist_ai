-- Drop the existing unique constraint if it exists
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_userid_unique";

-- Add a unique constraint on userId
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userid_unique" UNIQUE ("userId");

-- Add a unique constraint on stripeSubscriptionId
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE ("stripeSubscriptionId"); 