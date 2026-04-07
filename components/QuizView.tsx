"use client";

import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, BookOpen, HelpCircle } from 'lucide-react';
import { saveQuizScore } from '../lib/firebase';

const QUIZ_DATA = {
  "Mathematics": [
    {
      question: "What is the derivative of x^2?",
      options: ["x", "2x", "x^2", "2"],
      answer: "2x",
      explanation: "According to the power rule in calculus, the derivative of x^n is n*x^(n-1). Therefore, the derivative of x^2 is 2x.",
      link: "https://en.wikipedia.org/wiki/Power_rule"
    },
    {
      question: "Which sequence begins with 0, 1, 1, 2, 3, 5, 8...?",
      options: ["Arithmetic progression", "Geometric progression", "Fibonacci sequence", "Harmonic sequence"],
      answer: "Fibonacci sequence",
      explanation: "The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones, usually starting with 0 and 1.",
      link: "https://en.wikipedia.org/wiki/Fibonacci_sequence"
    }
  ],
  "Physics": [
    {
      question: "What is the SI unit of force?",
      options: ["Joule", "Watt", "Newton", "Pascal"],
      answer: "Newton",
      explanation: "The Newton (N) is the International System of Units (SI) derived unit of force. It is defined as 1 kg⋅m/s².",
      link: "https://en.wikipedia.org/wiki/Newton_(unit)"
    },
    {
      question: "Which of Newton's laws states that for every action, there is an equal and opposite reaction?",
      options: ["First Law", "Second Law", "Third Law", "Law of Universal Gravitation"],
      answer: "Third Law",
      explanation: "Newton's third law of motion states that when two bodies interact, they apply forces to one another that are equal in magnitude and opposite in direction.",
      link: "https://en.wikipedia.org/wiki/Newton%27s_laws_of_motion"
    }
  ],
  "Chemistry": [
    {
      question: "What is the chemical symbol for Gold?",
      options: ["Go", "Au", "Ag", "Gd"],
      answer: "Au",
      explanation: "The chemical symbol for Gold is Au, derived from the Latin word 'aurum', meaning 'shining dawn'.",
      link: "https://en.wikipedia.org/wiki/Gold"
    },
    {
      question: "What is the pH of pure water at room temperature?",
      options: ["0", "7", "14", "10"],
      answer: "7",
      explanation: "Pure water has a pH of 7 at 25 °C, making it neutral (neither acidic nor basic).",
      link: "https://en.wikipedia.org/wiki/PH"
    }
  ],
  "Biology": [
    {
      question: "What is known as the powerhouse of the cell?",
      options: ["Nucleus", "Ribosome", "Mitochondria", "Endoplasmic Reticulum"],
      answer: "Mitochondria",
      explanation: "Mitochondria are often referred to as the powerhouses of the cell because they generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.",
      link: "https://en.wikipedia.org/wiki/Mitochondrion"
    },
    {
      question: "What molecule carries genetic instructions in all living things?",
      options: ["RNA", "Protein", "DNA", "Carbohydrate"],
      answer: "DNA",
      explanation: "Deoxyribonucleic acid (DNA) is a polymer composed of two polynucleotide chains that coil around each other to form a double helix carrying genetic instructions.",
      link: "https://en.wikipedia.org/wiki/DNA"
    }
  ],
  "Computer Science": [
    {
      question: "What does HTML stand for?",
      options: ["HyperText Markup Language", "High-Level Text Machine Language", "Hyperlink and Text Markup Language", "Home Tool Markup Language"],
      answer: "HyperText Markup Language",
      explanation: "HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser.",
      link: "https://en.wikipedia.org/wiki/HTML"
    },
    {
      question: "Which data structure uses LIFO (Last In, First Out)?",
      options: ["Queue", "Tree", "Graph", "Stack"],
      answer: "Stack",
      explanation: "A stack is an abstract data type that serves as a collection of elements, with two main principal operations: Push (adds an element) and Pop (removes the most recently added element).",
      link: "https://en.wikipedia.org/wiki/Stack_(abstract_data_type)"
    }
  ],
  "Engineering": [
    {
      question: "Which of the following is considered a simple machine?",
      options: ["Engine", "Lever", "Battery", "Transistor"],
      answer: "Lever",
      explanation: "A lever is a simple machine consisting of a beam or rigid rod pivoted at a fixed hinge, or fulcrum.",
      link: "https://en.wikipedia.org/wiki/Lever"
    },
    {
      question: "What is the primary purpose of a structural truss?",
      options: ["To generate electricity", "To store water", "To distribute weight and handle tension/compression", "To insulate heat"],
      answer: "To distribute weight and handle tension/compression",
      explanation: "A truss is an assembly of beams or other elements that creates a rigid structure, commonly used in bridges and roofs to distribute weight and manage tension and compression forces.",
      link: "https://en.wikipedia.org/wiki/Truss"
    }
  ]
};

