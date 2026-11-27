import os
import requests
from config.settings import Config

SYSTEM_PROMPT = """You are the FitVerse AI Fitness & Yoga Coach, an empathetic, encouraging, and knowledgeable AI companion designed to help users practice yoga safely, improve body alignment, build mindful fitness habits, and understand their posture corrections.

Your Tone and Style:
- Warm, supportive, motivational, and beginner-friendly.
- Concise, clear, structured with bullet points where helpful.
- Rooted in classical yoga principles (mindfulness, breath / pranayama, alignment, balance) and modern sports science.

Your Capabilities & Scope:
1. Explain yoga postures (especially Tree Pose / Vrikshasana, Warrior II / Virabhadrasana II, and Downward-Facing Dog / Adho Mukha Svanasana).
2. Interpret posture correction feedback (e.g. why knee alignment over ankle prevents ACL/meniscus strain, how shoulder relaxation relieves neck tension).
3. Offer beginner-friendly fitness routines, gentle mobility stretches, and warm-ups/cool-downs.
4. Share evidence-based nutrition tips (hydration, post-workout recovery, balanced whole foods).
5. Suggest lifestyle & mindfulness advice (sleep hygiene, stress relief, breathing exercises).

Safety Rules:
- Remind users that yoga posture feedback is an AI-assisted training guide and does not replace medical advice or in-person certified yoga instruction.
- If a user mentions sharp pain, dizziness, or injury, advise them to stop gently and consult a healthcare professional.
"""

