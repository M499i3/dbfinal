import pool from '../config/database';

// Real concert data from ChatGPT
const realConcerts = [
  {
    "artist_zh": "ZEROBASEONE",
    "artist_en": "ZEROBASEONE",
    "concert_title": "2025 ZEROBASEONE WORLD TOUR 'HERE & NOW' IN TAIPEI",
    "date": "2025-12-06",
    "start_time": "19:30",
    "end_time": "22:30",
    "venue_name": "台北小巨蛋",
    "venue_city": "台北市",
    "venue_address": "台北市松山區南京東路四段2號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "搖滾A區", "price": 6881, "rows": 40, "cols": 35 },
      { "zone_name": "搖滾B區", "price": 6281, "rows": 40, "cols": 35 },
      { "zone_name": "VIP區", "price": 5789, "rows": 20, "cols": 30 },
      { "zone_name": "看台A區", "price": 3989, "rows": 30, "cols": 40 },
      { "zone_name": "看台B區", "price": 3589, "rows": 35, "cols": 45 },
      { "zone_name": "看台C區", "price": 799, "rows": 25, "cols": 50 }
    ]
  },
  {
    "artist_zh": "李千娜",
    "artist_en": "Lii",
    "concert_title": "入戲 李千娜 2025 台北演唱會",
    "date": "2025-12-06",
    "start_time": "19:30",
    "end_time": "22:00",
    "venue_name": "台北國際會議中心",
    "venue_city": "台北市",
    "venue_address": "台北市信義區信義路五段1號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "VIP區", "price": 3980, "rows": 15, "cols": 25 },
      { "zone_name": "A區", "price": 3680, "rows": 20, "cols": 30 },
      { "zone_name": "B區", "price": 3280, "rows": 25, "cols": 35 },
      { "zone_name": "C區", "price": 2880, "rows": 30, "cols": 40 },
      { "zone_name": "D區", "price": 1880, "rows": 35, "cols": 45 },
      { "zone_name": "E區", "price": 1280, "rows": 40, "cols": 50 }
    ]
  },
  {
    "artist_zh": "洪佩瑜",
    "artist_en": "Hung Pei-Yu",
    "concert_title": "洪佩瑜《開》巡迴演唱會 台北站",
    "date": "2025-12-06",
    "start_time": "19:30",
    "end_time": "22:00",
    "venue_name": "台北流行音樂中心",
    "venue_city": "台北市",
    "venue_address": "台北市南港區市民大道八段99號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "搖滾區", "price": 3680, "rows": 30, "cols": 25 },
      { "zone_name": "A區", "price": 3280, "rows": 25, "cols": 30 },
      { "zone_name": "B區", "price": 2680, "rows": 30, "cols": 35 },
      { "zone_name": "C區", "price": 2280, "rows": 35, "cols": 40 },
      { "zone_name": "D區", "price": 1880, "rows": 40, "cols": 45 }
    ]
  },
  {
    "artist_zh": "Sweet John",
    "artist_en": "Sweet John",
    "concert_title": "GOOD AFTERNIGHT",
    "date": "2025-12-06",
    "start_time": "19:30",
    "end_time": "22:00",
    "venue_name": "Legacy TERA",
    "venue_city": "新北市",
    "venue_address": "新北市新莊區新北大道四段3號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "搖滾區", "price": 2226, "rows": 20, "cols": 15 },
      { "zone_name": "看台區", "price": 1515, "rows": 15, "cols": 20 },
      { "zone_name": "後排區", "price": 1234, "rows": 10, "cols": 25 },
      { "zone_name": "站票區", "price": 600, "rows": 5, "cols": 30 }
    ]
  },
  {
    "artist_zh": "Asia Artist Awards",
    "artist_en": "AAA 2025",
    "concert_title": "2025 Asia Artist Awards in TAIWAN",
    "date": "2025-12-06",
    "start_time": "18:00",
    "end_time": "23:00",
    "venue_name": "高雄國家體育場",
    "venue_city": "高雄市",
    "venue_address": "高雄市左營區世運大道100號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "VVIP區", "price": 5980, "rows": 30, "cols": 40 },
      { "zone_name": "VIP區", "price": 4980, "rows": 40, "cols": 50 },
      { "zone_name": "特A區", "price": 3980, "rows": 50, "cols": 60 },
      { "zone_name": "A區", "price": 2980, "rows": 60, "cols": 70 },
      { "zone_name": "B區", "price": 1980, "rows": 70, "cols": 80 },
      { "zone_name": "C區", "price": 2490, "rows": 60, "cols": 75 }
    ]
  },
  {
    "artist_zh": "ACON",
    "artist_en": "ACON 2025",
    "concert_title": "ACON 2025 亞洲音樂祭",
    "date": "2025-12-07",
    "start_time": "16:00",
    "end_time": "23:00",
    "venue_name": "高雄國家體育場",
    "venue_city": "高雄市",
    "venue_address": "高雄市左營區世運大道100號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "黃金搖滾區", "price": 3588, "rows": 50, "cols": 40 },
      { "zone_name": "搖滾區", "price": 2588, "rows": 60, "cols": 50 },
      { "zone_name": "看台A區", "price": 1588, "rows": 70, "cols": 60 },
      { "zone_name": "看台B區", "price": 1088, "rows": 80, "cols": 70 },
      { "zone_name": "看台C區", "price": 888, "rows": 90, "cols": 80 },
      { "zone_name": "站票區", "price": 1288, "rows": 60, "cols": 90 }
    ]
  },
  {
    "artist_zh": "MAN WITH A MISSION",
    "artist_en": "MAN WITH A MISSION",
    "concert_title": "MAN WITH A MISSION WORLD TOUR 2025 TAIPEI",
    "date": "2025-12-07",
    "start_time": "18:00",
    "end_time": "21:00",
    "venue_name": "Legacy TERA",
    "venue_city": "新北市",
    "venue_address": "新北市新莊區新北大道四段3號",
    "ticket_platform": "遠大售票",
    "seat_zones": [
      { "zone_name": "搖滾區", "price": 3800, "rows": 20, "cols": 18 },
      { "zone_name": "看台區", "price": 3400, "rows": 18, "cols": 22 },
      { "zone_name": "後排區", "price": 2900, "rows": 15, "cols": 25 }
    ]
  },
  {
    "artist_zh": "AKASAKI",
    "artist_en": "AKASAKI",
    "concert_title": "AKASAKI LIVE IN TAIPEI 2025",
    "date": "2025-12-07",
    "start_time": "18:00",
    "end_time": "21:00",
    "venue_name": "Legacy Taipei",
    "venue_city": "台北市",
    "venue_address": "台北市八德路一段1號",
    "ticket_platform": "遠大售票",
    "seat_zones": [
      { "zone_name": "搖滾區", "price": 2400, "rows": 15, "cols": 20 },
      { "zone_name": "看台區", "price": 1200, "rows": 20, "cols": 25 }
    ]
  },
  {
    "artist_zh": "YUZU 柚子樂團",
    "artist_en": "YUZU",
    "concert_title": "YUZU 亞洲巡迴演唱會 2025「Get Back」台北站",
    "date": "2025-12-08",
    "start_time": "20:00",
    "end_time": "22:30",
    "venue_name": "Zepp New Taipei",
    "venue_city": "新北市",
    "venue_address": "新北市新莊區新北大道四段3號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "搖滾區", "price": 3800, "rows": 25, "cols": 20 },
      { "zone_name": "看台區", "price": 3000, "rows": 20, "cols": 30 }
    ]
  },
  {
    "artist_zh": "TV Girl",
    "artist_en": "TV Girl",
    "concert_title": "TV Girl \"Perform Their Hits Live\"",
    "date": "2025-12-09",
    "start_time": "20:00",
    "end_time": "22:00",
    "venue_name": "Legacy Taipei",
    "venue_city": "台北市",
    "venue_address": "台北市八德路一段1號",
    "ticket_platform": "拓元售票",
    "seat_zones": [
      { "zone_name": "搖滾區", "price": 1900, "rows": 18, "cols": 22 },
      { "zone_name": "看台區", "price": 950, "rows": 15, "cols": 25 }
    ]
  },
  {
    "artist_zh": "唱 我們的歌 金曲再現演唱會",
    "artist_en": "Golden Melody Revisited",
    "concert_title": "2025「唱 我們的歌」金曲再現演唱會「原來我們現在還愛著」",
    "date": "2025-12-12",
    "start_time": "19:30",
    "end_time": "22:00",
    "venue_name": "台北流行音樂中心",
    "venue_city": "台北市",
    "venue_address": "台北市南港區市民大道八段99號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "搖滾區", "price": 2000, "rows": 25, "cols": 22 },
      { "zone_name": "A區", "price": 1800, "rows": 28, "cols": 25 },
      { "zone_name": "B區", "price": 1600, "rows": 30, "cols": 30 },
      { "zone_name": "C區", "price": 1200, "rows": 35, "cols": 35 },
      { "zone_name": "D區", "price": 900, "rows": 40, "cols": 40 },
      { "zone_name": "E區", "price": 800, "rows": 45, "cols": 45 }
    ]
  },
  {
    "artist_zh": "BEGIN",
    "artist_en": "BEGIN",
    "concert_title": "BEGIN SPECIAL LIVE in TAIPEI",
    "date": "2025-12-13",
    "start_time": "19:00",
    "end_time": "21:30",
    "venue_name": "Legacy Taipei",
    "venue_city": "台北市",
    "venue_address": "台北市八德路一段1號",
    "ticket_platform": "遠大售票",
    "seat_zones": [
      { "zone_name": "搖滾區", "price": 3200, "rows": 20, "cols": 20 }
    ]
  },
  {
    "artist_zh": "羅志祥",
    "artist_en": "Show Lo",
    "concert_title": "2025羅志祥30巡迴演唱會－台北站（第一場）",
    "date": "2025-12-13",
    "start_time": "19:30",
    "end_time": "22:30",
    "venue_name": "台北小巨蛋",
    "venue_city": "台北市",
    "venue_address": "台北市松山區南京東路四段2號",
    "ticket_platform": "寬宏售票",
    "seat_zones": [
      { "zone_name": "搖滾A區", "price": 4680, "rows": 35, "cols": 30 },
      { "zone_name": "搖滾B區", "price": 4280, "rows": 35, "cols": 30 },
      { "zone_name": "VIP區", "price": 3880, "rows": 25, "cols": 28 },
      { "zone_name": "看台A區", "price": 3480, "rows": 30, "cols": 35 },
      { "zone_name": "看台B區", "price": 2880, "rows": 35, "cols": 40 },
      { "zone_name": "看台C區", "price": 2480, "rows": 40, "cols": 45 },
      { "zone_name": "看台D區", "price": 1880, "rows": 45, "cols": 50 },
      { "zone_name": "站票區", "price": 800, "rows": 20, "cols": 60 }
    ]
  },
  {
    "artist_zh": "羅志祥",
    "artist_en": "Show Lo",
    "concert_title": "2025羅志祥30巡迴演唱會－台北站（第二場）",
    "date": "2025-12-14",
    "start_time": "18:00",
    "end_time": "22:00",
    "venue_name": "台北小巨蛋",
    "venue_city": "台北市",
    "venue_address": "台北市松山區南京東路四段2號",
    "ticket_platform": "寬宏售票",
    "seat_zones": [
      { "zone_name": "搖滾A區", "price": 4680, "rows": 35, "cols": 30 },
      { "zone_name": "搖滾B區", "price": 4280, "rows": 35, "cols": 30 },
      { "zone_name": "VIP區", "price": 3880, "rows": 25, "cols": 28 },
      { "zone_name": "看台A區", "price": 3480, "rows": 30, "cols": 35 },
      { "zone_name": "看台B區", "price": 2880, "rows": 35, "cols": 40 },
      { "zone_name": "看台C區", "price": 2480, "rows": 40, "cols": 45 },
      { "zone_name": "看台D區", "price": 1880, "rows": 45, "cols": 50 },
      { "zone_name": "站票區", "price": 800, "rows": 20, "cols": 60 }
    ]
  },
  {
    "artist_zh": "國蛋 GorDoN",
    "artist_en": "GorDoN",
    "concert_title": "GorDoN「MICRO SAUNA」高雄場",
    "date": "2025-12-13",
    "start_time": "19:30",
    "end_time": "22:00",
    "venue_name": "後台 Backstage Live",
    "venue_city": "高雄市",
    "venue_address": "高雄市鼓山區美術東二路370號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "VIP區", "price": 2600, "rows": 10, "cols": 12 },
      { "zone_name": "搖滾區", "price": 1380, "rows": 15, "cols": 18 },
      { "zone_name": "看台區", "price": 1800, "rows": 12, "cols": 20 },
      { "zone_name": "站票區", "price": 690, "rows": 8, "cols": 25 }
    ]
  },
  {
    "artist_zh": "國蛋 GorDoN",
    "artist_en": "GorDoN",
    "concert_title": "GorDoN「MICRO SAUNA」台中場",
    "date": "2025-12-14",
    "start_time": "19:00",
    "end_time": "22:00",
    "venue_name": "Legacy Taichung",
    "venue_city": "台中市",
    "venue_address": "台中市西屯區安和路117號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "VIP區", "price": 2600, "rows": 10, "cols": 15 },
      { "zone_name": "搖滾區", "price": 1380, "rows": 15, "cols": 20 },
      { "zone_name": "看台區", "price": 1800, "rows": 12, "cols": 22 },
      { "zone_name": "站票區", "price": 690, "rows": 8, "cols": 28 }
    ]
  },
  {
    "artist_zh": "千葉雄喜",
    "artist_en": "Yuki Chiba",
    "concert_title": "Yuki Chiba LIVE IN TAIPEI 2025",
    "date": "2025-12-14",
    "start_time": "20:00",
    "end_time": "22:30",
    "venue_name": "Legacy TERA",
    "venue_city": "新北市",
    "venue_address": "新北市新莊區新北大道四段3號",
    "ticket_platform": "遠大售票",
    "seat_zones": [
      { "zone_name": "Wonderful Zone", "price": 3180, "rows": 18, "cols": 20 },
      { "zone_name": "GA Zone", "price": 2480, "rows": 20, "cols": 25 },
      { "zone_name": "身障/陪同席", "price": 1000, "rows": 5, "cols": 5 }
    ]
  },
  {
    "artist_zh": "岡崎體育",
    "artist_en": "Okazaki Taiiku",
    "concert_title": "岡崎體育 WORLD TOUR FINAL in TAIPEI",
    "date": "2025-12-14",
    "start_time": "20:00",
    "end_time": "22:30",
    "venue_name": "Legacy Taipei",
    "venue_city": "台北市",
    "venue_address": "台北市八德路一段1號",
    "ticket_platform": "拓元售票",
    "seat_zones": [
      { "zone_name": "搖滾區", "price": 1700, "rows": 18, "cols": 20 },
      { "zone_name": "看台區", "price": 1600, "rows": 15, "cols": 22 },
      { "zone_name": "身障席", "price": 850, "rows": 5, "cols": 5 }
    ]
  },
  {
    "artist_zh": "逗陣的 全方位樂團",
    "artist_en": "All-round Band 30th",
    "concert_title": "逗陣的 全方位樂團30年演唱會",
    "date": "2025-12-17",
    "start_time": "19:30",
    "end_time": "22:00",
    "venue_name": "Legacy TERA",
    "venue_city": "新北市",
    "venue_address": "新北市新莊區新北大道四段3號",
    "ticket_platform": "寬宏售票",
    "seat_zones": [
      { "zone_name": "全區", "price": 2580, "rows": 25, "cols": 30 }
    ]
  },
  {
    "artist_zh": "OneRepublic",
    "artist_en": "OneRepublic",
    "concert_title": "OneRepublic 2025 Live in Kaohsiung",
    "date": "2025-12-19",
    "start_time": "18:00",
    "end_time": "22:00",
    "venue_name": "高雄巨蛋",
    "venue_city": "高雄市",
    "venue_address": "高雄市左營區博愛二路757號",
    "ticket_platform": "拓元售票",
    "seat_zones": [
      { "zone_name": "搖滾A區", "price": 4900, "rows": 35, "cols": 32 },
      { "zone_name": "搖滾B區", "price": 3900, "rows": 35, "cols": 32 },
      { "zone_name": "VIP區", "price": 3800, "rows": 28, "cols": 30 },
      { "zone_name": "看台A區", "price": 3400, "rows": 32, "cols": 38 },
      { "zone_name": "看台B區", "price": 2900, "rows": 38, "cols": 42 },
      { "zone_name": "看台C區", "price": 2400, "rows": 42, "cols": 46 },
      { "zone_name": "看台D區", "price": 1700, "rows": 46, "cols": 50 },
      { "zone_name": "看台E區", "price": 1200, "rows": 50, "cols": 55 }
    ]
  },
  {
    "artist_zh": "橘色惡魔 × 翡翠騎士",
    "artist_en": "Kyoto Tachibana x Tokyo Noko",
    "concert_title": "橘色惡魔 X 翡翠騎士 行進管樂大共演",
    "date": "2025-12-19",
    "start_time": "19:00",
    "end_time": "21:30",
    "venue_name": "台北和平籃球館",
    "venue_city": "台北市",
    "venue_address": "台北市大安區臥龍街288號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "特A區", "price": 2800, "rows": 25, "cols": 30 },
      { "zone_name": "A區", "price": 2500, "rows": 28, "cols": 32 },
      { "zone_name": "B區", "price": 2200, "rows": 30, "cols": 35 },
      { "zone_name": "C區", "price": 2000, "rows": 32, "cols": 38 },
      { "zone_name": "D區", "price": 1800, "rows": 35, "cols": 40 },
      { "zone_name": "E區", "price": 1500, "rows": 38, "cols": 42 },
      { "zone_name": "F區", "price": 1200, "rows": 40, "cols": 45 },
      { "zone_name": "G區", "price": 900, "rows": 42, "cols": 48 },
      { "zone_name": "輪椅席/陪同席", "price": 600, "rows": 10, "cols": 10 }
    ]
  },
  {
    "artist_zh": "玟星 Moon Byul",
    "artist_en": "Moon Byul",
    "concert_title": "Moon Byul CONCERT TOUR「MUSEUM : village of eternal glow」IN KAOHSIUNG",
    "date": "2025-12-20",
    "start_time": "18:00",
    "end_time": "21:00",
    "venue_name": "高雄流行音樂中心",
    "venue_city": "高雄市",
    "venue_address": "高雄市鹽埕區真愛路1號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "VVIP區", "price": 5600, "rows": 15, "cols": 20 },
      { "zone_name": "VIP區", "price": 4600, "rows": 20, "cols": 25 },
      { "zone_name": "A區", "price": 3600, "rows": 25, "cols": 30 },
      { "zone_name": "身障席A", "price": 2300, "rows": 8, "cols": 8 },
      { "zone_name": "身障席B", "price": 1800, "rows": 8, "cols": 8 }
    ]
  },
  {
    "artist_zh": "五月天",
    "artist_en": "Mayday",
    "concert_title": "#5525+1 回到那一天 25週年巡迴演唱會 台中站・新年快樂版",
    "date": "2025-12-27",
    "start_time": "19:00",
    "end_time": "23:00",
    "venue_name": "台中洲際棒球場",
    "venue_city": "台中市",
    "venue_address": "台中市北屯區崇德路三段833號",
    "ticket_platform": "拓元售票",
    "seat_zones": [
      { "zone_name": "黃金搖滾區", "price": 4580, "rows": 45, "cols": 40 },
      { "zone_name": "搖滾區", "price": 3880, "rows": 50, "cols": 45 },
      { "zone_name": "VIP看台", "price": 3280, "rows": 40, "cols": 50 },
      { "zone_name": "內野看台", "price": 2880, "rows": 50, "cols": 55 },
      { "zone_name": "外野A看台", "price": 2280, "rows": 55, "cols": 60 },
      { "zone_name": "外野B看台", "price": 1880, "rows": 60, "cols": 65 },
      { "zone_name": "外野C看台", "price": 1280, "rows": 65, "cols": 70 }
    ]
  },
  {
    "artist_zh": "五月天",
    "artist_en": "Mayday",
    "concert_title": "#5525+1 回到那一天 25週年巡迴演唱會 台中站・新年快樂版",
    "date": "2025-12-28",
    "start_time": "19:00",
    "end_time": "23:00",
    "venue_name": "台中洲際棒球場",
    "venue_city": "台中市",
    "venue_address": "台中市北屯區崇德路三段833號",
    "ticket_platform": "拓元售票",
    "seat_zones": [
      { "zone_name": "黃金搖滾區", "price": 4580, "rows": 45, "cols": 40 },
      { "zone_name": "搖滾區", "price": 3880, "rows": 50, "cols": 45 },
      { "zone_name": "VIP看台", "price": 3280, "rows": 40, "cols": 50 },
      { "zone_name": "內野看台", "price": 2880, "rows": 50, "cols": 55 },
      { "zone_name": "外野A看台", "price": 2280, "rows": 55, "cols": 60 },
      { "zone_name": "外野B看台", "price": 1880, "rows": 60, "cols": 65 },
      { "zone_name": "外野C看台", "price": 1280, "rows": 65, "cols": 70 }
    ]
  },
  {
    "artist_zh": "蔡依林",
    "artist_en": "Jolin Tsai",
    "concert_title": "JOLIN『PLEASURE』WORLD TOUR 台北大巨蛋 2025-2026（首場）",
    "date": "2025-12-30",
    "start_time": "19:30",
    "end_time": "23:00",
    "venue_name": "台北大巨蛋",
    "venue_city": "台北市",
    "venue_address": "台北市信義區忠孝東路四段515號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "黃金搖滾區", "price": 6990, "rows": 50, "cols": 45 },
      { "zone_name": "搖滾區", "price": 5990, "rows": 55, "cols": 50 },
      { "zone_name": "VIP區", "price": 4990, "rows": 45, "cols": 55 },
      { "zone_name": "看台A區", "price": 3990, "rows": 60, "cols": 65 },
      { "zone_name": "看台B區", "price": 2990, "rows": 70, "cols": 75 },
      { "zone_name": "看台C區", "price": 990, "rows": 80, "cols": 85 }
    ]
  },
  {
    "artist_zh": "五月天",
    "artist_en": "Mayday",
    "concert_title": "#5525+1 回到那一天 25週年巡迴演唱會 台中站・新年快樂版（跨年場）",
    "date": "2025-12-31",
    "start_time": "19:00",
    "end_time": "01:00",
    "venue_name": "台中洲際棒球場",
    "venue_city": "台中市",
    "venue_address": "台中市北屯區崇德路三段833號",
    "ticket_platform": "拓元售票",
    "seat_zones": [
      { "zone_name": "黃金搖滾區", "price": 5580, "rows": 45, "cols": 40 },
      { "zone_name": "搖滾區", "price": 4580, "rows": 50, "cols": 45 },
      { "zone_name": "VIP看台", "price": 3880, "rows": 40, "cols": 50 },
      { "zone_name": "內野看台", "price": 3280, "rows": 50, "cols": 55 },
      { "zone_name": "外野A看台", "price": 2880, "rows": 55, "cols": 60 },
      { "zone_name": "外野B看台", "price": 2280, "rows": 60, "cols": 65 },
      { "zone_name": "外野C看台", "price": 1880, "rows": 65, "cols": 70 }
    ]
  },
  {
    "artist_zh": "蔡依林",
    "artist_en": "Jolin Tsai",
    "concert_title": "JOLIN『PLEASURE』WORLD TOUR 台北大巨蛋 2025-2026（第二場）",
    "date": "2025-12-31",
    "start_time": "19:30",
    "end_time": "23:00",
    "venue_name": "台北大巨蛋",
    "venue_city": "台北市",
    "venue_address": "台北市信義區忠孝東路四段515號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "黃金搖滾區", "price": 6990, "rows": 50, "cols": 45 },
      { "zone_name": "搖滾區", "price": 5990, "rows": 55, "cols": 50 },
      { "zone_name": "VIP區", "price": 4990, "rows": 45, "cols": 55 },
      { "zone_name": "看台A區", "price": 3990, "rows": 60, "cols": 65 },
      { "zone_name": "看台B區", "price": 2990, "rows": 70, "cols": 75 },
      { "zone_name": "看台C區", "price": 990, "rows": 80, "cols": 85 }
    ]
  },
  {
    "artist_zh": "五月天",
    "artist_en": "Mayday",
    "concert_title": "#5525+1 回到那一天 25週年巡迴演唱會 台中站・新年快樂版",
    "date": "2026-01-01",
    "start_time": "19:00",
    "end_time": "23:00",
    "venue_name": "台中洲際棒球場",
    "venue_city": "台中市",
    "venue_address": "台中市北屯區崇德路三段833號",
    "ticket_platform": "拓元售票",
    "seat_zones": [
      { "zone_name": "黃金搖滾區", "price": 4580, "rows": 45, "cols": 40 },
      { "zone_name": "搖滾區", "price": 3880, "rows": 50, "cols": 45 },
      { "zone_name": "VIP看台", "price": 3280, "rows": 40, "cols": 50 },
      { "zone_name": "內野看台", "price": 2880, "rows": 50, "cols": 55 },
      { "zone_name": "外野A看台", "price": 2280, "rows": 55, "cols": 60 },
      { "zone_name": "外野B看台", "price": 1880, "rows": 60, "cols": 65 },
      { "zone_name": "外野C看台", "price": 1280, "rows": 65, "cols": 70 }
    ]
  },
  {
    "artist_zh": "蔡依林",
    "artist_en": "Jolin Tsai",
    "concert_title": "JOLIN『PLEASURE』WORLD TOUR 台北大巨蛋 2025-2026（第三場）",
    "date": "2026-01-01",
    "start_time": "19:30",
    "end_time": "23:00",
    "venue_name": "台北大巨蛋",
    "venue_city": "台北市",
    "venue_address": "台北市信義區忠孝東路四段515號",
    "ticket_platform": "KKTIX",
    "seat_zones": [
      { "zone_name": "黃金搖滾區", "price": 6990, "rows": 50, "cols": 45 },
      { "zone_name": "搖滾區", "price": 5990, "rows": 55, "cols": 50 },
      { "zone_name": "VIP區", "price": 4990, "rows": 45, "cols": 55 },
      { "zone_name": "看台A區", "price": 3990, "rows": 60, "cols": 65 },
      { "zone_name": "看台B區", "price": 2990, "rows": 70, "cols": 75 },
      { "zone_name": "看台C區", "price": 990, "rows": 80, "cols": 85 }
    ]
  },
  {
    "artist_zh": "五月天",
    "artist_en": "Mayday",
    "concert_title": "#5525+1 回到那一天 25週年巡迴演唱會 台中站・新年快樂版",
    "date": "2026-01-03",
    "start_time": "19:00",
    "end_time": "23:00",
    "venue_name": "台中洲際棒球場",
    "venue_city": "台中市",
    "venue_address": "台中市北屯區崇德路三段833號",
    "ticket_platform": "拓元售票",
    "seat_zones": [
      { "zone_name": "黃金搖滾區", "price": 4580, "rows": 45, "cols": 40 },
      { "zone_name": "搖滾區", "price": 3880, "rows": 50, "cols": 45 },
      { "zone_name": "VIP看台", "price": 3280, "rows": 40, "cols": 50 },
      { "zone_name": "內野看台", "price": 2880, "rows": 50, "cols": 55 },
      { "zone_name": "外野A看台", "price": 2280, "rows": 55, "cols": 60 },
      { "zone_name": "外野B看台", "price": 1880, "rows": 60, "cols": 65 },
      { "zone_name": "外野C看台", "price": 1280, "rows": 65, "cols": 70 }
    ]
  }
];

