import { format } from 'date-fns';

import { GIG_CATEGORIES } from '../../constants/categories';
import type { Gig } from '../../types/gig.types';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import GigImageSlider from './GigImageSlider';
import GigPackages from './GigPackages';

interface GigDetailProps {
  gig: Gig;
}

const resolveCategoryLabel = (category: string): string => {
  return GIG_CATEGORIES.find((item) => item.value === category)?.label ?? category.replaceAll('_', ' ');
};

export default function GigDetail({ gig }: GigDetailProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
      <div className="space-y-4">
        <GigImageSlider images={gig.images} title={gig.title} />

        <Card>
          <CardHeader>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge>{resolveCategoryLabel(gig.category)}</Badge>
              <Badge variant="info">{gig.status}</Badge>
            </div>
            <CardTitle className="text-2xl">{gig.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed text-zinc-700">{gig.description}</p>

            <div className="flex flex-wrap gap-2">
              {gig.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
                  #{tag}
                </span>
              ))}
            </div>

            {gig.faqs.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Frequently asked questions</h3>
                <div className="space-y-3">
                  {gig.faqs.map((faq) => (
                    <div key={faq.question} className="rounded-lg border border-zinc-200 p-3">
                      <p className="font-medium text-zinc-900">{faq.question}</p>
                      <p className="mt-1 text-sm text-zinc-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Avatar src={gig.createdBy.avatar?.url} fallback={gig.createdBy.fullName} size="lg" />
            <div>
              <p className="font-semibold text-zinc-900">{gig.createdBy.fullName}</p>
              <p className="text-sm text-zinc-600">{gig.totalOrders} completed orders</p>
              <p className="text-xs text-zinc-500">Joined {format(new Date(gig.createdAt), 'MMM yyyy')}</p>
            </div>
          </CardContent>
        </Card>

        <GigPackages packages={gig.packages} />
      </div>
    </div>
  );
}
