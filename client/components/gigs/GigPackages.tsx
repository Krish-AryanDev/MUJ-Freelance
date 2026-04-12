'use client';

import { useMemo, useState } from 'react';

import type { GigPackage, GigPackageTier } from '../../types/gig.types';
import { classNames } from '../../utils/helpers';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface GigPackagesProps {
  packages: GigPackage[];
}

const packageTierOrder: GigPackageTier[] = ['basic', 'standard', 'premium'];

const formatTierLabel = (tier: GigPackageTier): string => {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
};

export default function GigPackages({ packages }: GigPackagesProps) {
  const normalizedPackages = useMemo(() => {
    return packageTierOrder
      .map((tier) => packages.find((item) => item.tier === tier))
      .filter((item): item is GigPackage => Boolean(item));
  }, [packages]);

  const [selectedTier, setSelectedTier] = useState<GigPackageTier>(normalizedPackages[0]?.tier ?? 'basic');

  const selectedPackage = normalizedPackages.find((item) => item.tier === selectedTier) ?? normalizedPackages[0];

  if (!selectedPackage) {
    return (
      <Card>
        <CardContent>No package details available.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex gap-2">
          {normalizedPackages.map((pkg) => (
            <Button
              key={pkg.tier}
              type="button"
              size="sm"
              variant={selectedTier === pkg.tier ? 'primary' : 'outline'}
              onClick={() => setSelectedTier(pkg.tier)}
              className={classNames('capitalize')}
            >
              {formatTierLabel(pkg.tier)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardTitle className="text-base">{selectedPackage.title}</CardTitle>
        <p className="text-sm text-zinc-600">{selectedPackage.description}</p>
        <div className="text-2xl font-bold text-zinc-900">Rs {selectedPackage.price}</div>
        <div className="flex flex-wrap gap-3 text-sm text-zinc-600">
          <span>{selectedPackage.deliveryDays} days delivery</span>
          <span>{selectedPackage.revisions} revisions</span>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
          {selectedPackage.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
