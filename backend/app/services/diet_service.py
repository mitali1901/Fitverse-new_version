import json
import re
from app.services.gemini_service import GeminiService


class DietService:
    GOAL_LABELS = {
        "lose_weight": "Lose weight / fat loss",
        "maintain": "Maintain current weight",
        "build_muscle": "Build muscle / strength",
        "boost_energy": "Boost energy and consistency",
    }
    ACTIVITY_LABELS = {
        "sedentary": "Sedentary (desk job, little exercise)",
        "light": "Lightly active (yoga 1-3 days/week)",
        "moderate": "Moderately active (3-5 days/week)",
        "high": "Very active (5+ days/week or physical job)",
    }
    DIET_LABELS = {
        "vegetarian": "Vegetarian",
        "vegan": "Vegan",
        "eggetarian": "Eggetarian",
        "non_veg": "Non-vegetarian",
        "flexitarian": "Flexitarian / mostly plant-based",
        "no_preference": "No preference",
    }
    AGE_LABELS = {
        "18-25": "18-25",
        "26-35": "26-35",
        "36-45": "36-45",
        "46-55": "46-55",
        "55+": "55+",
    }
    HEALTH_LABELS = {
        "none": "None / general wellness",
        "pcos": "PCOS / hormonal balance",
        "diabetes": "Diabetes / blood sugar",
        "thyroid": "Thyroid concerns",
        "gluten_dairy": "Gluten or dairy sensitivity",
        "joint_pain": "Joint pain / inflammation",
        "other": "Other / prefer guidance",
    }

    @staticmethod
    def generate_plan(answers):
        normalized = DietService._normalize_answers(answers or {})
        prompt = DietService._build_prompt(normalized)
        ai_text = GeminiService.generate_text(prompt)
        plan = DietService._parse_ai_plan(ai_text) if ai_text else None

        if plan:
            plan = DietService._ensure_plan_shape(plan, normalized)
            plan["generated_by"] = "ai"
        else:
            plan = DietService._fallback_plan(normalized)
            plan["generated_by"] = "fallback"

        plan["answers"] = normalized
        return plan

    @staticmethod
    def _normalize_answers(answers):
        def pick(key, allowed, default):
            value = str(answers.get(key, default)).lower()
            return value if value in allowed else default

        try:
            meals = int(answers.get("meals", 3))
        except (TypeError, ValueError):
            meals = 3
        meals = 3 if meals <= 3 else (4 if meals == 4 else 5)

        return {
            "goal": pick("goal", set(DietService.GOAL_LABELS), "maintain"),
            "activity": pick("activity", set(DietService.ACTIVITY_LABELS), "light"),
            "diet": pick("diet", set(DietService.DIET_LABELS), "no_preference"),
            "meals": meals,
            "age_group": pick("age_group", set(DietService.AGE_LABELS), "26-35"),
            "health": pick("health", set(DietService.HEALTH_LABELS), "none"),
        }

    @staticmethod
    def _label_map(key):
        return {
            "goal": DietService.GOAL_LABELS,
            "activity": DietService.ACTIVITY_LABELS,
            "diet": DietService.DIET_LABELS,
            "age_group": DietService.AGE_LABELS,
            "health": DietService.HEALTH_LABELS,
        }[key]

    @staticmethod
    def _build_prompt(a):
        goal = DietService.GOAL_LABELS[a["goal"]]
        activity = DietService.ACTIVITY_LABELS[a["activity"]]
        diet = DietService.DIET_LABELS[a["diet"]]
        age = DietService.AGE_LABELS[a["age_group"]]
        health = DietService.HEALTH_LABELS[a["health"]]

        return f"""You are a certified nutrition and yoga lifestyle coach. Create a practical one-day diet plan for a FitVerse user.

User profile:
- Goal: {goal}
- Activity level: {activity}
- Diet style: {diet}
- Meals per day: {a['meals']}
- Age group: {age}
- Health focus: {health}

Return ONLY valid JSON with this exact structure:
{{
  "summary": "2-3 sentence personalized summary",
  "calories": {{"target_min": 1800, "target_max": 2100, "protein_g": "90-110 g", "carbs_g": "180-220 g", "fat_g": "55-70 g", "fiber_g": "30-38 g"}},
  "vitamins": [{{"name": "Vitamin D", "why": "why it matters", "sources": "food sources", "note": "practical note"}}],
  "meal_plan": {{"breakfast": ["item 1", "item 2"], "lunch": ["item 1", "item 2"], "snacks": ["item 1", "item 2"], "dinner": ["item 1", "item 2"]}},
  "hydration": "daily water guidance",
  "tips": ["tip 1", "tip 2", "tip 3"],
  "disclaimer": "not medical advice"
}}

Rules:
- Keep calories realistic for the stated goal/activity; do not invent body weight.
- Include 5-7 vitamins/minerals most relevant to the diet style and health focus.
- Meal items must match the diet style and health focus.
- Keep language beginner-friendly and motivating."""

    @staticmethod
    def _parse_ai_plan(text):
        if not text:
            return None
        match = re.search(r"\{.*\}", text, re.S)
        if not match:
            return None
        try:
            data = json.loads(match.group(0))
        except Exception:
            return None
        if not isinstance(data, dict) or "calories" not in data or "meal_plan" not in data:
            return None
        return data

    @staticmethod
    def _ensure_plan_shape(plan, a):
        plan.setdefault("summary", "")
        plan.setdefault("calories", {})
        plan.setdefault("vitamins", [])
        plan.setdefault("meal_plan", {})
        plan.setdefault("hydration", "Drink water consistently through the day and increase intake around yoga sessions.")
        plan.setdefault("tips", [])
        plan.setdefault("disclaimer", "This plan is general nutrition guidance and is not a substitute for medical advice.")
        return plan

    @staticmethod
    def _fallback_plan(a):
        calories = DietService._calorie_target(a)
        return {
            "summary": DietService._summary_text(a),
            "calories": calories,
            "vitamins": DietService._vitamins(a),
            "meal_plan": DietService._meal_plan(a),
            "hydration": DietService._hydration_text(a),
            "tips": DietService._tips(a),
            "disclaimer": "This plan is general nutrition guidance and is not a substitute for medical advice. Adjust portions based on hunger, energy, and professional guidance.",
        }

    @staticmethod
    def _calorie_target(a):
        base = {"sedentary": 1700, "light": 2000, "moderate": 2300, "high": 2600}[a["activity"]]
        goal_adj = {"lose_weight": -400, "maintain": 0, "build_muscle": 250, "boost_energy": 100}[a["goal"]]
        age_adj = {"18-25": 50, "26-35": 0, "36-45": -50, "46-55": -100, "55+": -150}[a["age_group"]]
        mid = max(1400, base + goal_adj + age_adj)
        protein_ratio = 0.32 if a["goal"] in {"lose_weight", "build_muscle"} else 0.28
        return {
            "target_min": int(mid - 100),
            "target_max": int(mid + 100),
            "protein_g": f"{round(mid * protein_ratio / 4)}-{round(mid * (protein_ratio + 0.04) / 4)} g",
            "carbs_g": f"{round(mid * 0.38 / 4)}-{round(mid * 0.45 / 4)} g",
            "fat_g": f"{round(mid * 0.25 / 9)}-{round(mid * 0.30 / 9)} g",
            "fiber_g": "30-38 g",
        }

    @staticmethod
    def _summary_text(a):
        goal = DietService.GOAL_LABELS[a["goal"]]
        diet = DietService.DIET_LABELS[a["diet"]]
        health = DietService.HEALTH_LABELS[a["health"]]
        return (
            f"This plan is built around your goal to {goal.lower()}, a {DietService.ACTIVITY_LABELS[a['activity']].split('(')[0].strip().lower()} activity level, "
            f"and a {diet.lower()} pattern. It prioritizes {health.lower()} support, steady energy for yoga practice, and nutrient density without extreme restriction."
        )

    @staticmethod
    def _vitamins(a):
        items = [
            {"name": "Vitamin D", "why": "Supports bone health, immunity, and mood.", "sources": "Sunlight, fortified plant milk, eggs, mushrooms.", "note": "Many people benefit from testing levels before supplementing."},
            {"name": "Vitamin C", "why": "Aids collagen formation, immunity, and iron absorption.", "sources": "Amla, citrus, bell peppers, guava, leafy greens.", "note": "Include a colorful fruit or vegetable daily."},
            {"name": "Magnesium", "why": "Supports muscle relaxation, sleep, and energy metabolism.", "sources": "Pumpkin seeds, almonds, spinach, legumes, dark chocolate.", "note": "Especially useful around yoga and recovery days."},
            {"name": "Potassium", "why": "Balances fluids and supports muscle function.", "sources": "Bananas, potatoes, beans, tomatoes, coconut water.", "note": "Whole foods are better than isolated supplements."},
            {"name": "Omega-3 fats", "why": "Supports heart, brain, and joint health.", "sources": "Fatty fish, eggs, walnuts, flaxseeds, algae oil.", "note": "Vegetarians and vegans should choose algae-based options."},
        ]

        if a["diet"] in {"vegetarian", "vegan", "flexitarian", "no_preference"}:
            items.append({"name": "Vitamin B12", "why": "Essential for energy, nerves, and red blood cells.", "sources": "Dairy, eggs, fortified foods, or supplements for vegans.", "note": "Vegans usually need a reliable B12 source."})
        if a["diet"] in {"vegan", "vegetarian", "gluten_dairy", "pcos", "joint_pain"}:
            items.append({"name": "Iron", "why": "Supports oxygen transport and energy.", "sources": "Lentils, spinach, fortified cereals, pumpkin seeds, jaggery.", "note": "Pair plant iron with vitamin C for better absorption."})
        if a["diet"] in {"vegan", "gluten_dairy", "thyroid"}:
            items.append({"name": "Calcium", "why": "Supports bones, muscles, and nerve function.", "sources": "Fortified plant milk, tofu, almonds, sesame, leafy greens.", "note": "Spread calcium intake across meals."})
        if a["health"] in {"diabetes", "pcos", "joint_pain"}:
            items.append({"name": "Fiber + low-GI carbs", "why": "Helps steady blood sugar and satiety.", "sources": "Millets, legumes, vegetables, chia, oats.", "note": "Favor whole grains over refined carbs."})
        if a["health"] in {"thyroid", "joint_pain", "pcos"}:
            items.append({"name": "Selenium / anti-inflammatory foods", "why": "Supports thyroid function and reduces inflammation.", "sources": "Brazil nuts, eggs, turmeric, ginger, fatty fish.", "note": "Keep portions balanced and avoid megadoses."})
        return items[:8]

    @staticmethod
    def _protein_options(a):
        diet = a["diet"]
        if diet == "non_veg":
            return ["grilled chicken or fish", "boiled eggs", "paneer or curd", "lentils"]
        if diet == "vegan":
            return ["tofu or tempeh", "lentils and chickpeas", "edamame", "seeds and nut butter"]
        if diet == "vegetarian":
            return ["paneer or Greek yogurt", "lentils and chickpeas", "tofu", "eggs if included"]
        if diet == "eggetarian":
            return ["eggs", "paneer and dairy", "lentils", "chickpeas"]
        if diet == "flexitarian":
            return ["lentils and beans", "eggs a few times weekly", "fish occasionally", "paneer or tofu"]
        return ["lentils and beans", "paneer or tofu", "eggs", "Greek yogurt or curd"]

    @staticmethod
    def _carb_options(a):
        if a["health"] in {"diabetes", "pcos"}:
            return ["millets or quinoa", "legumes", "sweet potato", "whole oats"]
        if a["diet"] in {"vegan", "vegetarian", "gluten_dairy"}:
            return ["millets", "quinoa", "brown rice", "sweet potato"]
        return ["whole oats", "brown rice or millets", "quinoa", "whole wheat or multigrain"]

    @staticmethod
    def _meal_plan(a):
        protein = DietService._protein_options(a)
        carbs = DietService._carb_options(a)
        veg = ["leafy greens", "cruciferous vegetables", "colorful vegetables", "sprouts"]
        fats = ["nuts and seeds", "olive oil or ghee", "avocado", "nut butter"]

        return {
            "breakfast": [f"{carbs[0]} + {protein[0]}", f"{veg[0]} + {fats[0]}", "herbal tea or black coffee"],
            "lunch": [f"{carbs[1]} + {protein[1]}", f"{veg[1]} + {veg[2]}", "buttermilk or water"],
            "snacks": [f"{fats[1]} + fruit", f"{protein[2]} snack", "cucumber or carrots with hummus"],
            "dinner": [f"{protein[0]} + {carbs[2]}", f"{veg[2]} + {veg[3]}", "warm water or herbal tea"],
            "note": f"You selected {a['meals']} meals/day. If you eat fewer meals, combine portions; if you eat more, split snacks into two smaller eating occasions."
        }

    @staticmethod
    def _hydration_text(a):
        base = "Aim for roughly 30-35 ml water per kg body weight, adjusted for climate and yoga sessions."
        if a["health"] == "diabetes":
            return base + " Keep sugary drinks out and pair water with meals to support steady energy."
        if a["activity"] in {"moderate", "high"}:
            return base + " Add electrolytes naturally with coconut water, lemon, or a pinch of salt on hot days."
        return base + " Drink consistently through the day rather than only when thirsty."

    @staticmethod
    def _tips(a):
        tips = [
            "Eat protein and fiber at each main meal to stay full longer.",
            "Do not skip meals before yoga; a light meal 1-2 hours before practice works best.",
            "Sleep 7-9 hours; nutrition works better when recovery is consistent.",
        ]
        if a["health"] == "diabetes":
            tips.append("Choose low-GI carbs and avoid sugary drinks to keep energy stable.")
        if a["health"] == "pcos":
            tips.append("Prioritize fiber, anti-inflammatory foods, and regular meal timing.")
        if a["health"] == "thyroid":
            tips.append("Cook goitrogen-rich vegetables and avoid excessive raw cruciferous intake.")
        if a["health"] == "joint_pain":
            tips.append("Include omega-3s and turmeric/ginger while keeping portions moderate."
            )
        if a["diet"] == "vegan":
            tips.append("Combine legumes with grains and consider B12/algae omega-3 support.")
        return tips[:6]
