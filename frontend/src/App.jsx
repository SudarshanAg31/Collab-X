import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './routes/RequireAuth';
import RequireProfileComplete from './routes/RequireProfileComplete';

import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CompleteProfile from './pages/auth/CompleteProfile';
import Dashboard from './pages/dashboard/Dashboard';
import Discover from './pages/projects/Discover';
import ProjectDetail from './pages/projects/ProjectDetail';
import CreateProject from './pages/projects/CreateProject';
import MyApplications from './pages/applications/MyApplications';
import ReceivedApplications from './pages/applications/ReceivedApplications';
import Profile from './pages/profile/Profile'; // NEW
import Settings from './pages/settings/Settings';

// Workspace Imports
import WorkspaceLayout from './pages/workspace/WorkspaceLayout';
import Overview from './pages/workspace/Overview';
import RepositoryExplorer from './pages/workspace/RepositoryExplorer';
import CommitHistory from './pages/workspace/CommitHistory';
import Announcements from './pages/workspace/Announcements';
import Meetings from './pages/workspace/Meetings';
import NoticeBoard from './pages/workspace/NoticeBoard';
import TeamMembers from './pages/workspace/TeamMembers';

import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/complete-profile" element={<CompleteProfile />} />

            <Route element={<RequireProfileComplete />}>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="discover" element={<Discover />} />
                <Route path="projects/new" element={<CreateProject />} />
                <Route path="projects/:id" element={<ProjectDetail />} />
                <Route path="my-applications" element={<MyApplications />} />
                <Route path="applications/received" element={<ReceivedApplications />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />

                {/* Workspace Routes */}
                <Route path="projects/:id/workspace" element={<WorkspaceLayout />}>
                  <Route index element={<Overview />} />
                  <Route path="repository" element={<RepositoryExplorer />} />
                  <Route path="commits" element={<CommitHistory />} />
                  <Route path="announcements" element={<Announcements />} />
                  <Route path="meetings" element={<Meetings />} />
                  <Route path="notices" element={<NoticeBoard />} />
                  <Route path="team" element={<TeamMembers />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}