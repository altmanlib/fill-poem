// Stage configuration. Lines mark blanks with 【】; blanks are numbered in reading order.
// Layout and copy follow the 1022 design previews and the 1008 brief; the final poem set awaits client confirmation.

export interface PoemLine {
  /** Verse text; 【】 marks a blank. */
  text: string;
  /** Author and work, shown under the board. */
  source: string;
}

export interface StageDef {
  name: string;
  lines: readonly PoemLine[];
  /** Candidate characters shown to the player, including distractors. */
  candidates: readonly string[];
  /** Pass copy shown in the clear dialog and its button label. */
  clear: { text: string; button: string };
}

export const STAGES: readonly StageDef[] = [
  {
    name: '初入雅集',
    lines: [
      { text: '黑云压城城欲摧，甲光向日金鳞开。', source: '李贺《雁门太守行》' },
      { text: '长烟一空，皓月千里，浮【光】跃金，静影沉璧。', source: '范仲淹《岳阳楼记》' }
    ],
    candidates: ['辉', '光'],
    clear: { text: '诗启雅途，喜得国宝金章，成功助力国宝初觅金影！', button: '下一关' }
  },
  {
    name: '品句寻韵',
    lines: [
      { text: '佩缤纷其繁饰兮，芳菲菲其弥章。', source: '屈原《离骚》' },
      { text: '蓬莱文【章】建安骨，【中】间小谢又清发。', source: '李白《宣州谢朓楼饯别校书叔云》' },
      { text: '书中自有黄金屋，书中自有颜如玉。', source: '赵恒《劝学诗》' }
    ],
    candidates: ['章', '散', '里', '中'],
    clear: { text: '诗意引路，喜得国宝金章，成功助力国宝渐觅金辉！', button: '下一关' }
  },
  {
    name: '观藏识珍',
    lines: [
      { text: '红豆生南国，春来发几枝。', source: '王维《相思》' },
      { text: '天生我材必有用，千【金】散尽还复来。', source: '李白《将进酒》' },
      { text: '唯有牡丹真【国】色，花开时节动京城。', source: '刘禹锡《赏牡丹》' },
      { text: '【春】风又绿江南岸，明月何时照我还。', source: '王安石《泊船瓜洲》' }
    ],
    candidates: ['国', '绝', '金', '克', '春', '冬'],
    clear: { text: '金章渐显，喜得国宝金章，距离国宝寻金就差最后一关了！', button: '下一关' }
  },
  {
    name: '金章将现',
    lines: [
      { text: '【金】樽清酒斗十【千】，玉盘【珍】羞直【万】钱。', source: '李白《行路难》' },
      { text: '金风玉露一相逢，便胜却人间无数。', source: '秦观《鹊桥仙·纤云弄巧》' },
      { text: '金戈铁马，气吞万里如虎。', source: '辛弃疾《永遇乐·京口北固亭怀古》' },
      { text: '但愿人长久，千里共婵娟。', source: '苏轼《水调歌头》' }
    ],
    candidates: ['清', '金', '佳', '珍', '百', '万', '公', '千'],
    clear: { text: '现已集齐四枚国宝金章，马上见证国宝寻得金币！', button: '前往见证' }
  }
];

export type Segment = { kind: 'text'; text: string } | { kind: 'blank'; index: number };

/** Split a line into text and blank segments; `start` is the index of its first blank in the whole stage. */
export function parseLine(line: string, start = 0): Segment[] {
  const out: Segment[] = [];
  let index = start;
  for (const part of line.split(/(【[^】]*】)/)) {
    if (!part) continue;
    out.push(part.startsWith('【') ? { kind: 'blank', index: index++ } : { kind: 'text', text: part });
  }
  return out;
}

/** Correct answers in blank order. */
export function answersOf(def: StageDef): string[] {
  return def.lines.flatMap((line) => Array.from(line.text.matchAll(/【([^】]*)】/g), (m) => m[1] as string));
}