// Chinese surnames and given names for realistic user generation
const surnames = ['陳', '林', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '郭', '林', '周', '徐', '朱', '曾', '呂'];
const givenNames = ['冠廷', '雅婷', '建國', '小美', '志豪', '淑芬', '俊傑', '佳穎', '大明', '筱涵', '宗翰', '怡君', '家豪', '欣怡', '彥廷', '婷婷', '文彥', '雨萱', '承翰', '詩涵'];

function generateChineseName(): string {
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const given = givenNames[Math.floor(Math.random() * givenNames.length)];
  return surname + given;
}

function generateEmail(name: string, index: number): string {
  const domains = ['gmail.com', 'yahoo.com.tw', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const pinyin = `user${index}`;
  return `${pinyin}@${domain}`;
}

function generatePhone(): string {
  return `09${Math.floor(10000000 + Math.random() * 90000000)}`;
}

// Generate seat label (e.g., "A區-12-25")
function generateSeatLabel(zoneName: string, row: number, col: number): string {
  return `${zoneName}-${row}-${col}`;
}

async function generateLargeDataset() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 開始生成大型資料集...\n');
    
    // Step 1: Get existing users
    console.log('📊 Step 1: 檢查現有用戶...');
    const existingUsersResult = await client.query('SELECT user_id, name FROM "user" ORDER BY user_id');
    const existingUsers = existingUsersResult.rows;
    console.log(`   ✅ 現有用戶: ${existingUsers.length} 位`);
    
    // Step 2: Generate 993 new users
    console.log('\n👥 Step 2: 生成 993 位新用戶...');
    const newUsers: any[] = [];
    const userDistribution = [
      { count: 250, minTickets: 1, maxTickets: 1, kycLevel: 0 },     // Casual: 1 ticket
      { count: 200, minTickets: 2, maxTickets: 2, kycLevel: 1 },     // Casual: 2 tickets
      { count: 150, minTickets: 3, maxTickets: 4, kycLevel: 1 },     // Casual: 3-4 tickets
      { count: 100, minTickets: 5, maxTickets: 8, kycLevel: 1 },     // Active: 5-8
      { count: 80, minTickets: 9, maxTickets: 15, kycLevel: 1 },     // Active: 9-15
      { count: 70, minTickets: 16, maxTickets: 25, kycLevel: 2 },    // Active: 16-25
      { count: 50, minTickets: 26, maxTickets: 40, kycLevel: 2 },    // Power: 26-40
      { count: 50, minTickets: 41, maxTickets: 60, kycLevel: 2 },    // Power: 41-60
      { count: 30, minTickets: 61, maxTickets: 100, kycLevel: 0 },   // Scalper: 61-100
      { count: 13, minTickets: 101, maxTickets: 150, kycLevel: 0 },  // Scalper: 101-150
    ];

    let userIndex = 8; // Start after existing 7 users
    
    for (const dist of userDistribution) {
      for (let i = 0; i < dist.count; i++) {
        const name = generateChineseName();
        const email = generateEmail(name, userIndex);
        const phone = generatePhone();
        const ticketCount = Math.floor(Math.random() * (dist.maxTickets - dist.minTickets + 1)) + dist.minTickets;
        
        const userResult = await client.query(
          `INSERT INTO "user" (name, email, phone, password_hash, kyc_level)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING user_id`,
          [name, email, phone, '$2b$10$defaulthash', dist.kycLevel]
        );
        
        // Add User role
        await client.query(
          `INSERT INTO user_role (user_id, role) VALUES ($1, 'User')`,
          [userResult.rows[0].user_id]
        );
        
        newUsers.push({
          userId: userResult.rows[0].user_id,
          name,
          ticketCount,
          kycLevel: dist.kycLevel
        });
        
        userIndex++;
        
        if (userIndex % 100 === 0) {
          console.log(`   進度: ${userIndex - 7}/993 用戶已建立...`);
        }
      }
    }
    
    console.log(`   ✅ 新增 ${newUsers.length} 位用戶`);
    console.log(`   ✅ 總用戶數: ${existingUsers.length + newUsers.length} 位`);
    
    // Combine all users for ticket assignment
    const allUsers = [
      ...existingUsers.map(u => ({ userId: u.user_id, name: u.name, ticketCount: 0, kycLevel: 1 })),
      ...newUsers
    ];
    
    // Step 3: Create venues
    console.log('\n🏟️  Step 3: 建立場館...');
    const venueMap = new Map<string, number>();
    const uniqueVenues = [...new Set(realConcerts.map(c => c.venue_name))];
    
    for (const venueName of uniqueVenues) {
      const concert = realConcerts.find(c => c.venue_name === venueName)!;
      const venueResult = await client.query(
        `INSERT INTO venue (name, city, address)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING
         RETURNING venue_id`,
        [concert.venue_name, concert.venue_city, concert.venue_address]
      );
      
      if (venueResult.rows.length > 0) {
        venueMap.set(venueName, venueResult.rows[0].venue_id);
      } else {
        const existingVenue = await client.query(
          'SELECT venue_id FROM venue WHERE name = $1',
          [venueName]
        );
        if (existingVenue.rows.length > 0) {
          venueMap.set(venueName, existingVenue.rows[0].venue_id);
        }
      }
    }
    console.log(`   ✅ 場館數: ${venueMap.size} 個`);
    
    // Step 4: Create events and seat zones
    console.log('\n🎵 Step 4: 建立活動與座位區域...');
    const eventData: any[] = [];
    
    for (const concert of realConcerts) {
      const venueId = venueMap.get(concert.venue_name);
      if (!venueId) continue;
      
      // Create event
      const eventResult = await client.query(
        `INSERT INTO event (venue_id, artist, title, event_date, start_time, end_time, status, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, 'Scheduled', $7)
         RETURNING event_id`,
        [
          venueId,
          concert.artist_zh,
          concert.concert_title,
          concert.date,
          concert.start_time || '19:00:00',
          concert.end_time || '22:00:00',
          'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80'
        ]
      );
      
      const eventId = eventResult.rows[0].event_id;
      const zones: any[] = [];
      
      // Create seat zones
      for (const zone of concert.seat_zones) {
        const zoneResult = await client.query(
          `INSERT INTO seat_zone (venue_id, name, row_count, col_count)
           VALUES ($1, $2, $3, $4)
           RETURNING zone_id`,
          [venueId, zone.zone_name, zone.rows, zone.cols]
        );
        
        zones.push({
          zoneId: zoneResult.rows[0].zone_id,
          name: zone.zone_name,
          price: zone.price,
          rows: zone.rows,
          cols: zone.cols
        });
      }
      
      eventData.push({
        eventId,
        artist: concert.artist_zh,
        title: concert.concert_title,
        zones,
        ticketPlatform: concert.ticket_platform
      });
    }
    
    console.log(`   ✅ 活動數: ${eventData.length} 場`);
    console.log(`   ✅ 座位區域總數: ${eventData.reduce((sum, e) => sum + e.zones.length, 0)} 個`);
    
    // Step 5: Generate 10,000 tickets
    console.log('\n🎫 Step 5: 生成 10,000 張票券...');
    
    // Calculate tickets per event based on popularity
    const popularEvents = ['五月天', '蔡依林', 'ZEROBASEONE', '羅志祥'];
    const ticketsPerEvent: Map<number, number> = new Map();
    let remainingTickets = 10000;
    
    // Assign more tickets to popular events
    for (const event of eventData) {
      const isPopular = popularEvents.some(artist => event.artist.includes(artist));
      let ticketCount: number;
      
      if (event.artist.includes('五月天')) {
        ticketCount = 450; // 6 shows × 450 = 2,700
      } else if (event.artist.includes('蔡依林')) {
        ticketCount = 500; // 3 shows × 500 = 1,500
      } else if (event.artist.includes('ZEROBASEONE')) {
        ticketCount = 800;
      } else if (event.artist.includes('羅志祥')) {
        ticketCount = 500; // 2 shows × 500 = 1,000
      } else if (event.artist.includes('OneRepublic') || event.artist.includes('Asia Artist')) {
        ticketCount = 600;
      } else {
        ticketCount = Math.floor(200 + Math.random() * 200); // 200-400
      }
      
      ticketsPerEvent.set(event.eventId, ticketCount);
      remainingTickets -= ticketCount;
    }
    
    console.log(`   分配票券數量完成，準備生成...`);
    
    const allTickets: any[] = [];
    let totalTicketsCreated = 0;
    
    for (const event of eventData) {
      const ticketCount = ticketsPerEvent.get(event.eventId) || 300;
      const zonesWithCapacity = event.zones.map((z: any) => ({
        ...z,
        capacity: z.rows * z.cols,
        ticketsGenerated: 0
      }));
      
      // Distribute tickets across zones proportionally
      for (let i = 0; i < ticketCount; i++) {
        // Choose zone based on capacity
        const totalCapacity = zonesWithCapacity.reduce((sum: number, z: any) => sum + z.capacity, 0);
        const rand = Math.random() * totalCapacity;
        let cumulative = 0;
        let selectedZone = zonesWithCapacity[0];
        
        for (const zone of zonesWithCapacity) {
          cumulative += zone.capacity;
          if (rand < cumulative) {
            selectedZone = zone;
            break;
          }
        }
        
        // Generate seat position
        const row = Math.floor(Math.random() * selectedZone.rows) + 1;
        const col = Math.floor(Math.random() * selectedZone.cols) + 1;
        const seatLabel = generateSeatLabel(selectedZone.name, row, col);
        
        // Assign to a user (weighted by their ticketCount allocation)
        let owner = allUsers[Math.floor(Math.random() * allUsers.length)];
        
        // Create ticket
        const serialNo = `TKT-${event.eventId}-${selectedZone.zoneId}-${Date.now()}-${i}`;
        
        const ticketResult = await client.query(
          `INSERT INTO ticket (event_id, zone_id, seat_label, face_value, original_vendor, serial_no, owner_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'Valid')
           RETURNING ticket_id`,
          [event.eventId, selectedZone.zoneId, seatLabel, selectedZone.price, event.ticketPlatform, serialNo, owner.userId]
        );
        
        allTickets.push({
          ticketId: ticketResult.rows[0].ticket_id,
          ownerId: owner.userId,
          faceValue: selectedZone.price,
          eventId: event.eventId
        });
        
        totalTicketsCreated++;
        
        if (totalTicketsCreated % 500 === 0) {
          console.log(`   進度: ${totalTicketsCreated}/10000 票券已建立...`);
        }
      }
    }
    
    console.log(`   ✅ 總票券數: ${totalTicketsCreated} 張`);
    
    // Step 6: Create listings (35% of tickets)
    console.log('\n📋 Step 6: 生成上架資訊...');
    const listingsToCreate = Math.floor(totalTicketsCreated * 0.35);
    const ticketsForListing = [...allTickets].sort(() => Math.random() - 0.5).slice(0, listingsToCreate);
    
    // Group tickets by owner for realistic listings
    const ticketsByOwner = new Map<number, any[]>();
    for (const ticket of ticketsForListing) {
      if (!ticketsByOwner.has(ticket.ownerId)) {
        ticketsByOwner.set(ticket.ownerId, []);
      }
      ticketsByOwner.get(ticket.ownerId)!.push(ticket);
    }
    
    let listingCount = 0;
    let pendingCount = 0;
    
    for (const [ownerId, tickets] of ticketsByOwner) {
      // Some users list multiple tickets together, some separately
      const batchSize = Math.random() < 0.7 ? 1 : Math.min(tickets.length, Math.floor(Math.random() * 3) + 2);
      
      for (let i = 0; i < tickets.length; i += batchSize) {
        const batch = tickets.slice(i, i + batchSize);
        
        // Determine if needs review (based on pricing)
        const avgPrice = batch.reduce((sum, t) => sum + t.faceValue, 0) / batch.length;
        const listingPrice = avgPrice * (0.7 + Math.random() * 0.5); // 70-120% of face value
        const needsReview = listingPrice > avgPrice * 1.2 || listingPrice < avgPrice * 0.5 || batch.length > 5;
        const status = needsReview ? 'Pending' : 'Active';
        
        if (needsReview) pendingCount++;
        
        // Create listing
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        const listingResult = await client.query(
          `INSERT INTO listing (seller_id, expires_at, status)
           VALUES ($1, $2, $3)
           RETURNING listing_id`,
          [ownerId, expiresAt, status]
        );
        
        const listingId = listingResult.rows[0].listing_id;
        
        // Create listing items
        for (const ticket of batch) {
          const price = ticket.faceValue * (0.7 + Math.random() * 0.3); // 70-100% of face value
          await client.query(
            `INSERT INTO listing_item (listing_id, ticket_id, price, status)
             VALUES ($1, $2, $3, $4)`,
            [listingId, ticket.ticketId, Math.floor(price), status]
          );
        }
        
        listingCount++;
        
        if (listingCount % 200 === 0) {
          console.log(`   進度: ${listingCount} 筆上架已建立...`);
        }
      }
    }
    
    console.log(`   ✅ 上架總數: ${listingCount} 筆`);
    console.log(`   ✅ 待審核: ${pendingCount} 筆`);
    console.log(`   ✅ 已上架: ${listingCount - pendingCount} 筆`);
    
    // Step 7: Create orders (some tickets are sold)
    console.log('\n🛒 Step 7: 生成訂單...');
    const activeListingsResult = await client.query(
      `SELECT l.listing_id, l.seller_id, li.ticket_id, li.price
       FROM listing l
       JOIN listing_item li ON l.listing_id = li.listing_id
       WHERE l.status = 'Active'
       ORDER BY RANDOM()
       LIMIT 700`
    );
    
    let orderCount = 0;
    const buyers = allUsers.filter(u => u.ticketCount < 50); // Realistic buyers
    
    for (const item of activeListingsResult.rows) {
      const buyer = buyers[Math.floor(Math.random() * buyers.length)];
      if (buyer.userId === item.seller_id) continue; // Can't buy own ticket
      
      // Create order
      const orderResult = await client.query(
        `INSERT INTO "order" (buyer_id, status)
         VALUES ($1, 'Completed')
         RETURNING order_id`,
        [buyer.userId]
      );
      
      const orderId = orderResult.rows[0].order_id;
      
      // Create order item
      await client.query(
        `INSERT INTO order_item (order_id, listing_id, ticket_id, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.listing_id, item.ticket_id, item.price]
      );
      
      // Create payment
      const paymentMethods = ['CreditCard', 'Bank', 'Wallet'];
      const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      await client.query(
        `INSERT INTO payment (order_id, method, amount, paid_at, status)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'Success')`,
        [orderId, method, item.price]
      );
      
      // Update listing status
      await client.query(
        `UPDATE listing SET status = 'Sold' WHERE listing_id = $1`,
        [item.listing_id]
      );
      
      await client.query(
        `UPDATE listing_item SET status = 'Sold' WHERE listing_id = $1 AND ticket_id = $2`,
        [item.listing_id, item.ticket_id]
      );
      
      // Create transfer
      await client.query(
        `INSERT INTO transfer (ticket_id, from_user_id, to_user_id, order_id, result)
         VALUES ($1, $2, $3, $4, 'Success')`,
        [item.ticket_id, item.seller_id, buyer.userId, orderId]
      );
      
      // Update ticket owner
      await client.query(
        `UPDATE ticket SET owner_id = $1, status = 'Transferred' WHERE ticket_id = $2`,
        [buyer.userId, item.ticket_id]
      );
      
      orderCount++;
      
      if (orderCount % 100 === 0) {
        console.log(`   進度: ${orderCount}/700 訂單已建立...`);
      }
    }
    
    console.log(`   ✅ 訂單總數: ${orderCount} 筆`);
    
    // Step 8: Create reviews (70% of orders)
    console.log('\n⭐ Step 8: 生成評價...');
    const ordersResult = await client.query(
      `SELECT o.order_id, o.buyer_id, l.seller_id
       FROM "order" o
       JOIN order_item oi ON o.order_id = oi.order_id
       JOIN listing l ON oi.listing_id = l.listing_id
       WHERE o.status IN ('Completed', 'Paid')
       ORDER BY RANDOM()
       LIMIT ${Math.floor(orderCount * 0.7)}`
    );
    
    let reviewCount = 0;
    for (const order of ordersResult.rows) {
      const score = Math.random() < 0.8 ? (4 + Math.floor(Math.random() * 2)) : Math.floor(Math.random() * 3) + 1;
      const comments = ['交易順利！', '賣家很好', '票券真實', '推薦', '很棒的體驗', '快速出貨', '值得信賴'];
      const comment = comments[Math.floor(Math.random() * comments.length)];
      
      await client.query(
        `INSERT INTO review (order_id, reviewer_id, reviewee_id, score, comment)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.order_id, order.buyer_id, order.seller_id, score, comment]
      );
      
      reviewCount++;
    }
    
    console.log(`   ✅ 評價總數: ${reviewCount} 筆`);
    
    // Step 9: Create some cases
    console.log('\n⚖️  Step 9: 生成申訴案件...');
    const caseOrders = ordersResult.rows.slice(0, 25);
    let caseCount = 0;
    
    for (const order of caseOrders) {
      const types = ['Fraud', 'Delivery', 'Refund', 'Other'];
      const type = types[Math.floor(Math.random() * types.length)];
      const descriptions = [
        '票券未收到',
        '座位與描述不符',
        '票券無法使用',
        '賣家未回應',
        '要求退款'
      ];
      
      await client.query(
        `INSERT INTO "case" (order_id, reporter_id, type, description, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.order_id, order.buyer_id, type, descriptions[Math.floor(Math.random() * descriptions.length)], 
         Math.random() < 0.5 ? 'Open' : 'Closed']
      );
      
      caseCount++;
    }
    
    console.log(`   ✅ 申訴案件: ${caseCount} 筆`);
    
    // Step 10: Blacklist some scalpers
    console.log('\n🚫 Step 10: 標記黑名單用戶...');
    const scalpers = newUsers.filter(u => u.ticketCount > 80).slice(0, 15);
    
    for (const scalper of scalpers) {
      await client.query(
        `INSERT INTO blacklist (user_id, reason)
         VALUES ($1, '疑似黃牛，大量囤票')
         ON CONFLICT DO NOTHING`,
        [scalper.userId]
      );
    }
    
    console.log(`   ✅ 黑名單用戶: ${scalpers.length} 位`);
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 資料生成完成！\n');
    console.log('📊 最終統計：');
    console.log(`   👥 總用戶數: ${allUsers.length} 位`);
    console.log(`   🎵 活動數: ${eventData.length} 場`);
    console.log(`   🎫 票券數: ${totalTicketsCreated} 張`);
    console.log(`   📋 上架數: ${listingCount} 筆（待審核: ${pendingCount}）`);
    console.log(`   🛒 訂單數: ${orderCount} 筆`);
    console.log(`   ⭐ 評價數: ${reviewCount} 筆`);
    console.log(`   ⚖️  申訴數: ${caseCount} 筆`);
    console.log(`   🚫 黑名單: ${scalpers.length} 位`);
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

generateLargeDataset();

