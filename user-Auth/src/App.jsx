import Login from "./componets/Login";
import Signup from "./componets/Signup";
import TodoPages from "./pages/TodoPages";
import { ToastContainer } from "react-toastify";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ForgotPasswordPage from "./componets/Forgot";
import ResetPasswordPage from "./componets/ResetPassword";
import "./App.css";
import ProtectedRoute from "./componets/ProtectedRoute";
import Settingpage from "./pages/Settingpage";
import PublicRoute from "./componets/Publicrouter";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />}></Route>

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          ></Route>
          <Route
            path="/Singnup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          ></Route>
          <Route
            path="/Forget-password"
            element={<ForgotPasswordPage />}
          ></Route>
          <Route path="/Reset-password" element={<ResetPasswordPage />}></Route>
          <Route
            path="/Todopages"
            element={
              <ProtectedRoute>
                <TodoPages />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/setting"
            element={
              <ProtectedRoute>
                <Settingpage />
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
