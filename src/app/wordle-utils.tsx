import React, {useState,useEffect} from "react"

import WORDS1 from '@/assets/nonwordles.json'
import WORDS2 from '@/assets/wordles.json'

const WORDS = [...WORDS1, ...WORDS2]
const LETTERS_PER_LINE = 5
const GUESSES = 6
const TOTAL_LETTERS = GUESSES * LETTERS_PER_LINE
const ANSWER = WORDS[Math.floor(Math.random()*WORDS.length)] ?? ""
console.log(ANSWER)

export function Letter ({className,children,...props}:React.ComponentProps<"div">){
  return <>
    <div
      className={`flex h-15 w-full justify-center 
        items-center text-2xl font-inter 
        font-bold capitalize ${className}`}
      {...props}>
    {children}
    </div>
  </>
}

export function LetterBoard({onEnd}:{onEnd:(msg:string)=>void}){  
  const [text, setText] = useState(Array.from(""))
  const [guess,setGuess] = useState(Array.from(""))
  const empty = Array.from(' '.repeat(TOTAL_LETTERS-text.length))
  const [error,setError] = useState(false)
  const [pop,setPop] = useState(-1)
  const [adding, setAdding] = useState(false)
  const [done, setDone] = useState(false)
  
  function appendLetter(evt:KeyboardEvent){
    if (
      evt.key != "Escape" &&
      evt.key != "Capslock" && 
      !evt.altKey && 
      !evt.metaKey && 
      !evt.ctrlKey && 
      !evt.shiftKey &&
      /^[A-Z]$/.test(evt.key.toUpperCase())
      )
    {
      evt.preventDefault()
      setGuess(guess => [...guess,evt.key.toString().toLowerCase()])
    }
    setPop(guess.length)
  }
  
  function deleteLetter(){
    setGuess(guess => guess.slice(0,-1))
  }

  function revealResult(){
    let i = 0
    let savedGuess = guess
    setAdding(true)

    const reassignLetter = () => {
      var appendedLetter = guess[i++] ?? ""
      setText(text => [...text,appendedLetter])
      setGuess(guess => guess.slice(1))
    }

    reassignLetter();

    const countdown = () => {
      if (i < 5)
        reassignLetter()
      else {
        clearInterval(interval)
        setAdding(false)
        if ((savedGuess.join("").toLowerCase() === ANSWER) ||
            (Math.floor(text.length / LETTERS_PER_LINE) === GUESSES-1))
        {
          onEnd(ANSWER.toUpperCase())
          setDone(true)
        }
      }
    }

    var interval = setInterval(countdown, 500)
  }

  function errorShake(){
    setError(true)
    setPop(-99)
    setTimeout(()=>setError(false), 100)
  }

  useEffect(() => {
    function handleKeyDown(evt:KeyboardEvent) {
      if (evt.key === "Backspace")
        deleteLetter()
      else if (evt.key === "Enter"){
        evt.preventDefault()
        if (guess.length === LETTERS_PER_LINE && WORDS.includes(guess.join("").toLowerCase())) 
          revealResult()
        else
          errorShake()
      }
      else if (guess.length < LETTERS_PER_LINE)
      {
        if (!adding && !done)
          appendLetter(evt)
      }
        
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown) } 

  },[guess,error,adding])

  return (
  <>
    <div className="grid grid-cols-5 gap-2">
      {text.map((c,i) => {
        return <Letter 
          key={i} 
          className={"animate-flip-reveal "+ 
          (c===ANSWER[i%5]?"bg-correct": 
          ANSWER.includes(c)?"bg-wrong":
          "bg-done")}>
          {c}
        </Letter>
      })}
      {guess.map((c,i)=>{
        return <Letter 
          key={i}
          className={(error==true ? "animate-shake ":"")+
            (pop==i ? "animate-pop-in ":"")+"bg-background"}>
          {c}
        </Letter>
      })}
      {empty.map((_,i) => {
        if (i+guess.length+text.length < TOTAL_LETTERS)
          return <Letter
            key={i}
            className={" bg-background"}/>
      })}
      
    </div>
  </>
  )
}

export function PseudoBoard(){
  const empty = Array.from(' '.repeat(TOTAL_LETTERS))
  return (
  <>
    <div className="grid grid-cols-5 gap-2">
      {empty.map((_,i) => {
        return <Letter
          key={i}
          className={" bg-background"}/>
      })}
    </div>
  </>)
}