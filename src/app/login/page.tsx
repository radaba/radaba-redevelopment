import { redirect } from "next/navigation";
import { LoginForm } from "@/components/authentication/login-form";
import { RadabaBrand } from "@/components/authentication/radaba-brand";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  try {
    await resolveAuthenticatedUser();
    redirect("/home/assignment");
  } catch {
    // Render the public login experience for unauthenticated users.
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_36%),linear-gradient(135deg,_#f8faff_0%,_#eef2ff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur sm:flex-row">
        <section className="flex flex-1 flex-col justify-between bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-700 px-6 py-8 text-white sm:px-10 lg:px-14 lg:py-12">
          <div className="space-y-8">
            <RadabaBrand />
            <div className="max-w-xl space-y-4">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Radaba helps you automate engineering parameter maintenance.
              </h1>
              <p className="max-w-lg text-base text-indigo-100/90 sm:text-lg">
                Keep maintenance workflows moving with a secure login experience designed for field operations and engineering teams.
              </p>
            </div>
          </div>

          <div className="hidden rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm lg:block">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-indigo-100/80">
              Secure access
            </p>
            <p className="mt-2 text-sm text-indigo-50/90">
              Sign in to continue managing assignments, site details, and maintenance records with the same trusted authentication flow.
            </p>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center bg-slate-50/70 px-6 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">
                Welcome back
              </p>
              <h2 className="text-2xl font-semibold text-slate-950">Sign in to Radaba</h2>
              <p className="text-sm text-slate-600">
                Use your work email and password to continue.
              </p>
            </div>

            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
