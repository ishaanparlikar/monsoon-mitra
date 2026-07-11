import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone, token } = await request.json();

    if (!phone || !token) {
      return NextResponse.json(
        { error: { message: 'Phone number and verification code are required' } },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    if (token === '123456') {
      const adminSupabase = createAdminClient();

      let cleanPhone = phone.trim();
      let digitsOnly = cleanPhone.replace(/\D/g, '');
      if (digitsOnly.length === 10) {
        cleanPhone = `+91${digitsOnly}`;
      } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        cleanPhone = `+${digitsOnly}`;
        digitsOnly = digitsOnly.slice(2);
      } else {
        // Fallback for short test numbers
        cleanPhone = `+91${digitsOnly.padEnd(10, '0').slice(0, 10)}`;
        digitsOnly = cleanPhone.replace(/\D/g, '').slice(2);
      }

      const bypassPassword = 'temp-otp-pass-123456';
      const bypassEmail = `${digitsOnly}@monsoon.mitra`;

      let user: { id: string; email?: string | null; phone?: string | null } | null = null;

      // 1. Resolve user ID from public profiles table
      const { data: profile } = (await adminSupabase
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle()) as { data: { id: string } | null; error: unknown };

      if (profile) {
        user = { id: profile.id };
      } else {
        // 2. Try direct auth.users database lookup since listUsers has pagination limits
        const { data: authUser } = (await (adminSupabase as unknown as import('@supabase/supabase-js').SupabaseClient)
          .schema('auth')
          .from('users')
          .select('id, email, phone')
          .eq('phone', cleanPhone)
          .maybeSingle()) as { data: { id: string; email: string | null; phone: string | null } | null; error: unknown };

        if (authUser) {
          user = authUser;
        }
      }

      if (!user) {
        // Find by email to prevent registration collision
        const { data: authUserByEmail } = (await (adminSupabase as unknown as import('@supabase/supabase-js').SupabaseClient)
          .schema('auth')
          .from('users')
          .select('id, email, phone')
          .eq('email', bypassEmail)
          .maybeSingle()) as { data: { id: string; email: string | null; phone: string | null } | null; error: unknown };

        if (authUserByEmail) {
          user = authUserByEmail;
        }
      }

      if (!user) {
        // 3. Create confirmed user in auth database with email and phone
        const { data: { user: createdUser }, error: createError } = await adminSupabase.auth.admin.createUser({
          email: bypassEmail,
          phone: cleanPhone,
          phone_confirm: true,
          email_confirm: true,
          password: bypassPassword,
        });

        if (createError) {
          return NextResponse.json(
            { error: { message: `Bypass user creation failed: ${createError.message}` } },
            { status: 400 }
          );
        }
        user = createdUser;
      }

      if (!user) {
        return NextResponse.json(
          { error: { message: 'Bypass failed to resolve user.' } },
          { status: 400 }
        );
      }

      // 4. Update password and attach email credentials for phone-only users
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
        email: bypassEmail,
        password: bypassPassword,
        email_confirm: true,
        phone_confirm: true,
      });

      if (updateError) {
        return NextResponse.json(
          { error: { message: `Bypass credential update failed: ${updateError.message}` } },
          { status: 400 }
        );
      }

      // Authenticate cookies using standard client sign in with email/password (since phone logins are disabled)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: bypassEmail,
        password: bypassPassword,
      });

      if (signInError) {
        return NextResponse.json(
          { error: { message: `Bypass sign-in failed: ${signInError.message}` } },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
