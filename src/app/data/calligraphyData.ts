export interface CalligraphyWork {
  id: string;
  title: string;
  style: string;
  artist: string;
  year: string;
  description: string;
  imageUrl: string;
  dimension: string;
}

export const calligraphyStyles = [
  {
    id: 'zhuanshu',
    name: '篆书',
    nameEn: 'Seal Script',
    description: '最古老的书体之一，笔画圆润，结构对称，古朴典雅',
    imageUrl: 'https://images.unsplash.com/photo-1763225271111-dd9363584249?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBzZWFsJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 'xingkai',
    name: '行楷',
    nameEn: 'Running-Regular Script',
    description: '行书与楷书的结合，流畅而又不失规范，实用性强',
    imageUrl: 'https://images.unsplash.com/photo-1675972820598-8ba0b51c9da8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBydW5uaW5nJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 'caoshu',
    name: '草书',
    nameEn: 'Cursive Script',
    description: '笔势连绵，气势磅礴，是书法艺术的最高境界',
    imageUrl: 'https://images.unsplash.com/photo-1666511270907-d52bc746f252?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBjdXJzaXZlJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 'lishu',
    name: '隶书',
    nameEn: 'Clerical Script',
    description: '汉代盛行的书体，横平竖直，庄重大方',
    imageUrl: 'https://images.unsplash.com/photo-1675972820598-8ba0b51c9da8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBydW5uaW5nJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 'weibei',
    name: '魏碑',
    nameEn: 'Wei Stele',
    description: '北魏时期的碑刻书体，刚劲有力，独具特色',
    imageUrl: 'https://images.unsplash.com/photo-1763225271111-dd9363584249?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBzZWFsJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
];

export const calligraphyWorks: CalligraphyWork[] = [
  // 篆书作品
  {
    id: '1',
    title: '石鼓文',
    style: 'zhuanshu',
    artist: '先秦佚名',
    year: '公元前 8-7 世纪',
    description: '石鼓文是中国最早的石刻文字之一，被誉为"石刻之祖"。其字体浑厚古朴，结构严谨，充满了原始的艺术美感。',
    imageUrl: 'https://images.unsplash.com/photo-1763225271111-dd9363584249?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBzZWFsJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dimension: '纵 180cm × 横 45cm',
  },
  {
    id: '2',
    title: '峄山刻石',
    style: 'zhuanshu',
    artist: '李斯',
    year: '公元前 219 年',
    description: '秦始皇东巡时所刻，由李斯书写。字体工整规范，代表了小篆的最高水平，对后世影响深远。',
    imageUrl: 'https://images.unsplash.com/photo-1763225271111-dd9363584249?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBzZWFsJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dimension: '纵 150cm × 横 40cm',
  },
  {
    id: '3',
    title: '说文叙',
    style: 'zhuanshu',
    artist: '许慎',
    year: '东汉永元十二年（公元 100 年）',
    description: '《说文解字》序言的篆书版本，体现了东汉时期篆书的典雅风范。',
    imageUrl: 'https://images.unsplash.com/photo-1763225271111-dd9363584249?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBzZWFsJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dimension: '纵 120cm × 横 35cm',
  },
  // 行楷作品
  {
    id: '4',
    title: '兰亭集序',
    style: 'xingkai',
    artist: '王羲之',
    year: '东晋永和九年（公元 353 年）',
    description: '被誉为"天下第一行书"，书法自然流畅，遒媚劲健，是行书的巅峰之作。',
    imageUrl: 'https://images.unsplash.com/photo-1675972820598-8ba0b51c9da8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBydW5uaW5nJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dimension: '纵 24.5cm × 横 69.9cm',
  },
  {
    id: '5',
    title: '祭侄文稿',
    style: 'xingkai',
    artist: '颜真卿',
    year: '唐乾元元年（公元 758 年）',
    description: '被誉为"天下第二行书"，情感真挚，笔力雄浑，是行书的杰作。',
    imageUrl: 'https://images.unsplash.com/photo-1675972820598-8ba0b51c9da8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBydW5uaW5nJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dimension: '纵 28.2cm × 横 75.5cm',
  },
  {
    id: '6',
    title: '黄州寒食诗帖',
    style: 'xingkai',
    artist: '苏轼',
    year: '北宋元丰五年（公元 1082 年）',
    description: '被誉为"天下第三行书"，笔势奔放，跌宕起伏，情感充沛。',
    imageUrl: 'https://images.unsplash.com/photo-1675972820598-8ba0b51c9da8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBydW5uaW5nJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dimension: '纵 34.2cm × 横 199.5cm',
  },
  // 草书作品
  {
    id: '7',
    title: '自叙帖',
    style: 'caoshu',
    artist: '怀素',
    year: '唐大历十二年（公元 777 年）',
    description: '狂草的代表作，笔势连绵不断，如惊蛇走虺，具有极强的视觉冲击力。',
    imageUrl: 'https://images.unsplash.com/photo-1666511270907-d52bc746f252?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBjdXJzaXZlJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dimension: '纵 28.3cm × 横 775cm',
  },
  {
    id: '8',
    title: '古诗四帖',
    style: 'caoshu',
    artist: '张旭',
    year: '唐开元年间（公元 713-741 年）',
    description: '张旭狂草的代表作，笔法奇诡，变化莫测，被誉为"草圣"。',
    imageUrl: 'https://images.unsplash.com/photo-1666511270907-d52bc746f252?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBjdXJzaXZlJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dimension: '纵 28.8cm × 横 192.3cm',
  },
  {
    id: '9',
    title: '书谱',
    style: 'caoshu',
    artist: '孙过庭',
    year: '唐垂拱三年（公元 687 年）',
    description: '草书理论与实践的完美结合，既是书法论著，又是草书范本。',
    imageUrl: 'https://images.unsplash.com/photo-1666511270907-d52bc746f252?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBjdXJzaXZlJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dimension: '纵 26.5cm × 横 900cm',
  },
  // 隶书作品
  {
    id: '10',
    title: '礼器碑',
    style: 'lishu',
    artist: '东汉佚名',
    year: '东汉永寿二年（公元 156 年）',
    description: '东汉隶书的代表作，结构严谨，笔画遒劲，是学习隶书的经典范本。',
    imageUrl: 'https://images.unsplash.com/photo-1675972820598-8ba0b51c9da8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBydW5uaW5nJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dimension: '纵 173cm × 横 85cm',
  },
  {
    id: '11',
    title: '曹全碑',
    style: 'lishu',
    artist: '东汉佚名',
    year: '东汉中平二年（公元 185 年）',
    description: '隶书中的秀丽之作，笔画圆润流畅，结体舒展大方。',
    imageUrl: 'https://images.unsplash.com/photo-1675972820598-8ba0b51c9da8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBydW5uaW5nJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dimension: '纵 173cm × 横 86cm',
  },
  // 魏碑作品
  {
    id: '12',
    title: '张猛龙碑',
    style: 'weibei',
    artist: '北魏佚名',
    year: '北魏正光三年（公元 522 年）',
    description: '魏碑的代表作，笔力雄强，骨力洞达，充满阳刚之气。',
    imageUrl: 'https://images.unsplash.com/photo-1763225271111-dd9363584249?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBzZWFsJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dimension: '纵 280cm × 横 110cm',
  },
  {
    id: '13',
    title: '龙门二十品',
    style: 'weibei',
    artist: '北魏诸家',
    year: '北魏（公元 493-534 年）',
    description: '龙门石窟造像题记的精品，风格多样，是研究魏碑的重要资料。',
    imageUrl: 'https://images.unsplash.com/photo-1763225271111-dd9363584249?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwY2FsbGlncmFwaHklMjBzZWFsJTIwc2NyaXB0fGVufDF8fHx8MTc3NjY2OTI0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    dimension: '各异',
  },
];
