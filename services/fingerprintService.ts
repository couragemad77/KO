
export const FINGERPRINT_SERVICE_URL = 'http://localhost:5000';

export const fingerprintService = {
  /**
   * Triggers the local hardware to scan a finger.
   * Returns a promise with the fingerprint template string.
   */
  captureTemplate: async (): Promise<{ success: boolean; template?: string; error?: string }> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for user to place finger

      const response = await fetch(`${FINGERPRINT_SERVICE_URL}/scan`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Hardware error');
      }

      const data = await response.json();
      return { success: true, template: data.template };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Scan timed out. Please try again.' };
      }
      if (err.message.includes('Failed to fetch')) {
        return { success: false, error: 'Fingerprint service not running on this machine (Port 5000).' };
      }
      return { success: false, error: err.message || 'Unknown biometric error' };
    }
  },

  /**
   * Pings the service to check if hardware is ready
   */
  checkStatus: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${FINGERPRINT_SERVICE_URL}/status`);
      return res.ok;
    } catch {
      return false;
    }
  }
};
