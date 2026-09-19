import {readDataset} from './data.mjs';
import {analyzerFromDataset} from '../dist/index.js';
export * from '../dist/index.js';
export async function createNodeAnalyzer(){return analyzerFromDataset(await readDataset());}
