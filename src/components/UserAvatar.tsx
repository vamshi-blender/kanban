import { useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/authConfig";
import { Client } from "@microsoft/microsoft-graph-client";
import { UserCircle } from 'lucide-react';

interface UserData {
  displayName?: string;
  photo?: string;
}

export default function UserAvatar() {
  const { instance, accounts } = useMsal();
  const [userData, setUserData] = useState<UserData>(() => {
    // Initialize from localStorage if available
    const savedData = localStorage.getItem('userData');
    return savedData ? JSON.parse(savedData) : {};
  });

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error("Login failed:", e);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    setUserData({});
    instance.logoutPopup().catch(e => {
      console.error("Logout failed:", e);
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (accounts[0]) {
        try {
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0]
          });

          const graphClient = Client.init({
            authProvider: (done) => {
              done(null, response.accessToken);
            }
          });

          // Get user profile
          const user = await graphClient.api('/me').get();
          
          try {
            const photoResponse = await fetch(`https://graph.microsoft.com/v1.0/me/photo/$value`, {
              headers: {
                Authorization: `Bearer ${response.accessToken}`
              }
            });

            if (photoResponse.ok) {
              const blob = await photoResponse.blob();
              const base64data = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });

              const newUserData = {
                displayName: user.displayName,
                photo: base64data
              };
              setUserData(newUserData);
              localStorage.setItem('userData', JSON.stringify(newUserData));
            } else {
              throw new Error('Failed to fetch photo');
            }
          } catch (photoError) {
            console.error("Error fetching photo:", photoError);
            const newUserData = { displayName: user.displayName };
            setUserData(newUserData);
            localStorage.setItem('userData', JSON.stringify(newUserData));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [accounts, instance]);

  if (accounts.length > 0) {
    return (
      <div className="relative group">
        {userData.photo ? (
          <img
            src={userData.photo}
            alt={userData.displayName}
            className="w-8 h-8 rounded-full cursor-pointer object-cover"
            onClick={handleLogout}
          />
        ) : (
          <UserCircle
            size={32}
            className="text-white cursor-pointer"
            onClick={handleLogout}
          />
        )}
        <div className="absolute right-0 mt-2 w-48 py-2 bg-[#181b21] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="px-4 py-2 text-sm text-white">
            {userData.displayName}
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2D3139]"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-[#181b21] text-white hover:bg-[#1C1F26] transition-colors duration-200"
    >
      <UserCircle size={20} />
      Sign in
    </button>
  );
}