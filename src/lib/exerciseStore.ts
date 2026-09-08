import { ExerciseItem } from '../types';
import { EXERCISE_LIBRARY } from './plannerLibrary';

const MASTER_EXERCISES_KEY = 'fitkode_master_exercise_library_v2';

function getUserStorageKey(userEmail?: string): string {
  const normalized = (userEmail || 'guest_user').toLowerCase().trim();
  return `fitkode_user_custom_exercises_${normalized}`;
}

/**
 * Event notification for reactive UI updates
 */
function notifyExerciseStoreChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fk_exercise_store_updated'));
  }
}

export function subscribeToExerciseStoreUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener('fk_exercise_store_updated', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('fk_exercise_store_updated', handler);
    window.removeEventListener('storage', handler);
  };
}

/**
 * Loads the Master Exercise Database.
 * Holds all standard Fitkode movements and Coach-curated exercises.
 */
export function loadMasterExercises(): ExerciseItem[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(MASTER_EXERCISES_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => ({
          ...item,
          isCustom: false,
          createdBy: 'coach',
        }));
      }
    }

    // First time initialization: seed from EXERCISE_LIBRARY
    const baseExercises: ExerciseItem[] = EXERCISE_LIBRARY.map((item, idx) => ({
      id: `master_builtin_${idx + 1}`,
      name: item.name,
      targetMuscle: item.targetMuscle,
      sets: item.sets,
      reps: item.reps,
      restSeconds: item.restSeconds,
      notes: item.notes,
      videoUrl: item.videoUrl,
      isCustom: false,
      createdBy: 'coach',
    }));

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MASTER_EXERCISES_KEY, JSON.stringify(baseExercises));
    }
    return baseExercises;
  } catch (err) {
    console.error('Error loading master exercises from storage:', err);
    return EXERCISE_LIBRARY.map((item, idx) => ({
      id: `master_builtin_${idx + 1}`,
      name: item.name,
      targetMuscle: item.targetMuscle,
      sets: item.sets,
      reps: item.reps,
      restSeconds: item.restSeconds,
      notes: item.notes,
      videoUrl: item.videoUrl,
      isCustom: false,
      createdBy: 'coach',
    }));
  }
}

/**
 * Find an exercise in the Master Database by name or ID (case-insensitive).
 */
export function findMasterExercise(nameOrId: string): ExerciseItem | undefined {
  if (!nameOrId) return undefined;
  const current = loadMasterExercises();
  const search = nameOrId.toLowerCase().trim();
  return current.find(
    (item) => item.id === nameOrId || item.name.toLowerCase().trim() === search
  );
}

/**
 * Super Admin updates or replaces the YouTube video reference URL of an exercise in the Master Database.
 * Matches by exercise name or exercise ID.
 * If videoUrl is undefined or empty, it removes/clears the video URL from the Master Database.
 */
export function updateMasterExerciseVideoUrl(
  exerciseNameOrId: string,
  videoUrl?: string
): { success: boolean; exercise?: ExerciseItem } {
  try {
    const current = loadMasterExercises();
    const search = exerciseNameOrId.toLowerCase().trim();
    const idx = current.findIndex(
      (item) => item.id === exerciseNameOrId || item.name.toLowerCase().trim() === search
    );

    const cleanUrl = videoUrl && videoUrl.trim().length > 0 ? videoUrl.trim() : undefined;

    if (idx >= 0) {
      const updated = [...current];
      updated[idx] = {
        ...updated[idx],
        videoUrl: cleanUrl,
        isCustom: false,
        createdBy: 'coach',
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(MASTER_EXERCISES_KEY, JSON.stringify(updated));
      }
      notifyExerciseStoreChange();
      return { success: true, exercise: updated[idx] };
    }

    // If exercise was not in master library yet, but super admin wants to register it into Master Database:
    const newMasterEx: ExerciseItem = {
      id: `master_coach_ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: exerciseNameOrId.trim(),
      targetMuscle: 'General',
      sets: 3,
      reps: '10-12',
      restSeconds: 90,
      notes: 'Added from coaching workout plan',
      videoUrl: cleanUrl,
      isCustom: false,
      createdBy: 'coach',
    };
    const updated = [newMasterEx, ...current];
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MASTER_EXERCISES_KEY, JSON.stringify(updated));
    }
    notifyExerciseStoreChange();
    return { success: true, exercise: newMasterEx };
  } catch (err) {
    console.error('Error updating master exercise video URL:', err);
    return { success: false };
  }
}

/**
 * Super Admin deletes/removes the YouTube video reference URL from an exercise in the Master Database.
 */
export function deleteMasterExerciseVideoUrl(exerciseNameOrId: string): boolean {
  return updateMasterExerciseVideoUrl(exerciseNameOrId, undefined).success;
}

/**
 * Coach / Admin adds a new exercise to the Master Database.
 * This is saved globally and becomes instantly searchable for everyone in the Fitkode Exercise Library.
 */
export function saveMasterExercise(
  exercise: Omit<ExerciseItem, 'id'> & { id?: string }
): ExerciseItem[] {
  try {
    const current = loadMasterExercises();
    const newEx: ExerciseItem = {
      ...exercise,
      id: exercise.id || `master_coach_ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isCustom: false,
      createdBy: 'coach',
    };

    const existingIdx = current.findIndex(
      (item) => item.id === newEx.id || item.name.toLowerCase().trim() === newEx.name.toLowerCase().trim()
    );

    let updated: ExerciseItem[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = newEx;
    } else {
      updated = [newEx, ...current];
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MASTER_EXERCISES_KEY, JSON.stringify(updated));
    }
    notifyExerciseStoreChange();
    return updated;
  } catch (err) {
    console.error('Error saving master exercise:', err);
    return loadMasterExercises();
  }
}

