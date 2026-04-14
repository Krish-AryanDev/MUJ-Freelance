'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import Button from '../../ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import type { MujDetails, UpdateMujDetailsPayload } from '../../../types/user.types';

const MUJ_BRANCHES = [
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Mathematics and Computing',
  'Physics, Chemistry',
  'MBA',
  'MCA',
  'Faculty',
  'Other',
] as const;

const mujSchema = z.object({
  enrollmentNo: z.string().max(40).optional().or(z.literal('')),
  branch: z.enum(MUJ_BRANCHES).optional().or(z.literal('')),
  semester: z.union([z.number(), z.nan()]).transform((value) => (Number.isNaN(value) ? undefined : value)),
  batch: z.string().max(60).optional().or(z.literal('')),
  hostel: z.string().max(80).optional().or(z.literal('')),
});

type MujValues = z.infer<typeof mujSchema>;

interface MujDetailsFormProps {
  initialValues?: MujDetails;
  isSaving?: boolean;
  onSave: (payload: UpdateMujDetailsPayload) => Promise<void>;
}

export default function MujDetailsForm({ initialValues, isSaving = false, onSave }: MujDetailsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MujValues>({
    resolver: zodResolver(mujSchema),
    defaultValues: {
      enrollmentNo: initialValues?.enrollmentNo || '',
      branch:
        initialValues?.branch && MUJ_BRANCHES.includes(initialValues.branch as (typeof MUJ_BRANCHES)[number])
          ? (initialValues.branch as (typeof MUJ_BRANCHES)[number])
          : '',
      semester: initialValues?.semester,
      batch: initialValues?.batch || '',
      hostel: initialValues?.hostel || '',
    },
  });

  const onSubmit = async (values: MujValues) => {
    await onSave({
      mujDetails: {
        enrollmentNo: values.enrollmentNo || undefined,
        branch: values.branch || undefined,
        semester: values.semester,
        batch: values.batch || undefined,
        hostel: values.hostel || undefined,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>MUJ Details</CardTitle>
        <CardDescription>Add campus details to help MUJ clients discover and trust your profile.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Enrollment Number"
            placeholder="Uppercase preferred"
            {...register('enrollmentNo')}
            error={errors.enrollmentNo?.message}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Branch"
              {...register('branch')}
              options={[{ label: 'Select branch', value: '' }, ...MUJ_BRANCHES.map((branch) => ({ label: branch, value: branch }))]}
              error={errors.branch?.message}
            />

            <Select
              label="Semester"
              {...register('semester', { valueAsNumber: true })}
              options={[
                { label: 'Select semester', value: '' },
                ...Array.from({ length: 10 }, (_, index) => ({
                  label: `Semester ${index + 1}`,
                  value: String(index + 1),
                })),
              ]}
              error={errors.semester?.message}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Batch" placeholder="2023-2027" {...register('batch')} error={errors.batch?.message} />
            <Input label="Hostel" placeholder="Hostel A" {...register('hostel')} error={errors.hostel?.message} />
          </div>

          <Button type="submit" isLoading={isSaving}>
            Save MUJ Details
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
