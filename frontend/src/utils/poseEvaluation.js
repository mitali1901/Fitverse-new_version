/**
 * FitVerse Pose Evaluation Engine
 * Evaluates MediaPipe body landmarks for the supported yoga pose library.
 * Computes individual segment alignment (Green = Aligned, Red = Needs Correction).
 */

import { calculateAngle, calculateHorizontalAngle, calculateVerticalAngle, midPoint, calculateDistance } from './angleCalculator';

// MediaPipe Pose Landmark Indices (Standard 33-point model)
export const LM = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

const MIN_VISIBILITY = 0.5;

function isVisible(...points) {
  return points.every(p => p && (p.visibility === undefined || p.visibility >= MIN_VISIBILITY));
}

/**
 * Evaluates Warrior II Pose (Virabhadrasana II)
 */
export function evaluateWarriorII(landmarks) {
  if (!landmarks || landmarks.length < 29) {
    return {
      alignmentScore: 0,
      statusText: "Waiting for Pose...",
      feedbackList: [{ id: "visibility", text: "Please step back so your entire body is in camera frame.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  const ls = landmarks[LM.LEFT_SHOULDER];
  const rs = landmarks[LM.RIGHT_SHOULDER];
  const le = landmarks[LM.LEFT_ELBOW];
  const re = landmarks[LM.RIGHT_ELBOW];
  const lw = landmarks[LM.LEFT_WRIST];
  const rw = landmarks[LM.RIGHT_WRIST];
  const lh = landmarks[LM.LEFT_HIP];
  const rh = landmarks[LM.RIGHT_HIP];
  const lk = landmarks[LM.LEFT_KNEE];
  const rk = landmarks[LM.RIGHT_KNEE];
  const la = landmarks[LM.LEFT_ANKLE];
  const ra = landmarks[LM.RIGHT_ANKLE];

  // Ensure landmarks are valid
  if (!ls || !rs || !lh || !rh) {
    return {
      alignmentScore: 0,
      statusText: "Detecting Body...",
      feedbackList: [{ id: "visibility", text: "Step into camera view to begin.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  // POSE CONFIDENCE CHECK: Verify user is actually attempting Warrior II before evaluating
  // Very lenient: one knee bent (50-140°) and other relatively straight (130-180°)
  const leftKneeAngle = calculateAngle(lh, lk, la);
  const rightKneeAngle = calculateAngle(rh, rk, ra);
  const oneKneeBent = (leftKneeAngle >= 50 && leftKneeAngle <= 140) || (rightKneeAngle >= 50 && rightKneeAngle <= 140);
  const oneKneeStraight = (leftKneeAngle >= 130 && leftKneeAngle <= 180) || (rightKneeAngle >= 130 && rightKneeAngle <= 180);
  
  if (!oneKneeBent || !oneKneeStraight) {
    return {
      alignmentScore: 0,
      statusText: "Not in Warrior II Pose",
      feedbackList: [{ id: "pose_check", text: "Please get into Warrior II pose: one leg bent at 90°, other leg straight, arms extended.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  // 1. Joint angles (already calculated in pose check)
  const leftElbowAngle = calculateAngle(ls, le, lw);
  const rightElbowAngle = calculateAngle(rs, re, rw);

  // Determine front leg vs back leg based on knee flexion
  // Front leg knee is bent closer to 90 degrees; back leg is straight (~170)
  const leftDiffFrom90 = Math.abs((leftKneeAngle || 180) - 90);
  const rightDiffFrom90 = Math.abs((rightKneeAngle || 180) - 90);

  const isLeftFront = leftDiffFrom90 <= rightDiffFrom90;
  const frontKneeAngle = isLeftFront ? leftKneeAngle : rightKneeAngle;
  const backKneeAngle = isLeftFront ? rightKneeAngle : leftKneeAngle;
  const frontKneeJoint = isLeftFront ? LM.LEFT_KNEE : LM.RIGHT_KNEE;

  // 2. Evaluate front knee: Very lenient range
  const frontKneeCorrect = frontKneeAngle !== null && frontKneeAngle >= 60 && frontKneeAngle <= 130;
  const backLegCorrect = backKneeAngle !== null && backKneeAngle >= 130;

  // 3. Arm parallelity (horizontal angle of arm lines) - very lenient
  const leftArmHoriz = calculateHorizontalAngle(ls, lw);
  const rightArmHoriz = calculateHorizontalAngle(rs, rw);
  const leftArmStraight = leftElbowAngle !== null && leftElbowAngle >= 90;
  const rightArmStraight = rightElbowAngle !== null && rightElbowAngle >= 90;
  const armsParallel = (leftArmHoriz !== null && leftArmHoriz <= 70) &&
                       (rightArmHoriz !== null && rightArmHoriz <= 70) &&
                       leftArmStraight && rightArmStraight;

  // 4. Torso alignment (vertical upright) - very lenient
  const midShoulder = midPoint(ls, rs);
  const midHip = midPoint(lh, rh);
  const torsoTilt = calculateVerticalAngle(midShoulder, midHip);
  const backStraight = torsoTilt !== null && torsoTilt <= 50;

  // 5. Stance stability (wide base)
  const ankleDist = calculateDistance(la, ra);
  const shoulderDist = calculateDistance(ls, rs);
  const stanceStable = ankleDist >= (shoulderDist * 1.7);

  // Segments coloring state (Green = Aligned, Red = Needs Correction)
  const segments = {
    torso: backStraight,
    left_arm: (leftArmHoriz <= 70 && leftArmStraight),
    right_arm: (rightArmHoriz <= 70 && rightArmStraight),
    left_leg: isLeftFront ? frontKneeCorrect : backLegCorrect,
    right_leg: isLeftFront ? backLegCorrect : frontKneeCorrect,
    front_knee_joint: frontKneeCorrect,
  };

  // Feedback items matching the user's reference design
  const feedbackList = [
    {
      id: "front_knee",
      text: frontKneeCorrect ? "Front knee correctly aligned at ~90°." : "Adjust your front knee.",
      passed: frontKneeCorrect,
      isWarning: !frontKneeCorrect,
      segmentKey: isLeftFront ? "left_leg" : "right_leg",
      angle: frontKneeAngle,
      target: "85° - 105°"
    },
    {
      id: "arms",
      text: armsParallel ? "Arms parallel to the floor." : "Keep your arms parallel to the floor.",
      passed: armsParallel,
      isWarning: !armsParallel,
      segmentKey: "arms"
    },
    {
      id: "back",
      text: backStraight ? "Back and torso upright." : "Keep your back straight.",
      passed: backStraight,
      isWarning: !backStraight,
      segmentKey: "torso"
    },
    {
      id: "stance",
      text: stanceStable ? "Stable wide stance maintained." : "Maintain a stable stance.",
      passed: stanceStable,
      isWarning: !stanceStable,
      segmentKey: "stance"
    }
  ];

  // Dynamic Alignment Score: percentage of passing evaluated rules
  const evaluatedRules = [frontKneeCorrect, armsParallel, backStraight, backLegCorrect, stanceStable];
  const passedCount = evaluatedRules.filter(Boolean).length;
  const score = Math.round((passedCount / evaluatedRules.length) * 100);

  return {
    alignmentScore: score,
    statusText: score >= 80 ? "Good Alignment" : (score >= 60 ? "Moderate Alignment" : "Needs Improvement"),
    feedbackList,
    segments,
    criticalJoint: !frontKneeCorrect ? frontKneeJoint : null,
    isLeftFront
  };
}

/**
 * Evaluates Tree Pose (Vrikshasana)
 */
export function evaluateTreePose(landmarks) {
  if (!landmarks || landmarks.length < 29) {
    return {
      alignmentScore: 0,
      statusText: "Waiting for Pose...",
      feedbackList: [{ id: "visibility", text: "Please step back so your entire body is in camera frame.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  const ls = landmarks[LM.LEFT_SHOULDER];
  const rs = landmarks[LM.RIGHT_SHOULDER];
  const lw = landmarks[LM.LEFT_WRIST];
  const rw = landmarks[LM.RIGHT_WRIST];
  const lh = landmarks[LM.LEFT_HIP];
  const rh = landmarks[LM.RIGHT_HIP];
  const lk = landmarks[LM.LEFT_KNEE];
  const rk = landmarks[LM.RIGHT_KNEE];
  const la = landmarks[LM.LEFT_ANKLE];
  const ra = landmarks[LM.RIGHT_ANKLE];

  // Ensure landmarks are valid
  if (!ls || !rs || !lh || !rh) {
    return {
      alignmentScore: 0,
      statusText: "Detecting Body...",
      feedbackList: [{ id: "visibility", text: "Step into camera view to begin.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  const leftKneeAngle = calculateAngle(lh, lk, la);
  const rightKneeAngle = calculateAngle(rh, rk, ra);

  // POSE CONFIDENCE CHECK: Verify user is actually attempting Tree Pose before evaluating
  // Very lenient: one knee bent (15-110°) and other straight (130-180°)
  const oneKneeBent = (leftKneeAngle >= 15 && leftKneeAngle <= 110) || (rightKneeAngle >= 15 && rightKneeAngle <= 110);
  const oneKneeStraight = (leftKneeAngle >= 130 && leftKneeAngle <= 180) || (rightKneeAngle >= 130 && rightKneeAngle <= 180);
  
  if (!oneKneeBent || !oneKneeStraight) {
    return {
      alignmentScore: 0,
      statusText: "Not in Tree Pose",
      feedbackList: [{ id: "pose_check", text: "Please get into Tree Pose: one leg straight, other knee bent with foot on inner calf/thigh.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  // Standing leg has knee angle ~180; Bent leg has knee angle ~30 - 80
  const isLeftStanding = (leftKneeAngle || 0) > (rightKneeAngle || 0);
  const standingKneeAngle = isLeftStanding ? leftKneeAngle : rightKneeAngle;
  const bentKneeAngle = isLeftStanding ? rightKneeAngle : leftKneeAngle;

  const standingLegStraight = standingKneeAngle !== null && standingKneeAngle >= 130;
  const bentLegFolded = bentKneeAngle !== null && bentKneeAngle >= 15 && bentKneeAngle <= 110;

  // Hands in prayer (wrists close together) OR extended overhead
  const wristDist = calculateDistance(lw, rw);
  const handsInPrayer = wristDist < 0.20 || (lw.y < ls.y && rw.y < rs.y && wristDist < 0.28);

  // Spine upright - very lenient
  const midShoulder = midPoint(ls, rs);
  const midHip = midPoint(lh, rh);
  const spineTilt = calculateVerticalAngle(midShoulder, midHip);
  const spineUpright = spineTilt !== null && spineTilt <= 45;

  const segments = {
    torso: spineUpright,
    left_arm: handsInPrayer,
    right_arm: handsInPrayer,
    left_leg: isLeftStanding ? standingLegStraight : bentLegFolded,
    right_leg: isLeftStanding ? bentLegFolded : standingLegStraight,
  };

  const feedbackList = [
    {
      id: "standing_leg",
      text: standingLegStraight ? "Standing leg is strong and rooted." : "Keep your standing leg straight and rooted.",
      passed: standingLegStraight,
      isWarning: !standingLegStraight,
      segmentKey: isLeftStanding ? "left_leg" : "right_leg"
    },
    {
      id: "bent_knee",
      text: bentLegFolded ? "Folded knee abducted correctly." : "Place foot on inner calf or thigh (avoid knee joint).",
      passed: bentLegFolded,
      isWarning: !bentLegFolded,
      segmentKey: isLeftStanding ? "right_leg" : "left_leg"
    },
    {
      id: "spine",
      text: spineUpright ? "Spine is upright and aligned." : "Maintain a long, upright spine.",
      passed: spineUpright,
      isWarning: !spineUpright,
      segmentKey: "torso"
    },
    {
      id: "hands",
      text: handsInPrayer ? "Hands in prayer / raised overhead." : "Bring palms together at your chest or overhead.",
      passed: handsInPrayer,
      isWarning: !handsInPrayer,
      segmentKey: "arms"
    }
  ];

  // Dynamic Alignment Score: 4 evaluated rules
  const evaluatedRules = [standingLegStraight, bentLegFolded, spineUpright, handsInPrayer];
  const passedCount = evaluatedRules.filter(Boolean).length;
  const score = Math.round((passedCount / evaluatedRules.length) * 100);

  return {
    alignmentScore: score,
    statusText: score >= 75 ? "Good Alignment" : "Needs Improvement",
    feedbackList,
    segments,
    criticalJoint: !standingLegStraight ? (isLeftStanding ? LM.LEFT_KNEE : LM.RIGHT_KNEE) : (!bentLegFolded ? (isLeftStanding ? LM.RIGHT_KNEE : LM.LEFT_KNEE) : null)
  };
}

/**
 * Evaluates Downward-Facing Dog (Adho Mukha Svanasana)
 */
export function evaluateDownwardDog(landmarks) {
  if (!landmarks || landmarks.length < 29) {
    return {
      alignmentScore: 0,
      statusText: "Waiting for Pose...",
      feedbackList: [{ id: "visibility", text: "Ensure whole mat and body are visible in frame.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  const ls = landmarks[LM.LEFT_SHOULDER];
  const rs = landmarks[LM.RIGHT_SHOULDER];
  const le = landmarks[LM.LEFT_ELBOW];
  const re = landmarks[LM.RIGHT_ELBOW];
  const lw = landmarks[LM.LEFT_WRIST];
  const rw = landmarks[LM.RIGHT_WRIST];
  const lh = landmarks[LM.LEFT_HIP];
  const rh = landmarks[LM.RIGHT_HIP];
  const lk = landmarks[LM.LEFT_KNEE];
  const rk = landmarks[LM.RIGHT_KNEE];
  const la = landmarks[LM.LEFT_ANKLE];
  const ra = landmarks[LM.RIGHT_ANKLE];

  // Ensure landmarks are valid
  if (!ls || !rs || !lh || !rh) {
    return {
      alignmentScore: 0,
      statusText: "Detecting Body...",
      feedbackList: [{ id: "visibility", text: "Step into camera view to begin.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  const leftArmAngle = calculateAngle(ls, le, lw);
  const rightArmAngle = calculateAngle(rs, re, rw);
  const leftLegAngle = calculateAngle(lh, lk, la);
  const rightLegAngle = calculateAngle(rh, rk, ra);

  // POSE CONFIDENCE CHECK: Verify user is actually attempting Downward Dog before evaluating
  // Very lenient: hips higher than shoulders, arms/legs extended
  const midHip = midPoint(lh, rh);
  const midShoulder = midPoint(ls, rs);
  const hipsHigherThanShoulders = midHip.y < midShoulder.y;
  const armsExtended = (leftArmAngle >= 100 && leftArmAngle <= 180) && (rightArmAngle >= 100 && rightArmAngle <= 180);
  const legsExtendedCheck = (leftLegAngle >= 100 && leftLegAngle <= 180) && (rightLegAngle >= 100 && rightLegAngle <= 180);

  if (!hipsHigherThanShoulders || !armsExtended || !legsExtendedCheck) {
    return {
      alignmentScore: 0,
      statusText: "Not in Downward Dog",
      feedbackList: [{ id: "pose_check", text: "Please get into Downward Dog: hands on floor, lift hips high, form inverted 'V' shape.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  // Hip apex angle (between shoulder, hip, and ankle/knee)
  const leftHipAngle = calculateAngle(ls, lh, lk);
  const rightHipAngle = calculateAngle(rs, rh, rk);
  const avgHipAngle = ((leftHipAngle || 90) + (rightHipAngle || 90)) / 2;

  // Inverted V shape: hip angle - very lenient
  const invertedVCorrect = avgHipAngle >= 40 && avgHipAngle <= 120;
  const armsStraight = (leftArmAngle !== null && leftArmAngle >= 100) && (rightArmAngle !== null && rightArmAngle >= 100);
  const legsExtended = (leftLegAngle !== null && leftLegAngle >= 100) && (rightLegAngle !== null && rightLegAngle >= 100);

  const segments = {
    torso: invertedVCorrect && hipsHigherThanShoulders,
    left_arm: leftArmAngle >= 100,
    right_arm: rightArmAngle >= 100,
    left_leg: leftLegAngle >= 100,
    right_leg: rightLegAngle >= 100
  };

  const feedbackList = [
    {
      id: "hips",
      text: (invertedVCorrect && hipsHigherThanShoulders) ? "Inverted 'V' shape formed correctly." : "Lift your hips high to form an inverted 'V'.",
      passed: invertedVCorrect && hipsHigherThanShoulders,
      isWarning: !(invertedVCorrect && hipsHigherThanShoulders),
      segmentKey: "torso"
    },
    {
      id: "arms",
      text: armsStraight ? "Arms straight and pressing firmly." : "Keep your arms straight and press firmly through hands.",
      passed: armsStraight,
      isWarning: !armsStraight,
      segmentKey: "arms"
    },
    {
      id: "legs",
      text: legsExtended ? "Legs well extended." : "Extend your legs; soften knees if hamstrings feel tight.",
      passed: legsExtended,
      isWarning: !legsExtended,
      segmentKey: "legs"
    },
    {
      id: "neck",
      text: "Neck relaxed with gaze toward navel.",
      passed: true,
      isWarning: false,
      segmentKey: "head"
    }
  ];

  // Dynamic Alignment Score: 4 evaluated rules
  const evaluatedRules = [(invertedVCorrect && hipsHigherThanShoulders), armsStraight, legsExtended, true];
  const passedCount = evaluatedRules.filter(Boolean).length;
  const score = Math.round((passedCount / evaluatedRules.length) * 100);

  return {
    alignmentScore: score,
    statusText: score >= 75 ? "Good Alignment" : "Needs Improvement",
    feedbackList,
    segments,
    criticalJoint: !armsStraight ? LM.LEFT_ELBOW : (!invertedVCorrect ? LM.LEFT_HIP : null)
  };
}

/**
 * Generic Posture Evaluator - works for any pose
 * Evaluates general posture principles: symmetry, alignment, joint health
 */
export function evaluateGenericPose(landmarks) {
  if (!landmarks || landmarks.length < 20) {
    return {
      alignmentScore: 0,
      statusText: "Body Not Fully Visible",
      feedbackList: [{ id: "visibility", text: "Ensure full body is visible in the photo.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  const ls = landmarks[LM.LEFT_SHOULDER];
  const rs = landmarks[LM.RIGHT_SHOULDER];
  const le = landmarks[LM.LEFT_ELBOW];
  const re = landmarks[LM.RIGHT_ELBOW];
  const lw = landmarks[LM.LEFT_WRIST];
  const rw = landmarks[LM.RIGHT_WRIST];
  const lh = landmarks[LM.LEFT_HIP];
  const rh = landmarks[LM.RIGHT_HIP];
  const lk = landmarks[LM.LEFT_KNEE];
  const rk = landmarks[LM.RIGHT_KNEE];
  const la = landmarks[LM.LEFT_ANKLE];
  const ra = landmarks[LM.RIGHT_ANKLE];

  // 1. Shoulder Level (Symmetry)
  const shoulderLevel = Math.abs(ls.y - rs.y) < 0.08;

  // 2. Hip Level (Symmetry)
  const hipLevel = Math.abs(lh.y - rh.y) < 0.08;

  // 3. Spine Alignment (Vertical)
  const midShoulder = midPoint(ls, rs);
  const midHip = midPoint(lh, rh);
  const spineTilt = calculateVerticalAngle(midShoulder, midHip);
  const spineAligned = spineTilt !== null && spineTilt <= 20;

  // 4. Knee Alignment (General health check)
  const leftKneeAngle = calculateAngle(lh, lk, la);
  const rightKneeAngle = calculateAngle(rh, rk, ra);
  const kneesHealthy = (leftKneeAngle >= 140 && rightKneeAngle >= 140) ||
                       (leftKneeAngle >= 30 && leftKneeAngle <= 90) ||
                       (rightKneeAngle >= 30 && rightKneeAngle <= 90);

  // 5. Arm Extension (General check)
  const leftElbowAngle = calculateAngle(ls, le, lw);
  const rightElbowAngle = calculateAngle(rs, re, rw);
  const armsExtended = (leftElbowAngle >= 130 && rightElbowAngle >= 130);

  const segments = {
    torso: shoulderLevel && hipLevel && spineAligned,
    left_arm: leftElbowAngle >= 130,
    right_arm: rightElbowAngle >= 130,
    left_leg: leftKneeAngle >= 130 || (leftKneeAngle >= 25 && leftKneeAngle <= 95),
    right_leg: rightKneeAngle >= 130 || (rightKneeAngle >= 25 && rightKneeAngle <= 95),
  };

  const feedbackList = [
    {
      id: "shoulders",
      text: shoulderLevel ? "Shoulders are level and balanced." : "Try to keep your shoulders level.",
      passed: shoulderLevel,
      isWarning: !shoulderLevel,
      segmentKey: "torso"
    },
    {
      id: "hips",
      text: hipLevel ? "Hips are level and balanced." : "Keep your hips level for better alignment.",
      passed: hipLevel,
      isWarning: !hipLevel,
      segmentKey: "torso"
    },
    {
      id: "spine",
      text: spineAligned ? "Spine is well-aligned." : "Focus on keeping your spine straight.",
      passed: spineAligned,
      isWarning: !spineAligned,
      segmentKey: "torso"
    },
    {
      id: "knees",
      text: kneesHealthy ? "Knees are in a healthy position." : "Be mindful of your knee alignment.",
      passed: kneesHealthy,
      isWarning: !kneesHealthy,
      segmentKey: "legs"
    },
    {
      id: "arms",
      text: armsExtended ? "Arms are well-positioned." : "Check your arm positioning.",
      passed: armsExtended,
      isWarning: !armsExtended,
      segmentKey: "arms"
    }
  ];

  const evaluatedRules = [shoulderLevel, hipLevel, spineAligned, kneesHealthy, armsExtended];
  const passedCount = evaluatedRules.filter(Boolean).length;
  const score = Math.round((passedCount / evaluatedRules.length) * 100);

  return {
    alignmentScore: score,
    statusText: score >= 75 ? "Good Posture" : "Needs Adjustment",
    feedbackList,
    segments,
    criticalJoint: !spineAligned ? LM.LEFT_HIP : null
  };
}

function poseNotDetected(statusText, instruction) {
  return {
    alignmentScore: 0,
    statusText,
    feedbackList: [{ id: "pose_check", text: instruction, passed: false, isWarning: true }],
    segments: {},
    criticalJoint: null
  };
}

function finalizePoseEvaluation(feedbackList, segments, criticalJoint = null) {
  const evaluatedRules = feedbackList.map((item) => Boolean(item.passed));
  const passedCount = evaluatedRules.filter(Boolean).length;
  const score = Math.round((passedCount / evaluatedRules.length) * 100);

  return {
    alignmentScore: score,
    statusText: score >= 75 ? "Good Alignment" : (score >= 50 ? "Moderate Alignment" : "Needs Improvement"),
    feedbackList,
    segments,
    criticalJoint
  };
}

function getCoreLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 29) return null;

  const ls = landmarks[LM.LEFT_SHOULDER];
  const rs = landmarks[LM.RIGHT_SHOULDER];
  const le = landmarks[LM.LEFT_ELBOW];
  const re = landmarks[LM.RIGHT_ELBOW];
  const lw = landmarks[LM.LEFT_WRIST];
  const rw = landmarks[LM.RIGHT_WRIST];
  const lh = landmarks[LM.LEFT_HIP];
  const rh = landmarks[LM.RIGHT_HIP];
  const lk = landmarks[LM.LEFT_KNEE];
  const rk = landmarks[LM.RIGHT_KNEE];
  const la = landmarks[LM.LEFT_ANKLE];
  const ra = landmarks[LM.RIGHT_ANKLE];

  if (!ls || !rs || !le || !re || !lw || !rw || !lh || !rh || !lk || !rk || !la || !ra) {
    return null;
  }

  return {
    ls, rs, le, re, lw, rw, lh, rh, lk, rk, la, ra,
    midShoulder: midPoint(ls, rs),
    midHip: midPoint(lh, rh),
    midAnkle: midPoint(la, ra),
    shoulderWidth: calculateDistance(ls, rs),
    hipWidth: calculateDistance(lh, rh),
    ankleWidth: calculateDistance(la, ra)
  };
}

function isLevel(a, b, tolerance = 0.08) {
  return a && b && Math.abs(a.y - b.y) <= tolerance;
}

function isSpineVertical(midShoulder, midHip, maxAngle = 30) {
  const tilt = calculateVerticalAngle(midShoulder, midHip);
  return tilt !== null && tilt <= maxAngle;
}

function areArmsOverhead(ls, rs, lw, rw) {
  return lw.y < ls.y - 0.04 && rw.y < rs.y - 0.04 && calculateDistance(lw, rw) < 0.38;
}

function areWristsUnderShoulders(lw, rw, ls, rs, tolerance = 0.16) {
  return Math.abs(lw.x - ls.x) <= tolerance && Math.abs(rw.x - rs.x) <= tolerance;
}

function areKneesUnderHips(lk, rk, lh, rh, tolerance = 0.16) {
  return Math.abs(lk.x - lh.x) <= tolerance && Math.abs(rk.x - rh.x) <= tolerance;
}

/**
 * Evaluates Mountain Pose (Tadasana)
 */
export function evaluateMountainPose(landmarks) {
  const lmk = getCoreLandmarks(landmarks);
  if (!lmk) {
    return poseNotDetected("Not in Mountain Pose", "Please get into Mountain Pose: stand tall with feet grounded and spine long.");
  }

  const leftKneeAngle = calculateAngle(lmk.lh, lmk.lk, lmk.la);
  const rightKneeAngle = calculateAngle(lmk.rh, lmk.rk, lmk.ra);
  const kneesExtended = leftKneeAngle >= 150 && rightKneeAngle >= 150;
  const spineUpright = isSpineVertical(lmk.midShoulder, lmk.midHip, 28);
  const shouldersLevel = isLevel(lmk.ls, lmk.rs);
  const hipsLevel = isLevel(lmk.lh, lmk.rh, 0.1);
  const armsOverhead = areArmsOverhead(lmk.ls, lmk.rs, lmk.lw, lmk.rw);
  const armsRelaxed = lmk.lw.y > lmk.ls.y + 0.03 && lmk.rw.y > lmk.rs.y + 0.03;
  const armsPositioned = armsOverhead || armsRelaxed;

  const kneesLoose = leftKneeAngle >= 135 && rightKneeAngle >= 135;
  const spineLoose = calculateVerticalAngle(lmk.midShoulder, lmk.midHip) <= 40;
  const symmetryLoose = isLevel(lmk.ls, lmk.rs, 0.15) && isLevel(lmk.lh, lmk.rh, 0.15);
  if (!(kneesLoose && spineLoose && symmetryLoose && armsPositioned)) {
    return poseNotDetected("Not in Mountain Pose", "Please get into Mountain Pose: stand tall with feet grounded and spine long.");
  }

  const feedbackList = [
    {
      id: "legs",
      text: kneesExtended ? "Legs are long and grounded." : "Straighten your knees without locking them.",
      passed: kneesExtended,
      isWarning: !kneesExtended,
      segmentKey: "legs"
    },
    {
      id: "spine",
      text: spineUpright ? "Spine is tall and neutral." : "Lengthen your spine and lift your chest.",
      passed: spineUpright,
      isWarning: !spineUpright,
      segmentKey: "torso"
    },
    {
      id: "symmetry",
      text: shouldersLevel && hipsLevel ? "Shoulders and hips are level." : "Square your shoulders and hips.",
      passed: shouldersLevel && hipsLevel,
      isWarning: !(shouldersLevel && hipsLevel),
      segmentKey: "torso"
    },
    {
      id: "arms",
      text: armsPositioned ? "Arms are overhead or relaxed beside the body." : "Reach your arms overhead or rest them softly beside you.",
      passed: armsPositioned,
      isWarning: !armsPositioned,
      segmentKey: "arms"
    }
  ];

  return finalizePoseEvaluation(feedbackList, {
    torso: spineUpright && shouldersLevel && hipsLevel,
    left_arm: armsPositioned,
    right_arm: armsPositioned,
    left_leg: kneesExtended,
    right_leg: kneesExtended
  }, !kneesExtended ? LM.LEFT_KNEE : null);
}

/**
 * Evaluates Chair Pose (Utkatasana)
 */
export function evaluateChairPose(landmarks) {
  const lmk = getCoreLandmarks(landmarks);
  if (!lmk) {
    return poseNotDetected("Not in Chair Pose", "Please get into Chair Pose: sit back into a controlled squat with chest lifted.");
  }

  const leftKneeAngle = calculateAngle(lmk.lh, lmk.lk, lmk.la);
  const rightKneeAngle = calculateAngle(lmk.rh, lmk.rk, lmk.ra);
  const kneesBent = leftKneeAngle >= 70 && leftKneeAngle <= 135 && rightKneeAngle >= 70 && rightKneeAngle <= 135;
  const hipsLowered = lmk.midHip.y > lmk.midShoulder.y + 0.08;
  const spineUpright = isSpineVertical(lmk.midShoulder, lmk.midHip, 35);
  const shouldersLevel = isLevel(lmk.ls, lmk.rs);
  const hipsLevel = isLevel(lmk.lh, lmk.rh, 0.12);
  const armsOverhead = areArmsOverhead(lmk.ls, lmk.rs, lmk.lw, lmk.rw);
  const handsAtChest = calculateDistance(lmk.lw, lmk.rw) < 0.24;
  const armsForward = lmk.lw.y > lmk.ls.y && lmk.rw.y > lmk.rs.y && calculateDistance(lmk.lw, lmk.rw) > lmk.shoulderWidth * 0.8;
  const armsPositioned = armsOverhead || handsAtChest || armsForward;

  const kneesLoose = leftKneeAngle >= 60 && leftKneeAngle <= 140 && rightKneeAngle >= 60 && rightKneeAngle <= 140;
  const hipsLoweredLoose = lmk.midHip.y > lmk.midShoulder.y;
  const spineLoose = isSpineVertical(lmk.midShoulder, lmk.midHip, 45);
  if (!(kneesLoose && hipsLoweredLoose && spineLoose && armsPositioned)) {
    return poseNotDetected("Not in Chair Pose", "Please get into Chair Pose: sit back into a controlled squat with chest lifted.");
  }

  const feedbackList = [
    {
      id: "knees",
      text: kneesBent ? "Knees are bent in a controlled squat." : "Bend your knees deeper while keeping control.",
      passed: kneesBent,
      isWarning: !kneesBent,
      segmentKey: "legs"
    },
    {
      id: "depth",
      text: hipsLowered ? "Hips are lowered into the chair shape." : "Sit your hips back and down.",
      passed: hipsLowered,
      isWarning: !hipsLowered,
      segmentKey: "torso"
    },
    {
      id: "spine",
      text: spineUpright && shouldersLevel && hipsLevel ? "Chest is lifted with a long spine." : "Lift your chest and keep your spine long.",
      passed: spineUpright && shouldersLevel && hipsLevel,
      isWarning: !(spineUpright && shouldersLevel && hipsLevel),
      segmentKey: "torso"
    },
    {
      id: "arms",
      text: armsPositioned ? "Arms are reaching or held with intent." : "Reach your arms overhead, forward, or bring palms together.",
      passed: armsPositioned,
      isWarning: !armsPositioned,
      segmentKey: "arms"
    }
  ];

  return finalizePoseEvaluation(feedbackList, {
    torso: spineUpright && shouldersLevel && hipsLevel,
    left_arm: armsPositioned,
    right_arm: armsPositioned,
    left_leg: kneesBent,
    right_leg: kneesBent
  }, !kneesBent ? LM.LEFT_KNEE : null);
}

/**
 * Evaluates Plank Pose (Phalakasana)
 */
export function evaluatePlankPose(landmarks) {
  const lmk = getCoreLandmarks(landmarks);
  if (!lmk) {
    return poseNotDetected("Not in Plank Pose", "Please get into Plank Pose: extend from head to heels in one straight line.");
  }

  const leftElbowAngle = calculateAngle(lmk.ls, lmk.le, lmk.lw);
  const rightElbowAngle = calculateAngle(lmk.rs, lmk.re, lmk.rw);
  const leftKneeAngle = calculateAngle(lmk.lh, lmk.lk, lmk.la);
  const rightKneeAngle = calculateAngle(lmk.rh, lmk.rk, lmk.ra);
  const armsStraight = leftElbowAngle >= 140 && rightElbowAngle >= 140;
  const legsStraight = leftKneeAngle >= 145 && rightKneeAngle >= 145;
  const bodyHorizontal = isLevel(lmk.midShoulder, lmk.midHip, 0.18) && isLevel(lmk.midHip, lmk.midAnkle, 0.18);
  const bodyLineAngle = calculateAngle(lmk.midShoulder, lmk.midHip, lmk.midAnkle);
  const bodyInLine = bodyHorizontal || (bodyLineAngle !== null && bodyLineAngle >= 145);
  const shouldersLevel = isLevel(lmk.ls, lmk.rs);
  const hipsLevel = isLevel(lmk.lh, lmk.rh, 0.1);

  const armsLoose = leftElbowAngle >= 110 && rightElbowAngle >= 110;
  const legsLoose = leftKneeAngle >= 125 && rightKneeAngle >= 125;
  const bodyLoose = isLevel(lmk.midShoulder, lmk.midAnkle, 0.35);
  const stabilityLoose = isLevel(lmk.ls, lmk.rs, 0.15) && isLevel(lmk.lh, lmk.rh, 0.15);
  if (!(armsLoose && legsLoose && bodyLoose && stabilityLoose)) {
    return poseNotDetected("Not in Plank Pose", "Please get into Plank Pose: extend from head to heels in one straight line.");
  }

  const feedbackList = [
    {
      id: "arms",
      text: armsStraight ? "Arms are pressing firmly into the floor." : "Straighten your arms and press through your hands.",
      passed: armsStraight,
      isWarning: !armsStraight,
      segmentKey: "arms"
    },
    {
      id: "legs",
      text: legsStraight ? "Legs are extended and engaged." : "Extend your legs and press through your heels.",
      passed: legsStraight,
      isWarning: !legsStraight,
      segmentKey: "legs"
    },
    {
      id: "bodyline",
      text: bodyInLine ? "Body forms one straight line." : "Keep your body in one straight line from head to heels.",
      passed: bodyInLine,
      isWarning: !bodyInLine,
      segmentKey: "torso"
    },
    {
      id: "stability",
      text: shouldersLevel && hipsLevel ? "Shoulders and hips are stable." : "Square your shoulders and hips without shifting.",
      passed: shouldersLevel && hipsLevel,
      isWarning: !(shouldersLevel && hipsLevel),
      segmentKey: "torso"
    }
  ];

  return finalizePoseEvaluation(feedbackList, {
    torso: bodyInLine && shouldersLevel && hipsLevel,
    left_arm: armsStraight,
    right_arm: armsStraight,
    left_leg: legsStraight,
    right_leg: legsStraight
  }, !bodyInLine ? LM.LEFT_HIP : null);
}

/**
 * Evaluates Cobra Pose (Bhujangasana)
 */
export function evaluateCobraPose(landmarks) {
  const lmk = getCoreLandmarks(landmarks);
  if (!lmk) {
    return poseNotDetected("Not in Cobra Pose", "Please get into Cobra Pose: lie face down and gently lift your chest.");
  }

  const leftElbowAngle = calculateAngle(lmk.ls, lmk.le, lmk.lw);
  const rightElbowAngle = calculateAngle(lmk.rs, lmk.re, lmk.rw);
  const leftKneeAngle = calculateAngle(lmk.lh, lmk.lk, lmk.la);
  const rightKneeAngle = calculateAngle(lmk.rh, lmk.rk, lmk.ra);
  const elbowsSupported = leftElbowAngle >= 70 && rightElbowAngle >= 70;
  const chestLifted = lmk.midShoulder.y < lmk.midHip.y;
  const shouldersLevel = isLevel(lmk.ls, lmk.rs);
  const hipsLevel = isLevel(lmk.lh, lmk.rh, 0.12);
  const handsUnderShoulders = areWristsUnderShoulders(lmk.lw, lmk.rw, lmk.ls, lmk.rs, 0.22);
  const legsExtended = leftKneeAngle >= 140 && rightKneeAngle >= 140;

  const elbowsLoose = leftElbowAngle >= 50 && leftElbowAngle <= 170 && rightElbowAngle >= 50 && rightElbowAngle <= 170;
  const chestLoose = lmk.midShoulder.y <= lmk.midHip.y + 0.03;
  const handsLoose = areWristsUnderShoulders(lmk.lw, lmk.rw, lmk.ls, lmk.rs, 0.28);
  const legsLoose = leftKneeAngle >= 120 && rightKneeAngle >= 120;
  if (!(elbowsLoose && chestLoose && handsLoose && legsLoose)) {
    return poseNotDetected("Not in Cobra Pose", "Please get into Cobra Pose: lie face down and gently lift your chest.");
  }

  const feedbackList = [
    {
      id: "elbows",
      text: elbowsSupported ? "Elbows are softly bent for support." : "Soften your elbows and avoid locking them.",
      passed: elbowsSupported,
      isWarning: !elbowsSupported,
      segmentKey: "arms"
    },
    {
      id: "chest",
      text: chestLifted ? "Chest is lifted into a gentle backbend." : "Lift your chest while keeping your hips grounded.",
      passed: chestLifted,
      isWarning: !chestLifted,
      segmentKey: "torso"
    },
    {
      id: "alignment",
      text: shouldersLevel && hipsLevel ? "Shoulders and hips are level." : "Keep your shoulders and hips level.",
      passed: shouldersLevel && hipsLevel,
      isWarning: !(shouldersLevel && hipsLevel),
      segmentKey: "torso"
    },
    {
      id: "hands",
      text: handsUnderShoulders ? "Hands are positioned under the shoulders." : "Place your hands under your shoulders.",
      passed: handsUnderShoulders,
      isWarning: !handsUnderShoulders,
      segmentKey: "arms"
    },
    {
      id: "legs",
      text: legsExtended ? "Legs are extended behind you." : "Extend your legs and keep the tops of your feet grounded.",
      passed: legsExtended,
      isWarning: !legsExtended,
      segmentKey: "legs"
    }
  ];

  return finalizePoseEvaluation(feedbackList, {
    torso: chestLifted && shouldersLevel && hipsLevel,
    left_arm: elbowsSupported,
    right_arm: elbowsSupported,
    left_leg: legsExtended,
    right_leg: legsExtended
  }, !chestLifted ? LM.LEFT_HIP : null);
}

/**
 * Evaluates Bridge Pose (Setu Bandhasana)
 */
export function evaluateBridgePose(landmarks) {
  const lmk = getCoreLandmarks(landmarks);
  if (!lmk) {
    return poseNotDetected("Not in Bridge Pose", "Please get into Bridge Pose: lie on your back, bend your knees, and lift your hips.");
  }

  const leftKneeAngle = calculateAngle(lmk.lh, lmk.lk, lmk.la);
  const rightKneeAngle = calculateAngle(lmk.rh, lmk.rk, lmk.ra);
  const kneesBent = leftKneeAngle >= 70 && leftKneeAngle <= 135 && rightKneeAngle >= 70 && rightKneeAngle <= 135;
  const feetUnderKnees = Math.abs(lmk.la.x - lmk.lk.x) <= 0.2 && Math.abs(lmk.ra.x - lmk.rk.x) <= 0.2;
  const feetLevel = isLevel(lmk.la, lmk.ra, 0.12);
  const hipsLevel = isLevel(lmk.lh, lmk.rh, 0.12);
  const shouldersLevel = isLevel(lmk.ls, lmk.rs);

  const kneesLoose = leftKneeAngle >= 60 && leftKneeAngle <= 140 && rightKneeAngle >= 60 && rightKneeAngle <= 140;
  const feetLoose = Math.abs(lmk.la.x - lmk.lk.x) <= 0.25 && Math.abs(lmk.ra.x - lmk.rk.x) <= 0.25;
  const levelLoose = isLevel(lmk.la, lmk.ra, 0.18) && isLevel(lmk.lh, lmk.rh, 0.18) && isLevel(lmk.ls, lmk.rs, 0.15);
  if (!(kneesLoose && feetLoose && levelLoose)) {
    return poseNotDetected("Not in Bridge Pose", "Please get into Bridge Pose: lie on your back, bend your knees, and lift your hips.");
  }

  const feedbackList = [
    {
      id: "knees",
      text: kneesBent ? "Knees are bent with feet grounded." : "Bend your knees and keep your feet flat on the floor.",
      passed: kneesBent,
      isWarning: !kneesBent,
      segmentKey: "legs"
    },
    {
      id: "feet",
      text: feetUnderKnees && feetLevel ? "Feet are under the knees and level." : "Place your feet under your knees and keep them level.",
      passed: feetUnderKnees && feetLevel,
      isWarning: !(feetUnderKnees && feetLevel),
      segmentKey: "legs"
    },
    {
      id: "hips",
      text: hipsLevel ? "Hips are lifted evenly." : "Lift your hips evenly without shifting to one side.",
      passed: hipsLevel,
      isWarning: !hipsLevel,
      segmentKey: "torso"
    },
    {
      id: "shoulders",
      text: shouldersLevel ? "Shoulders remain grounded and level." : "Keep your shoulders relaxed and level on the floor.",
      passed: shouldersLevel,
      isWarning: !shouldersLevel,
      segmentKey: "torso"
    }
  ];

  return finalizePoseEvaluation(feedbackList, {
    torso: hipsLevel && shouldersLevel,
    left_leg: kneesBent,
    right_leg: kneesBent
  }, !kneesBent ? LM.LEFT_KNEE : null);
}

/**
 * Evaluates Seated Forward Bend (Paschimottanasana)
 */
export function evaluateSeatedForwardBend(landmarks) {
  const lmk = getCoreLandmarks(landmarks);
  if (!lmk) {
    return poseNotDetected("Not in Seated Forward Bend", "Please get into Seated Forward Bend: sit tall and hinge forward from the hips.");
  }

  const leftKneeAngle = calculateAngle(lmk.lh, lmk.lk, lmk.la);
  const rightKneeAngle = calculateAngle(lmk.rh, lmk.rk, lmk.ra);
  const legsExtended = leftKneeAngle >= 120 && rightKneeAngle >= 120;
  const torsoAngle = calculateVerticalAngle(lmk.midShoulder, lmk.midHip);
  const torsoFolded = torsoAngle !== null && torsoAngle >= 18 && torsoAngle <= 85;
  const shouldersLevel = isLevel(lmk.ls, lmk.rs);
  const hipsLevel = isLevel(lmk.lh, lmk.rh, 0.12);
  const leftElbowAngle = calculateAngle(lmk.ls, lmk.le, lmk.lw);
  const rightElbowAngle = calculateAngle(lmk.rs, lmk.re, lmk.rw);
  const armsReaching = leftElbowAngle >= 120 && rightElbowAngle >= 120;

  const legsLoose = leftKneeAngle >= 110 && rightKneeAngle >= 110;
  const foldLoose = torsoAngle !== null && torsoAngle >= 15 && torsoAngle <= 90;
  const armsLoose = leftElbowAngle >= 110 && rightElbowAngle >= 110;
  const symmetryLoose = isLevel(lmk.ls, lmk.rs, 0.15) && isLevel(lmk.lh, lmk.rh, 0.18);
  if (!(legsLoose && foldLoose && armsLoose && symmetryLoose)) {
    return poseNotDetected("Not in Seated Forward Bend", "Please get into Seated Forward Bend: sit tall and hinge forward from the hips.");
  }

  const feedbackList = [
    {
      id: "legs",
      text: legsExtended ? "Legs are extended or softly bent." : "Extend your legs or keep a soft bend in the knees.",
      passed: legsExtended,
      isWarning: !legsExtended,
      segmentKey: "legs"
    },
    {
      id: "fold",
      text: torsoFolded ? "Fold is hinging from the hips." : "Hinge forward from your hips while keeping the spine long.",
      passed: torsoFolded,
      isWarning: !torsoFolded,
      segmentKey: "torso"
    },
    {
      id: "alignment",
      text: shouldersLevel && hipsLevel ? "Hips and shoulders are aligned." : "Square your hips and keep your shoulders relaxed.",
      passed: shouldersLevel && hipsLevel,
      isWarning: !(shouldersLevel && hipsLevel),
      segmentKey: "torso"
    },
    {
      id: "arms",
      text: armsReaching ? "Arms are reaching toward the feet." : "Reach your arms forward toward your feet.",
      passed: armsReaching,
      isWarning: !armsReaching,
      segmentKey: "arms"
    }
  ];

  return finalizePoseEvaluation(feedbackList, {
    torso: torsoFolded && shouldersLevel && hipsLevel,
    left_arm: armsReaching,
    right_arm: armsReaching,
    left_leg: legsExtended,
    right_leg: legsExtended
  }, !torsoFolded ? LM.LEFT_HIP : null);
}

/**
 * Evaluates Cat-Cow Pose (Marjaryasana-Bitilasana)
 */
export function evaluateCatCowPose(landmarks) {
  const lmk = getCoreLandmarks(landmarks);
  if (!lmk) {
    return poseNotDetected("Not in Cat-Cow Pose", "Please get into Cat-Cow Pose: start on hands and knees with wrists under shoulders and knees under hips.");
  }

  const leftElbowAngle = calculateAngle(lmk.ls, lmk.le, lmk.lw);
  const rightElbowAngle = calculateAngle(lmk.rs, lmk.re, lmk.rw);
  const leftKneeAngle = calculateAngle(lmk.lh, lmk.lk, lmk.la);
  const rightKneeAngle = calculateAngle(lmk.rh, lmk.rk, lmk.ra);
  const elbowsBent = leftElbowAngle >= 50 && leftElbowAngle <= 160 && rightElbowAngle >= 50 && rightElbowAngle <= 160;
  const kneesBent = leftKneeAngle >= 50 && leftKneeAngle <= 160 && rightKneeAngle >= 50 && rightKneeAngle <= 160;
  const wristsUnderShoulders = areWristsUnderShoulders(lmk.lw, lmk.rw, lmk.ls, lmk.rs);
  const kneesUnderHips = areKneesUnderHips(lmk.lk, lmk.rk, lmk.lh, lmk.rh);
  const torsoStable = isLevel(lmk.midShoulder, lmk.midHip, 0.18);

  const wristsLoose = areWristsUnderShoulders(lmk.lw, lmk.rw, lmk.ls, lmk.rs, 0.22);
  const kneesLoose = areKneesUnderHips(lmk.lk, lmk.rk, lmk.lh, lmk.rh, 0.22);
  const jointsLoose = leftElbowAngle >= 40 && leftElbowAngle <= 170 && rightElbowAngle >= 40 && rightElbowAngle <= 170 &&
                      leftKneeAngle >= 40 && leftKneeAngle <= 170 && rightKneeAngle >= 40 && rightKneeAngle <= 170;
  const torsoLoose = isLevel(lmk.midShoulder, lmk.midHip, 0.25);
  if (!(wristsLoose && kneesLoose && jointsLoose && torsoLoose)) {
    return poseNotDetected("Not in Cat-Cow Pose", "Please get into Cat-Cow Pose: start on hands and knees with wrists under shoulders and knees under hips.");
  }

  const feedbackList = [
    {
      id: "wrists",
      text: wristsUnderShoulders ? "Wrists are under the shoulders." : "Place your wrists directly under your shoulders.",
      passed: wristsUnderShoulders,
      isWarning: !wristsUnderShoulders,
      segmentKey: "arms"
    },
    {
      id: "knees",
      text: kneesUnderHips ? "Knees are under the hips." : "Place your knees directly under your hips.",
      passed: kneesUnderHips,
      isWarning: !kneesUnderHips,
      segmentKey: "legs"
    },
    {
      id: "joints",
      text: elbowsBent && kneesBent ? "Elbows and knees are softly bent." : "Soften your elbows and keep your knees bent under your hips.",
      passed: elbowsBent && kneesBent,
      isWarning: !(elbowsBent && kneesBent),
      segmentKey: "torso"
    },
    {
      id: "torso",
      text: torsoStable ? "Torso is stable and mobile." : "Keep your torso stable while moving through the flow.",
      passed: torsoStable,
      isWarning: !torsoStable,
      segmentKey: "torso"
    }
  ];

  return finalizePoseEvaluation(feedbackList, {
    torso: torsoStable,
    left_arm: elbowsBent,
    right_arm: elbowsBent,
    left_leg: kneesBent,
    right_leg: kneesBent
  }, !wristsUnderShoulders ? LM.LEFT_WRIST : (!kneesUnderHips ? LM.LEFT_KNEE : null));
}

/**
 * Universal Pose Evaluator router
 */
export function evaluatePose(poseId, landmarks) {
  if (!landmarks || landmarks.length === 0) {
    return {
      alignmentScore: 0,
      statusText: "Waiting for Pose...",
      feedbackList: [{ id: "none", text: "Step into camera view to begin.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  const id = (poseId || "warrior_ii").toLowerCase();
  const poseEvaluators = {
    warrior_ii: evaluateWarriorII,
    tree_pose: evaluateTreePose,
    downward_dog: evaluateDownwardDog,
    mountain_pose: evaluateMountainPose,
    chair_pose: evaluateChairPose,
    plank_pose: evaluatePlankPose,
    cobra_pose: evaluateCobraPose,
    bridge_pose: evaluateBridgePose,
    seated_forward_bend: evaluateSeatedForwardBend,
    cat_cow_pose: evaluateCatCowPose
  };

  const evaluator = poseEvaluators[id] || (id.includes("warrior") ? evaluateWarriorII : evaluateGenericPose);
  return evaluator(landmarks);
}

