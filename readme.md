Im Rahmen dieses Projekts wurde eine 3D-Disco-Anwendung mit Three.js 
entwickelt. Die Anwendung stellt Charaktere in einer virtuellen Diskothek dar und 
kombiniert verschiedene Medien. Über eine Benutzerober äche können 
Tanzanimationen, Musik und Lichteffekte ausgewählt werden.
Verwendete Technologien
Three.js zur Erstellung der 3D-Szene und des WebGL-Renderings
FBXLoader zum Laden von 3D-Modellen und Animationen im FBX-Format
OrbitControls zur freien Kamerasteuerung
dat.GUI für die interaktive Benutzerober äche
Stats.js zur Anzeige der Performance (FPS)
Alle Charaktermodelle (Dana, Josh, Michelle) sowie die Tanzanimationen 
(Macarena, Wave, PushPush, Snake Hip Hop Dance und Step Hip Hop Dance) 
stammen von Mixamo (Adobe) und wurden als FBX-Dateien exportiert.
Kernfunktionen
Beim Start der Anwendung werden acht Charaktermodelle geladen und an 
verschiedenen Positionen innerhalb der Szene platziert. Für jede Figur wird ein 
eigener AnimationMixer erstellt, wodurch alle Charaktere unabhängig verwaltet, 
jedoch synchron animiert werden können.
Die Benutzerober äche ermöglicht unter anderem:
Auswahl verschiedener Tanzanimationen
Steuerung der Tanzgeschwindigkeit
Starten und Stoppen der Musik
Lautstärkeregelung
Hochladen eigener Musikdateien
Aktivierung eines Stroboskopeffekts
1
Dokumentation – Disco Simulation
Anpassung der Geschwindigkeit des Lichtwechsels
Zurücksetzen der gesamten Szene
Die Anwendung unterstützt außerdem das Laden eigener Audiodateien. Über einen 
AudioAnalyser werden Frequenzdaten der Musik ausgewertet, sodass die 
Beleuchtung dynamisch auf die abgespielten Beats reagiert.
Aufbau der Szene
Die Szene besteht aus einer Tanz äche mit texturiertem Boden und drei Wänden, 
die den Eindruck eines geschlossenen Raumes erzeugen. Über der Tanz äche 
be ndet sich eine Disco-Kugel, die aus zahlreichen kleinen Würfeln prozedural 
erzeugt wurde und sich kontinuierlich dreht.
Für die Beleuchtung kommen mehrere Lichtquellen zum Einsatz:
Ambient Light als Grundbeleuchtung
Directional Light zur allgemeinen Ausleuchtung
Point Light als zentrale Disco-Beleuchtung
Acht SpotLights an der Disco-Kugel zur Simulation beweglicher Lichtstrahlen
