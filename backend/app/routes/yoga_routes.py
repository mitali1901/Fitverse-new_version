from flask import Blueprint, request, jsonify
from app.models.yoga_session_model import YogaSession
from app.middleware.auth_middleware import token_required
from app.services.session_service import SessionService
from app.utils.validators import validate_yoga_session

yoga_bp = Blueprint("yoga_bp", __name__)

POSES_METADATA = [
    {
        "id": "warrior_ii",
        "name": "Warrior II Pose",
        "sanskrit_name": "Virabhadrasana II",
        "category": "Standing / Strength",
        "difficulty": "Beginner / Intermediate",
        "target_time_seconds": 300, # 5 min default
        "description": "A powerful standing pose that strengthens legs and ankles while opening hips and chest.",
        "image": "/assets/warrior_pose.svg",
        "target_angles": {
            "front_knee": "85° - 100° (Right angle over ankle)",
            "back_leg": "165° - 180° (Straight & engaged)",
            "arms": "170° - 180° (Extended parallel to floor)"
        },
        "instructions": [
            "Step feet wide apart (~3.5 to 4 feet).",
            "Turn your front foot out 90 degrees and back foot slightly inwards.",
            "Bend front knee to 90 degrees directly above your ankle.",
            "Extend arms parallel to the floor, gaze over your front fingertips.",
            "Keep torso upright and centered over hips."
        ],
        "common_mistakes": [
            "Front knee collapsing inward or bending past toes.",
            "Arms dropping below shoulder height or uneven shoulders.",
            "Leaning the torso forward toward the front thigh."
        ]
    },
    {
        "id": "tree_pose",
        "name": "Tree Pose",
        "sanskrit_name": "Vrikshasana",
        "category": "Balancing / Focus",
        "difficulty": "Beginner",
        "target_time_seconds": 300,
        "description": "A classic standing balance posture improving equilibrium, poise, and leg stability.",
        "image": "/assets/tree_pose.svg",
        "target_angles": {
            "standing_leg": "170° - 180° (Strong & upright)",
            "bent_knee": "30° - 65° (Folded with hip abducted)",
            "spine": "170° - 180° (Vertical neutral spine)"
        },
        "instructions": [
            "Root down firmly through the sole of your standing foot.",
            "Place the sole of your opposite foot on your inner calf or upper thigh (never the knee).",
            "Bring your palms together at your chest in prayer (Anjali Mudra) or extend overhead.",
            "Fix your gaze on a steady focal point (Drishti) at eye level."
        ],
        "common_mistakes": [
            "Resting the foot directly onto the side of the knee joint.",
            "Collapsing the hip of the standing leg outward.",
            "Hunching shoulders or holding breath."
        ]
    },
    {
        "id": "downward_dog",
        "name": "Downward-Facing Dog",
        "sanskrit_name": "Adho Mukha Svanasana",
        "category": "Inversion / Flexibility",
        "difficulty": "Beginner",
        "target_time_seconds": 300,
        "description": "An energizing inverted 'V' posture stretching hamstrings, calves, spine, and opening shoulders.",
        "image": "/assets/downward_dog.svg",
        "target_angles": {
            "hip_apex": "65° - 90° (Hips lifted high to form sharp V)",
            "arms": "165° - 180° (Straight arms from wrist to shoulder)",
            "legs": "160° - 180° (Legs extended, knees soft if hamstrings are tight)"
        },
        "instructions": [
            "Begin on hands and knees, hands shoulder-width, knees hip-width.",
            "Press into palms and lift knees away from the floor, pushing hips back and up.",
            "Lengthen spine, relax neck between upper arms.",
            "Reach heels gently toward the mat without forcing."
        ],
        "common_mistakes": [
            "Rounding the spine due to stiff hamstrings (bend knees instead!).",
            "Dumping too much weight into wrists; push firmly through knuckles.",
            "Shoulders crowding ears; roll shoulders open."
        ]
    },
    {
        "id": "mountain_pose",
        "name": "Mountain Pose",
        "sanskrit_name": "Tadasana",
        "category": "Standing / Posture",
        "difficulty": "Beginner",
        "target_time_seconds": 300,
        "description": "A grounding foundational posture that builds body awareness, posture, and calm balance.",
        "target_angles": {
            "knees": "160° - 180° (Long and engaged)",
            "spine": "170° - 180° (Tall neutral spine)",
            "arms": "160° - 180° (Relaxed or reaching overhead)"
        },
        "instructions": [
            "Stand tall with feet hip-width apart and weight evenly distributed.",
            "Lengthen through the crown of your head and relax your shoulders.",
            "Engage your thighs and draw the belly gently inward.",
            "Reach arms overhead or rest them softly beside your body."
        ],
        "common_mistakes": [
            "Locking the knees or leaning backward.",
            "Rounded shoulders or a collapsed chest.",
            "Holding the breath or gripping the toes."
        ],
        "image": "/assets/meditating_yogi.svg"
    },
    {
        "id": "chair_pose",
        "name": "Chair Pose",
        "sanskrit_name": "Utkatasana",
        "category": "Standing / Strength",
        "difficulty": "Beginner / Intermediate",
        "target_time_seconds": 300,
        "description": "A strengthening squat posture that builds leg endurance, core stability, and focus.",
        "target_angles": {
            "knees": "80° - 120° (Deep but controlled squat)",
            "hips": "90° - 130° (Hips lowered toward heels)",
            "spine": "160° - 180° (Chest lifted, spine long)"
        },
        "instructions": [
            "Stand with feet together or hip-width apart.",
            "Bend your knees and lower your hips as if sitting into a chair.",
            "Keep your chest lifted and arms reaching overhead or forward.",
            "Press evenly through both feet without letting knees collapse inward."
        ],
        "common_mistakes": [
            "Leaning too far forward or rounding the spine.",
            "Letting knees cave inward past the toes.",
            "Holding the breath or dropping the arms."
        ],
        "image": "/assets/meditating_yogi.svg"
    },
    {
        "id": "plank_pose",
        "name": "Plank Pose",
        "sanskrit_name": "Phalakasana",
        "category": "Core / Stability",
        "difficulty": "Intermediate",
        "target_time_seconds": 300,
        "description": "A full-body strength posture that activates the core, shoulders, and legs in one stable line.",
        "target_angles": {
            "elbows": "160° - 180° (Arms straight or softly bent)",
            "hips": "Aligned with shoulders and heels",
            "knees": "160° - 180° (Legs extended and engaged)"
        },
        "instructions": [
            "Place hands under shoulders and extend legs back into a straight line.",
            "Press firmly through the palms and balls of the feet.",
            "Keep the body in one straight line from head to heels.",
            "Engage the core without letting the hips sag or pike."
        ],
        "common_mistakes": [
            "Letting the hips sag toward the floor.",
            "Piking the hips too high into an inverted V.",
            "Dropping the head or shrugging the shoulders."
        ],
        "image": "/assets/meditating_yogi.svg"
    },
    {
        "id": "cobra_pose",
        "name": "Cobra Pose",
        "sanskrit_name": "Bhujangasana",
        "category": "Backbend / Flexibility",
        "difficulty": "Beginner",
        "target_time_seconds": 300,
        "description": "A gentle chest-opening backbend that strengthens the spine, shoulders, and back muscles.",
        "target_angles": {
            "elbows": "80° - 140° (Softly bent or extended)",
            "shoulders": "Level and drawn away from ears",
            "spine": "Gentle extension through the upper back"
        },
        "instructions": [
            "Lie face down with palms under the shoulders and elbows close to the body.",
            "Inhale and gently lift the chest while keeping the hips grounded.",
            "Keep shoulders relaxed away from the ears.",
            "Look forward or slightly upward without compressing the neck."
        ],
        "common_mistakes": [
            "Lifting the hips or pushing with the hands too aggressively.",
            "Shrugging the shoulders toward the ears.",
            "Collapsing the lower back instead of extending the thoracic spine."
        ],
        "image": "/assets/meditating_yogi.svg"
    },
    {
        "id": "bridge_pose",
        "name": "Bridge Pose",
        "sanskrit_name": "Setu Bandhasana",
        "category": "Backbend / Strength",
        "difficulty": "Beginner / Intermediate",
        "target_time_seconds": 300,
        "description": "A hip-lifting posture that strengthens the glutes, hamstrings, and lower back while opening the chest.",
        "target_angles": {
            "knees": "80° - 120° (Stacked over ankles)",
            "hips": "Lifted level with shoulders",
            "feet": "Hip-width and grounded"
        },
        "instructions": [
            "Lie on your back with knees bent and feet flat on the floor.",
            "Press through the feet and lift the hips toward the ceiling.",
            "Keep knees aligned over ankles and thighs parallel.",
            "Interlace hands under the back or keep arms alongside the body."
        ],
        "common_mistakes": [
            "Letting knees collapse inward or flare outward.",
            "Pushing through the neck instead of the feet.",
            "Overarching the lower back without engaging the glutes."
        ],
        "image": "/assets/meditating_yogi.svg"
    },
    {
        "id": "seated_forward_bend",
        "name": "Seated Forward Bend",
        "sanskrit_name": "Paschimottanasana",
        "category": "Seated / Flexibility",
        "difficulty": "Beginner / Intermediate",
        "target_time_seconds": 300,
        "description": "A calming seated fold that stretches the hamstrings, lower back, and shoulders.",
        "target_angles": {
            "knees": "160° - 180° (Extended or softly bent)",
            "hips": "Hinging forward from the hips",
            "spine": "Long spine with neutral or gently rounded back"
        },
        "instructions": [
            "Sit tall with legs extended or softly bent and feet flexed.",
            "Inhale to lengthen the spine, then exhale and hinge from the hips.",
            "Reach toward the feet without forcing the stretch.",
            "Keep the chest open and breathe steadily."
        ],
        "common_mistakes": [
            "Rounding the spine excessively to reach the feet.",
            "Locking the knees or rolling onto the sit bones unevenly.",
            "Holding the breath or bouncing into the stretch."
        ],
        "image": "/assets/meditating_yogi.svg"
    },
    {
        "id": "cat_cow_pose",
        "name": "Cat-Cow Pose",
        "sanskrit_name": "Marjaryasana-Bitilasana",
        "category": "Mobility / Spine Health",
        "difficulty": "Beginner",
        "target_time_seconds": 300,
        "description": "A gentle alternating spinal mobility flow that warms the back and improves breath coordination.",
        "target_angles": {
            "wrists": "Under shoulders",
            "knees": "Under hips",
            "spine": "Alternating gentle flexion and extension"
        },
        "instructions": [
            "Start on hands and knees with wrists under shoulders and knees under hips.",
            "Inhale into Cow Pose by lifting the chest and tailbone.",
            "Exhale into Cat Pose by rounding the spine and tucking the chin.",
            "Move slowly and coordinate each transition with the breath."
        ],
        "common_mistakes": [
            "Letting the wrists splay outward or sink into the mat.",
            "Moving too quickly without breath awareness.",
            "Collapsing the shoulders or shifting weight unevenly."
        ],
        "image": "/assets/meditating_yogi.svg"
    }
]

