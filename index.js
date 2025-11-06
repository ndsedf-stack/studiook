import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// --- DATA STRUCTURE & DATABASE ---
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
    const [history, setHistory] = useState(() => { try { const s = localStorage.getItem(DB_KEY); return s ? JSON.parse(s) : {}; } catch (e) { return {}; } });
    const saveWorkout = useCallback((w) => { const n = { ...history, [w.date]: w }; setHistory(n); localStorage.setItem(DB_KEY, JSON.stringify(n)); }, [history]);
    
    const getExercisePR = useCallback((exerciseId) => {
        let best = { weight: 0, reps: 0 };
        Object.values(history).forEach((workout) => {
            if (!workout?.exercises) return;
            const processExo = (exo) => {
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
        const historyEntries = Object.values(history).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        for (const entry of historyEntries) {
            if (!entry?.exercises) continue;
            for (const performedExo of entry.exercises) {
                const checkExo = (exo) => {
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
        Object.values(history).forEach((w) => {
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

const RestTimer = ({ duration, onFinish, message = "Repos" }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    useEffect(() => { if (timeLeft <= 0) { onFinish(); return; } const i = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000); return () => clearInterval(i); }, [timeLeft, onFinish]);
    return React.createElement("div", { className: "rest-timer-overlay" }, React.createElement("h3", null, message), React.createElement("div", { className: "rest-timer-circle" }, `${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}`), React.createElement("button", { className: "skip-timer-btn", onClick: onFinish }, "Passer"));
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

const SetsTracker = ({ exercise, onSetComplete, onInputChange, onAddBonusSet, block }) => {
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
        if (block.technique.name === 'Rest-Pause' && intensificationState.type === 'rest-pause') return React.createElement(IntensificationStep, { title: "🔥 Rest-Pause", actionText: "Ajouter la série bonus", onAction: () => { onAddBonusSet({ weight: lastSet.weight, reps: '', rir: 0 }, subExoIndex); setIntensificationState({ active: false, step: 0, type: null }); }, timer: 20 });
        if (block.technique.name.includes('Drop-Sets') && intensificationState.type === 'drop-set') return React.createElement(IntensificationStep, { title: "🔥 Drop-Set", description: "Baissez le poids de ~25%.", actionText: "Ajouter la série Drop", onAction: () => { onAddBonusSet({ weight: (parseFloat(String(lastSet.weight)) * 0.75).toFixed(1), reps: '', rir: 0 }, subExoIndex); setIntensificationState({ active: false, step: 0, type: null }); } });
        return null;
    };
    
    if (exercise.type === 'superset') {
      const numSets = exercise.exercises[0].sets.filter(s => !s.isBonus).length;
      return React.createElement("div", { className: "sets-tracker" }, 
        Array.from({ length: numSets }).map((_, setIndex) => {
            const allCompleted = exercise.exercises.every(subExo => subExo.sets[setIndex]?.completed);
            return React.createElement("div", { className: "superset-set-row", key: `superset-set-${setIndex}` },
                React.createElement("div", {className: "set-number"}, setIndex + 1),
                React.createElement("div", { className: "superset-set-exercises" },
                    exercise.exercises.map((subExo, subExoIndex) => (
                        React.createElement("div", { className: "superset-set-exercise-card", key: subExo.id },
                            React.createElement("div", { className: "superset-set-exercise-name" }, subExo.name),
                            React.createElement("div", { className: "superset-set-inputs" },
                                React.createElement("div", { className: "set-input" },
                                    React.createElement("label", null, "Poids"),
                                    React.createElement("input", { type: "number", value: subExo.sets[setIndex]?.weight || '', onChange: (e) => onInputChange(e.target.value, 'weight', setIndex, subExoIndex) })
                                ),
                                React.createElement("div", { className: "set-input" },
                                    React.createElement("label", null, "Reps"),
                                    React.createElement("input", { type: "number", value: subExo.sets[setIndex]?.reps || '', onChange: (e) => onInputChange(e.target.value, 'reps', setIndex, subExoIndex) })
                                ),
                                React.createElement("div", { className: "set-input" },
                                    React.createElement("label", null, "RIR"),
                                    React.createElement("input", { type: "number", value: subExo.sets[setIndex]?.rir ||
