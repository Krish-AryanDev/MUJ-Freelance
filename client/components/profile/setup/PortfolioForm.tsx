'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ExternalLink, Github, Pencil, Trash2 } from 'lucide-react';

import Button from '../../ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import Input from '../../ui/Input';
import Textarea from '../../ui/Textarea';
import type { AddPortfolioPayload, PortfolioItem } from '../../../types/user.types';

const portfolioSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(120),
  description: z.string().max(1500).optional().or(z.literal('')),
  imageUrl: z.string().url('Image URL must be valid').optional().or(z.literal('')),
  projectUrl: z.string().url('Project URL must be valid').optional().or(z.literal('')),
  githubUrl: z.string().url('GitHub URL must be valid').optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  completedAt: z.string().optional().or(z.literal('')),
});

type PortfolioValues = z.infer<typeof portfolioSchema>;

interface PortfolioFormProps {
  items: PortfolioItem[];
  isSaving?: boolean;
  onAdd: (payload: AddPortfolioPayload) => Promise<void>;
  onUpdate: (payload: { portfolioId: string; payload: Partial<AddPortfolioPayload> }) => Promise<void>;
  onDelete: (portfolioId: string) => Promise<void>;
}

const toTags = (value?: string): string[] => {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export default function PortfolioForm({ items, isSaving = false, onAdd, onUpdate, onDelete }: PortfolioFormProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PortfolioValues>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      projectUrl: '',
      githubUrl: '',
      tags: '',
      completedAt: '',
    },
  });

  const submitLabel = useMemo(() => (editingId ? 'Update Portfolio Item' : 'Add Portfolio Item'), [editingId]);

  const onSubmit = async (values: PortfolioValues) => {
    const payload: AddPortfolioPayload = {
      title: values.title,
      description: values.description || undefined,
      imageUrl: values.imageUrl || undefined,
      projectUrl: values.projectUrl || undefined,
      githubUrl: values.githubUrl || undefined,
      tags: toTags(values.tags),
      completedAt: values.completedAt || undefined,
    };

    if (editingId) {
      await onUpdate({ portfolioId: editingId, payload });
      setEditingId(null);
    } else {
      await onAdd(payload);
    }

    reset();
  };

  const startEdit = (item: PortfolioItem) => {
    if (!item._id) {
      return;
    }

    setEditingId(item._id);
    setValue('title', item.title);
    setValue('description', item.description || '');
    setValue('imageUrl', item.imageUrl || '');
    setValue('projectUrl', item.projectUrl || '');
    setValue('githubUrl', item.githubUrl || '');
    setValue('tags', (item.tags || []).join(', '));
    setValue('completedAt', item.completedAt ? item.completedAt.slice(0, 10) : '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio</CardTitle>
        <CardDescription>Show your best projects with links, tags, and visuals.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-zinc-200 p-4">
          <Input label="Project Title" {...register('title')} error={errors.title?.message} />
          <Textarea label="Description" rows={3} {...register('description')} error={errors.description?.message} />

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Image URL" {...register('imageUrl')} error={errors.imageUrl?.message} />
            <Input label="Project URL" {...register('projectUrl')} error={errors.projectUrl?.message} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="GitHub URL" {...register('githubUrl')} error={errors.githubUrl?.message} />
            <Input label="Completed At" type="date" {...register('completedAt')} error={errors.completedAt?.message} />
          </div>

          <Input label="Tags (comma separated)" {...register('tags')} error={errors.tags?.message} />

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

        <div className="grid gap-4 sm:grid-cols-2">
          {items.length === 0 ? (
            <p className="text-sm text-zinc-500">No portfolio items yet.</p>
          ) : (
            items.map((item) => (
              <article key={item._id || item.title} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.title} className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-zinc-100 text-sm text-zinc-500">No image</div>
                )}

                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-zinc-900">{item.title}</h4>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => startEdit(item)} className="rounded p-1 text-zinc-500 hover:bg-zinc-100">
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

                  {item.tags && item.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.slice(0, 4).map((tag) => (
                        <span key={`${item.title}-${tag}`} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3 text-xs">
                    {item.projectUrl ? (
                      <a href={item.projectUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" /> Project
                      </a>
                    ) : null}
                    {item.githubUrl ? (
                      <a href={item.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-zinc-700 hover:underline">
                        <Github className="h-3.5 w-3.5" /> GitHub
                      </a>
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
