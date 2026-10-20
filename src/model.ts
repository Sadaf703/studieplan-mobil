export type ThemeName = 'pink' | 'purple' | 'dark';
export type CatName = 'cream' | 'ginger' | 'tuxedo' | 'siamese';
export type Mode = 'focus' | 'break';
export type Task = { id: string; title: string; subject: string; due: string; done: boolean };
export type Timer = { mode: Mode; remaining: number; endsAt: number | null };
export type State = { tasks: Task[]; earned: string[]; theme: ThemeName; cat: CatName; bow: boolean; timer: Timer };
export const cats: { id: CatName; name: string; need: number }[] = [
  { id: 'cream', name: 'Mochi', need: 0 }, { id: 'ginger', name: 'Mango', need: 1 },
  { id: 'tuxedo', name: 'Oreo', need: 3 }, { id: 'siamese', name: 'Luna', need: 5 },
];
export const duration = (mode: Mode) => mode === 'focus' ? 1500 : 300;
export const initialState: State = { tasks: [], earned: [], theme: 'pink', cat: 'cream', bow: false, timer: { mode: 'focus', remaining: 1500, endsAt: null } };
export function remaining(timer: Timer, now: number) { return timer.endsAt === null ? timer.remaining : Math.max(0, Math.ceil((timer.endsAt - now) / 1000)); }
export function finishTimer(state: State, now: number): State {
  if (state.timer.endsAt === null || remaining(state.timer, now) > 0) return state;
  const mode = state.timer.mode === 'focus' ? 'break' : 'focus';
  return { ...state, timer: { mode, remaining: duration(mode), endsAt: null } };
}
export type Action =
  | { type: 'hydrate'; state: State } | { type: 'add'; task: Task }
  | { type: 'toggle'; id: string } | { type: 'delete'; id: string }
  | { type: 'theme'; theme: ThemeName } | { type: 'cat'; cat: CatName }
  | { type: 'bow' } | { type: 'timer-toggle'; now: number }
  | { type: 'timer-mode'; mode: Mode } | { type: 'timer-finish'; now: number };
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate': return action.state;
    case 'add': return { ...state, tasks: [...state.tasks, action.task] };
    case 'toggle': {
      const task = state.tasks.find(t => t.id === action.id);
      if (!task) return state;
      const earned = !task.done && !state.earned.includes(task.id) ? [...state.earned, task.id] : state.earned;
      return { ...state, earned, tasks: state.tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t) };
    }
    case 'delete': return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) };
    case 'theme': return { ...state, theme: action.theme };
    case 'cat': return cats.some(c => c.id === action.cat && state.earned.length >= c.need) ? { ...state, cat: action.cat } : state;
    case 'bow': return state.earned.length >= 8 ? { ...state, bow: !state.bow } : state;
    case 'timer-mode': return { ...state, timer: { mode: action.mode, remaining: duration(action.mode), endsAt: null } };
    case 'timer-finish': return finishTimer(state, action.now);
    case 'timer-toggle': {
      const updated = finishTimer(state, action.now);
      if (updated !== state) return updated;
      const timer = state.timer;
      return { ...state, timer: timer.endsAt !== null
        ? { ...timer, remaining: remaining(timer, action.now), endsAt: null }
        : { ...timer, endsAt: action.now + timer.remaining * 1000 } };
    }
  }
}
export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00');
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}
export function parseState(raw: string): State {
  const value = JSON.parse(raw);
  if (!value || !Array.isArray(value.tasks) || !Array.isArray(value.earned) || !value.timer) throw Error('Ukjent lagringsformat');
  if (!value.tasks.every((t: Task) => t && typeof t.id === 'string' && typeof t.title === 'string' && typeof t.subject === 'string' && validDate(t.due) && typeof t.done === 'boolean')) throw Error('Ugyldige oppgaver');
  if (new Set(value.tasks.map((t: Task) => t.id)).size !== value.tasks.length || !value.earned.every((id: unknown) => typeof id === 'string')) throw Error('Ugyldige ID-er');
  if (!['pink', 'purple', 'dark'].includes(value.theme) || !['focus', 'break'].includes(value.timer.mode)) throw Error('Ukjent tema eller økt');
  const timer = value.timer;
  if (!Number.isFinite(timer.remaining) || timer.remaining < 0 || timer.remaining > duration(timer.mode) || !(timer.endsAt === null || (Number.isFinite(timer.endsAt) && timer.endsAt > 0))) throw Error('Ugyldig timer');
  const earned: string[] = [...new Set<string>([...value.earned, ...value.tasks.filter((t: Task) => t.done).map((t: Task) => t.id)])];
  const cat = cats.find(c => c.id === value.cat && earned.length >= c.need)?.id ?? 'cream';
  return { tasks: value.tasks, earned, theme: value.theme, cat, bow: value.bow === true && earned.length >= 8, timer };
}
