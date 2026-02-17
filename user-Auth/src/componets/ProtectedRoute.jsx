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

  if (loading) return <p>loadin....</p>; 

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
