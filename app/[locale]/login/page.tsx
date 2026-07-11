'use client';

import { useState } from 'react';
import { Droplet, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send OTP');
      }

      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 safe-all">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="water-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10 Q5 8 10 10 T20 10" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#water-pattern)" />
        </svg>
      </div>

      <div className="w-full max-w-sm space-y-6 relative z-10">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <Droplet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Monsoon Mitra</h1>
          <p className="text-muted text-sm">Sign in to access your preparedness plan</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardContent className="p-6 space-y-4">
            {step === 'phone' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Phone Number
                  </label>
                  <PhoneInput
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                  <p className="text-xs text-muted">
                    We'll send you a verification code via SMS
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" fullWidth loading={loading}>
                  Continue
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted">
                    Enter the 6-digit code sent to<br />
                    <span className="font-medium text-foreground">{phone}</span>
                  </p>
                </div>

                <OTPInput
                  phone={phone}
                  onBack={() => setStep('phone')}
                  onError={(msg) => setError(msg)}
                />
                <p className="text-center text-xs text-primary/80 font-medium pt-2 space-y-1 block">
                  <span>💡 Hint: Enter <code className="bg-primary/10 px-1.5 py-0.5 rounded font-mono font-bold">123456</code> to bypass verification.</span>
                  <span className="block text-muted-foreground font-normal">To view seeded demo data, use phone number: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">9876543210</code>.</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

function OTPInput({ phone, onBack, onError }: { phone: string; onBack: () => void; onError: (msg: string) => void }) {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);

    if (value.length === 6) {
      verifyOTP(value);
    }
  };

  const verifyOTP = async (code: string) => {
    setLoading(true);
    onError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token: code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Invalid verification code');
      }

      router.push('/');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Verification failed');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      setResendCooldown(30);
      setOtp('');
      const interval = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) clearInterval(interval);
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      onError('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="otp" className="text-sm font-medium text-foreground">
          Verification Code
        </label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          value={otp}
          onChange={handleChange}
          placeholder="000000"
          className="w-full px-4 py-3 text-center text-xl tracking-[0.5em] rounded-xl border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
          autoFocus
        />
      </div>

      {loading && (
        <p className="text-center text-sm text-muted">Verifying...</p>
      )}

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-muted hover:text-foreground transition-colors"
        >
          Change number
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || loading}
          className="text-primary hover:text-primary/80 transition-colors disabled:text-muted disabled:cursor-not-allowed"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  );
}
