'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import DeliveryUpload from '@/components/orders/DeliveryUpload';
import MilestoneTracker from '@/components/orders/MilestoneTracker';
import OrderDetail from '@/components/orders/OrderDetail';
import OrderTimeline from '@/components/orders/OrderTimeline';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/order.service';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, initialized, isLoading: isAuthLoading, user } = useAuth();

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const orderId = String(params?.id || '');

  useEffect(() => {
    if (initialized && !isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [initialized, isAuthLoading, isAuthenticated, router]);

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: Boolean(orderId) && isAuthenticated,
  });

  const invalidateOrderQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const acceptMutation = useMutation({
    mutationFn: () => orderService.acceptDelivery(orderId),
    onSuccess: async () => {
      toast.success('Delivery accepted');
      await invalidateOrderQueries();
      await orderQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to accept delivery');
    },
  });

  const revisionMutation = useMutation({
    mutationFn: (note: string) => orderService.requestRevision(orderId, note),
    onSuccess: async () => {
      toast.success('Revision requested');
      await invalidateOrderQueries();
      await orderQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to request revision');
    },
  });

  const disputeMutation = useMutation({
    mutationFn: (reason: string) => orderService.createDispute(orderId, reason),
    onSuccess: async () => {
      toast.success('Dispute raised');
      await invalidateOrderQueries();
      await orderQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to raise dispute');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(orderId),
    onSuccess: async () => {
      setIsCancelConfirmOpen(false);
      toast.success('Order cancelled');
      await invalidateOrderQueries();
      await orderQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order');
    },
  });

  const order = orderQuery.data?.success ? orderQuery.data.data.order : undefined;
  const userRoles = user?.roles ?? [];
  const currentUserId = user?.id ?? '';

  const queryErrorMessage = useMemo(
    () => (orderQuery.error instanceof Error ? orderQuery.error.message : ''),
    [orderQuery.error],
  );

  if (isAuthLoading || (isAuthenticated && orderQuery.isLoading)) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (orderQuery.isError || !order) {
    const isUnauthorized = queryErrorMessage.toLowerCase().includes('authorized');

    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState
          title={isUnauthorized ? 'You are not authorized to access this order' : 'Order not found'}
          message={queryErrorMessage || 'Unable to load order details.'}
          onRetry={() => {
            void orderQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <MilestoneTracker
        status={order.status}
        revisionsUsed={order.revisionsUsed}
        revisionsAllowed={order.revisionsAllowed}
        deadline={order.deadline}
      />

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <OrderDetail
          order={order}
          currentUserId={currentUserId}
          userRoles={userRoles}
          showEmbeddedProgress={false}
          onDeliver={() => setIsDeliveryModalOpen(true)}
          onAccept={() => {
            acceptMutation.mutate();
          }}
          onRevision={(note) => {
            if (!note.trim()) {
              toast.error('Revision note is required');
              return;
            }
            revisionMutation.mutate(note.trim());
          }}
          onCancel={() => setIsCancelConfirmOpen(true)}
          onDispute={(reason) => {
            if (!reason.trim()) {
              toast.error('Dispute reason is required');
              return;
            }
            disputeMutation.mutate(reason.trim());
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>Order Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline
              status={order.status}
              createdAt={order.createdAt}
              deliveredAt={order.deliveredAt}
              completedAt={order.completedAt}
              cancelledAt={order.cancelledAt}
            />
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        title="Deliver Order"
      >
        <DeliveryUpload
          orderId={order._id}
          onCancel={() => setIsDeliveryModalOpen(false)}
          onSuccess={async () => {
            setIsDeliveryModalOpen(false);
            await invalidateOrderQueries();
            await orderQuery.refetch();
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        title="Cancel order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmLabel="Cancel Order"
        variant="danger"
        isConfirming={cancelMutation.isPending}
        onCancel={() => setIsCancelConfirmOpen(false)}
        onConfirm={() => {
          cancelMutation.mutate();
        }}
      />
    </div>
  );
}

