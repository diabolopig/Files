export const defaultDays = [
  {
    id: "day-1",
    date: "2026-09-21",
    weekday: "周一",
    city: "Dubai",
    country: "UAE",
    stay: "Al Seef Heritage Hotel Dubai",
    theme: "慢慢进入旅行节奏，老城与日落",
    accent: "#c86b3c",
    weatherKey: "dubai",
    items: [
      { id: "d1-1", time: "13:00", title: "抵达迪拜", location: "Dubai International Airport", detail: "入境、领取行李。", type: "flight", mapQuery: "Dubai International Airport", status: "已确认" },
      { id: "d1-2", time: "13:00-14:30", title: "前往酒店并入住", location: "Al Seef Heritage Hotel Dubai", detail: "搭乘出租车或地铁，放下行李后稍作休息。", type: "stay", mapQuery: "Al Seef Heritage Hotel Dubai", status: "已确认" },
      { id: "d1-3", time: "15:00-17:00", title: "漫步 Al Seef", location: "Al Seef", detail: "Dubai Creek、咖啡、老迪拜街景与拍照。", type: "walk", mapQuery: "Al Seef Dubai", status: "当天确认" },
      { id: "d1-4", time: "17:00-17:45", title: "前往 Dubai Mall", location: "BurJuman Metro Station", detail: "步行至 BurJuman，搭红线前往 Burj Khalifa / Dubai Mall。", type: "transit", mapQuery: "BurJuman Metro Station Dubai", status: "当天确认" },
      { id: "d1-5", time: "17:45-18:50", title: "Burj Khalifa 日落", location: "Burj Khalifa", detail: "日落前先找好拍照位置。", type: "photo", mapQuery: "Burj Khalifa Dubai", status: "当天确认" },
      { id: "d1-6", time: "18:50-19:15", title: "Dubai Fountain", location: "Dubai Fountain", detail: "欣赏水岸与喷泉氛围。", type: "sight", mapQuery: "Dubai Fountain", status: "出发前复查" },
      { id: "d1-7", time: "19:15-20:30", title: "Dubai Mall 晚餐", location: "Dubai Mall", detail: "轻松吃晚餐，简短逛街。", type: "food", mapQuery: "Dubai Mall", status: "当天确认" },
      { id: "d1-8", time: "20:30-21:00", title: "Burj Park 夜景", location: "Burj Park", detail: "体力允许才去拍夜景。", type: "photo", mapQuery: "Burj Park Dubai", status: "可选" },
      { id: "d1-9", time: "21:00", title: "返回酒店休息", location: "Al Seef Heritage Hotel Dubai", detail: "地铁或出租车返回，早点休息。", type: "stay", mapQuery: "Al Seef Heritage Hotel Dubai", status: "已确认" }
    ]
  },
  {
    id: "day-2",
    date: "2026-09-22",
    weekday: "周二",
    city: "Cortina",
    country: "Italy",
    stay: "B&B Hotel Passo Tre Croci Cortina",
    theme: "抵达意大利，第一眼多洛米蒂",
    accent: "#7d8d68",
    weatherKey: "cortina",
    items: [
      { id: "d2-1", time: "06:30", title: "退房", location: "Al Seef Heritage Hotel Dubai", detail: "起床、整理并退房。", type: "stay", mapQuery: "Al Seef Heritage Hotel Dubai", status: "已确认" },
      { id: "d2-2", time: "07:00-07:30", title: "前往机场", location: "Dubai International Airport", detail: "预留充足值机时间。", type: "transit", mapQuery: "Dubai International Airport", status: "已确认" },
      { id: "d2-3", time: "09:00", title: "飞往威尼斯", location: "Dubai International Airport", detail: "DXB 至 Venice，航班以确认单为准。", type: "flight", mapQuery: "Dubai International Airport", status: "已确认" },
      { id: "d2-4", time: "13:00", title: "抵达 Venice Marco Polo", location: "Venice Marco Polo Airport", detail: "入境并领取行李。", type: "flight", mapQuery: "Venice Marco Polo Airport", status: "已确认" },
      { id: "d2-5", time: "13:00-14:30", title: "领取租车", location: "Venice Marco Polo Airport Car Rental", detail: "检查车况、油量、保险及车牌。", type: "car", mapQuery: "Venice Marco Polo Airport Car Rental", status: "已确认" },
      { id: "d2-6", time: "14:30-15:00", title: "Treviso 咖啡短停", location: "Treviso", detail: "只作短暂休息，不延长停留。", type: "food", mapQuery: "Treviso Italy", status: "可选" },
      { id: "d2-7", time: "15:00-17:30", title: "驶入多洛米蒂", location: "Cortina d'Ampezzo", detail: "沿风景路线前往 Cortina。", type: "car", mapQuery: "Cortina d'Ampezzo", status: "当天确认" },
      { id: "d2-8", time: "18:15-19:00", title: "Passo Giau 日落", location: "Passo Giau", detail: "第一场山景日落，日落后风冷，带外套。", type: "photo", mapQuery: "Passo Giau Italy", status: "天气相关" },
      { id: "d2-9", time: "19:30", title: "晚餐与入住", location: "B&B Hotel Passo Tre Croci Cortina", detail: "Cortina 附近用餐后入住。", type: "stay", mapQuery: "B&B Hotel Passo Tre Croci Cortina", status: "已确认" }
    ]
  },
  {
    id: "day-3",
    date: "2026-09-23",
    weekday: "周三",
    city: "Misurina",
    country: "Italy",
    stay: "Grand Hotel Misurina",
    theme: "Braies 湖与 Tre Cime 蓝调时刻",
    accent: "#4c7b78",
    weatherKey: "misurina",
    items: [
      { id: "d3-1", time: "07:00", title: "早餐", location: "B&B Hotel Passo Tre Croci Cortina", detail: "简单吃，准时出发。07:30 出发要在 08:00 抵达较紧，建议提早。", type: "food", mapQuery: "B&B Hotel Passo Tre Croci Cortina", status: "当天确认" },
      { id: "d3-2", time: "07:30", title: "前往 Lago di Braies", location: "Lago di Braies", detail: "尽早离开，停车按现场容量分配。", type: "car", mapQuery: "Lago di Braies parking", status: "出发前复查" },
      { id: "d3-3", time: "08:00-11:00", title: "Lago di Braies 湖边慢游", location: "Lago di Braies", detail: "湖边拍摄、划船与慢节奏相处。保留充足时间，不赶行程。", type: "photo", mapQuery: "Lago di Braies", status: "已确认" },
      { id: "d3-4", time: "11:00-12:00", title: "午餐", location: "Braies", detail: "在 Braies 附近简单用餐。", type: "food", mapQuery: "Braies Italy restaurants", status: "当天确认" },
      { id: "d3-5", time: "12:30", title: "酒店入住与休息", location: "Grand Hotel Misurina", detail: "放下行李，短暂休息。", type: "stay", mapQuery: "Grand Hotel Misurina", status: "已确认" },
      { id: "d3-6", time: "14:00", title: "前往 Tre Cime", location: "Rifugio Auronzo", detail: "驾车上山。必须在线预约停车，并登记租车车牌。", type: "car", mapQuery: "Rifugio Auronzo Parking", status: "必须预约" },
      { id: "d3-7", time: "14:30-17:30", title: "Tre Cime 徒步与拍摄", location: "Tre Cime di Lavaredo", detail: "主要观景点、轻徒步与电影感山景。", type: "hike", mapQuery: "Tre Cime di Lavaredo", status: "天气相关" },
      { id: "d3-8", time: "17:30-18:30", title: "Rifugio Auronzo 休息", location: "Rifugio Auronzo", detail: "若营业则喝咖啡，准备拍日落。", type: "food", mapQuery: "Rifugio Auronzo", status: "当天确认" },
      { id: "d3-9", time: "18:30-19:35", title: "Tre Cime 日落与蓝调", location: "Tre Cime di Lavaredo", detail: "18:30 日落主拍摄，19:05 后留到蓝调时刻。", type: "photo", mapQuery: "Tre Cime di Lavaredo", status: "天气相关" },
      { id: "d3-10", time: "19:35", title: "返回 Misurina", location: "Grand Hotel Misurina", detail: "下山前向工作人员确认当晚道路关闭时间。", type: "car", mapQuery: "Grand Hotel Misurina", status: "当天确认" },
      { id: "d3-11", time: "20:30", title: "简单晚餐", location: "Misurina", detail: "晚餐后回酒店休息。", type: "food", mapQuery: "Misurina restaurants", status: "当天确认" }
    ]
  },
  {
    id: "day-4",
    date: "2026-09-24",
    weekday: "周四",
    city: "Bressanone",
    country: "Italy",
    stay: "Gerharts Premium City Living",
    theme: "Val di Funes 与 Alpe di Siusi 日落",
    accent: "#b28a52",
    weatherKey: "bressanone",
    items: [
      { id: "d4-1", time: "07:30", title: "山景早餐", location: "Grand Hotel Misurina", detail: "慢慢早餐后退房。", type: "food", mapQuery: "Grand Hotel Misurina", status: "已确认" },
      { id: "d4-2", time: "08:30-10:00", title: "前往 Val di Funes", location: "Santa Maddalena", detail: "风景转场。", type: "car", mapQuery: "Santa Maddalena Val di Funes", status: "当天确认" },
      { id: "d4-3", time: "10:00-12:00", title: "Santa Maddalena", location: "Santa Maddalena", detail: "村庄、教堂观景点与经典多洛米蒂照片。", type: "photo", mapQuery: "Santa Maddalena Val di Funes", status: "天气相关" },
      { id: "d4-4", time: "12:00-13:00", title: "悠闲午餐", location: "Val di Funes", detail: "不赶时间，补充体力。", type: "food", mapQuery: "Val di Funes restaurants", status: "当天确认" },
      { id: "d4-5", time: "13:30-14:30", title: "前往 Seiser Alm", location: "Seiser Alm Bahn", detail: "抵达缆车与停车区域。原 Word 的缆车方案保留作参考。", type: "car", mapQuery: "Alpe di Siusi-Seiser Alm Bahn Via Sciliar 39A Kastelruth", status: "出发前复查" },
      { id: "d4-6", time: "14:30-16:45", title: "Siusi 休息与机动时间", location: "Siusi allo Sciliar", detail: "因为缆车 18:00 结束，避免搭缆车后错过日落回程。", type: "rest", mapQuery: "Siusi allo Sciliar", status: "执行调整" },
      { id: "d4-7", time: "17:00", title: "驾车前往 Compatsch", location: "Compatsch", detail: "17:00 后驾车上山，提前预约 P1/P2 停车并遵守当日交通规定。", type: "car", mapQuery: "Alpe Di Siusi Via Compatsch 49 Kastelruth", status: "必须预约" },
      { id: "d4-8", time: "17:30-19:15", title: "Alpe di Siusi 日落", location: "Alpe di Siusi", detail: "草甸慢走、开阔山景与全程最重要的广角日落之一。", type: "photo", mapQuery: "Alpe di Siusi Compatsch", status: "天气相关" },
      { id: "d4-9", time: "19:30", title: "返回 Bressanone", location: "Gerharts Premium City Living", detail: "入住、晚餐与休息。", type: "stay", mapQuery: "Gerharts Premium City Living Bressanone", status: "已确认" }
    ]
  },
  {
    id: "day-5",
    date: "2026-09-25",
    weekday: "周五",
    city: "Bressanone",
    country: "Italy",
    stay: "Gerharts Premium City Living",
    theme: "Seceda 山脊与 Bressanone 老城",
    accent: "#65788a",
    weatherKey: "bressanone",
    items: [
      { id: "d5-1", time: "08:00", title: "早餐与准备", location: "Gerharts Premium City Living", detail: "带防风外套和舒适鞋。", type: "food", mapQuery: "Gerharts Premium City Living Bressanone", status: "已确认" },
      { id: "d5-2", time: "08:45-09:30", title: "前往 Ortisei", location: "Ortisei", detail: "沿山谷风景驾车。", type: "car", mapQuery: "Urtijei Ortisei", status: "当天确认" },
      { id: "d5-3", time: "09:30-10:00", title: "搭 Seceda 缆车", location: "Seceda Cableways", detail: "早点上山以减少人潮。Fermeda chairlift 已结束季节运营，路线不依赖该段。", type: "cable", mapQuery: "Seceda Cableways Ag Via Val d'Anna 2 Urtijei", status: "出发前复查" },
      { id: "d5-4", time: "10:00-14:00", title: "Seceda Ridge", location: "Seceda", detail: "主要观景点、慢拍摄与轻徒步。山区天气变化快。", type: "hike", mapQuery: "Seceda Italy", status: "天气相关" },
      { id: "d5-5", time: "14:00-15:00", title: "山景午餐", location: "Seceda 2500 m", detail: "在山上用餐，地点按当天营业情况决定。", type: "food", mapQuery: "Seceda 2500 m", status: "当天确认" },
      { id: "d5-6", time: "15:00-16:00", title: "下山与 Ortisei", location: "Ortisei", detail: "搭缆车下山，短暂逛镇。", type: "walk", mapQuery: "Urtijei Ortisei", status: "当天确认" },
      { id: "d5-7", time: "16:00-18:30", title: "Bressanone 老城", location: "Duomo di Bressanone", detail: "咖啡、老城漫步与轻松拍照。", type: "walk", mapQuery: "Duomo di Bressanone", status: "当天确认" },
      { id: "d5-8", time: "18:30", title: "晚餐与休息", location: "Bressanone", detail: "选择喜欢的餐厅，早点休息。", type: "food", mapQuery: "Bressanone restaurants", status: "当天确认" }
    ]
  },
  {
    id: "day-6",
    date: "2026-09-26",
    weekday: "周六",
    city: "Venice",
    country: "Italy",
    stay: "Anda Venice Hostel, Mestre",
    theme: "威尼斯金色时刻、贡多拉与夜色",
    accent: "#a75d52",
    weatherKey: "venice",
    items: [
      { id: "d6-1", time: "09:00", title: "离开 Bressanone", location: "Gerharts Premium City Living", detail: "退房后开车前往租车确认单指定的还车点。", type: "car", mapQuery: "Gerharts Premium City Living Bressanone", status: "已确认" },
      { id: "d6-2", time: "10:00-12:00", title: "还车与安顿行李", location: "Mestre", detail: "还车地点以确认单为准，不预设在机场。前往 Mestre 安顿行李。", type: "car", mapQuery: "Venezia Mestre", status: "出发前复查" },
      { id: "d6-3", time: "13:00", title: "进入 Venice", location: "Venezia Santa Lucia", detail: "由 Mestre 搭火车至 Venezia Santa Lucia。", type: "train", mapQuery: "Venezia Santa Lucia", status: "当天确认" },
      { id: "d6-4", time: "13:00-15:00", title: "Rialto 区域", location: "Rialto Bridge", detail: "第一段威尼斯漫步，运河、桥与巷弄。", type: "walk", mapQuery: "Rialto Bridge Venice", status: "当天确认" },
      { id: "d6-5", time: "15:00-17:00", title: "穿过威尼斯巷弄", location: "San Marco Venice", detail: "慢慢向 St Mark Square 前进。", type: "walk", mapQuery: "Piazza San Marco Venice", status: "当天确认" },
      { id: "d6-6", time: "17:00-18:30", title: "St Mark 金色时刻", location: "Piazza San Marco", detail: "广场与水岸的金色时刻拍摄。", type: "photo", mapQuery: "Piazza San Marco Venice", status: "天气相关" },
      { id: "d6-7", time: "19:00-19:35", title: "Gondola", location: "Venice Gondola", detail: "夜间收费时段，当前官方价 €110 / 35 分钟，出发前再次确认。", type: "activity", mapQuery: "Gondola Bacino Orseolo Venice", status: "出发前复查" },
      { id: "d6-8", time: "19:30-21:00", title: "晚餐", location: "Cannaregio", detail: "优先 Cannaregio 或 San Polo，避开 St Mark Square 正中心餐厅。", type: "food", mapQuery: "Cannaregio Venice restaurants", status: "当天确认" },
      { id: "d6-9", time: "21:00-22:00", title: "威尼斯夜行", location: "Venice", detail: "拍摄运河倒影与安静巷弄。", type: "photo", mapQuery: "Venice Italy", status: "可选" },
      { id: "d6-10", time: "22:00", title: "返回 Mestre", location: "Anda Venice Hostel", detail: "搭火车返回住宿。", type: "train", mapQuery: "Anda Venice Hostel Mestre", status: "已确认" }
    ]
  },
  {
    id: "day-7",
    date: "2026-09-27",
    weekday: "周日",
    city: "Venice / Dubai",
    country: "Italy / UAE",
    stay: "Ibis Styles Dubai Airport Hotel",
    theme: "清晨威尼斯与 Grand Canal",
    accent: "#58748f",
    weatherKey: "venice",
    items: [
      { id: "d7-1", time: "07:00", title: "进入 Venice", location: "Venezia Santa Lucia", detail: "由 Mestre 搭火车进入威尼斯。", type: "train", mapQuery: "Venezia Santa Lucia", status: "当天确认" },
      { id: "d7-2", time: "07:15-08:15", title: "St Mark 清晨", location: "Piazza San Marco", detail: "在人潮较少时拍摄安静广场。", type: "photo", mapQuery: "Piazza San Marco Venice", status: "天气相关" },
      { id: "d7-3", time: "08:15-09:00", title: "水岸晨光", location: "Riva degli Schiavoni", detail: "海风、柔和晨光与水岸照片。", type: "walk", mapQuery: "Riva degli Schiavoni Venice", status: "当天确认" },
      { id: "d7-4", time: "09:00-10:00", title: "早餐", location: "San Marco Venice", detail: "咖啡与最后一段悠闲的威尼斯时光。", type: "food", mapQuery: "San Marco Venice cafes", status: "当天确认" },
      { id: "d7-5", time: "10:00-11:00", title: "Vaporetto Line 1", location: "S. Marco Vallaresso", detail: "Grand Canal 路线：S. Marco Vallaresso - Rialto - Ferrovia。", type: "boat", mapQuery: "S. Marco Vallaresso ACTV", status: "出发前复查" },
      { id: "d7-6", time: "11:00-12:00", title: "返回 Mestre", location: "Anda Venice Hostel", detail: "回住宿领取行李。", type: "train", mapQuery: "Anda Venice Hostel Mestre", status: "已确认" },
      { id: "d7-7", time: "12:00-13:00", title: "简单午餐", location: "Mestre", detail: "机场前简单用餐。", type: "food", mapQuery: "Venezia Mestre restaurants", status: "当天确认" },
      { id: "d7-8", time: "13:00", title: "前往 Venice Airport", location: "Venice Marco Polo Airport", detail: "预留交通与值机时间。", type: "transit", mapQuery: "Venice Marco Polo Airport", status: "已确认" },
      { id: "d7-9", time: "15:00", title: "飞往 Dubai", location: "Venice Marco Polo Airport", detail: "航班时间以确认单为准。", type: "flight", mapQuery: "Venice Marco Polo Airport", status: "已确认" },
      { id: "d7-10", time: "22:30-23:30", title: "抵达 Dubai", location: "Dubai International Airport", detail: "入境、前往酒店并入住。", type: "flight", mapQuery: "Dubai International Airport", status: "已确认" },
      { id: "d7-11", time: "00:00", title: "可选 Dubai 夜行", location: "Dubai Creek Harbour", detail: "只在不累时去 Dubai Creek Harbour 或 Dubai Marina Walk。", type: "walk", mapQuery: "Dubai Creek Harbour", status: "可选" }
    ]
  },
  {
    id: "day-8",
    date: "2026-09-28",
    weekday: "周一",
    city: "Dubai / Kuala Lumpur",
    country: "UAE / Malaysia",
    stay: "回家",
    theme: "轻松机场日",
    accent: "#8b6a7d",
    weatherKey: "dubai",
    items: [
      { id: "d8-1", time: "08:00", title: "早餐", location: "Ibis Styles Dubai Airport Hotel", detail: "酒店内或附近简单早餐。", type: "food", mapQuery: "Ibis Styles Dubai Airport Hotel", status: "已确认" },
      { id: "d8-2", time: "09:00", title: "前往机场", location: "Dubai International Airport", detail: "不再加入景点，轻松前往机场。", type: "transit", mapQuery: "Dubai International Airport", status: "已确认" },
      { id: "d8-3", time: "10:00", title: "Dubai Airport", location: "Dubai International Airport", detail: "值机、安检，需要时简单购物。", type: "flight", mapQuery: "Dubai International Airport", status: "已确认" },
      { id: "d8-4", time: "待确认", title: "飞返 Kuala Lumpur", location: "Kuala Lumpur International Airport", detail: "长途飞行回家，时间以机票为准。", type: "flight", mapQuery: "Kuala Lumpur International Airport", status: "已确认" }
    ]
  }
];

