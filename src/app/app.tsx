import { RefreshCw } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { LetterBoard, PseudoBoard } from "./wordle-utils";

export function App() {
	const [displayText, setDisplayText] = useState("");
	const [pressToggle, setPressToggle] = useState(false);

	const handleRefresh = () => {
		setPressToggle(true);
		setTimeout(() => setPressToggle(false), 500);
		setDisplayText("Resetting..");
		setTimeout(() => setDisplayText(""), 1000);
	};

	return (
		<>
			<div className="absolute left-0 top-5 min-w-full max-h-[90%]">
				<Card
					className={
						(displayText ? "opacity-100 " : "opacity-0 ") +
						"bg-subtle mx-auto p-2 w-fit"
					}
				>
					<CardTitle>{displayText}</CardTitle>
				</Card>
			</div>
			<div className="min-w-full min-h-full">
				<Card className="mx-auto my-auto bg-subtle w-600 max-w-sm">
					<CardHeader>
						<CardTitle>Wordle</CardTitle>
						<CardDescription className="w-3/4">
							React Clone of Wordle. Hobby Imitation Project.
						</CardDescription>
						<CardAction>
							<Button variant="link" onClick={handleRefresh}>
								{pressToggle ? (
									<RefreshCw
										className="animate-better-spin"
										aria-label="Start a new game"
									/>
								) : (
									<RefreshCw />
								)}
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>
						{!pressToggle ? (
							<LetterBoard onEnd={(msg) => setDisplayText(msg)}></LetterBoard>
						) : (
							<PseudoBoard></PseudoBoard>
						)}
					</CardContent>
					<CardFooter className="flex-col gap-2">
						{/* Expect keyboard here */}
					</CardFooter>
				</Card>
			</div>
		</>
	);
}
