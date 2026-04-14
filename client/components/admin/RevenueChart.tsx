'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { RevenuePoint } from '@/types/admin.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface RevenueChartProps {
  data: RevenuePoint[];
}

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const chartDataFromPoints = (data: RevenuePoint[]) =>
  data.map((item) => ({
    month: monthFormatter.format(new Date(2024, item.month - 1, 1)),
    revenue: item.value,
  }));

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = chartDataFromPoints(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
              <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#18181b" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
