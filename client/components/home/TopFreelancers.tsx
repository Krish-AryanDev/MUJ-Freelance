'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ExternalLink, Star } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import { searchFreelancers } from '../../services/profile.service';
import type { FreelancerCard } from '../../types/user.types';
import Avatar from '../ui/Avatar';
import Skeleton from '../ui/Skeleton';

// Reuse card mapper logic to safely extract fields
const cardFromProfile = (freelancer: any): FreelancerCard => {
  const user = freelancer.user || {};

  return {
    _id: freelancer._id,
    user: {
      id: user._id || user.id || freelancer._id,
      _id: user._id,
      fullName: user.name || user.fullName || 'Freelancer',
      name: user.name,
      avatar: user.avatar ? { url: user.avatar } : undefined,
      email: user.email || '',
    },
    tagline: freelancer.tagline,
    avatar: freelancer.avatar,
    coverImage: freelancer.coverImage,
    location: freelancer.location,
    isAvailable: Boolean(freelancer.isAvailable),
    responseTime: freelancer.responseTime,
    hourlyRate: freelancer.hourlyRate,
    experienceLevel: freelancer.experienceLevel,
    skills: freelancer.skills || [],
    averageRating: freelancer.averageRating || 0,
    totalReviews: freelancer.totalReviews || 0,
    completedProjects: freelancer.completedProjects || 0,
    profileCompletionScore: freelancer.profileCompletionScore || 0,
    isPremium: Boolean(freelancer.isPremium),
    premiumBadge: freelancer.premiumBadge,
  };
};

export default function TopFreelancers() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['top-freelancers'],
    queryFn: () => searchFreelancers({ sort: 'rating', limit: 12 }),
  });

  const cards = useMemo(() => {
    const freelancers = data?.freelancers || [];
    let mapped = freelancers.map(cardFromProfile);
    
    // Custom sort: rating primary, works secondary, reviews tertiary
    mapped.sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      if (b.completedProjects !== a.completedProjects) {
        return b.completedProjects - a.completedProjects;
      }
      return b.totalReviews - a.totalReviews;
    });
    
    return mapped;
  }, [data?.freelancers]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    
    if (cards.length === 0) return;
    
    const maxScrollLeft = scrollWidth - clientWidth;
    if (maxScrollLeft <= 0) return;
    
    const scrollPercentage = scrollLeft / maxScrollLeft;
    const newIndex = Math.round(scrollPercentage * (cards.length - 1));
    setActiveIndex(newIndex);
  };

  if (isError) {
    return null;
  }

  return (
    <div className="relative mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-black text-[#0f172a] sm:text-4xl">Discover Top Freelancers</h2>
          <p className="mt-2 text-sm text-[#64748b]">Explore standout campus talent across MUJ.</p>
        </div>
        
        <div className="flex w-full items-center justify-between sm:w-auto sm:justify-end gap-3">
          <Link
            href="/freelancers"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0b1220] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172033]"
          >
            View All <ExternalLink className="h-4 w-4" />
          </Link>
          <div className="hidden items-center gap-2 lg:flex">
            <button
              onClick={scrollLeft}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8deeb] bg-white text-[#0f172a] shadow-sm transition hover:bg-gray-50 hover:border-[#94a3b8]"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={scrollRight}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8deeb] bg-white text-[#0f172a] shadow-sm transition hover:bg-gray-50 hover:border-[#94a3b8]"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 h-[1px] w-full bg-black/10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" />

      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 w-[300px] shrink-0 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-6 pt-2"
          >
            {cards.map((card) => (
              <article
                key={card._id}
                className="group relative flex w-[220px] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-2xl border border-[#d8deeb] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] sm:w-[240px]"
              >
                <div className="h-14 w-full shrink-0 bg-gradient-to-r from-blue-50 to-[#f4f6fb]">
                  {card.coverImage && (
                    <img src={typeof card.coverImage === 'string' ? card.coverImage : (card.coverImage as any).url} alt="Cover" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex h-full flex-col justify-between p-3.5 pt-0">
                  <div>
                    <div className="mb-2 flex items-end justify-between -mt-5">
                      <div className="rounded-full border-[3px] border-white bg-white">
                    <Avatar
                      src={card.avatar || card.user.avatar?.url}
                      alt={card.user.fullName || 'Freelancer'}
                      fallback={card.user.fullName || 'F'}
                      size="md"
                      className="h-10 w-10 rounded-full shadow-sm"
                    />
                      </div>
                      <div className="mb-1">
                        {card.isAvailable && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 border border-green-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                  
                  <h3 className="line-clamp-1 text-base font-bold text-[#0f172a]">
                    {card.user.fullName || card.user.name || 'Freelancer'}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-tight text-[#64748b] min-h-[36px]">
                    {card.tagline || 'Talented MUJ Freelancer'}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {card.skills.slice(0, 3).map((skill) => (
                      <span
                        key={`${card._id}-${skill}`}
                        className="rounded-full bg-[#f4f6fb] px-2.5 py-1 text-[11px] font-semibold text-[#475569]"
                      >
                        {skill}
                      </span>
                    ))}
                    {card.skills.length > 3 && (
                      <span className="rounded-full bg-[#f4f6fb] px-2.5 py-1 text-[11px] font-semibold text-[#475569]">
                        +{card.skills.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-3 flex items-center justify-between border-t border-[#f1f5f9] pt-3">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-[#0f172a]">
                        {card.averageRating > 0 ? card.averageRating.toFixed(1) : 'N/A'}
                      </span>
                      <span className="text-xs text-[#94a3b8]">({card.totalReviews})</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-bold text-[#0f172a]">
                        {card.completedProjects > 0 ? card.completedProjects : 0}
                      </span>
                      <span className="ml-1 text-xs text-[#64748b]">Works</span>
                    </div>
                  </div>
                  
                  <Link href={`/profile/${card.user._id || card.user.id}`} className="block w-full">
                    <button
                      type="button"
                      className="w-full rounded-xl bg-[#f4f6fb] py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e2e8f0]"
                    >
                      View Profile
                    </button>
                  </Link>
                </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {!isLoading && cards.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (scrollContainerRef.current) {
                  const container = scrollContainerRef.current;
                  const targetScroll = (container.scrollWidth - container.clientWidth) * (index / (cards.length - 1 || 1));
                  container.scrollTo({ left: targetScroll, behavior: 'smooth' });
                }
              }}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                activeIndex === index ? 'bg-zinc-800' : 'bg-zinc-300 hover:bg-zinc-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div className="mt-8 h-[1px] w-full bg-black/10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
