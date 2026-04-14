'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Camera, Image as ImageIcon, Link2 } from 'lucide-react';

import Button from '../../ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import type { FreelancerProfile, UpdateBasicInfoPayload } from '../../../types/user.types';

const basicInfoSchema = z.object({
  tagline: z.string().max(120, 'Tagline must be at most 120 characters').optional().or(z.literal('')),
  location: z.string().max(120, 'Location must be at most 120 characters').optional().or(z.literal('')),
  hourlyRate: z
    .union([z.number(), z.nan()])
    .transform((value) => (Number.isNaN(value) ? undefined : value))
    .refine((value) => value === undefined || value >= 0, 'Hourly rate must be at least 0'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'expert']).optional(),
  responseTime: z
    .enum(['within_an_hour', 'within_a_few_hours', 'within_a_day', 'within_a_few_days'])
    .optional(),
  profileUrl: z.string().max(80, 'Profile URL must be at most 80 characters').optional().or(z.literal('')),
  isAvailable: z.boolean(),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

interface BasicInfoFormProps {
  initialValues?: Partial<FreelancerProfile>;
  isSaving?: boolean;
  onSave: (payload: UpdateBasicInfoPayload) => Promise<void>;
  onUploadAvatar: (formData: FormData) => Promise<void>;
  onUploadCoverImage: (formData: FormData) => Promise<void>;
}

const makeSlug = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export default function BasicInfoForm({
  initialValues,
  isSaving = false,
  onSave,
  onUploadAvatar,
  onUploadCoverImage,
}: BasicInfoFormProps) {
  const [avatarPreview, setAvatarPreview] = useState(initialValues?.avatar || '');
  const [coverPreview, setCoverPreview] = useState(initialValues?.coverImage || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const defaultValues = useMemo<BasicInfoFormValues>(
    () => ({
      tagline: initialValues?.tagline || '',
      location: initialValues?.location || 'Jaipur, Rajasthan',
      hourlyRate: initialValues?.hourlyRate,
      experienceLevel: initialValues?.experienceLevel,
      responseTime: initialValues?.responseTime,
      profileUrl: initialValues?.profileUrl || '',
      isAvailable: initialValues?.isAvailable ?? true,
    }),
    [initialValues],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues,
  });

  const watchedProfileUrl = watch('profileUrl') || '';
  const computedSlug = makeSlug(watchedProfileUrl);
  const slugValid = computedSlug.length > 0 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(computedSlug);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    setAvatarPreview(nextPreview);

    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploadingAvatar(true);
    try {
      await onUploadAvatar(formData);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    setCoverPreview(nextPreview);

    const formData = new FormData();
    formData.append('cover', file);

    setIsUploadingCover(true);
    try {
      await onUploadCoverImage(formData);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const onSubmit = async (values: BasicInfoFormValues) => {
    await onSave({
      tagline: values.tagline || undefined,
      location: values.location || undefined,
      isAvailable: values.isAvailable,
      responseTime: values.responseTime,
      hourlyRate: values.hourlyRate,
      experienceLevel: values.experienceLevel,
      profileUrl: values.profileUrl ? computedSlug : undefined,
    });

    if (values.profileUrl) {
      setValue('profileUrl', computedSlug);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Info</CardTitle>
        <CardDescription>Add your headline, rate, availability, and public profile slug.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-full border border-zinc-200 bg-white">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                      <Camera className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-800">Avatar</p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100">
                    <Camera className="h-3.5 w-3.5" />
                    {isUploadingAvatar ? 'Uploading...' : 'Change'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-20 overflow-hidden rounded-md border border-zinc-200 bg-white">
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-800">Cover</p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {isUploadingCover ? 'Uploading...' : 'Change'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <Input
            label="Tagline"
            placeholder="e.g. Full-stack developer helping startups ship faster"
            {...register('tagline')}
            error={errors.tagline?.message}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Location" placeholder="Jaipur, Rajasthan" {...register('location')} error={errors.location?.message} />
            <Input
              label="Hourly Rate (INR)"
              type="number"
              min={0}
              step={50}
              {...register('hourlyRate', { valueAsNumber: true })}
              error={errors.hourlyRate?.message}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Experience Level"
              {...register('experienceLevel')}
              options={[
                { label: 'Select level', value: '' },
                { label: 'Beginner', value: 'beginner' },
                { label: 'Intermediate', value: 'intermediate' },
                { label: 'Expert', value: 'expert' },
              ]}
              error={errors.experienceLevel?.message}
            />

            <Select
              label="Response Time"
              {...register('responseTime')}
              options={[
                { label: 'Select response time', value: '' },
                { label: 'Within an hour', value: 'within_an_hour' },
                { label: 'Within a few hours', value: 'within_a_few_hours' },
                { label: 'Within a day', value: 'within_a_day' },
                { label: 'Within a few days', value: 'within_a_few_days' },
              ]}
              error={errors.responseTime?.message}
            />
          </div>

          <div className="space-y-2 rounded-lg border border-orange-100 bg-orange-50 p-3">
            <Input
              label="Profile URL Slug"
              placeholder="john-doe-dev"
              {...register('profileUrl')}
              error={errors.profileUrl?.message}
              hint="Only lowercase letters, numbers and hyphens are allowed."
            />
            <div className="flex items-center gap-2 text-xs">
              <Link2 className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-zinc-600">Preview: /profile/</span>
              <span className="font-medium text-zinc-900">{computedSlug || 'your-slug'}</span>
              <span className={slugValid || !watchedProfileUrl ? 'text-green-600' : 'text-red-600'}>
                {watchedProfileUrl ? (slugValid ? 'Valid slug' : 'Slug contains invalid characters') : ''}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" className="h-4 w-4 rounded border-zinc-300" {...register('isAvailable')} />
              Available for new work
            </label>

            <Button type="submit" isLoading={isSaving}>
              Save Basic Info
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