@yoga_bp.route("/poses", methods=["GET"])
def get_poses():
    return jsonify({
        "success": True,
        "poses": POSES_METADATA
    }), 200

@yoga_bp.route("/sessions", methods=["POST"])
@token_required
def create_session(current_user):
    try:
        data = request.get_json() or {}
        errors = validate_yoga_session(data)
        if errors:
            return jsonify({"success": False, "errors": errors}), 400

        session = YogaSession.create(
            user_id=current_user._id,
            pose_name=data.get("pose_name"),
            duration=data.get("duration", 0),
            average_alignment_score=data.get("average_alignment_score", 0),
            best_alignment_score=data.get("best_alignment_score", 0),
            correction_count=data.get("correction_count", 0),
            notes=data.get("notes", "")
        )

        return jsonify({
            "success": True,
            "message": "Yoga session recorded successfully.",
            "session": session.to_dict()
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@yoga_bp.route("/sessions", methods=["GET"])
@token_required
def get_sessions(current_user):
    try:
        limit = int(request.args.get("limit", 20))
        sessions = YogaSession.find_by_user(current_user._id, limit=limit)
        return jsonify({
            "success": True,
            "sessions": [s.to_dict() for s in sessions]
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@yoga_bp.route("/sessions/summary", methods=["GET"])
@token_required
def get_session_summary(current_user):
    try:
        stats = SessionService.get_user_dashboard_stats(current_user)
        return jsonify({
            "success": True,
            "summary": stats
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

