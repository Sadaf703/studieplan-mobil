# StudiePlan – Android

En selvstendig mobilversjon av StudiePlan, bygget med React Native, Expo og TypeScript. Dette er native mobilkomponenter, ikke nettsiden i en WebView. Den opprinnelige nettsiden finnes i et separat repositorium: https://github.com/Sadaf703/studieplan.

## Prøv på en Android-telefon

1. Installer Expo Go fra Google Play: https://expo.dev/go
2. Koble telefonen og PC-en til samme Wi-Fi.
3. Åpne denne prosjektmappen i VS Code og åpne en terminal.
4. Kjør `npm start` og skann QR-koden i Expo Go.

Prosjektet er tilpasset Expo SDK 57, som er versjonen på studentens Android-telefon. Avhengigheter er installert på denne PC-en. Ved en ny nedlasting av kildekoden kjører du `npm ci` først. Expo Go må støtte SDK-versjonen som står i package.json. Bruk https://expo.dev/go ved versjonsforskjell. Expo Go er verktøyet vi tester prototypen i; prosjektet kan senere bygges til en egen APK.

## Funksjoner

- Oppgaver med fag, Android-datovelger, frister, sortering, filtre og fullføring.
- Fremgang og pikselkatt som hopper ved fullføring.
- Fokustimer: 25 minutter fokus, 5 minutter pause, start/pause/fortsett/nullstill.
- Katter ved 1, 3 og 5 unike fullføringer; rosa sløyfe ved 8.
- Rosa, lilla og mørkt tema; faner for Oppgaver, Fokus og Katter.
- Lokal lagring i AsyncStorage. Appen synkroniserer ikke med nettsiden eller andre enheter.

Timeren bruker absolutt sluttid. Etter bakgrunn eller omlasting vises korrekt gjenstående tid. En utløpt økt bytter til neste økt og venter på Start. Ingen varsler sendes mens appen er lukket. Sletting av appdata/avinstallasjon kan fjerne alt som er lagret.

## Nettleserforhåndsvisning

Mobilappens egne React Native-skjermer kan også kjøres i nettleseren med `npm run web`. Den merkes tydelig som nettleserforhåndsvisning. Nettleseren bruker et HTML-datofelt, mens Android bruker den native kalenderdialogen. Nettleserdata og Android-data lagres hver for seg.

En statisk forhåndsvisning kan bygges med `npx expo export --platform web --output-dir web-preview` og åpnes med `node scripts/serve-preview.cjs` på http://127.0.0.1:8768. Opptak fra denne forhåndsvisningen er ikke et faktisk Android-opptak.

## Koden

- `App.tsx`: appens inngang.
- `src/MobileApp.tsx`: skjermbilder, navigasjon og lagring.
- `src/model.ts`: oppgaver, belønninger, timer og validering.
- `src/themes.ts`: de tre fargetemaene.
- `src/PixelCat.tsx` og `assets/cats.json`: originale SVG-pikselkatter.

## Kontroller

`npm run lint` kjører prosjektets ESLint-sjekk.
`npx tsc --noEmit` sjekker TypeScript.
`node --test tests/model.test.cjs` tester viktige tilstandsendringer.
`npx expo export --platform android --output-dir build-check` sjekker Android-bundlingen. Dette lager ikke en installerbar APK og erstatter ikke testing på telefon.

Test på telefon: opprett oppgaver, prøv datovelger og Android-tilbakeknapp, kryss av og slett, sjekk filtrene, lås opp Mango, start/pause timer, send appen i bakgrunnen, start den igjen og bytt tema. Kontroller at data overlever en ny appstart.

## Egen APK senere

`eas.json` har en preview-profil for APK. Med Expo-konto, EAS CLI og valgt prosjekt kan en bygge med `eas build --platform android --profile preview`. Det krever et eget byggesteg; en APK følger ikke automatisk av kildekoden. Eventuelle tjenestegrenser eller kostnader må kontrolleres før bruk.
