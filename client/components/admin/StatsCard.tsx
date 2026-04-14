import type { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export default function StatsCard({ title, value, icon: Icon, description }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="mb-1 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-zinc-500" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-zinc-900">{value}</p>
        {description ? <p className="mt-1 text-xs text-zinc-500">{description}</p> : null}
      </CardContent>
    </Card>
  );
}
