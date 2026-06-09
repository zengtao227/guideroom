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
    howItWorks: string;
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
    duration3h: string;
    durationHalfDay: string;
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
  };
  listenerRoom: {
    tag: string;
    guide: string;
    putOnEarphones: string;
    tapToJoin: string;
    startListening: string;
    retry: string;
    connectedLive: string;
    connecting: string;
    audioPlaying: string;
    roomEnded: string;
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
    howItWorks: 'How it works',
    steps: [
      'Guide creates a live audio room.',
      'Guide shows the QR code to visitors.',
      'Visitors scan and listen with their own phones.',
    ],
  },
  createRoom: {
    back: '← Back',
    heading: 'Create a GuideRoom',
    subheading: 'Fill in the details below, then share the QR code with your visitors.',
    titleLabel: 'Room title',
    titlePlaceholder: 'Basel Old Town Tour',
    durationLabel: 'Duration',
    duration1h: '1 hour',
    duration3h: '3 hours',
    durationHalfDay: 'Half day (4 hours)',
    guideNameLabel: 'Guide name (optional)',
    guideNamePlaceholder: 'Tao',
    errorTitleRequired: 'Room title is required.',
    creating: 'Creating…',
    submit: 'Create room',
  },
  guideRoom: {
    createAnother: '← Create another room',
    guide: 'Guide:',
    roomId: 'Room ID:',
    status: 'Status',
    statusActive: 'Active',
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
  },
  listenerRoom: {
    tag: 'GuideRoom listener',
    guide: 'Guide:',
    putOnEarphones: 'Put on your earphones.',
    tapToJoin: 'Tap the button below to join the live audio room.',
    startListening: 'Start listening',
    retry: 'Retry',
    connectedLive: 'Connected — listening live',
    connecting: 'Connecting…',
    audioPlaying: 'Audio is playing. Use your earphones for the best experience.',
    roomEnded: 'This room has ended.',
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
    howItWorks: '使用方法',
    steps: [
      '导游创建直播音频房间。',
      '导游向访客展示二维码。',
      '访客扫描后用手机收听。',
    ],
  },
  createRoom: {
    back: '← 返回',
    heading: '创建 GuideRoom',
    subheading: '填写以下信息，然后将二维码分享给访客。',
    titleLabel: '房间名称',
    titlePlaceholder: '巴塞尔老城导览',
    durationLabel: '时长',
    duration1h: '1小时',
    duration3h: '3小时',
    durationHalfDay: '半天（4小时）',
    guideNameLabel: '导游姓名（可选）',
    guideNamePlaceholder: '小陶',
    errorTitleRequired: '请输入房间名称。',
    creating: '创建中…',
    submit: '创建房间',
  },
  guideRoom: {
    createAnother: '← 创建新房间',
    guide: '导游：',
    roomId: '房间ID：',
    status: '状态',
    statusActive: '进行中',
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
  },
  listenerRoom: {
    tag: 'GuideRoom 听众端',
    guide: '导游：',
    putOnEarphones: '请佩戴好耳机。',
    tapToJoin: '点击下方按钮加入直播音频房间。',
    startListening: '开始收听',
    retry: '重试',
    connectedLive: '已连接 — 正在直播收听',
    connecting: '连接中…',
    audioPlaying: '音频正在播放，建议使用耳机以获得最佳体验。',
    roomEnded: '此房间已结束。',
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
    howItWorks: 'So funktioniert\'s',
    steps: [
      'Reiseführer erstellt einen Live-Audioraum.',
      'Reiseführer zeigt den QR-Code den Besuchern.',
      'Besucher scannen und hören mit dem eigenen Handy zu.',
    ],
  },
  createRoom: {
    back: '← Zurück',
    heading: 'GuideRoom erstellen',
    subheading: 'Fülle die Details aus und teile dann den QR-Code mit deinen Besuchern.',
    titleLabel: 'Raumname',
    titlePlaceholder: 'Altstadt-Führung Basel',
    durationLabel: 'Dauer',
    duration1h: '1 Stunde',
    duration3h: '3 Stunden',
    durationHalfDay: 'Halber Tag (4 Stunden)',
    guideNameLabel: 'Name des Führers (optional)',
    guideNamePlaceholder: 'Max',
    errorTitleRequired: 'Raumname ist erforderlich.',
    creating: 'Erstelle…',
    submit: 'Raum erstellen',
  },
  guideRoom: {
    createAnother: '← Neuen Raum erstellen',
    guide: 'Reiseführer:',
    roomId: 'Raum-ID:',
    status: 'Status',
    statusActive: 'Aktiv',
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
  },
  listenerRoom: {
    tag: 'GuideRoom Zuhörer',
    guide: 'Reiseführer:',
    putOnEarphones: 'Kopfhörer aufsetzen.',
    tapToJoin: 'Tippe unten, um dem Live-Audioraum beizutreten.',
    startListening: 'Zuhören starten',
    retry: 'Erneut versuchen',
    connectedLive: 'Verbunden — Live-Übertragung',
    connecting: 'Verbinde…',
    audioPlaying: 'Audio läuft. Kopfhörer für beste Erfahrung empfohlen.',
    roomEnded: 'Dieser Raum ist beendet.',
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
    howItWorks: 'Comment ça marche',
    steps: [
      'Le guide crée une salle audio en direct.',
      'Le guide montre le QR code aux visiteurs.',
      'Les visiteurs scannent et écoutent avec leur téléphone.',
    ],
  },
  createRoom: {
    back: '← Retour',
    heading: 'Créer un GuideRoom',
    subheading: 'Remplissez les détails ci-dessous, puis partagez le QR code avec vos visiteurs.',
    titleLabel: 'Nom de la salle',
    titlePlaceholder: 'Visite vieille ville de Bâle',
    durationLabel: 'Durée',
    duration1h: '1 heure',
    duration3h: '3 heures',
    durationHalfDay: 'Demi-journée (4 heures)',
    guideNameLabel: 'Nom du guide (optionnel)',
    guideNamePlaceholder: 'Pierre',
    errorTitleRequired: 'Le nom de la salle est requis.',
    creating: 'Création…',
    submit: 'Créer la salle',
  },
  guideRoom: {
    createAnother: '← Créer une autre salle',
    guide: 'Guide :',
    roomId: 'ID salle :',
    status: 'Statut',
    statusActive: 'Actif',
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
  },
  listenerRoom: {
    tag: 'GuideRoom auditeur',
    guide: 'Guide :',
    putOnEarphones: 'Mettez vos écouteurs.',
    tapToJoin: 'Appuyez sur le bouton ci-dessous pour rejoindre la salle audio en direct.',
    startListening: 'Commencer à écouter',
    retry: 'Réessayer',
    connectedLive: 'Connecté — écoute en direct',
    connecting: 'Connexion…',
    audioPlaying: 'Audio en cours. Utilisez vos écouteurs pour une meilleure expérience.',
    roomEnded: 'Cette salle est terminée.',
    guideClosedSession: 'Le guide a clôturé la session.',
    guideLeft: 'Le guide a quitté la salle. La visite est peut-être terminée.',
  },
};

export const translations: Record<Locale, Translations> = { en, zh, de, fr };
