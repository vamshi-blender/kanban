import React from 'react';
import { Routes, Route } from 'react-router-dom';
import KanbanBoard from './components/KanbanBoard';
import Attendance from './pages/Attendance';

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <div className="h-screen bg-[#000] text-white overflow-hidden">
          <KanbanBoard />
        </div>
      } />
      <Route path="/attendance" element={<Attendance />} />
    </Routes>
  );
}

export default App;