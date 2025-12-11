import LoginForm from "@/components/LoginForm";

export default function Login() {
  return (
    <main className="min-h-screen bg-forest-50 bg-grid flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl p-6 border border-forest-100 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <img src="/xvalo-logo.svg" alt="XValo" className="h-8 w-8" />
          <h1 className="text-xl font-semibold text-forest-700">Connexion</h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
