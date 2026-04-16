import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { appQueryClient } from "./config/queryClient";

// Keep production console output clean and avoid leaking verbose internals.
if (import.meta.env.PROD) {
  console.log = () => undefined;
  console.info = () => undefined;
  console.debug = () => undefined;
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={appQueryClient}>
    <ThemeProvider>
      <AppWrapper>
        <App />
      </AppWrapper>
    </ThemeProvider>
  </QueryClientProvider>,
);
