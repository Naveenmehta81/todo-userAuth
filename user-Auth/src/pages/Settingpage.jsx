import React, { useState, useEffect } from "react";
import { auth } from "../cofig/FireBase";

import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
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

  // NEW: State to track if they are a social login user
  const [isSocialLogin, setIsSocialLogin] = useState(false);

  // NEW: Check the login provider when the component mounts
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // providerData is an array of how the user is linked
      // 'password' means they used Email/Password.
      // 'google.com' or 'github.com' means social login.
      const hasPasswordProvider = user.providerData.some(
        (provider) => provider.providerId === "password",
      );

      // If they don't have a password provider, they are a social user
      setIsSocialLogin(!hasPasswordProvider);
    }
  }, []);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmNewPassword } = passwords;

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast.error("No user is currently logged in.");
      return;
    }

    setIsLoading(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      toast.success("Password updated successfully!");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
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

  // NEW: If they are a social login user, show a friendly message instead of the form
  if (isSocialLogin) {
    return (
      <div className="w-full max-w-md p-8 mx-auto bg-white shadow-xl rounded-2xl text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          Account Settings
        </h2>
        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
          <p>
            You are signed in securely using a linked social account (like
            Google or GitHub). Password changes are managed directly through
            your social provider.
          </p>
        </div>
         <div>
          <button
            onClick={() => navigator("/Todopages")}
            className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
          >
            Go back todopage-page
          </button>
        </div>
        
      </div>
    );
  }
     



  // Otherwise, return the standard password change form
  return (
    <div className="w-full max-w-md p-8 mx-auto bg-white shadow-xl rounded-2xl">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 font-medium text-white transition duration-200 rounded-lg ${
            isLoading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]"
          }`}
        >
          {isLoading ? "Updating..." : "Update Password"}
        </button>
      </form>
      <div>
        <button
          onClick={() => navigator("/Todopages")}
          className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
        >
          Go back to login-page
        </button>
      </div>
    </div>
  );
}
