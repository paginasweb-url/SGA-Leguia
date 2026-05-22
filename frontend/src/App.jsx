import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/students"
          element={<Students />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;