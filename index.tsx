import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// FIX: Define types for workout history to resolve 'unknown' type errors when accessing history data.
interface SetRecord {
    weight: string | number;
    reps: string | number;
    rir: string | number;
    completed: boolean;
    isBonus?: boolean;
    id?: string | number;
}

interface ExerciseRecord {
    id: string;
    name: string;
    sets: SetRecord[];
    type?: 'superset';
    exercises?: ExerciseRecord[];
    // Other properties might exist, but these are what we access.
}

interface WorkoutSession {
    date: string;
    exercises: ExerciseRecord[];
    // Other properties might exist (week, day, etc.)
}

type WorkoutHistory = Record<string, WorkoutSession>;

const muscleGroups = ["Pectoraux", "Dos", "Quadriceps", "Ischios", "Fessiers", "Épaules", "Biceps", "Triceps", "Avant-bras"];

const programData = {
  blocks: [
    { id: 1, name: "BLOC 1 (S1-5): FONDATION TECHNIQUE", weeks: [1, 2, 3, 4, 5], technique: { name: 'Tempo & Pauses', desc: "Tempo 3-1-2 et pauses stratégiques." } },
    { id: 2, name: "BLOC 2 (S7-11): SURCHARGE PROGRESSIVE", weeks: [7, 8, 9, 10, 11], technique: { name: 'Rest-Pause', desc: "Tempo 2-1-2. Rest-Pause sur la dernière série des exercices principaux." } },
    { id: 3, name: "BLOC 3 (S13-17): SURCOMPENSATION", weeks: [13, 14, 15, 16, 17], technique: { name: 'Drop-Sets & Myo-Reps', desc: "Drop-sets et Myo-reps sur la dernière série des isolations." } },
    { id: 4, name: "BLOC 4 (S19-25): INTENSIFICATION MAXIMALE", weeks: [19, 20, 21, 22, 23, 25], technique: { name: 'Clusters & Partials', desc: "Clusters, Myo-reps sur toutes les isolations, et Partials." } },
  ],
  deloadWeeks: [6, 12, 18, 24, 26],
  workouts: {
    dimanche: {
      name: "Dos + Jambes Lourdes + Bras",
      exercises: [
        { id: 'tbdl', name: 'Trap Bar Deadlift', sets: 5, reps: '6-8', rir: 2, rest: 120, startWeight: 75, progression: { increment: 5 }, intensification: 'rest-pause', muscles: { primary: ["Dos", "Fessiers", "Ischios"], secondary: ["Quadriceps"] } },
        { id: 'goblet', name: 'Goblet Squat', sets: 4, reps: '10', rir: 2, rest: 75, startWeight: 25, progression: { increment: 2.5 }, intensification: 'drop-set', muscles: { primary: ["Quadriceps", "Fessiers"], secondary: ["Ischios"] } },
        { id: 'legpress', name: 'Leg Press', sets: 4, reps: '10', rir: 2, rest: 75, startWeight: 110, progression: { increment: 10 }, intensification: 'cluster', muscles: { primary: ["Quadriceps", "Fessiers"], secondary: ["Ischios"] } },
        { type: 'superset', id: 'superset_dos_pecs', rest: 90, exercises: [
            { id: 'latpull', name: 'Lat Pulldown (large)', sets: 4, reps: '10', rir: 2, startWeight: 60, progression: { increment: 2.5 }, intensification: 'drop-set', muscles: { primary: ["Dos"], secondary: ["Biceps"] } },
            { id: 'landminepress', name: 'Landmine Press', sets: 4, reps: '10', rir: 2, startWeight: 35, progression: { increment: 2.5 }, muscles: { primary: ["Pectoraux", "Épaules"], secondary: ["Triceps"] } }
        ]},
        { id: 'rowmachine', name: 'Rowing Machine (large)', sets: 4, reps: '10', rir: 2, rest: 75, startWeight: 50, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Dos"], secondary: ["Biceps", "Épaules"] } },
        { type: 'superset', id: 'superset_bras_dim', rest: 75, exercises: [
            { id: 'biceps_dim', name: 'Spider Curl / Incline Curl', sets: 4, reps: '12', rir: 1, startWeight: 12, progression: { increment: 2.5 }, bicepsRotation: true, intensification: 'myo-reps', muscles: { primary: ["Biceps"], secondary: [] } },
            { id: 'pushdown', name: 'Cable Pushdown', sets: 3, reps: '12', rir: 1, startWeight: 20, progression: { increment: 2.5 }, muscles: { primary: ["Triceps"], secondary: [] } }
        ]},
      ]
    },
    mardi: {
      name: "Pecs + Épaules + Triceps",
      exercises: [
        { id: 'dbpress', name: 'Dumbbell Press', sets: 5, reps: '10', rir: 2, rest: 105, startWeight: 22, progression: { increment: 2.5 }, intensification: 'rest-pause', muscles: { primary: ["Pectoraux"], secondary: ["Épaules", "Triceps"] } },
        { id: 'cablefly', name: 'Cable Fly', sets: 4, reps: '12', rir: 1, rest: 60, startWeight: 10, progression: { increment: 2.5 }, intensification: 'drop-set', muscles: { primary: ["Pectoraux"], secondary: [] } },
        { id: 'legpresslight', name: 'Leg Press léger', sets: 3, reps: '15', rir: 2, rest: 60, startWeight: 80, progression: { increment: 10 }, muscles: { primary: ["Quadriceps", "Fessiers"], secondary: [] } },
        { type: 'superset', id: 'superset_tri_epaules', rest: 75, exercises: [
            { id: 'tricepsext', name: 'Extension Triceps Corde', sets: 5, reps: '12', rir: 1, startWeight: 20, progression: { increment: 2.5 }, intensification: 'drop-set', muscles: { primary: ["Triceps"], secondary: [] } },
            { id: 'latraises', name: 'Lateral Raises', sets: 5, reps: '15', rir: 1, startWeight: 8, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Épaules"], secondary: [] } }
        ]},
        { id: 'facepull', name: 'Face Pull', sets: 5, reps: '15', rir: 2, rest: 60, startWeight: 20, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Épaules", "Dos"], secondary: [] } },
        { id: 'rowmachineserre', name: 'Rowing Machine (serrée)', sets: 4, reps: '12', rir: 2, rest: 75, startWeight: 50, progression: { increment: 2.5 }, muscles: { primary: ["Dos"], secondary: ["Biceps"] } },
        { id: 'overheadext', name: 'Overhead Extension', sets: 4, reps: '12', rir: 1, rest: 60, startWeight: 15, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Triceps"], secondary: [] } },
      ]
    },
    vendredi: {
      name: "Dos + Jambes Légères + Bras + Épaules",
      exercises: [
        { id: 'landminerow', name: 'Landmine Row', sets: 5, reps: '10', rir: 2, rest: 105, startWeight: 55, progression: { increment: 2.5 }, intensification: 'rest-pause', muscles: { primary: ["Dos"], secondary: ["Biceps"] } },
        { type: 'superset', id: 'superset_jambes_ven', rest: 75, exercises: [
            { id: 'legcurl', name: 'Leg Curl', sets: 5, reps: '12', rir: 1, startWeight: 40, progression: { increment: 5 }, intensification: 'partials', muscles: { primary: ["Ischios"], secondary: [] } },
            { id: 'legext', name: 'Leg Extension', sets: 4, reps: '15', rir: 1, startWeight: 35, progression: { increment: 5 }, intensification: 'partials', muscles: { primary: ["Quadriceps"], secondary: [] } }
        ]},
        { type: 'superset', id: 'superset_pecs_ven', rest: 60, exercises: [
            { id: 'cablefly_ven', name: 'Cable Fly', sets: 4, reps: '15', rir: 1, startWeight: 10, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Pectoraux"], secondary: [] } },
            { id: 'dbfly', name: 'Dumbbell Fly', sets: 4, reps: '12', rir: 1, startWeight: 10, progression: { increment: 2.5 }, intensification: 'drop-set', muscles: { primary: ["Pectoraux"], secondary: [] } }
        ]},
        { type: 'superset', id: 'superset_bras_ven', rest: 75, exercises: [
            { id: 'ezcurl', name: 'EZ Bar Curl', sets: 5, reps: '12', rir: 1, startWeight: 25, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Biceps"], secondary: [] } },
            { id: 'overheadext_ven', name: 'Overhead Extension', sets: 3, reps: '12', rir: 1, startWeight: 15, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Triceps"], secondary: [] } }
        ]},
        { id: 'latraises_ven', name: 'Lateral Raises', sets: 3, reps: '15', rir: 1, rest: 60, startWeight: 8, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Épaules"], secondary: [] } },
        { id: 'wristcurl', name: 'Wrist Curl', sets: 3, reps: '20', rir: 0, rest: 45, startWeight: 30, progression: { increment: 2.5 }, muscles: { primary: ["Avant-bras"], secondary: [] } },
      ]
    },
  },
  homeWorkouts: {
    mardi: { id: 'hammer_home', name: 'Hammer Curl', sets: 3, reps: '12', rest: 60, startWeight: 12, progression: { increment: 2.5 }, muscles: { primary: ["Biceps", "Avant-bras"], secondary: [] } },
    jeudi: { id: 'hammer_home', name: 'Hammer Curl', sets: 3, reps: '12', rest: 60, startWeight: 12, progression: { increment: 2.5 }, muscles: { primary: ["Biceps", "Avant-bras"], secondary: [] } }
  },
  stats: {
    projections: [
        { id: 'tbdl', name: 'Trap Bar DL', start: 75, end: 120 },
        { id: 'dbpress', name: 'Dumbbell Press', start: 22, end: 45 },
        { id: 'legpress', name: 'Leg Press', start: 110, end: 240 },
        { id: 'rowmachine', name: 'Rowing Machine', start: 50, end: 82.5 },
        { id: 'ezcurl', name: 'EZ Bar Curl', start: 25, end: 47.5 },
    ],
    weeklyVolume: [ { muscle: "Quadriceps", series: 23, optimal: [18, 24] }, { muscle: "Ischios", series: 17, optimal: [14, 20] }, { muscle: "Fessiers", series: 19, optimal: [14, 20] }, { muscle: "Dos", series: 30, optimal: [18, 24] }, { muscle: "Pectoraux", series: 22, optimal: [16, 22] }, { muscle: "Épaules", series: 10, optimal: [6, 10] }, { muscle: "Biceps", series: 19, optimal: [14, 20] }, { muscle: "Triceps", series: 20, optimal: [12, 18] }, { muscle: "Avant-bras", series: 16, optimal: [6,12] } ]
  }
};

const DB_KEY = 'hybridMaster51_data_v4';

const useWorkoutHistory = () => {
    // FIX: Apply WorkoutHistory type to useState to ensure type safety on history object.
    const [history, setHistory] = useState<WorkoutHistory>(() => { try { const s = localStorage.getItem(DB_KEY); return s ? JSON.parse(s) : {}; } catch (e) { return {}; } });
    const saveWorkout = useCallback((w) => { const n = { ...history, [w.date]: w }; setHistory(n); localStorage.setItem(DB_KEY, JSON.stringify(n)); }, [history]);
    
    const getExercisePR = useCallback((exerciseId) => {
        let best = { weight: 0, reps: 0 };
        // FIX: Type workout as WorkoutSession to safely access 'exercises' property.
        Object.values(history).forEach((workout: WorkoutSession) => {
            if (!workout?.exercises) return;
            const processExo = (exo: ExerciseRecord) => {
                if (exo.id === exerciseId) {
                    (exo.sets || []).forEach((set) => {
                        const w = parseFloat(String(set.weight));
                        const r = parseInt(String(set.reps));
                        if (set.completed && w >= best.weight) {
                            if (w > best.weight) best = { weight: w, reps: r };
                            else if (r > best.reps) best.reps = r;
                        }
                    });
                }
            };
            workout.exercises.forEach((exo) => { (exo.type === 'superset' && exo.exercises ? exo.exercises : [exo]).forEach(processExo); });
        });
        return best;
    }, [history]);

    const getSuggestedWeight = useCallback((exercise) => {
        // FIX: Type history entries to safely access 'date' and 'exercises' properties.
        const historyEntries: WorkoutSession[] = Object.values(history).sort((a: WorkoutSession, b: WorkoutSession) => new Date(b.date).getTime() - new Date(a.date).getTime());
        for (const entry of historyEntries) {
            if (!entry?.exercises) continue;
            for (const performedExo of entry.exercises) {
                const checkExo = (exo: ExerciseRecord) => {
                    if (exo.id === exercise.id && exo.sets?.length > 0) {
                        const lastSet = exo.sets[exo.sets.length - 1];
                        if (lastSet?.completed) {
                            const targetReps = parseInt((exercise.reps || "0").split('-').pop() || "0");
                            if (parseInt(String(lastSet.reps)) >= targetReps && parseInt(String(lastSet.rir)) >= (exercise.rir || 1)) {
                                return parseFloat(String(lastSet.weight)) + (exercise.progression?.increment || 0);
                            }
                            return parseFloat(String(lastSet.weight));
                        }
                    } return null;
                };
                const subExos = (performedExo.type === 'superset' && performedExo.exercises) ? performedExo.exercises : [performedExo];
                for (const subExo of subExos) { const w = checkExo(subExo); if (w !== null) return w; }
            }
        }
        return exercise.startWeight;
    }, [history]);

    return { history, saveWorkout, getExercisePR, getSuggestedWeight };
};

// --- ICONS ---
const DumbbellIcon = () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, React.createElement("path", { d: "M21 8.5C21 7.12 19.88 6 18.5 6H17V5C17 4.45 16.55 4 16 4H8C7.45 4 7 4.45 7 5V6H5.5C4.12 6 3 7.12 3 8.5V15.5C3 16.88 4.12 18 5.5 18H7V19C7 19.55 7.45 20 8 20H16C16.55 20 17 19.55 17 19V18H18.5C19.88 18 21 16.88 21 15.5V8.5ZM5 16.5V8.5C5 8.22 5.22 8 5.5 8H6V16H5.5C5.22 16 5 16.28 5 16.5ZM19 15.5C19 16.28 18.78 16 18.5 16H18V8H18.5C18.78 8 19 8.22 19 8.5V15.5Z" }));
const ChartIcon = () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, React.createElement("path", { d: "M16 6H18V20H16V6ZM11 11H13V20H11V11ZM6 16H8V20H6V16ZM20 2H2V4H20V2Z" }));
const PlusIcon = () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", width: "24", height: "24" }, React.createElement("path", { d: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"}));


// --- REUSABLE COMPONENTS ---
const CalendarHeatmap = ({ history }) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 180);
    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    const workoutDates = Object.keys(history).map(dateStr => new Date(dateStr).toDateString());
    return React.createElement("div", { className: "heatmap-container" }, dates.map(date => React.createElement("div", { key: date.toISOString(), className: "heatmap-day", "data-level": workoutDates.includes(date.toDateString()) ? 2 : 0 })));
};

const MuscleGroupHeatmap = ({ workout }) => {
    if (!workout) return null;

    const workedMuscles = { primary: new Set(), secondary: new Set() };

    workout.exercises.forEach(exo => {
        const processExo = (subExo) => {
            if (subExo.muscles) {
                subExo.muscles.primary.forEach(m => workedMuscles.primary.add(m));
                subExo.muscles.secondary.forEach(m => workedMuscles.secondary.add(m));
            }
        };
        if (exo.type === 'superset') {
            exo.exercises.forEach(processExo);
        } else {
            processExo(exo);
        }
    });

    return React.createElement("div", { className: "muscle-heatmap" },
        muscleGroups.map(muscle => {
            const isPrimary = workedMuscles.primary.has(muscle);
            const isSecondary = workedMuscles.secondary.has(muscle) && !isPrimary;
            let status = 'inactive';
            if (isPrimary) status = 'primary';
            else if (isSecondary) status = 'secondary';
            
            return React.createElement("div", { key: muscle, className: `muscle-tag muscle-${status}` }, muscle);
        })
    );
};

const ProgressionChart = ({ exerciseId, exerciseName, history }) => {
    const dataPoints = useMemo(() => {
        const points = [];
        // FIX: Type w as WorkoutSession to safely access 'exercises' and 'date' properties.
        Object.values(history).forEach((w: WorkoutSession) => {
            if (!w?.exercises) return;
            let maxWeight = 0;
            w.exercises.forEach((exo) => (exo.type === 'superset' && exo.exercises ? exo.exercises : [exo]).forEach((subExo) => {
                if(subExo.id === exerciseId) (subExo.sets || []).forEach((set) => { if (set.completed) maxWeight = Math.max(maxWeight, parseFloat(String(set.weight))); });
            }));
            if (maxWeight > 0) points.push({ date: new Date(w.date), weight: maxWeight });
        });
        return points.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [history, exerciseId]);
    
    if (dataPoints.length < 2) {
        return React.createElement("div", { className: "progression-chart" }, 
            React.createElement("h4", { style: { marginBottom: 0 } }, exerciseName), 
            React.createElement("p", { className: "empty-stat-small" }, "Enregistrez au moins 2 séances pour voir la courbe.")
        );
    }

    const weights = dataPoints.map(p => p.weight), maxW = Math.max(...weights), minW = Math.min(...weights), firstD = dataPoints[0].date.getTime(), lastD = dataPoints[dataPoints.length - 1].date.getTime();
    const getCoords = (p) => ({ x: lastD === firstD ? 50 : ((p.date.getTime() - firstD) / (lastD - firstD)) * 100, y: maxW === minW ? 50 : 100 - ((p.weight - minW) / (maxW - minW)) * 90 - 5 });
    const path = dataPoints.map(getCoords).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return React.createElement("div", { className: "progression-chart" }, React.createElement("h4", null, exerciseName), React.createElement("svg", { viewBox: "0 0 100 100", preserveAspectRatio: "none", style: { width: '100%', height: '100px' } }, React.createElement("path", { d: path, fill: "none", stroke: "url(#line-gradient-chart)", strokeWidth: "2" }), React.createElement("defs", null, React.createElement("linearGradient", { id: "line-gradient-chart", x1: "0%", y1: "0%", x2: "100%", y2: "0%" }, React.createElement("stop", { offset: "0%", stopColor: "var(--color-primary)" }), React.createElement("stop", { offset: "100%", stopColor: "var(--color-primary-light)" })))));
};

const RestTimer = ({ duration, onFinish }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    useEffect(() => { if (timeLeft <= 0) { onFinish(); return; } const i = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000); return () => clearInterval(i); }, [timeLeft, onFinish]);
    return React.createElement("div", { className: "rest-timer-overlay" }, React.createElement("h3", null, "Repos"), React.createElement("div", { className: "rest-timer-circle" }, `${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}`), React.createElement("button", { className: "skip-timer-btn", onClick: onFinish }, "Passer"));
};

const IntensificationStep = ({ title, description, actionText, onAction, timer }) => {
    const [timeLeft, setTimeLeft] = useState(timer);
    useEffect(() => {
        if (!timer) return;
        const interval = setInterval(() => setTimeLeft(t => !t || t <= 1 ? 0 : t - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);
    return React.createElement("div", { className: "intensification-prompt" }, React.createElement("h4", null, title), description && React.createElement("p", null, description), timer && React.createElement("div", { className: "intensification-timer" }, "Repos: ", timeLeft, "s"), React.createElement("button", { className: "intensification-action", onClick: onAction, disabled: !!(timeLeft && timeLeft > 0) }, actionText));
};

const TechniqueHighlight = ({ exercise, block }) => {
    if (!block) return null;
    const getTechniqueForExo = (exo) => {
        if (!exo.intensification) return null;
        const techName = block.technique.name.toLowerCase();
        if (techName.includes(exo.intensification.replace('-', ''))) {
            return block.technique.name.split('&')[0].trim();
        }
        return null;
    };
    const techniques = [];
    if (exercise.type === 'superset') {
        exercise.exercises.forEach(exo => {
            const tech = getTechniqueForExo(exo);
            if (tech && !techniques.includes(tech)) {
                techniques.push(tech);
            }
        });
    } else {
        const tech = getTechniqueForExo(exercise);
        if (tech) {
            techniques.push(tech);
        }
    }
    if (techniques.length === 0) return null;
    return React.createElement("div", { className: "technique-highlight-box" }, React.createElement("strong", null, "🔥 Technique Spéciale: "), techniques.join(' / '));
};

const SetsTracker = ({ exercise, onSetComplete, onInputChange, onAddBonusSet, block, activeSetIndex }) => {
    const [intensificationState, setIntensificationState] = useState({ active: false, step: 0, type: null });

    const handleCheck = (set, setIndex, subExoIndex = -1) => {
        onSetComplete(!set.completed, setIndex, subExoIndex);
        const targetExo = subExoIndex > -1 ? exercise.exercises[subExoIndex] : exercise;
        if (!set.completed && !set.isBonus && setIndex === targetExo.sets.filter((s) => !s.isBonus).length - 1 && targetExo.intensification) {
            setIntensificationState({ active: true, type: targetExo.intensification, step: 1 });
        }
    };

    const renderIntensificationGuide = (exo, subExoIndex = -1) => {
        if (!intensificationState.active || intensificationState.type !== exo.intensification || !block) return null;
        const lastSet = [...exo.sets].filter((s) => !s.isBonus).pop(); if (!lastSet) return null;
        if (block.technique.name === 'Rest-Pause' && intensificationState.type === 'rest-pause') return React.createElement(IntensificationStep, { title: "🔥 Rest-Pause", description: null, actionText: "Ajouter la série bonus", onAction: () => { onAddBonusSet({ weight: lastSet.weight, reps: '', rir: 0 }, subExoIndex); setIntensificationState({ active: false, step: 0, type: null }); }, timer: 20 });
        if (block.technique.name.includes('Drop-Sets') && intensificationState.type === 'drop-set') return React.createElement(IntensificationStep, { title: "🔥 Drop-Set", description: "Baissez le poids de ~25%.", actionText: "Ajouter la série Drop", onAction: () => { onAddBonusSet({ weight: (parseFloat(String(lastSet.weight)) * 0.75).toFixed(1), reps: '', rir: 0 }, subExoIndex); setIntensificationState({ active: false, step: 0, type: null }); }, timer: null });
        return null;
    };
    
    if (exercise.type === 'superset') {
      const numSets = exercise.exercises[0].sets.filter(s => !s.isBonus).length;
      return React.createElement("div", { className: "sets-tracker" }, 
        Array.from({ length: numSets }).map((_, setIndex) => {
            const isCompleted = exercise.exercises.every(e => e.sets[setIndex]?.completed);
            const isActive = setIndex === activeSetIndex;
            const rowClasses = `superset-set-row ${isActive ? 'active' : ''}`;

            return React.createElement("div", { className: rowClasses, key: `superset-set-${setIndex}` },
                React.createElement("div", { className: "superset-set-header" },
                    React.createElement("div", { className: "superset-set-number" }, "Série ", setIndex + 1),
                    React.createElement("button", { 
                        "aria-label": `Valider série ${setIndex + 1} du superset`,
                        className: `set-check-btn ${isCompleted ? 'completed' : ''}`, 
                        onClick: () => {
                            const newCompletedStatus = !isCompleted;
                            exercise.exercises.forEach((_, subExoIndex) => {
                                onSetComplete(newCompletedStatus, setIndex, subExoIndex);
                            });
                        } 
                    }, "✓")
                ),
                React.createElement("div", { className: "superset-set-exercises" },
                    exercise.exercises.map((subExo, subExoIndex) => (
                        React.createElement("div", { className: "superset-set-exercise-card", key: `${subExo.id}-${setIndex}` },
                            React.createElement("div", { className: "superset-set-exercise-name" }, subExo.name),
                            React.createElement("div", { className: "superset-set-inputs" },
                                React.createElement("div", { className: "set-input" },
                                    React.createElement("label", null, "Poids"),
                                    React.createElement("input", { "aria-label": `Poids pour ${subExo.name} série ${setIndex + 1}`, type: "number", value: subExo.sets[setIndex]?.weight || '', onChange: (e) => onInputChange(e.target.value, 'weight', setIndex, subExoIndex) })
                                ),
                                React.createElement("div", { className: "set-input" },
                                    React.createElement("label", null, "Reps"),
                                    React.createElement("input", { "aria-label": `Reps pour ${subExo.name} série ${setIndex + 1}`, type: "number", value: subExo.sets[setIndex]?.reps || '', onChange: (e) => onInputChange(e.target.value, 'reps', setIndex, subExoIndex) })
                                ),
                                React.createElement("div", { className: "set-input" },
                                    React.createElement("label", null, "RIR"),
                                    React.createElement("input", { "aria-label": `RIR pour ${subExo.name} série ${setIndex + 1}`, type: "number", value: subExo.sets[setIndex]?.rir || '', onChange: (e) => onInputChange(e.target.value, 'rir', setIndex, subExoIndex) })
                                )
                            )
                        )
                    ))
                )
            );
        })
      );
    }

    return React.createElement("div", { className: "sets-tracker-container" }, 
        React.createElement("div", { className: "sets-tracker" }, exercise.sets.map((set, index) => {
            const isActive = index === activeSetIndex;
            const rowClasses = `set-row ${set.isBonus ? 'bonus-set' : ''} ${isActive ? 'active' : ''}`;
            
            return React.createElement("div", { className: rowClasses, key: set.id || index }, 
                React.createElement("div", { className: "set-number" }, set.isBonus ? '🔥' : index + 1), 
                React.createElement("div", { className: "set-input" }, 
                    React.createElement("label", null, "Poids"), 
                    React.createElement("input", { "aria-label": `Poids pour série ${index + 1}`, type: "number", value: set.weight, onChange: (e) => onInputChange(e.target.value, 'weight', index) })
                ), 
                React.createElement("div", { className: "set-input" }, 
                    React.createElement("label", null, "Reps"), 
                    React.createElement("input", { "aria-label": `Reps pour série ${index + 1}`, type: "number", value: set.reps, onChange: (e) => onInputChange(e.target.value, 'reps', index) })
                ), 
                React.createElement("div", { className: "set-input" }, 
                    React.createElement("label", null, "RIR"), 
                    React.createElement("input", { "aria-label": `RIR pour série ${index + 1}`, type: "number", value: set.rir, onChange: (e) => onInputChange(e.target.value, 'rir', index) })
                ), 
                React.createElement("button", { "aria-label": `Valider série ${index + 1}`, className: `set-check-btn ${set.completed ? 'completed' : ''}`, onClick: () => handleCheck(set, index) }, "✓")
            );
        })), 
        renderIntensificationGuide(exercise)
    );
};

const ActiveWorkoutView = ({ workout, meta, onEndWorkout, getSuggestedWeight }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [restTime, setRestTime] = useState(0);
    const [workoutState, setWorkoutState] = useState(() => 
        workout.exercises.map((exo) => {
            if (exo.type === 'superset') {
              const numSets = Math.max(...exo.exercises.map(e => e.sets));
              return { ...exo, exercises: exo.exercises.map(subExo => ({...subExo, sets: Array.from({length: numSets}, (_,i) => ({id: `${subExo.id}-${i}`, weight: getSuggestedWeight(subExo) || '', reps: (subExo.reps || "8").toString().split('-')[0], rir: subExo.rir || 1, completed: false})) })) };
            }
            return { ...exo, sets: Array.from({ length: exo.sets }, (_, i) => ({ id: i, weight: getSuggestedWeight(exo) || '', reps: (exo.reps || "8").toString().split('-')[0], rir: exo.rir || 1, completed: false })) };
        })
    );
    const currentExercise = workoutState[currentIndex];
    const currentBlock = useMemo(() => programData.blocks.find(b => b.weeks.includes(meta.week)), [meta.week]);

    const setsForActiveCheck = currentExercise.type === 'superset' ? currentExercise.exercises[0].sets : currentExercise.sets;
    const firstIncompleteSet = setsForActiveCheck.findIndex(s => !s.completed);
    const activeSetIndex = firstIncompleteSet === -1 ? setsForActiveCheck.length : firstIncompleteSet;

    const handleSetComplete = useCallback((isCompleted, setIndex, subExoIndex = -1) => {
        setWorkoutState(current => {
            const newState = JSON.parse(JSON.stringify(current));
            const exo = newState[currentIndex];
            const set = subExoIndex > -1 ? exo.exercises[subExoIndex].sets[setIndex] : exo.sets[setIndex];
            set.completed = isCompleted;

            if (isCompleted && exo.rest) {
                const isSuperset = exo.type === 'superset';
                if (isSuperset) {
                    if (exo.exercises.every(e => e.sets[setIndex]?.completed)) {
                        setRestTime(exo.rest);
                        setIsResting(true);
                    }
                } else {
                    setRestTime(exo.rest);
                    setIsResting(true);
                }
            }
            return newState;
        });
    }, [currentIndex]);


    const handleInputChange = (value, field, setIndex, subExoIndex = -1) => {
        const newWorkoutState = JSON.parse(JSON.stringify(workoutState));
        const set = (subExoIndex > -1 ? newWorkoutState[currentIndex].exercises[subExoIndex] : newWorkoutState[currentIndex]).sets[setIndex];
        set[field] = value;
        setWorkoutState(newWorkoutState);
    };

    const handleAddBonusSet = (newSet, subExoIndex = -1) => {
        const newWorkoutState = [...workoutState];
        const targetExo = subExoIndex > -1 ? newWorkoutState[currentIndex].exercises[subExoIndex] : newWorkoutState[currentIndex];
        targetExo.sets.push({ id: `bonus-${targetExo.id}-${targetExo.sets.length}`, weight: '', reps: '', rir: 0, ...newSet, completed: false, isBonus: true });
        setWorkoutState(newWorkoutState);
    };
    return React.createElement("div", { className: "main-content" }, 
        React.createElement("div", { className: "workout-header" }, React.createElement("span", { className: "workout-progress" }, currentIndex + 1, " / ", workoutState.length), React.createElement("button", { className: "end-workout-btn", onClick: () => onEndWorkout({ exercises: workoutState }) }, "Terminer")), 
        React.createElement("div", { className: "current-exercise-info" }, React.createElement("h2", null, currentExercise.name || (currentExercise.exercises || []).map(e => e.name).join(' + '))), 
        React.createElement(TechniqueHighlight, { exercise: currentExercise, block: currentBlock }), 
        React.createElement(SetsTracker, { exercise: currentExercise, onSetComplete: handleSetComplete, onInputChange: handleInputChange, onAddBonusSet: handleAddBonusSet, block: currentBlock, activeSetIndex: activeSetIndex }), 
        React.createElement("div", { className: "workout-navigation" }, React.createElement("button", { onClick: () => setCurrentIndex(i => i - 1), disabled: currentIndex === 0 }, "Précédent"), React.createElement("button", { onClick: () => setCurrentIndex(i => i + 1), disabled: currentIndex === workoutState.length - 1 }, "Suivant")), 
        isResting && React.createElement(RestTimer, { duration: restTime, onFinish: () => setIsResting(false) })
    );
};

// --- VIEW COMPONENTS ---
const ProjectionsView = ({ getExercisePR, hasHistory }) => {
    if (!hasHistory) {
        return React.createElement("div", { className: "empty-stat" }, "Commencez à vous entraîner pour suivre vos projections.");
    }
    return (
        React.createElement("div", { className: "stats-container" },
            programData.stats.projections.map(proj => {
                const currentPR = getExercisePR(proj.id).weight;
                const progress = Math.min(100, Math.max(0, ((currentPR - proj.start) / (proj.end - proj.start)) * 100));
                return (
                    React.createElement("div", { className: "projection-item", key: proj.id },
                        React.createElement("div", { className: "stat-item-header" }, React.createElement("span", null, proj.name), React.createElement("span", null, currentPR || "...", "kg / ", proj.end, "kg")),
                        React.createElement("div", { className: "projection-bar-bg" }, React.createElement("div", { className: "projection-bar-fg", style: { width: `${progress}%` } }))
                    )
                );
            })
        )
    );
};

const WeeklyVolumeView = () => {
    const statsData = programData.stats.weeklyVolume;
    const maxSeries = Math.max(...statsData.map(s => s.series), ...statsData.map(s => s.optimal[1]));
    return (
        React.createElement("div", { className: "stats-container" },
            statsData.map(stat => (
                React.createElement("div", { key: stat.muscle },
                    React.createElement("div", { className: "stat-item-header" }, React.createElement("span", null, stat.muscle), React.createElement("span", null, stat.series, " séries")),
                    React.createElement("div", { className: "stat-bar-container" },
                        React.createElement("div", { className: "stat-optimal-range", style: { left: `${(stat.optimal[0]/maxSeries)*100}%`, width: `${((stat.optimal[1]-stat.optimal[0])/maxSeries)*100}%` } }),
                        React.createElement("div", { className: "stat-bar", style: { width: `${(stat.series/maxSeries)*100}%` } })
                    )
                )
            ))
        )
    );
};

const StatisticsView = ({ getExercisePR, history }) => {
    const hasHistory = Object.keys(history).length > 0;
    return (
      React.createElement("div", { className: "main-content" },
        React.createElement("h2", { className: "stats-header" }, "Tableau de Bord"),
        
        React.createElement("div", { className: "stats-section" }, 
            React.createElement("h3", null, "🗓️ Calendrier d'Activité"), 
            hasHistory ? React.createElement(CalendarHeatmap, { history: history }) : React.createElement("div", {className: "empty-stat"}, "Vos jours d'entraînement apparaîtront ici.")
        ),
        
        React.createElement("div", { className: "stats-section" }, 
            React.createElement("h3", null, "🎯 Objectifs & Projections"), 
            React.createElement(ProjectionsView, { getExercisePR: getExercisePR, hasHistory: hasHistory })
        ),
        
        React.createElement("div", { className: "stats-section" }, 
            React.createElement("h3", null, "📈 Progression des Charges"), 
            hasHistory ? 
                programData.stats.projections.map(exo => React.createElement(ProgressionChart, { key: exo.id, exerciseId: exo.id, exerciseName: exo.name, history: history }))
                : React.createElement("div", {className: "empty-stat"}, "Vos courbes de progression s'afficheront ici.")
        ),

        React.createElement("div", { className: "stats-section" }, 
            React.createElement("h3", null, "📊 Volume Hebdomadaire"), 
            React.createElement(WeeklyVolumeView, null)
        )
      )
    );
};

const ExerciseCard = ({ exercise }) => {
    if (exercise.type === 'superset') {
        return React.createElement("div", { className: "superset-card" },
            React.createElement("div", { className: "superset-badge" }, "SUPERSET"),
            React.createElement("div", { className: "superset-exercises" },
                React.createElement("div", { className: "superset-exercise-item" },
                    React.createElement("h4", null, exercise.exercises[0].name),
                    React.createElement("div", { className: "sets-reps" }, exercise.exercises[0].sets, " × ", exercise.exercises[0].reps)
                ),
                React.createElement("div", { className: "superset-plus-icon" }, React.createElement(PlusIcon, null)),
                React.createElement("div", { className: "superset-exercise-item" },
                    React.createElement("h4", null, exercise.exercises[1].name),
                    React.createElement("div", { className: "sets-reps" }, exercise.exercises[1].sets, " × ", exercise.exercises[1].reps)
                )
            ),
            React.createElement("div", { className: "exercise-details" }, "Repos: ", exercise.rest, "s après le duo")
        );
    }
    return React.createElement("div", { className: "exercise-card" }, React.createElement("div", { className: "exercise-header" }, React.createElement("h4", null, exercise.name), React.createElement("div", { className: "sets-reps" }, exercise.sets, " × ", exercise.reps)), React.createElement("div", { className: "exercise-details" }, React.createElement("span", null, "RIR ", exercise.rir, " | Repos: ", exercise.rest, "s")));
};

const WorkoutPlannerView = ({ onStartWorkout }) => {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [activeDay, setActiveDay] = useState(() => { const dayIndex = new Date().getDay(); const dayMap = {0: 'dimanche', 2: 'mardi', 4: 'jeudi', 5: 'vendredi'}; return dayMap[dayIndex] || 'dimanche'; });

  const { currentBlock, isDeload } = useMemo(() => {
    if (programData.deloadWeeks.includes(currentWeek)) return { isDeload: true, currentBlock: { name: `SEMAINE ${currentWeek}: DELOAD`, technique: { name: "Récupération", desc: "Charges réduites, RPE 5-6." } } };
    const block = programData.blocks.find(b => b.weeks.includes(currentWeek)) || { name: "Phase Initiale", technique: { name: "Technique", desc: "Concentration sur la forme." } };
    return { isDeload: false, currentBlock: block };
  }, [currentWeek]);
  
  const gymWorkout = useMemo(() => {
    const originalWorkout = programData.workouts[activeDay];
    if (!originalWorkout) return null;
    let workout = JSON.parse(JSON.stringify(originalWorkout));
    const getBicepsName = (w) => { const b = programData.blocks.find(bl => bl.weeks.includes(w))?.id; return (b === 1 || b === 3) ? 'Incline Curl' : 'Spider Curl'; };
    workout.exercises.forEach((exo) => ((exo.type === 'superset' && exo.exercises) ? exo.exercises : [exo]).forEach((subExo) => { if (subExo.bicepsRotation) subExo.name = getBicepsName(currentWeek); }));
    return workout;
  }, [activeDay, currentWeek]);

  const homeWorkout = programData.homeWorkouts[activeDay];

  return (
    React.createElement("div", { className: "main-content" },
      React.createElement("header", { className: "header" }, React.createElement("h1", null, "Programme d'Entraînement")),
      React.createElement("div", { className: "week-navigator" }, React.createElement("button", { onClick: () => setCurrentWeek(w => Math.max(1, w - 1)), disabled: currentWeek === 1 }, "<"), React.createElement("div", { className: "week-display" }, "Semaine ", currentWeek), React.createElement("button", { onClick: () => setCurrentWeek(w => Math.min(26, w + 1)), disabled: currentWeek === 26 }, ">")),
      React.createElement("div", { className: "block-info" }, React.createElement("h3", null, currentBlock.name), React.createElement("p", null, React.createElement("strong", null, "Technique :"), " ", currentBlock.technique.desc)),
      React.createElement("div", { className: "tabs" }, ['dimanche', 'mardi', 'jeudi', 'vendredi'].map(day => React.createElement("button", { key: day, className: `tab ${activeDay === day ? 'active' : ''}`, onClick: () => setActiveDay(day) }, day.charAt(0).toUpperCase() + day.slice(1)))),
      React.createElement(MuscleGroupHeatmap, { workout: gymWorkout || (homeWorkout ? { exercises: [homeWorkout] } : null) }),
      React.createElement("div", { className: "workout-overview" },
        gymWorkout && React.createElement(React.Fragment, null, 
          React.createElement("button", { className: "start-session-btn", onClick: () => onStartWorkout(gymWorkout, currentWeek, activeDay), disabled: isDeload }, isDeload ? 'Jour de repos / Deload' : `Commencer - ${gymWorkout.name}`),
          gymWorkout.exercises.map((exo, index) => React.createElement(ExerciseCard, { key: exo.id || `superset-${index}`, exercise: exo }))
        ),
        homeWorkout && React.createElement("div", { className: "home-workout-card" }, React.createElement("div", null, React.createElement("h4", null, "🏠 Séance à la Maison"), React.createElement("p", null, homeWorkout.name, " - ", homeWorkout.sets, " × ", homeWorkout.reps)), React.createElement("button", { className: "start-home-btn", onClick: () => onStartWorkout({ name: "Séance Maison", exercises: [homeWorkout] }, currentWeek, activeDay, true) }, "Démarrer")),
        !gymWorkout && activeDay === 'jeudi' && React.createElement("p",{style:{textAlign:'center', marginTop:'2rem'}},"Séance à la maison uniquement aujourd'hui."),
        !gymWorkout && !homeWorkout && !programData.homeWorkouts[activeDay] && React.createElement("p", { style: { textAlign: 'center', marginTop: '2rem' } }, "Jour de repos.")
      )
    )
  );
};

const BottomNav = ({ currentView, setView }) => (
    React.createElement("nav", { className: "bottom-nav" }, React.createElement("button", { className: `nav-item ${currentView === 'stats' ? 'active' : ''}`, onClick: () => setView('stats') }, React.createElement(ChartIcon, null), React.createElement("span", null, "Stats")), React.createElement("button", { className: `nav-item ${currentView === 'program' ? 'active' : ''}`, onClick: () => setView('program') }, React.createElement(DumbbellIcon, null), React.createElement("span", null, "Programme")))
);

// --- MAIN APP COMPONENT ---
const App = () => {
  const [currentView, setCurrentView] = useState('stats');
  const [activeWorkout, setActiveWorkout] = useState(null);
  const { history, saveWorkout, getExercisePR, getSuggestedWeight } = useWorkoutHistory();
  
  const handleStartWorkout = (workout, week, day, isHomeWorkout = false) => { setActiveWorkout({ workout, meta: { week, day, isHomeWorkout }, startTime: Date.now() }); };
  const handleEndWorkout = (completedWorkout) => {
    if (completedWorkout) {
        saveWorkout({ 
            date: new Date().toISOString(), 
            ...activeWorkout.meta, 
            exercises: completedWorkout.exercises 
        });
    }
    setActiveWorkout(null);
  };

  const renderContent = () => {
    if (activeWorkout) {
        return React.createElement(ActiveWorkoutView, { key: activeWorkout.startTime, workout: activeWorkout.workout, meta: activeWorkout.meta, onEndWorkout: handleEndWorkout, getSuggestedWeight: getSuggestedWeight });
    }
    switch (currentView) {
      case 'program':
        return React.createElement(WorkoutPlannerView, { onStartWorkout: handleStartWorkout });
      case 'stats':
        return React.createElement(StatisticsView, { getExercisePR: getExercisePR, history: history });
      default:
        return React.createElement(StatisticsView, { getExercisePR: getExercisePR, history: history });
    }
  };

  return (
    React.createElement("div", { className: "app-container" },
      renderContent(),
      !activeWorkout && React.createElement(BottomNav, { currentView: currentView, setView: setCurrentView })
    )
  );
};

// --- RENDER APP ---
const container = document.getElementById('root');
if(container) { createRoot(container).render(React.createElement(App, null)); }
