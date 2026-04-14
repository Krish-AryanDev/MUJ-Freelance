'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Pencil, Trash2 } from 'lucide-react';

import Button from '../../ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import Input from '../../ui/Input';
import Textarea from '../../ui/Textarea';
import type { AddEducationPayload, Education } from '../../../types/user.types';

const educationSchema = z.object({
  institution: z.string().trim().min(2, 'Institution is required').max(180),
  degree: z.string().max(120).optional().or(z.literal('')),
  fieldOfStudy: z.string().max(120).optional().or(z.literal('')),
  startYear: z.union([z.number(), z.nan()]).transform((value) => (Number.isNaN(value) ? undefined : value)),
  endYear: z.union([z.number(), z.nan()]).transform((value) => (Number.isNaN(value) ? undefined : value)),
  currentlyStudying: z.boolean(),
  grade: z.string().max(40).optional().or(z.literal('')),
  description: z.string().max(1200).optional().or(z.literal('')),
});

type EducationValues = z.infer<typeof educationSchema>;

interface EducationFormProps {
  items: Education[];
  isSaving?: boolean;
  onAdd: (payload: AddEducationPayload) => Promise<void>;
  onUpdate: (payload: { educationId: string; payload: Partial<AddEducationPayload> }) => Promise<void>;
  onDelete: (educationId: string) => Promise<void>;
}

export default function EducationForm({ items, isSaving = false, onAdd, onUpdate, onDelete }: EducationFormProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EducationValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startYear: undefined,
      endYear: undefined,
      currentlyStudying: false,
      grade: '',
      description: '',
    },
  });

  const submitLabel = useMemo(() => (editingId ? 'Update Education' : 'Add Education'), [editingId]);

  const onSubmit = async (values: EducationValues) => {
    const payload: AddEducationPayload = {
      institution: values.institution,
      degree: values.degree || undefined,
      fieldOfStudy: values.fieldOfStudy || undefined,
      startYear: values.startYear,
      endYear: values.currentlyStudying ? undefined : values.endYear,
      currentlyStudying: values.currentlyStudying,
      grade: values.grade || undefined,
      description: values.description || undefined,
    };

    if (editingId) {
      await onUpdate({ educationId: editingId, payload });
      setEditingId(null);
    } else {
      await onAdd(payload);
    }

    reset();
  };

  const startEdit = (item: Education) => {
    if (!item._id) {
      return;
    }

    setEditingId(item._id);
    setValue('institution', item.institution);
    setValue('degree', item.degree || '');
    setValue('fieldOfStudy', item.fieldOfStudy || '');
    setValue('startYear', item.startYear);
    setValue('endYear', item.endYear);
    setValue('currentlyStudying', item.currentlyStudying);
    setValue('grade', item.grade || '');
    setValue('description', item.description || '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Education</CardTitle>
        <CardDescription>Add and manage your educational background.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-zinc-200 p-4">
          <Input label="Institution" {...register('institution')} error={errors.institution?.message} />

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Degree" {...register('degree')} error={errors.degree?.message} />
            <Input label="Field of Study" {...register('fieldOfStudy')} error={errors.fieldOfStudy?.message} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Start Year"
              type="number"
              {...register('startYear', { valueAsNumber: true })}
              error={errors.startYear?.message}
            />
            <Input
              label="End Year"
              type="number"
              {...register('endYear', { valueAsNumber: true })}
              error={errors.endYear?.message}
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" className="h-4 w-4 rounded border-zinc-300" {...register('currentlyStudying')} />
            I am currently studying here
          </label>

          <Input label="Grade" {...register('grade')} error={errors.grade?.message} />

          <Textarea label="Description" rows={3} {...register('description')} error={errors.description?.message} />

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
            <p className="text-sm text-zinc-500">No education entries yet.</p>
          ) : (
            items.map((item) => (
              <article key={item._id || item.institution} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900">{item.institution}</p>
                    <p className="text-sm text-zinc-700">
                      {[item.degree, item.fieldOfStudy].filter(Boolean).join(' • ') || 'No degree details'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {item.startYear || '-'} - {item.currentlyStudying ? 'Present' : item.endYear || '-'}
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
