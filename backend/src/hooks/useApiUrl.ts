import { createContext, createElement, ReactNode, useContext, useEffect, useState } from "react";

const defaultUrl = "http://localhost:9823";

interface Store {
  apiUrl: string;
  setApiUrl: (url: string) => void;
  resetApiUrl: () => void;
}

const ApiUrlContext = createContext<Store | null>(null);

export function ApiUrlProvider({ children }: { children: ReactNode }) {
  const [apiUrl, setApiUrl] = useState(() => {
    if (typeof window === "undefined") {
      return defaultUrl;
    }

    return localStorage.getItem("apiUrl") ?? defaultUrl;
  });

  useEffect(() => {
    localStorage.setItem("apiUrl", apiUrl);
  }, [apiUrl]);

  function resetApiUrl() {
    setApiUrl(defaultUrl);
  }

  return createElement(
    ApiUrlContext.Provider,
    {
      value: {
        apiUrl,
        setApiUrl,
        resetApiUrl,
      },
    },
    children
  );
}

export default function useApiUrl() {
  const context = useContext(ApiUrlContext);

  if (!context) {
    throw new Error("useApiUrl must be used within ApiUrlProvider");
  }

  return context;
}
