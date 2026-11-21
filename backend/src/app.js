const express = require('express');
const cors = require('cors');                    // ← NEW
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── CORS: allow the React dev server to call the API ──
app.use(
  cors({
    origin: [
      'http://localhost:5173',   // Vite dev server
      'http://127.0.0.1:5173',   // same, alt host
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    data: { service: 'collabx-backend', status: 'ok', timestamp: new Date().toISOString() },
  });
});

app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/auth/github', require('./routes/githubAuth.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/projects', require('./routes/project.routes'));
app.use('/api/v1/applications', require('./routes/application.routes'));
app.use('/api/v1/memberships', require('./routes/membership.routes'));
// Add this after your other app.use routes
app.use('/api/v1/leave-requests', require('./routes/leaveRequest.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;