export const defaultFixedCosts = [
  { id: "flight", name: "机票", amount: 5290 },
  { id: "emirates-seat", name: "Emirates 选位", amount: 900 },
  { id: "hotel-al-seef", name: "Al Seef Heritage Hotel Dubai", amount: 315.95 },
  { id: "hotel-passo-tre-croci", name: "B&B Hotel Passo Tre Croci Cortina", amount: 667.75 },
  { id: "hotel-misurina", name: "Grand Hotel Misurina", amount: 829.76 },
  { id: "hotel-gerharts", name: "Gerharts Premium City Living（2晚）", amount: 1665.85 },
  { id: "hotel-anda", name: "Anda Venice Hostel", amount: 455.40 },
  { id: "hotel-ibis-dubai", name: "Ibis Styles Dubai Airport", amount: 181.99 },
  { id: "hotel-tax", name: "酒店税", amount: 77 },
  { id: "car-rental", name: "租车", amount: 2150.93 },
  { id: "insurance", name: "保险", amount: 521.25 }
];

export const defaultBudgets = [
  { id: "food", name: "食物与咖啡", shortName: "食物", limit: 2000, color: "#b79557" },
  { id: "fuel", name: "油费", shortName: "油费", limit: 300, color: "#657f76" },
  { id: "parking", name: "停车", shortName: "停车", limit: 507.60, color: "#6e8d86" },
  { id: "cable-car", name: "缆车", shortName: "缆车", limit: 1363, color: "#677f9e" },
  { id: "braies-boat", name: "Lago di Braies Boat", shortName: "Braies Boat", limit: 305.50, color: "#4c7b78" },
  { id: "gondola", name: "Venice Gondola", shortName: "Gondola", limit: 517, color: "#a46d7b" }
];

