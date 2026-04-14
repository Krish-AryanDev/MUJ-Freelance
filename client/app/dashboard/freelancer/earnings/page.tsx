'use client';

import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import EarningsCard from '@/components/payment/EarningsCard';
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

const getClientName = (payment: Payment): string =>
  typeof payment.clientId === 'string' ? 'Client' : payment.clientId.fullName;

export default function FreelancerEarningsDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['payments', 'earnings', 'freelancer'],
    queryFn: paymentService.getEarnings,
  });

  const summary = data?.success
    ? data.data.earnings
    : {
        totalEarnings: 0,
        pendingEarnings: 0,
        thisMonthEarnings: 0,
        totalOrders: 0,
        commissionPaid: 0,
      };

  const payments = data?.success ? data.data.payments : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Earnings</h1>
        <p className="text-sm text-zinc-600">Track released, pending and monthly income</p>
      </div>

      <EarningsCard
        totalEarnings={summary.totalEarnings}
        pendingEarnings={summary.pendingEarnings}
        thisMonthEarnings={summary.thisMonthEarnings}
        totalOrders={summary.totalOrders}
        commissionPaid={summary.commissionPaid}
        isLoading={isLoading}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`payments-freelancer-skeleton-${index}`} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          title="Unable to load earnings"
          message={error instanceof Error ? error.message : 'Please try again.'}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {!isLoading && !isError && payments.length === 0 ? (
        <EmptyState
          icon={<Wallet className="mx-auto h-8 w-8" />}
          title="No earnings yet"
          description="Complete orders to see your earnings here"
          actionLabel="View Orders"
          actionHref="/dashboard/freelancer/orders"
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
                    <CardTitle className="text-lg text-green-700">{formatPrice(payment.freelancerAmount)}</CardTitle>
                  </div>
                  <Badge className={statusClass}>{payment.status}</Badge>
                </CardHeader>

                <CardContent className="grid gap-2 text-sm text-zinc-700 sm:grid-cols-2 lg:grid-cols-4">
                  <p>
                    Client: <span className="font-medium text-zinc-900">{getClientName(payment)}</span>
                  </p>
                  <p>
                    Gross: <span className="font-medium text-zinc-900">{formatPrice(payment.amount)}</span>
                  </p>
                  <p>
                    Created: <span className="font-medium text-zinc-900">{formatDateTime(payment.createdAt)}</span>
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

