import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-extrabold text-accent-violet">404</h1>
      <p className="mt-4 text-lg">This page doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to Dashboard
      </Link>
    </div>
  );
}