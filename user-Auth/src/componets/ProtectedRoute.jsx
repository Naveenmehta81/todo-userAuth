import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../cofig/FireBase";

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    const nonregisteduser = onAuthStateChanged(auth, (currentuser) => {
      setUser(currentuser);
      setloading(false);
    });
    return () => nonregisteduser();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-\[200px\] w-full py-10">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>

        <p className="mt-4 text-slate-500 text-sm font-medium animate-pulse">
          Loading your tasks...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
