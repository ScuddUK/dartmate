import React, { useState } from 'react';

interface JoinCodeModalProps {
  onSubmit: (code: string) => void;
  onCancel: () => void;
  error?: string;
}

const JoinCodeModal: React.FC<JoinCodeModalProps> = ({ onSubmit, onCancel, error }) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(code.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white text-black rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">Enter Pair Code</h2>
        <p className="mb-2">Enter pair code to join existing game.</p>
        <form onSubmit={handleSubmit}>
          <input
            aria-label="Pair code"
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3 font-mono text-lg tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
            placeholder="AbC12345"
            maxLength={8}
          />
          <div className="text-xs text-gray-600 mb-2">8 characters, letters and numbers only.</div>
          {error && <div className="text-red-600 mb-3">{error}</div>}
          <div className="flex gap-3">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Submit</button>
            <button type="button" className="flex-1 px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinCodeModal;