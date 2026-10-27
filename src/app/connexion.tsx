import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Btn, Card, Field, H1, Mu, Screen, Seg } from '../components/ui';
import { APP_NAME, APP_SUBTITLE } from '../config';
import { supabase } from '../lib/supabase';
import { C } from '../lib/theme';

function frError(m: string) {
  const s = m.toLowerCase();
  if (s.includes('invalid login')) return 'E-mail ou mot de passe incorrect.';
  if (s.includes('already registered') || s.includes('already been registered')) return 'Cet e-mail a déjà un compte. Connecte-toi.';
  if (s.includes('password') && s.includes('6')) return 'Le mot de passe doit faire au moins 6 caractères.';
  if (s.includes('email not confirmed')) return "Confirme d'abord ton e-mail avec le lien que tu as reçu.";
  if (s.includes('rate limit')) return 'Trop d\'essais. Réessaie dans quelques minutes.';
  if (s.includes('valid email') || s.includes('invalid email')) return "Cet e-mail n'est pas valide.";
  if (s.includes('failed to fetch') || s.includes('network')) return 'Pas de connexion au serveur. Vérifie ta connexion internet.';
  return m;
}

export default function Connexion() {
  const [mode, setMode] = useState('Connexion');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr(''); setMsg('');
    if (!email.trim() || !pwd) { setErr('Écris ton e-mail et ton mot de passe.'); return; }
    setBusy(true);
    try {
      if (mode === 'Connexion') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pwd });
        if (error) setErr(frError(error.message));
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: pwd });
        if (error) setErr(frError(error.message));
        else if (!data.session) setMsg("Compte créé. Ouvre l'e-mail de confirmation que tu viens de recevoir, puis connecte-toi.");
      }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Erreur de connexion'); }
    setBusy(false);
  };
  const forgot = async () => {
    setErr(''); setMsg('');
    if (!email.trim()) { setErr("Écris d'abord ton e-mail."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) setErr(frError(error.message)); else setMsg('Un e-mail pour changer ton mot de passe vient de partir.');
  };

  return (
    <Screen>
      <View style={{ gap: 6, paddingTop: 24 }}>
        <H1>{APP_NAME}</H1>
        <Mu size={14}>{APP_SUBTITLE}</Mu>
      </View>
      <Seg options={['Connexion', 'Créer un compte']} value={mode} onChange={(m) => { setMode(m); setErr(''); setMsg(''); }} />
      <Card>
        <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
        <Field label="Mot de passe" value={pwd} onChangeText={setPwd} secureTextEntry autoCapitalize="none" textContentType={mode === 'Connexion' ? 'password' : 'newPassword'} onSubmitEditing={submit} />
        {err ? <Text style={{ color: C.rose, fontSize: 14, lineHeight: 20 }} accessibilityRole="alert">{err}</Text> : null}
        {msg ? <Text style={{ color: C.mint, fontSize: 14, lineHeight: 20 }}>{msg}</Text> : null}
        <Btn label={busy ? 'Un instant…' : mode === 'Connexion' ? 'Me connecter' : 'Créer mon compte'} onPress={submit} disabled={busy} />
        {mode === 'Connexion' ? <Btn label="Mot de passe oublié" kind="alt" onPress={forgot} /> : null}
      </Card>
      <Mu size={12}>La connexion avec Apple et Google arrivera avec la version pour l'App Store et Google Play.</Mu>
    </Screen>
  );
}
