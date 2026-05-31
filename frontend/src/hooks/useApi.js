import { useCallback, useState } from 'react';

export function useApi(apiCall) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiCall(...args);
        setData(result);
        return result;
      } catch (requestError) {
        setError(requestError.message || 'Request failed');
        throw requestError;
      } finally {
        setIsLoading(false);
      }
    },
    [apiCall],
  );

  return { data, error, isLoading, execute };
}

export default useApi;
