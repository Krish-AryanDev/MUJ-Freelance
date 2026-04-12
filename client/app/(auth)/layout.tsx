import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <div className="w-full">{children}</div>
    </section>
  );
}
