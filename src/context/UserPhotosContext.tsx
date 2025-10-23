import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/authConfig";
import { Client } from "@microsoft/microsoft-graph-client";

interface UserPhotosContextType {
  getUserPhoto: (email: string) => string | undefined;
  loadUserPhoto: (email: string) => Promise<void>;
}

const UserPhotosContext = createContext<UserPhotosContextType | undefined>(undefined);

export function UserPhotosProvider({ children }: { children: React.ReactNode }) {
  const { instance, accounts } = useMsal();
  const [userPhotos, setUserPhotos] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('userPhotos');
    return saved ? JSON.parse(saved) : {};
  });

  const getUserPhoto = (email: string): string | undefined => {
    return userPhotos[email.toLowerCase()];
  };

  const loadUserPhoto = async (email: string) => {
    if (!accounts[0] || userPhotos[email.toLowerCase()]) return;

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

      try {
        const photo = await graphClient
          .api(`/users/${email}/photo/$value`)
          .get();

        const base64data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(photo);
        });

        setUserPhotos(prev => {
          const newPhotos = {
            ...prev,
            [email.toLowerCase()]: base64data
          };
          localStorage.setItem('userPhotos', JSON.stringify(newPhotos));
          return newPhotos;
        });
      } catch (photoError) {
        console.error(`No photo found for user ${email}:`, photoError);
      }
    } catch (error) {
      console.error(`Error fetching photo for ${email}:`, error);
    }
  };

  return (
    <UserPhotosContext.Provider value={{ getUserPhoto, loadUserPhoto }}>
      {children}
    </UserPhotosContext.Provider>
  );
}

export const useUserPhotos = () => {
  const context = useContext(UserPhotosContext);
  if (!context) {
    throw new Error('useUserPhotos must be used within a UserPhotosProvider');
  }
  return context;
};