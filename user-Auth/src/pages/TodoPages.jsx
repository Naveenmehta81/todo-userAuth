import { useState, useEffect } from "react";
import { auth, db } from "../cofig/FireBase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router";
import { GrCheckboxSelected } from "react-icons/gr";
import { FaTrash, FaSave } from "react-icons/fa";
import { HiPencilSquare } from "react-icons/hi2";
import { GiFlamedLeaf } from "react-icons/gi";
import { CgCloseO } from "react-icons/cg";
import { toast } from "react-toastify";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  where,
  limit,
  startAfter,
} from "firebase/firestore";

const FILTERS = ["All", "Active", "Done"];

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
      <button
        onClick={() => onToggle(todo.id, !todo.completed)}
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
          ${
            todo.completed
              ? "bg-orange-500 border-orange-500 text-white"
              : "border-slate-500 hover:border-orange-400"
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
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-full bg-slate-700/80 text-slate-100 text-sm rounded-lg px-3 py-1.5 outline-none border border-orange-500/60 focus:border-orange-400"
          />
        ) : (
          <span
            className={`text-sm sm:text-base truncate block ${
              todo.completed ? "line-through text-slate-500" : "text-slate-200"
            }`}
          >
            {todo.text}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <>
            <button
              onClick={save}
              className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors"
            >
              <FaSave />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-600/40 transition-colors"
            >
              <CgCloseO />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-orange-300 hover:bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <HiPencilSquare />
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <FaTrash />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [cache, setCache] = useState({}); // Stores data for pages {1: [...], 2: [...]}
  const [lastVisibleMap, setLastVisibleMap] = useState({}); // Stores cursor for each page

  const PAGE_SIZE = 5;
  const SEARCH_LIMIT = 50; // Fetch more when searching

  const navigator = useNavigate();
  const todoCollection = collection(db, "todos");

  // 1. Listen for User Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setCache({}); // Clear cache on login
      } else {
        navigator("/login");
      }
    });
    return () => unsubscribe();
  }, [navigator]);

  const fetchTodos = async (targetPage, isSearching = false) => {
    if (!currentUser) return;
    setLoading(true);

    try {
      // A. Check Cache (If not searching, and we have data)
      if (!isSearching && cache[targetPage]) {
        setTodos(cache[targetPage]);
        setLoading(false);
        return;
      }

      // B. Build Base Query
      let q = query(
        todoCollection,
        where("uid", "==", currentUser.uid),
        orderBy("timestamp", "desc"),
      );

      // Apply Filter
      if (filter === "Active") q = query(q, where("completed", "==", false));
      else if (filter === "Done") q = query(q, where("completed", "==", true));

      // C. Handle Search vs Pagination
      if (isSearching) {
        // If searching, ignore pages, fetch 50 items to scan through
        q = query(q, limit(SEARCH_LIMIT));
      } else {
        // Normal Pagination
        if (targetPage > 1) {
          const prevCursor = lastVisibleMap[targetPage - 1];
          if (prevCursor) {
            q = query(q, startAfter(prevCursor), limit(PAGE_SIZE));
          }
        } else {
          q = query(q, limit(PAGE_SIZE));
        }
      }

      // D. Execute Query
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setTodos(data);

      // E. Update Cache (Only if not searching)
      if (!isSearching) {
        setCache((prev) => ({ ...prev, [targetPage]: data }));
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setLastVisibleMap((prev) => ({ ...prev, [targetPage]: lastDoc }));
      }
    } catch (error) {
      console.error("Error fetching:", error);
      toast.error("Fetch failed.");
    }
    setLoading(false);
  };

  // 3. Effect: Trigger Fetch (with Debounce for search)
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (search.length > 0) {
        fetchTodos(1, true); // Search Mode
      } else {
        fetchTodos(page, false); // Pagination Mode
      }
    }, 500); // Wait 500ms

    return () => clearTimeout(delaySearch);
  }, [currentUser, page, filter, search]);

  // 4. Handlers
  const handleNextPage = () => {
    // Only go next if we have a full page of data
    if (todos.length === PAGE_SIZE) setPage((p) => p + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleAdd = async () => {
    if (!input.trim() || !currentUser) return;

    const tempId = Date.now().toString();
    const newTodo = {
      id: tempId,
      text: input,
      completed: false,
      uid: currentUser.uid,
    };
    setTodos([newTodo, ...todos]);
    setInput("");

    try {
      await addDoc(todoCollection, {
        text: input.trim(),
        completed: false,
        timestamp: serverTimestamp(),
        uid: currentUser.uid,
      });
      // Clear cache to force refresh next time we load page 1
      setCache({});
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  };

  // Handlers for edit/delete need to update UI manually since we aren't using onSnapshot
  const handleToggle = async (id, completed) => {
    // Optimistic UI update
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed } : t)));
    await updateDoc(doc(db, "todos", id), { completed });
    setCache({}); // Invalidate cache
  };

  const handleDelete = async (id) => {
    setTodos(todos.filter((t) => t.id !== id));
    await deleteDoc(doc(db, "todos", id));
    setCache({});
  };

  const handleEdit = async (id, text) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, text } : t)));
    await updateDoc(doc(db, "todos", id), { text });
    setCache({});
  };

  const clearDone = () => {
    const completedTodos = todos.filter((t) => t.completed);
    setTodos(todos.filter((t) => !t.completed));
    completedTodos.forEach(async (t) => {
      await deleteDoc(doc(db, "todos", t.id));
    });
    setCache({});
  };

  const handlelogOut = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      navigator("/login");
    } catch (error) {
      console.log("Logout error ", error.message);
    }
  };

  // Client-side filtering for search
  const displayedTodos = todos.filter((t) =>
    t.text.toLowerCase().includes(search.toLowerCase()),
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
              <GiFlamedLeaf />
            </span>
            <h1
              className="text-3xl sm:text-4xl font-black tracking-tight text-white"
              style={{ fontFamily: "'Syne', sans-serif, system-ui" }}
            >
              Do<span className="text-orange-500">it</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Welcome, {currentUser?.email}
          </p>
        </div>

        {/* ── Stats bar ── */}
        <div className="flex gap-4 mb-6 text-center">
          {[
            { label: "Visible", value: displayedTodos.length },
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

        {/* ── Search Bar ── */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-slate-800/40 border border-slate-700/50 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-orange-500/50 transition-colors"
          />
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
              onClick={() => {
                setFilter(f);
                setPage(1);
                setCache({});
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                ${filter === f ? "bg-orange-500 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Todo list ── */}
        <div className="space-y-2 relative min-h-\[200px\]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
              <span className="text-orange-500 text-sm animate-pulse">
                Loading...
              </span>
            </div>
          )}

          {displayedTodos.length === 0 && !loading ? (
            <div className="text-center py-16 text-slate-600">
              <div className="text-4xl mb-3">✓</div>
              <p className="text-sm">
                {search ? "No tasks match your search." : "No tasks found."}
              </p>
            </div>
          ) : (
            displayedTodos.map((todo) => (
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

        {/* ── Page Controls (Hide when searching) ── */}
        {!search && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800/40 rounded-xl border border-slate-700/50 mt-4">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
            >
              ← Prev
            </button>

            <span className="text-slate-400 text-sm font-mono">
              Page {page}
            </span>

            <button
              onClick={handleNextPage}
              // If we have less than PAGE_SIZE, we are at the end
              disabled={todos.length < PAGE_SIZE}
              className="text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* ── Footer actions ── */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-800">
          <button
            onClick={handlelogOut}
            className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
          >
            Log Out
          </button>

          {doneCount > 0 && (
            <button
              onClick={clearDone}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear Completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
