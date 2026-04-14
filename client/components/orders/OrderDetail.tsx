import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';

import type { Order, UserSummary } from '@/types/order.types';
import { reviewService } from '@/services/review.service';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import { formatPrice } from '@/utils/formatPrice';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Input from '../ui/Input';
import EmptyState from '../shared/EmptyState';
import ErrorState from '../shared/ErrorState';
import RatingBreakdown from '../reviews/RatingBreakdown';
import ReviewCard from '../reviews/ReviewCard';
import ReviewForm from '../reviews/ReviewForm';
import Skeleton from '../ui/Skeleton';
import Textarea from '../ui/Textarea';
import MilestoneTracker from './MilestoneTracker';
import OrderTimeline from './OrderTimeline';

interface OrderDetailProps {
  order: Order;
  currentUserId: string;
  userRoles: string[];
  onDeliver: () => void;
  onAccept: () => void;
  onRevision: (note: string) => void;
  onCancel: () => void;
  onDispute: (reason: string) => void;
  showEmbeddedProgress?: boolean;
}

const statusClassMap: Record<Order['status'], string> = {
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  delivered: 'bg-purple-100 text-purple-700 border-purple-200',
  revision: 'bg-orange-100 text-orange-700 border-orange-200',
  resolved: 'bg-teal-100 text-teal-700 border-teal-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  disputed: 'bg-red-100 text-red-700 border-red-200',
};

const getParty = (party: string | UserSummary): UserSummary | null =>
  typeof party === 'string' ? null : party;

const getGigTitle = (order: Order): string =>
  typeof order.gigId === 'string' ? 'Gig order' : order.gigId.title;

const getGigImage = (order: Order): string | undefined =>
  typeof order.gigId === 'string' ? undefined : order.gigId.images?.[0]?.url;

const isRenderableGigImage = (url?: string): boolean =>
  Boolean(url) && !String(url).includes('example.com');

