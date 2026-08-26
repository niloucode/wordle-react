import { Delete, CornerDownLeft } from "lucide-react"
import type React from "react";
import { useEffect, useReducer, useState } from "react";

import NONWORDLES from "@/assets/nonwordles.json";
import WORDLES from "@/assets/wordles.json";

import { Card } from "@/components/ui/card"

// Define types

type State = {
	type: "type" | "reveal" | "win" | "lose";
	text: string;
	guess: string;
	textPos: number;
	guessPos: number;
	keyboard: Array<String>;
};

type Action = {
	type: "appendGuess" | "removeGuessEnd" | "appendText" | "checkDone";
	value?: string;
};

type Evaluation = "=" | "/" | "X" | "?" | "_";

type LetterEvaluation  = {
	letter:string,
	evaluation: Evaluation
}

const KEYBOARD_KEYS = ["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"]

// Set constants
const COLS = 5;
const ROWS = 6;
const CELLS = ROWS * COLS;

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
	//
	return (
		<div
			className={`flex min-h-12 max-h-12 min-w-10 max-w-10 w-full justify-center 
		items-center text-2xl font-bold font-sans capitalize 
		${className}`}
			{...props}
		>
			{children}
		</div>
	);
}

// A div used to represent a key (literally a letter with a border)
export function Key({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	return (
		<Letter
			className={` border-b-5 border-2 border-foreground/45 ${className}`}
			{...props}
		>
			{children}
		</Letter>
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
				guessPos: state.text.length + state.guess.length,
				textPos: -1
			};

		case "removeGuessEnd":
			if (state.type !== "type") return state;

			return { ...state, type: "type", guess: state.guess.slice(0, -1), guessPos: -1 };

		case "appendText":
			if (state.type !== "reveal" && state.type !== "type") return state;

			return {
				...state,
				type: "reveal",
				text: state.text + "" + state.guess[0],
				guess: state.guess.slice(1),
				textPos: Math.floor(state.text.length/COLS),
				guessPos: -1,
			};

		case "checkDone":
			if (state.type !== "reveal") return state;

			// Win/Lose check
			for (let i = 0; i < ROWS; i++)
			{
				if (state.text.slice(i*COLS,i*COLS+COLS) === ANSWER)
					return { ...state, type: "win", guessPos: -1 };
			}
			if (state.text.length === CELLS)
				return { ...state, type: "lose", guessPos: -1 };

			return { ...state, type: "type", guess: "" };
	}
}

// Render Component
export function WordleMain({
	passMessage,
}: {
	passMessage: (msg: string) => void;
}) {
	const [state, dispatch] = useReducer(reducer, {
		type: "type",
		text: "",
		guess: "",
		textPos: -1,
		guessPos: -1,
		keyboard: Array.from("EEEEEEEEEEEEEEEEEEEEEEEEEE")
	});

	const [evalBoard, keyBoard] = evaluateWordleBoard(state.text,state.guess)
	const [error, setError] = useState(-1);

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

		let wordValid = state.guess.length === COLS && WORDS.includes(state.guess)

		if (wordValid) {			
			for (let i = 0; i < COLS; i++)
				dispatch({ type: "appendText" });

			dispatch({ type: "checkDone" });
		} else {
			setError(Math.floor((state.text.length+Math.min(state.guess.length+1,5))/ROWS ));
			setTimeout(() => setError(-1), 100);
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
			else if (state.guess.length < COLS) appendLetter(evt);
		}

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [state, error, state.guess.length,evalBoard,state.guessPos]);

	function judge (guess:string) {
		const countAnswer: Record<string, number> = {}
		const guessArr = Array.from(guess)
		let legend = Array(COLS)
			
		for (const i in Array.from(ANSWER))
			countAnswer[ANSWER[i]??""] = (countAnswer[ANSWER[i]??""] ?? 0) + 1

		for (let i = 0; i < guess.length; i++){
			let ch = guess[i] ?? ""
			if (guess[i] === ANSWER[i]){
				countAnswer[ch] = (countAnswer[ch] ?? 0) - 1
				legend[i] = "="
			}
		}

		for (const i in guessArr){
			let ch = guessArr[i] ?? ""
			if (legend[i] == "=")
				continue
			else if ((countAnswer[ch]??0) > 0){
						legend[i] = '/'
						countAnswer[ch] = (countAnswer[ch]??0) - 1
			}
			else
				legend[i]="X"
		}

		return legend
	}

	function evaluateWordleBoard(text:string,guess:string){
		const letterboardGrid: LetterEvaluation[][] = Array.from(
			{length: ROWS}, () => []
		);

		const keyboardGrid: LetterEvaluation[][] = KEYBOARD_KEYS.map(row =>
			Array.from(row, c => ({letter:c, evaluation:"_"}))
		);

		for (let i = 0; i < Math.floor(text.length/COLS); i++) {
			let currentLetters = text.slice(i*COLS,i*COLS+COLS)
			let currentEvals = judge(currentLetters)

			for (let j = 0; j < COLS; j++) {
				letterboardGrid[i]!.push(
					{ letter: currentLetters[j]??"", evaluation: currentEvals[j]}
				);

				const letter = currentLetters[j];
				const row = keyboardGrid.find(row => row.some(key => key.letter === letter));
				const key = row?.find(key => key.letter === letter);
				if (key && currentEvals[j] === '=')
					key.evaluation = '='
				else if (key && currentEvals[j] === '/' && key.evaluation === '_')
					key.evaluation = '/'

				
			}
		}
		console.log(keyboardGrid)

		let rowIdx = Math.floor(text.length/COLS);

		if (rowIdx < ROWS)
			for (let i = 0; i < COLS; i++)
			{

				if (i<guess.length)
				{
					let currentLetter = guess[i] ?? "";
					letterboardGrid[rowIdx]!.push(
						{ letter: currentLetter, evaluation: (i < guess.length -1)?
							'_':'?' }
					);
				}
				else
					letterboardGrid[Math.ceil(text.length/COLS)]!.push(
						{ letter: "", evaluation: "_" }
					);
			}
		
		rowIdx = Math.floor(text.length/COLS)+1;

		for (let i = rowIdx; i < ROWS; i++)
		{
			letterboardGrid[i] = Array.from({length:COLS},()=>({ letter: "", evaluation: "_" }));
		}

		return [letterboardGrid,keyboardGrid]
	}

	return <>
			<WordleLetterBoard key={state.guessPos} evals={evalBoard} pop={state.guessPos} reveal={state.textPos} error={error}/>
			<WordleKeyboard evals={keyBoard}/>
	</>
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

