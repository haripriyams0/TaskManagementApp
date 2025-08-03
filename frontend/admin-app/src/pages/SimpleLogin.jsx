import React from 'react';

const SimpleLogin = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Simple Login Test
        </h1>
        <p className="text-center text-gray-600">
          This is a simplified login component to test if the routing works.
        </p>
        <div className="mt-6">
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;
