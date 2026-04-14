'use client';

import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import Badge from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { paymentService } from '@/services/payment.service';
import type { Payment } from '@/types/payment.types';
import { formatDateTime } from '@/utils/formatDate';
import { formatPrice } from '@/utils/formatPrice';

const statusClassMap: Record<Payment['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  released: 'bg-green-100 text-green-700 border-green-200',
  refunded: 'bg-zinc-200 text-zinc-700 border-zinc-300',
};

const getOrderId = (payment: Payment): string =>
  typeof payment.orderId === 'string' ? payment.orderId : payment.orderId._id;

const getTierLabel = (payment: Payment): string => {
  if (typeof payment.orderId === 'string') {
    return '--';
  }

  return payment.orderId.packageTier;
};

export default function ClientPaymentsDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['payments', 'history', 'client'],
    queryFn: paymentService.getPaymentHistory,
  });

  const payments = data?.success ? data.data.payments : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Payment History</h1>
        <p className="text-sm text-zinc-600">Track your gig payments and statuses</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`payments-client-skeleton-${index}`} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          title="Unable to load payment history"
          message={error instanceof Error ? error.message : 'Please try again.'}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {!isLoading && !isError && payments.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="mx-auto h-8 w-8" />}
          title="No payments yet"
          description="Your completed checkouts will appear here"
          actionLabel="Browse Gigs"
          actionHref="/gigs"
        />
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-3">
          {payments.map((payment) => {
            const statusClass = statusClassMap[payment.status] ?? statusClassMap.pending;

            return (
              <Card key={payment._id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Payment #{payment._id.slice(0, 8).toUpperCase()}
                    </p>
                    <CardTitle className="text-lg">{formatPrice(payment.amount)}</CardTitle>
                  </div>
                  <Badge className={statusClass}>{payment.status}</Badge>
                </CardHeader>

                <CardContent className="grid gap-2 text-sm text-zinc-700 sm:grid-cols-2 lg:grid-cols-4">
                  <p>
                    Package: <span className="font-medium text-zinc-900">{getTierLabel(payment)}</span>
                  </p>
                  <p>
                    Commission: <span className="font-medium text-zinc-900">{formatPrice(payment.commission)}</span>
                  </p>
                  <p>
                    Date: <span className="font-medium text-zinc-900">{formatDateTime(payment.createdAt)}</span>
                  </p>
                  <p>
                    <Link href={`/orders/${getOrderId(payment)}`} className="font-medium text-zinc-900 underline">
                      View Order
                    </Link>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

