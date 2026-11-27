import React, { useMemo, useState } from 'react';
import {
  Apple, Flame, Sparkles, Droplets, Leaf, RotateCcw, Loader2,
  CheckCircle2, ChevronLeft, ChevronRight, UtensilsCrossed
} from 'lucide-react';
import { dietService } from '../services/dietService';

const QUESTIONS = [
  {
    id: "goal",
    title: "What is your main nutrition goal?",
    subtitle: "Choose the outcome you want this plan to support.",
    options: [
      { value: "lose_weight", label: "Lose weight", description: "Create a sustainable calorie deficit" },
      { value: "maintain", label: "Maintain weight", description: "Keep energy and habits stable" },
      { value: "build_muscle", label: "Build muscle", description: "Support strength and recovery" },
      { value: "boost_energy", label: "Boost energy", description: "Feel more consistent day to day" }
    ]
  },
  {
    id: "activity",
    title: "How active are you?",
    subtitle: "Include yoga, walking, workouts, and daily movement.",
    options: [
      { value: "sedentary", label: "Sedentary", description: "Mostly sitting, little exercise" },
      { value: "light", label: "Lightly active", description: "Yoga or walks 1-3 days/week" },
      { value: "moderate", label: "Moderately active", description: "3-5 active days/week" },
      { value: "high", label: "Very active", description: "5+ days/week or physical work" }
    ]
  },
  {
    id: "diet",
    title: "What diet style do you follow?",
    subtitle: "The meal plan will match your food preferences.",
    options: [
      { value: "vegetarian", label: "Vegetarian", description: "No meat, eggs/dairy optional" },
      { value: "vegan", label: "Vegan", description: "Fully plant-based" },
      { value: "eggetarian", label: "Eggetarian", description: "Eggs and dairy, no meat" },
      { value: "non_veg", label: "Non-vegetarian", description: "Includes meat and fish" },
      { value: "flexitarian", label: "Flexitarian", description: "Mostly plant-based" },
      { value: "no_preference", label: "No preference", description: "Balanced mixed options" }
    ]
  },
  {
    id: "meals",
    title: "How many meals do you prefer daily?",
    subtitle: "We will structure portions around your routine.",
    options: [
      { value: "3", label: "3 meals", description: "Breakfast, lunch, dinner" },
      { value: "4", label: "4 meals", description: "Add one snack or mini-meal" },
      { value: "5", label: "5+ meals", description: "Multiple smaller eating occasions" }
    ]
  },
  {
    id: "age_group",
    title: "Which age group are you in?",
    subtitle: "Used for nutrient needs and calorie adjustments.",
    options: [
      { value: "18-25", label: "18-25" },
      { value: "26-35", label: "26-35" },
      { value: "36-45", label: "36-45" },
      { value: "46-55", label: "46-55" },
      { value: "55+", label: "55+" }
    ]
  },
  {
    id: "health",
    title: "Any health focus we should consider?",
    subtitle: "This helps tailor vitamins, foods, and cautions.",
    options: [
      { value: "none", label: "None", description: "General wellness" },
      { value: "pcos", label: "PCOS", description: "Hormonal balance focus" },
      { value: "diabetes", label: "Diabetes", description: "Blood sugar awareness" },
      { value: "thyroid", label: "Thyroid", description: "Thyroid support" },
      { value: "gluten_dairy", label: "Gluten/dairy", description: "Sensitivity or allergy" },
      { value: "joint_pain", label: "Joint pain", description: "Inflammation support" },
      { value: "other", label: "Other", description: "Prefer general guidance" }
    ]
  }
];

const MEAL_SECTIONS = ["breakfast", "lunch", "snacks", "dinner"];

