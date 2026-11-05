import { pdf } from 'pdf-to-img';
import { writeFile } from 'node:fs/promises';

const doc = await pdf('C:/Users/HP/Downloads/all_slides_from_video (2).pdf', { scale: 2 });
let i = 1;
for await (const img of doc) {
    await writeFile(`page-${String(i).padStart(2, '0')}.png`, img);
    console.log('page', i, img.length, 'bytes');
    i++;
}
console.log('total pages:', i - 1);
