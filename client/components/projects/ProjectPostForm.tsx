'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { GIG_CATEGORIES } from '../../constants/categories';
import type { CreateProjectRequest, Project } from '../../types/project.types';
import toast from '../../utils/toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

const projectPostSchema = z
  .object({
    title: z.string().trim().min(10, 'Title must be at least 10 characters'),
    description: z.string().trim().min(50, 'Description must be at least 50 characters'),
    category: z.string().trim().min(1, 'Category is required'),
    budgetType: z.enum(['fixed', 'hourly']),
    budgetMin: z.coerce.number().min(1, 'Minimum budget must be at least 1'),
    budgetMax: z.coerce.number().min(1, 'Maximum budget must be at least 1'),
    deadline: z.string().refine((value) => {
      const parsed = new Date(value);
      return !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
    }, 'Deadline must be a future date'),
  })
  .refine((value) => value.budgetMax >= value.budgetMin, {
    path: ['budgetMax'],
    message: 'Maximum budget must be greater than or equal to minimum budget',
  });

type ProjectPostFormInput = z.input<typeof projectPostSchema>;
type ProjectFormData = CreateProjectRequest;

interface ProjectPostFormProps {
  initialData?: Project;
  isLoading?: boolean;
  onSubmit: (payload: ProjectFormData) => Promise<void>;
}

export default function ProjectPostForm({
  initialData,
  isLoading = false,
  onSubmit,
}: ProjectPostFormProps) {
  const [skillsInput, setSkillsInput] = useState(initialData?.skillsRequired?.join(', ') ?? '');
  const [attachmentFiles, setAttachmentFiles] = useState<Array<{ name: string; url: string }>>(
    initialData?.attachments ?? [],
  );

  const isEditing = Boolean(initialData);

  const categoryOptions = useMemo(
    () => GIG_CATEGORIES.map((category) => ({ value: category.value, label: category.label })),
    [],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectPostFormInput>({
    resolver: zodResolver(projectPostSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      category: initialData?.category ?? 'WEB_DEVELOPMENT',
      budgetType: initialData?.budget.type ?? 'fixed',
      budgetMin: initialData?.budget.min ?? 1000,
      budgetMax: initialData?.budget.max ?? 5000,
      deadline: initialData?.deadline ? new Date(initialData.deadline).toISOString().slice(0, 10) : '',
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        void handleSubmit(async (values) => {
          const parsedValues = projectPostSchema.parse(values);
          const skillsRequired = skillsInput
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean);

          const payload: ProjectFormData = {
            title: parsedValues.title,
            description: parsedValues.description,
            category: parsedValues.category as Project['category'],
            skillsRequired,
            budget: {
              type: parsedValues.budgetType,
              min: parsedValues.budgetMin,
              max: parsedValues.budgetMax,
              currency: 'INR',
            },
            deadline: new Date(parsedValues.deadline).toISOString(),
            attachments: attachmentFiles,
          };

          try {
            await onSubmit(payload);
            toast.success(
              isEditing ? 'Project updated' : 'Project posted',
              isEditing ? 'Your project has been updated successfully.' : 'Your project has been posted successfully.',
            );
          } catch (error) {
            toast.error(
              isEditing ? 'Unable to update project' : 'Unable to post project',
              error instanceof Error ? error.message : 'Please try again.',
            );
          }
        })(event);
      }}
    >
      <Input label="Title" error={errors.title?.message} {...register('title')} />

      <Textarea
        label="Description"
        rows={6}
        error={errors.description?.message}
        {...register('description')}
      />

      <Select label="Category" options={categoryOptions} error={errors.category?.message} {...register('category')} />

      <Input
        label="Skills Required"
        hint="Comma-separated tags. Example: react, node, mongodb"
        value={skillsInput}
        onChange={(event) => setSkillsInput(event.target.value)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-900">Budget Type</p>
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input type="radio" value="fixed" {...register('budgetType')} />
            Fixed
          </label>
          <label className="ml-4 inline-flex items-center gap-2 text-sm text-zinc-700">
            <input type="radio" value="hourly" {...register('budgetType')} />
            Hourly
          </label>
        </div>

        <Input type="date" label="Deadline" error={errors.deadline?.message} {...register('deadline')} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type="number"
          min={1}
          label="Budget Min"
          error={errors.budgetMin?.message}
          {...register('budgetMin')}
        />
        <Input
          type="number"
          min={1}
          label="Budget Max"
          error={errors.budgetMax?.message}
          {...register('budgetMax')}
        />
      </div>

      <div className="space-y-2">
        <Input
          type="file"
          label="Attachments"
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);

            if (files.length === 0) {
              return;
            }

            void Promise.all(
              files.map(
                (file) =>
                  new Promise<{ name: string; url: string }>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      resolve({ name: file.name, url: typeof reader.result === 'string' ? reader.result : '' });
                    };
                    reader.readAsDataURL(file);
                  }),
              ),
            ).then((items) => {
              setAttachmentFiles((current) => [...current, ...items.filter((item) => Boolean(item.url))]);
            });
          }}
        />
        {attachmentFiles.length > 0 ? (
          <div className="space-y-1 text-xs text-zinc-600">
            {attachmentFiles.map((file) => (
              <p key={`${file.name}-${file.url.slice(0, 20)}`}>{file.name}</p>
            ))}
          </div>
        ) : null}
      </div>

      <Button type="submit" isLoading={isLoading}>
        {isEditing ? 'Update Project' : 'Submit Project'}
      </Button>
    </form>
  );
}

export type { ProjectFormData, ProjectPostFormProps };