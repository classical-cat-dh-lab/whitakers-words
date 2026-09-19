import {readFile} from 'node:fs/promises';
import {loadDataset} from '../dist/data.js';
export async function readDataset() {
  const names = {dictionary:'legacy/DICTLINE.GEN',inflections:'legacy/INFLECTS.LAT',addons:'legacy/ADDONS.LAT',uniques:'legacy/UNIQUES.LAT',dictionaryForms:'dictionary-forms.tsv',englishIndex:'english-index.tsv'};
  const data = Object.fromEntries(await Promise.all(Object.entries(names).map(async ([key,name]) => [key, await readFile(new URL('../data/'+name,import.meta.url),'utf8')])));
  return loadDataset(data);
}
