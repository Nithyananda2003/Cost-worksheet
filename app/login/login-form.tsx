'use client';

import { type SyntheticEvent, useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
  UserRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitLogin = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.get('username'),
          password: form.get('password'),
        }),
      });

      if (response.ok) {
        window.location.replace('/');
        return;
      }

      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(result?.error ?? 'Sign-in failed. Please try again.');
    } catch {
      setError('The server could not be reached. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={submitLogin}>
      <div className="space-y-2">
        <Label htmlFor="username" className="text-[#2d465f]">
          Username
        </Label>
        <div className="relative">
          <UserRound
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718294]"
            aria-hidden="true"
          />
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={isSubmitting}
            className="h-11 border-[#ccd8df] bg-white pl-10 shadow-sm"
            placeholder="Enter username"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-[#2d465f]">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            disabled={isSubmitting}
            className="h-11 border-[#ccd8df] bg-white pr-11 shadow-sm"
            placeholder="Enter password"
          />
          <button
            type="button"
            className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[#718294] transition hover:bg-[#eef3f2] hover:text-[#35516b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e9888]"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex gap-2 rounded-xl border border-[#ebc6c1] bg-[#fff2f0] px-3.5 py-3 text-sm text-[#8b342d]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full bg-[#173a59] text-white shadow-[0_10px_25px_rgba(23,58,89,0.2)] hover:bg-[#234e70]"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <LoaderCircle className="animate-spin" data-icon="inline-start" />
        ) : (
          <LogIn data-icon="inline-start" />
        )}
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
