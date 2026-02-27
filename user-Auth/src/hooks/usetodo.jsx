import { useState, useEffect, useRef } from "react";
import { todoService } from "../services/todoservices.jsx";
import { toast } from "react-toastify";

export function useTodos(currentUser, filter, search, pageSize = 5) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, active: 0, done: 0 });

  const cursors = useRef({});
  const pageCache = useRef({});

  const resetPagination = () => {
    pageCache.current = {};
    cursors.current = {};
    setPage(1); // clear and set page 1
  };

  const fetchStats = async () => {
    if (!currentUser) return;
    try {
      const newStats = await todoService.getStats(currentUser.uid);
      setStats(newStats);
    } catch (e) {
      console.error(e);
    }
  };

  const loadTodos = async (targetPage) => {
    console.log("fethcing page", targetPage);

    if (!currentUser) return;

    console.log("this is your user", currentUser.email);

    if (pageCache.current[targetPage]) {
      setTodos(pageCache.current[targetPage]);
      return;
    }

    setLoading(true);

    try {
      const { data, lastDoc } = await todoService.fetchTodos({
        uid: currentUser.uid,
        filter,
        search,
        targetCursor: targetPage > 1 ? cursors.current[targetPage - 1] : null,
        pageSize,
      });

      pageCache.current[targetPage] = data;
      if (lastDoc) cursors.current[targetPage] = lastDoc;
      setTodos(data);
    } catch (error) {
      toast.error("Failed to fetch tasks.");
    } finally {
      setLoading(false);
    }
  };

  // Optimistic UI Handlers
  const softUpdate = (id, fields) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...fields } : t)),
    );
    fetchStats();
  };

  const softDelete = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    fetchStats();
  };

  useEffect(() => {
    resetPagination();
    loadTodos(1);
  }, [filter, search, currentUser]);

  useEffect(() => {
    loadTodos(page);
  }, [page]);

  return {
    todos,
    loading,
    page,
    setPage,
    stats,
    fetchStats,
    softUpdate,
    softDelete,
    resetPagination,
  };
}
