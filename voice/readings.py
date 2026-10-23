"""Before synthesis: list what the voice may read wrong, for the ear to check.

The ASR check (check.py) hears words, not tones: a polyphone in the wrong reading (转 zhuàn
for zhuǎn, 重 zhòng for chóng) comes back as the same character. This lists, line by line,
every common polyphone and every Latin word or number, with the reading pypinyin guesses
in context (only a hint: it reads 清空重来 as zhòng). Words already fixed in qwen_voice.READINGS, or heard right (HEARD), are skipped.

    .venv/bin/python readings.py ../episodes/<线>/<集目录>
"""
import re
import sys
from pathlib import Path

from pypinyin import Style, pinyin

import narrate
import qwen_voice

# Characters with two readings both in everyday use (pypinyin also lists rare ones, e.g. 的 dì).
POLYPHONES = set(
    '长重行为中转传调弹教种还只得应数当相便量空处假卡切难露结降差参朝背冲角觉系干'
    '似乐率尽散省盛涨藏落扎折恶宿薄埋模屏劲圈鲜冠吐晕划累载曾供校塞乘')
# Words heard right in this voice; add one once it has been checked by ear.
HEARD = {
    '身份', '为什么', '因为', '成为', '作为', '认为', '以为', '中间', '其中', '中文', '一种', '种子',
    '应用', '应该', '数据', '数字', '当前', '当然', '只有', '只能', '只要', '还是', '还有', '还没',
    '不少', '至少', '多少', '相同', '相乘', '方便', '空格', '难以', '结果',
    '空间', '转来', '转账', '获得', '记得', '觉得', '使得', '得到', '关系', '联系', '系统', 
    '当你', '当别人', '每当', '处理', '到处', '好处', '数量', '重要', '重新', '重复', '严重',
    '传给', '传递', '传输', '上传', '参数', '差别', '不得', '只是', '不只', '还要', '还能', '还会',
    # Latin words read as wanted (letters or a word).
    'FID', 'CID', 'FCH', 'Freecash ID', 'Crypto Identity', 'JSON', 'cd', 'F',
}
LATIN = re.compile(r'[A-Za-z0-9][A-Za-z0-9_.@-]*')
CJK = re.compile(r'[一-鿿]+')


def expected(text: str) -> dict[int, str]:
    """pypinyin's reading in context, by character index."""
    out = {}
    for m in CJK.finditer(text):
        for k, (r,) in enumerate(pinyin(m[0], style=Style.TONE)):
            out[m.start() + k] = r
    return out


def fixed(text: str) -> set[int]:
    """Character indices inside a word that READINGS or HEARD already covers."""
    out = set()
    for word in [*qwen_voice.READINGS, *HEARD]:
        for m in re.finditer(re.escape(word), text):
            out.update(range(m.start(), m.end()))
    return out


def main():
    episode = Path(sys.argv[1]).resolve()
    _, scenes = narrate.parse((episode / 'script.md').read_text(encoding='utf-8'))
    found = 0
    for scene in scenes:
        for li, (text, _) in enumerate(scene['lines']):
            skip, reads = fixed(text), expected(text)
            notes = []
            for i, ch in enumerate(text):
                if ch in POLYPHONES and i not in skip:
                    notes.append(f'{text[max(0, i - 2):i]}[{ch}]{text[i + 1:i + 3]} {reads.get(i, "?")}')
            for m in LATIN.finditer(text):
                if m.start() not in skip:
                    notes.append(m[0])
            if notes:
                found += 1
                print(f'{scene["id"]}-{li + 1:02}  {"；".join(notes)}\n        {text}')
    print(f'{found} 句有要听的读音（拼音是 pypinyin 的推测，仅供参考）' if found else '没有要听的读音')


if __name__ == '__main__':
    main()
