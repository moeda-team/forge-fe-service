"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";

export default function AuthGate() {
  const login = useStore((state) => state.login);
  const register = useStore((state) => state.register);
  const apiError = useStore((state) => state.apiError);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      if (mode === "register") await register(name, email, password);
      else await login(email, password);
    } catch {
      // The store exposes the API error below the form.
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-100 p-5 text-zinc-900">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-7 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-900 font-bold text-white">F</div>
          <div>
            <h1 className="font-semibold">Forge</h1>
            <p className="text-xs text-zinc-500">{mode === "login" ? "Sign in to your workspace" : "Create your workspace account"}</p>
          </div>
        </div>
        {mode === "register" && (
          <Field label="Name">
            <input required value={name} onChange={(event) => setName(event.target.value)} className={inputClass} autoComplete="name" />
          </Field>
        )}
        <Field label="Email">
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} autoComplete="email" />
        </Field>
        <Field label="Password">
          <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </Field>
        {apiError && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{apiError}</p>}
        <button disabled={pending} className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
          {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <button type="button" onClick={() => setMode((current) => current === "login" ? "register" : "login")} className="mt-4 w-full text-xs text-zinc-500 hover:text-zinc-900">
          {mode === "login" ? "New to Forge? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}

const inputClass = "w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mb-4 block"><span className="mb-1.5 block text-xs font-medium">{label}</span>{children}</label>;
}
