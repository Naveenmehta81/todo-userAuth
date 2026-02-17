import { useState, useEffect } from "react";
import { auth, db } from "../cofig/FireBase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
const COLLECTION = "todos";

export const getTodos    = (cb) => onSnapshot(query(collection(db, COLLECTION), orderBy("createdAt", "desc")), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
export const addTodo     = (text) => addDoc(collection(db, COLLECTION), { text, completed: false, createdAt: serverTimestamp() });
export const toggleTodo  = (id, completed) => updateDoc(doc(db, COLLECTION, id), { completed });
export const deleteTodo  = (id) => deleteDoc(doc(db, COLLECTION, id));
export const editTodo    = (id, text) => updateDoc(doc(db, COLLECTION, id), { text });


// LOCAL MOCK (swap with Firebase functions above)
let _todos = [
  {
    id: "1",
    text: "Design the Firebase schema",
    completed: true,
    createdAt: Date.now() - 86400000,
  },
  {
    id: "2",
    text: "Set up Firestore rules",
    completed: false,
    createdAt: Date.now() - 3600000,
  },
  {
    id: "3",
    text: "Build the UI components",
    completed: false,
    createdAt: Date.now(),
  },
];
const mockDB = {
  getTodos: (cb) => {
    cb([..._todos]);
    return () => {};
  },
  addTodo: (text) => {
    _todos = [
      {
        id: Date.now().toString(),
        text,
        completed: false,
        createdAt: Date.now(),
      },
      ..._todos,
    ];
  },
  toggleTodo: (id, completed) => {
    _todos = _todos.map((t) => (t.id === id ? { ...t, completed } : t));
  },
  deleteTodo: (id) => {
    _todos = _todos.filter((t) => t.id !== id);
  },
  editTodo: (id, text) => {
    _todos = _todos.map((t) => (t.id === id ? { ...t, text } : t));
  },
};

// ─── Filter tabs ─────────────────────────────────────────────────────────────
const FILTERS = ["All", "Active", "Done"];

// ─── Icons ───────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);
const PenIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);
const SaveIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z" />
  </svg>
);
const FlameIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 23a7.5 7.5 0 01-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 11 1 0 2.5 0 3-2 .5 1 .5 4-3 4.5 2.5 1 3.5 3.5 3.5 5.5A5 5 0 0112 23z" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

// ─── Todo Item ────────────────────────────────────────────────────────────────
function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);

  const save = () => {
    if (draft.trim() && draft !== todo.text) onEdit(todo.id, draft.trim());
    setEditing(false);
  };

  return (
    <div
      className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300
        ${
          todo.completed
            ? "bg-slate-800/30 border-slate-700/30 opacity-60"
            : "bg-slate-800/60 border-slate-600/40 hover:border-orange-500/40 hover:bg-slate-800/80"
        }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo.id, !todo.completed)}
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
          ${
            todo.completed
              ? "bg-orange-500 border-orange-500 text-white"
              : "border-slate-500 hover:border-orange-400"
          }`}
        aria-label="Toggle todo"
      >
        {todo.completed && <CheckIcon />}
      </button>

      {/* Text / Edit field */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-full bg-slate-700/80 text-slate-100 text-sm rounded-lg px-3 py-1.5 outline-none border border-orange-500/60 focus:border-orange-400"
          />
        ) : (
          <span
            className={`text-sm sm:text-base truncate block ${todo.completed ? "line-through text-slate-500" : "text-slate-200"}`}
          >
            {todo.text}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <>
            <button
              onClick={save}
              className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors"
              aria-label="Save"
            >
              <SaveIcon />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-600/40 transition-colors"
              aria-label="Cancel"
            >
              <CloseIcon />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-orange-300 hover:bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
              aria-label="Edit"
            >
              <PenIcon />
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
              aria-label="Delete"
            >
              <TrashIcon />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("All");

  const navigator = useNavigate();

  // Subscribe to data source (swap mockDB with Firebase above)
  useEffect(() => {
    const unsub = mockDB.getTodos(setTodos);
    return () => unsub && unsub();
  }, []);

  const refresh = () => mockDB.getTodos(setTodos);

  const handleAdd = () => {
    if (!input.trim()) return;
    mockDB.addTodo(input.trim());
    setInput("");
    refresh();
  };

  const handleToggle = (id, completed) => {
    mockDB.toggleTodo(id, completed);
    refresh();
  };
  const handleDelete = (id) => {
    mockDB.deleteTodo(id);
    refresh();
  };
  const handleEdit = (id, text) => {
    mockDB.editTodo(id, text);
    refresh();
  };
  const clearDone = () => {
    todos.filter((t) => t.completed).forEach((t) => mockDB.deleteTodo(t.id));
    refresh();
  };

  const handlelogOut = async () => {
    try {
      await auth.signOut(auth).then(() => {
        console.log("logout succesfully!");
        toast.success("user logout succefully!");
        navigator("/login");
      });
    } catch (error) {
      console.log("logout error ", error.message);
    }
  };

  const filtered = todos.filter((t) =>
    filter === "All" ? true : filter === "Active" ? !t.completed : t.completed,
  );

  const activeCount = todos.filter((t) => !t.completed).length;
  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-slate-900 flex items-start justify-center py-8 px-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[30%] w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[20%] w-80 h-80 bg-amber-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">
        {/* ── Header ── */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-orange-500">
              <FlameIcon />
            </span>

            <h1
              className="text-3xl sm:text-4xl font-black tracking-tight text-white"
              style={{ fontFamily: "'Syne', sans-serif, system-ui" }}
            >
              Do<span className="text-orange-500">it</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm">Firebase-ready todoapp</p>
        </div>

        {/* ── Stats bar ── */}
        <div className="flex gap-4 mb-6 text-center">
          {[
            { label: "Total", value: todos.length },
            { label: "Active", value: activeCount },
            { label: "Done", value: doneCount },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-xl py-3"
            >
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Input ── */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add a new task…"
            className="flex-1 bg-slate-800/80 border border-slate-600/50 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-3 outline-none focus:border-orange-500/60 transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            Add
          </button>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex gap-1 mb-4 bg-slate-800/50 rounded-xl p-1 border border-slate-700/40">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                ${
                  filter === f
                    ? "bg-orange-500 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Todo list ── */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <div className="text-4xl mb-3">✓</div>
              <p className="text-sm">
                {filter === "Done"
                  ? "Nothing completed yet."
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            filtered.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))
          )}
        </div>

        {/* ── Footer actions ── */}
        {doneCount > 0 && (
          <div className="mt-5 flex justify-end">
            <button
              onClick={clearDone}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors border border-slate-700/50 hover:border-red-500/30 px-4 py-2 rounded-lg"
            >
              Clear {doneCount} completed
            </button>
          </div>
        )}

        <div>
          <button
            onClick={handlelogOut}
            className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40  text-white font-bold px-5 py-3  m-2 rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            Log out
          </button>
        </div>
        {/* ── Firebase badge ── */}
        {/* <div className="mt-8 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 border border-slate-800 rounded-full px-3 py-1">
            <span className="text-orange-600">🔥</span>
            Firebase-ready — swap{" "}
            <code className="font-mono text-slate-500">mockDB</code> with
            Firestore calls
          </span>
        </div> */}
      </div>
    </div>
  );
}
