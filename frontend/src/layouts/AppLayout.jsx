import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}