export default function OrderDetail({
  order,
  currentUserId,
  userRoles,
  onDeliver,
  onAccept,
  onRevision,
  onCancel,
  onDispute,
  showEmbeddedProgress = true,
}: OrderDetailProps) {
  const [revisionNote, setRevisionNote] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  const client = getParty(order.clientId);
  const freelancer = getParty(order.freelancerId);

  const isClient = useMemo(
    () => userRoles.includes('client') && String(client?._id || order.clientId) === currentUserId,
    [client?._id, currentUserId, order.clientId, userRoles],
  );
  const isFreelancer = useMemo(
    () => userRoles.includes('freelancer') && String(freelancer?._id || order.freelancerId) === currentUserId,
    [currentUserId, freelancer?._id, order.freelancerId, userRoles],
  );

  const showDisputeAction = ['active', 'delivered'].includes(order.status) && (isClient || isFreelancer);
  const canRequestRevision = isClient && order.status === 'delivered' && order.revisionsUsed < order.revisionsAllowed;

  const packageDetails =
    typeof order.gigId === 'string'
      ? undefined
      : order.gigId.packages?.find((pkg) => pkg.tier === order.packageTier);

  const reviewsQuery = useQuery({
    queryKey: ['order-reviews', order._id],
    queryFn: () => reviewService.getOrderReviews(order._id),
    enabled: order.status === 'completed',
  });

  const reviewsPayload = reviewsQuery.data?.success
    ? reviewsQuery.data.data
    : {
        reviews: [],
        canReviewAsClient: false,
        canReviewAsFreelancer: false,
      };

  const ratingsSummary = reviewsPayload.reviews.reduce(
    (accumulator, review) => {
      accumulator.total += 1;
      accumulator.sum += review.rating;
      accumulator.breakdown[review.rating as 1 | 2 | 3 | 4 | 5] += 1;
      return accumulator;
    },
    {
      total: 0,
      sum: 0,
      breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
  );

  const averageRating = ratingsSummary.total > 0 ? ratingsSummary.sum / ratingsSummary.total : 0;

  const gigId = typeof order.gigId === 'string' ? undefined : order.gigId._id;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Order #{order._id.slice(0, 8).toUpperCase()}</p>
            <CardTitle>{getGigTitle(order)}</CardTitle>
            <p className="text-xs text-zinc-500">Created {formatDateTime(order.createdAt)}</p>
          </div>
          <Badge className={statusClassMap[order.status]}>{order.status}</Badge>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gig Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isRenderableGigImage(getGigImage(order)) ? (
            <div className="relative h-44 w-full overflow-hidden rounded-lg">
              <Image
                src={getGigImage(order) || ''}
                alt={getGigTitle(order)}
                fill
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
            </div>
          ) : null}
          <p className="text-sm text-zinc-700">Package: <span className="font-medium capitalize">{order.packageTier}</span></p>
          <p className="text-sm text-zinc-700">Price: <span className="font-medium">{formatPrice(order.amount)}</span></p>
          <p className="text-sm text-zinc-700">Delivery Days: {packageDetails?.deliveryDays ?? '--'}</p>
          <p className="text-sm text-zinc-700">Revisions: {order.revisionsAllowed}</p>
          <p className="text-sm text-zinc-700">Deadline: {formatDate(order.deadline)}</p>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar src={client?.avatar?.url} fallback={client?.fullName} alt={client?.fullName || 'Client'} />
              <div>
                <p className="font-medium text-zinc-900">{client?.fullName || 'Unknown client'}</p>
                <p className="text-xs text-zinc-500">{client?.email || 'No email available'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Freelancer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar
                src={freelancer?.avatar?.url}
                fallback={freelancer?.fullName}
                alt={freelancer?.fullName || 'Freelancer'}
              />
              <div>
                <p className="font-medium text-zinc-900">{freelancer?.fullName || 'Unknown freelancer'}</p>
                <p className="text-xs text-zinc-500">Rating: {freelancer?.rating ?? 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {isFreelancer && ['active', 'revision'].includes(order.status) ? (
              <Button type="button" onClick={onDeliver}>
                Deliver Order
              </Button>
            ) : null}

            {isClient && order.status === 'delivered' ? (
              <>
                <Button type="button" className="bg-green-600 text-white hover:bg-green-700" onClick={onAccept}>
                  Accept Delivery
                </Button>
                {canRequestRevision ? (
                  <Button
                    type="button"
                    className="bg-orange-500 text-white hover:bg-orange-600"
                    onClick={() => {
                      if (revisionNote.trim().length > 0) {
                        onRevision(revisionNote.trim());
                        setRevisionNote('');
                      }
                    }}
                  >
                    Request Revision
                  </Button>
                ) : null}
              </>
            ) : null}

            {isClient && order.status === 'active' ? (
              <Button type="button" variant="danger" onClick={onCancel}>
                Cancel Order
              </Button>
            ) : null}

            {showDisputeAction ? (
              <Button type="button" variant="secondary" onClick={() => onDispute(disputeReason.trim())}>
                Raise Dispute
              </Button>
            ) : null}
          </div>

          {canRequestRevision ? (
            <Textarea
              label="Revision Note"
              rows={3}
              value={revisionNote}
              onChange={(event) => setRevisionNote(event.target.value)}
            />
          ) : null}

          {showDisputeAction ? (
            <Input
              label="Dispute reason"
              value={disputeReason}
              onChange={(event) => setDisputeReason(event.target.value)}
            />
          ) : null}
        </CardContent>
      </Card>

      {['delivered', 'completed'].includes(order.status) ? (
        <Card>
          <CardHeader>
            <CardTitle>Deliverables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>{order.deliveryMessage || 'No delivery message provided.'}</p>
            {order.attachments && order.attachments.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {order.attachments.map((attachment) => (
                  <li key={attachment}>
                    <a href={attachment} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {attachment}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {order.status === 'revision' ? (
        <Card>
          <CardHeader>
            <CardTitle>Revision Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-700">{order.revisionNote || 'Revision note unavailable.'}</p>
            <p className="mt-2 text-sm text-zinc-700">
              Revisions used: {order.revisionsUsed} / {order.revisionsAllowed}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {showEmbeddedProgress ? (
        <>
          <MilestoneTracker
            status={order.status}
            revisionsUsed={order.revisionsUsed}
            revisionsAllowed={order.revisionsAllowed}
            deadline={order.deadline}
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
        </>
      ) : null}

      {order.status === 'completed' ? (
        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviewsQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
              </div>
            ) : null}

            {reviewsQuery.isError ? (
              <ErrorState
                title="Unable to load reviews"
                message={reviewsQuery.error instanceof Error ? reviewsQuery.error.message : 'Please try again.'}
                onRetry={() => {
                  void reviewsQuery.refetch();
                }}
              />
            ) : null}

            {!reviewsQuery.isLoading && !reviewsQuery.isError ? (
              <RatingBreakdown
                breakdown={ratingsSummary.breakdown}
                totalReviews={ratingsSummary.total}
                averageRating={averageRating}
              />
            ) : null}

            {!reviewsQuery.isLoading && !reviewsQuery.isError && isClient && reviewsPayload.canReviewAsClient ? (
              <ReviewForm
                orderId={order._id}
                gigId={gigId}
                revieweeId={String(freelancer?._id || order.freelancerId)}
                revieweeName={freelancer?.fullName || 'Freelancer'}
                type="client_to_freelancer"
                onSuccess={() => {
                  void reviewsQuery.refetch();
                }}
                onCancel={() => {
                  void 0;
                }}
              />
            ) : null}

            {!reviewsQuery.isLoading && !reviewsQuery.isError && isFreelancer && reviewsPayload.canReviewAsFreelancer ? (
              <ReviewForm
                orderId={order._id}
                gigId={gigId}
                revieweeId={String(client?._id || order.clientId)}
                revieweeName={client?.fullName || 'Client'}
                type="freelancer_to_client"
                onSuccess={() => {
                  void reviewsQuery.refetch();
                }}
                onCancel={() => {
                  void 0;
                }}
              />
            ) : null}

            {!reviewsQuery.isLoading && !reviewsQuery.isError && reviewsPayload.reviews.length === 0 ? (
              <EmptyState
                title="No reviews yet"
                description="Reviews for this completed order will appear here."
              />
            ) : null}

            {!reviewsQuery.isLoading && !reviewsQuery.isError && reviewsPayload.reviews.length > 0 ? (
              <div className="space-y-3">
                {reviewsPayload.reviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export type { OrderDetailProps };
