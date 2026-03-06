import React, { useState } from "react";
import { GrCheckboxSelected } from "react-icons/gr";
import { FaTrash, FaSave } from "react-icons/fa";
import { HiPencilSquare } from "react-icons/hi2";
import { CgCloseO } from "react-icons/cg";
import { todoService } from "../services/todoservices.jsx";

export default function TodoItem({ todo, onSoftUpdate, onSoftDelete }) {
  if (!todo) return null;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  console.log("set of 5 list render in draf ", draft); 

  const handleToggle = async () => {
    const newStatus = !todo.completed;
    onSoftUpdate(todo.id, { completed: newStatus });
    await todoService.update(todo.id, { completed: newStatus });
  };

  const handleDelete = async () => {
    onSoftDelete(todo.id);
    await todoService.delete(todo.id);
  };

  const handleSave = async () => {
    if (draft.trim() && draft !== todo.text) {
      onSoftUpdate(todo.id, { text: draft.trim() });
      await todoService.update(todo.id, { text: draft.trim() });
    }
    setEditing(false);
  };

  return (
    <div
      className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
        todo.completed
          ? "bg-slate-800/30 border-slate-700/30 opacity-60"
          : "bg-slate-800/60 border-slate-600/40"
      }`}
    >
      <button
        onClick={handleToggle}
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          todo.completed
            ? "bg-orange-500 border-orange-500 text-white"
            : "border-slate-700"
        }`}
      >
        {todo.completed && <GrCheckboxSelected />}
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-full bg-slate-700/80 text-white text-sm rounded-lg px-3 py-1.5 outline-none border border-orange-500/60"
          />
        ) : (
          <span
            className={`text-sm truncate block ${todo.completed ? "line-through text-slate-100" : "text-slate-200"}`}
          >
            {todo.text}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {editing ? (
          <button onClick={handleSave} className="p-1.5 text-green-400">
            <FaSave />
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-slate-400 hover:text-orange-300"
          >
            <HiPencilSquare />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="p-1.5 text-slate-100 hover:text-red-800"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
}
