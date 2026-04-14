'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { paymentService } from '@/services/payment.service';
import { formatPrice } from '@/utils/formatPrice';
import { getErrorMessage } from '@/utils/helpers';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  gigTitle: string;
  packageTier: string;
  onSuccess: () => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function CheckoutModal({
  isOpen,
  onClose,
  orderId,
  amount,
  gigTitle,
  packageTier,
  onSuccess,
}: CheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [step, setStep] = useState<'summary' | 'processing' | 'done'>('summary');

  const commission = Math.round(amount * 0.03);
  const freelancerAmount = amount - commission;

  const handleSuccessPayment = async () => {
    setIsLoading(true);

    try {
      setStep('processing');
      const initiateRes = await paymentService.initiatePayment(orderId);
      const pid = initiateRes.data.payment._id;
      setPaymentId(pid);

      await sleep(1500);
      await paymentService.confirmPayment(pid, 'success');

      setStep('done');
      toast.success('Payment successful!');

      window.setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      const message = getErrorMessage(error, 'Payment initiation failed');

      if (message.toLowerCase().includes('payment already completed')) {
        toast.success('Payment already completed for this order. Redirecting...');
        onSuccess();
        onClose();
        return;
      }

      setStep('summary');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFailedPayment = async () => {
    setIsLoading(true);

    try {
      setStep('processing');
      const initiateRes = await paymentService.initiatePayment(orderId);
      const pid = initiateRes.data.payment._id;

      await sleep(1000);
      await paymentService.confirmPayment(pid, 'failure');

      toast.error('Payment failed. Please try again.');
      setStep('summary');
    } catch (error) {
      setStep('summary');
      toast.error(getErrorMessage(error, 'Something went wrong'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) {
          setStep('summary');
          setPaymentId(null);
          onClose();
        }
      }}
      title="Complete Payment"
    >
      {step === 'processing' ? (
        <div className="space-y-3 py-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-black border-r-transparent" />
          <p className="text-sm font-medium text-zinc-900">Processing payment...</p>
        </div>
      ) : null}

      {step === 'done' ? (
        <div className="space-y-3 py-8 text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
            ✓
          </div>
          <p className="text-lg font-semibold text-green-600">Payment Successful!</p>
          <p className="text-sm text-zinc-600">Redirecting to your order...</p>
          {paymentId ? <p className="text-xs text-zinc-500">Payment #{paymentId.slice(0, 8)}</p> : null}
        </div>
      ) : null}

      {step === 'summary' ? (
        <div className="space-y-4">
          <section className="space-y-1 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
            <p>
              Gig: <span className="font-medium text-zinc-900">{gigTitle}</span>
            </p>
            <p>
              Package: <span className="font-medium text-zinc-900">{capitalize(packageTier)}</span>
            </p>
          </section>

          <section className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Service Amount</span>
              <span>{formatPrice(amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Platform Fee (3%)</span>
              <span>{formatPrice(commission)}</span>
            </div>
            <hr className="border-zinc-200" />
            <div className="flex items-center justify-between text-base font-semibold text-zinc-900">
              <span>Total</span>
              <span>{formatPrice(amount)}</span>
            </div>
          </section>

          <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
            <p className="font-semibold">⚠️ Test Environment</p>
            <p>No real money will be charged. This is a simulation for testing.</p>
          </section>

          <section className="space-y-1 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
            <p>
              Freelancer will receive: <span className="font-semibold text-green-600">{formatPrice(freelancerAmount)}</span>
            </p>
            <p>Platform commission: {formatPrice(commission)} (3%)</p>
          </section>

          <div className="space-y-2">
            <Button
              type="button"
              className="w-full bg-green-600 text-white hover:bg-green-700"
              isLoading={isLoading}
              onClick={() => {
                void handleSuccessPayment();
              }}
            >
              ✓ Simulate Successful Payment
            </Button>
            <Button
              type="button"
              className="w-full bg-red-600 text-white hover:bg-red-700"
              isLoading={isLoading}
              onClick={() => {
                void handleFailedPayment();
              }}
            >
              ✗ Simulate Failed Payment
            </Button>
            <button
              type="button"
              className="w-full text-sm text-zinc-500 hover:text-zinc-700"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export type { CheckoutModalProps };
