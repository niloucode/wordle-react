import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { WordleMain } from "./board";

export function App() {
	const [displayText, setDisplayText] = useState("");
	const [pressToggle, setPressToggle] = useState(false);

	const handleRefresh = () => {
		setPressToggle(true);
		setTimeout(() => setPressToggle(false), 500);
		toast.loading("RESETTING...");
		setTimeout(() => setDisplayText(""), 1000);
	};
	return (
		<>
			<div className="px-5 gap-5 absolute left-0 top-0 w-full bg-background h-10 flex items-center border-border border">
				<h1 className="text-2xl font-bold">Wordle</h1>
				<h2 className="font-light">React Clone of Wordle. Hobby Imitation Project.</h2>
				<Button variant="link" aria-label="Start a new game" className="ml-auto" onClick={handleRefresh}>
					{pressToggle ? (
						<RefreshCw
							className="animate-better-spin"
						/>
					) : (
						<RefreshCw />
					)}
				</Button>
			</div>
			<div className="min-w-full min-h-full flex flex-col gap-5">
				<WordleMain passMessage={(e)=>toast(e.toUpperCase())}/>
			</div>
		</>
	);
}
