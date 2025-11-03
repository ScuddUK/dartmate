import React from 'react';

interface PairCodeModalProps {
  code: string;
  masterCode?: string | null;
  onClose: () => void;
}

const PairCodeModal: React.FC<PairCodeModalProps> = ({ code, masterCode, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white text-black rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" aria-hidden="true"></span>
          <span className="text-green-600 text-sm">Pairing code ready</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Your Pairing Code</h2>
        <p className="mb-4 text-sm text-gray-600">This is your game pairing code. Share it with the mobile scorer to join your game.</p>
        <div className="flex items-center justify-between bg-gray-100 rounded-md p-4 mb-4">
          <span className="font-mono text-3xl tracking-widest">{code}</span>
          <button
            className="ml-4 px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            onClick={() => navigator.clipboard.writeText(code)}
          >
            Copy Player Code
          </button>
        </div>
        {masterCode && (
          <div className="flex items-center justify-between bg-gray-100 rounded-md p-4 mb-4">
            <span className="font-mono text-xl tracking-widest">Admin: {masterCode}</span>
            <button
              className="ml-4 px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              onClick={() => navigator.clipboard.writeText(masterCode)}
            >
              Copy Admin Code
            </button>
          </div>
        )}
        <ul className="text-sm text-gray-600 list-disc pl-5 mb-4">
          <li>On the mobile device, tap "Mobile Scorer" and enter this code.</li>
          <li>The code is 8 characters, letters and numbers only.</li>
          <li>Admin code grants elevated access; do not share publicly.</li>
        </ul>
        <button
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PairCodeModal;