import React, { useEffect, useReducer, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Alert, AppState, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { cats, duration, initialState, localDate, parseState, reducer, remaining, type Task, type ThemeName } from './model';
import { themes } from './themes';
import { PixelCat } from './PixelCat';
import WebDateInput from './WebDateInput';
function ActionButton({ label, onPress, options = {}, palette, reduced }: {
  label: string; onPress: () => void; options?: { selected?: boolean; primary?: boolean; disabled?: boolean };
  palette: typeof themes.pink; reduced: boolean;
}) {
  const filled = options.primary || options.selected;
  return <Pressable onPress={onPress} disabled={options.disabled} accessibilityRole="button" accessibilityState={{ selected: options.selected, disabled: options.disabled }}
    style={({ pressed }) => [s.button, { backgroundColor: filled ? palette.accent : palette.tint, borderColor: palette.border, opacity: options.disabled ? .5 : pressed ? .75 : 1, transform: [{ scale: pressed && !reduced ? .97 : 1 }] }]}>
    <Text style={{ color: filled ? palette.buttonText : palette.text, fontWeight: '700', textAlign: 'center', fontSize: 13 }}>{label}</Text>
  </Pressable>;
}

const KEY = 'studieplan.mobile.v1';
type Tab = 'tasks' | 'focus' | 'cats';
type Filter = 'all' | 'active' | 'done';
export default function App() { return <SafeAreaProvider><StudiePlan /></SafeAreaProvider>; }
function StudiePlan() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [ready, setReady] = useState(false), [loadError, setLoadError] = useState(false);
    const [message, setMessage] = useState(''), [tab, setTab] = useState<Tab>('tasks');
    const [filter, setFilter] = useState<Filter>('all'), [showForm, setShowForm] = useState(false);
    const [showDate, setShowDate] = useState(false), [title, setTitle] = useState('');
    const [subject, setSubject] = useState(''), [due, setDue] = useState(() => new Date());
    const [now, setNow] = useState(() => Date.now()), [party, setParty] = useState(0);
    const [reduced, setReduced] = useState(false);
    const saveQueue = useRef(Promise.resolve());
    const datePickerOpen = useRef(false);
    const p = themes[state.theme];
    const done = state.tasks.filter(t => t.done).length;
    const pct = state.tasks.length ? Math.round(done / state.tasks.length * 100) : 0;
    const secs = remaining(state.timer, now), chosen = cats.find(c => c.id === state.cat)!;
    async function load() {
        try {
            const raw = await AsyncStorage.getItem(KEY);
            if (raw)
                dispatch({ type: 'hydrate', state: parseState(raw) });
            setLoadError(false);
            setReady(true);
        }
        catch {
            setLoadError(true);
        }
    }
    useEffect(() => {
        let active = true;
        AsyncStorage.getItem(KEY).then(raw => {
            if (!active)
                return;
            if (raw)
                dispatch({ type: 'hydrate', state: parseState(raw) });
            setLoadError(false);
            setReady(true);
        }).catch(() => { if (active)
            setLoadError(true); });
        return () => { active = false; };
    }, []);
    useEffect(() => {
        if (!ready)
            return;
        // Serialize saves so an old, slow write cannot overwrite newer app state.
        saveQueue.current = saveQueue.current.then(() => AsyncStorage.setItem(KEY, JSON.stringify(state))).catch(() => setMessage('Kunne ikke lagre på telefonen. Sjekk ledig lagringsplass.'));
    }, [state, ready]);
    useEffect(() => {
        const tick = () => {
            const timestamp = Date.now();
            setNow(timestamp);
            if (ready && state.timer.endsAt !== null && remaining(state.timer, timestamp) === 0) {
                setMessage(state.timer.mode === 'focus' ? 'Ferdig! Ta en fem minutters pause ♡' : 'Pausen er ferdig. Klar for en ny fokusøkt?');
                dispatch({ type: 'timer-finish', now: timestamp });
            }
        };
        const timer = setInterval(tick, 500);
        const sub = AppState.addEventListener('change', status => { if (status === 'active')
            tick(); });
        return () => { clearInterval(timer); sub.remove(); };
    }, [ready, state.timer]);
    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
        const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
        return () => sub.remove();
    }, []);
    const heading = (text: string) => <Text style={[s.heading, { color: p.text }]}>{text}</Text>;
    const copy = (text: string) => <Text style={[s.copy, { color: p.muted }]}>{text}</Text>;
    function card(caption: string, children: React.ReactNode) {
        return <View style={[s.card, { backgroundColor: p.surface, borderColor: p.border }]}><View style={[s.windowBar, { backgroundColor: p.tint, borderColor: p.border }]}><Text style={{ color: p.text, fontFamily: 'monospace', fontSize: 12 }}>{caption}</Text><Text style={{ color: p.muted }}>— □ ♡</Text></View><View style={s.cardContent}>{children}</View></View>;
    }
    function complete(task: Task) {
        dispatch({ type: 'toggle', id: task.id });
        if (!task.done) {
            setParty(n => n + 1);
            const nextCount = state.earned.length + (state.earned.includes(task.id) ? 0 : 1);
            const unlocked = cats.find(c => c.need === nextCount && !state.earned.includes(task.id));
            setMessage(unlocked ? `Ny venn! ${unlocked.name} er låst opp 🐱` : nextCount === 8 && !state.earned.includes(task.id) ? 'Du har låst opp en rosa sløyfe! 🎀' : 'En liten poteseier. Godt jobbet! ♡');
        }
        else
            setMessage('Oppgaven er satt tilbake som gjenstående.');
    }
    function addTask() {
        if (!title.trim() || !subject.trim()) {
            Alert.alert('Fyll inn feltene', 'Skriv både oppgaven og hvilket fag den tilhører.');
            return;
        }
        dispatch({ type: 'add', task: { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, title: title.trim(), subject: subject.trim(), due: localDate(due), done: false } });
        Keyboard.dismiss();
        setShowForm(false);
        setShowDate(false);
        setTitle('');
        setSubject('');
        setDue(new Date());
        setMessage('Oppgaven er lagt til ♡');
    }
    function selectDate() {
        Keyboard.dismiss();
        if (Platform.OS !== 'android') {
            setShowDate(true);
            return;
        }
        if (datePickerOpen.current)
            return;
        datePickerOpen.current = true;
        const closed = () => { datePickerOpen.current = false; };
        try {
            // Open once on tap, independently of the focus timer's re-renders.
            DateTimePickerAndroid.open({
                value: due,
                mode: 'date',
                display: 'calendar',
                positiveButton: { label: 'Velg dato' },
                negativeButton: { label: 'Avbryt' },
                onValueChange: (_event, selectedDate) => {
                    closed();
                    if (!Number.isNaN(selectedDate.getTime()))
                        setDue(selectedDate);
                },
                onDismiss: closed,
                onError: () => { closed(); Alert.alert('Kunne ikke åpne kalenderen', 'Prøv igjen, eller bruk et av snarvalgene under datoen.'); },
            });
        }
        catch {
            closed();
            Alert.alert('Kunne ikke åpne kalenderen', 'Prøv igjen, eller bruk et av snarvalgene under datoen.');
        }
    }
    function dateShortcut(days: number) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        date.setHours(12, 0, 0, 0);
        setDue(date);
    }
    if (!ready)
        return <SafeAreaView style={[s.screen, { backgroundColor: p.bg }]}><View style={s.loading}><PixelCat cat="cream" size={120}/>
    {loadError ? <>{heading('Kunne ikke lese lagringen')}{copy('Lagrede data blir ikke overskrevet. Prøv å laste inn igjen.')}{<ActionButton key={'Prøv igjen'} label={'Prøv igjen'} onPress={() => { void load(); }} palette={p} reduced={reduced}/>}{<ActionButton key={'Start på nytt'} label={'Start på nytt'} onPress={() => Alert.alert('Slette lokale appdata?', 'Oppgaver og belønninger slettes bare i mobilappen.', [{ text: 'Avbryt', style: 'cancel' }, { text: 'Slett', style: 'destructive', onPress: () => { dispatch({ type: 'hydrate', state: initialState }); setReady(true); } }])} palette={p} reduced={reduced}/>}</> : <ActivityIndicator color={p.accent} accessibilityLabel="Laster StudiePlan"/>}
  </View></SafeAreaView>;
    const visible = state.tasks.filter(t => filter === 'all' || (filter === 'done' ? t.done : !t.done)).sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due));
    return <SafeAreaView style={[s.screen, { backgroundColor: p.bg }]} edges={['top', 'bottom']}>
    <StatusBar style={state.theme === 'dark' ? 'light' : 'dark'}/>
    <View style={[s.header, { borderColor: p.border }]}><Text style={[s.brand, { color: p.text }]}>🐾 StudiePlan</Text><Text style={{ color: p.accent, fontSize: 12 }}>POCKET EDITION ♡</Text>{Platform.OS === 'web' && <Text style={{ color: p.muted, fontSize: 10 }}>NETTLESERFORHÅNDSVISNING · React Native-app</Text>}</View>
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={s.row} accessibilityLabel="Velg tema">{(Object.keys(themes) as ThemeName[]).map(theme => <ActionButton key={themes[theme].name} label={themes[theme].name} onPress={() => dispatch({ type: 'theme', theme })} palette={p} reduced={reduced} options={{ selected: state.theme === theme }}/>)}</View>
      {message !== '' && <Text accessibilityLiveRegion="polite" style={[s.notice, { backgroundColor: p.tint, color: p.text }]}>{message}</Text>}
      {tab === 'tasks' && <>
        <View style={s.hero}><View style={{ flex: 1 }}><Text style={[s.eyebrow, { color: p.accent }]}>ET STEG AV GANGEN</Text><Text style={[s.heroTitle, { color: p.text }]}>Små steg.{"\n"}Store poteseiere.</Text>{copy('Din lille studievenn, rett i lomma.')}</View><PixelCat cat={state.cat} size={105} bow={state.bow} party={party} reduced={reduced}/></View>
        {card('♡ progress.exe', <>{heading(state.tasks.length ? `${done} av ${state.tasks.length} fullført · ${pct} %` : 'Klar for en ny start?')}<View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }} style={[s.track, { backgroundColor: p.tint }]}><View style={{ width: `${pct}%`, height: '100%', backgroundColor: p.accent }}/></View></>)}
        {<ActionButton key={'+ Ny oppgave'} label={'+ Ny oppgave'} onPress={() => setShowForm(true)} palette={p} reduced={reduced} options={{ primary: true }}/>}
        <View style={s.row}>{([['all', 'Alle'], ['active', 'Gjenstående'], ['done', 'Fullførte']] as const).map(([value, name]) => <ActionButton key={name} label={name} onPress={() => setFilter(value)} palette={p} reduced={reduced} options={{ selected: filter === value }}/>)}</View>
        {visible.length === 0 ? card('☆ tasks.exe', <View style={s.empty}><PixelCat cat="tuxedo" size={90}/>{heading('Litt plass til nye planer')}{copy(state.tasks.length ? 'Ingen oppgaver i dette filteret.' : 'Legg til den første oppgaven din.')}</View>) : visible.map(task => <View key={task.id} style={[s.task, { backgroundColor: p.surface, borderColor: p.border }]}>
          <Pressable onPress={() => complete(task)} accessibilityRole="checkbox" accessibilityState={{ checked: task.done }} accessibilityLabel={`${task.title}, ${task.done ? 'fullført' : 'gjenstående'}`} style={s.checkTouch}><View style={[s.checkbox, { borderColor: p.accent, backgroundColor: task.done ? p.accent : 'transparent' }]}><Text style={{ color: p.buttonText, fontWeight: 'bold' }}>{task.done ? '✓' : ''}</Text></View></Pressable>
          <View style={{ flex: 1 }}><Text style={[s.eyebrow, { color: p.accent }]}>{task.subject}</Text><Text style={{ color: task.done ? p.muted : p.text, fontSize: 16, fontWeight: '700', textDecorationLine: task.done ? 'line-through' : 'none', marginVertical: 7 }}>{task.title}</Text><Text style={{ color: !task.done && task.due < localDate(new Date(now)) ? (state.theme === 'dark' ? '#ffb1c3' : '#a13345') : p.muted, fontSize: 12 }}>{!task.done && task.due < localDate(new Date(now)) ? 'Fristen har passert · ' : 'Frist · '}{new Date(task.due + 'T12:00:00').toLocaleDateString('nb-NO')}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Slett ${task.title}`} style={s.checkTouch} onPress={() => Alert.alert('Slette oppgaven?', task.title, [{ text: 'Avbryt', style: 'cancel' }, { text: 'Slett', style: 'destructive', onPress: () => { dispatch({ type: 'delete', id: task.id }); setMessage('Oppgaven er slettet.'); } }])}><Text style={{ color: p.muted, fontSize: 20 }}>×</Text></Pressable>
        </View>)}
      </>}
      {tab === 'focus' && card('🍅 focus-time.exe', <>
        {heading('Din lille fokusboble')}{copy('En ting av gangen. Katten heier på deg!')}
        <View style={s.row}>{<ActionButton key={'Fokus · 25 min'} label={'Fokus · 25 min'} onPress={() => dispatch({ type: 'timer-mode', mode: 'focus' })} palette={p} reduced={reduced} options={{ selected: state.timer.mode === 'focus' }}/>}{<ActionButton key={'Pause · 5 min'} label={'Pause · 5 min'} onPress={() => dispatch({ type: 'timer-mode', mode: 'break' })} palette={p} reduced={reduced} options={{ selected: state.timer.mode === 'break' }}/>}</View>
        <View style={s.empty}><PixelCat cat={state.cat} size={175} bow={state.bow} party={party} reduced={reduced}/>{copy(`${chosen.name} holder deg med selskap ♡`)}</View>
        <Text style={[s.clock, { color: p.accent }]} accessibilityLabel={`${Math.floor(secs / 60)} minutter og ${secs % 60} sekunder igjen`}>{String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}</Text>
        {<ActionButton key={state.timer.endsAt ? 'Sett på pause' : secs < duration(state.timer.mode) ? 'Fortsett' : 'Start økten'} label={state.timer.endsAt ? 'Sett på pause' : secs < duration(state.timer.mode) ? 'Fortsett' : 'Start økten'} onPress={() => dispatch({ type: 'timer-toggle', now: Date.now() })} palette={p} reduced={reduced} options={{ primary: true }}/>}
        {<ActionButton key={'Nullstill'} label={'Nullstill'} onPress={() => dispatch({ type: 'timer-mode', mode: state.timer.mode })} palette={p} reduced={reduced}/>}
        {copy('Neste økt starter når du trykker Start. Tiden beregnes også når appen har vært i bakgrunnen. Prototypen sender ikke bakgrunnsvarsler.')}
      </>)}
      {tab === 'cats' && card('♡ kitty-club.exe', <>
        {heading('Din kattesamling')}{copy(`${state.earned.length} unike oppgaver fullført. Små seiere, søte venner!`)}
        <View style={s.catGrid}>{cats.map(cat => { const locked = state.earned.length < cat.need; return <Pressable key={cat.id} disabled={locked} accessibilityRole="button" accessibilityState={{ selected: state.cat === cat.id, disabled: locked }} accessibilityLabel={`${cat.name}, ${locked ? `låses opp etter ${cat.need} oppgaver` : 'velg som fokuskatt'}`} onPress={() => { dispatch({ type: 'cat', cat: cat.id }); setMessage(`${cat.name} er din nye fokusvenn ♡`); }} style={[s.catTile, { borderColor: state.cat === cat.id ? p.accent : p.border, backgroundColor: state.cat === cat.id ? p.tint : p.bg, opacity: locked ? .55 : 1 }]}><PixelCat cat={cat.id} size={90} party={party} reduced={reduced}/><Text style={{ color: p.text, fontWeight: 'bold' }}>{cat.name}</Text><Text style={{ color: p.muted, fontSize: 11, marginTop: 7 }}>{locked ? `🔒 ${cat.need} oppgaver` : state.cat === cat.id ? 'Valgt ✓' : 'Velg katt'}</Text></Pressable>; })}</View>
        {<ActionButton key={`${state.bow ? '✓ Ta av' : '🎀 Ta på'} rosa sløyfe${state.earned.length < 8 ? ' · 8 oppgaver' : ''}`} label={`${state.bow ? '✓ Ta av' : '🎀 Ta på'} rosa sløyfe${state.earned.length < 8 ? ' · 8 oppgaver' : ''}`} onPress={() => dispatch({ type: 'bow' })} palette={p} reduced={reduced} options={{ selected: state.bow, disabled: state.earned.length < 8 }}/>}
        {copy('Hver oppgave teller én gang. Belønningene beholdes når oppgaver slettes. Alt lagres lokalt i mobilappen.')}
      </>)}
      <Text style={[s.footer, { color: p.muted }]}>StudiePlan · laget med AI og litt kattemagi ♡</Text>
    </ScrollView>
    <View style={[s.tabBar, { backgroundColor: p.surface, borderColor: p.border }]}>{([['tasks', '✓', 'Oppgaver'], ['focus', '◷', 'Fokus'], ['cats', '🐾', 'Katter']] as const).map(([value, icon, label]) => <Pressable key={value} onPress={() => { setTab(value); Keyboard.dismiss(); }} accessibilityRole="tab" accessibilityState={{ selected: tab === value }} style={[s.tab, { backgroundColor: tab === value ? p.tint : 'transparent' }]}><Text style={{ color: p.accent, fontSize: 22 }}>{icon}</Text><Text style={{ color: p.text, fontWeight: tab === value ? 'bold' : 'normal', fontSize: 12 }}>{label}</Text></Pressable>)}</View>
    <Modal visible={showForm} animationType={reduced ? 'none' : 'slide'} onRequestClose={() => { setShowDate(false); setShowForm(false); }}>
      <SafeAreaView style={[s.screen, { backgroundColor: p.bg }]}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>
        {heading('En ny liten plan ♡')}{copy('Hva vil du få gjort?')}
        <Text style={[s.label, { color: p.text }]}>Oppgave</Text><TextInput accessibilityLabel="Oppgave" value={title} onChangeText={setTitle} maxLength={120} placeholder="F.eks. lese kapittel 4" placeholderTextColor={p.muted} style={[s.input, { color: p.text, backgroundColor: p.surface, borderColor: p.border }]}/>
        <Text style={[s.label, { color: p.text }]}>Fag</Text><TextInput accessibilityLabel="Fag" value={subject} onChangeText={setSubject} maxLength={60} placeholder="F.eks. Informasjonssystemer" placeholderTextColor={p.muted} style={[s.input, { color: p.text, backgroundColor: p.surface, borderColor: p.border }]}/>
        <Text style={[s.label, { color: p.text }]}>Innleveringsfrist</Text>{<ActionButton key={'📅 ' + due.toLocaleDateString('nb-NO')} label={'📅 ' + due.toLocaleDateString('nb-NO')} onPress={selectDate} palette={p} reduced={reduced}/>}
        {copy(Platform.OS === 'web' ? 'Trykk på datoen for å åpne nettleserens datofelt.' : 'Trykk på datoen, velg en dag og bekreft med «Velg dato».')}
        <View style={s.row}>{<ActionButton key={'I dag'} label={'I dag'} onPress={() => dateShortcut(0)} palette={p} reduced={reduced}/>}{<ActionButton key={'I morgen'} label={'I morgen'} onPress={() => dateShortcut(1)} palette={p} reduced={reduced}/>}{<ActionButton key={'Om en uke'} label={'Om en uke'} onPress={() => dateShortcut(7)} palette={p} reduced={reduced}/>}</View>
        {showDate && Platform.OS === 'web' && <WebDateInput value={due} onChange={setDue} foreground={p.text} background={p.surface} border={p.border} dark={state.theme === 'dark'}/>}
        {showDate && Platform.OS !== 'android' && Platform.OS !== 'web' && <DateTimePicker value={due} mode="date" onValueChange={(_event, date) => { setShowDate(false); setDue(date); }} onDismiss={() => setShowDate(false)}/>}
        <View style={{ height: 20 }}/>{<ActionButton key={'+ Legg til oppgave'} label={'+ Legg til oppgave'} onPress={addTask} palette={p} reduced={reduced} options={{ primary: true }}/>}{<ActionButton key={'Avbryt'} label={'Avbryt'} onPress={() => { setShowDate(false); setShowForm(false); }} palette={p} reduced={reduced}/>}
      </ScrollView></KeyboardAvoidingView></SafeAreaView>
    </Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
    screen: { flex: 1 }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 20 },
    header: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, gap: 6 }, brand: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
    scroll: { padding: 18, paddingBottom: 28, gap: 16 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    button: { minHeight: 46, borderWidth: 1, borderBottomWidth: 3, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, justifyContent: 'center' },
    hero: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 }, heroTitle: { fontSize: 27, fontWeight: '900', letterSpacing: -.8, marginVertical: 10 },
    eyebrow: { fontSize: 10, letterSpacing: 1.2, fontWeight: '800' }, card: { borderWidth: 2, borderBottomWidth: 4, borderRadius: 13, overflow: 'hidden' },
    windowBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 13, paddingVertical: 10, borderBottomWidth: 1 }, cardContent: { padding: 17, gap: 14 },
    heading: { fontSize: 21, fontWeight: '800', lineHeight: 29 }, copy: { fontSize: 13, lineHeight: 21 }, track: { height: 12, borderRadius: 5, overflow: 'hidden' },
    task: { borderWidth: 1, borderBottomWidth: 3, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
    checkTouch: { minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, checkbox: { width: 25, height: 25, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    empty: { alignItems: 'center', paddingVertical: 16, gap: 12 }, notice: { borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 20 },
    clock: { fontFamily: 'monospace', fontSize: 60, fontWeight: '800', textAlign: 'center', fontVariant: ['tabular-nums'] },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }, catTile: { width: '47%', alignItems: 'center', borderRadius: 12, borderWidth: 2, paddingVertical: 17 },
    tabBar: { flexDirection: 'row', borderTopWidth: 1, padding: 8, gap: 8 }, tab: { flex: 1, minHeight: 59, alignItems: 'center', justifyContent: 'center', borderRadius: 11, gap: 4 },
    label: { fontSize: 14, fontWeight: '700', marginTop: 8 }, input: { minHeight: 51, padding: 14, borderRadius: 10, borderWidth: 1, fontSize: 16 },
    footer: { textAlign: 'center', fontSize: 11, lineHeight: 18, marginTop: 12 },
});
