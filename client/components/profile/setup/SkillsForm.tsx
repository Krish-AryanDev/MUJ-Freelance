'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { X } from 'lucide-react';

import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import type { SkillDetailed, UpdateSkillsPayload } from '../../../types/user.types';

const MAX_SKILLS = 20;
const popularSkills = [
  'React',
  'Next.js',
  'Node.js',
  'TypeScript',
  'Python',
  'UI/UX',
  'MongoDB',
  'Express',
  'Tailwind CSS',
  'Figma',
];

const skillsSchema = z.object({
  skillInput: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate'),
});

type SkillsFormValues = z.infer<typeof skillsSchema>;

interface SkillsFormProps {
  initialSkills?: SkillDetailed[];
  isSaving?: boolean;
  onSave: (payload: UpdateSkillsPayload) => Promise<void>;
}

export default function SkillsForm({ initialSkills = [], isSaving = false, onSave }: SkillsFormProps) {
  const [skillsDetailed, setSkillsDetailed] = useState<SkillDetailed[]>(initialSkills);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SkillsFormValues>({
    resolver: zodResolver(skillsSchema),
    defaultValues: {
      skillInput: '',
      level: 'intermediate',
    },
  });

  const skillInput = watch('skillInput') || '';
  const level = watch('level');

  const skills = useMemo(() => skillsDetailed.map((item) => item.name), [skillsDetailed]);

  const addSkill = (name: string, selectedLevel: SkillDetailed['level']) => {
    const normalized = name.trim();

    if (!normalized || skillsDetailed.length >= MAX_SKILLS) {
      return;
    }

    const exists = skillsDetailed.some((item) => item.name.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      return;
    }

    setSkillsDetailed((previous) => [...previous, { name: normalized, level: selectedLevel }]);
  };

  const removeSkill = (name: string) => {
    setSkillsDetailed((previous) => previous.filter((item) => item.name !== name));
  };

  const submitSkillInput = () => {
    addSkill(skillInput, level);
    setValue('skillInput', '');
  };

  const onSubmit = async () => {
    await onSave({
      skills,
      skillsDetailed,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardDescription>Add up to 20 skills and set a level for each one.</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <Input
              label="Skill"
              placeholder="Type a skill and press Add"
              {...register('skillInput')}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submitSkillInput();
                }
              }}
              error={errors.skillInput?.message}
            />

            <Select
              label="Level"
              {...register('level')}
              options={[
                { label: 'Beginner', value: 'beginner' },
                { label: 'Intermediate', value: 'intermediate' },
                { label: 'Advanced', value: 'advanced' },
                { label: 'Expert', value: 'expert' },
              ]}
            />

            <div className="mt-6">
              <Button type="button" variant="outline" onClick={submitSkillInput} disabled={skillsDetailed.length >= MAX_SKILLS}>
                Add
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-600">
              <span>{skillsDetailed.length}/{MAX_SKILLS} skills</span>
              <span>{MAX_SKILLS - skillsDetailed.length} slots left</span>
            </div>
            {skillsDetailed.length === 0 ? (
              <p className="text-sm text-zinc-500">No skills added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skillsDetailed.map((skill) => (
                  <span key={skill.name} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm border border-zinc-200">
                    <span>{skill.name}</span>
                    <Badge variant="info" className="capitalize">
                      {skill.level}
                    </Badge>
                    <button type="button" onClick={() => removeSkill(skill.name)} className="text-zinc-400 hover:text-red-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Suggested Skills</p>
            <div className="flex flex-wrap gap-2">
              {popularSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => addSkill(skill, level)}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:border-orange-300 hover:text-orange-700"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" isLoading={isSaving}>
            Save Skills
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
