export type Locale = 'en' | 'zh' | 'de' | 'fr';

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
];

export type Translations = {
  home: {
    tagline: string;
    headline: string;
    description: string;
    cta: string;
    steps: [string, string, string];
  };
  createRoom: {
    back: string;
    heading: string;
    subheading: string;
    titleLabel: string;
    titlePlaceholder: string;
    durationLabel: string;
    duration1h: string;
    duration4h: string;
    guideNameLabel: string;
    guideNamePlaceholder: string;
    errorTitleRequired: string;
    creating: string;
    submit: string;
  };
  guideRoom: {
    createAnother: string;
    guide: string;
    roomId: string;
    status: string;
    statusActive: string;
    statusEnded: string;
    statusExpired: string;
    sessionTime: string;
    expiresAt: string;
    roomEnded: string;
    roomExpired: string;
    listeners: string;
    listenersConnected: string;
    microphone: string;
    micOn: string;
    micOff: string;
    stopSpeaking: string;
    startSpeaking: string;
    ending: string;
    endRoom: string;
    listenerLink: string;
    connectingToRoom: string;
    failedToConnect: string;
    micPermissionGranted: string;
    micPermissionPrompt: string;
    micPermissionDenied: string;
    micPermissionUnsupported: string;
    micPermissionUnknown: string;
    micRequesting: string;
    micInsecureContext: string;
    micUnsupportedBrowser: string;
    micNotFound: string;
    micNotReadable: string;
    micAccessFailed: string;
    micEnableHelp: string;
  };
  listenerRoom: {
    tag: string;
    guide: string;
    expiresAt: string;
    putOnEarphones: string;
    tapToJoin: string;
    startListening: string;
    retry: string;
    connectedLive: string;
    connecting: string;
    audioPlaying: string;
    roomEnded: string;
    roomExpired: string;
    sessionExpired: string;
    guideClosedSession: string;
    guideLeft: string;
  };
};

const en: Translations = {
  home: {
    tagline: 'GuideRoom MVP',
    headline: 'Create a live audio room in 30 seconds.',
    description:
      'Visitors scan a QR code and listen to the guide with their own phones and earphones. No dedicated receiver hardware required.',
    cta: 'Create a room',
    steps: [
      'Guide creates a live audio room.',
      'Guide shows the QR code to visitors.',
      'Visitors scan and listen with their own phones.',
    ],
  },
  createRoom: {
    back: '← Back',
    heading: 'Create a GuideRoom',
    subheading: 'Choose the session time you want to purchase. Team name and guide name are optional.',
    titleLabel: 'Team or room name (optional)',
    titlePlaceholder: 'Basel Old Town Tour',
    durationLabel: 'Session time to purchase',
    duration1h: '1 hour',
    duration4h: '4 hours',
    guideNameLabel: 'Guide name (optional)',
    guideNamePlaceholder: 'Tao',
    errorTitleRequired: 'Please choose a session duration.',
    creating: 'Creating…',
    submit: 'Create room',
  },
  guideRoom: {
    createAnother: '← Create another room',
    guide: 'Guide:',
    roomId: 'Room ID:',
    status: 'Status',
    statusActive: 'Active',
    statusEnded: 'Ended',
    statusExpired: 'Expired',
    sessionTime: 'Session time',
    expiresAt: 'Expires at',
    roomEnded: 'This room has ended.',
    roomExpired: 'This room has expired.',
    listeners: 'Listeners',
    listenersConnected: 'connected',
    microphone: 'Microphone',
    micOn: 'On',
    micOff: 'Off',
    stopSpeaking: 'Stop speaking',
    startSpeaking: 'Start speaking',
    ending: 'Ending…',
    endRoom: 'End room',
    listenerLink: 'Listener link',
    connectingToRoom: 'Connecting to room…',
    failedToConnect: 'Failed to connect to room',
    micPermissionGranted: 'Microphone permission granted',
    micPermissionPrompt: 'Tap the button if the browser asks for microphone permission',
    micPermissionDenied: 'Microphone permission was denied',
    micPermissionUnsupported: 'This browser does not expose microphone permission status',
    micPermissionUnknown: 'Checking microphone permission…',
    micRequesting: 'Requesting microphone…',
    micInsecureContext: 'Microphone requires HTTPS or localhost.',
    micUnsupportedBrowser: 'This browser does not support microphone capture.',
    micNotFound: 'No microphone was found on this device.',
    micNotReadable: 'The microphone is busy or blocked by the system.',
    micAccessFailed: 'Could not start the microphone.',
    micEnableHelp: 'Please allow microphone access in the browser or system site settings, then tap Start speaking again. On some Android phones, also check App permissions → Microphone for the browser.',
  },
  listenerRoom: {
    tag: 'GuideRoom listener',
    guide: 'Guide:',
    expiresAt: 'Expires at:',
    putOnEarphones: 'Put on your earphones.',
    tapToJoin: 'Tap the button below to join the live audio room.',
    startListening: 'Start listening',
    retry: 'Retry',
    connectedLive: 'Connected — listening live',
    connecting: 'Connecting…',
    audioPlaying: 'Audio is playing. Use your earphones for the best experience.',
    roomEnded: 'This room has ended.',
    roomExpired: 'This room has expired.',
    sessionExpired: 'The purchased session time is over.',
    guideClosedSession: 'The guide has closed the session.',
    guideLeft: 'The guide has left. The session may have ended.',
  },
};

