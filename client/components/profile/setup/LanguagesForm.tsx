'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Trash2 } from 'lucide-react';

import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import type { AddLanguagePayload, Language } from '../../../types/user.types';

const languageSchema = z.object({
  name: z.string().trim().min(1, 'Language name is required').max(60),
  proficiency: z.enum(['basic', 'conversational', 'fluent', 'native']),
});

type LanguageValues = z.infer<typeof languageSchema>;

interface LanguagesFormProps {
  items: Language[];
  isSaving?: boolean;
  onAdd: (payload: AddLanguagePayload) => Promise<void>;
  onDelete: (languageId: string) => Promise<void>;
}

export default function LanguagesForm({ items, isSaving = false, onAdd, onDelete }: LanguagesFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LanguageValues>({
    resolver: zodResolver(languageSchema),
    defaultValues: {
      name: '',
      proficiency: 'conversational',
    },
  });

  const onSubmit = async (values: LanguageValues) => {
    await onAdd(values);
    reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Languages</CardTitle>
        <CardDescription>Add spoken languages and your proficiency levels.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-[1fr_200px_auto]">
          <Input label="Language" placeholder="English" {...register('name')} error={errors.name?.message} />

          <Select
            label="Proficiency"
            {...register('proficiency')}
            options={[
              { label: 'Basic', value: 'basic' },
              { label: 'Conversational', value: 'conversational' },
              { label: 'Fluent', value: 'fluent' },
              { label: 'Native', value: 'native' },
            ]}
          />

          <div className="mt-6">
            <Button type="submit" isLoading={isSaving}>
              Add
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-zinc-500">No languages added yet.</p>
          ) : (
            items.map((item) => (
              <article key={item._id || item.name} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-zinc-900">{item.name}</p>
                  <Badge variant="info" className="capitalize">
                    {item.proficiency}
                  </Badge>
                </div>
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
              </article>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
