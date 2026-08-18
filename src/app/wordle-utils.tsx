import type React from "react";
import { useEffect, useState } from "react";
// To-do: Give source where you got wordles from
import NONWORDLES from "@/assets/nonwordles.json";
import WORDLES from "@/assets/wordles.json";

type LetterStatusType = "Correct" | "Included" | "Not Included" | "Empty";

// Set constants
const LETTERS_PER_LINE = 5;
const GUESSES = 6;
const TOTAL_LETTERS = GUESSES * LETTERS_PER_LINE;

// Join Wordles and Nonwordles for the list of words used in validation
const WORDS = [...NONWORDLES, ...WORDLES];

// Pick among the 'Wordles' - these are words known to be answers in Wordle
const ANSWER = WORDLES[Math.floor(Math.random() * WORDLES.length)] ?? "";

// A div used to represent a letter
export function Letter({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	return (
		<>
			<div
				className={`flex h-15 w-full justify-center 
      items-center text-2xl font-bold font-sans capitalize 
      ${className}`}
				{...props}
			>
				{children}
			</div>
		</>
	);
}

const empty = Array.from(" ".repeat(TOTAL_LETTERS));

export function LetterBoard({ onEnd }: { onEnd: (msg: string) => void }) {

	const [text, setText] = useState(Array.from(""));
	const [guess, setGuess] = useState(Array.from(""));

	const [error, setError] = useState(false);
	const [pop, setPop] = useState(-1);
	const [adding, setAdding] = useState(false);
	const [done, setDone] = useState(false);

	function appendLetter(evt: KeyboardEvent) {
		if (
			evt.key != "Escape" &&
			evt.key != "Capslock" &&
			!evt.altKey &&
			!evt.metaKey &&
			!evt.ctrlKey &&
			!evt.shiftKey &&
			/^[A-Z]$/.test(evt.key.toUpperCase())
		) {
			evt.preventDefault();
			setGuess((guess) => [...guess, evt.key.toString().toLowerCase()]);
		}
		setPop(guess.length);
	}

	function deleteLetter() {
		setGuess((guess) => guess.slice(0, -1));
	}

	function revealResult() {
		let i = 0;
		const savedGuess = guess;
		setAdding(true);

		const reassignLetter = () => {
			const appendedLetter = guess[i++] ?? "";
			setText((text) => [...text, appendedLetter]);
			setGuess((guess) => guess.slice(1));
		};

		reassignLetter();

		const countdown = () => {
			if (i < 5) reassignLetter();
			else {
				clearInterval(interval);
				setAdding(false);
				if (
					savedGuess.join("").toLowerCase() === ANSWER ||
					Math.floor(text.length / LETTERS_PER_LINE) === GUESSES - 1
				) {
					onEnd(ANSWER.toUpperCase());
					setDone(true);
				}
			}
		};

		const interval = setInterval(countdown, 500);
	}

	function errorShake() {
		setError(true);
		setPop(-99);
		setTimeout(() => setError(false), 100);
	}

	useEffect(() => {
		function handleKeyDown(evt: KeyboardEvent) {
			if (evt.key === "Backspace") deleteLetter();
			else if (evt.key === "Enter") {
				evt.preventDefault();
				if (
					guess.length === LETTERS_PER_LINE &&
					WORDS.includes(guess.join("").toLowerCase())
				)
					revealResult();
				else errorShake();
			} else if (guess.length < LETTERS_PER_LINE) {
				if (!adding && !done) appendLetter(evt);
			}
		}

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [guess, error, adding]);

	const bgStatusMap: Record<LetterStatusType, string> = {
		Correct: "bg-correct",
		Included: "bg-wrong",
		"Not Included": "bg-done",
		Empty: "bg-background",
	};

	return (
		<div className="grid grid-cols-5 gap-2">
			{/* Render existing placed letters */}
			{text.map((c, i) => {
				let letterStatus: LetterStatusType;

				// If character c matches corresponding char in ANSWER
				if (c === ANSWER[i % LETTERS_PER_LINE]) letterStatus = "Correct";
				// Else, if character c is in ANSWER
				else if (ANSWER.includes(c)) letterStatus = "Included";
				// Else character isn't even included
				else letterStatus = "Not Included";

				return (
					<Letter
						key={i}
						className={`animate-flip-reveal ${bgStatusMap[letterStatus]}`}
						aria-label={`${c} ${letterStatus}`}
					>
						{c}
					</Letter>
				);
			})}

			{/* Render user's current unsubmitted input */}
			{guess.map((c, i) => {
				return (
					<Letter
						key={i}
						className={`
          ${error ? "animate-shake" : ""} 
          ${pop === i ? "animate-pop-in" : ""} 
          ${bgStatusMap["Empty"]}`}
						aria-label={`${c} Inputted`}
					>
						{c}
					</Letter>
				);
			})}

			{/* Render the empty squares */}
			{empty.map((_, i) => {
				// Render squares until the limit
				if (i + guess.length + text.length < TOTAL_LETTERS)
					return (
						<Letter
							key={i}
							className={`${bgStatusMap["Empty"]}`}
							aria-label={`Empty`}
						/>
					);
			})}
		</div>
	);
}

export function PseudoBoard() {
	const empty = Array.from(" ".repeat(TOTAL_LETTERS));
	return (
		<>
			<div className="grid grid-cols-5 gap-2">
				{empty.map((_, i) => {
					return <Letter key={i} className={" bg-background"} />;
				})}
			</div>
		</>
	);
}
