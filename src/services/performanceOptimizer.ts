
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PerformanceOptimizer {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly CRITICAL_TTL = 30 * 60 * 1000; // 30 minutes for critical data

  // Enhanced cache management
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Auto-cleanup if cache gets too large
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Lite version of critical resource preloading - faster initialization
  async preloadCriticalResourcesLite(): Promise<void> {
    const promises = [
      this.preloadImageProcessing(),
      this.prefetchUserDataLite()
    ];

    await Promise.allSettled(promises);
  }

  // Full preloading for background tasks
  async preloadCriticalResources(): Promise<void> {
    const promises = [
      this.preloadTesseractWorker(),
      this.preloadImageProcessing(),
      this.prefetchUserData()
    ];

    await Promise.allSettled(promises);
  }

  private async preloadTesseractWorker(): Promise<void> {
    try {
      // Skip if already initialized
      if (this.get('tesseract_initialized')) return;
      
      const { advancedOCR } = await import('@/services/advancedOCR');
      await advancedOCR.initialize();
      
      this.set('tesseract_initialized', true, this.CRITICAL_TTL);
    } catch (error) {
      console.warn('Failed to preload Tesseract worker:', error);
    }
  }

  private async preloadImageProcessing(): Promise<void> {
    // Optimize canvas creation
    if (this.get('canvas_ready')) return;
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      if (ctx) {
        canvas.width = 100;
        canvas.height = 100;
        ctx.clearRect(0, 0, 100, 100);
      }
      
      this.set('canvas_ready', true, this.CRITICAL_TTL);
    } catch (error) {
      console.warn('Failed to preload image processing:', error);
    }
  }

  // Lite version - only essential data
  private async prefetchUserDataLite(): Promise<void> {
    try {
      const cached = this.get('user_data_lite');
      if (cached) return;

      // Minimal user data fetch
      const { useAuthStore } = await import('@/stores/authStore');
      const user = useAuthStore.getState().user;
      
      if (user) {
        this.set('user_data_lite', { role: user.role, id: user.id }, this.CRITICAL_TTL);
      }
    } catch (error) {
      console.warn('Failed to prefetch lite user data:', error);
    }
  }

  // Full version for background
  private async prefetchUserData(): Promise<void> {
    try {
      const cached = this.get('user_documents');
      if (cached) return;

      const { useDocumentStore } = await import('@/stores/documentStore');
      const loadDocuments = useDocumentStore.getState().loadDocuments;
      
      // Load in background without blocking
      setTimeout(() => loadDocuments(), 1000);
    } catch (error) {
      console.warn('Failed to prefetch user data:', error);
    }
  }

  // Optimized image processing with quality vs speed balance
  optimizeImage(file: File, maxWidth: number = 1200): Promise<File> {
    return new Promise((resolve) => {
      // Check cache first with proper typing
      const cacheKey = `optimized_${file.name}_${file.size}`;
      const cached = this.get<File>(cacheKey);
      if (cached) {
        resolve(cached);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      const img = new Image();

      if (!ctx) {
        resolve(file);
        return;
      }

      img.onload = () => {
        // Calculate optimal dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = Math.floor(img.width * ratio);
        const newHeight = Math.floor(img.height * ratio);
        
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Use better image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob((blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            // Cache the result
            this.set(cacheKey, optimizedFile, this.DEFAULT_TTL);
            resolve(optimizedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.85);
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  // Enhanced debounce with immediate option
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    let callNow = immediate;
    
    return (...args: Parameters<T>) => {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      
      const shouldCallNow = callNow && !timeout;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (shouldCallNow) func.apply(this, args);
    };
  }

  // Enhanced cache cleanup with priority levels
  cleanupCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  // Memory usage monitoring
  getCacheStats() {
    return {
      size: this.cache.size,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length
    };
  }
}

export const performanceOptimizer = new PerformanceOptimizer();

// Optimized cleanup interval - less frequent
setInterval(() => {
  performanceOptimizer.cleanupCache();
}, 15 * 60 * 1000); // Every 15 minutes
