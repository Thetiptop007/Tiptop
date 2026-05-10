import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App";
import { AppWrapper } from "./components/common/PageMeta";
import { ThemeProvider } from "./context/ThemeContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { appQueryClient } from "./config/queryClient";
import { installBrowserRuntimeLogging } from "./utils/logger";

installBrowserRuntimeLogging();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={appQueryClient}>
    <ThemeProvider>
      <AppWrapper>
        <App />
      </AppWrapper>
    </ThemeProvider>
  </QueryClientProvider>,
);
