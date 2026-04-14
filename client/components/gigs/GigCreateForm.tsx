'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import { GIG_CATEGORIES } from '../../constants/categories';
import type {
  CreateGigRequest,
  Gig,
  GigCategory,
  GigPackage,
  GigPackageTier,
  GigStatus,
  UpdateGigRequest,
} from '../../types/gig.types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

interface GigCreateFormProps {
  initialValues?: Gig;
  mode?: 'create' | 'edit';
  isSubmitting?: boolean;
  onSubmit: (payload: CreateGigRequest | UpdateGigRequest) => Promise<void> | void;
}

interface GigFormState {
  title: string;
  description: string;
  category: GigCategory;
  subcategory: string;
  tags: string;
  status: GigStatus;
  coverImagePreview: string;
  coverImagePublicId: string;
  packages: GigPackage[];
}

const packageTiers: GigPackageTier[] = ['basic', 'standard', 'premium'];

const createEmptyPackage = (tier: GigPackageTier): GigPackage => ({
  tier,
  title: '',
  description: '',
  deliveryDays: 1,
  revisions: 0,
  price: 1,
  features: [],
});

const normalizePackages = (packages: GigPackage[] | undefined): GigPackage[] => {
  return packageTiers.map((tier) => packages?.find((item) => item.tier === tier) ?? createEmptyPackage(tier));
};

const buildInitialState = (initialValues?: Gig): GigFormState => ({
  title: initialValues?.title ?? '',
  description: initialValues?.description ?? '',
  category: initialValues?.category ?? 'WEB_DEVELOPMENT',
  subcategory: initialValues?.subcategory ?? '',
  tags: initialValues?.tags?.join(', ') ?? '',
  status: initialValues?.status === 'active' || initialValues?.status === 'draft' ? initialValues.status : 'draft',
  coverImagePreview: initialValues?.images?.[0]?.url ?? '',
  coverImagePublicId: initialValues?.images?.[0]?.publicId ?? '',
  packages: normalizePackages(initialValues?.packages),
});

const categoryOptions: ReadonlyArray<{ value: GigCategory; label: string }> = [
  { value: 'WEB_DEVELOPMENT', label: 'WEB_DEVELOPMENT' },
  { value: 'APP_DEVELOPMENT', label: 'APP_DEVELOPMENT' },
  { value: 'UI_UX_DESIGN', label: 'UI_UX_DESIGN' },
  { value: 'GRAPHIC_DESIGN', label: 'GRAPHIC_DESIGN' },
  { value: 'VIDEO_EDITING', label: 'VIDEO_EDITING' },
  { value: 'CONTENT_WRITING', label: 'CONTENT_WRITING' },
  { value: 'DIGITAL_MARKETING', label: 'DIGITAL_MARKETING' },
  { value: 'DATA_ANALYTICS', label: 'DATA_ANALYTICS' },
  { value: 'PHOTOGRAPHY', label: 'PHOTOGRAPHY' },
  { value: 'TUTORING', label: 'TUTORING' },
  { value: 'ASSIGNMENT_HELP', label: 'ASSIGNMENT_HELP' },
  { value: 'OTHER', label: 'OTHER' },
];

const packageLabels: Record<GigPackageTier, string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
};

