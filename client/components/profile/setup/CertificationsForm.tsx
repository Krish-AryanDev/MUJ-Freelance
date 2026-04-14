'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Pencil, Trash2 } from 'lucide-react';

import Button from '../../ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import Input from '../../ui/Input';
import type { AddCertificationPayload, Certification } from '../../../types/user.types';

const certificationSchema = z.object({
  name: z.string().trim().min(2, 'Certification name is required').max(140),
  issuingOrganization: z.string().max(140).optional().or(z.literal('')),
  issueDate: z.string().optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  credentialId: z.string().max(120).optional().or(z.literal('')),
  credentialUrl: z.string().url('Credential URL must be valid').optional().or(z.literal('')),
});

type CertificationValues = z.infer<typeof certificationSchema>;

interface CertificationsFormProps {
  items: Certification[];
  isSaving?: boolean;
  onAdd: (payload: AddCertificationPayload) => Promise<void>;
  onUpdate: (payload: { certificationId: string; payload: Partial<AddCertificationPayload> }) => Promise<void>;
  onDelete: (certificationId: string) => Promise<void>;
}

export default function CertificationsForm({
  items,
  isSaving = false,
  onAdd,
  onUpdate,
  onDelete,
}: CertificationsFormProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CertificationValues>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: '',
      issuingOrganization: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
    },
  });

  const submitLabel = useMemo(() => (editingId ? 'Update Certification' : 'Add Certification'), [editingId]);

  const onSubmit = async (values: CertificationValues) => {
    const payload: AddCertificationPayload = {
      name: values.name,
      issuingOrganization: values.issuingOrganization || undefined,
      issueDate: values.issueDate || undefined,
      expiryDate: values.expiryDate || undefined,
      credentialId: values.credentialId || undefined,
      credentialUrl: values.credentialUrl || undefined,
    };

    if (editingId) {
      await onUpdate({ certificationId: editingId, payload });
      setEditingId(null);
    } else {
      await onAdd(payload);
    }

    reset();
  };

  const startEdit = (item: Certification) => {
    if (!item._id) {
      return;
    }

    setEditingId(item._id);
    setValue('name', item.name);
    setValue('issuingOrganization', item.issuingOrganization || '');
    setValue('issueDate', item.issueDate ? item.issueDate.slice(0, 10) : '');
    setValue('expiryDate', item.expiryDate ? item.expiryDate.slice(0, 10) : '');
    setValue('credentialId', item.credentialId || '');
    setValue('credentialUrl', item.credentialUrl || '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certifications</CardTitle>
        <CardDescription>Add certificates to strengthen your profile credibility.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-zinc-200 p-4">
          <Input label="Certification Name" {...register('name')} error={errors.name?.message} />
          <Input label="Issuing Organization" {...register('issuingOrganization')} error={errors.issuingOrganization?.message} />

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Issue Date" type="date" {...register('issueDate')} error={errors.issueDate?.message} />
            <Input label="Expiry Date" type="date" {...register('expiryDate')} error={errors.expiryDate?.message} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Credential ID" {...register('credentialId')} error={errors.credentialId?.message} />
            <Input label="Credential URL" {...register('credentialUrl')} error={errors.credentialUrl?.message} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" isLoading={isSaving}>
              {submitLabel}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  reset();
                }}
              >
                Cancel Edit
              </Button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-zinc-500">No certifications added yet.</p>
          ) : (
            items.map((item) => (
              <article key={item._id || item.name} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900">{item.name}</p>
                    <p className="text-sm text-zinc-700">{item.issuingOrganization || 'Issuer not specified'}</p>
                    <p className="text-xs text-zinc-500">
                      {item.issueDate ? item.issueDate.slice(0, 10) : 'Unknown'}
                      {item.expiryDate ? ` → ${item.expiryDate.slice(0, 10)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => startEdit(item)} className="rounded p-1 text-zinc-500 hover:bg-zinc-200">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {item._id ? (
                      <button
                        type="button"
                        onClick={() => {
                          void onDelete(item._id || '');
                        }}
                        className="rounded p-1 text-zinc-500 hover:bg-red-100 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
