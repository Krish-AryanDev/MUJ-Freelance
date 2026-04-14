'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import CheckoutModal from '@/components/payment/CheckoutModal';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/order.service';
import type { PackageTier } from '@/types/order.types';
import Button from '../../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import GigDetail from '../../../../components/gigs/GigDetail';
import ErrorState from '../../../../components/shared/ErrorState';
import Skeleton from '../../../../components/ui/Skeleton';
import { gigService } from '../../../../services/gig.service';
import { formatPrice } from '../../../../utils/formatPrice';

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const gigId = String(params?.id || '');
  const { isAuthenticated, isClient, user } = useAuth();

  const [selectedPackageTier, setSelectedPackageTier] = useState<PackageTier>('basic');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['gig-detail', gigId],
    queryFn: () => gigService.getGigById(gigId),
    enabled: Boolean(gigId),
  });

  const selectedPackage = useMemo(() => {
    if (!data) {
      return null;
    }

    return data.packages.find((pkg) => pkg.tier === selectedPackageTier) ?? null;
  }, [data, selectedPackageTier]);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!data?.id) {
        throw new Error('Gig is not ready yet. Please try again.');
      }

      const response = await orderService.createOrder({
        gigId: data.id,
        packageTier: selectedPackageTier,
      });

      if (!response.success) {
        throw new Error(response.message || 'Unable to create order');
      }

      return response.data.order;
    },
    onSuccess: (order) => {
      const orderId = order._id;
      setActiveOrderId(orderId);
      setCheckoutOpen(true);
      toast.success('Order created. Complete payment to activate it.');
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : 'Unable to create order';
      toast.error(message);
    },
  });

  const handleOrderNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login as a client to place an order.');
      router.push(`/login?redirect=/gigs/${gigId}`);
      return;
    }

    if (!isClient) {
      toast.error('Only client accounts can place orders.');
      return;
    }

    if (!data || user?.id === data.createdBy.id) {
      toast.error('You cannot place an order on your own gig.');
      return;
    }

    createOrderMutation.mutate();
  };

  const onPaymentSuccess = () => {
    if (!activeOrderId) {
      return;
    }

    router.push(`/orders/${activeOrderId}`);
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-125 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState
          title="Gig not found"
          message={error instanceof Error ? error.message : 'Please try again later.'}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <GigDetail gig={data} />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Select Package</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {data.packages.map((pkg) => {
                const isSelected = selectedPackageTier === pkg.tier;

                return (
                  <button
                    key={pkg.tier}
                    type="button"
                    onClick={() => setSelectedPackageTier(pkg.tier)}
                    className={`rounded-lg border p-3 text-left transition ${
                      isSelected
                        ? 'border-black bg-black text-white'
                        : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300'
                    }`}
                  >
                    <p className="text-sm font-semibold capitalize">{pkg.tier}</p>
                    <p className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                      {formatPrice(pkg.price)}
                    </p>
                    <p className={`text-xs ${isSelected ? 'text-zinc-100' : 'text-zinc-600'}`}>
                      {pkg.deliveryDays} day delivery
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedPackage ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <p className="font-semibold text-zinc-900">{selectedPackage.title}</p>
                <p className="mt-1 text-zinc-700">{selectedPackage.description}</p>
                <p className="mt-2 text-zinc-600">Revisions: {selectedPackage.revisions}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex items-center justify-between">
              <span>Selected Tier</span>
              <span className="font-semibold capitalize text-zinc-900">{selectedPackageTier}</span>
            </p>
            <p className="flex items-center justify-between">
              <span>Amount</span>
              <span className="font-semibold text-zinc-900">{formatPrice(selectedPackage?.price ?? 0)}</span>
            </p>
            <p className="text-xs text-zinc-600">Payment will be held in mock escrow until delivery is accepted.</p>
            <Button
              type="button"
              className="w-full"
              isLoading={createOrderMutation.isPending}
              onClick={handleOrderNow}
            >
              Order Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {activeOrderId && selectedPackage ? (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          orderId={activeOrderId}
          amount={selectedPackage.price}
          gigTitle={data.title}
          packageTier={selectedPackageTier}
          onSuccess={onPaymentSuccess}
        />
      ) : null}
    </div>
  );
}

