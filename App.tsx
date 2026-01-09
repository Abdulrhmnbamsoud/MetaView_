
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Explore from './pages/Explore';
import Dashboard from './pages/Dashboard';
import ArticleDetail from './pages/ArticleDetail';
import { ComparisonProvider } from './components/ComparisonContext';
import ComparisonDrawer from './components/ComparisonDrawer';

const App: React.FC = () => {
  return (
    <Router>
      <ComparisonProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Explore />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/article/:headline" element={<ArticleDetail />} />
          </Routes>
          <ComparisonDrawer />
        </Layout>
      </ComparisonProvider>
    </Router>
  );
};

export default App;
