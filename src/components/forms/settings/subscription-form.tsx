'use client';
import { Loader } from '@/components/loader';
import { StripeElements } from '@/components/settings/stripe-elements';
import SubscriptionCard from '@/components/settings/subscription-card';
import { Button } from '@/components/ui/button';
// import { useSubscriptions } from '@/hooks/billing/use-billing'
import React from 'react';

type Props = {
  plan: 'STANDARD' | 'PRO' | 'ULTIMATE';
};

const SubscriptionForm = ({ plan }: Props) => {
  // const { loading, onSetPayment, payment, onUpdatetToFreTier } =
  //   useSubscriptions(plan)

  return <div>Subscriptions</div>;
};

export default SubscriptionForm;