export default function GigCreateForm({
  initialValues,
  mode = 'create',
  isSubmitting = false,
  onSubmit,
}: GigCreateFormProps) {
  const [formState, setFormState] = useState<GigFormState>(() => buildInitialState(initialValues));
  const [selectedCoverImageName, setSelectedCoverImageName] = useState<string>('');

  const derivedCategoryOptions = useMemo(
    () => categoryOptions.map((category) => ({ value: category.value, label: category.label })),
    [],
  );

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
  ];

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();

        const payload = {
          title: formState.title.trim(),
          description: formState.description.trim(),
          category: formState.category,
          subcategory: formState.subcategory.trim(),
          tags: formState.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          status: formState.status,
          images: formState.coverImagePreview.trim()
            ? [
                {
                  url: formState.coverImagePreview.trim(),
                  publicId: formState.coverImagePublicId.trim() || `upload-${Date.now()}`,
                },
              ]
            : [],
          packages: formState.packages.map((pkg) => ({
            ...pkg,
            title: pkg.title.trim(),
            description: pkg.description.trim(),
            features: pkg.features.filter(Boolean),
          })) as [GigPackage, GigPackage, GigPackage],
        };

        void onSubmit(payload);
      }}
    >
      <div className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <Input
          label="Gig Title"
          value={formState.title}
          onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
          required
          minLength={10}
          maxLength={120}
        />

        <Textarea
          label="Description"
          value={formState.description}
          onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
          required
          minLength={40}
          maxLength={6000}
          rows={6}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Category"
            value={formState.category}
            onChange={(event) => {
              setFormState((prev) => ({ ...prev, category: event.target.value as GigCategory }));
            }}
            options={derivedCategoryOptions}
          />

          <Input
            label="Subcategory"
            value={formState.subcategory}
            onChange={(event) => setFormState((prev) => ({ ...prev, subcategory: event.target.value }))}
          />
        </div>

        <Input
          label="Tags"
          hint="Comma-separated tags, for example: react, frontend, api"
          value={formState.tags}
          onChange={(event) => setFormState((prev) => ({ ...prev, tags: event.target.value }))}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900">Cover Image</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) {
                setSelectedCoverImageName('');
                setFormState((prev) => ({ ...prev, coverImagePreview: '', coverImagePublicId: '' }));
                return;
              }

              setSelectedCoverImageName(file.name);

              const reader = new FileReader();
              reader.onload = () => {
                const result = typeof reader.result === 'string' ? reader.result : '';
                setFormState((prev) => ({
                  ...prev,
                  coverImagePreview: result,
                  coverImagePublicId: `upload-${Date.now()}-${file.name.replace(/[^a-z0-9]/gi, '-')}`,
                }));
              };
              reader.readAsDataURL(file);
            }}
          />
          {selectedCoverImageName ? <p className="text-xs text-zinc-500">Selected: {selectedCoverImageName}</p> : null}
          {formState.coverImagePreview ? (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-2">
              <div className="relative h-44 w-full">
                <Image
                  src={formState.coverImagePreview}
                  alt="Cover preview"
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="rounded-md object-cover"
                />
              </div>
            </div>
          ) : null}
        </div>

        <Select
          label="Status"
          value={formState.status}
          onChange={(event) => {
            setFormState((prev) => ({ ...prev, status: event.target.value as GigStatus }));
          }}
          options={statusOptions}
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold">Package Pricing</h3>
        <div className="space-y-4">
          {formState.packages.map((pkg, index) => (
            <div key={pkg.tier} className="rounded-lg border border-zinc-200 p-3">
              <h4 className="mb-3 text-base font-semibold text-zinc-800">{packageLabels[pkg.tier]}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Title"
                  value={pkg.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setFormState((prev) => ({
                      ...prev,
                      packages: prev.packages.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, title } : item,
                      ),
                    }));
                  }}
                  required
                />

                <Input
                  label="Price"
                  type="number"
                  min={1}
                  value={pkg.price}
                  onChange={(event) => {
                    const price = Number(event.target.value);
                    setFormState((prev) => ({
                      ...prev,
                      packages: prev.packages.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, price: Number.isFinite(price) ? price : 1 } : item,
                      ),
                    }));
                  }}
                  required
                />

                <Input
                  label="Delivery Days"
                  type="number"
                  min={1}
                  value={pkg.deliveryDays}
                  onChange={(event) => {
                    const deliveryDays = Number(event.target.value);
                    setFormState((prev) => ({
                      ...prev,
                      packages: prev.packages.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, deliveryDays: Number.isFinite(deliveryDays) ? deliveryDays : 1 }
                          : item,
                      ),
                    }));
                  }}
                  required
                />

                <Input
                  label="Revisions"
                  type="number"
                  min={0}
                  value={pkg.revisions}
                  onChange={(event) => {
                    const revisions = Number(event.target.value);
                    setFormState((prev) => ({
                      ...prev,
                      packages: prev.packages.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, revisions: Number.isFinite(revisions) ? revisions : 0 } : item,
                      ),
                    }));
                  }}
                  required
                />
              </div>

              <Textarea
                label="Description"
                className="mt-3"
                value={pkg.description}
                onChange={(event) => {
                  const description = event.target.value;
                  setFormState((prev) => ({
                    ...prev,
                    packages: prev.packages.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, description } : item,
                    ),
                  }));
                }}
                required
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          {mode === 'edit' ? 'Update Gig' : 'Create Gig'}
        </Button>
      </div>
    </form>
  );
}