export default function DietPlanner() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = QUESTIONS[step];
  const progress = plan ? 100 : Math.round((step / QUESTIONS.length) * 100);
  const canContinue = Boolean(answers[currentQuestion?.id]);

  const selectedSummary = useMemo(() => QUESTIONS.map((q) => answers[q.id]).filter(Boolean).length, [answers]);

  const handleSelect = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError("");
  };

  const handleNext = () => {
    if (!canContinue) return;
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const generated = await dietService.generatePlan(answers);
      setPlan(generated);
    } catch (err) {
      console.error("Diet plan error:", err);
      setError("Could not generate your plan right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPlan(null);
    setAnswers({});
    setStep(0);
    setError("");
  };

  if (plan) {
    const calories = plan.calories || {};
    const mealPlan = plan.meal_plan || {};
    const vitamins = plan.vitamins || [];
    const tips = plan.tips || [];

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-fitverse-purple" />
                <h1 className="text-2xl font-black text-fitverse-dark">Your Diet Plan</h1>
              </div>
              <p className="text-sm text-fitverse-muted">Personalized calories, macros, vitamins, and meals based on your answers.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${plan.generated_by === "ai" ? "bg-fitverse-mint text-fitverse-green-success" : "bg-fitverse-lavender text-fitverse-purple"}`}>
                {plan.generated_by === "ai" ? "AI Generated" : "Smart Fallback Plan"}
              </span>
              <button onClick={handleReset} className="px-4 py-2 rounded-xl bg-fitverse-purple text-white text-xs font-bold flex items-center gap-2 hover:bg-[#975fc3] transition-colors">
                <RotateCcw className="w-4 h-4" /> Retake Quiz
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-fitverse-purple to-[#8F52C6] rounded-3xl p-6 text-white shadow-card">
          <p className="text-xs font-bold uppercase tracking-wide text-white/80 mb-1">Daily calorie target</p>
          <div className="flex flex-wrap items-end gap-3">
            <h2 className="text-4xl font-black">{calories.target_min || "—"} - {calories.target_max || "—"} kcal</h2>
            <p className="text-sm text-white/85 pb-1">Adjust portions based on hunger, energy, and yoga days.</p>
          </div>
          {plan.summary && <p className="mt-3 text-sm text-white/90 leading-relaxed">{plan.summary}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Protein", value: calories.protein_g },
            { label: "Carbs", value: calories.carbs_g },
            { label: "Fats", value: calories.fat_g },
            { label: "Fiber", value: calories.fiber_g }
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl border border-[#F0E6F7] p-4 shadow-card">
              <p className="text-[11px] font-bold text-fitverse-muted uppercase">{item.label}</p>
              <p className="text-lg font-black text-fitverse-dark mt-1">{item.value || "—"}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="w-5 h-5 text-fitverse-purple" />
              <h3 className="font-bold text-fitverse-dark">Daily Meal Plan</h3>
            </div>
            <div className="space-y-4">
              {MEAL_SECTIONS.map((section) => {
                const items = mealPlan[section];
                const list = Array.isArray(items) ? items : [];
                if (!list.length) return null;
                return (
                  <div key={section} className="rounded-2xl bg-[#FAF6FD] border border-[#F0E6F7] p-4">
                    <p className="text-xs font-black text-fitverse-purple capitalize mb-2">{section}</p>
                    <ul className="space-y-1.5">
                      {list.map((item, idx) => (
                        <li key={idx} className="text-sm text-fitverse-dark flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-fitverse-green-success mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {mealPlan.note && <p className="text-xs text-fitverse-muted">{mealPlan.note}</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-5 h-5 text-fitverse-purple" />
                <h3 className="font-bold text-fitverse-dark">Key Vitamins & Minerals</h3>
              </div>
              <div className="space-y-3">
                {vitamins.slice(0, 7).map((v, idx) => (
                  <div key={idx} className="rounded-2xl border border-[#F0E6F7] p-3">
                    <p className="text-sm font-black text-fitverse-dark">{v.name}</p>
                    <p className="text-xs text-fitverse-muted mt-1"><span className="font-bold text-fitverse-dark">Why:</span> {v.why}</p>
                    <p className="text-xs text-fitverse-muted mt-1"><span className="font-bold text-fitverse-dark">Sources:</span> {v.sources}</p>
                    {v.note && <p className="text-xs text-fitverse-purple mt-1 font-medium">{v.note}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="w-5 h-5 text-fitverse-purple" />
                <h3 className="font-bold text-fitverse-dark">Hydration</h3>
              </div>
              <p className="text-sm text-fitverse-muted leading-relaxed">{plan.hydration}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-fitverse-dark">Practical Tips</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-fitverse-dark">
                <CheckCircle2 className="w-4 h-4 text-fitverse-green-success mt-0.5 shrink-0" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-fitverse-muted mt-5">{plan.disclaimer}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-fitverse-lavender flex items-center justify-center text-fitverse-purple">
            <Apple className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-fitverse-dark">Diet Planner</h1>
            <p className="text-sm text-fitverse-muted">Answer 6 quick questions to get calories, macros, vitamins, and meals.</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-bold text-fitverse-muted mb-2">
            <span>Question {Math.min(step + 1, QUESTIONS.length)} of {QUESTIONS.length}</span>
            <span>{selectedSummary} answered</span>
          </div>
          <div className="h-2 bg-[#F3EBF9] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-fitverse-purple to-[#8346BC] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#F0E6F7] p-6 shadow-card">
        <h2 className="text-xl font-black text-fitverse-dark">{currentQuestion.title}</h2>
        <p className="text-sm text-fitverse-muted mt-1 mb-6">{currentQuestion.subtitle}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQuestion.options.map((option) => {
            const selected = answers[currentQuestion.id] === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(currentQuestion.id, option.value)}
                className={`text-left p-4 rounded-2xl border transition-all ${selected ? "border-fitverse-purple bg-fitverse-lavender shadow-sm" : "border-[#F0E6F7] bg-white hover:border-[#D9BFF2] hover:bg-[#FCFAFD]"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-sm text-fitverse-dark">{option.label}</span>
                  {selected && <CheckCircle2 className="w-5 h-5 text-fitverse-purple shrink-0" />}
                </div>
                {option.description && <p className="text-xs text-fitverse-muted mt-1">{option.description}</p>}
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 text-sm font-semibold text-fitverse-error">{error}</p>}

        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0 || loading}
            className="px-4 py-2.5 rounded-xl border border-[#EADBFA] text-fitverse-dark text-sm font-bold flex items-center gap-2 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue || loading}
            className="px-5 py-2.5 rounded-xl bg-fitverse-purple hover:bg-[#975fc3] text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {step === QUESTIONS.length - 1 ? "Generate My Plan" : "Continue"}
            {!loading && step < QUESTIONS.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
