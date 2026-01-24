import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      <Dashboard />

      {/* Footer / Legal */}
      <footer className="py-6 text-center text-slate-400 text-xs mt-auto">
        <p>&copy; 2026 Internal Operations - Engineering Tools Division</p>
      </footer>
    </div>
  );
}

export default App;
