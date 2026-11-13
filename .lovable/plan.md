# Batch Q: is payment setup needed? (answer, no code changes)

## 1. What the "payment prerequisite" is
It is Lovable's built-in payments setup. It is a setup form that runs only in the Lovable editor chat. It covers **Stripe and Paddle**, both run by Lovable, and **Shopify** for physical products. It does **not** cover PayPal.

## 2. What the owner would do (only if he ever wants Stripe or Paddle)
1. Open the project in the Lovable editor.
2. In the chat box, type: "Set up payments".
3. A setup form appears in the chat. He picks a provider and fills it in.
4. He sees a message saying payments are enabled.
I could not check the exact on-screen wording from here.

## 3. Does Batch Q need it?
**No.** I was wrong to block Batch Q on it. Batch Q only:
- loads PayPal's public Subscribe button with the public client id,
- saves the subscription number as "pending" in our own table,
- lets an admin confirm it.
None of that uses Lovable's built-in payments. It needs no secret and no server call to PayPal. Every part can be built now: the `plan_subscriptions` table, the `plan-subscribe` function (no PayPal call), the Plans screen, the admin Subscriptions list, the PayPal button, and the Pro client id follow-up.
One limit: without a PayPal secret, the app cannot check with PayPal by itself that a subscription is real or was cancelled. The admin confirms each one by hand. That matches the batch as written.

## 4. Where to build it
Nothing has to be enabled in the editor first. If you approve, I build Batch Q and the client id follow-up from this conversation, using the saved requirements. After that come the tests, the migration and the deployment, then the report you asked for.
