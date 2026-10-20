# StudiePlan – Android Pocket Edition

## Kort beskrivelse

StudiePlan er en Android-prototype som hjelper studenter med oppgaver, innleveringsfrister og fokuserte studieøkter. Appen har en 25/5-fokustimer, pikselkatter som låses opp ved fullførte oppgaver, og rosa, lilla og mørkt Y2K-tema.

## Hvordan appen ble laget

Appen er utviklet med ChatGPT/Codex gjennom instruksjoner på norsk. En tidligere nettprototype ble videreutviklet til React Native med Expo og TypeScript, egne mobilskjermer, Android-datovelger og lokal lagring med AsyncStorage. Mobilprosjektet ble tilpasset Expo SDK 57 for studentens Android-telefon. Tilstandstester og TypeScript-sjekk bestod, og Android-JavaScript-pakken ble bygget. Etter tilbakemelding om datovalget ble dialogen endret til Androids anbefalte imperative API, med tydelig bekreftelse og snarvalg. Denne siste endringen gjenstår å bekrefte på telefonen.

## Videreutvikling – forslag som gjennomgås før innsending

Neste steg er en egen installerbar APK, varsler når en fokusøkt er ferdig og eksport eller sikkerhetskopi av oppgaver. Prototypen testes i Expo Go med SDK 57 og lagrer data bare på den aktuelle enheten. Den synkroniserer ikke med nettsiden eller andre enheter.

## Viktig om demonstrasjonen

Videoen skal merkes korrekt som enten faktisk Android-opptak eller en nettleserforhåndsvisning av React Native-appen. Det tidligere nettstedets video er ikke et opptak av mobilappen.

## Forslag til opptak på Android (ca. 60–90 sekunder)

1. Åpne StudiePlan i Expo Go. Bruk bare fiktive oppgaver og skjul personlige varsler.
2. Legg til to oppgaver med fag og ulik dato. Vis datovelgeren.
3. Fullfør én oppgave og vis 50 % fremgang. Prøv et filter.
4. Åpne Katter og velg Mango som låses opp etter første fullføring.
5. Åpne Fokus, start timeren, sett på pause og velg fem minutters pause.
6. Bytt mellom de tre temaene.

VibeOff-utkastet gjennomgås og publiseres av studenten. En privat gjennomgangslenke erstattes med den offentlige innlegg-lenken i Canvas etter publisering.
