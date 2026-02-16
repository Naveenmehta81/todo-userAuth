import { useState } from "react";
import Login from "./componets/Login";
import Signup from "./componets/Signup";
import { ToastContainer, toast } from "react-toastify";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";

function App() {
  return (
    <>
     
      <Router>
        <Routes>
          <Route path="/" element={<Login />}></Route>
          <Route path="/login" element={<Login />}></Route>
          <Route path="/Singnup" element={<Signup />}></Route>
        </Routes>
         </Router>
         <ToastContainer/>
    </>
  );
}

export default App;
