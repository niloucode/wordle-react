import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "@fontsource-variable/inter/wght.css";

const app = (
	<StrictMode>
		<App />
	</StrictMode>
);

const elem = document.getElementById("root")!;
(import.meta.hot.data.root ??= createRoot(elem)).render(app);
