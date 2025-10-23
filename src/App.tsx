import React from 'react';
import KanbanBoard from './components/KanbanBoard';

function App() {
  return (
    <div className="h-screen bg-[#000] text-white overflow-hidden">
      <KanbanBoard />
    </div>
  );
}

export default App;