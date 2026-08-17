(function () {
  'use strict';

  const panel = document.getElementById('panel');
  if (!panel) return;

  const isEnglish = document.documentElement.lang.toLowerCase().startsWith('en');
  const englishCopy = {
    '估價方式': 'Estimate route', '快速方案': 'Quick package', '快速選擇方案': 'Quick package', '自由選配': 'Build your own', '門機等級': 'Operator grade',
    '您想怎樣獲得預算？': 'How would you like to estimate?', '選擇完整套餐快速查看價格，或逐項建立符合現場需要的配置。': 'Choose a complete package for a fast answer, or build a configuration item by item.',
    '開始報價': 'Start your estimate', '選擇估價方式': 'Choose an estimate route', '兩種方式都會提供清晰的參考價格，不需要先致電查詢。': 'Both routes provide a clear budget range without requiring a phone call.',
    '最快獲得完整預算': 'The fastest route to a complete budget', '從四個已配好的完整套餐開始，門機、玻璃、門框、安全及基本安裝均已包括。': 'Start from one of four complete packages. Operator, glass, frame, safety and basic installation are already included.',
    '逐項建立您的配置': 'Build your configuration item by item', '按工程範圍、門機、尺寸、材料、門禁及服務逐步選擇，適合已有明確要求的項目。': 'Choose the scope, operator, size, materials, access and services step by step — ideal when you already know the requirements.',
    '約 1 分鐘完成': 'About 1 minute', '約 3–5 分鐘完成': 'About 3–5 minutes', '查看完整套餐': 'View complete packages', '開始自由選配': 'Start building',
    '不確定怎樣選？建議先使用華麗高性價比方案；價格以本公司供應價及香港基本施工成本計算，並會由工程人員按現場條件確認。': 'Not sure which route to choose? Start with the Hwa Lai value package. Pricing is based on our supply prices and basic Hong Kong installation costs, then confirmed against site conditions.',
    '選擇完整方案': 'Choose a complete package', '每個方案已經配好合適的門機、門體材料、安全裝置及基本安裝，不需要再逐項重選。': 'Each package already includes a suitable operator, door materials, safety equipment and basic installation — there is no need to choose every item again.', '每個方案已經配好指定品牌門機、門體材料、安全裝置及基本安裝，不需要再逐項重選。': 'Each package includes the selected operator brand, door materials, safety equipment and basic installation — there is no need to choose every item again.',
    '四個完整套餐': 'Four complete packages', '方案價格以一般雙扇入口、香港基本施工成本及本公司門機供應價為基礎；正式報價會按門洞尺寸、電源、結構及施工時段確認。': 'Package pricing is based on a typical bi-parting entrance, basic Hong Kong installation costs and our operator supply prices. The formal quotation will confirm dimensions, power, structure and working hours.',
    '選擇適合的門機': 'Choose the right operator', '材料及其他配件會在後續步驟選擇。': 'Materials and other components are selected in later steps.', '門機價格包含配件、路軌、基本安裝及調試；玻璃、門框、門禁及服務會在後續步驟逐項計算。': 'Operator pricing includes accessories, rail, basic installation and commissioning. Glass, frame, access and services are priced in later steps.',
    '自由選配會逐項計算材料差價。': 'Build your own pricing adds each material choice separately.', '這個套餐已經包含門機、門體材料、必要安全及基本安裝。': 'This package already includes the operator, door materials, essential safety and basic installation.',
    '方案摘要': 'Package summary', '快速方案 · 完整套餐': 'Quick package · Complete system', '核對包含內容及參考預算後，可以直接透過 WhatsApp 查詢。': 'Review what is included and the budget range, then enquire directly on WhatsApp.', '只需選擇最接近需要的一套方案。': 'Simply choose the package closest to your needs.',
    '完整包括': 'What is included', '選擇此方案': 'Choose this package', '已選擇': 'Selected', '查看方案摘要': 'View package summary', '返回選擇方式': 'Back to estimate routes', '返回套餐': 'Back to packages',
    '實用型門機': 'Practical operator', '穩定基本門機，適合一般辦公室、小型商舖及較低人流入口。': 'A reliable essential operator for offices, small shops and lighter traffic.',
    '商用靜音門機': 'Commercial quiet operator', '運作更平穩安靜，適合大部分商業入口及日常頻繁使用。': 'Smoother and quieter operation for most commercial entrances and frequent daily use.',
    '高負荷門機': 'High-duty operator', '為大堂、診所、餐飲及長時間運作環境提供更高負荷。': 'Higher-duty operation for lobbies, clinics, hospitality and long operating hours.',
    '標準門機及軌道': 'Standard operator and rail', '商用靜音門機及軌道': 'Commercial quiet operator and rail', '高負荷門機及強化軌道': 'High-duty operator and reinforced rail',
    '標準製作及安裝調試': 'Standard fabrication, installation and commissioning', '入口感應及防夾安全': 'Activation and anti-trap safety',
    '您選擇的完整方案': 'Your complete package', '您的自由選配方案': 'Your custom configuration', '估價路徑': 'Estimate route', '尚未選擇估價方式': 'No estimate route selected',
    '基礎方案': 'Base package', '門洞尺寸': 'Opening size', '門體材料': 'Door materials', '安全門禁': 'Safety & access', '安裝服務': 'Installation', '配置摘要': 'Summary',
    '工程門機': 'Scope & operator', '01 · 工程範圍及門機': '01 · Project scope & operator', '選擇工程範圍與門機': 'Choose the project scope and operator', '先決定工程範圍，再選擇適合的門機等級。': 'Choose the project scope first, then select the appropriate operator grade.',
    '01 · 工程範圍及方案': '01 · Project scope & package', '02 · 尺寸及開門方式': '02 · Size & opening format', '03 · 玻璃及門框': '03 · Glass & frame', '04 · 安全及出入控制': '04 · Safety & access control', '05 · 施工及售後服務': '05 · Installation & support', '06 · 核對配置': '06 · Review configuration',
    '先決定工程範圍': 'Choose the project scope first', '價格由實際工程內容開始計算。使用場景只協助推薦，不會加價。': 'Pricing starts with the actual work required. Your use case guides recommendations but does not add a fee.',
    '輸入現場大約尺寸': 'Enter approximate site dimensions', '毋須很準確，先提供大約門洞寬度、高度及開門方式即可。': 'An approximate opening width, height and opening format is enough to begin.',
    '選擇外觀與耐用程度': 'Choose the appearance and durability', '基礎方案已包含一組合適材料；只需決定是否升級。': 'Your base package already includes suitable materials; simply decide whether to upgrade.',
    '加入您真正需要的功能': 'Add only the functions you need', '基本感應與防夾安全已包含，門禁及後備電源可按需要增加。': 'Basic activation and anti-trap safety are included; access control and backup power are optional.',
    '安排施工與後續保養': 'Plan installation and aftercare', '標準日間安裝已包含；特殊時段、複雜現場及保養服務可另外選擇。': 'Standard daytime installation is included; special hours, complex works and maintenance are optional.',
    '您的自動門初步方案': 'Your initial automatic-door plan', '這是透明的參考區間。發送給我們後，工程人員會按現場條件確認正式報價。': 'This is a transparent budget range. Our team will confirm the formal quotation after checking site conditions.',
    '只更換門機': 'Replace operator only', '保留現有門體、門框及可用結構。': 'Retain the existing door leaves, frame and usable structure.',
    '現有門體自動化改造': 'Automate an existing door', '現有玻璃門改裝門機、感應及安全設備。': 'Add an operator, activation and safety equipment to an existing glass door.',
    '全新自動玻璃門': 'New automatic glass door', '由門機、玻璃、門框至安裝完整配置。': 'A complete operator, glass, frame and installation package.',
    '拆舊及全套重做': 'Remove and replace the full system', '拆除舊門，再重新製作及安裝完整系統。': 'Remove the old entrance, then manufacture and install a complete new system.',
    '實用方案': 'Practical package', '預算優先': 'BUDGET FIRST', '穩定基本配置，適合一般辦公室、小型商舖及較低人流入口。': 'A reliable essential setup for offices, small shops and lighter traffic.',
    '商用方案': 'Commercial package', '最多客戶選擇': 'MOST POPULAR', '門面、耐用及日常人流的平衡方案，適合大部分商業入口。': 'A balanced option for appearance, durability and everyday commercial traffic.',
    '高流量方案': 'High-traffic package', '耐用升級': 'DURABILITY UPGRADE', '為大堂、診所、餐飲及長時間運作環境預留更高負荷。': 'Higher-duty capacity for lobbies, clinics, hospitality and long operating hours.',
    '華麗高性價比方案': 'Hwa Lai value package', '自家品牌 · 最抵之選': 'OWN BRAND · BEST VALUE', '以最直接的價格提供完整基本配置，適合辦公室、小型商舖及一般商業入口。': 'Our most direct-value complete setup for offices, small shops and general commercial entrances.',
    '德雷茨實用方案': 'Dreze practical package', '穩定入門': 'RELIABLE ENTRY', '在控制預算之餘提升門機配置，適合日常中低人流入口。': 'A step up in operator specification while keeping the budget controlled, for everyday low-to-medium traffic.',
    '松下商用方案': 'Panasonic commercial package', '成熟商用選擇': 'PROVEN COMMERCIAL', '成熟品牌與商用配置的平衡，適合較頻繁使用的商舖及辦公入口。': 'A proven brand and commercial configuration for frequently used retail and office entrances.',
    '多瑪高階方案': 'dormakaba premium package', '高階耐用': 'PREMIUM DURABILITY', '適合大堂、診所、餐飲及較高人流或長時間運作環境。': 'For lobbies, clinics, hospitality, higher traffic and long operating hours.',
    '華麗自動感應門': 'Hwa Lai automatic door operator', '本公司品牌，配件及路軌齊備，以高性價比切入香港市場。': 'Our own operator brand with accessories and rail included, positioned for strong value in Hong Kong.',
    '江蘇德雷茨感應門': 'Jiangsu Dreze automatic door operator', '實用穩定配置，適合希望控制預算並提升門機級別的項目。': 'A practical, reliable setup for projects seeking a modest operator upgrade while controlling cost.',
    '松下自動感應門': 'Panasonic automatic door operator', '成熟商用品牌，適合日常較頻繁使用的入口。': 'A proven commercial brand for entrances with more frequent daily use.',
    '多瑪自動感應門': 'dormakaba automatic door operator', '高階品牌配置，適合較高人流及耐用要求。': 'A premium brand configuration for higher traffic and durability requirements.',
    '華麗門機、配件及路軌': 'Hwa Lai operator, accessories and rail', '德雷茨門機、配件及路軌': 'Dreze operator, accessories and rail', '松下門機、配件及路軌': 'Panasonic operator, accessories and rail', '多瑪門機、配件及路軌': 'dormakaba operator, accessories and rail',
    '標準強化玻璃': 'Standard toughened glass', '清晰耐用，適合一般商業入口。': 'Clear and durable for general commercial entrances.',
    '高透低鐵玻璃': 'Low-iron clear glass', '色澤更通透，門面效果更乾淨。': 'Cleaner colour and a more transparent entrance appearance.',
    '夾層安全玻璃': 'Laminated safety glass', '破裂後仍由膠膜承托，安全級別較高。': 'The interlayer retains fragments after breakage for a higher safety level.',
    '鋁合金門框': 'Aluminium frame', '輕巧實用，適合一般室內環境。': 'Lightweight and practical for general indoor environments.',
    '304 不鏽鋼門框': '304 stainless-steel frame', '外觀俐落，兼顧耐用及日常保養。': 'A clean commercial finish balancing durability and maintenance.',
    '316 不鏽鋼門框': '316 stainless-steel frame', '適合潮濕、沿海或較高耐腐蝕要求。': 'For humid, coastal or more corrosion-sensitive environments.',
    '毋須門禁': 'No access control', '保持純感應開門。': 'Keep standard sensor activation.', '拍卡門禁': 'Card access', '適合辦公室、後勤及指定人員入口。': 'For offices, back-of-house and authorised staff entrances.',
    '密碼門禁': 'Keypad access', '毋須攜帶卡片，適合小型團隊。': 'Card-free access for smaller teams.', '手機及智能門禁': 'Mobile & smart access', '支援更靈活的權限及進出管理。': 'More flexible permissions and access management.',
    '毋須後備電源': 'No backup power', '停電時按現場原有安排處理。': 'Use the site\'s existing outage arrangements.', '標準後備電源': 'Standard backup power', '提供基本停電應變能力。': 'Provides basic continuity during an outage.', '延長後備電源': 'Extended backup power', '適合需要較長應變時間的入口。': 'For entrances that require longer outage support.',
    '標準日間施工': 'Standard daytime installation', '一般工作日及已具備基本電源的現場。': 'For normal working hours and a site with basic power ready.',
    '夜間或假日施工': 'Night or holiday installation', '減少對營業或辦公時段的影響。': 'Reduces disruption during trading or office hours.',
    '複雜結構及電力工程': 'Complex structural & electrical work', '涉及額外加固、拉線或非標準收口。': 'For additional reinforcement, wiring or non-standard finishing.',
    '暫不加入保養': 'No maintenance plan for now', '日後按需要另行安排。': 'Arrange servicing separately when required.',
    '年度基礎保養': 'Annual basic maintenance', '定期檢查、清潔及基本運作調校。': 'Scheduled inspection, cleaning and basic adjustment.',
    '年度全面保養': 'Annual comprehensive maintenance', '增加預防性檢查及較完整跟進。': 'Adds preventive checks and more comprehensive follow-up.',
    '雙扇中分門': 'Bi-parting sliding door', '最常見的商業入口形式。': 'The most common commercial entrance format.',
    '單扇橫移門': 'Single sliding door', '適合較窄門洞或單向入口。': 'For narrower openings or one-way entrances.',
    '伸縮趟門': 'Telescopic sliding door', '有限牆身空間下取得較闊開口。': 'Achieves a wider clear opening where wall space is limited.',
    '已包含': 'Included', '下一步': 'Next', '上一步': 'Back', '重新開始': 'Start over', 'WhatsApp 確認方案': 'Confirm on WhatsApp',
    '工程範圍': 'Project scope', '基礎方案': 'Base package', '開門方式': 'Opening format', '玻璃': 'Glass', '門框': 'Frame', '安全': 'Safety', '門禁': 'Access control', '後備電源': 'Backup power', '施工': 'Installation', '保養': 'Maintenance',
    '入口感應＋基本防夾安全': 'Activation + basic anti-trap safety', '基本安全感應': 'Basic safety sensing',
    '先選工程範圍': 'Choose the scope first', '您需要我們處理多少？': 'How much of the entrance should we handle?', '這個選擇對預算影響最大。': 'This choice has the greatest effect on the budget.',
    '再選整體級別': 'Then choose the overall level', '選擇一個基礎方案': 'Choose a base package', '稍後仍可逐項升級。': 'You can still upgrade individual items later.',
    '以上均包含指定品牌門機、配件、路軌、基本感應、防夾安全及基本安裝調試。實際價格會按尺寸及現場條件調整。': 'All packages include the selected operator brand, accessories, rail, basic activation, anti-trap safety and basic installation commissioning. Final pricing varies with dimensions and site conditions.',
    '門洞大小': 'Opening size', '提供大約尺寸': 'Enter approximate dimensions', '以毫米 mm 輸入即可。': 'Enter dimensions in millimetres (mm).', '門洞闊度': 'Opening width', '門洞高度': 'Opening height',
    '不知道尺寸也沒關係：普通雙門可先使用 2200 × 2400 mm，稍後由我們上門覆尺。': 'Not sure of the size? Start with 2200 × 2400 mm for a typical double door; we can survey the site later.',
    '門體形式': 'Door format', '選擇開門方式': 'Choose the opening format', '玻璃選擇': 'Glass option', '通透度與安全級別': 'Clarity and safety level',
    '門框飾面': 'Frame finish', '耐用及抗腐蝕要求': 'Durability and corrosion resistance', '出入控制': 'Access control', '是否需要門禁？': 'Do you need access control?',
    '停電應變': 'Power outage response', '必要安全已包括': 'Essential safety included', '開門感應、防夾安全裝置及基本調試不另作「升級」收費。': 'Activation, anti-trap protection and basic commissioning are not charged as optional upgrades.',
    '基本感應及防夾安全已包含': 'Basic activation and anti-trap safety included', '每個方案都會配置合適的入口感應器及基本安全檢測，不會把必要安全功能變成額外收費項目。': 'Every package includes suitable activation and basic safety detection. Essential safety is never treated as an optional charge.',
    '施工安排': 'Installation arrangement', '選擇現場施工條件': 'Choose the site installation conditions', '售後服務': 'Aftercare', '是否加入保養？': 'Add a maintenance plan?',
    '初步配置完成': 'Initial configuration complete', '網站參考預算': 'Website budget range', '已包含稅項；正式報價以現場覆尺、配件型號及施工條件為準。': 'Tax included. The formal quotation depends on the site survey, component models and installation conditions.', '下一步很簡單': 'The next step is simple', '按下 WhatsApp，以上配置會自動整理成訊息。您毋須再逐項解釋，也不用立即打電話。': 'Press WhatsApp and the configuration will be prepared as a message. There is no need to explain every item or make a phone call.', 'WhatsApp 發送配置': 'Send configuration on WhatsApp',
    '查看目前配置': 'View current configuration'
  };
  const tr = function (value) { return isEnglish ? (englishCopy[value] || value) : value; };

  const money = new Intl.NumberFormat('en-HK', { maximumFractionDigits: 0 });
  const whatsappNumber = '85262813185';

  const steps = [
    {
      label: '工程門機',
      eyebrow: '01 · 工程範圍及門機',
      title: '選擇工程範圍與門機',
      description: '先決定工程範圍，再選擇適合的門機等級。'
    },
    {
      label: '門洞尺寸',
      eyebrow: '02 · 尺寸及開門方式',
      title: '輸入現場大約尺寸',
      description: '毋須很準確，先提供大約門洞寬度、高度及開門方式即可。'
    },
    {
      label: '門體材料',
      eyebrow: '03 · 玻璃及門框',
      title: '選擇外觀與耐用程度',
      description: '基礎方案已包含一組合適材料；只需決定是否升級。'
    },
    {
      label: '安全門禁',
      eyebrow: '04 · 安全及出入控制',
      title: '加入您真正需要的功能',
      description: '基本感應與防夾安全已包含，門禁及後備電源可按需要增加。'
    },
    {
      label: '安裝服務',
      eyebrow: '05 · 施工及售後服務',
      title: '安排施工與後續保養',
      description: '標準日間安裝已包含；特殊時段、複雜現場及保養服務可另外選擇。'
    },
    {
      label: '配置摘要',
      eyebrow: '06 · 核對配置',
      title: '您的自動門初步方案',
      description: '這是透明的參考區間。發送給我們後，工程人員會按現場條件確認正式報價。'
    }
  ];

  const scopeOptions = [
    { id: 'motor', name: '只更換門機', description: '保留現有門體、門框及可用結構。', from: 7800 },
    { id: 'retrofit', name: '現有門體自動化改造', description: '現有玻璃門改裝門機、感應及安全設備。', from: 10000 },
    { id: 'new', name: '全新自動玻璃門', description: '由門機、玻璃、門框至安裝完整配置。', from: 24000, recommended: true },
    { id: 'replace', name: '拆舊及全套重做', description: '拆除舊門，再重新製作及安裝完整系統。', from: 31000 }
  ];

  const packages = [
    {
      id: 'practical',
      name: '華麗高性價比方案',
      tag: '自家品牌 · 最抵之選',
      description: '以最直接的價格提供完整基本配置，適合辦公室、小型商舖及一般商業入口。',
      motorName: '華麗自動感應門',
      motorDescription: '本公司品牌，配件及路軌齊備，以高性價比切入香港市場。',
      includes: ['華麗門機、配件及路軌', '標準強化玻璃', '鋁合金門框', '入口感應及防夾安全', '標準製作及安裝調試'],
      defaults: { glass: 'clear', frame: 'aluminium' },
      recommended: true
    },
    {
      id: 'commercial',
      name: '德雷茨實用方案',
      tag: '穩定入門',
      description: '在控制預算之餘提升門機配置，適合日常中低人流入口。',
      motorName: '江蘇德雷茨感應門',
      motorDescription: '實用穩定配置，適合希望控制預算並提升門機級別的項目。',
      includes: ['德雷茨門機、配件及路軌', '標準強化玻璃', '鋁合金門框', '入口感應及防夾安全', '標準製作及安裝調試'],
      defaults: { glass: 'clear', frame: 'aluminium' }
    },
    {
      id: 'premium',
      name: '松下商用方案',
      tag: '成熟商用選擇',
      description: '成熟品牌與商用配置的平衡，適合較頻繁使用的商舖及辦公入口。',
      motorName: '松下自動感應門',
      motorDescription: '成熟商用品牌，適合日常較頻繁使用的入口。',
      includes: ['松下門機、配件及路軌', '高透低鐵玻璃', '304 不鏽鋼門框', '入口感應及防夾安全', '標準製作及安裝調試'],
      defaults: { glass: 'lowiron', frame: '304' }
    },
    {
      id: 'heavy',
      name: '多瑪高階方案',
      tag: '高階耐用',
      description: '適合大堂、診所、餐飲及較高人流或長時間運作環境。',
      motorName: '多瑪自動感應門',
      motorDescription: '高階品牌配置，適合較高人流及耐用要求。',
      includes: ['多瑪門機、配件及路軌', '夾層安全玻璃', '316 不鏽鋼門框', '入口感應及防夾安全', '標準製作及安裝調試'],
      defaults: { glass: 'laminated', frame: '316' }
    }
  ];

  const basePrices = {
    motor: { practical: [7800, 9800], commercial: [8800, 10800], premium: [11800, 14200], heavy: [14500, 17500] },
    retrofit: { practical: [10000, 15000], commercial: [11000, 16000], premium: [14000, 20000], heavy: [17000, 24000] },
    new: { practical: [24000, 34000], commercial: [26000, 37000], premium: [35000, 50000], heavy: [44000, 64000] },
    replace: { practical: [31000, 45000], commercial: [33000, 47000], premium: [42000, 59000], heavy: [51000, 74000] }
  };

  const customBasePrices = {
    motor: { practical: [7800, 9800], commercial: [8800, 10800], premium: [11800, 14200], heavy: [14500, 17500] },
    retrofit: { practical: [10000, 15000], commercial: [11000, 16000], premium: [14000, 20000], heavy: [17000, 24000] },
    new: { practical: [24000, 34000], commercial: [26000, 36000], premium: [28500, 39000], heavy: [31500, 43000] },
    replace: { practical: [31000, 45000], commercial: [33000, 47000], premium: [36000, 51000], heavy: [39000, 55000] }
  };

  const materialLevels = {
    glass: [
      { id: 'clear', name: '標準強化玻璃', description: '清晰耐用，適合一般商業入口。', price: [0, 0] },
      { id: 'lowiron', name: '高透低鐵玻璃', description: '色澤更通透，門面效果更乾淨。', price: [2000, 4000] },
      { id: 'laminated', name: '夾層安全玻璃', description: '破裂後仍由膠膜承托，安全級別較高。', price: [4500, 8000] }
    ],
    frame: [
      { id: 'aluminium', name: '鋁合金門框', description: '輕巧實用，適合一般室內環境。', price: [0, 0] },
      { id: '304', name: '304 不鏽鋼門框', description: '外觀俐落，兼顧耐用及日常保養。', price: [4500, 7500] },
      { id: '316', name: '316 不鏽鋼門框', description: '適合潮濕、沿海或較高耐腐蝕要求。', price: [8000, 13000] }
    ]
  };

  const accessOptions = [
    { id: 'none', name: '毋須門禁', description: '保持純感應開門。', price: [0, 0] },
    { id: 'card', name: '拍卡門禁', description: '適合辦公室、後勤及指定人員入口。', price: [2500, 4000] },
    { id: 'keypad', name: '密碼門禁', description: '毋須攜帶卡片，適合小型團隊。', price: [2800, 4500] },
    { id: 'smart', name: '手機及智能門禁', description: '支援更靈活的權限及進出管理。', price: [5500, 9000] }
  ];

  const backupOptions = [
    { id: 'none', name: '毋須後備電源', description: '停電時按現場原有安排處理。', price: [0, 0] },
    { id: 'standard', name: '標準後備電源', description: '提供基本停電應變能力。', price: [1000, 2000] },
    { id: 'extended', name: '延長後備電源', description: '適合需要較長應變時間的入口。', price: [2200, 4000] }
  ];

  const installationOptions = [
    { id: 'standard', name: '標準日間施工', description: '一般工作日及已具備基本電源的現場。', price: [0, 0] },
    { id: 'evening', name: '夜間或假日施工', description: '減少對營業或辦公時段的影響。', price: [3500, 6500] },
    { id: 'complex', name: '複雜結構及電力工程', description: '涉及額外加固、拉線或非標準收口。', price: [8000, 18000] }
  ];

  const maintenanceOptions = [
    { id: 'none', name: '暫不加入保養', description: '日後按需要另行安排。', price: [0, 0] },
    { id: 'annual', name: '年度基礎保養', description: '定期檢查、清潔及基本運作調校。', price: [3500, 5000] },
    { id: 'full', name: '年度全面保養', description: '增加預防性檢查及較完整跟進。', price: [5500, 8500] }
  ];

  const defaultState = {
    mode: null,
    step: 0,
    quickStage: 'packages',
    scope: 'new',
    package: 'practical',
    width: 2200,
    height: 2400,
    opening: 'double',
    glass: 'clear',
    frame: 'aluminium',
    access: 'none',
    backup: 'none',
    installation: 'standard',
    maintenance: 'none'
  };

  let state = Object.assign({}, defaultState);

  const $ = function (id) { return document.getElementById(id); };
  const findById = function (items, id) { return items.find(function (item) { return item.id === id; }); };
  const formatAmount = function (value) { return 'HK$' + money.format(value); };
  const formatRange = function (range) { return formatAmount(range[0]) + '–' + money.format(range[1]); };
  const addRange = function (total, extra) { total[0] += extra[0]; total[1] += extra[1]; };

  function applyEnglishCopy(root) {
    if (!isEnglish) return;
    root.querySelectorAll('*').forEach(function (element) {
      Array.prototype.forEach.call(element.childNodes, function (node) {
        if (node.nodeType !== 3) return;
        const original = node.nodeValue;
        const trimmed = original.trim();
        if (!trimmed) return;
        let translated = englishCopy[trimmed];
        if (!translated && trimmed.indexOf('由 HK$') === 0) translated = 'From ' + trimmed.slice(2).replace(/ 起$/, '');
        if (translated) node.nodeValue = original.replace(trimmed, translated);
      });
    });
  }

  function getPackage() { return findById(packages, state.package); }
  function getScope() { return findById(scopeOptions, state.scope); }

  function materialDelta(type) {
    if (state.mode === 'quick' || state.scope === 'motor') return [0, 0];
    return findById(materialLevels[type], state[type]).price.slice();
  }

  function dimensionDelta() {
    const total = [0, 0];
    if (state.width > 3000) addRange(total, [13000, 22000]);
    else if (state.width > 2200) addRange(total, [6000, 10000]);
    if (state.height > 3000) addRange(total, [7000, 12000]);
    else if (state.height > 2400) addRange(total, [3000, 6000]);
    if (state.opening === 'telescopic') addRange(total, [11000, 17000]);
    return total;
  }

  function calculate() {
    if (!state.mode) return [0, 0];
    if (state.mode === 'quick') return basePrices.new[state.package].slice();
    const total = customBasePrices[state.scope][state.package].slice();
    addRange(total, dimensionDelta());
    addRange(total, materialDelta('glass'));
    addRange(total, materialDelta('frame'));
    addRange(total, findById(accessOptions, state.access).price);
    addRange(total, findById(backupOptions, state.backup).price);
    addRange(total, findById(installationOptions, state.installation).price);
    addRange(total, findById(maintenanceOptions, state.maintenance).price);
    return total;
  }

  function deltaLabel(range) {
    if (!range[0] && !range[1]) return '<span class="included">已包含</span>';
    return '<span class="delta">＋' + formatRange(range) + '</span>';
  }

  function modePanel() {
    return '<section class="route-section" aria-labelledby="route-title">' +
      '<div class="route-grid">' +
        '<button type="button" class="route-card" data-mode="quick">' +
          '<span class="route-index">01</span><span class="route-copy"><small>約 1 分鐘完成</small><strong>快速選擇方案</strong><p>最快獲得完整預算</p><span>從四個已配好的完整套餐開始，門機、玻璃、門框、安全及基本安裝均已包括。</span><em>查看完整套餐</em></span>' +
        '</button>' +
        '<button type="button" class="route-card" data-mode="custom">' +
          '<span class="route-index">02</span><span class="route-copy"><small>約 3–5 分鐘完成</small><strong>自由選配</strong><p>逐項建立您的配置</p><span>按工程範圍、門機、尺寸、材料、門禁及服務逐步選擇，適合已有明確要求的項目。</span><em>開始自由選配</em></span>' +
        '</button>' +
      '</div>' +
      '<p class="route-note">不確定怎樣選？建議先使用華麗高性價比方案；價格以本公司供應價及香港基本施工成本計算，並會由工程人員按現場條件確認。</p>' +
    '</section>';
  }

  function quickPackagePanel() {
    return '<section class="choice-section quick-package-section" aria-labelledby="quick-package-title">' +
      '<div class="choice-head"><div><p class="section-kicker">四個完整套餐</p><h3 id="quick-package-title">選擇完整方案</h3></div><p>每個方案已經配好指定品牌門機、門體材料、安全裝置及基本安裝，不需要再逐項重選。</p></div>' +
      '<div class="package-list quick-package-list">' + packages.map(function (item) {
        const active = state.package === item.id;
        const price = basePrices.new[item.id];
        return '<button type="button" class="package-card quick-package-card' + (active ? ' active' : '') + '" data-quick-package="' + item.id + '" aria-pressed="' + active + '">' +
          '<span class="package-radio" aria-hidden="true"></span>' +
          '<span class="package-copy"><span class="package-tag">' + item.tag + '</span><strong>' + item.name + '</strong><small>' + item.description + '</small>' +
          '<span class="package-includes-label">完整包括</span><ul class="package-includes">' + item.includes.map(function (include) { return '<li>' + include + '</li>'; }).join('') + '</ul></span>' +
          '<span class="package-price"><small>' + (active ? '已選擇' : '選擇此方案') + '</small>' + formatRange(price) + '</span>' +
        '</button>';
      }).join('') + '</div>' +
      '<div class="included-note"><span aria-hidden="true">ⓘ</span><p>方案價格以一般雙扇入口、香港基本施工成本及本公司門機供應價為基礎；正式報價會按門洞尺寸、電源、結構及施工時段確認。</p></div>' +
    '</section>';
  }

  function scopePanel() {
    return '<section class="choice-section" aria-labelledby="scope-title">' +
      '<div class="choice-head"><div><p class="section-kicker">先選工程範圍</p><h3 id="scope-title">您需要我們處理多少？</h3></div><p>這個選擇對預算影響最大。</p></div>' +
      '<div class="scope-grid">' + scopeOptions.map(function (option) {
        const active = state.scope === option.id;
        return '<button type="button" class="scope-card' + (active ? ' active' : '') + '" data-scope="' + option.id + '" aria-pressed="' + active + '">' +
          '<span class="scope-check" aria-hidden="true"></span>' +
          '<span><strong>' + option.name + '</strong><small>' + option.description + '</small></span>' +
          '<span class="scope-from">由 ' + formatAmount(option.from) + ' 起</span>' +
        '</button>';
      }).join('') + '</div></section>' +
      '<section class="choice-section" aria-labelledby="package-title">' +
      '<div class="choice-head"><div><p class="section-kicker">門機等級</p><h3 id="package-title">選擇適合的門機</h3></div><p>材料及其他配件會在後續步驟選擇。</p></div>' +
      '<div class="package-list motor-list">' + packages.map(function (item) {
        const active = state.package === item.id;
        const price = customBasePrices[state.scope][item.id];
        return '<button type="button" class="package-card' + (active ? ' active' : '') + '" data-package="' + item.id + '" aria-pressed="' + active + '">' +
          '<span class="package-radio" aria-hidden="true"></span>' +
          '<span class="package-copy"><span class="package-tag">' + item.tag + '</span><strong>' + item.motorName + '</strong><small>' + item.motorDescription + '</small></span>' +
          '<span class="package-price">' + formatRange(price) + '</span>' +
        '</button>';
      }).join('') + '</div>' +
      '<div class="included-note"><span aria-hidden="true">ⓘ</span><p>門機價格包含配件、路軌、基本安裝及調試；玻璃、門框、門禁及服務會在後續步驟逐項計算。</p></div>' +
      '</section>';
  }

  function optionCards(items, selected, key, columns) {
    return '<div class="option-grid' + (columns === 2 ? ' two' : '') + '">' + items.map(function (item) {
      const active = selected === item.id;
      return '<button type="button" class="option-card' + (active ? ' active' : '') + '" data-key="' + key + '" data-value="' + item.id + '" aria-pressed="' + active + '">' +
        '<span class="option-radio" aria-hidden="true"></span>' +
        '<span><strong>' + item.name + '</strong><small>' + item.description + '</small></span>' +
        deltaLabel(item.price) +
      '</button>';
    }).join('') + '</div>';
  }

  function dimensionPanel() {
    const openings = [
      { id: 'double', name: '雙扇中分門', description: '最常見的商業入口形式。', price: [0, 0] },
      { id: 'single', name: '單扇橫移門', description: '適合較窄門洞或單向入口。', price: [0, 0] },
      { id: 'telescopic', name: '伸縮趟門', description: '有限牆身空間下取得較闊開口。', price: [11000, 17000] }
    ];
    return '<section class="choice-section">' +
      '<div class="choice-head"><div><p class="section-kicker">門洞大小</p><h3>提供大約尺寸</h3></div><p>以毫米 mm 輸入即可。</p></div>' +
      '<div class="dimension-form"><label class="field"><span>門洞闊度</span><span class="field-row"><input id="width-input" type="number" min="900" max="6000" step="50" value="' + state.width + '" inputmode="numeric" /><em>mm</em></span></label>' +
      '<label class="field"><span>門洞高度</span><span class="field-row"><input id="height-input" type="number" min="1900" max="4200" step="50" value="' + state.height + '" inputmode="numeric" /><em>mm</em></span></label></div>' +
      '<p class="measurement-hint">不知道尺寸也沒關係：普通雙門可先使用 2200 × 2400 mm，稍後由我們上門覆尺。</p>' +
      '</section><section class="choice-section"><div class="choice-head"><div><p class="section-kicker">門體形式</p><h3>選擇開門方式</h3></div></div>' + optionCards(openings, state.opening, 'opening', 2) + '</section>';
  }

  function availableMaterialOptions(type) {
    return materialLevels[type].map(function (item) {
      return Object.assign({}, item, { price: item.price.slice() });
    });
  }

  function materialPanel() {
    return '<section class="choice-section"><div class="choice-head"><div><p class="section-kicker">玻璃選擇</p><h3>通透度與安全級別</h3></div><p>自由選配會逐項計算材料差價。</p></div>' +
      optionCards(availableMaterialOptions('glass'), state.glass, 'glass', 2) + '</section>' +
      '<section class="choice-section"><div class="choice-head"><div><p class="section-kicker">門框飾面</p><h3>耐用及抗腐蝕要求</h3></div></div>' +
      optionCards(availableMaterialOptions('frame'), state.frame, 'frame', 2) + '</section>';
  }

  function safetyPanel() {
    return '<div class="fixed-safety"><span class="safety-icon" aria-hidden="true">✓</span><div><strong>基本感應及防夾安全已包含</strong><p>每個方案都會配置合適的入口感應器及基本安全檢測，不會把必要安全功能變成額外收費項目。</p></div></div>' +
      '<section class="choice-section"><div class="choice-head"><div><p class="section-kicker">出入控制</p><h3>是否需要門禁？</h3></div></div>' + optionCards(accessOptions, state.access, 'access', 2) + '</section>' +
      '<section class="choice-section"><div class="choice-head"><div><p class="section-kicker">停電應變</p><h3>後備電源</h3></div></div>' + optionCards(backupOptions, state.backup, 'backup', 2) + '</section>';
  }

  function servicePanel() {
    return '<section class="choice-section"><div class="choice-head"><div><p class="section-kicker">施工安排</p><h3>選擇現場施工條件</h3></div></div>' + optionCards(installationOptions, state.installation, 'installation', 2) + '</section>' +
      '<section class="choice-section"><div class="choice-head"><div><p class="section-kicker">售後服務</p><h3>是否加入保養？</h3></div></div>' + optionCards(maintenanceOptions, state.maintenance, 'maintenance', 2) + '</section>';
  }

  function summaryItems() {
    const quickItems = [
      ['估價路徑', '快速方案'],
      ['基礎方案', getPackage().name],
      ['門機等級', getPackage().motorName],
      ['玻璃', findById(materialLevels.glass, state.glass).name],
      ['門框', findById(materialLevels.frame, state.frame).name],
      ['安全', '入口感應＋基本防夾安全'],
      ['施工', '標準日間施工']
    ];
    const customItems = [
      ['估價路徑', '自由選配'],
      ['工程範圍', getScope().name],
      ['門機等級', getPackage().motorName],
      ['門洞尺寸', money.format(state.width) + ' × ' + money.format(state.height) + ' mm'],
      ['開門方式', ({ double: '雙扇中分門', single: '單扇橫移門', telescopic: '伸縮趟門' })[state.opening]],
      ['玻璃', findById(materialLevels.glass, state.glass).name],
      ['門框', findById(materialLevels.frame, state.frame).name],
      ['安全', '入口感應＋基本防夾安全'],
      ['門禁', findById(accessOptions, state.access).name],
      ['後備電源', findById(backupOptions, state.backup).name],
      ['施工', findById(installationOptions, state.installation).name],
      ['保養', findById(maintenanceOptions, state.maintenance).name]
    ];
    const items = state.mode === 'quick' ? quickItems : customItems;
    return isEnglish ? items.map(function (item) { return [tr(item[0]), tr(item[1])]; }) : items;
  }

  function summaryPanel() {
    const total = calculate();
    const heading = state.mode === 'quick' ? tr(getPackage().name) : tr(getScope().name) + ' · ' + tr(getPackage().motorName);
    return '<section class="summary-card"><div class="summary-title"><div><p class="section-kicker">初步配置完成</p><h3>' + heading + '</h3></div><span>' + formatRange(total) + '</span></div>' +
      '<div class="summary-lines">' + summaryItems().map(function (item) { return '<div class="summary-line"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>'; }).join('') + '</div>' +
      '<div class="summary-total"><span>網站參考預算</span><strong>' + formatRange(total) + '</strong><small>已包含稅項；正式報價以現場覆尺、配件型號及施工條件為準。</small></div>' +
      '<div class="summary-help"><strong>下一步很簡單</strong><p>按下 WhatsApp，以上配置會自動整理成訊息。您毋須再逐項解釋，也不用立即打電話。</p></div>' +
      '<a class="summary-whatsapp" href="' + buildWhatsAppUrl() + '" target="_blank" rel="noopener">WhatsApp 發送配置</a></section>';
  }

  function renderPanel() {
    if (!state.mode) {
      panel.innerHTML = modePanel();
      bindPanelEvents();
      return;
    }
    if (state.mode === 'quick') {
      panel.innerHTML = state.quickStage === 'summary' ? summaryPanel() : quickPackagePanel();
      bindPanelEvents();
      return;
    }
    const renderers = [scopePanel, dimensionPanel, materialPanel, safetyPanel, servicePanel, summaryPanel];
    panel.innerHTML = renderers[state.step]();
    bindPanelEvents();
  }

  function bindPanelEvents() {
    panel.querySelectorAll('[data-mode]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.mode = button.dataset.mode;
        state.step = 0;
        state.quickStage = 'packages';
        if (state.mode === 'quick') {
          state.scope = 'new';
          state.package = 'practical';
          state.glass = getPackage().defaults.glass;
          state.frame = getPackage().defaults.frame;
        }
        render();
      });
    });
    panel.querySelectorAll('[data-quick-package]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.package = button.dataset.quickPackage;
        state.glass = getPackage().defaults.glass;
        state.frame = getPackage().defaults.frame;
        render();
      });
    });
    panel.querySelectorAll('[data-scope]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.scope = button.dataset.scope;
        render();
      });
    });
    panel.querySelectorAll('[data-package]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.package = button.dataset.package;
        render();
      });
    });
    panel.querySelectorAll('[data-key]').forEach(function (button) {
      button.addEventListener('click', function () {
        state[button.dataset.key] = button.dataset.value;
        render();
      });
    });
    ['width', 'height'].forEach(function (key) {
      const input = $(key + '-input');
      if (!input) return;
      function syncDimension(shouldRender) {
        const min = Number(input.min);
        const max = Number(input.max);
        const typed = Number(input.value);
        if (!typed) return;
        const value = Math.min(max, Math.max(min, typed));
        state[key] = value;
        if (shouldRender) render();
        else updateChrome();
      }
      input.addEventListener('input', function () { syncDimension(false); });
      input.addEventListener('change', function () { syncDimension(true); });
    });
  }

  function renderSteps() {
    const stepNav = $('step-nav');
    stepNav.hidden = state.mode !== 'custom';
    if (state.mode !== 'custom') {
      stepNav.innerHTML = '';
      return;
    }
    stepNav.innerHTML = steps.map(function (step, index) {
      const active = index === state.step;
      const complete = index < state.step;
      return '<button type="button" data-step="' + index + '" class="' + (active ? 'active ' : '') + (complete ? 'complete' : '') + '"' + (active ? ' aria-current="step"' : '') + '><span>' + String(index + 1).padStart(2, '0') + '</span>' + tr(step.label) + '</button>';
    }).join('');
    stepNav.querySelectorAll('[data-step]').forEach(function (button) {
      button.addEventListener('click', function () { goToStep(Number(button.dataset.step)); });
    });
  }

  function buildWhatsAppText() {
    const total = calculate();
    if (isEnglish) {
      return [
        'Hello, I completed an initial automatic-door configuration on the Hwa Lai Engineering website:',
        '',
        summaryItems().map(function (item) { return item[0] + ': ' + item[1]; }).join('\n'),
        '',
        'Website budget range: ' + formatRange(total),
        '',
        'Please advise based on the actual dimensions, power supply and site conditions. Thank you.'
      ].join('\n');
    }
    return [
      '你好，我在華麗工程網站完成了自動門初步配置：',
      '',
      summaryItems().map(function (item) { return item[0] + '：' + item[1]; }).join('\n'),
      '',
      '網站參考預算：' + formatRange(total),
      '',
      '請按現場尺寸、電源及施工條件提供正式建議，謝謝。'
    ].join('\n');
  }

  function buildWhatsAppUrl() {
    return 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(buildWhatsAppText());
  }

  function updateChrome() {
    const actions = document.querySelector('.panel-actions');
    const resetButton = $('reset-builder');
    document.body.classList.toggle('mode-selection', !state.mode);
    actions.hidden = !state.mode;
    resetButton.hidden = !state.mode;

    if (!state.mode) {
      $('step-eyebrow').textContent = isEnglish ? 'Automatic door budget configurator' : '自動門預算配置器';
      $('page-title').textContent = tr('您想怎樣獲得預算？');
      $('page-description').textContent = tr('選擇完整套餐快速查看價格，或逐項建立符合現場需要的配置。');
      $('config-kicker').textContent = tr('開始報價');
      $('config-title').textContent = tr('選擇估價方式');
      $('config-description').textContent = tr('兩種方式都會提供清晰的參考價格，不需要先致電查詢。');
      $('purchase-selection').textContent = tr('尚未選擇估價方式');
      $('purchase-price').textContent = '—';
      $('mobile-price').textContent = '—';
      return;
    }

    const total = calculate();
    $('purchase-price').textContent = formatRange(total);
    $('mobile-price').textContent = formatRange(total);
    $('whatsapp-link').href = buildWhatsAppUrl();
    $('previous-step').disabled = false;

    if (state.mode === 'quick') {
      const summary = state.quickStage === 'summary';
      $('step-eyebrow').textContent = tr('快速方案');
      $('page-title').textContent = tr(summary ? '您選擇的完整方案' : '選擇完整方案');
      $('page-description').textContent = tr(summary ? '這個套餐已經包含門機、門體材料、必要安全及基本安裝。' : '每個方案已經配好合適的門機、門體材料、安全裝置及基本安裝，不需要再逐項重選。');
      $('config-kicker').textContent = tr(summary ? '方案摘要' : '快速方案 · 完整套餐');
      $('config-title').textContent = tr(summary ? '您選擇的完整方案' : '選擇完整方案');
      $('config-description').textContent = tr(summary ? '核對包含內容及參考預算後，可以直接透過 WhatsApp 查詢。' : '只需選擇最接近需要的一套方案。');
      $('purchase-selection').textContent = tr('快速方案') + ' · ' + tr(getPackage().name);
      $('previous-step').textContent = tr(summary ? '返回套餐' : '返回選擇方式');
      $('next-step').textContent = summary ? tr('WhatsApp 確認方案') : tr('查看方案摘要');
      $('mobile-next').textContent = summary ? 'WhatsApp' : tr('查看方案摘要');
      return;
    }

    const step = steps[state.step];
    $('step-eyebrow').textContent = isEnglish ? 'Automatic door budget configurator · Part ' + (state.step + 1) + ' of ' + steps.length : '自動門預算配置器 · 第 ' + (state.step + 1) + ' 部分（共 ' + steps.length + ' 部分）';
    $('page-title').textContent = tr(step.title);
    $('page-description').textContent = tr(step.description);
    $('config-kicker').textContent = tr(step.eyebrow);
    $('config-title').textContent = tr(step.title);
    $('config-description').textContent = tr(step.description);
    $('purchase-selection').textContent = tr(getScope().name) + ' · ' + tr(getPackage().motorName);
    $('previous-step').textContent = state.step === 0 ? tr('返回選擇方式') : tr('上一步');
    $('next-step').textContent = state.step === steps.length - 1 ? tr('WhatsApp 確認方案') : tr('下一步') + ': ' + tr(steps[state.step + 1].label);
    $('mobile-next').textContent = state.step === steps.length - 1 ? 'WhatsApp' : tr('下一步');
  }

  function goToStep(index) {
    if (index < 0 || index >= steps.length) return;
    state.step = index;
    render();
    if (window.innerWidth < 900) {
      document.querySelector('.builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function resetToRoutes() {
    state = Object.assign({}, defaultState);
    render();
  }

  function handlePrimaryAction() {
    if (!state.mode) return;
    if (state.mode === 'quick') {
      if (state.quickStage === 'summary') window.open(buildWhatsAppUrl(), '_blank', 'noopener');
      else {
        state.quickStage = 'summary';
        render();
      }
      return;
    }
    if (state.step === steps.length - 1) window.open(buildWhatsAppUrl(), '_blank', 'noopener');
    else goToStep(state.step + 1);
  }

  function render() {
    renderSteps();
    renderPanel();
    updateChrome();
    applyEnglishCopy(document);
  }

  $('reset-builder').addEventListener('click', function () {
    resetToRoutes();
  });
  $('previous-step').addEventListener('click', function () {
    if (state.mode === 'quick') {
      if (state.quickStage === 'summary') {
        state.quickStage = 'packages';
        render();
      } else resetToRoutes();
      return;
    }
    if (state.mode === 'custom' && state.step === 0) resetToRoutes();
    else goToStep(state.step - 1);
  });
  $('next-step').addEventListener('click', handlePrimaryAction);
  $('mobile-next').addEventListener('click', handlePrimaryAction);
  $('purchase-summary').addEventListener('click', function () {
    if (state.mode === 'quick') {
      state.quickStage = 'summary';
      render();
    } else if (state.mode === 'custom') goToStep(5);
  });

  render();
})();