/**
 * Delete an exercise from the Master Database (Coach / Admin only).
 */
export function deleteMasterExercise(exerciseId: string): ExerciseItem[] {
  try {
    const current = loadMasterExercises();
    const updated = current.filter((item) => item.id !== exerciseId);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MASTER_EXERCISES_KEY, JSON.stringify(updated));
    }
    notifyExerciseStoreChange();
    return updated;
  } catch (err) {
    console.error('Error deleting master exercise:', err);
    return loadMasterExercises();
  }
}

/**
 * Loads User-Specific Custom Exercises.
 * These are private to the member and NEVER appear in the master database.
 */
export function loadUserCustomExercises(userEmail?: string): ExerciseItem[] {
  try {
    const key = getUserStorageKey(userEmail);
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ...item,
        isCustom: true,
        createdBy: 'user',
      }));
    }
    return [];
  } catch (err) {
    console.error('Error loading user custom exercises:', err);
    return [];
  }
}

/**
 * Regular member adds a custom exercise.
 * Stored strictly at the user profile level (keyed by user email).
 */
export function saveUserCustomExercise(
  userEmail: string,
  exercise: Omit<ExerciseItem, 'id'> & { id?: string }
): ExerciseItem[] {
  try {
    const current = loadUserCustomExercises(userEmail);
    const customEx: ExerciseItem = {
      ...exercise,
      id: exercise.id || `custom_ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isCustom: true,
      createdBy: 'user',
    };

    const existingIdx = current.findIndex((item) => item.id === customEx.id);
    let updated: ExerciseItem[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = customEx;
    } else {
      updated = [customEx, ...current];
    }

    const key = getUserStorageKey(userEmail);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(updated));
    }
    notifyExerciseStoreChange();
    return updated;
  } catch (err) {
    console.error('Error saving user custom exercise:', err);
    return loadUserCustomExercises(userEmail);
  }
}

/**
 * Delete a user's custom exercise.
 */
export function deleteUserCustomExercise(userEmail: string, exerciseId: string): ExerciseItem[] {
  try {
    const current = loadUserCustomExercises(userEmail);
    const updated = current.filter((item) => item.id !== exerciseId);
    const key = getUserStorageKey(userEmail);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(updated));
    }
    notifyExerciseStoreChange();
    return updated;
  } catch (err) {
    console.error('Error deleting user custom exercise:', err);
    return loadUserCustomExercises(userEmail);
  }
}

/**
 * Returns all exercises available for a specific user:
 * Master Library + User's own custom exercises.
 */
export function getAllExercisesForUser(userEmail?: string): {
  all: ExerciseItem[];
  master: ExerciseItem[];
  custom: ExerciseItem[];
} {
  const master = loadMasterExercises();
  const custom = loadUserCustomExercises(userEmail);
  return {
    all: [...custom, ...master],
    master,
    custom,
  };
}
