import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

const container = document.getElementById('root');

if (container) {
  // Guard any DOM manipulations too
  container.classList?.add?.('app-root');

  const root = createRoot(container);
  root.render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster />
      </QueryClientProvider>
    </HelmetProvider>
  );
}

// Do not throw or side-effect if container is missing.
// This file will be loaded only by app.html, but this guard makes it safe forever.
