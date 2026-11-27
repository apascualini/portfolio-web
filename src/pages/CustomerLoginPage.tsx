import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { apiFetch } from '../api/client';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import type { CustomerUser } from '../context/CustomerAuthContext';

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { setCustomer } = useCustomerAuth();

  // Estado del flujo Email + OTP
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // 1. Login con Google Sign-In
  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setError(null);
    setLoading(true);

    try {
      const user = await apiFetch<CustomerUser>('/api/customer-auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });
      setCustomer(user);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Enviar código OTP de 6 dígitos al email
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      await apiFetch('/api/customer-auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email, fullName }),
      });
      setStep('otp');
      setInfo(`Enviamos un código de 6 dígitos a ${email}. Revisá tu bandeja o spam.`);
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el código.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verificar código OTP
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await apiFetch<CustomerUser>('/api/customer-auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      setCustomer(user);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Código inválido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Ingresá para continuar</h1>
          <p className="text-sm text-slate-500 mt-1">
            Validá tu cuenta para proteger tu compra y seguir tu envío
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium">
            {info}
          </div>
        )}

        {/* Botón Oficial de Google */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Error al conectar con Google.')}
            useOneTap={false}
            shape="pill"
            text="continue_with"
            width="320"
          />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-medium">O ingresá con tu email</span>
          </div>
        </div>

        {/* Formulario Email -> Código OTP */}
        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre y Apellido
              </label>
              <input
                required
                className={inputClass}
                placeholder="Ej: María Gómez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                className={inputClass}
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              {loading ? 'Enviando código...' : 'Enviar código de verificación'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código de 6 dígitos enviado a {email}
              </label>
              <input
                required
                maxLength={6}
                inputMode="numeric"
                className={`${inputClass} text-center text-xl tracking-[0.5em] font-bold`}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              {loading ? 'Verificando...' : 'Verificar e ingresar'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
                setInfo(null);
              }}
              className="w-full text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              ← Cambiar email o reenviar código
            </button>
          </form>
        )}

        <div className="mt-6 text-center border-t border-slate-100 pt-4">
          <Link to="/" className="text-xs text-slate-500 hover:text-indigo-600">
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
