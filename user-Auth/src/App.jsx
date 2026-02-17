import { useState } from "react";
import Login from "./componets/Login";
import Signup from "./componets/Signup";
import TodoPages from "./pages/TodoPages";
import { ToastContainer, toast } from "react-toastify";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ForgotPasswordPage from "./componets/Forgot";
import ResetPasswordPage from "./componets/ResetPassword";
import "./App.css";
import ProtectedRoute from "./componets/ProtectedRoute";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />}></Route>
          <Route path="/login" element={<Login />}></Route>
          <Route path="/Singnup" element={<Signup />}></Route>
          <Route path="/Forget-password" element ={<ForgotPasswordPage/>}></Route>
          <Route path="/Reset-password" element ={<ResetPasswordPage/>}></Route>
          <Route
            path="/Todopages"
            element={
              <ProtectedRoute>
                <TodoPages />
              </ProtectedRoute>
            }
          ></Route>
        </Routes>
      </Router>
      <ToastContainer />
    </>
  );
}

export default App;
