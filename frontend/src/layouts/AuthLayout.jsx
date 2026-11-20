import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-accent-violet">Collab</span>X
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Find Your Team. Build Something Real.
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}