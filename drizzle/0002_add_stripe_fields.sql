ALTER TABLE "subscriptions" ADD COLUMN "stripeSubscriptionId" text;
ALTER TABLE "subscriptions" ADD COLUMN "paymentGateway" text;
ALTER TABLE "subscriptions" DROP COLUMN "razorpaySubscriptionId"; 