const zh: Translations = {
  home: {
    tagline: 'GuideRoom MVP',
    headline: '30秒创建一个直播音频房间。',
    description:
      '访客扫描二维码，用自己的手机和耳机收听导游讲解。无需专用接收设备。',
    cta: '创建房间',
    steps: [
      '导游创建直播音频房间。',
      '导游向访客展示二维码。',
      '访客扫描后用手机收听。',
    ],
  },
  createRoom: {
    back: '← 返回',
    heading: '创建 GuideRoom',
    subheading: '请选择需要购买的使用时长。团队名称和导游姓名都是可选项。',
    titleLabel: '团队或房间名称（可选）',
    titlePlaceholder: '巴塞尔老城导览',
    durationLabel: '需要购买的使用时长',
    duration1h: '1小时',
    duration4h: '4小时',
    guideNameLabel: '导游姓名（可选）',
    guideNamePlaceholder: '小陶',
    errorTitleRequired: '请选择使用时长。',
    creating: '创建中…',
    submit: '创建房间',
  },
  guideRoom: {
    createAnother: '← 创建新房间',
    guide: '导游：',
    roomId: '房间ID：',
    status: '状态',
    statusActive: '进行中',
    statusEnded: '已结束',
    statusExpired: '已过期',
    sessionTime: '购买时长',
    expiresAt: '到期时间',
    roomEnded: '此房间已结束。',
    roomExpired: '此房间已过期。',
    listeners: '听众',
    listenersConnected: '已连接',
    microphone: '麦克风',
    micOn: '开启',
    micOff: '关闭',
    stopSpeaking: '停止讲话',
    startSpeaking: '开始讲话',
    ending: '结束中…',
    endRoom: '结束房间',
    listenerLink: '收听链接',
    connectingToRoom: '正在连接房间…',
    failedToConnect: '连接房间失败',
    micPermissionGranted: '麦克风权限已允许',
    micPermissionPrompt: '如果浏览器弹出麦克风授权，请点击允许',
    micPermissionDenied: '麦克风权限已被拒绝',
    micPermissionUnsupported: '此浏览器无法读取麦克风权限状态',
    micPermissionUnknown: '正在检查麦克风权限…',
    micRequesting: '正在请求麦克风…',
    micInsecureContext: '麦克风功能需要 HTTPS 或 localhost。',
    micUnsupportedBrowser: '此浏览器不支持网页麦克风采集。',
    micNotFound: '此设备没有检测到可用麦克风。',
    micNotReadable: '麦克风正被系统或其他应用占用，或被系统阻止。',
    micAccessFailed: '无法启动麦克风。',
    micEnableHelp: '请在浏览器或系统的网站权限中允许麦克风，然后再次点击“开始讲话”。部分安卓手机还需要到系统设置 → 应用权限 → 麦克风，确认当前浏览器已获得权限。',
  },
  listenerRoom: {
    tag: 'GuideRoom 听众端',
    guide: '导游：',
    expiresAt: '到期时间：',
    putOnEarphones: '请佩戴好耳机。',
    tapToJoin: '点击下方按钮加入直播音频房间。',
    startListening: '开始收听',
    retry: '重试',
    connectedLive: '已连接 — 正在直播收听',
    connecting: '连接中…',
    audioPlaying: '音频正在播放，建议使用耳机以获得最佳体验。',
    roomEnded: '此房间已结束。',
    roomExpired: '此房间已过期。',
    sessionExpired: '购买的使用时长已经结束。',
    guideClosedSession: '导游已关闭本次导览。',
    guideLeft: '导游已离开房间，导览可能已结束。',
  },
};

