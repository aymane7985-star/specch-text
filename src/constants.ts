import { DialectOption } from './types';

export const DIALECTS: DialectOption[] = [
  {
    id: 'standard',
    name: 'Modern Standard Arabic',
    arabicName: 'العربية الفصحى',
    region: 'الوطن العربي / رسمي',
    samplePrompt: 'نص باللغة العربية الفصحى السليمة مع علامات الترقيم',
  },
  {
    id: 'moroccan',
    name: 'Moroccan Darija',
    arabicName: 'الدارجة المغربية',
    region: 'المغرب العربي',
    samplePrompt: 'كلام بالدارجة المغربية مكتوب بالحروف العربية',
  },
  {
    id: 'egyptian',
    name: 'Egyptian Arabic',
    arabicName: 'اللهجة المصرية',
    region: 'مصر والسودان',
    samplePrompt: 'كلام بالمصري العامي بالحروف العربية',
  },
  {
    id: 'levantine',
    name: 'Levantine Arabic',
    arabicName: 'اللهجة الشامية',
    region: 'سوريا، لبنان، الأردن، فلسطين',
    samplePrompt: 'كلام بالشامي المحكي بالحروف العربية',
  },
  {
    id: 'gulf',
    name: 'Gulf Arabic',
    arabicName: 'اللهجة الخليجية',
    region: 'دول مجلس التعاون الخليجي',
    samplePrompt: 'كلام خليجي محكي بالحروف العربية',
  },
];

export const SAMPLE_AUDIO_TEXTS = [
  {
    title: 'تحية فصحى',
    dialect: 'standard' as const,
    text: 'السلام عليكم ورحمة الله وبركاته، أهلاً بكم في خدمة تحويل الصوت إلى نص بالذكاء الاصطناعي.',
    desc: 'نموذج فصيح وواضح',
  },
  {
    title: 'دارجة مغربية',
    dialect: 'moroccan' as const,
    text: 'صباح الخير كيدايرين لاباس عليكم؟ كنتمنى تكونو بصحة جيدة وكلشي غادي مزيان.',
    desc: 'لهجة مغربية دارجة',
  },
  {
    title: 'لهجة مصرية',
    dialect: 'egyptian' as const,
    text: 'أهلاً وسهلاً بيك، عامل إيه النهاردة؟ إن شاء الله يكون يومك جميل وموفق.',
    desc: 'لهجة مصرية عامية',
  },
  {
    title: 'لهجة شامية',
    dialect: 'levantine' as const,
    text: 'مرحبا كيفك شو أخبارك؟ إن شاء الله تمام، بتمنالك نهار سعيد وكلو خير.',
    desc: 'لهجة شامية معبرة',
  },
];
