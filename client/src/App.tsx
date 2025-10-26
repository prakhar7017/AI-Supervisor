import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import VoiceTest from './pages/VoiceTest';
import LearnedAnswers from './pages/LearnedAnswers';
import HelpRequestDetails from './pages/HelpRequestDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="voice-test" element={<VoiceTest />} />
          <Route path="learned-answers" element={<LearnedAnswers />} />
          <Route path="requests/:id" element={<HelpRequestDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
