'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';

import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import type { ProfileCompletionTip } from '../../../types/user.types';

interface ProfileCompletionCardProps {
  score: number;
  tips: ProfileCompletionTip[];
  onTipClick?: (section: string) => void;
}

const getScoreColor = (score: number): string => {
  if (score < 40) {
    return 'text-red-600';
  }

  if (score < 70) {
    return 'text-yellow-600';
  }

  return 'text-green-600';
};

const getProgressColor = (score: number): string => {
  if (score < 40) {
    return 'stroke-red-500';
  }

  if (score < 70) {
    return 'stroke-yellow-500';
  }

  return 'stroke-green-500';
};

export default function ProfileCompletionCard({ score, tips, onTipClick }: ProfileCompletionCardProps) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (normalizedScore / 100) * circumference;

  return (
    <Card className="overflow-hidden border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <CardHeader>
        <CardTitle>Profile Completion</CardTitle>
        <CardDescription>Complete more sections to rank better in search results.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="42" className="fill-none stroke-zinc-200" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                className={`fill-none transition-all duration-500 ${getProgressColor(normalizedScore)}`}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-bold ${getScoreColor(normalizedScore)}`}>{normalizedScore}%</span>
            </div>
          </div>

          <div className="space-y-1 text-sm text-zinc-700">
            <p className="font-semibold text-zinc-900">Your profile is {normalizedScore}% complete</p>
            <p>Improve your score by completing the suggested sections below.</p>
          </div>
        </div>

        <div className="space-y-2">
          {tips.map((tip) => (
            <button
              key={`${tip.section}-${tip.points}`}
              type="button"
              onClick={() => onTipClick?.(tip.section)}
              className="flex w-full items-start justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left transition hover:border-orange-200 hover:bg-orange-50"
            >
              <div className="flex items-start gap-2">
                {tip.completed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 text-orange-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-zinc-900">{tip.section}</p>
                  <p className="text-xs text-zinc-600">{tip.tip}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-zinc-700">+{tip.points}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
