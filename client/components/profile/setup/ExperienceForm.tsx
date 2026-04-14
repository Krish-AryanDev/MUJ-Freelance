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
import type { AddExperiencePayload, Experience } from '../../../types/user.types';

const experienceSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(140),
  company: z.string().trim().min(2, 'Company is required').max(140),
  location: z.string().max(120).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  currentlyWorking: z.boolean(),
  description: z.string().max(1800).optional().or(z.literal('')),
  skills: z.string().optional().or(z.literal('')),
});

type ExperienceValues = z.infer<typeof experienceSchema>;

interface ExperienceFormProps {
  items: Experience[];
  isSaving?: boolean;
  onAdd: (payload: AddExperiencePayload) => Promise<void>;
  onUpdate: (payload: { experienceId: string; payload: Partial<AddExperiencePayload> }) => Promise<void>;
  onDelete: (experienceId: string) => Promise<void>;
}

export default function ExperienceForm({ items, isSaving = false, onAdd, onUpdate, onDelete }: ExperienceFormProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ExperienceValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      description: '',
      skills: '',
    },
  });

  const submitLabel = useMemo(() => (editingId ? 'Update Experience' : 'Add Experience'), [editingId]);

  const toSkillsArray = (value?: string): string[] => {
    return String(value || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  };

  const onSubmit = async (values: ExperienceValues) => {
    const payload: AddExperiencePayload = {
      title: values.title,
      company: values.company,
      location: values.location || undefined,
      startDate: values.startDate || undefined,
      endDate: values.currentlyWorking ? undefined : values.endDate || undefined,
      currentlyWorking: values.currentlyWorking,
      description: values.description || undefined,
      skills: toSkillsArray(values.skills),
    };

    if (editingId) {
      await onUpdate({ experienceId: editingId, payload });
      setEditingId(null);
    } else {
      await onAdd(payload);
    }

    reset();
  };

  const startEdit = (item: Experience) => {
    if (!item._id) {
      return;
    }

    setEditingId(item._id);
    setValue('title', item.title);
    setValue('company', item.company);
    setValue('location', item.location || '');
    setValue('startDate', item.startDate ? item.startDate.slice(0, 10) : '');
    setValue('endDate', item.endDate ? item.endDate.slice(0, 10) : '');
    setValue('currentlyWorking', item.currentlyWorking);
    setValue('description', item.description || '');
    setValue('skills', (item.skills || []).join(', '));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Experience</CardTitle>
        <CardDescription>Showcase internships, jobs, and freelance roles.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-zinc-200 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Role Title" {...register('title')} error={errors.title?.message} />
            <Input label="Company" {...register('company')} error={errors.company?.message} />
          </div>

          <Input label="Location" {...register('location')} error={errors.location?.message} />

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Start Date" type="date" {...register('startDate')} error={errors.startDate?.message} />
            <Input label="End Date" type="date" {...register('endDate')} error={errors.endDate?.message} />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" className="h-4 w-4 rounded border-zinc-300" {...register('currentlyWorking')} />
            I currently work here
          </label>

          <Textarea label="Description" rows={3} {...register('description')} error={errors.description?.message} />

          <Input label="Skills Used (comma separated)" {...register('skills')} error={errors.skills?.message} />

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
            <p className="text-sm text-zinc-500">No experience entries yet.</p>
          ) : (
            items.map((item) => (
              <article key={item._id || `${item.title}-${item.company}`} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900">{item.title}</p>
                    <p className="text-sm text-zinc-700">{item.company}</p>
                    <p className="text-xs text-zinc-500">
                      {(item.startDate || '').slice(0, 10) || '-'} - {item.currentlyWorking ? 'Present' : (item.endDate || '').slice(0, 10) || '-'}
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
