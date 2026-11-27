import datetime
from app.models.yoga_session_model import YogaSession
from app.utils.db import Database

class SessionService:
    @staticmethod
    def get_user_dashboard_stats(user):
        """Calculate statistics for the dashboard matching the exact reference image metrics."""
        sessions = YogaSession.find_by_user(user._id, limit=100)
        
        now = datetime.datetime.utcnow()
        start_of_week = now - datetime.timedelta(days=now.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Sessions this week
        this_week_sessions = []
        last_week_sessions = []
        start_of_last_week = start_of_week - datetime.timedelta(days=7)
        
        # Day by day active minutes for Mon-Sun chart
        day_minutes = {i: 0 for i in range(7)} # 0: Mon, 1: Tue ... 6: Sun
        
        total_active_seconds_this_week = 0
        total_active_seconds_all_time = 0
        all_time_scores = []
        
        for s in sessions:
            total_active_seconds_all_time += s.duration
            if s.average_alignment_score:
                all_time_scores.append(s.average_alignment_score)
                
            try:
                comp_dt = datetime.datetime.fromisoformat(s.completed_at.replace("Z", "+00:00"))
                # strip timezone for comparison
                comp_dt_naive = comp_dt.replace(tzinfo=None)
            except Exception:
                comp_dt_naive = now

            if comp_dt_naive >= start_of_week:
                this_week_sessions.append(s)
                total_active_seconds_this_week += s.duration
                weekday = comp_dt_naive.weekday()
                day_minutes[weekday] += round(s.duration / 60, 1)
            elif comp_dt_naive >= start_of_last_week:
                last_week_sessions.append(s)

        # Count metrics
        sessions_count_this_week = len(this_week_sessions)
        active_minutes_this_week = round(total_active_seconds_this_week / 60)
        
        # Brand-new users start with zeroed dashboard metrics.
        if sessions_count_this_week == 0 and len(sessions) == 0:
            sessions_count_this_week = 0
            active_minutes_this_week = 0
            calories_this_week = 0
            progress_pct = 0
            sessions_diff = "+0"
            minutes_diff = "+0 min"
            calories_diff = "+0 kcal"
            weekly_chart = [
                {"day": day, "minutes": 0} for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            ]
            recent_sessions = []
        else:
            # Calories formula: ~4.67 kcal per minute of yoga
            calories_this_week = round(active_minutes_this_week * 4.67)
            goal_minutes = user.weekly_goal_minutes or 150
            progress_pct = min(100, round((active_minutes_this_week / goal_minutes) * 100))
            
            # Differences compared to previous week
            last_week_count = len(last_week_sessions)
            diff_count = sessions_count_this_week - last_week_count
            sessions_diff = f"+{diff_count}" if diff_count >= 0 else str(diff_count)
            
            last_week_minutes = sum(s.duration for s in last_week_sessions) // 60
            diff_min = active_minutes_this_week - last_week_minutes
            minutes_diff = f"+{diff_min} min" if diff_min >= 0 else f"{diff_min} min"
            
            diff_cal = round(diff_min * 4.67)
            calories_diff = f"+{diff_cal} kcal" if diff_cal >= 0 else f"{diff_cal} kcal"
            
            day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            weekly_chart = [{"day": day_labels[i], "minutes": day_minutes[i]} for i in range(7)]
            
            recent_sessions = []
            for s in sessions[:5]:
                try:
                    dt = datetime.datetime.fromisoformat(s.completed_at.replace("Z", "+00:00"))
                    date_str = dt.strftime("%b %d, %Y")
                except Exception:
                    date_str = "Today"
                mins = max(1, round(s.duration / 60))
                recent_sessions.append({
                    "_id": s._id,
                    "pose_name": s.pose_name,
                    "date": date_str,
                    "duration_formatted": f"{mins} min",
                    "duration": s.duration,
                    "score": round(s.average_alignment_score)
                })

        return {
            "weekly_goal": {
                "target_minutes": user.weekly_goal_minutes or 150,
                "current_minutes": active_minutes_this_week,
                "progress_percentage": progress_pct
            },
            "stats": {
                "yoga_sessions": {
                    "value": sessions_count_this_week,
                    "change": sessions_diff,
                    "label": "This Week"
                },
                "active_minutes": {
                    "value": f"{active_minutes_this_week} min",
                    "minutes_raw": active_minutes_this_week,
                    "change": minutes_diff,
                    "label": "This Week"
                },
                "calories": {
                    "value": f"{calories_this_week} kcal",
                    "calories_raw": calories_this_week,
                    "change": calories_diff,
                    "label": "This Week"
                },
                "overall_progress": {
                    "percentage": progress_pct
                }
            },
            "weekly_activity": weekly_chart,
            "recent_sessions": recent_sessions,
            "total_lifetime_sessions": len(sessions),
            "average_lifetime_score": round(sum(all_time_scores) / len(all_time_scores), 1) if all_time_scores else 0.0
        }

