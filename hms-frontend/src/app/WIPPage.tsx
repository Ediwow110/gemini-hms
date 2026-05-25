import React from 'react';
import { Construction } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WIPPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="bg-amber-100 p-4 rounded-full mb-6">
        <Construction className="h-12 w-12 text-amber-600" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Work in Progress</h1>
      <p className="text-slate-600 mb-8 max-w-md">
        We're working hard to bring you this feature. This page is currently under construction and will be available soon.
      </p>
      <div className="flex gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="px-6 py-2 rounded-xl font-bold transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          Go Back
        </button>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 rounded-xl font-bold transition-all bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};
