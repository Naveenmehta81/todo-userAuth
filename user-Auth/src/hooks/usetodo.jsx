import { useState, useEffect, useRef, useCallback } from "react";
import { todoService } from "../services/todoservices.jsx";
import { toast } from "react-toastify";

export function useTodos(currentUser, filter, search, pageSize = 5) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, active: 0, done: 0 });

  const cursors = useRef({}); // cursor.current - we can read property , cursor.current={} - write the pro
  const pageCache = useRef({});

  console.log("this is where we need to start", cursors);
  console.log("this is where data save", pageCache);

  const fetchStats = useCallback(async () => {
    if (!currentUser) return;
    try {
      const newStats = await todoService.getStats(currentUser.uid);
      setStats(newStats);
    } catch (error) {
      console.error("faild to fetch state ", error);
    }
  }, [currentUser]);

  const loadTodos = useCallback(
    async (targetPage) => {
      if (!currentUser) return;

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
        console.error("Failed to fetch data:", error);
        toast.error("Failed to fetch tasks.");
      } finally {
        setLoading(false);
      }
    },
    [currentUser, filter, search, pageSize],
  );

  //  resetPagination
  const resetAndLoad = useCallback(
    (targetPage = 1) => {
      pageCache.current = {};
      cursors.current = {};
      setPage(targetPage);

      loadTodos(targetPage);
    },
    [loadTodos],
  );

  // Kept for external use
  const resetPagination = useCallback(() => {
    resetAndLoad(1);
  }, [resetAndLoad]);

  //  redirect to prev page if current page becomes empty
  const softDelete = useCallback(
    (id) => {
      setTodos((prev) => {
        const updated = prev.filter((t) => t.id !== id);

        // here we handel to page if we delete all record then go the previous page
        if (updated.length === 0 && page > 1) {
          const prevPage = page - 1;
          delete pageCache.current[page];
          setPage(prevPage);
          loadTodos(prevPage);
        }

        return updated;
      });
      fetchStats();
    },
    [page, fetchStats, loadTodos],
  );

  const softUpdate = useCallback(
    (id, fields) => {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...fields } : t)),
      );
      fetchStats();
    },
    [fetchStats],
  );

  //  Re-run when filter/search/user changes — use resetAndLoad directly
  useEffect(() => {
    if (!currentUser) return;
    pageCache.current = {};
    cursors.current = {};
    setPage(1);
    loadTodos(1);
    fetchStats();
  }, [filter, search, currentUser]);

  useEffect(() => {
    loadTodos(page);
  }, [page]); // loadTodos intentionally omitted to avoid loop

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
