import React from 'react';

const MyTasks = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
        <p className="mt-2 text-gray-600">View and manage your assigned tasks</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Task List</h3>
          <p className="text-gray-600">Your assigned tasks will be displayed here with status update options.</p>
        </div>
      </div>
    </div>
  );
};

export default MyTasks;
