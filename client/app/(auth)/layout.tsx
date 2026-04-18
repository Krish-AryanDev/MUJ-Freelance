import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <section className="h-screen w-full overflow-hidden bg-[#223428]">
      <div className="flex h-full w-full items-stretch justify-center border border-[#324f3a] bg-[#2b4632] shadow-[0_20px_55px_rgba(12,28,17,0.45)]">
        <div className="grid h-full w-full grid-cols-1 overflow-hidden bg-[#d9efbb] lg:grid-cols-[1.02fr_0.98fr]">
          <aside className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_18%_14%,#e7f7d2_0%,#c8eaa1_40%,#97cf73_100%)] lg:block">
            <div className="absolute inset-x-0 bottom-0 h-[32%] bg-[linear-gradient(180deg,#4f8c57_0%,#2f6545_55%,#1f4330_100%)]" />
            <div className="absolute left-8 top-8 h-20 w-20 rounded-2xl bg-white/70 shadow-[0_10px_20px_rgba(23,52,34,0.18)]" />
            <div className="absolute left-14 top-14 h-2 w-12 rounded-full bg-[#99b99a]" />
            <div className="absolute left-24 top-16 h-2 w-8 rounded-full bg-[#bfd3bf]" />
            <div className="absolute left-1/2 top-14 h-10 w-10 -translate-x-1/2 rounded-full border-2 border-[#4a5e4e] bg-white/70" />
            <div className="absolute left-1/2 top-[3.9rem] h-1 w-1 -translate-x-1/2 rounded-full bg-[#2f3f35]" />

            <div className="absolute bottom-20 left-[18%] h-40 w-[240px] rounded-[18px] bg-[linear-gradient(180deg,#2f8858_0%,#1d5f40_100%)] shadow-[0_20px_32px_rgba(20,53,34,0.38)]" />
            <div className="absolute bottom-14 left-[22%] h-7 w-[170px] rounded-full bg-[#224a35]/45 blur-[1px]" />
            <div className="absolute bottom-[11.5rem] left-[30%] h-[150px] w-24 rounded-[26px] bg-[linear-gradient(180deg,#98c879_0%,#5fa151_100%)]" />
            <div className="absolute bottom-[14.8rem] left-[31.8%] h-14 w-14 rounded-full bg-[#f0d8ba]" />
            <div className="absolute bottom-[14.3rem] left-[38%] h-5 w-5 rounded-full bg-[#2f3f35]" />
            <div className="absolute bottom-[15.2rem] left-[33.8%] h-1.5 w-1.5 rounded-full bg-[#2f3f35]" />
            <div className="absolute bottom-[15.2rem] left-[36.3%] h-1.5 w-1.5 rounded-full bg-[#2f3f35]" />
            <div className="absolute bottom-[14.4rem] left-[34.4%] h-1 w-4 rounded-full bg-[#995f43]" />

            <div className="absolute bottom-[10.7rem] left-[26%] h-8 w-[210px] rounded-[10px] bg-[#1f6b4a]" />
            <div className="absolute bottom-[2.1rem] left-[22.8%] h-[130px] w-[8px] rounded-full bg-[#ebf3e6]" />
            <div className="absolute bottom-[2.1rem] left-[50.2%] h-[130px] w-[8px] rounded-full bg-[#ebf3e6]" />

            <div className="absolute bottom-[4.4rem] right-12 h-[150px] w-20 rounded-[38px_38px_14px_14px] bg-[linear-gradient(180deg,#7fb17f_0%,#4f7f57_100%)]" />
            <div className="absolute bottom-[3.2rem] right-9 h-[54px] w-[86px] rounded-xl bg-white/80" />

            <div className="absolute left-8 top-8 rounded-full border border-[#c4dfbd] bg-white/75 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-[#3f6146]">
              MUJ FREELANCE
            </div>
          </aside>

          <div className="flex h-full items-center justify-center overflow-hidden bg-[#d8f0b9] px-4 py-6 sm:px-6 lg:px-10">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
