import type React from "react";
import { useEffect, useReducer, useState } from "react";

import { Delete, CornerDownLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import NONWORDLES from "@/assets/nonwordles.json";
import WORDLES from "@/assets/wordles.json";

// Define types

type State = {
	type: "type" | "reveal" | "win" | "lose";
	text: string;
	guess: string;
};

type Action =
	| { type: "appendGuess"; value: string }
	| { type: "removeGuessEnd" | "appendText" | "checkDone" };

type Evaluation = "=" | "/" | "X" | "_";

type LetterEvaluation = {
	letter: string;
	evaluation: Evaluation;
};

type EvaluationConfig = {
	name: string;
	className: string;
};

const KEYBOARD_KEYS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

const EVALUATION_RANK = "_X/=";

const EVALUATION_MAP: Record<Evaluation, EvaluationConfig> = {
	"=": { name: "correct", className: "bg-correct" },
	"/": { name: "included", className: "bg-included" },
	"X": { name: "notincluded", className: "bg-notincluded" },
	"_": { name: "background", className: "bg-background" },
};

// Set constants
const COLS = 5;
const ROWS = 6;
const CELLS = ROWS * COLS;

// Join Wordles and Nonwordles for the list of words used in validation
const WORDS = [...NONWORDLES, ...WORDLES];

// Pick among the 'Wordles' - these are words known to be answers in Wordle
const ANSWER = WORDLES[Math.floor(Math.random() * WORDLES.length)] ?? "";

// A div used to represent a letter
export function Letter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"text-foreground border-2 border-foreground/50 w-[clamp(1rem,7vw,3.5rem)] flex h-16 justify-center items-center text-2xl font-bold font-sans capitalize select-none",
				className,
			)}
			{...props}
		/>
	);
}

export function Key({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<Letter
			className={cn("border-b-5 h-12 active:scale-110 w-[clamp(1rem,7vw,3rem)]", className)}
			{...props}
		/>
	);
}

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "appendGuess":
			if (state.type !== "type" || state.guess.length === COLS) return state;

			return { ...state, guess: state.guess + action.value };

		case "removeGuessEnd":
			if (state.type !== "type") return state;

			return { ...state, guess: state.guess.slice(0, -1) };

		case "appendText":
			if (state.type === "win" || state.type === "lose") return state;

			return {
				...state,
				type: "reveal",
				text: state.text + state.guess[0],
				guess: state.guess.slice(1),
			};

		case "checkDone":
			if (state.type !== "reveal") return state;

			if (state.text.endsWith(ANSWER)) return { ...state, type: "win" };
			if (state.text.length === CELLS) return { ...state, type: "lose" };
			return { ...state, type: "type" };
	}
}

function judge(guess: string): Evaluation[] {
	const countAnswer: Record<string, number> = {};
	for (const ch of ANSWER) countAnswer[ch] = (countAnswer[ch] ?? 0) + 1;

	const exact = Array.from(guess, (ch, i) => {
		if (ch !== ANSWER[i]) return false;
		countAnswer[ch] = (countAnswer[ch] ?? 0) - 1;
		return true;
	});

	return Array.from(guess, (ch, i) => {
		if (exact[i]) return "=";
		if ((countAnswer[ch] ?? 0) <= 0) return "X";
		countAnswer[ch] = (countAnswer[ch] ?? 0) - 1;
		return "/";
	});
}

function evaluateWordleBoard(text: string, guess: string) {
	const keyboardGrid: LetterEvaluation[][] = KEYBOARD_KEYS.map(row =>
		Array.from(row, c => ({ letter: c, evaluation: "_" })),
	);
	const keys = keyboardGrid.flat();

	const submittedWords = Array.from({ length: Math.floor(text.length / COLS) }, (_, i) =>
		text.slice(i * COLS, i * COLS + COLS),
	);
	const words = [...submittedWords, guess];

	const letterboardGrid = Array.from({ length: ROWS }, (_, i) => {
		const word = words[i] ?? "";
		const evals = i < submittedWords.length ? judge(word) : [];

		return Array.from({ length: COLS }, (_, j): LetterEvaluation => {
			const letter = word[j] ?? "";
			const evaluation = evals[j] ?? "_";
			const key = keys.find(key => key.letter === letter);
			if (key && EVALUATION_RANK.indexOf(evaluation) > EVALUATION_RANK.indexOf(key.evaluation))
				key.evaluation = evaluation;
			return { letter, evaluation };
		});
	});

	return [letterboardGrid, keyboardGrid] as const;
}