type EvaluationConfig = {
	name: string;
	className: string;
};

const EVALUATION_MAP: Record<Evaluation, EvaluationConfig> = {
	"=": { name: "correct", className: "bg-correct" },
	"/": { name: "included", className: "bg-included" },
	"X": { name: "notincluded", className: "bg-notincluded" },
	"?": { name: "background", className: "bg-background" },
	"_": { name: "background", className: "bg-background" },
};

interface WordleLetterBoardProps{
evals?:LetterEvaluation[][],pop:number,reveal:number,error:number
}

export function WordleLetterBoard({evals,pop,reveal,error}:WordleLetterBoardProps){

	return (
		<Card>
			<div className="grid grid-rows-6 gap-2 p-2 ">
			{/* Render existing placed letters */}
			{evals ? Array.from(evals).map((c, i) => {
				return <div key={"sample_key"+i+c} className={"flex gap-2 "+(error==i?"animate-shake":"")}>
					{c.map((d,j)=> {
						let idx = i*COLS+j
						let revealCell =
							d.evaluation !== "_" &&
							d.evaluation !== "?" &&
							reveal === i;

						let popCell =
							d.evaluation === "?" &&
							pop === idx;

						let evaluationConfig = EVALUATION_MAP[d.evaluation]
						return (
							<Letter
								key={idx}
								className={`${evaluationConfig.className} ${popCell?"animate-pop-in":""} ${revealCell?" animate-flip-reveal":""}`}
								style={{animationDelay: revealCell ? `${j*80}ms`:"", "--reveal-color": `var(--color-${evaluationConfig.name})`} as React.CSSProperties}
								>
								{d.letter}
							</Letter>
						);
					})}
				</div>
			}):""}
			</div>
		</Card>
	);
}

export function WordleKeyboard({evals}:{evals?:LetterEvaluation[][]}){
    return <Card className="flex-col flex gap-2 px-2">
        {evals ? evals.map((c,i)=>{
            return <div className="flex gap-2 justify-center" key={"keyboard-row-"+i}>
                {i===2 ? <Key className="min-w-14">
                    <Delete strokeWidth={1}/>
                </Key>:<></>}
				{(c).map((d, j) => {
					let evaluationConfig = EVALUATION_MAP[d.evaluation]
					return (
						<Key
							key={"keyboard-row-"+COLS*i+"col"+j+evaluationConfig.className}
							className={`${evaluationConfig.className}`}
							aria-label={`${d} $$ letter status`}>
							{d.letter}{d.evaluation}
						</Key>
					);
				})}
                {i===2 ? <Key className="min-w-14">
                        <CornerDownLeft strokeWidth={1}/>
                    </Key>:<></>}
            </div>
        }):""}
	</Card>
}