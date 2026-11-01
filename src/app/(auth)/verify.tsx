import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { requestCode, verifyCode } from '@/api/auth';
import { errorMessage } from '@/api/client';
import { useSession } from '@/auth/session';
import { AuthScreen } from '@/components/auth-screen';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { TextField } from '@/components/text-field';
import { colors } from '@/constants/theme';

// The API allows one code a minute
const RESEND_WAIT_SECONDS = 60;

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { signIn } = useSession();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_WAIT_SECONDS);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function verify(value: string) {
    setError(undefined);
    setNotice(undefined);
    setVerifying(true);
    try {
      const result = await verifyCode(email, value);
      // Signing in switches the app to the signed-in screens
      await signIn(result.token, result.user);
    } catch (err) {
      setError(errorMessage(err));
      setCode('');
      setVerifying(false);
    }
  }

  async function resend() {
    setError(undefined);
    setNotice(undefined);
    setResending(true);
    try {
      await requestCode(email);
      setNotice('We sent you a new code.');
      setCode('');
      setResendIn(RESEND_WAIT_SECONDS);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setResending(false);
    }
  }

  function onChangeCode(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6 && !verifying) verify(digits);
  }

  return (
    <AuthScreen title="Check your email" subtitle={`Enter the 6-digit code we sent to ${email}. It works for 10 minutes.`}>
      <TextField
        label="Code"
        value={code}
        onChangeText={onChangeCode}
        placeholder="000000"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        autoFocus
        editable={!verifying}
        style={styles.code}
      />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <FormError message={error} />
      <Button title="Sign in" onPress={() => verify(code)} loading={verifying} disabled={code.length !== 6} />
      <Button
        title={resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code'}
        variant="secondary"
        onPress={resend}
        loading={resending}
        disabled={resendIn > 0 || verifying}
      />
      <Button title="Use a different email" variant="link" onPress={() => router.back()} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  code: { fontSize: 28, letterSpacing: 12, textAlign: 'center', fontWeight: '600' },
  notice: { color: colors.success, fontSize: 14 },
});