export const defaultExpenses = [];

export const defaultSaves = [];

export const weatherLocations = {
  dubai: { name: "Dubai", label: "迪拜", latitude: 25.2048, longitude: 55.2708, timezone: "Asia/Dubai", typical: "28-38°C", note: "炎热干燥，室内冷气较强" },
  cortina: { name: "Cortina d'Ampezzo", label: "Cortina", latitude: 46.5405, longitude: 12.1357, timezone: "Europe/Rome", typical: "6-18°C", note: "早晚偏冷，山口风大" },
  misurina: { name: "Misurina", label: "Misurina", latitude: 46.5824, longitude: 12.2541, timezone: "Europe/Rome", typical: "3-15°C", note: "高山温差大，日落后迅速降温" },
  bressanone: { name: "Bressanone", label: "Bressanone", latitude: 46.7167, longitude: 11.65, timezone: "Europe/Rome", typical: "9-21°C", note: "市区温和，Seceda 与草甸明显更冷" },
  venice: { name: "Venice", label: "Venice", latitude: 45.4408, longitude: 12.3155, timezone: "Europe/Rome", typical: "15-24°C", note: "可能阵雨，巷道与水岸湿滑" }
};

export const bookingReminders = [
  { title: "Tre Cime 停车", detail: "在线预约 Rifugio Auronzo 停车并登记租车车牌", status: "必须预约", date: "9月23日" },
  { title: "Alpe di Siusi P1/P2", detail: "提前预约 Compatsch 停车并复查 17:00 后交通规定", status: "必须预约", date: "9月24日" },
  { title: "Seceda 缆车", detail: "主缆车预计开放，出发前再次确认天气与运营", status: "出发前复查", date: "9月25日" },
  { title: "Venice Gondola", detail: "19:00 属夜间时段，价格与上船点出发前确认", status: "出发前复查", date: "9月26日" }
];