export default function QuizView({ userId, onComplete }: { userId: string | null, onComplete: () => void }) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!selectedOption || !selectedTopic) return;
    
    const currentQuestion = QUIZ_DATA[selectedTopic as keyof typeof QUIZ_DATA][currentQuestionIdx];
    const isCorrect = selectedOption === currentQuestion.answer;
    
    if (isCorrect) {
      setScore(s => s + 1);
    }
    
    setIsAnswered(true);
  };

  const handleNext = async () => {
    if (!selectedTopic) return;
    
    const questions = QUIZ_DATA[selectedTopic as keyof typeof QUIZ_DATA];
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Finish quiz
      const finalScore = score + (selectedOption === questions[currentQuestionIdx].answer ? 1 : 0);
      const percentage = Math.round((finalScore / questions.length) * 100);
      
      if (userId) {
        await saveQuizScore(userId, selectedTopic, percentage);
      }
      
      setQuizFinished(true);
    }
  };

  if (!selectedTopic) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="font-bold text-lg tracking-widest text-white/70 mb-4">SELECT A QUIZ TOPIC</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.keys(QUIZ_DATA).map(topic => (
            <button 
              key={topic}
              onClick={() => handleTopicSelect(topic)}
              className="glass-button p-8 hover:bg-white/20 transition-all flex flex-col items-center gap-4 text-center"
            >
              <HelpCircle className="w-12 h-12 text-white/60" strokeWidth={1.5} />
              <span className="font-bold text-lg text-white">{topic}</span>
              <span className="text-sm text-white/50">{QUIZ_DATA[topic as keyof typeof QUIZ_DATA].length} Questions</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (quizFinished) {
    const totalQuestions = QUIZ_DATA[selectedTopic as keyof typeof QUIZ_DATA].length;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-12">
        <div className="w-32 h-32 rounded-full glass-panel flex items-center justify-center">
          <span className="text-4xl font-bold text-white">{percentage}%</span>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h2>
          <p className="text-white/70">You scored {score} out of {totalQuestions} on {selectedTopic}.</p>
          {userId && <p className="text-sm text-white/50 mt-2">Your score has been saved to your profile.</p>}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setSelectedTopic(null)}
            className="glass-button px-8 py-3"
          >
            Back to Quizzes
          </button>
          <button 
            onClick={onComplete}
            className="glass-button px-8 py-3 bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30"
          >
            Continue Exploring
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = QUIZ_DATA[selectedTopic as keyof typeof QUIZ_DATA][currentQuestionIdx];
  const isCorrect = selectedOption === currentQuestion.answer;

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-sm tracking-widest text-white/50 uppercase">{selectedTopic} QUIZ</h2>
        <span className="font-bold text-sm text-white/60">Question {currentQuestionIdx + 1} of {QUIZ_DATA[selectedTopic as keyof typeof QUIZ_DATA].length}</span>
      </div>
      
      <div className="glass-panel p-8">
        <h3 className="text-xl font-bold text-white mb-8 leading-relaxed">{currentQuestion.question}</h3>
        
        <div className="flex flex-col gap-4">
          {currentQuestion.options.map((option, i) => {
            let btnClass = "rounded-2xl p-5 text-left font-semibold transition-all border ";
            
            if (!isAnswered) {
              btnClass += selectedOption === option 
                ? "bg-white/20 border-white/40 text-white" 
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10";
            } else {
              if (option === currentQuestion.answer) {
                btnClass += "bg-emerald-500/20 border-emerald-500/40 text-emerald-300";
              } else if (option === selectedOption) {
                btnClass += "bg-red-500/20 border-red-500/40 text-red-300";
              } else {
                btnClass += "bg-white/5 border-white/10 opacity-50 text-white/40";
              }
            }
            
            return (
              <button 
                key={i}
                onClick={() => handleOptionSelect(option)}
                disabled={isAnswered}
                className={btnClass}
              >
                <div className="flex justify-between items-center">
                  <span>{option}</span>
                  {isAnswered && option === currentQuestion.answer && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  {isAnswered && option === selectedOption && option !== currentQuestion.answer && <XCircle className="w-5 h-5 text-red-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {isAnswered ? (
        <div className="glass-panel p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start gap-4">
            {isCorrect ? (
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            )}
            <div>
              <h4 className={`font-bold text-lg mb-2 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </h4>
              <p className="text-white/80 leading-relaxed mb-4">{currentQuestion.explanation}</p>
              <a 
                href={currentQuestion.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-white/90 hover:underline"
              >
                <BookOpen className="w-4 h-4" />
                Read more about this topic
              </a>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <button 
              onClick={handleNext}
              className="glass-button px-6 py-3 flex items-center gap-2"
            >
              {currentQuestionIdx < QUIZ_DATA[selectedTopic as keyof typeof QUIZ_DATA].length - 1 ? 'Next Question' : 'Finish Quiz'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button 
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={`glass-button px-8 py-3 ${
              selectedOption 
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30' 
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );
}
