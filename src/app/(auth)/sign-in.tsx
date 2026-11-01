import { router } from 'expo-router';
import { useState } from 'react';
import { requestCode } from '@/api/auth';
import { ApiError, errorMessage } from '@/api/client';
import { AuthScreen } from '@/components/auth-screen';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { TextField } from '@/components/text-field';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);

  async function submit() {
    setFieldError(undefined);
    setError(undefined);
    setSending(true);
    try {
      const address = email.trim().toLowerCase();
      await requestCode(address);
      router.push({ pathname: '/verify', params: { email: address } });
    } catch (err) {
      if (err instanceof ApiError && err.fields.email) setFieldError(err.fields.email);
      else setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthScreen title="Sign in" subtitle="Enter your email and we'll send you a 6-digit code.">
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldError}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={submit}
      />
      <FormError message={error} />
      <Button title="Send code" onPress={submit} loading={sending} disabled={!email.trim()} />
      <Button title="New here? Create an account" variant="link" onPress={() => router.push('/register')} />
    </AuthScreen>
  );
}
