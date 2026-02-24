import React, { useState, useEffect } from "react";
import { auth } from "../cofig/FireBase";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";

export default function ChangePassword() {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const navigator = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Track if auth is  still loading to prevent UI flashes on refresh
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSocialLogin, setIsSocialLogin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);

        // password means user log in email / password method
        const hasPasswordProvider = user.providerData.some(
          (provider) => provider.providerId === "password",
        );

        setIsSocialLogin(!hasPasswordProvider);
      } else {
        navigator("/login");
      }

      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [navigator]);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmNewPassword } = passwords;
    if (currentPassword === newPassword) {
      toast.error("current password and new password are same ");
      return ;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (!currentUser) {
      toast.error("No user is currently logged in.");
      return;
    }

    setIsLoading(true);

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      toast.success("Password updated successfully!");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      navigator("/Todopages");
    } catch (error) {
      if (error.code === "auth/invalid-credential") {
        toast.error("The current password you entered is incorrect.");
      } else {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // loader when check user is emila / password or socila login
  if (isCheckingAuth) {
    return (
      <div className="w-full max-w-md p-8 mx-auto text-center mt-10">
        <p className="text-gray-500 font-medium animate-pulse">
          Checking permissions...
        </p>
      </div>
    );
  }

  // msg for social login
  if (isSocialLogin) {
    return (
      <div className="w-full max-w-md p-8 mx-auto mt-10 bg-white shadow-xl rounded-2xl text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          Account Settings
        </h2>
        <div className="p-4 mb-6 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 text-sm leading-relaxed">
          <p>
            You are signed in securely using a linked social account (like
            Google or GitHub). Password changes are managed directly through
            your social provider.
          </p>
        </div>

        <button
          onClick={() => navigator("/Todopages")}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg transition-colors border border-slate-300"
        >
          Back to Todo List
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 mx-auto mt-10 bg-white shadow-xl rounded-2xl">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Change Password</h2>

      <form onSubmit={handlePasswordChange} className="space-y-5">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Current Password
          </label>
          <input
            type="password"
            name="currentPassword"
            value={passwords.currentPassword}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition bg-gray-50 focus:bg-white"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            type="password"
            name="newPassword"
            value={passwords.newPassword}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition bg-gray-50 focus:bg-white"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <input
            type="password"
            name="confirmNewPassword"
            value={passwords.confirmNewPassword}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition bg-gray-50 focus:bg-white"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 font-medium text-white transition duration-200 rounded-lg mb-3 ${
              isLoading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>

          <button
            type="button"
            onClick={() => navigator("/Todopages")}
            className="w-full py-3 font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition duration-200 rounded-lg"
          >
            Cancel & Go Back
          </button>
        </div>
      </form>
    </div>
  );
}
