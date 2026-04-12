'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { projectService } from '../../services/project.service';
import type { Proposal } from '../../types/project.types';
import toast from '../../utils/toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';

const proposalSchema = z.object({
  coverLetter: z.string().trim().min(30, 'Cover letter must be at least 30 characters'),
  bidAmount: z.coerce.number().min(1, 'Bid amount must be greater than 0'),
  deliveryDays: z.coerce.number().int().min(1, 'Delivery days must be at least 1'),
});

type ProposalFormInput = z.input<typeof proposalSchema>;

interface ProposalFormProps {
  projectId: string;
  onSubmitted?: (proposal: Proposal) => void;
}

export default function ProposalForm({ projectId, onSubmitted }: ProposalFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProposalFormInput>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      coverLetter: '',
      bidAmount: 1000,
      deliveryDays: 7,
    },
  });

  const submitMutation = useMutation({
    mutationFn: (values: ProposalFormInput) => {
      const parsedValues = proposalSchema.parse(values);
      return projectService.submitProposal(projectId, parsedValues);
    },
    onSuccess: (proposal) => {
      toast.success('Proposal submitted', 'Your proposal has been sent successfully.');
      reset();
      onSubmitted?.(proposal);
    },
    onError: (error) => {
      toast.error('Unable to submit proposal', error instanceof Error ? error.message : 'Please try again.');
    },
  });

  return (
    <form
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4"
      onSubmit={(event) => {
        void handleSubmit((values) => submitMutation.mutate(values))(event);
      }}
    >
      <h3 className="text-lg font-semibold text-zinc-900">Submit proposal</h3>

      <Textarea
        label="Cover Letter"
        rows={6}
        error={errors.coverLetter?.message}
        placeholder="Explain why you are a good fit for this project"
        {...register('coverLetter')}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Bid Amount (INR)"
          type="number"
          min={1}
          error={errors.bidAmount?.message}
          {...register('bidAmount')}
        />

        <Input
          label="Delivery Days"
          type="number"
          min={1}
          error={errors.deliveryDays?.message}
          {...register('deliveryDays')}
        />
      </div>

      <Button type="submit" isLoading={submitMutation.isPending}>
        Submit Proposal
      </Button>
    </form>
  );
}

export type { ProposalFormProps };