import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import { register } from '@/api/auth';
import { ApiError, errorMessage } from '@/api/client';
import { AuthScreen } from '@/components/auth-screen';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { TextField } from '@/components/text-field';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [sending, setSending] = useState(false);
  const emailRef = useRef<TextInputInstance>(null);
  const phoneRef = useRef<TextInputInstance>(null);

  async function submit() {
    setFieldErrors({});
    setError(undefined);
    setAlreadyRegistered(false);
    setSending(true);
    try {
      const address = email.trim().toLowerCase();
      await register({ name: name.trim(), email: address, phone: phone.trim() });
      router.push({ pathname: '/verify', params: { email: address } });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length > 0) {
        setFieldErrors(err.fields);
      } else {
        setAlreadyRegistered(err instanceof ApiError && err.status === 409);
        setError(errorMessage(err));
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthScreen title="Create an account" subtitle="Join the club to follow the daily readings.">
      <TextField
        label="Full name"
        value={name}
        onChangeText={setName}
        error={fieldErrors.name}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />
      <TextField
        ref={phoneRef}
        label="Phone number"
        value={phone}
        onChangeText={setPhone}
        error={fieldErrors.phone}
        placeholder="+234 801 234 5678"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <FormError message={error} />
      {alreadyRegistered ? (
        <Button title="Go to sign in" variant="secondary" onPress={() => router.dismissTo('/sign-in')} />
      ) : null}
      <Button
        title="Create account"
        onPress={submit}
        loading={sending}
        disabled={!name.trim() || !email.trim() || !phone.trim()}
      />
      <Button title="Already have an account? Sign in" variant="link" onPress={() => router.dismissTo('/sign-in')} />
    </AuthScreen>
  );
}
