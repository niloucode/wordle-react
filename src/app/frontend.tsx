import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { Toaster } from "@/components/ui/sonner"

import "@fontsource-variable/inter/wght.css";
import "../index.css";

const app = (
	<StrictMode>
		<Toaster 
		position="top-center"
		/>
		<App />
	</StrictMode>
);

const elem = document.getElementById("root")!;
(import.meta.hot.data.root ??= createRoot(elem)).render(app);
