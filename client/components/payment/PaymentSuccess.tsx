'use client';

import Link from 'next/link';

import { formatPrice } from '@/utils/formatPrice';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface PaymentSuccessProps {
  orderId: string;
  amount: number;
  commission: number;
  freelancerAmount: number;
  gigTitle?: string;
}

export default function PaymentSuccess({
  orderId,
  amount,
  commission,
  freelancerAmount,
  gigTitle,
}: PaymentSuccessProps) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 py-8">
      <Card className="text-center">
        <CardContent className="space-y-3 py-6">
          <div className="mx-auto inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
          <p className="text-sm text-zinc-600">Your order is now active</p>
          {gigTitle ? <p className="text-xs text-zinc-500">Gig: {gigTitle}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex justify-between"><span>Amount Paid</span><span>{formatPrice(amount)}</span></p>
          <p className="flex justify-between"><span>Platform Fee</span><span>{formatPrice(commission)}</span></p>
          <p className="flex justify-between font-semibold text-green-600"><span>Freelancer Receives</span><span>{formatPrice(freelancerAmount)}</span></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What happens next</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-zinc-700">
          <p>✓ Your order has been confirmed</p>
          <p>✓ Freelancer has been notified</p>
          <p>✓ Work will begin shortly</p>
          <p>✓ You will be notified on delivery</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link href={`/orders/${orderId}`}>
          <Button>View My Order</Button>
        </Link>
        <Link href="/gigs">
          <Button variant="outline">Browse More Gigs</Button>
        </Link>
      </div>
    </div>
  );
}

export type { PaymentSuccessProps };
