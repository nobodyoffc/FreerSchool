// Copy an episode's build (timeline + line audio) and its recordings into public/episodes/<id>/,
// where the composition reads them, and list the recordings in manifest.json.
//
//   npm run sync -- ../episodes/U1/U1-02-你的第一个身份
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const episode = path.resolve(process.argv[2] ?? '');
const timelinePath = path.join(episode, 'build', 'timeline.json');
if (!fs.existsSync(timelinePath)) {
  console.error(`No build/timeline.json in ${episode}; run voice/narrate.py first.`);
  process.exit(1);
}
const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
const out = path.resolve('public', 'episodes', timeline.id);
fs.rmSync(out, {recursive: true, force: true});
fs.mkdirSync(out, {recursive: true});
fs.cpSync(path.join(episode, 'build', 'lines'), path.join(out, 'lines'), {recursive: true});
fs.copyFileSync(timelinePath, path.join(out, 'timeline.json'));

// Recordings live in recordings/<id>/<scene>.mp4, e.g. recordings/U1-02/S3.mp4.
const recordings = {};
const recDir = path.resolve('..', 'recordings', timeline.id);
if (fs.existsSync(recDir)) {
  fs.mkdirSync(path.join(out, 'recordings'));
  for (const file of fs.readdirSync(recDir).filter((f) => /\.(mp4|mov|webm)$/i.test(f))) {
    fs.copyFileSync(path.join(recDir, file), path.join(out, 'recordings', file));
    const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(recDir, file)]).toString());
    recordings[path.parse(file).name] = {file: `recordings/${file}`, duration};
  }
  // Photos shown in animations or cards, e.g. recordings/U2-01/d20.jpg → images/d20.jpg.
  const images = fs.readdirSync(recDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  if (images.length) {
    fs.mkdirSync(path.join(out, 'images'));
    for (const file of images) fs.copyFileSync(path.join(recDir, file), path.join(out, 'images', file));
  }
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({recordings}, null, 2));
console.log(`${timeline.id}: ${timeline.scenes.length} scenes, ${Object.keys(recordings).length} recordings → ${out}`);