class GeminiService:
    @staticmethod
    def generate_response(user_message, context=None, conversation_history=None):
        api_key = Config.GEMINI_API_KEY.strip() if Config.GEMINI_API_KEY else ""

        # Construct context block
        context_str = ""
        if context:
            context_parts = []
            if context.get("current_pose"):
                context_parts.append(f"- Current / Recent Pose: {context['current_pose']}")
            if context.get("alignment_score") is not None:
                context_parts.append(f"- Alignment Score: {context['alignment_score']}%")
            if context.get("common_mistakes"):
                context_parts.append(f"- Detected Posture Observations: {', '.join(context['common_mistakes'])}")
            if context.get("session_duration"):
                context_parts.append(f"- Recent Session Duration: {context['session_duration']} seconds")
            if context.get("weekly_goal"):
                context_parts.append(f"- Weekly Fitness Target: {context['weekly_goal']} minutes")
            
            if context_parts:
                context_str = "\n\nUser Session Context:\n" + "\n".join(context_parts) + "\n"

        history_str = ""
        if conversation_history:
            recent = conversation_history[-8:]
            lines = []
            for item in recent:
                role = "User" if item.get("role") == "user" else "Coach"
                content = (item.get("content") or "").strip()
                if content:
                    lines.append(f"{role}: {content}")
            if lines:
                history_str = "\nRecent Conversation:\n" + "\n".join(lines) + "\n"

        prompt = f"{SYSTEM_PROMPT}\n{context_str}{history_str}\nUser Question: {user_message}\nFitVerse Coach:"

        if api_key:
            gemini_reply = GeminiService._generate_with_gemini(prompt, api_key)
            if gemini_reply:
                return gemini_reply

        # Fallback intelligent contextual response generator
        return GeminiService._generate_fallback_response(user_message, context, conversation_history)

    @staticmethod
    def generate_text(prompt):
        api_key = Config.GEMINI_API_KEY.strip() if Config.GEMINI_API_KEY else "";
        if not api_key:
            return None
        return GeminiService._generate_with_gemini(prompt, api_key)

    @staticmethod
    def _generate_with_gemini(prompt, api_key):
        configured = os.getenv("GEMINI_MODEL", "").strip()
        models = [m.strip() for m in configured.split(",") if m.strip()] if configured else [
            "gemini-3.8-flash",
            "gemini-flash-latest",
        ]

        for model_name in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            try:
                response = requests.post(
                    url,
                    params={"key": api_key},
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    timeout=25,
                )
                if response.status_code != 200:
                    print(f"[GeminiService] {model_name} returned HTTP {response.status_code}; trying next model.")
                    continue
                data = response.json()
                candidates = data.get("candidates") or []
                if not candidates:
                    continue
                parts = candidates[0].get("content", {}).get("parts", [])
                text = "".join(part.get("text", "") for part in parts).strip()
                if text:
                    return text
            except Exception as e:
                print(f"[GeminiService] {model_name} request failed ({type(e).__name__}); trying next model.")
        return None

    @staticmethod
    def _generate_fallback_response(message, context=None, conversation_history=None):
        context = context or {}
        pose = context.get("current_pose", "") if context else ""
        score = context.get("alignment_score", 0) if context else 0
        mistakes = context.get("common_mistakes", []) if context else []

        effective_message = message
        if len(message.strip().split()) <= 3 and conversation_history:
            last_user = ""
            for item in reversed(conversation_history):
                if item.get("role") == "user" and item.get("content"):
                    last_user = item["content"]
                    break
            if last_user:
                effective_message = f"{last_user} {message}"
        msg_lower = effective_message.lower()

        if any(term in msg_lower for term in ["pain", "injur", "hurt", "dizzy", "dizziness", "sharp", "numb", "tingle"]):
            return (
                "Please stop gently if you feel sharp pain, dizziness, numbness, tingling, or anything that feels unsafe. "
                "Yoga should never be forced. Rest in a comfortable position, breathe normally, and consult a healthcare professional or certified yoga teacher if symptoms continue."
            )
        if "knee" in msg_lower or "adjust" in msg_lower or (mistakes and any("knee" in m.lower() for m in mistakes)):
            return (
                "Great question about knee alignment! In standing poses like **Warrior II (Virabhadrasana II)**, "
                "keeping your front knee directly stacked over your ankle (forming approximately a 90° angle) protects the anterior cruciate ligament (ACL) "
                "and distributes weight evenly across your quad and hip. If your knee drifts inward or past your toes, widen your stance slightly and engage your outer hip to press the knee toward your pinky toe! 🧘‍♀️"
            )
        elif "tree" in msg_lower or "vrikshasana" in msg_lower or pose == "Tree Pose":
            return (
                "**Tree Pose (Vrikshasana) Mastery Tips:**\n"
                "• **Grounding:** Root all four corners of your standing foot firmly into the mat.\n"
                "• **Foot Placement:** Place your lifted foot on the inner calf or upper inner thigh—*never directly against the knee joint* to protect cartilage.\n"
                "• **Drishti (Focus Point):** Fix your gaze on a non-moving point 5-6 feet ahead of you to steady your balance.\n"
                "• **Hands:** Bring palms together in front of your heart (*Anjali Mudra*) or extend them gently overhead like tree branches."
            )
        elif "warrior" in msg_lower or "virabhadrasana" in msg_lower or pose == "Warrior II Pose":
            return (
                "**Warrior II (Virabhadrasana II) Guidance:**\n"
                "• **Arms:** Extend both arms parallel to the floor, shoulder-height. Soften your shoulders away from your ears to release tension.\n"
                "• **Front Leg:** Bend your front knee toward a 90-degree angle, keeping it tracking over the second toe.\n"
                "• **Torso:** Keep your torso stacked right over your hips rather than leaning forward toward the front knee.\n"
                "• **Gaze:** Look softly over the middle fingernail of your front hand with calm confidence."
            )
        elif "downward" in msg_lower or "dog" in msg_lower or "svanasana" in msg_lower:
            return (
                "**Downward-Facing Dog (Adho Mukha Svanasana) Checklist:**\n"
                "• **Hands:** Spread fingers wide, pressing firmly through the index finger knuckles and thumbs to protect the wrists.\n"
                "• **Spine:** Prioritize a long, neutral spine over flat heels! Bend your knees as much as needed to tilt your sit bones toward the sky.\n"
                "• **Shoulders:** Externally rotate your upper arms to broaden your collarbones and create space around your neck."
            )
        elif (("score" in msg_lower) or ("improve" in msg_lower)) and not (("how" in msg_lower) and ("work" in msg_lower)):
            curr_score = f"{score}%" if score else "your current session"
            return (
                f"Your alignment score is {curr_score}! To raise your score:\n"
                "1. Focus on stability first before deepening the pose.\n"
                "2. Check the real-time red lines on the camera view—they show which limb segment has an angle deviation.\n"
                "3. Breathe deeply and hold the pose steady for at least 5-10 seconds to allow the computer vision tracker to calibrate your balance."
            )
        elif "nutrition" in msg_lower or "food" in msg_lower or "diet" in msg_lower:
            return (
                "**Nutrition & Recovery Tips for Yoga & Fitness:**\n"
                "• **Pre-Session:** Avoid heavy meals 2 hours before yoga; a light fruit (banana or apple) 30 minutes prior gives quick, light energy.\n"
                "• **Hydration:** Sip water with a pinch of electrolytes throughout the day rather than chugging water right before inversions.\n"
                "• **Post-Session Recovery:** Aim for a 3:1 ratio of complex carbs to clean protein (e.g., oatmeal with chia seeds and plant protein, or lentil soup) to replenish glycogen stores."
            )
        elif "beginner" in msg_lower or "start" in msg_lower or "routine" in msg_lower:
            return (
                "Welcome to your yoga journey! As a beginner, consistency is much more effective than intensity.\n"
                "• Start with **10 to 15 minutes** of gentle practice 3-4 days a week.\n"
                "• Begin each session with 2 minutes of conscious diaphragmatic breathing.\n"
                "• Practice foundational poses: Mountain Pose, Tree Pose, and Downward Dog.\n"
                "• Use the FitVerse AI Studio to get real-time feedback so you build healthy muscle memory from day one!"
            )
        elif any(term in msg_lower for term in ["hello", "hi", "hey", "namaste", "good morning", "good evening"]):
            return (
                "Hello! I'm your FitVerse AI Coach. I can help with pose alignment, beginner routines, breathing, recovery, nutrition, posture feedback, and how the camera scoring works. What would you like to work on?"
            )
        elif any(term in msg_lower for term in ["thank", "thanks", "great", "awesome", "perfect"]):
            return (
                "You’re welcome! Keep breathing steadily, stay consistent with your practice, and come back whenever you want pose-by-pose guidance or a plan for your next session."
            )
        elif any(term in msg_lower for term in ["mountain", "tadasana"]):
            return (
                "**Mountain Pose (Tadasana) cues:** stand with feet hip-width apart, spread your toes, and root all four corners of each foot. Stack shoulders over hips and hips over ankles, lengthen the spine, soften the ribs, and let the arms rest by your sides or reach overhead with palms facing each other. Gaze forward and breathe evenly."
            )
        elif any(term in msg_lower for term in ["chair", "utkatasana", "squat"]):
            return (
                "**Chair Pose (Utkatasana) cues:** bend your knees as if sitting into a chair while keeping your chest lifted. Track knees over toes, press weight into your heels, and reach arms overhead or forward depending on your comfort. Keep the spine long rather than rounding forward."
            )
        elif any(term in msg_lower for term in ["plank", "phalakasana"]):
            return (
                "**Plank Pose (Phalakasana) cues:** place hands under shoulders and extend legs back so the body forms one line from head to heels. Engage the core, press through the hands and heels, and avoid letting the hips sag or pike too high. Modify by dropping to the knees if needed."
            )
        elif any(term in msg_lower for term in ["cobra", "bhujangasana"]):
            return (
                "**Cobra Pose (Bhujangasana) cues:** lie face down with palms under the shoulders. Soften the elbows, lift the chest gently, keep shoulders away from the ears, and let the hips stay grounded. Use a low cobra if you feel compression in the lower back."
            )
        elif any(term in msg_lower for term in ["bridge", "setu", "bandha"]):
            return (
                "**Bridge Pose (Setu Bandhasana) cues:** lie on your back with knees bent and feet flat under the knees. Press through the feet, lift the hips evenly, keep knees tracking over ankles, and relax the neck. You can place a block under the sacrum for support."
            )
        elif any(term in msg_lower for term in ["seated forward", "paschimottanasana", "forward bend", "forward fold"]):
            return (
                "**Seated Forward Bend cues:** sit tall with legs extended or softly bent. Hinge forward from the hips rather than rounding the spine, keep the chest long, and reach toward the feet only as far as you can without collapsing. Breathe into the hamstrings instead of forcing depth."
            )
        elif any(term in msg_lower for term in ["cat", "cow", "marjaryasana", "tabletop"]):
            return (
                "**Cat-Cow cues:** start on hands and knees with wrists under shoulders and knees under hips. Inhale to arch gently into cow, lifting the chest and tailbone; exhale to round into cat, drawing the navel toward the spine. Move slowly and match the motion to your breath."
            )
        elif any(term in msg_lower for term in ["warm", "warmup", "warm up", "dynamic stretch", "before yoga", "before workout"]):
            return (
                "**Warm-up idea:** spend 5 minutes increasing circulation before practice: march in place, shoulder rolls, hip circles, cat-cow, and a gentle sun salutation at half effort. The goal is to wake up the joints and breath, not fatigue yourself."
            )
        elif any(term in msg_lower for term in ["cool", "cooldown", "cool down", "after yoga", "after workout", "recovery stretch"]):
            return (
                "**Cool-down idea:** after practice, slow the breath and hold gentle stretches such as child’s pose, seated forward bend, and legs-up-the-wall for 1-3 minutes. Let your heart rate come down before checking your phone or jumping into the next task."
            )
        elif any(term in msg_lower for term in ["breath", "breathing", "pranayama", "ujjayi", "inhale", "exhale"]):
            return (
                "**Breathing cues:** try diaphragmatic breathing for 2-3 minutes: inhale through the nose for 4 counts, let the belly expand, exhale slowly for 6 counts. In flow, keep the breath smooth and audible enough to notice, but never strained."
            )
        elif any(term in msg_lower for term in ["meditation", "mindfulness", "stress", "anxiety", "calm", "relax"]):
            return (
                "**Mindfulness cue:** sit or lie comfortably, soften the eyes, and bring attention to the sensation of breath at the nostrils or belly. When thoughts wander, gently return without judgment. Even 5 minutes can lower reactivity and improve focus."
            )
        elif any(term in msg_lower for term in ["sleep", "insomnia", "tired", "fatigue", "energy"]):
            return (
                "**Sleep/energy cue:** avoid intense practice too close to bedtime. A short evening wind-down can include legs-up-the-wall, slow breathing, and dim lighting. If fatigue is constant, prioritize hydration, protein, and consistent sleep timing over extra workout volume."
            )
        elif any(term in msg_lower for term in ["flexibility", "hamstring", "hips", "back tightness", "tight"]):
            return (
                "**Flexibility cue:** improve range gradually with consistent, pain-free practice. For hamstrings and hips, combine cat-cow, gentle forward folds, and supine twists. Never bounce into a stretch; hold steady breaths and let tension release over weeks, not one session."
            )
        elif any(term in msg_lower for term in ["strength", "core", "arms", "legs", "balance", "muscle"]) and "score" not in msg_lower:
            return (
                "**Strength/balance cue:** yoga strength comes from control, not speed. Use plank, chair, and bridge variations with shorter holds first, focus on steady breath, and train balance with drishti plus a stable standing foot. Quality reps beat long sloppy holds."
            )
        elif any(term in msg_lower for term in ["weight loss", "lose weight", "calories", "burn fat", "fat loss"]):
            return (
                "**Weight/fat-loss cue:** yoga supports consistency, mobility, stress control, and recovery, but fat loss still depends mainly on sustainable nutrition and overall activity. Use yoga as the foundation, then add daily steps and enough protein rather than chasing extreme intensity."
            )
        elif any(term in msg_lower for term in ["posture", "alignment", "form", "technique", "correction", "mistake"]):
            return (
                "**Posture/alignment cue:** prioritize joint stacking and a neutral spine before depth. In standing poses, keep knees tracking over toes; in folds, hinge from the hips; in backbends, lift the chest without compressing the lower back. Use the camera feedback to spot which segment is off, then correct one thing at a time."
            )
        elif any(term in msg_lower for term in ["camera", "ai", "how it works", "detection", "mediapipe", "score", "landmark"]):
            return (
                "**How FitVerse scoring works:** the camera uses pose landmarks to estimate joint angles in real time. The coach compares those angles to safe ranges for the selected pose, then highlights segments that need correction. Treat the score as a training guide, not a medical diagnosis, and keep the camera at hip-to-head height when possible."
            )
        elif any(term in msg_lower for term in ["meal", "eat", "hydration", "water", "protein", "carb"]):
            return (
                "**Fueling cue:** eat a light meal 1-2 hours before practice and focus on hydration throughout the day. After sessions, pair complex carbs with protein for recovery. If you practice early, a small banana or yogurt is usually easier than a heavy breakfast."
            )
        elif any(term in msg_lower for term in ["plan", "schedule", "workout", "routine", "program", "week"]):
            return (
                "**Simple weekly plan:** do 3-4 short sessions of 15-25 minutes. Day 1 foundation poses, Day 2 balance and flow, Day 3 strength holds like chair/plank/bridge, Day 4 restorative breathing and gentle stretches. Track sessions in the dashboard and adjust based on energy, not guilt."
            )
        else:
            question_preview = effective_message.strip().strip('"')[:120]
            return (
                f"I want to answer \"{question_preview}\" accurately rather than generically. I can help most directly with pose alignment, beginner routines, breathing, recovery, nutrition, posture feedback, or how the FitVerse camera score works. "
                + (f"Your selected pose right now is {pose}, so I can tailor cues to that. " if pose else "")
                + "Tell me whether you want form tips, a routine, recovery, or nutrition guidance, and I’ll give you a specific answer."
            )

