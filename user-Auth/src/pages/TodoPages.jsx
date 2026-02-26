import { useState, useEffect, useRef } from "react";
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
  getCountFromServer,
} from "firebase/firestore";

const FILTERS = ["All", "Active", "Done"];
const PAGE_SIZE = 5;

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
          ${todo.completed ? "bg-orange-500 border-orange-500 text-white" : "border-slate-500 hover:border-orange-400"}`}
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
            className={`text-sm sm:text-base truncate block ${todo.completed ? "line-through text-slate-500" : "text-slate-200"}`}
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
  const [state, setState] = useState({ total: 0, active: 0, done: 0 });

  const cursors = useRef({});
  const pageCache = useRef({});


  const navigator = useNavigate();
  const todoCollection = collection(db, "todos");

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchStats(user.uid);
      } else navigator("/login");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigator]);



  const fetchStats = async (uid) => {
    const uid_ = uid ?? currentUser?.uid;
    if (!uid_) return;
    try {
      const base = where("uid", "==", uid_);
      const [totSnap, actSnap, doneSnap] = await Promise.all([
        getCountFromServer(query(todoCollection, base)),
        getCountFromServer(
          query(todoCollection, base, where("completed", "==", false)),
        ),
        getCountFromServer(
          query(todoCollection, base, where("completed", "==", true)),
        ),
      ]);
      setState({
        total: totSnap.data().count,
        active: actSnap.data().count,
        done: doneSnap.data().count,
      });
    } catch (error) {
      console.error("STATS ERROR:", error);
      toast.error("Stats failed. Check console for Firebase index link.");
    }
  };


  const fetchTodos = async (targetPage) => {
    if (!currentUser) return;


    // if date allready there 
    if (pageCache.current[targetPage]) {
      setTodos(pageCache.current[targetPage]);
      return;
    }

    setLoading(true);

    try {
      
      const constraints = [where("uid", "==", currentUser.uid)];
      
      if (filter === "Active")
        constraints.push(where("completed", "==", false));
      if (filter === "Done") constraints.push(where("completed", "==", true));

      if (search.trim()) {
        constraints.push(
          where("text", ">=", search),
          where("text", "<=", search + "\uf8ff"),
          orderBy("text"),
        );
      } else {
        constraints.push(orderBy("timestamp", "desc"));
      }

      if (targetPage > 1 && cursors.current[targetPage - 1]) {
        constraints.push(startAfter(cursors.current[targetPage - 1]));
      }

      constraints.push(limit(PAGE_SIZE));

      const snapshot = await getDocs(query(todoCollection, ...constraints));
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      pageCache.current[targetPage] = data;
      setTodos(data);
      if (snapshot.docs.length > 0)
        cursors.current[targetPage] = snapshot.docs[snapshot.docs.length - 1];
    } catch (error) {
      console.error("Fetch Error:", error.message);
      setTodos([]);
      toast.error(
        error.message.includes("requires an index")
          ? "Search failed: Missing Firebase Index. Check console."
          : "Failed to fetch tasks.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetAndFetch = () => {
    pageCache.current = {};
    cursors.current = {};
  };

  useEffect(() => {
    if (!currentUser) return;
    resetAndFetch();
    fetchTodos(1);
  }, [filter, search, currentUser]);
  useEffect(() => {
    if (!currentUser) return;
    fetchTodos(page);
  }, [page]);

  const handleAdd = async () => {
    if (!input.trim() || !currentUser) return;
    const text = input.trim();
    setTodos([
      {
        id: Date.now().toString(),
        text,
        completed: false,
        uid: currentUser.uid,
      },
      ...todos,
    ]);
    setInput("");
    try {
      await addDoc(todoCollection, {
        text,
        completed: false,
        timestamp: serverTimestamp(),
        uid: currentUser.uid,
      });
      resetAndFetch();
      fetchStats();
      page === 1 ? fetchTodos(1) : setPage(1);
    } catch (e) {
      console.error("Error adding todo:", e);
    }
  };

  const handleToggle = async (id, completed) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed } : t)));
    await updateDoc(doc(db, "todos", id), { completed });
    resetAndFetch();
    fetchTodos(page);
    fetchStats();
  };

  const handleDelete = async (id) => {
    setTodos(todos.filter((t) => t.id !== id));
    await deleteDoc(doc(db, "todos", id));
    resetAndFetch();
    fetchTodos(page);
    fetchStats();
  };

  const handleEdit = async (id, text) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, text } : t)));
    await updateDoc(doc(db, "todos", id), { text });
    resetAndFetch();
    fetchTodos(page);
  };

  const clearDone = async () => {
    const completed = todos.filter((t) => t.completed);
    setTodos(todos.filter((t) => !t.completed));
    await Promise.all(completed.map((t) => deleteDoc(doc(db, "todos", t.id))));
    fetchTodos(page);
    fetchStats();
  };

  const handlelogOut = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out!");
      navigator("/login");
    } catch (e) {
      console.error("Logout error:", e.message);
    }
  };

  const currentTotalCount =
    filter === "Active"
      ? state.active
      : filter === "Done"
        ? state.done
        : state.total;
  const totalPages = Math.ceil(currentTotalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-900 flex items-start justify-center py-8 px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[30%] w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[20%] w-80 h-80 bg-amber-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-orange-500">
              <GiFlamedLeaf />
            </span>
            <h1
              className="text-3xl sm:text-4xl font-black tracking-tight text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Do<span className="text-orange-500">it</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Welcome, {currentUser?.email}
          </p>
        </div>

        <div className="flex gap-4 mb-6 text-center">
          {[
            { label: "Total", value: state.total },
            { label: "Active", value: state.active },
            { label: "Done", value: state.done },
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

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="w-full mb-4 bg-slate-800/40 border border-slate-700/50 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-orange-500/50 transition-colors"
        />

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
            className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm"
          >
            Add
          </button>
        </div>

        <div className="flex gap-1 mb-4 bg-slate-800/50 rounded-xl p-1 border border-slate-700/40">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${filter === f ? "bg-orange-500 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-2 relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10 rounded-xl">
              <span className="text-orange-500 text-sm animate-pulse">
                Loading...
              </span>
            </div>
          )}
          {todos.length === 0 && !loading ? (
            <div className="text-center py-16 text-slate-600">
              <div className="text-4xl mb-3">✓</div>
              <p className="text-sm">
                {search ? "No tasks match your search." : "No tasks found."}
              </p>
            </div>
          ) : (
            todos.map((todo) => (
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

        {!search && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800/40 rounded-xl border border-slate-700/50 mt-4">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1 || loading}
              className="text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
            >
              ← Prev
            </button>
            <span className="text-slate-400 text-sm font-mono">
              {loading ? "Loading..." : `Page ${page} of ${totalPages}`}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || loading}
              className="text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-800">
          <button
            onClick={handlelogOut}
            className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
          >
            Log Out
          </button>
          <button
            onClick={() => navigator("/setting")}
            className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
          >
            Settings
          </button>
          {state.done > 0 && (
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