interface WordleKeyboardProps {
	evals: LetterEvaluation[][];
	onLetter: (letter: string) => void;
	onBackspace: () => void;
	onEnter: () => void;
}

function WordleKeyboard({ evals, onLetter, onBackspace, onEnter }: WordleKeyboardProps) {
	return (
		<Card className="flex-col flex gap-2 px-2">
			{evals.map((row, i) => (
				<div className="flex gap-2 justify-center" key={i}>
					{i === 2 && (
						<Key className="min-w-14 bg-background" onClick={onBackspace}>
							<Delete strokeWidth={2} />
						</Key>
					)}
					{row.map(({ letter, evaluation }) => (
						<Key
							key={letter}
							onClick={() => onLetter(letter)}
							className={EVALUATION_MAP[evaluation].className}
							aria-label={`${letter} letter status`}
						>
							{letter}
						</Key>
					))}
					{i === 2 && (
						<Key className="min-w-14 bg-background" onClick={onEnter}>
							<CornerDownLeft strokeWidth={2} />
						</Key>
					)}
				</div>
			))}
		</Card>
	);
}

interface WordleLetterBoardProps {
	evals: LetterEvaluation[][];
	reveal: number;
	error: number;
}

function WordleLetterBoard({ evals, reveal, error }: WordleLetterBoardProps) {
	return (
		<Card>
			<div className="grid grid-rows-6 gap-2 p-2">
				{evals.map((row, i) => (
					<div key={i} className={cn("flex gap-2", error === i && "animate-shake")}>
						{row.map(({ letter, evaluation }, j) => {
							const { name, className } = EVALUATION_MAP[evaluation];
							const revealCell = reveal === i;
							const popCell = letter && evaluation === "_";

							return (
								<Letter
									key={j}
									className={cn(className, popCell && "animate-pop-in", revealCell && "animate-flip-reveal")}
									style={{
										animationDelay: revealCell ? `${j * 500}ms` : "",
										"--reveal-color": `var(--color-${name})`,
									} as React.CSSProperties}
								>
									{letter}
								</Letter>
							);
						})}
					</div>
				))}
			</div>
		</Card>
	);
}

export function WordleMain({
	passMessage,
}: {
	passMessage: (msg: string) => void;
}) {
	const [state, dispatch] = useReducer(reducer, {
		type: "type",
		text: "",
		guess: "",
	});

	const [evalBoard, keyBoard] = evaluateWordleBoard(state.text, state.guess);
	const [error, setError] = useState(-1);

	function appendLetter(char: string) {
		dispatch({ type: "appendGuess", value: char });
	}

	function revealResult() {
		if (state.type !== "type") return;

		if (state.guess.length === COLS && WORDS.includes(state.guess)) {
			for (let i = 0; i < COLS; i++)
				dispatch({ type: "appendText" });

			setTimeout(() => dispatch({ type: "checkDone" }), 2500);
		} else {
			setError(Math.floor(state.text.length / COLS));
			setTimeout(() => setError(-1), 100);
		}
	}

	useEffect(() => {
		if (state.type === "win" || state.type === "lose") passMessage(ANSWER);
	}, [state.type]);

	useEffect(() => {
		function handleKeyDown(evt: KeyboardEvent) {
			if (evt.ctrlKey || evt.metaKey || evt.altKey) return;

			if (evt.key === "Backspace") dispatch({ type: "removeGuessEnd" });
			else if (evt.key === "Enter") {
				evt.preventDefault();
				revealResult();
			} else if (/^[a-zA-Z]$/.test(evt.key)) appendLetter(evt.key);
		}

		document.addEventListener("keydown", handleKeyDown);

		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [state]);

	return (
		<>
			<WordleLetterBoard
				evals={evalBoard}
				reveal={state.type === "reveal" ? state.text.length / COLS - 1 : -1}
				error={error}
			/>
			<WordleKeyboard
				evals={keyBoard}
				onLetter={appendLetter}
				onBackspace={() => dispatch({ type: "removeGuessEnd" })}
				onEnter={revealResult}
			/>
		</>
	);
}

export function PseudoBoard() {
	return (
		<div className="grid grid-cols-5 gap-2">
			{Array.from({ length: CELLS }, (_, i) => (
				<Letter key={i} className="bg-background" />
			))}
		</div>
	);
}
