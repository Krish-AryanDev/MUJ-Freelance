'use client';

import {
  ArrowRight,
  Bell,
  CheckCircle,
  DollarSign,
  Gauge,
  Lock,
  MessageCircle,
  Puzzle,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';

import EmptyState from '../../components/shared/EmptyState';
import { useAuth } from '../../hooks/useAuth';

const popularSearches = [
  'Web Development',
  'UI/UX Design',
  'Video Editing',
  'Content Writing',
  'Data Analysis',
  'Mobile App',
] as const;

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'client' | 'freelancer'>('client');

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = searchQuery.trim();

    if (!normalized) {
      router.push('/search');
      return;
    }

    router.push(`/search?q=${encodeURIComponent(normalized)}`);
  };

  const advantageCards = [
    {
      title: 'Embedded Security',
      description: 'Secure flows, protected actions, and trusted collaboration from project start to payout.',
      icon: ShieldCheck,
      tone: 'from-[#0f172a] to-[#111827]',
    },
    {
      title: 'Outstanding Performance',
      description: 'Fast discovery, responsive workflows, and reliable delivery for both clients and freelancers.',
      icon: Gauge,
      tone: 'from-[#111827] to-[#18181b]',
    },
    {
      title: 'Customized For MUJ',
      description: 'Purpose-built for students and faculty with practical tools for campus-first freelancing.',
      icon: Puzzle,
      tone: 'from-[#1f2937] to-[#111827]',
    },
  ] as const;

  return (
    <main className="min-h-screen bg-[#f4f6fb] text-[#0f172a]">
      <section className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-orange-50 via-white to-blue-50 overflow-hidden flex flex-col">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(250,137,53,0.24),transparent_32%),radial-gradient(circle_at_82%_16%,rgba(37,99,235,0.18),transparent_34%),linear-gradient(180deg,#f7f8fc_0%,#f0f3f9_100%)]" />
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full border border-[#d6dbe7]" />
          <div className="absolute right-[-140px] top-[-110px] h-80 w-80 rounded-full border border-[#d6dbe7]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-10 flex-1 w-full">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d8deeb] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#334155]">
                <Sparkles className="h-3.5 w-3.5 text-[#fb923c]" />
                Built For MUJ Students & Faculty
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight text-[#0b1220] sm:text-5xl lg:text-6xl">
                Next-Level
                <br />
                <span className="inline-flex items-center gap-2 rounded-xl bg-[#0b1220] px-3 py-1 text-white">
                  Talent Storage
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#fb923c]" />
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base text-[#475569] sm:text-lg">
                Discover MUJ freelancers, hire confidently, and collaborate in one polished workspace designed
                for real outcomes.
              </p>

              <div className="mt-16 flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/freelancers"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0b1220] px-6 py-3 font-semibold text-white transition hover:bg-[#172033]"
                    >
                      Browse Freelancers <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/projects"
                      className="rounded-xl border border-[#cad3e4] bg-white px-6 py-3 font-semibold text-[#0f172a] transition hover:border-[#94a3b8]"
                    >
                      Explore Projects
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0b1220] px-6 py-3 font-semibold text-white transition hover:bg-[#172033]"
                    >
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/learn-more"
                      className="rounded-xl border border-[#cad3e4] bg-white px-6 py-3 font-semibold text-[#0f172a] transition hover:border-[#94a3b8]"
                    >
                      Learn More
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="relative lg:pl-8">
              <div className="rounded-[2rem] border border-[#d8deeb] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="rounded-3xl bg-[#0b1220] p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/70">Live Metrics</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-2xl font-bold">120K</p>
                      <p className="mt-1 text-xs text-white/70">Searches completed</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-2xl font-bold">70%</p>
                      <p className="mt-1 text-xs text-white/70">Repeat hiring rate</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/20 bg-white/5 p-4">
                    <p className="text-sm font-semibold">Secure workspaces active</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                      <div className="h-full w-4/5 rounded-full bg-[#fb923c]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-5 rounded-2xl border border-[#d8deeb] bg-white px-4 py-3 shadow-lg">
                <p className="text-xs uppercase tracking-wide text-[#64748b]">Community</p>
                <p className="text-base font-bold text-[#0f172a]">500+ MUJ creators</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 bg-[#0b1220] py-5 overflow-hidden flex-shrink-0 border-y border-white/10">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(3)].map((_, arrayIndex) => (
              <div key={arrayIndex} className="flex">
                {[
                  'WEB DEVELOPMENT',
                  'UI/UX DESIGN',
                  'VIDEO EDITING',
                  'CONTENT WRITING',
                  'DATA ANALYSIS',
                  'MOBILE APP',
                  'GRAPHIC DESIGN',
                  'DIGITAL MARKETING',
                  'MACHINE LEARNING',
                  'CLOUD COMPUTING',
                ].map((item, index) => (
                  <span
                    key={`${arrayIndex}-${index}`}
                    className="mx-8 text-white text-sm font-semibold tracking-widest"
                  >
                    {item}
                    <span className="mx-6 text-orange-500">+</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b1220] px-4 py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Share files and outcomes</p>
            <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">
              Simplify the way you share, hire, and deliver work with focused collaboration.
            </h2>
            <p className="mt-4 max-w-2xl text-sm text-[#cbd5e1] sm:text-base">
              The platform aligns campus talent with project goals through transparent communication,
              verified profiles, and protected transactions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-3xl border border-white/15 bg-white/5 p-5">
              <p className="text-3xl font-black text-white">120K</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#94a3b8]">Completed task sessions</p>
            </article>
            <article className="rounded-3xl border border-white/15 bg-white/5 p-5">
              <p className="text-3xl font-black text-white">70%</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#94a3b8]">Collaboration retention</p>
            </article>
            <article className="rounded-3xl border border-white/15 bg-white/5 p-5 sm:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#e2e8f0]">
                <Lock className="h-4 w-4 text-[#fb923c]" />
                Security-first workspace for MUJ
              </div>
              <p className="mt-2 text-sm text-[#94a3b8]">Protected actions, stable delivery flows, and account-safe interactions.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f6fb] px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-[#0f172a] sm:text-4xl">Unmatched Competitive Advantages</h2>
              <p className="mt-2 max-w-2xl text-sm text-[#64748b]">Designed to feel premium while staying practical for daily freelance work.</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {advantageCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className={`rounded-[1.8rem] bg-gradient-to-br ${card.tone} p-6 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]`}
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold">{card.title}</h3>
                  <p className="mt-2 text-sm text-white/80">{card.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f8fc] px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <EmptyState
            title="Discover top MUJ freelancers"
            description="Explore complete freelancer profiles and connect directly for your requirements."
            actionLabel="Browse Freelancers"
            actionHref="/freelancers"
          />
        </div>
      </section>

      <section className="bg-[#f7f8fc] px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black text-[#0f172a] sm:text-4xl">How MUJ Freelance Works</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[#64748b] sm:text-base">
              Start quickly with a clean workflow for both clients and freelancers.
            </p>
          </div>

          <div className="mx-auto mb-10 flex max-w-xs rounded-full border border-[#d8deeb] bg-white p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('client')}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'client' ? 'bg-[#0f172a] text-white' : 'text-[#64748b]'
              }`}
            >
              I&apos;m a Client
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('freelancer')}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'freelancer' ? 'bg-[#0f172a] text-white' : 'text-[#64748b]'
              }`}
            >
              I&apos;m a Freelancer
            </button>
          </div>

          {activeTab === 'client' ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <article className="rounded-3xl border border-[#d8deeb] bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e0ecff] text-[#2563eb]">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a]">Post or Browse</h3>
                <p className="mt-2 text-sm text-[#64748b]">Describe your need or post a project for campus talent.</p>
              </article>

              <article className="rounded-3xl border border-[#d8deeb] bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e0ecff] text-[#2563eb]">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a]">Select Talent</h3>
                <p className="mt-2 text-sm text-[#64748b]">Compare profiles, communicate clearly, and hire with confidence.</p>
              </article>

              <article className="rounded-3xl border border-[#d8deeb] bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e0ecff] text-[#2563eb]">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a]">Receive Delivery</h3>
                <p className="mt-2 text-sm text-[#64748b]">Track progress, review output, and complete with secure payment.</p>
              </article>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <article className="rounded-3xl border border-[#d8deeb] bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7] text-[#15803d]">
                  <UserPlus className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a]">Build Your Profile</h3>
                <p className="mt-2 text-sm text-[#64748b]">Present skills, pricing, and strengths in a trusted MUJ format.</p>
              </article>

              <article className="rounded-3xl border border-[#d8deeb] bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7] text-[#15803d]">
                  <Bell className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a]">Get Orders</h3>
                <p className="mt-2 text-sm text-[#64748b]">Receive project opportunities and submit clear proposals.</p>
              </article>

              <article className="rounded-3xl border border-[#d8deeb] bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7] text-[#15803d]">
                  <DollarSign className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a]">Deliver & Earn</h3>
                <p className="mt-2 text-sm text-[#64748b]">Submit quality work on time and receive secure payouts.</p>
              </article>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#0b1220] px-4 py-16">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-gradient-to-r from-white/5 to-white/[0.02] px-6 py-10 text-center sm:px-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/85">
            <Sparkles className="h-3.5 w-3.5 text-[#fb923c]" /> MUJ Freelance
          </div>
          <h2 className="text-3xl font-black text-white sm:text-4xl">Your data security is our first priority</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#cbd5e1] sm:text-base">
            Start hiring or freelancing with a platform tuned for reliability, clarity, and campus-scale trust.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/register"
                  className="rounded-xl bg-white px-7 py-3 font-semibold text-[#0f172a] transition hover:bg-[#e2e8f0]"
                >
                  Join as Freelancer
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl border border-white/35 px-7 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Hire a Freelancer
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/freelancers"
                  className="rounded-xl bg-white px-7 py-3 font-semibold text-[#0f172a] transition hover:bg-[#e2e8f0]"
                >
                  Browse Freelancers
                </Link>
                <Link
                  href="/projects"
                  className="rounded-xl border border-white/35 px-7 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Post a Project
                </Link>
              </>
            )}

            <Link
              href="/messages"
              className="inline-flex items-center gap-2 rounded-xl border border-[#fb923c]/80 px-7 py-3 font-semibold text-[#fed7aa] transition hover:bg-[#fb923c]/15"
            >
              <MessageCircle className="h-4 w-4" /> Let&apos;s Talk
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
