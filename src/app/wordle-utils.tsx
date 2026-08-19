import type React from "react";
import { useEffect, useReducer, useState } from "react";
// To-do: Give source where you got wordles from
// import NONWORDLES from "@/assets/nonwordles.json";
import WORDLES from "@/assets/wordles.json";
import WORDS from "@/assets/5-letter-words.json";

// Define types
type LetterStatusType = "Correct" | "Included" | "Not Included" | "Empty";

type State = {
	type: "type" | "reveal" | "win" | "lose";
	text: string;
	guess: string;
	textPos: number;
	guessPos: number;
};

type Action = {
	type: "appendGuess" | "removeGuessEnd" | "appendText" | "checkDone";
	value?: string;
};

// Set constants
const LETTERS_PER_LINE = 5;
const GUESSES = 6;
const TOTAL_LETTERS = GUESSES * LETTERS_PER_LINE;

// Join Wordles and Nonwordles for the list of words used in validation
// const WORDS = [...NONWORDLES, ...WORDLES];

// Pick among the 'Wordles' - these are words known to be answers in Wordle
const ANSWER = WORDLES[Math.floor(Math.random() * WORDLES.length)] ?? "";

// A div used to represent a letter
export function Letter({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={`flex h-15 w-full justify-center 
		items-center text-2xl font-bold font-sans capitalize 
		${className}`}
			{...props}
		>
			{children}
		</div>
	);
}

// Define the reducer for the useReducer
function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "appendGuess":
			if (state.type !== "type") return state;

			return {
				...state,
				type: "type",
				guess: state.guess + action.value,
				guessPos: state.guess.length,
			};

		case "removeGuessEnd":
			if (state.type !== "type") return state;

			return { ...state, type: "type", guess: state.guess.slice(0, -1) };

		case "appendText":
			if (state.type !== "reveal" && state.type !== "type") return state;

			return {
				...state,
				type: "reveal",
				text: state.text + "" + action.value,
				guess: state.guess.slice(1),
				textPos: state.textPos + 1,
			};

		case "checkDone":
			if (state.type !== "reveal") return state;

			if (action.value === ANSWER)
				return { ...state, type: "win", guessPos: 0 };
			else if (state.text.length === TOTAL_LETTERS)
				return { ...state, type: "lose", guessPos: 0 };

			return { ...state, type: "type" };
	}
}

// Render Component
export function LetterBoard({
	passMessage,
}: {
	passMessage: (msg: string) => void;
}) {
	const [state, dispatch] = useReducer(reducer, {
		type: "type",
		text: "",
		guess: "",
		textPos: 0,
		guessPos: 0,
	});

	const [error, setError] = useState(false);

	function appendLetter(evt: KeyboardEvent) {
		// Ignore keyboard shortcuts
		if (evt.ctrlKey || evt.metaKey || evt.altKey) return;

		// Match only single characters
		if (/^[a-zA-Z]$/.test(evt.key)) {
			evt.preventDefault();
			dispatch({ type: "appendGuess", value: evt.key.toLowerCase() });
		}
	}

	function revealResult(evt: KeyboardEvent) {
		evt.preventDefault();

		if (
			state.guess.length === LETTERS_PER_LINE &&
			WORDS.includes(state.guess)
		) {
			const savedGuess = state.guess;
			let i = 0;
			
			const step = () => {
				dispatch({ type: "appendText", value: savedGuess[i++] });

				if (i === 5) {
					clearInterval(interval);
					dispatch({ type: "checkDone", value: savedGuess });
				}
			}

			step()
			const interval = setInterval(step, 500);
		} else {
			setError(true);
			setTimeout(() => setError(false), 100);
		}
	}

	useEffect(() => {
		// Only trigger when the reducer explicitly updates the state to win/lose
		if (state.type === "win" || state.type === "lose") {
			passMessage(ANSWER);
		}
	}, [state.type, ANSWER]); // Runs whenever state.type changes

	useEffect(() => {
		function handleKeyDown(evt: KeyboardEvent) {
			if (evt.key === "Backspace") dispatch({ type: "removeGuessEnd" });
			else if (evt.key === "Enter") revealResult(evt);
			else if (state.guess.length < LETTERS_PER_LINE) appendLetter(evt);
		}

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [state, error, state.guess.length]);

	const bgStatusMap: Record<LetterStatusType, string> = {
		Correct: "bg-correct",
		Included: "bg-wrong",
		"Not Included": "bg-done",
		Empty: "bg-background",
	};

	return (
		<div className="grid grid-cols-5 gap-2">
			{/* Render existing placed letters */}
			{Array.from(state.text).map((c, i) => {
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
			{Array.from(state.guess).map((c, i) => {
				return (
					<Letter
						key={state.guessPos + i}
						className={`
          ${error ? "animate-shake " : state.guessPos === i ? "animate-pop-in " : ""}
          ${bgStatusMap["Empty"]}`}
						aria-label={`${c} Inputted`}
					>
						{c}
					</Letter>
				);
			})}

			{/* Render all empty spaces */}
			{Array.from(
				{ length: TOTAL_LETTERS - state.guess.length - state.text.length },
				(_, i) => (
					<Letter key={i} className="bg-background" />
				),
			)}
		</div>
	);
}

export function PseudoBoard() {
	return (
		<div className="grid grid-cols-5 gap-2">
			{Array.from({ length: TOTAL_LETTERS }, (_, i) => (
				<Letter key={i} className="bg-background" />
			))}
		</div>
	);
}
