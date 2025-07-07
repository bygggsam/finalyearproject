
import { useEffect } from 'react';
import { performanceOptimizer } from '@/services/performanceOptimizer';
import { useDocumentStore } from '@/stores/documentStore';

export const usePerformanceInit = () => {
  const { loadDocuments, documents } = useDocumentStore();

  useEffect(() => {
    let isActive = true;

    const initializePerformance = async () => {
      try {
        console.log('🚀 Initializing performance optimizations...');
        
        // Start background tasks without blocking UI
        const tasks = [
          // Only preload critical resources, skip heavy OCR initialization
          performanceOptimizer.preloadCriticalResourcesLite(),
          // Load documents only if cache is empty
          documents.length === 0 ? loadDocuments() : Promise.resolve()
        ];
        
        // Run tasks in background with shorter timeout
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));
        
        await Promise.race([
          Promise.allSettled(tasks),
          timeoutPromise
        ]);
        
        if (isActive) {
          console.log('✅ Performance initialization completed');
        }
      } catch (error) {
        console.warn('⚠️ Performance initialization failed:', error);
      }
    };

    // Defer initialization to not block initial render
    const timeoutId = setTimeout(initializePerformance, 100);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [loadDocuments, documents.length]);

  // Cleanup on unmount with debouncing
  useEffect(() => {
    return () => {
      const cleanup = () => performanceOptimizer.cleanupCache();
      setTimeout(cleanup, 1000); // Defer cleanup
    };
  }, []);
};
