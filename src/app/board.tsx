import { Delete, CornerDownLeft } from "lucide-react"
import type React from "react";
import { useEffect, useReducer, useState } from "react";
// To-do: Give source where you got wordles from
// import NONWORDLES from "@/assets/nonwordles.json";
import WORDLES from "@/assets/wordles.json";
import WORDS from "@/assets/5-letter-words.json";

import { Card } from "@/components/ui/card"
import { getSourceMapsSupport } from "node:module";

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



// Set constants
const COLS = 5;
const ROWS = 6;
const CELLS = ROWS * COLS;
const ANSWER = "gains"

// Join Wordles and Nonwordles for the list of words used in validation
// const WORDS = [...NONWORDLES, ...WORDLES];

// Pick among the 'Wordles' - these are words known to be answers in Wordle
// const ANSWER = WORDLES[Math.floor(Math.random() * WORDLES.length)] ?? "";

// A div used to represent a letter
export function Letter({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	//text-2xl font-bold
	return (
		<div
			className={`flex min-h-12 max-h-12 min-w-10 max-w-10 w-full justify-center 
		items-center text-xs font-sans capitalize 
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
				if (state.text.slice(Math.floor(i/COLS),Math.floor(i/COLS)+COLS) === ANSWER)
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

	var evalBoard = evaluateWordleBoard(state.text,state.guess)
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

			evalBoard = evaluateWordleBoard(state.text,state.guess)
		}

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [state, error, state.guess.length,evalBoard]);

	useEffect(()=>{
		evalBoard = evaluateWordleBoard(state.text,state.guess)
	},[state])

	function judge (guess:string) {
		const countAnswer: Record<string, number> = {}
		const guessArr = Array.from(guess)
		let legend = Array(COLS)
			
		for (const i in Array.from(ANSWER))
			countAnswer[ANSWER[i]??""] = (countAnswer[ANSWER[i]??""] ?? 0) + 1

		console.log(countAnswer)
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

		console.log(legend)
		return legend
	}

	function evaluateWordleBoard(text:string,guess:string){
		const wordGrid: LetterEvaluation[][] = Array.from(
			{length: ROWS}, () => []
		);

		for (let i = 0; i < Math.floor(text.length/COLS); i++) {
			let currentLetters = text.slice(i*COLS,i*COLS+COLS)
			let currentEvals = judge(currentLetters)
			console.log(i+": "+currentEvals+" "+currentLetters)

			for (let j = 0; j < COLS; j++) {
				wordGrid[i]!.push(
					{ letter: currentLetters[j]??"", evaluation: currentEvals[j]}
				);
			}
		}

		let rowIdx = Math.floor(text.length/COLS);
		if (rowIdx < ROWS)
			for (let i = 0; i < COLS; i++)
			{

				if (i<guess.length)
				{
					let currentLetter = guess[i] ?? "";
					wordGrid[rowIdx]!.push(
						{ letter: currentLetter, evaluation: (i < guess.length -1)?
							'_':'?' }
					);
				}
				else
					wordGrid[Math.ceil(text.length/COLS)]!.push(
						{ letter: "", evaluation: "_" }
					);
			}
		
		rowIdx = Math.floor(text.length/COLS)+1;

		for (let i = rowIdx; i < ROWS; i++)
		{
			wordGrid[i] = Array.from({length:COLS},()=>({ letter: "", evaluation: "_" }));
		}

		return wordGrid
	}

	return <>
			<WordleLetterBoard key={state.guessPos} evals={evalBoard} pop={state.guessPos} reveal={state.textPos} error={error}/>
			{/* <WordleKeyboard/> */}
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

interface WordleLetterBoardProps{
evals?:LetterEvaluation[][],pop:number,reveal:number,error:number
}

const sbStatusMap: Record<Evaluation, string> = {
	"=": "correct",
	"/": "included",
	"X": "notincluded",
	"?": "background",
	"_": "background",
};

export function WordleLetterBoard({evals,pop,reveal,error}:WordleLetterBoardProps){

	return (
		<Card>
			<div className="grid grid-rows-6 gap-2 p-2 ">
			{/* Render existing placed letters */}
			{evals ? Array.from(evals).map((c, i) => {
				return <div key={"sample_key"+i+c} className={"flex gap-2 "+(error==i?"animate-shake":"")}>
					{c.map((d,j)=> {
						let flipDelay = ` animate-flip-reveal `
						let revealCell = (d.evaluation != "_" && d.evaluation != "?") && reveal == i
						return (
							<Letter
								key={i*COLS+j}
								className={(` bg-${sbStatusMap[d.evaluation]} `.toLowerCase())}
								style={{animationDelay: (revealCell) ? `${j*80}ms`:"", "--reveal-color": `var(--color-${sbStatusMap[d.evaluation]})`} as React.CSSProperties}
								>
								{d.letter+`bg-${sbStatusMap[d.evaluation]}`}
							</Letter>
						);
					})}
				</div>
			}):""}
			</div>
		</Card>
	);
}

export function WordleKeyboard({evals=[[{letter:"Q",evaluation:"="}]]}:{evals?:LetterEvaluation[][]}){
    return <Card className="flex-col flex gap-2 px-2">
        {evals.map((c,i)=>{
            return <div className="flex gap-2 justify-center" key={"keyboard-row-"+i}>
                {i===2 ? <Key className="min-w-14">
                    <Delete strokeWidth={1}/>
                </Key>:<></>}
				{Array.from(c).map((d, j) => {
					return (
						<Key
							key={"keyboard-row-"+i+"col"+j}
							className={` ${sbStatusMap[d.evaluation as Evaluation]}`}
							aria-label={`${d} $$ letter status`}>
							{d.letter}
						</Key>
					);
				})}
                {i===2 ? <Key className="min-w-14">
                        <CornerDownLeft strokeWidth={1}/>
                    </Key>:<></>}
            </div>
        })}
	</Card>
}