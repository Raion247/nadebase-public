import { useState } from "react";

const NC = ({ onClose, onSave }) => {
  const [title, setTitle] = useState("");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(title.trim());
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-150">
      <div className="bg-gray-800 text-white p-6 rounded-2xl shadow-lg w-full max-w-md transition-transform transform scale-100">
        <h2 className="text-xl font-bold mb-4 text-center">Name Your Collection</h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 rounded-md border border-gray-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter collection name"
        />
        <div className="flex justify-end mt-4 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className={`px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition ${
              !title.trim() ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default NC;