const de: Translations = {
  home: {
    tagline: 'GuideRoom MVP',
    headline: 'Erstelle einen Live-Audioraum in 30 Sekunden.',
    description:
      'Besucher scannen einen QR-Code und hören dem Reiseführer mit ihrem eigenen Handy und Kopfhörern zu. Keine spezielle Empfänger-Hardware erforderlich.',
    cta: 'Raum erstellen',
    steps: [
      'Reiseführer erstellt einen Live-Audioraum.',
      'Reiseführer zeigt den QR-Code den Besuchern.',
      'Besucher scannen und hören mit dem eigenen Handy zu.',
    ],
  },
  createRoom: {
    back: '← Zurück',
    heading: 'GuideRoom erstellen',
    subheading: 'Wähle die Sitzungsdauer aus, die du kaufen möchtest. Teamname und Reiseführername sind optional.',
    titleLabel: 'Team- oder Raumname (optional)',
    titlePlaceholder: 'Altstadt-Führung Basel',
    durationLabel: 'Zu kaufende Sitzungsdauer',
    duration1h: '1 Stunde',
    duration4h: '4 Stunden',
    guideNameLabel: 'Name des Führers (optional)',
    guideNamePlaceholder: 'Max',
    errorTitleRequired: 'Bitte wähle eine Sitzungsdauer.',
    creating: 'Erstelle…',
    submit: 'Raum erstellen',
  },
  guideRoom: {
    createAnother: '← Neuen Raum erstellen',
    guide: 'Reiseführer:',
    roomId: 'Raum-ID:',
    status: 'Status',
    statusActive: 'Aktiv',
    statusEnded: 'Beendet',
    statusExpired: 'Abgelaufen',
    sessionTime: 'Sitzungsdauer',
    expiresAt: 'Läuft ab um',
    roomEnded: 'Dieser Raum wurde beendet.',
    roomExpired: 'Dieser Raum ist abgelaufen.',
    listeners: 'Zuhörer',
    listenersConnected: 'verbunden',
    microphone: 'Mikrofon',
    micOn: 'Ein',
    micOff: 'Aus',
    stopSpeaking: 'Stopp',
    startSpeaking: 'Sprechen',
    ending: 'Beende…',
    endRoom: 'Raum beenden',
    listenerLink: 'Zuhörer-Link',
    connectingToRoom: 'Verbinde mit Raum…',
    failedToConnect: 'Verbindung fehlgeschlagen',
    micPermissionGranted: 'Mikrofonberechtigung erteilt',
    micPermissionPrompt: 'Tippe auf die Schaltfläche und erlaube den Mikrofonzugriff im Browser',
    micPermissionDenied: 'Mikrofonberechtigung wurde verweigert',
    micPermissionUnsupported: 'Dieser Browser zeigt den Mikrofon-Berechtigungsstatus nicht an',
    micPermissionUnknown: 'Mikrofonberechtigung wird geprüft…',
    micRequesting: 'Mikrofon wird angefordert…',
    micInsecureContext: 'Das Mikrofon benötigt HTTPS oder localhost.',
    micUnsupportedBrowser: 'Dieser Browser unterstützt keine Mikrofonaufnahme.',
    micNotFound: 'Auf diesem Gerät wurde kein Mikrofon gefunden.',
    micNotReadable: 'Das Mikrofon ist belegt oder vom System blockiert.',
    micAccessFailed: 'Das Mikrofon konnte nicht gestartet werden.',
    micEnableHelp: 'Bitte erlaube den Mikrofonzugriff in den Browser- oder Website-Einstellungen und tippe erneut auf Sprechen. Auf manchen Android-Geräten auch die App-Berechtigung Mikrofon für den Browser prüfen.',
  },
  listenerRoom: {
    tag: 'GuideRoom Zuhörer',
    guide: 'Reiseführer:',
    expiresAt: 'Läuft ab um:',
    putOnEarphones: 'Kopfhörer aufsetzen.',
    tapToJoin: 'Tippe unten, um dem Live-Audioraum beizutreten.',
    startListening: 'Zuhören starten',
    retry: 'Erneut versuchen',
    connectedLive: 'Verbunden — Live-Übertragung',
    connecting: 'Verbinde…',
    audioPlaying: 'Audio läuft. Kopfhörer für beste Erfahrung empfohlen.',
    roomEnded: 'Dieser Raum wurde beendet.',
    roomExpired: 'Dieser Raum ist abgelaufen.',
    sessionExpired: 'Die gekaufte Sitzungsdauer ist vorbei.',
    guideClosedSession: 'Der Reiseführer hat die Sitzung beendet.',
    guideLeft: 'Der Reiseführer hat den Raum verlassen. Die Führung ist möglicherweise beendet.',
  },
};

