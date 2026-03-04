import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ChevronRight,
  RotateCcw,
  Trophy,
  CheckCircle2,
  XCircle,
  Info,
  ArrowRight,
  PartyPopper,
  Medal,
  Star
} from 'lucide-react';
import { roleplayScenarios, RoleplayScenario } from '../lib/roleplayScenarios';

const SCORE_KEY = 'banker_roleplay_score';
const COMPLETED_KEY = 'banker_roleplay_completed';

export const Roleplay: React.FC = () => {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);

  // Load progress from localStorage
  useEffect(() => {
    const savedScore = localStorage.getItem(SCORE_KEY);
    const savedCompleted = localStorage.getItem(COMPLETED_KEY);

    if (savedScore) setScore(parseInt(savedScore));
    if (savedCompleted) setCompletedScenarios(JSON.parse(savedCompleted));
  }, []);

  // Save progress to localStorage
  const saveProgress = (newScore: number, newCompleted: string[]) => {
    localStorage.setItem(SCORE_KEY, newScore.toString());
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(newCompleted));
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const currentScenario = roleplayScenarios[currentScenarioIndex];

  const handleSubmit = () => {
    if (selectedOption === null || isAnswered) return;

    const isCorrect = selectedOption === currentScenario.correctAnswerIndex;
    setIsAnswered(true);
    setFeedbackType(isCorrect ? 'success' : 'error');

    let newScore = score;
    if (isCorrect) {
      newScore += 100; // Correct answer reward
      setScore(newScore);
    } else {
      newScore = Math.max(0, newScore - 25); // Minor penalty for fun
      setScore(newScore);
    }

    const newCompleted = [...completedScenarios, currentScenario.id];
    setCompletedScenarios(newCompleted);
    saveProgress(newScore, newCompleted);
  };

  const handleNext = () => {
    if (currentScenarioIndex < roleplayScenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setFeedbackType(null);
    } else {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setCurrentScenarioIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setCompletedScenarios([]);
    setShowResults(false);
    setFeedbackType(null);
    localStorage.removeItem(SCORE_KEY);
    localStorage.removeItem(COMPLETED_KEY);
  };

  if (showResults) {
    const totalPossible = roleplayScenarios.length * 100;
    const percentage = (score / totalPossible) * 100;

    return (
      <div className="max-w-4xl mx-auto p-6 animate-in fade-in zoom-in duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl overflow-hidden text-center p-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/30 mb-8">
            <Trophy className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>

          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Training Complete!</h2>
          <p className="text-xl text-gray-500 dark:text-slate-400 mb-8 max-w-lg mx-auto">
            Great job! You've successfully navigated all current scenarios.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
              <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <div className="text-3xl font-black text-gray-900 dark:text-white">{score}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Score</div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
              <Medal className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-3xl font-black text-gray-900 dark:text-white">{Math.round(percentage)}%</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Accuracy</div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
              <PartyPopper className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <div className="text-3xl font-black text-gray-900 dark:text-white">Expert</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rank</div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/25"
          >
            <RotateCcw className="w-5 h-5 mr-3" />
            Restart Training
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Roleplay Training</h1>
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Master your product knowledge through real-world scenarios.</p>
        </div>

        <div className="flex items-center gap-6 px-6 py-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{score}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Score</div>
          </div>
          <div className="w-px h-8 bg-gray-100 dark:bg-slate-800" />
          <div className="text-center">
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {currentScenarioIndex + 1}<span className="text-gray-300 dark:text-slate-700">/{roleplayScenarios.length}</span>
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scenario</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${((currentScenarioIndex) / roleplayScenarios.length) * 100}%` }}
        />
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
        <div className="p-8 md:p-12">
          {/* Category Tag */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-6">
            {currentScenario.category}
          </div>

          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
            {currentScenario.title}
          </h2>

          <div className="prose prose-slate dark:prose-invert max-w-none mb-10">
            <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed font-medium">
              {currentScenario.description.split('\n\n')[0]}
            </p>
            <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-900/20 italic text-blue-900/70 dark:text-blue-300 font-semibold">
              {currentScenario.description.split('\n\n')[1]}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {currentScenario.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrect = index === currentScenario.correctAnswerIndex;

              let variantClasses = 'border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-gray-50 dark:hover:bg-slate-800/50';

              if (isAnswered) {
                if (isCorrect) {
                  variantClasses = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-400 ring-2 ring-emerald-500/20';
                } else if (isSelected) {
                  variantClasses = 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-400 ring-2 ring-rose-500/20';
                } else {
                  variantClasses = 'opacity-50 border-gray-100 dark:border-slate-800';
                }
              } else if (isSelected) {
                variantClasses = 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-400 ring-2 ring-blue-500/20';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={isAnswered}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 text-left transition-all duration-200 group ${variantClasses}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-sm transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 dark:border-slate-700 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-bold">{option}</span>
                  </div>

                  {isAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-rose-500" />}
                </button>
              );
            })}
          </div>

          {/* Feedback & Explanation */}
          {isAnswered && (
            <div className="mt-8 animate-in slide-in-from-top-4 duration-300">
              <div className={`p-6 rounded-2xl border-2 flex gap-4 ${
                feedbackType === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20 text-emerald-900 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20 text-rose-900 dark:text-rose-400'
              }`}>
                <div className={`p-2 rounded-xl h-fit ${
                  feedbackType === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'
                }`}>
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black uppercase tracking-widest mb-1">
                    {feedbackType === 'success' ? 'Brilliant!' : 'Not Quite...'}
                  </div>
                  <p className="font-medium text-gray-700 dark:text-slate-300 leading-relaxed">
                    {currentScenario.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex justify-end">
          {!isAnswered ? (
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className={`inline-flex items-center px-8 py-3 rounded-xl font-black transition-all ${
                selectedOption === null
                  ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transform hover:scale-105 active:scale-95'
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all shadow-lg shadow-blue-500/20 transform hover:scale-105 active:scale-95"
            >
              {currentScenarioIndex < roleplayScenarios.length - 1 ? 'Next Scenario' : 'View Results'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
