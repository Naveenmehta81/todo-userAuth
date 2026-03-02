import React, { useState, useEffect } from "react";
import { auth } from "../cofig/FireBase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { GiFlamedLeaf } from "react-icons/gi";

import { useTodos } from "../hooks/usetodo.jsx";
import { todoService } from "../services/todoservices.jsx";
import TodoItem from "../pages/Todolist.jsx";

const FILTERS = ["All", "Active", "Done"];

export default function TodoApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");

  const navigate = useNavigate();

  const {
    todos,
    loading,
    fetchStats,
    page,
    setPage,
    stats,
    softUpdate,
    softDelete,
    resetPagination,
  } = useTodos(currentUser, filter, search); // hooks

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
      else navigate("/login");
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleAdd = async () => {
    console.log("clicked on add");
    if (!input.trim()) return;
    const text = input.trim();
    await todoService.add(currentUser.uid, text);
    setInput("");
    resetPagination();
    fetchStats();
  };

  // logout
  const handlelogOut = () => {
    console.log("you cliked on logout ");
    try {
      signOut(auth);
      toast.success("log out successfully");
      navigate("/login");
    } catch (error) {
      console.error("logout not succesfull", error);
    }
  };

  const totalPages = Math.ceil(
    (filter === "Active"
      ? stats.active
      : filter === "Done"
        ? stats.done
        : stats.total) / 5,
  );

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 flex justify-center">
      <div className="w-full max-w-xl relative">
        {/* Header & Stats */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white flex items-center justify-center gap-2">
            <GiFlamedLeaf className="text-orange-500" /> Do
            <span className="text-orange-500">it</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">{currentUser?.email}</p>
        </div>

        <div className="flex gap-4 mb-6">
          {[
            { l: "Total", v: stats.total },
            { l: "Active", v: stats.active },
            { l: "Done", v: stats.done },
          ].map((s) => (
            <div
              key={s.l}
              className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-xl py-3 text-center"
            >
              <div className="text-xl font-bold text-white">{s.v}</div>
              <div className="text-xs text-slate-500 uppercase">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Inputs */}
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-4 bg-slate-800/40 border border-slate-700/50 text-slate-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500/50"
        />

        <div className="flex gap-2 mb-5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add a new task..."
            className="flex-1 bg-slate-800/80 border border-slate-600/50 text-white rounded-xl px-4 py-3 outline-none"
          />
          <button
            onClick={handleAdd}
            className="bg-orange-500 text-white px-6 rounded-xl font-bold"
          >
            Add
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1 mb-4 bg-slate-800/50 rounded-xl p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-sm ${filter === f ? "bg-orange-500 text-white" : "text-slate-400"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* here my to list render */}

        <div className="space-y-2">
          {loading && (
            <div className="text-center text-orange-500 animate-pulse">
              Loading...
            </div>
          )}
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onSoftUpdate={softUpdate}
              onSoftDelete={softDelete}
            />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-between mt-6 bg-slate-800/40 p-3 rounded-xl">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-slate-400 self-center">
            Page {page} of {totalPages || 1}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-30"
          >
            Next
          </button>
        </div>

        {/* logout and setting page for change password */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-800">
          <button
            onClick={handlelogOut}
            className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
          >
            Log Out
          </button>

          <button
            onClick={() => navigate("/setting")}
            className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}
