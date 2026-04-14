'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import Button from '../../ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import Textarea from '../../ui/Textarea';
import type { UpdateAboutPayload } from '../../../types/user.types';

const aboutSchema = z.object({
  about: z
    .string()
    .trim()
    .min(40, 'About section should be at least 40 characters')
    .max(2000, 'About section must be 2000 characters or less'),
});

type AboutFormValues = z.infer<typeof aboutSchema>;

interface AboutFormProps {
  initialAbout?: string;
  isSaving?: boolean;
  onSave: (payload: UpdateAboutPayload) => Promise<void>;
}

export default function AboutForm({ initialAbout = '', isSaving = false, onSave }: AboutFormProps) {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<AboutFormValues>({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      about: initialAbout,
    },
  });

  const aboutValue = watch('about') || '';

  const onSubmit = async (values: AboutFormValues) => {
    await onSave({ about: values.about });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>About Me</CardTitle>
        <CardDescription>
          Share your strengths, project outcomes, and what kind of clients you want to work with.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Textarea
            rows={8}
            label="Professional Summary"
            placeholder="Tip: Start with your role, mention years of experience, then list your strongest skills and measurable outcomes."
            {...register('about')}
            error={errors.about?.message}
          />

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Write in first person and keep it clear and client-focused.</span>
            <span className={aboutValue.length > 1800 ? 'text-orange-600' : ''}>{aboutValue.length}/2000</span>
          </div>

          <Button type="submit" isLoading={isSaving}>
            Save About Section
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
