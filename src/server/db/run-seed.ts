import { initDatabase } from './database.js';
import { seedSheetEvents } from './seedSheetEvents.js';

console.log('🔄 Inicializando banco de dados...');
initDatabase();

console.log('🚀 Populando todos os eventos e clientes das planilhas...');
const result = seedSheetEvents();

console.log(`✅ Sucesso!`);
console.log(`📊 Clientes processados: ${result.clientsCount}`);
console.log(`📅 Eventos cadastrados: ${result.eventsCount}`);
process.exit(0);
