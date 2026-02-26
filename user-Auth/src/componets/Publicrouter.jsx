// PublicRoute.jsx
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../cofig/FireBase";

const PublicRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Navigate to="/Todopages" replace />;
  }

  return children;
};

export default PublicRoute;
