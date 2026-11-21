import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Folder, File, GitBranch, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';

// Helper to build tree from flat paths
function buildTree(paths) {
  const root = [];
  const map = {};
  paths.forEach((item) => {
    const parts = item.path.split('/');
    let currentLevel = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = index === parts.length - 1;
      
      let existing = currentLevel.find((n) => n.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          type: isLast ? item.type : 'tree',
          children: [],
        };
        currentLevel.push(existing);
        map[currentPath] = existing;
      }
      currentLevel = existing.children;
    });
  });
  return root;
}

export default function RepositoryExplorer() {
  const { project } = useOutletContext();
  const [repo, setRepo] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    loadRepo();
  }, [project.id]);

  async function loadRepo() {
    setLoading(true);
    setError('');
    try {
      const [repoRes, treeRes] = await Promise.all([
        api.get(`/projects/${project.id}/github/repository`),
        api.get(`/projects/${project.id}/github/tree`)
      ]);
      setRepo(repoRes.data.repository);
      setTreeData(buildTree(treeRes.data.tree));
      
      // Auto-expand root folders
      const initialExpanded = {};
      treeRes.data.tree.filter(t => t.type === 'tree' && !t.path.includes('/')).forEach(t => {
        initialExpanded[t.path] = true;
      });
      setExpanded(initialExpanded);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // NEW FUNCTION TO HANDLE CONNECT GITHUB
  const handleConnectGithub = async () => {
    try {
      // Axios automatically adds the Bearer token here
      const { data } = await api.get('/auth/github/url');
      // Redirect the current tab to GitHub
      window.location.href = data.url; 
    } catch (err) {
      alert("Failed to start GitHub OAuth: " + (err.message || 'Unknown error'));
    }
  };

  const toggleFolder = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const renderTree = (nodes, depth = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        <div 
          className={`flex items-center py-1.5 px-2 cursor-pointer hover:bg-bg-elevated rounded-md ${selectedFile?.path === node.path ? 'bg-bg-elevated text-accent-violet' : 'text-text-muted'}`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => node.type === 'tree' ? toggleFolder(node.path) : setSelectedFile(node)}
        >
          {node.type === 'tree' ? (
            <>
              <Folder size={14} className="mr-2 text-accent-blue" />
              <span className="text-sm">{node.name}</span>
            </>
          ) : (
            <>
              <File size={14} className="mr-2 text-text-subtle" />
              <span className="text-sm">{node.name}</span>
            </>
          )}
        </div>
        {node.type === 'tree' && expanded[node.path] && (
          <div>{renderTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  if (loading) return <div className="py-12 flex justify-center"><Spinner /></div>;
  
  if (error) {
    return (
      <div className="card p-8 border-status-danger/30 flex flex-col items-center justify-center text-center">
        <AlertTriangle size={32} className="text-status-danger mb-4" />
        <h3 className="text-lg font-semibold text-status-danger mb-2">Could not load repository</h3>
        <p className="text-sm text-text-muted mb-6">{error}</p>
        
        {/* Show button only if it's a GitHub connection error */}
        {error.includes('not connected') && (
          <button 
            onClick={handleConnectGithub}
            className="btn-primary"
          >
            Connect GitHub Account
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-[700px] border border-bg-border rounded-xl overflow-hidden bg-bg-surface">
      
      {/* LEFT PANEL - File Tree */}
      <div className="w-64 border-r border-bg-border flex flex-col bg-bg-base">
        <div className="p-3 border-b border-bg-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold truncate">
            <GitBranch size={14} className="text-text-muted" />
            {repo?.name}
          </div>
          <button onClick={loadRepo} className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-bg-elevated" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {treeData && renderTree(treeData)}
        </div>
      </div>

      {/* CENTER PANEL - File Detail */}
      <div className="flex-1 flex flex-col bg-[#0d0d14]">
        {selectedFile ? (
          <div className="flex flex-col h-full items-center justify-center p-8 text-center">
            <File size={48} className="text-text-subtle mb-4 opacity-20" />
            <h3 className="text-xl font-semibold mb-2">{selectedFile.name}</h3>
            <p className="text-sm text-text-muted mb-6">Path: {selectedFile.path}</p>
            <p className="text-xs text-text-subtle mb-8 max-w-sm">
              File content viewer is not available in this version. Please view the file directly on GitHub.
            </p>
            <a 
              href={`${project.githubRepoUrl}/blob/${repo?.defaultBranch || 'main'}/${selectedFile.path}`}
              target="_blank" 
              rel="noreferrer"
              className="btn-primary flex items-center gap-2"
            >
              <ExternalLink size={16} /> View on GitHub
            </a>
          </div>
        ) : (
          <div className="flex flex-col h-full items-center justify-center text-text-subtle">
            <File size={48} className="mb-4 opacity-20" />
            <p>Select a file to view details</p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL - Inspector */}
      <div className="w-72 border-l border-bg-border bg-bg-surface flex flex-col">
        <div className="p-4 border-b border-bg-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-subtle mb-3">Repository Info</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-text-muted">Repository</p>
              <p className="text-sm font-medium truncate">{repo?.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Default Branch</p>
              <p className="text-sm font-medium">{repo?.defaultBranch || 'main'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Visibility</p>
              <p className="text-sm font-medium capitalize">{repo?.visibility}</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <a href={project.githubRepoUrl} target="_blank" rel="noreferrer" className="btn-secondary w-full flex justify-center items-center gap-2 text-xs">
             <ExternalLink size={14} /> Open Repository
          </a>
        </div>
      </div>

    </div>
  );
}