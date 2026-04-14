'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Github, Globe, Instagram, Linkedin, Palette, PenSquare, Twitter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import Button from '../../ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import Input from '../../ui/Input';
import type { SocialLinks, UpdateSocialLinksPayload } from '../../../types/user.types';

const urlSchema = z.string().url('Please enter a valid URL').optional().or(z.literal(''));

const socialSchema = z.object({
  linkedin: urlSchema,
  github: urlSchema,
  twitter: urlSchema,
  behance: urlSchema,
  dribbble: urlSchema,
  website: urlSchema,
  instagram: urlSchema,
});

type SocialValues = z.infer<typeof socialSchema>;

interface SocialLinksFormProps {
  initialValues?: SocialLinks;
  isSaving?: boolean;
  onSave: (payload: UpdateSocialLinksPayload) => Promise<void>;
}

const platformMeta = [
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'github', label: 'GitHub', icon: Github },
  { key: 'twitter', label: 'Twitter / X', icon: Twitter },
  { key: 'behance', label: 'Behance', icon: Palette },
  { key: 'dribbble', label: 'Dribbble', icon: PenSquare },
  { key: 'website', label: 'Website', icon: Globe },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
] as const;

export default function SocialLinksForm({ initialValues, isSaving = false, onSave }: SocialLinksFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SocialValues>({
    resolver: zodResolver(socialSchema),
    defaultValues: {
      linkedin: initialValues?.linkedin || '',
      github: initialValues?.github || '',
      twitter: initialValues?.twitter || '',
      behance: initialValues?.behance || '',
      dribbble: initialValues?.dribbble || '',
      website: initialValues?.website || '',
      instagram: initialValues?.instagram || '',
    },
  });

  const onSubmit = async (values: SocialValues) => {
    await onSave({
      socialLinks: {
        linkedin: values.linkedin || undefined,
        github: values.github || undefined,
        twitter: values.twitter || undefined,
        behance: values.behance || undefined,
        dribbble: values.dribbble || undefined,
        website: values.website || undefined,
        instagram: values.instagram || undefined,
      },
    });
  };

  const watched = watch();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
        <CardDescription>Add your professional links so clients can validate your work.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {platformMeta.map((platform) => {
            const Icon = platform.icon;
            const value = watched[platform.key] || '';
            const hasValue = value.length > 0;

            return (
              <div key={platform.key} className="grid items-end gap-2 sm:grid-cols-[1fr_auto]">
                <div>
                  <Input
                    label={platform.label}
                    placeholder={`https://${platform.key}.com/your-profile`}
                    {...register(platform.key)}
                    error={errors[platform.key]?.message}
                  />
                </div>
                {hasValue ? (
                  <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-1 inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                  >
                    <Icon className="h-3.5 w-3.5" /> Preview
                  </a>
                ) : (
                  <span className="mb-1 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-400">
                    <Icon className="h-3.5 w-3.5" /> Not set
                  </span>
                )}
              </div>
            );
          })}

          <Button type="submit" isLoading={isSaving}>
            Save Social Links
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
