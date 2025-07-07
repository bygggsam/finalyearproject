
import React, { useEffect } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useAuthStore } from '@/stores/authStore';

interface DocumentProviderProps {
  children: React.ReactNode;
}

const DocumentProvider: React.FC<DocumentProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const { loadDocuments } = useDocumentStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User authenticated, loading documents...');
      loadDocuments();
    }
  }, [isAuthenticated, user, loadDocuments]);

  return <>{children}</>;
};

export default DocumentProvider;