const fr: Translations = {
  home: {
    tagline: 'GuideRoom MVP',
    headline: 'Créez une salle audio en direct en 30 secondes.',
    description:
      'Les visiteurs scannent un QR code et écoutent le guide avec leur propre téléphone et écouteurs. Aucun matériel récepteur dédié requis.',
    cta: 'Créer une salle',
    steps: [
      'Le guide crée une salle audio en direct.',
      'Le guide montre le QR code aux visiteurs.',
      'Les visiteurs scannent et écoutent avec leur téléphone.',
    ],
  },
  createRoom: {
    back: '← Retour',
    heading: 'Créer un GuideRoom',
    subheading: 'Choisissez la durée de session à acheter. Le nom du groupe et le nom du guide sont optionnels.',
    titleLabel: 'Nom du groupe ou de la salle (optionnel)',
    titlePlaceholder: 'Visite vieille ville de Bâle',
    durationLabel: 'Durée de session à acheter',
    duration1h: '1 heure',
    duration4h: '4 heures',
    guideNameLabel: 'Nom du guide (optionnel)',
    guideNamePlaceholder: 'Pierre',
    errorTitleRequired: 'Veuillez choisir une durée de session.',
    creating: 'Création…',
    submit: 'Créer la salle',
  },
  guideRoom: {
    createAnother: '← Créer une autre salle',
    guide: 'Guide :',
    roomId: 'ID salle :',
    status: 'Statut',
    statusActive: 'Actif',
    statusEnded: 'Terminée',
    statusExpired: 'Expirée',
    sessionTime: 'Durée',
    expiresAt: 'Expire à',
    roomEnded: 'Cette salle est terminée.',
    roomExpired: 'Cette salle a expiré.',
    listeners: 'Auditeurs',
    listenersConnected: 'connectés',
    microphone: 'Microphone',
    micOn: 'Activé',
    micOff: 'Désactivé',
    stopSpeaking: 'Arrêter de parler',
    startSpeaking: 'Commencer à parler',
    ending: 'Fin…',
    endRoom: 'Terminer la salle',
    listenerLink: 'Lien d\'écoute',
    connectingToRoom: 'Connexion en cours…',
    failedToConnect: 'Échec de connexion',
    micPermissionGranted: 'Autorisation microphone accordée',
    micPermissionPrompt: 'Appuyez sur le bouton et autorisez le microphone dans le navigateur',
    micPermissionDenied: 'L\'autorisation du microphone a été refusée',
    micPermissionUnsupported: 'Ce navigateur n\'affiche pas l\'état de l\'autorisation microphone',
    micPermissionUnknown: 'Vérification de l\'autorisation microphone…',
    micRequesting: 'Demande du microphone…',
    micInsecureContext: 'Le microphone nécessite HTTPS ou localhost.',
    micUnsupportedBrowser: 'Ce navigateur ne prend pas en charge la capture microphone.',
    micNotFound: 'Aucun microphone n\'a été trouvé sur cet appareil.',
    micNotReadable: 'Le microphone est occupé ou bloqué par le système.',
    micAccessFailed: 'Impossible de démarrer le microphone.',
    micEnableHelp: 'Veuillez autoriser le microphone dans les paramètres du navigateur ou du site, puis appuyez de nouveau sur Commencer à parler. Sur certains appareils Android, vérifiez aussi l\'autorisation Microphone de l\'application navigateur.',
  },
  listenerRoom: {
    tag: 'GuideRoom auditeur',
    guide: 'Guide :',
    expiresAt: 'Expire à :',
    putOnEarphones: 'Mettez vos écouteurs.',
    tapToJoin: 'Appuyez sur le bouton ci-dessous pour rejoindre la salle audio en direct.',
    startListening: 'Commencer à écouter',
    retry: 'Réessayer',
    connectedLive: 'Connecté — écoute en direct',
    connecting: 'Connexion…',
    audioPlaying: 'Audio en cours. Utilisez vos écouteurs pour une meilleure expérience.',
    roomEnded: 'Cette salle est terminée.',
    roomExpired: 'Cette salle a expiré.',
    sessionExpired: 'La durée achetée est terminée.',
    guideClosedSession: 'Le guide a clôturé la session.',
    guideLeft: 'Le guide a quitté la salle. La visite est peut-être terminée.',
  },
};

export const translations: Record<Locale, Translations> = { en, zh, de, fr };
